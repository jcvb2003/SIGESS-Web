import { execSync } from 'node:child_process';
import * as dotenv from 'dotenv';
import { buildTenantsFromEnv } from './lib/build-tenants-from-env.js';

// Carrega o .env local
dotenv.config();

type EnvSource = Record<string, string | undefined>;

/**
 * Script para realizar o deploy de Supabase Edge Functions para todos os tenants
 */
async function deployFunctions() {
  const args = process.argv.slice(2);
  const functionName = args.find(a => !a.startsWith('--'));
  const targetTenant = args.find(a => a.startsWith('--tenant='))?.split('=')[1];

  if (!functionName) {
    console.error('❌ Erro: Informe o nome da Edge Function.');
    printUsage();
    process.exit(1);
  }

  // Constrói mapa de tenants
  const tenants = buildTenantsFromEnv(process.env as EnvSource);
  let tenantEntries = Object.entries(tenants);

  if (targetTenant) {
    tenantEntries = tenantEntries.filter(([code]) => code === targetTenant.toLowerCase());
    if (tenantEntries.length === 0) {
      console.error(`❌ Erro: Tenant '${targetTenant}' não configurado no .env`);
      process.exit(1);
    }
  }

  console.log(`\n🚀 Iniciando deploy da função '${functionName}' para ${tenantEntries.length} tenant(s)\n`);

  for (const [code, config] of tenantEntries) {
    const refMatch = /https:\/\/(.+)\.supabase\.co/.exec(config.supabaseUrl);
    const projectRef = refMatch ? refMatch[1] : 'unknown';

    if (projectRef === 'unknown') {
      console.warn(`   ⚠️  URL Supabase inválida para o tenant [${code}]. Pulando...`);
      continue;
    }

    console.log(`\n📦 [${code}] (ref: ${projectRef})`);
    
    try {
      // Usar a CLI do supabase local para fazer o deploy --no-verify-jwt
      const command = `npx supabase functions deploy ${functionName} --project-ref ${projectRef} --no-verify-jwt`;
      console.log(`   ⚙️ Executando: ${command}`);
      
      execSync(command, { stdio: 'inherit' });
      console.log(`   ✅ Deploy concluído com sucesso em [${code}]`);
    } catch (err) {
      console.error(`   🛑 Erro no deploy para o tenant ${code}.`);
      console.error(`   Detalhe: ${err instanceof Error ? err.message : String(err)}`);
      console.error(`   Isso pode ocorrer por falta de permissões na sua conta Supabase.`);
    }
  }

  console.log('\n🏁 Processo de deploy de funções finalizado.\n');
}

function printUsage() {
  console.log(`
Uso:
  npx tsx scripts/deploy-functions.ts <nome-da-funcao>                   # Deploy para todos os tenants
  npx tsx scripts/deploy-functions.ts <nome-da-funcao> --tenant=oeiras   # Filtra por cliente específico
  
Exemplo:
  npx tsx scripts/deploy-functions.ts manage-user
  `);
}

deployFunctions().catch(err => {
  console.error('💥 Erro fatal:', err.message);
  process.exit(1);
});
