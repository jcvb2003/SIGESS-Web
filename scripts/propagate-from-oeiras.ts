import { propagateFromOeiras } from '../src/shared/propagate';
import * as dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis de ambiente do .env da raiz se não estiverem no processo
dotenv.config({ path: path.join(process.cwd(), '.env') });

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const target = args.find(a => a.startsWith('--tenant='))?.split('=')[1];

(async () => {
  try {
    await propagateFromOeiras({
      dryRun,
      targetTenant: target,
      oeiras: {
        id: 'oeiras',
        url: process.env.OEIRAS_URL!,
        serviceKey: process.env.OEIRAS_KEY!,
      },
      tenants: [
        {
          id: 'z2',
          url: process.env.VITE_SUPABASE_URL_Z2!,
          serviceKey: process.env.SUPABASE_SERVICE_KEY_Z2!,
        },
        {
          id: 'breves',
          url: process.env.VITE_SUPABASE_URL_BREVES!,
          serviceKey: process.env.SUPABASE_SERVICE_KEY_BREVES!,
        },
        {
          id: 'sinpesca-elaine',
          url: process.env.VITE_SUPABASE_URL_ELAINE!,
          serviceKey: process.env.SUPABASE_SERVICE_KEY_ELAINE!,
        },
      ],
    });
  } catch (error) {
    console.error('💥 Erro fatal na propagação:', error);
    process.exit(1);
  }
})();
