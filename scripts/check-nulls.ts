import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { buildTenants } from '../src/config/tenants';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkNulls() {
  const env = process.env as Record<string, string>;
  const tenants = buildTenants(env);
  console.log('🔍 Iniciando Auditoria de Nulos em Audit Trail...\n');
  console.log(`📊 Total de polos encontrados: ${Object.keys(tenants).length}\n`);

  for (const [code, config] of Object.entries(tenants)) {
    console.log(`\n📡 [${config.label}] (${code}): Verificando...`);
    
    const envCode = code.toUpperCase().replaceAll('-', '_');
    const dbHost = env[`DB_HOST_${envCode}`];
    const dbPassword = env[`DB_PASSWORD_${envCode}`];

    if (!dbPassword || !dbHost) {
      console.error(`   ❌ ERRO: Credenciais (HOST/PASSWORD) não encontradas no .env`);
      continue;
    }

    const projectRef = config.supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1];
    const connectionString = `postgres://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@${dbHost}:5432/postgres`;
    const client = new Client({ connectionString });

    try {
      await client.connect();
      const res = await client.query(`
        SELECT 
          'financeiro_lancamentos' as tab, 
          COUNT(*) FILTER (WHERE status = 'cancelado' AND cancelado_por IS NULL) as nulos,
          COUNT(*) FILTER (WHERE status = 'cancelado') as total_cancelado
        FROM public.financeiro_lancamentos
        UNION ALL
        SELECT 
          'financeiro_dae', 
          COUNT(*) FILTER (WHERE status = 'cancelado' AND cancelado_por IS NULL),
          COUNT(*) FILTER (WHERE status = 'cancelado')
        FROM public.financeiro_dae;
      `);
      
      res.rows.forEach(row => {
        const total = Number.parseInt(row.total_cancelado || '0');
        const semResp = Number.parseInt(row.nulos || '0');
        console.log(`   ✅ ${row.tab}: ${semResp} de ${total} cancelamentos sem responsável.`);
      });
    } catch (err: any) {
      console.error(`   ❌ ERRO fatal:`, err.message);
    } finally {
      await client.end();
    }
  }
  console.log('\n🏁 Auditoria finalizada.');
}

checkNulls().catch(err => {
  console.error('❌ Erro inesperado na auditoria:', err);
  process.exit(1);
});
