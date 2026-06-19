import { supabase } from "@/shared/lib/supabase/client";
import type { UnitWriteScope } from "@/shared/types/scope";
import type { Coordinator, CoordinatorMember } from "../types/coordinator.types";

type ServiceResponse<T> = { data: T | null; error: Error | null };

function normalizeText(value?: string | null) {
  return value?.trim() ?? "";
}

function toNullable(value?: string | null) {
  const normalized = normalizeText(value);
  return normalized === "" ? null : normalized.toUpperCase();
}

function toNullableEmail(value?: string | null) {
  const normalized = normalizeText(value);
  return normalized === "" ? null : normalized.toLowerCase();
}

export const coordinatorService = {
  async getCoordinators(unitId: string): Promise<ServiceResponse<Coordinator[]>> {
    const query = supabase
      .from("coordinators")
      .select("id, tenant_id, unit_id, name, region, phone, email, notes, is_active")
      .eq("unit_id", unitId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    const { data, error } = await query;
    if (error) return { data: null, error };

    const coordinators = ((data ?? []) as Array<Record<string, unknown>>).map((item) => ({
      id: String(item.id ?? ""),
      tenantId: typeof item.tenant_id === "string" ? item.tenant_id : null,
      unitId: typeof item.unit_id === "string" ? item.unit_id : null,
      name: String(item.name ?? ""),
      region: String(item.region ?? ""),
      phone: String(item.phone ?? ""),
      email: String(item.email ?? ""),
      notes: String(item.notes ?? ""),
      isActive: Boolean(item.is_active),
    }));

    return { data: coordinators, error: null };
  },

  async saveCoordinator(
    coordinator: Coordinator,
    scope: UnitWriteScope,
  ): Promise<ServiceResponse<Coordinator>> {
    const payload = {
      tenant_id: scope.tenantId,
      unit_id: scope.unitId,
      name: normalizeText(coordinator.name).toUpperCase(),
      region: toNullable(coordinator.region),
      phone: toNullable(coordinator.phone),
      email: toNullableEmail(coordinator.email),
      notes: coordinator.notes?.trim() || null,
      is_active: coordinator.isActive,
      updated_at: new Date().toISOString(),
    };

    if (coordinator.id) {
      const { data, error } = await supabase
        .from("coordinators")
        .update(payload)
        .eq("id", coordinator.id)
        .select("id, tenant_id, unit_id, name, region, phone, email, notes, is_active")
        .single();

      if (error) return { data: null, error };

      return {
        data: {
          id: String((data as Record<string, unknown>).id ?? ""),
          tenantId: typeof (data as Record<string, unknown>).tenant_id === "string" ? String((data as Record<string, unknown>).tenant_id) : null,
          unitId: typeof (data as Record<string, unknown>).unit_id === "string" ? String((data as Record<string, unknown>).unit_id) : null,
          name: String((data as Record<string, unknown>).name ?? ""),
          region: String((data as Record<string, unknown>).region ?? ""),
          phone: String((data as Record<string, unknown>).phone ?? ""),
          email: String((data as Record<string, unknown>).email ?? ""),
          notes: String((data as Record<string, unknown>).notes ?? ""),
          isActive: Boolean((data as Record<string, unknown>).is_active),
        },
        error: null,
      };
    }

    const { data, error } = await supabase
      .from("coordinators")
      .insert(payload)
      .select("id, tenant_id, unit_id, name, region, phone, email, notes, is_active")
      .single();

    if (error) return { data: null, error };

    return {
      data: {
        id: String((data as Record<string, unknown>).id ?? ""),
        tenantId: typeof (data as Record<string, unknown>).tenant_id === "string" ? String((data as Record<string, unknown>).tenant_id) : null,
        unitId: typeof (data as Record<string, unknown>).unit_id === "string" ? String((data as Record<string, unknown>).unit_id) : null,
        name: String((data as Record<string, unknown>).name ?? ""),
        region: String((data as Record<string, unknown>).region ?? ""),
        phone: String((data as Record<string, unknown>).phone ?? ""),
        email: String((data as Record<string, unknown>).email ?? ""),
        notes: String((data as Record<string, unknown>).notes ?? ""),
        isActive: Boolean((data as Record<string, unknown>).is_active),
      },
      error: null,
    };
  },

  async deleteCoordinator(id: string): Promise<ServiceResponse<void>> {
    const { error } = await supabase.from("coordinators").delete().eq("id", id);
    if (error) return { data: null, error };
    return { data: null, error: null };
  },

  async getCoordinatorMembers(coordinatorId: string): Promise<ServiceResponse<CoordinatorMember[]>> {
    const { data, error } = await supabase
      .from("socios")
      .select("id, nome, cpf, situacao, codigo_do_socio")
      .eq("coordinator_id", coordinatorId)
      .order("nome", { ascending: true });

    if (error) return { data: null, error };

    const members = ((data ?? []) as Array<Record<string, unknown>>).map((item) => ({
      id: String(item.id ?? ""),
      nome: String(item.nome ?? ""),
      cpf: String(item.cpf ?? ""),
      situacao: String(item.situacao ?? ""),
      codigoDoSocio: String(item.codigo_do_socio ?? ""),
    }));

    return { data: members, error: null };
  },
};
