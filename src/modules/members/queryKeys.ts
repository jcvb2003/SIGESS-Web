import type { MemberSearchParams } from "./types/member.types";

type MemberListQueryParams = MemberSearchParams & {
  _unitId?: string | null;
};

export const memberQueryKeys = {
  all: ["members"] as const,
  list: (params: MemberListQueryParams) =>
    [...memberQueryKeys.all, "list", params] as const,
  detail: (id: string) => ["member", id] as const,
  count: (unitId?: string | null) => [...memberQueryKeys.all, "count", unitId ?? null] as const,
};
