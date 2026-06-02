import { usePermissions } from "@/shared/hooks/usePermissions";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

export function usePortalContext() {
  const {
    canAccessTenantAdministration,
    isEntityManager,
    isTenantAdministrationLoading,
    isAdmin,
    isSharedTenant,
  } = usePermissions();
  const { availableUnits, activeUnit, hydrated } = useTenantUnits();

  const hasUnits = availableUnits.length > 0;

  // Shared com gestor (owner/presidente) OU isolated com admin e polos
  const isStatePortal =
    hydrated &&
    !activeUnit &&
    (
      (canAccessTenantAdministration && isEntityManager) ||
      (!isSharedTenant && isAdmin && hasUnits)
    );
  const isOperationalPortal = hydrated && !isStatePortal && hasUnits;

  return {
    isPortalContextLoading: isTenantAdministrationLoading || !hydrated,
    isStatePortal,
    isOperationalPortal,
  };
}
