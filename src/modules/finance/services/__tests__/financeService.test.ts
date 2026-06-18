import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/shared/lib/supabase/client';
import { financeService } from '../financeService';
import { buildQueryMock } from '@/test/mocks/supabaseMock';

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

const BASE_PARAMS = {
  page: 1,
  pageSize: 10,
  searchTerm: '',
  year: 2025,
  tab: 'todos' as const,
  anoBase: 2024,
};

// ─── getDashboard ─────────────────────────────────────────────────────────────

describe('financeService.getDashboard', () => {
  let queryMock: ReturnType<typeof buildQueryMock>;

  beforeEach(() => {
    queryMock = buildQueryMock({ data: [], error: null, count: 0 });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(queryMock),
    } as never);
  });

  afterEach(() => { vi.clearAllMocks(); });

  it('aplica .eq(unit_id) quando unitId é fornecido', async () => {
    await financeService.getDashboard(BASE_PARAMS, 'unit-1');
    expect(queryMock.eq).toHaveBeenCalledWith('unit_id', 'unit-1');
  });

  it('não aplica .eq(unit_id) quando unitId é null (gestor vê todos)', async () => {
    await financeService.getDashboard(BASE_PARAMS, null);
    const eqCalls = vi.mocked(queryMock.eq).mock.calls;
    expect(eqCalls.every(([field]) => field !== 'unit_id')).toBe(true);
  });

  it('retorna { items, total } com formato correto', async () => {
    const result = await financeService.getDashboard(BASE_PARAMS, 'unit-1');
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe('number');
  });
});
