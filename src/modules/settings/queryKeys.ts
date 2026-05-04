export const settingsQueryKeys = {
  all: ["settings"] as const,
  localities: () => ["localities"] as const,
  documents: () => ["documents"] as const,
};
