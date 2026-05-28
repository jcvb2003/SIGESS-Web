import { usePermissions } from "@/shared/hooks/usePermissions";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

export function usePortalContext() {
  const {
    canAccessTenantAdministration,
    isEntityManager,
    isTenantAdministrationLoading,
  } = usePermissions();
  const { availableUnits, hydrated } = useTenantUnits();

  const isStatePortal =
    canAccessTenantAdministration && isEntityManager && hydrated;
  const isOperationalPortal = hydrated && !isStatePortal && availableUnits.length > 0;

  return {
    isPortalContextLoading: isTenantAdministrationLoading || !hydrated,
    isStatePortal,
    isOperationalPortal,
  };
}
