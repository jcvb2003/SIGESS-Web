import { describe, it, expect, vi, afterEach } from 'vitest';
import { supabase } from '@/shared/lib/supabase/client';
import { parametersService } from '../parametersService';
import { buildQueryMock } from '@/test/mocks/supabaseMock';

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

// ─── saveParameters (escrita com UnitWriteScope) ──────────────────────────────

describe('parametersService.saveParameters', () => {
  afterEach(() => { vi.clearAllMocks(); vi.restoreAllMocks(); });

  it('inclui tenant_id e unit_id do scope no payload do upsert', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const queryMock = buildQueryMock({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
      select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue(queryMock) }) }),
    } as never);
    vi.spyOn(parametersService, 'getParameters').mockResolvedValue({ data: null, error: null });

    const scope = { unitId: 'unit-1', tenantId: 'tenant-1' };
    const input = { id: 'param-1', maintenanceMode: false, maxUploadSize: 5, allowedFileTypes: [], sessionTimeout: 30 } as never;
    await parametersService.saveParameters(input, scope);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: 'tenant-1', unit_id: 'unit-1' }),
      expect.anything()
    );
  });
});
