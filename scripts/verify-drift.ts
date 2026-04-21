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
    const baselineCode = 'sinpesca-oeiras';
    const baseline = tenantElements[baselineCode];
    
    if (!baseline) {
      console.error(`❌ Falta o tenant de referência (${baselineCode}) para comparar.`);
      return;
    }

    console.log(`\n📊 Analisando diferenças em relação ao baseline: ${baselineCode}\n`);
    
    for (const [code, elements] of Object.entries(tenantElements)) {
      if (code === baselineCode) continue;

      console.log(`--- COMPARANDO: ${baselineCode} vs ${code} ---`);
      
      let diffCount = 0;
      for (const el of baseline) {
        if (!elements.has(el)) {
          console.log(`[MISSING in ${code}] ${el}`);
          diffCount++;
        }
      }
      
      for (const el of elements) {
        if (!baseline.has(el)) {
          console.log(`[EXTRA in ${code}] ${el}`);
          diffCount++;
        }
      }

      if (diffCount === 0) {
        console.log(`✅ [${code}] 100% Sincronizado com ${baselineCode}`);
      } else {
        console.log(`❌ [${code}] ${diffCount} diferenças encontradas.`);
      }
      console.log('--------------------------------------------\n');
    }
  } else {
    console.log('\n💡 Rode com --diff para ver as diferenças exatas entre os tenants.');
  }
}

verifyDrift().catch(console.error);
