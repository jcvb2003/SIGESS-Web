import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { supabase } from '@/shared/lib/supabase/client';
import { localitiesService } from '../localitiesService';
import { buildQueryMock } from '@/test/mocks/supabaseMock';

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

// ─── saveLocality (escrita com UnitWriteScope) ────────────────────────────────

describe('localitiesService.saveLocality', () => {
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
    await localitiesService.saveLocality({ id: '', name: 'Localidade', code: '' }, scope);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ unit_id: 'unit-1', tenant_id: 'tenant-abc' })
    );
  });
});
