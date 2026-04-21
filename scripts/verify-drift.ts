import * as fs from 'node:fs';
import * as path from 'node:path';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as dns from 'node:dns';
import { buildTenants } from '../src/config/tenants.js';

// Resolve problemas de conectividade em ambientes hibridos
dns.setDefaultResultOrder('ipv4first');

// Carrega o .env local
dotenv.config();

type EnvSource = Record<string, string | undefined>;

const FINGERPRINT_QUERY = `
WITH schema_data AS (
  -- 1. Colunas e Tabelas
  SELECT '1_table:' || table_name || '.' || column_name || ':' || data_type AS element
  FROM information_schema.columns 
  WHERE table_schema = 'public'
  
  UNION ALL
  
  -- 2. Funções / RPCs
  SELECT '2_func:' || routine_name || '(' || COALESCE(data_type, '') || ')'
  FROM information_schema.routines 
  WHERE routine_schema = 'public'
  
  UNION ALL
  
  -- 3. Índices
  SELECT '3_index:' || indexname
  FROM pg_indexes
  WHERE schemaname = 'public'
  
  UNION ALL
  
  -- 4. Extensões (sem extversion conforme recomendado pelo Claude)
  SELECT '4_ext:' || extname
  FROM pg_extension
)
SELECT element
FROM schema_data
ORDER BY element;
`;

async function verifyDrift() {
  const args = process.argv.slice(2);
  const isDiff = args.includes('--diff');
  
  const tenants = buildTenants(process.env as EnvSource);
  const tenantEntries = Object.entries(tenants);

  console.log(`\n🔍 SIGESS Schema Drift Verifier`);
  
  // Guardaremos um Set de elementos por tenant
  const tenantElements: Record<string, Set<string>> = {};

  for (const [code, config] of tenantEntries) {
    const envCode = code.toUpperCase().replaceAll('-', '_');
    const dbPassword = process.env[`DB_PASSWORD_${envCode}`];
    const dbRegion = process.env[`DB_REGION_${envCode}`] || 'sa-east-1';
    const explicitHost = process.env[`DB_HOST_${envCode}`];

    if (!dbPassword) continue;

    const refMatch = /https:\/\/(.+)\.supabase\.co/.exec(config.supabaseUrl);
    const projectRef = refMatch ? refMatch[1] : 'unknown';
    const poolerPrefix = dbRegion.startsWith('us-west') ? 'aws-1' : 'aws-0';
    const host = explicitHost || `${poolerPrefix}-${dbRegion}.pooler.supabase.com`;
    const dbUrl = `postgres://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@${host}:5432/postgres`;

    const client = new Client({ connectionString: dbUrl, connectionTimeoutMillis: 10000 });

    try {
      await client.connect();
      const { rows } = await client.query(FINGERPRINT_QUERY);
      
      tenantElements[code] = new Set(rows.map(r => r.element));
      console.log(`✅ [${code.padEnd(15)}] Schema extraído (${tenantElements[code].size} elementos)`);
    } catch (err) {
      console.error(`🛑 Erro no tenant ${code}:`, (err as Error).message);
    } finally {
      await client.end();
    }
  }

  if (isDiff) {
    console.log('\n📊 Analisando diferenças (Referência: oeiras vs breves)...\n');
    
    const oeiras = tenantElements['sinpesca-oeiras'];
    const breves = tenantElements['sinpesca-breves'];
    
    if (!oeiras || !breves) {
      console.error('❌ Falta oeiras ou breves para comparar.');
      return;
    }
    
    let diffCount = 0;
    
    console.log('--- O QUE TEM NO OEIRAS MAS FALTA NO BREVES ---');
    for (const el of oeiras) {
      if (!breves.has(el)) {
        console.log(`+ Falta no Breves: ${el}`);
        diffCount++;
      }
    }
    
    console.log('\n--- O QUE TEM NO BREVES MAS FALTA NO OEIRAS ---');
    for (const el of breves) {
      if (!oeiras.has(el)) {
        console.log(`- Sobrando no Breves: ${el}`);
        diffCount++;
      }
    }
    
    if (diffCount === 0) {
      console.log('\n✅ Nenhuma diferença estrutural encontrada entre Oeiras e Breves!');
    } else {
      console.log(`\n❌ Total de diferenças: ${diffCount}`);
    }
  } else {
    console.log('\n💡 Rode com --diff para ver as diferenças exatas entre Oeiras e Breves.');
  }
}

verifyDrift().catch(console.error);
