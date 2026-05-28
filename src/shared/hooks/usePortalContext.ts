import { usePermissions } from "@/shared/hooks/usePermissions";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

export function usePortalContext() {
  const { canAccessTenantAdministration, isTenantAdministrationLoading } = usePermissions();
  const { availableUnits, hydrated } = useTenantUnits();

  const isStatePortal = canAccessTenantAdministration && hydrated && availableUnits.length === 0;
  const isOperationalPortal = hydrated && availableUnits.length > 0;

  return {
    isPortalContextLoading: isTenantAdministrationLoading || !hydrated,
    isStatePortal,
    isOperationalPortal,
  };
}
