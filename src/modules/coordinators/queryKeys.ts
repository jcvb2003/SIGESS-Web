export const coordinatorQueryKeys = {
  all: ["coordinators"] as const,
  list: (unitId?: string | null) => ["coordinators", unitId ?? null] as const,
  members: (coordinatorId?: string | null) =>
    ["coordinators", "members", coordinatorId ?? null] as const,
};
