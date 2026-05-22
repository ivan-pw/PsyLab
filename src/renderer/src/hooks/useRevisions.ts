/**
 * src/renderer/src/hooks/useRevisions.ts
 *
 * История значений одного поля клиента. Используется в
 * RevisionHistoryPopover (см. components/ClientFields).
 *
 * `enabled: false` по умолчанию: история подгружается только когда
 * пользователь открывает popover. Это экономит запросы для 6 полей × N клиентов.
 */
import { useQuery } from '@tanstack/react-query'
import { revisionsApi } from '@/api/revisions'
import type { HistorizedField } from '@shared/historized'
import { clientsKeys } from './useClients'

export function useRevisionsByField(
  clientId: number,
  field: HistorizedField,
  enabled = false
) {
  return useQuery({
    queryKey: clientsKeys.revisions(clientId, field),
    queryFn: () => revisionsApi.listByField(clientId, field),
    enabled
  })
}
