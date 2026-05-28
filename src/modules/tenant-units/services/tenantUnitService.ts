import { authService } from "@/modules/auth/services/authService";
import type { ServiceResponse } from "@/shared/services/base/serviceResponse";
import type { User } from "@supabase/supabase-js";
import type { TenantUnitSummary } from "../context/TenantUnitContext";

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
