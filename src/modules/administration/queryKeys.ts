export const administrationQueryKeys = {
  all: ["administration"] as const,
  tenantUnits: () => ["administration", "tenant-units"] as const,
  tenantUsers: () => ["administration", "tenant-users"] as const,
  tenantMemberships: () => ["administration", "tenant-memberships"] as const,
  unitStats: () => ["administration", "unit-stats"] as const,
  pendingRequirements: () => ["administration", "pending-requirements"] as const,
  defaulters: () => ["administration", "defaulters"] as const,
};
