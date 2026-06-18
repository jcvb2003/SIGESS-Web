import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/shared/lib/supabase/client';
import { memberService } from '../memberService';
import { buildQueryMock } from '@/test/mocks/supabaseMock';
import type { MemberRegistrationForm } from '../../types/member.types';

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}));

vi.mock('../photoService', () => ({
  photoService: { deletePhoto: vi.fn().mockResolvedValue({ error: null }), getPhotoUrl: vi.fn() },
}));

const BASE_PARAMS = {
  page: 1,
  pageSize: 10,
  searchTerm: '',
  statusFilter: 'all',
  localityCode: 'all',
  gender: 'all',
  rgpStatus: 'all',
} as const;

const MINIMAL_FORM = {
  nome: 'Sócio Teste',
  cpf: '000.000.000-00',
  sexo: 'MASCULINO',
} as unknown as MemberRegistrationForm;

// ─── searchMembers ───────────────────────────────────────────────────────────

describe('memberService.searchMembers', () => {
  let queryMock: ReturnType<typeof buildQueryMock>;

  beforeEach(() => {
    queryMock = buildQueryMock({ data: [], error: null, count: 0 });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(queryMock),
    } as never);
  });

  afterEach(() => { vi.clearAllMocks(); });

  it('aplica .eq(unit_id) quando context.unitId é fornecido', async () => {
    await memberService.searchMembers(BASE_PARAMS, { unitId: 'unit-1', tenantId: 'tenant-1' });
    expect(queryMock.eq).toHaveBeenCalledWith('unit_id', 'unit-1');
  });

  it('não aplica .eq com unit_id quando context.unitId é null', async () => {
    await memberService.searchMembers(BASE_PARAMS, { unitId: null });
    const eqCalls = vi.mocked(queryMock.eq).mock.calls;
    expect(eqCalls.every(([field]) => field !== 'unit_id')).toBe(true);
  });

  it('aplica paginação correta via .range()', async () => {
    await memberService.searchMembers({ ...BASE_PARAMS, page: 2, pageSize: 20 }, { unitId: 'u' });
    expect(queryMock.range).toHaveBeenCalledWith(20, 39);
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('memberService.create', () => {
  let insertMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      insert: insertMock,
    } as never);
  });

  afterEach(() => { vi.clearAllMocks(); });

  it('inclui unit_id e tenant_id no payload do insert', async () => {
    await memberService.create(MINIMAL_FORM, { unitId: 'unit-1', tenantId: 'tenant-1' });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ unit_id: 'unit-1', tenant_id: 'tenant-1' })
    );
  });
});

// ─── updateMember ─────────────────────────────────────────────────────────────

describe('memberService.updateMember', () => {
  let queryMock: ReturnType<typeof buildQueryMock>;

  beforeEach(() => {
    queryMock = buildQueryMock({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue(queryMock),
    } as never);
  });

  afterEach(() => { vi.clearAllMocks(); });

  it('aplica .eq(unit_id) quando context.unitId é fornecido', async () => {
    await memberService.updateMember('uuid-1', MINIMAL_FORM, { unitId: 'unit-1', tenantId: 'tenant-1' });
    expect(queryMock.eq).toHaveBeenCalledWith('unit_id', 'unit-1');
  });

  it('não aplica .eq(unit_id) quando context.unitId é null', async () => {
    await memberService.updateMember('uuid-1', MINIMAL_FORM, { unitId: null, tenantId: 'tenant-1' });
    const eqCalls = vi.mocked(queryMock.eq).mock.calls;
    expect(eqCalls.every(([field]) => field !== 'unit_id')).toBe(true);
  });
});

// ─── deleteMember ─────────────────────────────────────────────────────────────

describe('memberService.deleteMember', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('executa .delete().eq("id") quando não há foto associada', async () => {
    const deleteMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: 'uuid-1' }], error: null }),
      }),
    });
    vi.mocked(supabase.from)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as never)
      .mockReturnValueOnce({ delete: deleteMock } as never);

    await memberService.deleteMember('uuid-1');
    expect(deleteMock).toHaveBeenCalled();
  });

  it('lança erro se delete retorna zero linhas (sem permissão)', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as never)
      .mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as never);

    await expect(memberService.deleteMember('uuid-1')).rejects.toThrow('permissao');
  });

  it('lança erro se o fetch inicial falhar', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('fetch error') }),
        }),
      }),
    } as never);

    await expect(memberService.deleteMember('uuid-1')).rejects.toThrow('fetch error');
  });
});

// ─── touchUpdatedAt ───────────────────────────────────────────────────────────

describe('memberService.touchUpdatedAt', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('chama .update({ updated_at }).eq("id", id)', async () => {
    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
    vi.mocked(supabase.from).mockReturnValue({ update: updateMock } as never);

    await memberService.touchUpdatedAt('uuid-1');
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ updated_at: expect.any(String) })
    );
    expect(eqMock).toHaveBeenCalledWith('id', 'uuid-1');
  });
});

// ─── getMemberById ────────────────────────────────────────────────────────────

describe('memberService.getMemberById', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('retorna null quando query retorna erro', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
        }),
      }),
    } as never);

    const result = await memberService.getMemberById('non-existent');
    expect(result).toBeNull();
  });

  it('retorna objeto mapeado quando dado existe', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'uuid-1', nome: 'Teste', cpf: '000.000.000-00' },
            error: null,
          }),
        }),
      }),
    } as never);

    const result = await memberService.getMemberById('uuid-1');
    expect(result).not.toBeNull();
  });
});

// ─── countMembers ─────────────────────────────────────────────────────────────

describe('memberService.countMembers', () => {
  let queryMock: ReturnType<typeof buildQueryMock>;

  beforeEach(() => {
    queryMock = buildQueryMock({ data: null, error: null, count: 42 });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue(queryMock),
    } as never);
  });

  afterEach(() => { vi.clearAllMocks(); });

  it('retorna { total } e não { count }', async () => {
    const result = await memberService.countMembers({ unitId: 'unit-1' });
    expect(result.total).toBe(42);
    expect((result as Record<string, unknown>).count).toBeUndefined();
  });

  it('aplica .eq(unit_id) quando context.unitId é fornecido', async () => {
    await memberService.countMembers({ unitId: 'unit-1', tenantId: 'tenant-1' });
    expect(queryMock.eq).toHaveBeenCalledWith('unit_id', 'unit-1');
  });

  it('não aplica .eq(unit_id) quando context.unitId é undefined', async () => {
    await memberService.countMembers({});
    const eqCalls = vi.mocked(queryMock.eq).mock.calls;
    expect(eqCalls.every(([field]) => field !== 'unit_id')).toBe(true);
  });
});
