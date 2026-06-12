import type { ServiceResponse } from "@/shared/services/base/serviceResponse";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/shared/lib/supabase/client";
import type { TenantUnitSummary } from "../context/TenantUnitContext";
import type {
  SharedTenantUnitRow,
  SharedUserUnitMembershipRow,
} from "./sharedTenant.types";

function mapSharedUnitToSummary(unit: SharedTenantUnitRow): TenantUnitSummary {
  return {
    id: unit.id,
    name: unit.name,
    code: unit.code ?? null,
    tenantId: unit.tenant_id ?? null,
  };
}

export interface ResolvedTenantUnits {
  availableUnits: TenantUnitSummary[];
  preferredActiveUnitId: string | null;
}

export const tenantUnitService = {
  async getUserAssignedUnitsFromSharedProject(
    user: User | null | undefined,
  ): Promise<ServiceResponse<ResolvedTenantUnits>> {
    if (!user) {
      return {
        data: {
          availableUnits: [],
          preferredActiveUnitId: null,
        },
        error: null,
      };
    }

    try {
      const client = getSupabaseClient() as ReturnType<typeof getSupabaseClient>;

      // Detecta gestor via tenant_users (fonte de verdade do papel)
      const { data: tenantUserData, error: tenantUserError } = await client
        .from("tenant_users" as never)
        .select("tenant_id")
        .eq("user_id", user.id)
        .eq("tenant_role", "owner")
        .eq("is_active", true)
        .maybeSingle();

      if (tenantUserError) {
        return { data: null, error: tenantUserError };
      }

      const gestorTenantId =
        (tenantUserData as unknown as { tenant_id: string } | null)?.tenant_id ?? null;

      let unitsQuery = client
        .from("tenant_units" as never)
        .select("*")
        .eq("is_active", true);

      let preferredActiveUnitId: string | null = null;

      if (gestorTenantId) {
        // Gestor: lista todos os polos do tenant
        unitsQuery = unitsQuery.eq("tenant_id", gestorTenantId);
      } else {
        // Operador: lista apenas os polos vinculados
        const { data: memberships, error: membershipsError } = await client
          .from("user_unit_memberships" as never)
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (membershipsError) {
          return { data: null, error: membershipsError };
        }

        const membershipRows = (memberships ?? []) as unknown as SharedUserUnitMembershipRow[];
        const unitIds = membershipRows
          .map((m) => m.unit_id)
          .filter((unitId): unitId is string => Boolean(unitId));

        if (unitIds.length === 0) {
          return {
            data: { availableUnits: [], preferredActiveUnitId: null },
            error: null,
          };
        }

        unitsQuery = unitsQuery.in("id", unitIds);
      }

      const { data: units, error: unitsError } = await unitsQuery.order("name", { ascending: true });

      if (unitsError) {
        return { data: null, error: unitsError };
      }

      const unitRows = (units ?? []) as unknown as SharedTenantUnitRow[];

      return {
        data: {
          availableUnits: unitRows.map(mapSharedUnitToSummary),
          preferredActiveUnitId,
        },
        error: null,
      };
    } catch (error) {
      const normalizedError =
        error instanceof Error ? error : new Error("Nao foi possivel resolver os polos do tenant shared.");
      return { data: null, error: normalizedError };
    }
  },

  async resolveTenantUnits(
    user: User | null | undefined,
  ): Promise<ServiceResponse<ResolvedTenantUnits>> {
    const sharedResolution = await this.getUserAssignedUnitsFromSharedProject(user);
    return {
      data: {
        availableUnits: sharedResolution.data?.availableUnits ?? [],
        preferredActiveUnitId: sharedResolution.data?.preferredActiveUnitId ?? null,
      },
      error: sharedResolution.error,
    };
  },
};
