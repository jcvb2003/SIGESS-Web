import { usePermissions } from "@/shared/hooks/usePermissions";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";
import { getCurrentTenantConfig } from "@/config/tenants";

export function usePortalContext() {
  const {
    canAccessTenantAdministration,
    isEntityManager,
    isTenantAdministrationLoading,
    isAdmin,
    isSharedTenant,
  } = usePermissions();
  const { availableUnits, activeUnit, hydrated } = useTenantUnits();
  const tenantConfig = getCurrentTenantConfig();

  const hasPolos = tenantConfig?.hasPolos ?? false;
  const hasUnits = availableUnits.length > 0;

  // Shared com gestor (owner/presidente) OU isolated com admin e polos
  const isStatePortal =
    hydrated &&
    !activeUnit &&
    (
      (canAccessTenantAdministration && isEntityManager) ||
      (!isSharedTenant && isAdmin && hasPolos)
    );
  const isOperationalPortal = hydrated && !isStatePortal && (hasUnits || hasPolos);

  return {
    isPortalContextLoading: isTenantAdministrationLoading || !hydrated,
    isStatePortal,
    isOperationalPortal,
  };
}
