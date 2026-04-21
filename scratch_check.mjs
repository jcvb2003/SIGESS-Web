import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

async function checkDatabase() {
  const url = process.env.VITE_SUPABASE_URL_Z2;
  const key = process.env.VITE_SUPABASE_ANON_KEY_Z2;
  const dbPass = process.env.DB_PASSWORD_Z2;
  const dbHost = process.env.DB_HOST_Z2;
  // postgres url: postgres://postgres.jatnbqspfvhvlzaoekzz:Sinpesca123%40@aws-1-us-east-1.pooler.supabase.com:6543/postgres

  console.log("Verificando Z2 usando pg...");
  const pool = new pg.Pool({
    connectionString: `postgres://postgres.jatnbqspfvhvlzaoekzz:${encodeURIComponent(dbPass)}@${dbHost}:6543/postgres`
  });

  try {
    const client = await pool.connect();
    
    console.log("\\n--- 1. Verificando RLS em logs_eventos_requerimento ---");
    const rlsRes = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname IN ('_migrations', 'logs_eventos_requerimento', 'financeiro_lancamentos');
    `);
    console.table(rlsRes.rows);

    console.log("\\n--- 2. Verificando volumetria financeira ---");
    const countRes = await client.query(`SELECT count(*) FROM public.financeiro_lancamentos;`);
    console.log(`Z2 financeiro_lancamentos count: ${countRes.rows[0].count}`);
    
    console.log("\\n--- 3. Verificando RLS com auth.uid() ---");
    const polRes = await client.query(`
      SELECT polname, polqual::text 
      FROM pg_policy 
      WHERE polqual::text LIKE '%auth.uid()%' 
        AND polqual::text NOT LIKE '%(select auth.uid())%'
      LIMIT 3;
    `);
    console.table(polRes.rows);

    client.release();
  } catch (err) {
    console.error("Erro na conexao:", err.message);
  } finally {
    pool.end();
  }
}

checkDatabase();
