import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/shared/lib/supabase/client';
import { financeService } from '../financeService';
import { buildQueryMock } from '@/test/mocks/supabaseMock';
import type { PaymentSessionPayload } from '../../types/finance.types';

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}));

const BASE_PARAMS = {
  page: 1,
  pageSize: 10,
  searchTerm: '',
  year: 2025,
  tab: 'todos' as const,
  anoBase: 2024,
};

// ─── createPayment ───────────────────────────────────────────────────────────

describe('financeService.createPayment', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('chama insert na tabela financeiro_lancamentos com os dados fornecidos', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as never);

    const data = { cpf: '000.000.000-00', valor: 100 } as never;
    await financeService.createPayment(data);
    expect(insertMock).toHaveBeenCalledWith(data);
  });
});

// ─── createPaymentSession ────────────────────────────────────────────────────

describe('financeService.createPaymentSession', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('chama rpc register_payment_session com o payload', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never);

    const payload: PaymentSessionPayload = { socioCpf: '000.000.000-00', sessaoId: 'sess-1', paymentMethod: 'dinheiro', paymentDate: '2025-01-01', items: [], daes: [] };
    await financeService.createPaymentSession(payload);
    expect(supabase.rpc).toHaveBeenCalledWith('register_payment_session', expect.objectContaining({ p_socio_cpf: '000.000.000-00', p_sessao_id: 'sess-1' }));
  });

  it('lança erro se rpc retorna erro', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('rpc error') } as never);

    const payload: PaymentSessionPayload = { socioCpf: '000', sessaoId: 's', paymentMethod: 'pix', paymentDate: '2025-01-01', items: [], daes: [] };
    await expect(financeService.createPaymentSession(payload)).rejects.toThrow('rpc error');
  });
});

// ─── cancelPayment ───────────────────────────────────────────────────────────

describe('financeService.cancelPayment', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('chama rpc cancel_payment_v1 com id e observação', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never);

    await financeService.cancelPayment('pay-1', 'Cancelado por duplicidade.');
    expect(supabase.rpc).toHaveBeenCalledWith('cancel_payment_v1', { p_id: 'pay-1', p_obs: 'Cancelado por duplicidade.', p_tenant_id: null });
  });
});

// ─── getMonthlyStats ─────────────────────────────────────────────────────────

describe('financeService.getMonthlyStats', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('aplica .eq("socios.unit_id") quando unitId é fornecido', async () => {
    const q = buildQueryMock({ data: [], error: null, count: 0 });
    // gte/lte não estão em buildQueryMock — adicionar para suportar a cadeia de filtros de data
    (q as unknown as Record<string, unknown>).gte = vi.fn().mockReturnValue(q);
    (q as unknown as Record<string, unknown>).lte = vi.fn().mockReturnValue(q);
    vi.mocked(supabase.from).mockReturnValue({ select: vi.fn().mockReturnValue(q) } as never);

    await financeService.getMonthlyStats(2025, 1, 'unit-1');
    const eqCalls = vi.mocked(q.eq).mock.calls;
    expect(eqCalls.some(([field]) => field === 'socios.unit_id')).toBe(true);
  });
});

// ─── getTabCounts ─────────────────────────────────────────────────────────────

describe('financeService.getTabCounts', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('retorna objeto com contagem por aba (todos, em-dia, inadimplentes)', async () => {
    const q = buildQueryMock({ data: null, error: null, count: 3 });
    vi.mocked(supabase.from).mockReturnValue({ select: vi.fn().mockReturnValue(q) } as never);

    const result = await financeService.getTabCounts('', 2025, 2024, 'unit-1');
    expect(result).toHaveProperty('todos');
    expect(result).toHaveProperty('em-dia');
    expect(result).toHaveProperty('inadimplentes');
    expect(typeof result.todos).toBe('number');
  });
});

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
