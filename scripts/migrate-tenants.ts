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
 * Migration Runner Multi-Tenant Evolution
 * 
 * Agora suporta sincronização automática (--sync), filtros por tenant
 * e rastreio de migrações aplicadas.
 */
async function runMigrations() {
  const args = process.argv.slice(2);
  const migrationFile = args.find(a => a.startsWith('--file='))?.split('=')[1];
  const targetTenant = args.find(a => a.startsWith('--tenant='))?.split('=')[1];
  const isSync = args.includes('--sync');
  const isDryRun = args.includes('--dry-run');
  const isListApplied = args.includes('--list-applied');

  if (!migrationFile && !isSync && !isListApplied) {
    console.error('❌ Erro: Use --file=nome.sql, --sync ou --list-applied');
    printUsage();
    process.exit(1);
  }

  const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
  
  // Lista arquivos locais (.sql, ignora 'admin_')
  const localMigrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && !f.startsWith('admin_'))
    .sort();

  // Constrói mapa de tenants
  const tenants = buildTenants(process.env as EnvSource);
  let tenantEntries = Object.entries(tenants);

  // Filtra por tenant se solicitado
  if (targetTenant) {
    tenantEntries = tenantEntries.filter(([code]) => code === targetTenant.toLowerCase());
    if (tenantEntries.length === 0) {
      console.error(`❌ Erro: Tenant '${targetTenant}' não configurado no .env`);
      process.exit(1);
    }
  }

  console.log(`\n🐘 SIGESS Multi-Tenant Migration Runner`);
  if (isDryRun) console.log(`✨ MODE: DRY RUN (Nenhuma alteração será feita)`);
  console.log(`👥 Tenants alvo: ${tenantEntries.length}\n`);

  for (const [code, config] of tenantEntries) {
    const envCode = code.toUpperCase().replaceAll('-', '_');
    const dbPassword = process.env[`DB_PASSWORD_${envCode}`];
    const dbRegion = process.env[`DB_REGION_${envCode}`] || 'sa-east-1';
    const explicitHost = process.env[`DB_HOST_${envCode}`];

    if (!dbPassword) {
      console.warn(`   ⚠️  Senha (DB_PASSWORD_${envCode}) não encontrada. Pulando [${code}]...`);
      continue;
    }

    const refMatch = /https:\/\/(.+)\.supabase\.co/.exec(config.supabaseUrl);
    const projectRef = refMatch ? refMatch[1] : 'unknown';
    const poolerPrefix = dbRegion.startsWith('us-west') ? 'aws-1' : 'aws-0';
    const host = explicitHost || `${poolerPrefix}-${dbRegion}.pooler.supabase.com`;
    const dbUrl = `postgres://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@${host}:5432/postgres`;

    const client = new Client({ connectionString: dbUrl, connectionTimeoutMillis: 10000 });

    try {
      await client.connect();
      console.log(`\n📦 [${code}] (ref: ${projectRef})`);

      // 1. Garantir tabela de controle
      await client.query(`
        SET search_path TO public;
        CREATE TABLE IF NOT EXISTS public._migrations (
          filename TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ DEFAULT now()
        );
      `);

      // 2. Buscar aplicadas
      const { rows: applied } = await client.query('SELECT filename FROM public._migrations');
      const appliedSet = new Set(applied.map(r => r.filename));

      if (isListApplied) {
        console.log(`   📜 Migrações aplicadas:`);
        localMigrationFiles.forEach(f => {
          const status = appliedSet.has(f) ? '✅' : '⏳';
          console.log(`      ${status} ${f}`);
        });
        continue;
      }

      // 3. Determinar o que aplicar
      let filesToApply: string[] = [];
      if (isSync) {
        filesToApply = localMigrationFiles.filter(f => !appliedSet.has(f));
      } else if (migrationFile) {
        filesToApply = [migrationFile];
      }

      if (filesToApply.length === 0) {
        console.log(`   ✅ Banco de dados já está sincronizado.`);
        continue;
      }

      console.log(`   🚀 Aplicando ${filesToApply.length} pendente(s)...`);

      for (const file of filesToApply) {
        const sqlPath = path.join(migrationsDir, file);
        if (!fs.existsSync(sqlPath)) {
          console.error(`      ❌ Erro: Arquivo ${file} não encontrado.`);
          throw new Error('Migration missing');
        }

        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        if (isDryRun) {
          console.log(`      ✨ [DRY RUN] Aplicaria: ${file}`);
        } else {
          try {
            await client.query('BEGIN;');
            await client.query(sqlContent);
            await client.query('INSERT INTO public._migrations (filename) VALUES ($1)', [file]);
            await client.query('COMMIT;');
            console.log(`      ✅ Sucesso: ${file}`);
          } catch (err) {
            await client.query('ROLLBACK;');
            console.error(`      ❌ FALHA em ${file}:`, (err as Error).message);
            throw err; // Interrompe o tenant
          }
        }
      }
    } catch (err) {
      console.error(`   🛑 Erro no tenant ${code}:`, (err as Error).message);
    } finally {
      await client.end();
    }
  }

  console.log('\n🏁 Processo finalizado.\n');
}

function printUsage() {
  console.log(`
Uso:
  npx tsx scripts/migrate-tenants.ts --sync            # Sincroniza todos os tenants
  npx tsx scripts/migrate-tenants.ts --sync --dry-run  # Simula sincronização
  npx tsx scripts/migrate-tenants.ts --list-applied    # Mostra status de cada tenant
  npx tsx scripts/migrate-tenants.ts --tenant=oeiras   # Filtra por cliente
  npx tsx scripts/migrate-tenants.ts --file=nome.sql   # Aplica um arquivo específico
  `);
}

runMigrations().catch(err => {
  console.error('💥 Erro fatal:', err.message);
  process.exit(1);
});
