import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/shared/lib/supabase/client';
import { financeSettingsService } from '../financeSettingsService';
import { buildQueryMock } from '@/test/mocks/supabaseMock';

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

// ─── getSettings ─────────────────────────────────────────────────────────────

describe('financeSettingsService.getSettings', () => {
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

  it('aplica tenant_id e unit_id quando scope está preenchido', async () => {
    const scope = { unitId: 'unit-1', tenantId: 'tenant-1' };
    await financeSettingsService.getSettings(scope);
    const eqCalls = vi.mocked(queryMock.eq).mock.calls.map(([field]) => field);
    expect(eqCalls).toContain('tenant_id');
    expect(eqCalls).toContain('unit_id');
  });

  it('não aplica unit_id quando scope.unitId é null', async () => {
    const scope = { unitId: null, tenantId: 'tenant-1' };
    await financeSettingsService.getSettings(scope);
    const eqCalls = vi.mocked(queryMock.eq).mock.calls.map(([field]) => field);
    expect(eqCalls).not.toContain('unit_id');
  });
});

// ─── updateSettings ──────────────────────────────────────────────────────────

describe('financeSettingsService.updateSettings', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('chama .update(updates).eq("id", id) na tabela parametros_financeiros', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    vi.mocked(supabase.from).mockReturnValue({ update: updateMock } as never);

    await financeSettingsService.updateSettings('param-1', { juros: 2 } as never);
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ juros: 2 }));
    expect(eqMock).toHaveBeenCalledWith('id', 'param-1');
  });
});
