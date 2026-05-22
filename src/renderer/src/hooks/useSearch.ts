/**
 * src/renderer/src/hooks/useSearch.ts
 *
 * Глобальный поиск. Дебаунс на стороне вызывающего компонента —
 * хук просто принимает «уже отдебаунсенный» q и не выполняется при пустом.
 */
import { useQuery } from '@tanstack/react-query'
import { searchApi } from '@/api/search'
import type { SearchEntity } from '@shared/types'

export function useSearch(
  q: string,
  opts?: { entities?: SearchEntity[]; limit?: number }
) {
  const enabled = q.trim().length >= 1
  return useQuery({
    queryKey: ['search', q, opts] as const,
    queryFn: () => searchApi.query(q, opts),
    enabled,
    staleTime: 10_000
  })
}
