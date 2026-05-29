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

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "42P01" ||
    candidate.message?.toLowerCase().includes("user_unit_memberships") === true ||
    candidate.message?.toLowerCase().includes("tenant_units") === true
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
      const {
        data: memberships,
        error: membershipsError,
      } = await client
        .from("user_unit_memberships" as never)
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (membershipsError) {
        return { data: null, error: membershipsError };
      }

      const membershipRows = (memberships ?? []) as unknown as SharedUserUnitMembershipRow[];
      if (membershipRows.length === 0) {
        return {
          data: {
            availableUnits: [],
            preferredActiveUnitId: null,
          },
          error: null,
        };
      }

      const defaultMembership =
        membershipRows.find((membership) => membership.is_default) ?? null;
      const tenantAdminMembership =
        membershipRows.find((membership) => membership.unit_id === null) ?? null;

      let unitsQuery = client
        .from("tenant_units" as never)
        .select("*")
        .eq("is_active", true);

      if (tenantAdminMembership?.tenant_id) {
        unitsQuery = unitsQuery.eq("tenant_id", tenantAdminMembership.tenant_id);
      } else {
        const unitIds = membershipRows
          .map((membership) => membership.unit_id)
          .filter((unitId): unitId is string => Boolean(unitId));

        if (unitIds.length === 0) {
          return {
            data: {
              availableUnits: [],
              preferredActiveUnitId: defaultMembership?.unit_id ?? null,
            },
            error: null,
          };
        }

        unitsQuery = unitsQuery.in("id", unitIds);
      }

      const { data: units, error: unitsError } = await unitsQuery.order("name", {
        ascending: true,
      });

      if (unitsError) {
        return { data: null, error: unitsError };
      }

      const unitRows = (units ?? []) as unknown as SharedTenantUnitRow[];

      return {
        data: {
          availableUnits: unitRows.map(mapSharedUnitToSummary),
          preferredActiveUnitId:
            defaultMembership?.unit_id ??
            tenantAdminMembership?.unit_id ??
            null,
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
