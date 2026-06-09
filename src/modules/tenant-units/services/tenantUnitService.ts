import { authService } from "@/modules/auth/services/authService";
import type { ServiceResponse } from "@/shared/services/base/serviceResponse";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/shared/lib/supabase/client";
import type { TenantUnitSummary } from "../context/TenantUnitContext";
import type {
  SharedTenantUnitRow,
  SharedUserUnitMembershipRow,
} from "./sharedTenant.types";

type UnitsMetadataCandidate =
  | TenantUnitSummary[]
  | {
      available_units?: TenantUnitSummary[];
      units?: TenantUnitSummary[];
      memberships?: TenantUnitSummary[];
    }
  | null
  | undefined;

function normalizeUnits(candidate: UnitsMetadataCandidate): TenantUnitSummary[] {
  const rawUnits = Array.isArray(candidate)
    ? candidate
    : candidate?.available_units ?? candidate?.units ?? candidate?.memberships ?? [];

  if (!Array.isArray(rawUnits)) {
    return [];
  }

  return rawUnits
    .filter(
      (unit): unit is TenantUnitSummary =>
        Boolean(unit) &&
        typeof unit.id === "string" &&
        unit.id.trim().length > 0 &&
        typeof unit.name === "string" &&
        unit.name.trim().length > 0,
    )
    .map((unit) => ({
      id: unit.id,
      name: unit.name,
      code: unit.code ?? null,
    }));
}

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

function isMissingSharedSchemaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string; status?: number };
  return (
    candidate.status === 404 ||
    candidate.code === "42P01" ||
    candidate.code === "PGRST205" ||
    candidate.message?.toLowerCase().includes("user_unit_memberships") === true ||
    candidate.message?.toLowerCase().includes("tenant_units") === true ||
    candidate.message?.toLowerCase().includes("tenant_users") === true
  );
}

export const tenantUnitService = {
  getUserAssignedUnitsFromUser(user: User | null | undefined): TenantUnitSummary[] {
    const appMetadata = user?.app_metadata as
      | {
          available_units?: TenantUnitSummary[];
          units?: TenantUnitSummary[];
          memberships?: TenantUnitSummary[];
        }
      | undefined;

    return normalizeUnits(appMetadata);
  },

  getPreferredActiveUnitIdFromUser(user: User | null | undefined) {
    const appMetadata = user?.app_metadata as
      | { active_unit_id?: string | null }
      | undefined;
    return appMetadata?.active_unit_id ?? null;
  },

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
        if (isMissingSharedSchemaError(tenantUserError)) {
          return { data: { availableUnits: [], preferredActiveUnitId: null }, error: null };
        }
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
          if (isMissingSharedSchemaError(membershipsError)) {
            return { data: { availableUnits: [], preferredActiveUnitId: null }, error: null };
          }
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
        if (isMissingSharedSchemaError(unitsError)) {
          return { data: { availableUnits: [], preferredActiveUnitId: null }, error: null };
        }
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
      if (isMissingSharedSchemaError(error)) {
        return {
          data: {
            availableUnits: [],
            preferredActiveUnitId: null,
          },
          error: null,
        };
      }

      const normalizedError =
        error instanceof Error ? error : new Error("Nao foi possivel resolver os polos do tenant shared.");
      return { data: null, error: normalizedError };
    }
  },

  async resolveTenantUnits(
    user: User | null | undefined,
  ): Promise<ServiceResponse<ResolvedTenantUnits>> {
    const metadataUnits = this.getUserAssignedUnitsFromUser(user);
    const metadataPreferredActiveUnitId = this.getPreferredActiveUnitIdFromUser(user);

    const sharedResolution = await this.getUserAssignedUnitsFromSharedProject(user);
    const sharedUnits = sharedResolution.data?.availableUnits ?? [];
    const sharedPreferredActiveUnitId = sharedResolution.data?.preferredActiveUnitId ?? null;

    if (sharedUnits.length > 0) {
      return {
        data: {
          availableUnits: sharedUnits,
          preferredActiveUnitId:
            sharedPreferredActiveUnitId ?? metadataPreferredActiveUnitId,
        },
        error: null,
      };
    }

    if (metadataUnits.length > 0) {
      return {
        data: {
          availableUnits: metadataUnits,
          preferredActiveUnitId: metadataPreferredActiveUnitId,
        },
        error: null,
      };
    }

    const { data, error } = await authService.getUser();
    if (error) {
      return { data: null, error };
    }

    const refreshedUser = data?.user;
    return {
      data: {
        availableUnits: this.getUserAssignedUnitsFromUser(refreshedUser),
        preferredActiveUnitId: this.getPreferredActiveUnitIdFromUser(refreshedUser),
      },
      error: null,
    };
  },

  async getUserAssignedUnits(): Promise<ServiceResponse<TenantUnitSummary[]>> {
    const { data, error } = await authService.getUser();
    if (error) {
      return { data: null, error };
    }

    return {
      data: this.getUserAssignedUnitsFromUser(data?.user),
      error: null,
    };
  },
};
