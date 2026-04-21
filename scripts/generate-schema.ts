import * as fs from 'node:fs';
import * as path from 'node:path';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as dns from 'node:dns';
import { buildTenants } from '../src/config/tenants.js';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

type EnvSource = Record<string, string | undefined>;

async function generateSchema() {
  const targetTenant = process.argv.slice(2).find(a => a.startsWith('--tenant='))?.split('=')[1] || 'oeiras';
  
  const tenants = buildTenants(process.env as EnvSource);
  const config = tenants[targetTenant];
  
  if (!config) {
    console.error(`❌ Tenant '${targetTenant}' não configurado no .env`);
    process.exit(1);
  }

  const envCode = targetTenant.toUpperCase().replaceAll('-', '_');
  const dbPassword = process.env[`DB_PASSWORD_${envCode}`];
  const dbRegion = process.env[`DB_REGION_${envCode}`] || 'sa-east-1';
  const explicitHost = process.env[`DB_HOST_${envCode}`];

  if (!dbPassword) {
    console.error(`❌ Senha (DB_PASSWORD_${envCode}) não encontrada.`);
    process.exit(1);
  }

  const refMatch = /https:\/\/(.+)\.supabase\.co/.exec(config.supabaseUrl);
  const projectRef = refMatch ? refMatch[1] : 'unknown';
  const poolerPrefix = dbRegion.startsWith('us-west') ? 'aws-1' : 'aws-0';
  const host = explicitHost || `${poolerPrefix}-${dbRegion}.pooler.supabase.com`;
  const dbUrl = `postgres://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@${host}:5432/postgres`;

  const client = new Client({ connectionString: dbUrl, connectionTimeoutMillis: 10000 });
  let out = `-- SIGESS Canonical Schema (Idempotent)\n-- Generated from tenant: ${targetTenant}\n-- Date: ${new Date().toISOString()}\n\n`;

  try {
    await client.connect();
    console.log(`Conectado ao tenant de referência: ${targetTenant}`);

    // 1. Extensions
    out += `\n-- 1. EXTENSIONS\n`;
    const { rows: exts } = await client.query(`SELECT extname FROM pg_extension WHERE extname NOT IN ('plpgsql', 'pg_stat_statements', 'pg_graphql', 'pgsodium')`);
    for (const row of exts) {
      out += `CREATE EXTENSION IF NOT EXISTS "${row.extname}";\n`;
    }

    // 2. Types/Enums (Simplified)
    out += `\n-- 2. TYPES / ENUMS\n`;
    const { rows: types } = await client.query(`
      SELECT t.typname, string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) as labels
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      GROUP BY t.typname;
    `);
    for (const t of types) {
      out += `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${t.typname}') THEN CREATE TYPE ${t.typname} AS ENUM (${t.labels.split(',').map((l: string) => `'${l}'`).join(', ')}); END IF; END $$;\n`;
    }

    // 3. Functions
    out += `\n-- 3. FUNCTIONS\n`;
    const { rows: funcs } = await client.query(`
      SELECT pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
    `);
    for (const f of funcs) {
      out += f.def.replace(/CREATE OR REPLACE FUNCTION/g, 'CREATE OR REPLACE FUNCTION') + ';\n\n';
    }

    // 4. Tables and Columns
    out += `\n-- 4. TABLES AND COLUMNS\n`;
    const { rows: tables } = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`);
    for (const t of tables) {
      out += `CREATE TABLE IF NOT EXISTS public.${t.table_name} ();\n`;
      
      const { rows: cols } = await client.query(`SELECT column_name, data_type, character_maximum_length, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`, [t.table_name]);
      for (const c of cols) {
        let type = c.data_type;
        if (type === 'USER-DEFINED') {
           // Hack for Enums, we'll need to fetch the actual type, skipping for simplicity in this baseline unless requested
           const { rows: enumType } = await client.query(`SELECT udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`, [t.table_name, c.column_name]);
           type = enumType[0].udt_name;
        }
        if (c.character_maximum_length) type += `(${c.character_maximum_length})`;
        
        let defaultStr = c.column_default ? ` DEFAULT ${c.column_default}` : '';
        out += `ALTER TABLE public.${t.table_name} ADD COLUMN IF NOT EXISTS ${c.column_name} ${type}${defaultStr};\n`;
      }
      out += '\n';
    }

    // 5. Indexes
    out += `\n-- 5. INDEXES\n`;
    const { rows: indexes } = await client.query(`SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey' AND indexname NOT LIKE '%_key'`);
    for (const idx of indexes) {
      out += idx.indexdef.replace('CREATE INDEX', 'CREATE INDEX IF NOT EXISTS') + ';\n';
    }

    // 6. RLS Policies
    // Note: To make policies idempotent, we drop them if they exist and recreate
    out += `\n-- 6. RLS POLICIES\n`;
    for (const t of tables) {
        out += `ALTER TABLE public.${t.table_name} ENABLE ROW LEVEL SECURITY;\n`;
    }

    const { rows: policies } = await client.query(`SELECT tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public'`);
    for (const p of policies) {
        out += `DROP POLICY IF EXISTS "${p.policyname}" ON public.${p.tablename};\n`;
        let using = p.qual ? ` USING (${p.qual})` : '';
        let withCheck = p.with_check ? ` WITH CHECK (${p.with_check})` : '';
        out += `CREATE POLICY "${p.policyname}" ON public.${p.tablename} FOR ${p.cmd} TO ${p.roles[0].replace(/{|}/g, '')}${using}${withCheck};\n`;
    }

    const outPath = path.resolve(process.cwd(), 'supabase', 'schema.canonical.sql');
    fs.writeFileSync(outPath, out);
    console.log(`✅ Schema canônico gerado com sucesso em: ${outPath}`);

  } catch (err) {
    console.error(`🛑 Erro ao extrair schema:`, (err as Error).message);
  } finally {
    await client.end();
  }
}

generateSchema().catch(console.error);
