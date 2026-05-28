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
  tenant_role: "owner" | "manager" | "member";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedUserUnitMembershipRow {
  id: string;
  user_id: string;
  tenant_id: string;
  unit_id: string | null;
  role: "tenant_admin" | "unit_manager" | "unit_operator" | "unit_viewer";
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
