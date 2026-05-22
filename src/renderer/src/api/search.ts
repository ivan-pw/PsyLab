/**
 * src/renderer/src/api/search.ts
 */
import type { SearchEntity } from '@shared/types'

export const searchApi = {
  query: (q: string, opts?: { entities?: SearchEntity[]; limit?: number }) =>
    window.api.search.query(q, opts)
}
