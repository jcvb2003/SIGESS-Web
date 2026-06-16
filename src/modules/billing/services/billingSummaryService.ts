import { supabase } from "@/shared/lib/supabase/client";
import type { BillingSummaryRow } from "../types/billing.types";

export async function getBillingSummary(
  tenantId: string | null
): Promise<BillingSummaryRow | null> {
  const baseQuery = supabase.from("billing_summary" as never).select("*");

  if (tenantId) {
    const { data, error } = await baseQuery.eq("tenant_id", tenantId).maybeSingle();
    if (error) throw error;
    if (data) return data as BillingSummaryRow;
  }

  const { data, error } = await supabase
    .from("billing_summary" as never)
    .select("*")
    .is("tenant_id", null)
    .maybeSingle();

  if (error) throw error;
  return data as BillingSummaryRow | null;
}
