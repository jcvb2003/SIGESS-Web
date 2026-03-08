const fs = require('fs');
const path = require('path');

// Uso: npx ts-node scripts/setup-client.ts --project-id=XXXXX --project-ref=YYYYY --admin-email=teste@teste.com --db-password=ZZZZZ

async function setupClient() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const val = args.find((a) => a.startsWith(`--${name}=`));
    return val ? val.split('=')[1] : null;
  };

  const projectId = getArg('project-id');
  const projectRef = getArg('project-ref');
  const adminEmail = getArg('admin-email');
  const dbPassword = getArg('db-password'); // Necessário para a ingestão direta de SQL se for usar cliente Postgres
  
  if (!projectId || !projectRef || !adminEmail) {
    console.error('❌ Parâmetros obrigatórios faltando: --project-id, --project-ref, --admin-email');
    process.exit(1);
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const SUPABASE_MANAGEMENT_TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN;

  if (!RESEND_API_KEY || !SUPABASE_MANAGEMENT_TOKEN) {
    console.error('❌ Variáveis de ambiente RESEND_API_KEY e SUPABASE_MANAGEMENT_TOKEN são obrigatórias no .env');
    process.exit(1);
  }

  console.log(`\n🚀 Iniciando configuração do Sindicato via Supabase API (Ref: ${projectRef})...`);

  try {
    // 1. Configura SMTP (Resend)
    console.log('📧 1. Configurando SMTP Resend na nuvem...');
    const authRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_MANAGEMENT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        smtp_admin_email: 'noreply@sigess.com.br',
        smtp_host: 'smtp.resend.com',
        smtp_port: 465,
        smtp_user: 'resend',
        smtp_pass: RESEND_API_KEY,
        smtp_sender_name: 'SIGESS',
        smtp_enabled: true,
      }),
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      throw new Error(`Falha SMTP: ${authRes.status} - ${errText}`);
    }
    console.log('✅ SMTP Resend ativado com sucesso.');

    // 2. Roda o Schema SQL
    console.log('⚙️  2. Injetando Schema SQL (sigess_schema.sql)...');
    const sqlPath = path.resolve(process.cwd(), 'sigess_schema.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Arquivo sigess_schema.sql não encontrado na raiz: ${sqlPath}`);
    }
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Nota: A injecao de extenso schema com o @supabase/supabase-js usando a REST API não
    // costuma funcionar se não tiver uma Edge/RPC de eval_sql instalada.
    // O mais seguro para automação local pelo Admin é usar Pg connection:
    if(!dbPassword) {
        console.warn('⚠️  Não fornecido --db-password. Para rodar um grande SQL bruto (Migrations, RLS, Triggers), a melhor forma é via Postgres Driver "pg" da sua máquina. O Driver @supabase/supabase-js não tem método para Multi-Statement SQL livre na Public API.');
        console.warn('\nSUGESTÃO DE EXECUÇÃO:');
        console.warn('-> Adicione o parâmetro --db-password=SenhaBanco e instale o pacote `pg` se quiser que o script execute via Client Postgres.\n');
    } else {
        // Se decidirmos embutir injeção SQL no Node diretamente:
        const { Client } = require('pg');
        const dbUrl = `postgres://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`;
        const client = new Client({ connectionString: dbUrl });
        await client.connect();
        await client.query(sqlContent);
        console.log('✅ Schema injetado no Postgres via Driver Nativo PG.');
        
        // 3. Atualizar ROLE Admin (se quisermos ja setar de pronto)
        // O Usuario do presidente precisa ja estar criado no auth.users antes,
        // Ou rodariamos supabase.auth.admin.createUser primeiro.
        await client.end();
    }

    console.log(`\n🎉 PROJETO ${projectId} - ${projectRef} finalizado e pré-pronto!\n`);

  } catch (error) {
    console.error('\n❌ ERRO FATAL no Onboarding:', error.message);
    process.exit(1);
  }
}

setupClient();
