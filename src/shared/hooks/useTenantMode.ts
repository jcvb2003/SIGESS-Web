import { useEntityData } from './useEntityData';

export type TenantMode = 'pesca' | 'agricultura';

/**
 * Retorna a modalidade de produto do tenant.
 * Fallback resiliente: ausência, null ou erro → 'pesca' (caso dominante).
 * Não usar para branding/visual — apenas para gating de módulos e seções.
 */
export function useTenantMode(): TenantMode {
  const { entity } = useEntityData();
  return (entity?.tenantMode as TenantMode | undefined) ?? 'pesca';
}
