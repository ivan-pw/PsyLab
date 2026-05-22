/**
 * src/renderer/src/api/clients.ts
 *
 * Типизированная обёртка над window.api.clients. Удобно мокать в тестах
 * и читать в хуках (см. hooks/useClients.ts).
 */
import type { ClientCreateInput, ClientProfileUpdate } from '@shared/types'
import type { HistorizedField } from '@shared/historized'

export const clientsApi = {
  list: (opts?: { includeArchived?: boolean }) => window.api.clients.list(opts),
  get: (id: number) => window.api.clients.get(id),
  create: (input: ClientCreateInput) => window.api.clients.create(input),
  updateProfile: (id: number, patch: ClientProfileUpdate) =>
    window.api.clients.updateProfile(id, patch),
  updateField: (
    id: number,
    field: HistorizedField,
    value: string | null,
    note?: string
  ) => window.api.clients.updateField(id, field, value, note),
  archive: (id: number) => window.api.clients.archive(id),
  restore: (id: number) => window.api.clients.restore(id),
  purge: (id: number) => window.api.clients.purge(id),
  emptyTrash: () => window.api.clients.emptyTrash()
}
