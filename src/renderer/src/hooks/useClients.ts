/**
 * src/renderer/src/hooks/useClients.ts
 *
 * Хуки TanStack Query для CRUD по клиентам.
 * Мутации инвалидируют список и (если применимо) карточку клиента
 * и его таймлайн.
 *
 * Ключи запросов держим централизованно в clientsKeys для удобства.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '@/api/clients'
import type {
  Client,
  ClientCreateInput,
  ClientProfileUpdate,
  FieldRevision
} from '@shared/types'
import type { HistorizedField } from '@shared/historized'

export const clientsKeys = {
  all: ['clients'] as const,
  list: (opts?: { includeArchived?: boolean }) => ['clients', 'list', opts] as const,
  detail: (id: number) => ['clients', 'detail', id] as const,
  timeline: (id: number) => ['clients', 'timeline', id] as const,
  revisions: (id: number, field: HistorizedField) =>
    ['clients', 'revisions', id, field] as const
}

export function useClients(opts?: { includeArchived?: boolean }) {
  return useQuery({
    queryKey: clientsKeys.list(opts),
    queryFn: () => clientsApi.list(opts)
  })
}

export function useClient(id: number | null | undefined) {
  return useQuery({
    queryKey: id ? clientsKeys.detail(id) : ['clients', 'detail', 'none'],
    queryFn: () => clientsApi.get(id as number),
    enabled: Boolean(id)
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ClientCreateInput) => clientsApi.create(input),
    onSuccess: (client: Client) => {
      void qc.invalidateQueries({ queryKey: clientsKeys.all })
      qc.setQueryData(clientsKeys.detail(client.id), client)
    }
  })
}

export function useUpdateClientProfile(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: ClientProfileUpdate) => clientsApi.updateProfile(id, patch),
    onSuccess: (client: Client) => {
      qc.setQueryData(clientsKeys.detail(client.id), client)
      void qc.invalidateQueries({ queryKey: clientsKeys.all })
      void qc.invalidateQueries({ queryKey: clientsKeys.timeline(id) })
    }
  })
}

export function useUpdateClientField(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      field,
      value,
      note
    }: {
      field: HistorizedField
      value: string | null
      note?: string
    }) => clientsApi.updateField(id, field, value, note),
    onSuccess: (rev: FieldRevision) => {
      // Перечитать карточку клиента (там обновился current_*),
      // таймлайн (там новая ревизия) и саму историю поля.
      void qc.invalidateQueries({ queryKey: clientsKeys.detail(id) })
      void qc.invalidateQueries({ queryKey: clientsKeys.timeline(id) })
      void qc.invalidateQueries({
        queryKey: clientsKeys.revisions(id, rev.field_key)
      })
      void qc.invalidateQueries({ queryKey: clientsKeys.all })
    }
  })
}

export function useArchiveClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => clientsApi.archive(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: clientsKeys.all })
  })
}

export function useRestoreClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => clientsApi.restore(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: clientsKeys.all })
  })
}
