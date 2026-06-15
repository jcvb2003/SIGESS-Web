import { supabase } from "@/shared/lib/supabase/client";
import type { BillingSummaryRow } from "../types/billing.types";

export async function getBillingSummary(
  tenantId: string | null
): Promise<BillingSummaryRow | null> {
  const query = supabase.from("billing_summary").select("*");

  const { data, error } = await (tenantId
    ? query.eq("tenant_id", tenantId)
    : query.is("tenant_id", null)
  ).maybeSingle();

  if (error) throw error;
  return data as BillingSummaryRow | null;
}
