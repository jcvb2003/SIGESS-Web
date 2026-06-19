import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/shared/lib/supabase/client';
import { entityService } from '../entityService';
import { buildQueryMock } from '@/test/mocks/supabaseMock';

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/shared/lib/supabase/admin-client', () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
}));

// ─── getEntity (leitura com tenantId) ────────────────────────────────────────

describe('entityService.getEntity', () => {
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
    await entityService.getEntity(scope);
    const eqCalls = vi.mocked(queryMock.eq).mock.calls.map(([field]) => field);
    expect(eqCalls).toContain('tenant_id');
  });

  it('não aplica unit_id quando scope.unitId é null', async () => {
    const scope = { unitId: null, tenantId: 'tenant-1' };
    await entityService.getEntity(scope);
    const eqCalls = vi.mocked(queryMock.eq).mock.calls.map(([field]) => field);
    expect(eqCalls).not.toContain('unit_id');
  });
});

// ─── updateEntitySettings (escrita com UnitWriteScope) ───────────────────────

describe('entityService.updateEntitySettings', () => {
  afterEach(() => { vi.clearAllMocks(); vi.restoreAllMocks(); });

  it('inclui unit_id e tenant_id do scope no upsert de entidade', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const configQueryMock = buildQueryMock({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
      select: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue(configQueryMock) }),
    } as never);
    vi.spyOn(entityService, 'getEntity').mockResolvedValue({ data: null, error: null });

    const scope = { unitId: 'unit-1', tenantId: 'tenant-1' };
    const settings = { id: 'entity-1', name: 'Teste' } as never;
    await entityService.updateEntitySettings(settings, scope);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ unit_id: 'unit-1', tenant_id: 'tenant-1' })
    );
  });
});
