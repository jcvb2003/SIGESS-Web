export interface SharedTenantUnitRow {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  city: string | null;
  state: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedTenantUserRow {
  id: string;
  tenant_id: string;
  user_id: string;
  tenant_role: "owner" | "member";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedUserUnitMembershipRow {
  id: string;
  user_id: string;
  tenant_id: string;
  unit_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
