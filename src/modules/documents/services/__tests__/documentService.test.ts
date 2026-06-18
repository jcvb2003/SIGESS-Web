import { describe, it, expect, vi, afterEach } from 'vitest';
import { supabase } from '@/shared/lib/supabase/client';
import { documentService } from '../documentService';
import { buildQueryMock } from '@/test/mocks/supabaseMock';

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

// ─── listRequests ─────────────────────────────────────────────────────────────

describe('documentService.listRequests', () => {
  const BASE_PARAMS = { page: 1, pageSize: 10, searchTerm: '' };

  afterEach(() => { vi.clearAllMocks(); });

  it('aplica .eq("socios.unit_id", unitId) quando unitId é fornecido', async () => {
    const q = buildQueryMock({ data: [], error: null, count: 0 });
    vi.mocked(supabase.from).mockReturnValue({ select: vi.fn().mockReturnValue(q) } as never);

    await documentService.listRequests(BASE_PARAMS, 'unit-1');
    expect(q.eq).toHaveBeenCalledWith('socios.unit_id', 'unit-1');
  });

  it('não aplica filtro de unit_id quando unitId é null', async () => {
    const q = buildQueryMock({ data: [], error: null, count: 0 });
    vi.mocked(supabase.from).mockReturnValue({ select: vi.fn().mockReturnValue(q) } as never);

    await documentService.listRequests(BASE_PARAMS, null);
    const eqCalls = vi.mocked(q.eq).mock.calls;
    expect(eqCalls.every(([field]) => field !== 'socios.unit_id')).toBe(true);
  });
});

// ─── saveRequest ──────────────────────────────────────────────────────────────

describe('documentService.saveRequest', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('chama insert na tabela requerimentos com os campos do payload', async () => {
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: '1', cod_req: 'REQ001', data_assinatura: '2025-01-01', cpf: '000.000.000-00', socios: null },
          error: null,
        }),
      }),
    });
    vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as never);

    await documentService.saveRequest({ codigo_do_socio: 'SOC001', nome: 'Teste', cpf: '000.000.000-00', data: '2025-01-01' });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ cpf: '000.000.000-00', status_mte: 'assinado' })
    );
  });
});

// ─── deleteRequest ────────────────────────────────────────────────────────────

describe('documentService.deleteRequest', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('lança erro se delete retorna zero linhas (sem permissão)', async () => {
    const deleteMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    vi.mocked(supabase.from).mockReturnValue({ delete: deleteMock } as never);

    const result = await documentService.deleteRequest('req-1');
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toContain('permissao');
  });

  it('resolve sem erro quando delete bem-sucedido', async () => {
    const deleteMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [{ id: 'req-1' }], error: null }),
      }),
    });
    vi.mocked(supabase.from).mockReturnValue({ delete: deleteMock } as never);

    const result = await documentService.deleteRequest('req-1');
    expect(result.error).toBeNull();
  });
});

// ─── getRequestByMember ───────────────────────────────────────────────────────

describe('documentService.getRequestByMember', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('retorna { data: null, error: null } quando nenhum registro é encontrado', async () => {
    const q = buildQueryMock({ data: null, error: null });
    // limit não está em buildQueryMock — adicionar para suportar a cadeia da query
    (q as unknown as Record<string, unknown>).limit = vi.fn().mockReturnValue(q);
    vi.mocked(supabase.from).mockReturnValue({ select: vi.fn().mockReturnValue(q) } as never);

    const result = await documentService.getRequestByMember('000.000.000-00');
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });
});
