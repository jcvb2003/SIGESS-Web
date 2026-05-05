import { execSync } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

async function backupTenant(tenant: string) {
  const envPrefix = tenant.toUpperCase();
  const dbUrl = process.env[`${envPrefix}_DB_URL`];
  const adminUrl = process.env.ADMIN_URL;
  const adminKey = process.env.ADMIN_SERVICE_KEY;

  if (!dbUrl || !adminUrl || !adminKey) {
    console.error(`❌ Erro: Configurações ausentes para o tenant ${tenant}`);
    return false;
  }

  const now = new Date();
  const dateStr = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
  const fileName = `${dateStr}.dump`;
  const filePath = path.join(process.cwd(), 'temp_backups', `${tenant}_${fileName}`);

  try {
    if (!fs.existsSync('temp_backups')) fs.mkdirSync('temp_backups');

    console.log(`\n⏳ Iniciando backup: ${tenant}...`);
    execSync(`pg_dump "${dbUrl}" -Fc -f "${filePath}"`);

    const buffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    console.log(`📤 Enviando para Admin Storage... (Checksum: ${checksum.slice(0, 8)})`);
    
    const uploadUrl = `${adminUrl}/storage/v1/object/backups/${tenant}/${fileName}`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminKey}`,
        'Content-Type': 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: buffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha no upload: ${response.statusText} - ${errorText}`);
    }

    console.log(`✅ Backup concluído: ${tenant}/${fileName}`);
    
    // Cleanup
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error(`❌ Falha no backup de ${tenant}:`, error);
    return false;
  }
}

const args = process.argv.slice(2);
const tenantArg = args.find(a => a.startsWith('--tenant='))?.split('=')[1];
const allArg = args.includes('--all');

(async () => {
  const tenants = allArg 
    ? ['oeiras', 'z2', 'breves', 'sinpesca-elaine'] 
    : [tenantArg || 'oeiras'];

  console.log(`🚀 Iniciando rotina de backup para: ${tenants.join(', ')}`);

  for (const t of tenants) {
    await backupTenant(t);
  }

  if (fs.existsSync('temp_backups')) {
    fs.rmSync('temp_backups', { recursive: true, force: true });
  }
})();
