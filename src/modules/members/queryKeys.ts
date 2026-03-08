import type { MemberSearchParams } from './types/member.types'

export const memberQueryKeys = {
  all: ['members'] as const,
  list: (params: MemberSearchParams) => [...memberQueryKeys.all, 'list', params] as const,
  localities: () => [...memberQueryKeys.all, 'localities'] as const,
}
