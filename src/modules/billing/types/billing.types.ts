export interface BillingSummaryRow {
  id: string;
  tenant_id: string | null;
  subscription_status: 'trialing' | 'pending_payment' | 'active' | 'overdue' | 'cancelled' | null;
  plan_name: string | null;
  next_billing_date: string | null;
  has_pending_charge: boolean;
  pending_charge_amount: number | null;
  payment_url: string | null;
  last_synced_at: string | null;
}

export interface PortalTokenPayload {
  ok: true;
  tenant_name: string;
  plan_name: string | null;
  amount: number | null;
  due_date: string | null;
  payment_url: string | null;
}

export interface PortalTokenError {
  ok: false;
  reason: string;
}

export type PortalTokenResponse = PortalTokenPayload | PortalTokenError;
