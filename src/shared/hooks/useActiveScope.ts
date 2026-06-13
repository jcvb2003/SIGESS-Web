import { useTenantUnits } from '@/modules/tenant-units/context/TenantUnitContext';

export interface ActiveScope {
  unitId: string | null;
  tenantId: string | null;
  bootstrapped: boolean;
}

export function useActiveScope(): ActiveScope {
  const { activeUnit, bootstrapped } = useTenantUnits();
  return {
    unitId: activeUnit?.id ?? null,
    tenantId: activeUnit?.tenantId ?? null,
    bootstrapped,
  };
}
