import type { PortalTokenResponse } from "../types/billing.types";

const ADMIN_FUNCTIONS_URL = `${import.meta.env.VITE_ADMIN_SUPABASE_URL}/functions/v1`;

export async function fetchPortalToken(token: string): Promise<PortalTokenResponse> {
  const res = await fetch(`${ADMIN_FUNCTIONS_URL}/billing-portal?token=${encodeURIComponent(token)}`);
  const json = await res.json();
  return json as PortalTokenResponse;
}
