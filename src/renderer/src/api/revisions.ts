/**
 * src/renderer/src/api/revisions.ts
 */
import type { HistorizedField } from '@shared/historized'

export const revisionsApi = {
  listByField: (clientId: number, field: HistorizedField) =>
    window.api.revisions.listByField(clientId, field)
}
