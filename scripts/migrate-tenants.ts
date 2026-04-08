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

/**
 * Migration Runner Multi-Tenant
 * 
 * Executa um arquivo SQL em todos os tenants configurados no .env
 * Usa o Proxy IPv4 do Supabase (Pooler em modo Session porta 5432)
 */
async function runMigrations() {
  const args = process.argv.slice(2);
  const migrationFile = args.find(a => a.startsWith('--file='))?.split('=')[1];
  const isDryRun = args.includes('--dry-run');

  if (!migrationFile) {
    console.error('❌ Erro: Especifique o arquivo de migration com --file=nome_do_arquivo.sql');
    process.exit(1);
  }

  const sqlPath = path.resolve(process.cwd(), 'supabase', 'migrations', migrationFile);
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Erro: Arquivo não encontrado em ${sqlPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  // Constrói mapa de tenants usando o injetor de process.env (agnóstico)
  const tenants = buildTenants(process.env as EnvSource);
  const tenantEntries = Object.entries(tenants);

  if (tenantEntries.length === 0) {
    console.warn('⚠️  Nenhum tenant configurado no .env (Verifique os prefixos VITE_SUPABASE_URL_*)');
    process.exit(0);
  }

  console.log(`\n🐘 SIGESS Multi-Tenant Migration Runner`);
  console.log(`📄 Arquivo: ${migrationFile}`);
  console.log(`👥 Tenants encontrados: ${tenantEntries.length}\n`);

  for (const [code, config] of tenantEntries) {
    const envCode = code.toUpperCase().replaceAll('-', '_');
    const dbPassword = process.env[`DB_PASSWORD_${envCode}`];
    const dbRegion = process.env[`DB_REGION_${envCode}`] || 'sa-east-1';
    const explicitHost = process.env[`DB_HOST_${envCode}`];

    console.log(`\n🔄 Processando [${code}]...`);
    
    if (!dbPassword) {
      console.error(`   ❌ Senha (DB_PASSWORD_${envCode}) não encontrada no .env. Pulando...`);
      continue;
    }

    // Extrai o project-ref da URL: https://ref.supabase.co
    const refRegex = /https:\/\/(.+)\.supabase\.co/;
    const refMatch = refRegex.exec(config.supabaseUrl);
    
    if (!refMatch) {
      console.error(`   ❌ Não foi possível extrair o project-ref da URL: ${config.supabaseUrl}`);
      continue;
    }
    const projectRef = refMatch[1];
    
    /**
     * CONEXÃO VIA PROXY IPv4 (POOLER EM MODO SESSION)
     * Region: DB_REGION_[CODE] (Default: sa-east-1)
     * Host: aws-[0|1]-[REGION].pooler.supabase.com
     * Porta: 5432
     * User: postgres.[PROJECT_REF]
     */
    const poolerPrefix = dbRegion.startsWith('us-west') ? 'aws-1' : 'aws-0';
    const host = explicitHost || `${poolerPrefix}-${dbRegion}.pooler.supabase.com`;
    
    const dbUrl = `postgres://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@${host}:5432/postgres`;

    if (isDryRun) {
      console.log(`   ✨ [DRY RUN] Conexão seria tentada para ${projectRef} via Proxy sa-east-1`);
      continue;
    }

    const client = new Client({ 
      connectionString: dbUrl,
      connectionTimeoutMillis: 10000,
      statement_timeout: 60000
    });

    try {
      await client.connect();
      console.log(`   🔌 Conectado ao banco via Proxy (ref: ${projectRef})...`);
      
      await client.query('BEGIN;');
      await client.query(sqlContent);
      await client.query('COMMIT;');
      
      console.log(`   ✅ Migration aplicada com sucesso!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await client.query('ROLLBACK;').catch(() => {});
      console.error(`   ❌ ERRO no tenant ${code}:`, errorMessage);
    } finally {
      await client.end();
    }
  }

  console.log('\n🏁 Processo finalizado.\n');
}

runMigrations().catch(err => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  console.error('💥 Erro fatal no runner:', errorMessage);
  process.exit(1);
});
