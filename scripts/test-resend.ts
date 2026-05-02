import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL_SINPESCA_OEIRAS!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_SINPESCA_OEIRAS!
);

async function test() {
  console.log("Reenviando invite para josecarlosvb2003@gmail.com");
  const { data, error } = await supabase.auth.admin.inviteUserByEmail('josecarlosvb2003@gmail.com', {
    redirectTo: 'https://app.sigess.com.br/password'
  });
  
  if (error) {
    console.error("Erro:", error);
  } else {
    console.log("Sucesso:", data);
  }
}

test();
