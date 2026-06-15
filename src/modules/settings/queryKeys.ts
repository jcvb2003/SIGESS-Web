export const settingsQueryKeys = {
  all: ["settings"] as const,
  localities: (unitId?: string | null) => ["localities", unitId ?? null] as const,
  portarias: (unitId?: string | null) => ["portarias", unitId ?? null] as const,
  documents: () => ["documents"] as const,
};
