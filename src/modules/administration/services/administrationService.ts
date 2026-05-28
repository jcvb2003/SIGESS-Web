import { authService } from "@/modules/auth/services/authService";
import { supabase } from "@/shared/lib/supabase/client";
import type { ServiceResponse } from "@/shared/services/base/serviceResponse";

export interface TenantUnitRecord {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  city: string | null;
  state: string | null;
  isActive: boolean;
}

export interface TenantUnitInput {
  id?: string;
  code?: string | null;
  name: string;
  city?: string | null;
  state?: string | null;
  isActive?: boolean;
}

export interface TenantUserRecord {
  id: string;
  tenantId: string;
  userId: string;
  email: string | null;
  name: string | null;
  tenantRole: "owner" | "manager" | "member";
  isActive: boolean;
}

export interface TenantMembershipRecord {
  id: string;
  tenantId: string;
  userId: string;
  unitId: string | null;
  role: "tenant_admin" | "unit_manager" | "unit_operator" | "unit_viewer";
  isActive: boolean;
  isDefault: boolean;
}

export interface TenantMembershipInput {
  userId: string;
  unitId?: string | null;
  role: "tenant_admin" | "unit_manager" | "unit_operator" | "unit_viewer";
  isActive?: boolean;
  isDefault?: boolean;
}

function normalizeUnitCode(input: string) {
  return input
    .trim()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^\w\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-")
    .toLowerCase();
}

function mapTenantUnitRow(row: Record<string, unknown>): TenantUnitRecord {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    city: row.city ? String(row.city) : null,
    state: row.state ? String(row.state) : null,
    isActive: Boolean(row.is_active),
  };
}

function mapTenantUserRow(row: Record<string, unknown>): TenantUserRecord {
  const profile = (row.user_profiles ?? {}) as Record<string, unknown>;

  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    userId: String(row.user_id),
    email: profile.email ? String(profile.email) : null,
    name: profile.nome ? String(profile.nome) : null,
    tenantRole: String(row.tenant_role) as TenantUserRecord["tenantRole"],
    isActive: Boolean(row.is_active),
  };
}

function mapTenantMembershipRow(row: Record<string, unknown>): TenantMembershipRecord {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    userId: String(row.user_id),
    unitId: row.unit_id ? String(row.unit_id) : null,
    role: String(row.role) as TenantMembershipRecord["role"],
    isActive: Boolean(row.is_active),
    isDefault: Boolean(row.is_default),
  };
}

async function resolveCurrentTenantId(): Promise<ServiceResponse<string>> {
  const { data: userData, error: userError } = await authService.getUser();
  if (userError) {
    return { data: null, error: userError };
  }

  const userId = userData?.user?.id;
  if (!userId) {
    return { data: null, error: new Error("Usuário autenticado não encontrado.") };
  }

  const { data: tenantUser, error: tenantUserError } = await supabase
    .from("tenant_users" as never)
    .select("tenant_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (tenantUserError) {
    return { data: null, error: tenantUserError };
  }

  const tenantIdFromTenantUser =
    (tenantUser as { tenant_id?: string } | null)?.tenant_id ?? null;
  if (tenantIdFromTenantUser) {
    return { data: tenantIdFromTenantUser, error: null };
  }

  const { data, error } = await supabase
    .from("user_unit_memberships" as never)
    .select("tenant_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  const tenantId = (data as { tenant_id?: string } | null)?.tenant_id ?? null;
  if (!tenantId) {
    return {
      data: null,
      error: new Error("Não foi possível identificar o tenant do usuário atual."),
    };
  }

  return { data: tenantId, error: null };
}

export const administrationService = {
  async listTenantMemberships(): Promise<ServiceResponse<TenantMembershipRecord[]>> {
    const tenantIdResult = await resolveCurrentTenantId();
    if (tenantIdResult.error || !tenantIdResult.data) {
      return { data: null, error: tenantIdResult.error };
    }

    const { data, error } = await supabase
      .from("user_unit_memberships" as never)
      .select("*")
      .eq("tenant_id", tenantIdResult.data)
      .order("created_at", { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapTenantMembershipRow),
      error: null,
    };
  },

  async listTenantUsers(): Promise<ServiceResponse<TenantUserRecord[]>> {
    const tenantIdResult = await resolveCurrentTenantId();
    if (tenantIdResult.error || !tenantIdResult.data) {
      return { data: null, error: tenantIdResult.error };
    }

    const { data, error } = await supabase
      .from("tenant_users" as never)
      .select("id, tenant_id, user_id, tenant_role, is_active, user_profiles(email, nome)")
      .eq("tenant_id", tenantIdResult.data)
      .order("created_at", { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapTenantUserRow),
      error: null,
    };
  },

  async listTenantUnits(): Promise<ServiceResponse<TenantUnitRecord[]>> {
    const tenantIdResult = await resolveCurrentTenantId();
    if (tenantIdResult.error || !tenantIdResult.data) {
      return { data: null, error: tenantIdResult.error };
    }

    const { data, error } = await supabase
      .from("tenant_units" as never)
      .select("*")
      .eq("tenant_id", tenantIdResult.data)
      .order("name", { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapTenantUnitRow),
      error: null,
    };
  },

  async saveTenantUnit(input: TenantUnitInput): Promise<ServiceResponse<TenantUnitRecord>> {
    const tenantIdResult = await resolveCurrentTenantId();
    if (tenantIdResult.error || !tenantIdResult.data) {
      return { data: null, error: tenantIdResult.error };
    }

    const payload = {
      ...(input.id ? { id: input.id } : {}),
      tenant_id: tenantIdResult.data,
      code: normalizeUnitCode(input.code?.trim() || input.name),
      name: input.name.trim(),
      city: input.city?.trim() || null,
      state: input.state?.trim().toUpperCase() || null,
      is_active: input.isActive ?? true,
    };

    const query = input.id
      ? supabase.from("tenant_units" as never).update(payload as never).eq("id", input.id)
      : supabase.from("tenant_units" as never).insert(payload as never);

    const { data, error } = await query.select("*").single();
    if (error) {
      return { data: null, error };
    }

    return {
      data: mapTenantUnitRow(data as Record<string, unknown>),
      error: null,
    };
  },

  async setTenantUnitActive(
    id: string,
    isActive: boolean,
  ): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from("tenant_units" as never)
      .update({ is_active: isActive } as never)
      .eq("id", id);

    if (error) {
      return { data: null, error };
    }

    return { data: null, error: null };
  },

  async createTenantMembership(
    input: TenantMembershipInput,
  ): Promise<ServiceResponse<TenantMembershipRecord>> {
    const tenantIdResult = await resolveCurrentTenantId();
    if (tenantIdResult.error || !tenantIdResult.data) {
      return { data: null, error: tenantIdResult.error };
    }

    const payload = {
      tenant_id: tenantIdResult.data,
      user_id: input.userId,
      unit_id: input.unitId ?? null,
      role: input.role,
      is_active: input.isActive ?? true,
      is_default: input.isDefault ?? false,
    };

    const { data, error } = await supabase
      .from("user_unit_memberships" as never)
      .insert(payload as never)
      .select("*")
      .single();

    if (error) {
      return { data: null, error };
    }

    return {
      data: mapTenantMembershipRow(data as Record<string, unknown>),
      error: null,
    };
  },

  async deleteTenantMembership(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase
      .from("user_unit_memberships" as never)
      .delete()
      .eq("id", id);

    if (error) {
      return { data: null, error };
    }

    return { data: null, error: null };
  },
};
