import type { DocumentSearchParams } from './types/document.types'

export const documentQueryKeys = {
  all: ['documents'] as const,
  list: (params: DocumentSearchParams) => [...documentQueryKeys.all, 'list', params] as const,
}
