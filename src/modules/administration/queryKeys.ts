export const administrationQueryKeys = {
  all: ["administration"] as const,
  tenantUnits: () => ["administration", "tenant-units"] as const,
};
