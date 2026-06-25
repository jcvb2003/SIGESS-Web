import type { ServiceResponse } from "@/shared/services/base/serviceResponse";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/shared/lib/supabase/client";
import type { TenantUnitSummary } from "../context/TenantUnitContext";
import type {
  SharedTenantUnitRow,
  SharedUserUnitMembershipRow,
} from "./sharedTenant.types";

const ACTIVE_UNIT_STORAGE_KEY = "sigess_active_unit";
const TENANT_CONFIG_CACHE_KEY = "sigess_tenant_config";

function mapSharedUnitToSummary(unit: SharedTenantUnitRow): TenantUnitSummary {
  return {
    id: unit.id,
    name: unit.name,
    code: unit.code ?? null,
    tenantId: unit.tenant_id ?? null,
  };
}

function getTenantCode(): string | null {
  try {
    const raw = globalThis.localStorage?.getItem(TENANT_CONFIG_CACHE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { code?: string }).code ?? null;
  } catch {
    return null;
  }
}

function scopedKey(base: string, tenantCode: string | null): string {
  return tenantCode ? `${base}_${tenantCode}` : base;
}

function readStoredActiveUnit(): TenantUnitSummary | null {
  if (typeof globalThis === "undefined") {
    return null;
  }

  try {
    const tenantCode = getTenantCode();
    const raw = globalThis.localStorage.getItem(
      scopedKey(ACTIVE_UNIT_STORAGE_KEY, tenantCode),
    );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as TenantUnitSummary;
  } catch {
    return null;
  }
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

      // Resolve o tenant ativo a partir do tenant-code em cache. Sem este ID
      // não é possível garantir isolamento — retorna vazio sem fallback.
      const tenantCode = getTenantCode();
      if (!tenantCode) {
        return { data: { availableUnits: [], preferredActiveUnitId: null }, error: null };
      }

      const { data: tenantData, error: tenantError } = await client
        .from("tenants" as never)
        .select("id")
        .eq("code", tenantCode)
        .maybeSingle();

      if (tenantError) return { data: null, error: tenantError };

      const activeTenantId =
        (tenantData as unknown as { id: string } | null)?.id ?? null;

      if (!activeTenantId) {
        return { data: { availableUnits: [], preferredActiveUnitId: null }, error: null };
      }

      // Detecta gestor via tenant_users (fonte de verdade do papel).
      // Filtro por tenant_id garante que o vínculo é no tenant ativo, não em outro
      // tenant do mesmo projeto compartilhado.
      const { data: tenantUserData, error: tenantUserError } = await client
        .from("tenant_users" as never)
        .select("tenant_id")
        .eq("user_id", user.id)
        .eq("tenant_id", activeTenantId)
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
        const storedActiveUnit = readStoredActiveUnit();

        unitsQuery = unitsQuery.eq("tenant_id", gestorTenantId);

        const { data: units, error: unitsError } = await unitsQuery.order("name", {
          ascending: true,
        });

        if (unitsError) {
          return { data: null, error: unitsError };
        }

        const unitRows = (units ?? []) as unknown as SharedTenantUnitRow[];

        if (storedActiveUnit?.tenantId === gestorTenantId) {
          return {
            data: {
              availableUnits: unitRows.map(mapSharedUnitToSummary),
              preferredActiveUnitId: storedActiveUnit.id,
            },
            error: null,
          };
        }

        // Gestor (owner) inicia no portal administrativo do tenant quando nao
        // existe um polo explicitamente selecionado na sessao atual.
        return {
          data: {
            availableUnits: [],
            preferredActiveUnitId: null,
          },
          error: null,
        };
      } else {
        // Operador: lista apenas os polos vinculados no tenant ativo.
        // user_unit_memberships.tenant_id existe — filtro direto evita mistura
        // entre tenants num projeto compartilhado.
        const { data: memberships, error: membershipsError } = await client
          .from("user_unit_memberships" as never)
          .select("*")
          .eq("user_id", user.id)
          .eq("tenant_id", activeTenantId)
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

        unitsQuery = unitsQuery.eq("tenant_id", activeTenantId).in("id", unitIds);
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
