import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/shared/lib/supabase/client';
import { chargeTypesService } from '../chargeTypesService';
import { buildQueryMock } from '@/test/mocks/supabaseMock';

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/shared/utils/tenant', () => ({
  resolveTenantIdViaTenantUsers: vi.fn().mockResolvedValue('tenant-1'),
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

  it('inclui unit_id no payload do insert', async () => {
    const charge = { nome: 'Anuidade', valor_padrao: 100, ativo: true } as never;
    await chargeTypesService.create(charge, 'unit-1');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ unit_id: 'unit-1', tenant_id: 'tenant-1' })
    );
  });

  it('lança erro se unitId for null', async () => {
    const charge = { nome: 'Anuidade', valor_padrao: 100, ativo: true } as never;
    await expect(chargeTypesService.create(charge, null)).rejects.toThrow(
      'unitId obrigatório em chargeTypesService.create'
    );
  });
});
