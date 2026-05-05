import { createClient } from '@supabase/supabase-js';

type TenantConfig = {
  id: string;
  url: string;
  serviceKey: string;
};

type PropagateOptions = {
  tenants: TenantConfig[];
  oeiras: TenantConfig;
  targetTenant?: string;
  dryRun?: boolean;
  fromVersion?: string;
};

type MigrationRow = {
  version: string;
  name?: string | null;
  statements?: string[] | null;
};

const BLOCKED = [
  /DROP\s+TABLE/i,
  /DROP\s+SCHEMA/i,
  /TRUNCATE/i,
  /ALTER\s+TYPE/i,
  /DELETE\s+FROM\s+\w+\s*($|;|\s+WHERE\s+true)/i,
];

function isSafe(sql: string) {
  return !BLOCKED.some((r) => r.test(sql));
}

export async function propagateFromOeiras(options: PropagateOptions) {
  const { tenants, oeiras, targetTenant, dryRun, fromVersion } = options;

  console.log(`📡 Conectando ao OEIRAS (${oeiras.url})...`);
  const oeirasClient = createClient(oeiras.url, oeiras.serviceKey, {
    db: { schema: 'supabase_migrations' }
  });

  const { data: oeirasMigrations, error } = await oeirasClient
    .from('schema_migrations')
    .select('*')
    .order('version', { ascending: true });

  if (error) {
    console.error('❌ Erro ao ler OEIRAS:', error);
    throw error;
  }

  const oeirasMigrationRows = (oeirasMigrations ?? []) as MigrationRow[];

  for (const tenant of tenants) {
    if (tenant.id === oeiras.id) continue;
    if (targetTenant && tenant.id !== targetTenant) continue;

    console.log(`\n🔍 Verificando tenant: ${tenant.id}...`);
    const client = createClient(tenant.url, tenant.serviceKey);
    const migrationClient = createClient(tenant.url, tenant.serviceKey, {
      db: { schema: 'supabase_migrations' }
    });

    const { data: existing, error: fetchError } = await migrationClient
      .from('schema_migrations')
      .select('version');

    if (fetchError) {
      console.error(`  ❌ Erro ao ler ${tenant.id}:`, fetchError);
      continue;
    }

    const existingRows = (existing ?? []) as Pick<MigrationRow, "version">[];
    const existingSet = new Set(existingRows.map((m) => m.version));

    const pending = oeirasMigrationRows.filter((m) => {
      if (fromVersion && m.version < fromVersion) return false;
      return !existingSet.has(m.version);
    });

    if (pending.length === 0) {
      console.log(`  ✔ ${tenant.id} já atualizado`);
      continue;
    }

    console.log(`  ➡ ${tenant.id}: ${pending.length} migrations pendentes`);

    for (const migration of pending) {
      console.log(`  - [${migration.version}] ${migration.name}`);

      if (dryRun) {
        console.log(`    (Simulação) Statements detectados: ${migration.statements?.length || 0}`);
        continue;
      }

      const statements = migration.statements ?? [];

      if (!statements || statements.length === 0) {
        console.log(`    ⚠ Migration vazia, pulando.`);
        continue;
      }

      const safeStatements = statements.filter(isSafe);

      if (safeStatements.length !== statements.length) {
        console.warn(`    🛑 MIGRATION BLOQUEADA: Contém comandos DDL perigosos.`);
        continue;
      }

      try {
        // Executa via RPC exec_sql se disponível, ou via transação
        // Nota: O motor CLI usa SERVICE_ROLE, mas o banco alvo precisa do rpc('exec_sql')
        // Caso não exista, o script tentará executar individualmente
        
        await client.rpc('exec_sql', { sql: 'BEGIN;' });

        for (const stmt of safeStatements) {
          await client.rpc('exec_sql', { sql: stmt });
        }

        await client.rpc('exec_sql', { sql: 'COMMIT;' });

        // Registrar sucesso no tenant (Schema Canônico)
        await migrationClient.from('schema_migrations').insert({
          version: migration.version,
          name: migration.name,
          statements: migration.statements,
        });

        console.log(`    ✅ Sucesso`);
      } catch (err) {
        try {
          await client.rpc('exec_sql', { sql: 'ROLLBACK;' });
        } catch (rollbackError) {
          console.warn(`    ⚠ Falha ao executar rollback`, rollbackError);
        }
        console.error(`    ❌ Falha ao aplicar`, err);
        break; // Interrompe propagação para este tenant em caso de erro
      }
    }
  }
}
