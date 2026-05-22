/**
 * src/renderer/src/hooks/useClientTimeline.ts
 *
 * Лента событий клиента. Запрос автоматически инвалидируется любыми
 * мутациями над клиентом (см. useClients), поэтому в самой странице
 * детали клиента нам ничего пере-вызывать не нужно.
 */
import { useQuery } from '@tanstack/react-query'
import { timelineApi } from '@/api/timeline'
import type { TimelineQuery } from '@shared/types'
import { clientsKeys } from './useClients'

export function useClientTimeline(
  clientId: number | null | undefined,
  query?: TimelineQuery
) {
  return useQuery({
    queryKey: clientId
      ? [...clientsKeys.timeline(clientId), query ?? null]
      : ['clients', 'timeline', 'none'],
    queryFn: () => timelineApi.byClient(clientId as number, query),
    enabled: Boolean(clientId)
  })
}
