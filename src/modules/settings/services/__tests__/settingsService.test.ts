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

// ─── saveLocality (escrita com UnitWriteScope) ────────────────────────────────

describe('settingsService.saveLocality', () => {
  let insertMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: '1', nome: 'LOCALIDADE', codigo_localidade: 'LOC1' },
          error: null,
        }),
      }),
    });
    vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as never);
  });

  afterEach(() => { vi.clearAllMocks(); });

  it('insere unit_id e tenant_id do scope no payload', async () => {
    const scope = { unitId: 'unit-1', tenantId: 'tenant-abc' };
    await settingsService.saveLocality({ id: '', name: 'Localidade', code: '' }, scope);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ unit_id: 'unit-1', tenant_id: 'tenant-abc' })
    );
  });
});
