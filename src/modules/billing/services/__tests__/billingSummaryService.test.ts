import { describe, it, expect, vi, afterEach } from 'vitest';
import { supabase } from '@/shared/lib/supabase/client';
import { getBillingSummary } from '../billingSummaryService';

vi.mock('@/shared/lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

// ─── getBillingSummary ────────────────────────────────────────────────────────

describe('getBillingSummary', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('filtra por tenant_id quando tenantId é fornecido e dado existe', async () => {
    const eqMock = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'row-1' }, error: null }),
    });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: eqMock }),
    } as never);

    await getBillingSummary('tenant-1');
    expect(eqMock).toHaveBeenCalledWith('tenant_id', 'tenant-1');
  });

  it('usa .is("tenant_id", null) quando tenantId é null', async () => {
    const isMock = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ is: isMock }),
    } as never);

    await getBillingSummary(null);
    expect(isMock).toHaveBeenCalledWith('tenant_id', null);
  });
});
