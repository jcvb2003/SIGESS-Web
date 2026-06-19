import { describe, it, expect, vi, afterEach } from 'vitest';
import { supabase } from '@/shared/lib/supabase/client';
import { portariasService } from '../portariasService';

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

// ─── savePortaria (INSERT e UPDATE paths) ────────────────────────────────────

describe('portariasService.savePortaria', () => {
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

    await portariasService.savePortaria({ id: '', ...portariaBase }, scope);
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

    await portariasService.savePortaria({ id: 'p-1', ...portariaBase }, scope);
    expect(insertMock).not.toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalled();
  });
});
