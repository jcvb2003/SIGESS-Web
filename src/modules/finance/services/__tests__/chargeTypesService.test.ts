import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/shared/lib/supabase/client';
import { chargeTypesService } from '../chargeTypesService';
import { buildQueryMock } from '@/test/mocks/supabaseMock';

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

// ─── getAll ───────────────────────────────────────────────────────────────────

describe('chargeTypesService.getAll', () => {
  let queryMock: ReturnType<typeof buildQueryMock>;

  beforeEach(() => {
    queryMock = buildQueryMock({ data: [], error: null });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue(queryMock),
      }),
    } as never);
  });

  afterEach(() => { vi.clearAllMocks(); });

  it('aplica .eq(unit_id) quando unitId é fornecido', async () => {
    await chargeTypesService.getAll('unit-1');
    expect(queryMock.eq).toHaveBeenCalledWith('unit_id', 'unit-1');
  });

  it('não aplica .eq(unit_id) quando unitId é null', async () => {
    await chargeTypesService.getAll(null);
    const eqCalls = vi.mocked(queryMock.eq).mock.calls;
    expect(eqCalls.every(([field]) => field !== 'unit_id')).toBe(true);
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('chargeTypesService.create', () => {
  let insertMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as never);
  });

  afterEach(() => { vi.clearAllMocks(); });

  it('insere unit_id e tenant_id vindos do scope', async () => {
    const charge = { nome: 'Anuidade', valor_padrao: 100, ativo: true } as never;
    const scope = { unitId: 'unit-1', tenantId: 'tenant-abc' };
    await chargeTypesService.create(charge, scope);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ unit_id: 'unit-1', tenant_id: 'tenant-abc' })
    );
  });

  it('não faz resolução interna de tenantId — usa somente scope.tenantId', async () => {
    const charge = { nome: 'Taxa', valor_padrao: 50, ativo: true } as never;
    const scope = { unitId: 'unit-2', tenantId: 'tenant-xyz' };
    await chargeTypesService.create(charge, scope);
    const [payload] = insertMock.mock.calls[0] as [Record<string, unknown>];
    expect(payload.tenant_id).toBe('tenant-xyz');
    expect(payload.unit_id).toBe('unit-2');
  });
});
