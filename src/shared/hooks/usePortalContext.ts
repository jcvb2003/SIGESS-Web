import { usePermissions } from "@/shared/hooks/usePermissions";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

export function usePortalContext() {
  const {
    canAccessTenantAdministration,
    isTenantAdministrationLoading,
  } = usePermissions();
  const { availableUnits, activeUnit, bootstrapped } = useTenantUnits();

  const isStatePortal =
    canAccessTenantAdministration && bootstrapped && !activeUnit;
  const isOperationalPortal = bootstrapped && !isStatePortal && availableUnits.length > 0;

  return {
    isPortalContextLoading: isTenantAdministrationLoading || !bootstrapped,
    isStatePortal,
    isOperationalPortal,
  };
}
