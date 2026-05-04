import type { MemberSearchParams } from "./types/member.types";
export const memberQueryKeys = {
  all: ["members"] as const,
  list: (params: MemberSearchParams) =>
    [...memberQueryKeys.all, "list", params] as const,
  detail: (id: string) => ["member", id] as const,
  count: () => [...memberQueryKeys.all, "count"] as const,
};
