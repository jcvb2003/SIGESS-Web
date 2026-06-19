import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/shared/lib/supabase/client';
import { settingsService } from '../settingsService';
import { buildQueryMock } from '@/test/mocks/supabaseMock';

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/shared/lib/supabase/admin-client', () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
}));

// ─── getEntity (leitura com tenantId) ────────────────────────────────────────

describe('settingsService.getEntity', () => {
  let queryMock: ReturnType<typeof buildQueryMock>;

  beforeEach(() => {
    queryMock = buildQueryMock({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue(queryMock),
      }),
    } as never);
  });

  afterEach(() => { vi.clearAllMocks(); });

  it('filtra por tenantId quando scope.tenantId está preenchido', async () => {
    const scope = { unitId: 'unit-1', tenantId: 'tenant-1' };
    await settingsService.getEntity(scope);
    const eqCalls = vi.mocked(queryMock.eq).mock.calls.map(([field]) => field);
    expect(eqCalls).toContain('tenant_id');
  });

  it('não aplica unit_id quando scope.unitId é null', async () => {
    const scope = { unitId: null, tenantId: 'tenant-1' };
    await settingsService.getEntity(scope);
    const eqCalls = vi.mocked(queryMock.eq).mock.calls.map(([field]) => field);
    expect(eqCalls).not.toContain('unit_id');
  });
});

// ─── savePortaria (INSERT e UPDATE paths) ────────────────────────────────────

describe('settingsService.savePortaria', () => {
  const scope = { unitId: 'unit-1', tenantId: 'tenant-1' };
  const portariaBase = { codigoPortaria: 'MMA43', nome: 'SALGADO', isActive: true };

  afterEach(() => { vi.clearAllMocks(); });

  it('INSERT: insere unit_id e tenant_id do scope quando portaria.id é vazio', async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: '1', codigo_portaria: 'MMA43', nome: 'SALGADO', is_active: true },
          error: null,
        }),
      }),
    });
    vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as never);

    await settingsService.savePortaria({ id: '', ...portariaBase }, scope);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ unit_id: 'unit-1', tenant_id: 'tenant-1' })
    );
  });

  it('UPDATE: não chama insert quando portaria.id existe', async () => {
    const insertMock = vi.fn();
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'p-1', codigo_portaria: 'MMA43', nome: 'SALGADO', is_active: true },
            error: null,
          }),
        }),
      }),
    });
    vi.mocked(supabase.from).mockReturnValue({ update: updateMock, insert: insertMock } as never);

    await settingsService.savePortaria({ id: 'p-1', ...portariaBase }, scope);
    expect(insertMock).not.toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalled();
  });
});

// ─── updateEntitySettings (escrita com UnitWriteScope) ───────────────────────

describe('settingsService.updateEntitySettings', () => {
  afterEach(() => { vi.clearAllMocks(); vi.restoreAllMocks(); });

  it('inclui unit_id e tenant_id do scope no upsert de entidade', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const configQueryMock = buildQueryMock({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
      select: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue(configQueryMock) }),
    } as never);
    vi.spyOn(settingsService, 'getEntity').mockResolvedValue({ data: null, error: null });

    const scope = { unitId: 'unit-1', tenantId: 'tenant-1' };
    const settings = { id: 'entity-1', name: 'Teste' } as never;
    await settingsService.updateEntitySettings(settings, scope);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ unit_id: 'unit-1', tenant_id: 'tenant-1' })
    );
  });
});
