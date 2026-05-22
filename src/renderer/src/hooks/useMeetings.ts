/**
 * src/renderer/src/hooks/useMeetings.ts
 *
 * Запросы по встречам:
 *  - useMeetingsInRange — основной источник событий для большого календаря;
 *  - useMeetingsByClient — список встреч на странице клиента.
 *
 * Любая мутация инвалидирует обе ветки кеша и таймлайн всех клиентов
 * (поскольку встреча тоже попадает в таймлайн).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meetingsApi } from '@/api/meetings'
import { clientsKeys } from './useClients'
import type { MeetingInput } from '@shared/types'

export const meetingsKeys = {
  all: ['meetings'] as const,
  byClient: (clientId: number) => ['meetings', 'by-client', clientId] as const,
  inRange: (from: string, to: string) => ['meetings', 'in-range', from, to] as const
}

export function useMeetingsByClient(clientId: number | null | undefined) {
  return useQuery({
    queryKey: clientId ? meetingsKeys.byClient(clientId) : ['meetings', 'none'],
    queryFn: () => meetingsApi.listByClient(clientId as number),
    enabled: Boolean(clientId)
  })
}

export function useMeetingsInRange(from: string, to: string) {
  return useQuery({
    queryKey: meetingsKeys.inRange(from, to),
    queryFn: () => meetingsApi.listInRange(from, to)
  })
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>, clientId: number) {
  void qc.invalidateQueries({ queryKey: meetingsKeys.all })
  void qc.invalidateQueries({ queryKey: clientsKeys.timeline(clientId) })
  void qc.invalidateQueries({ queryKey: clientsKeys.all })
}

export function useCreateMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MeetingInput) => meetingsApi.create(input),
    onSuccess: (m) => invalidateAll(qc, m.client_id)
  })
}

export function useUpdateMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<MeetingInput> }) =>
      meetingsApi.update(id, patch),
    onSuccess: (m) => invalidateAll(qc, m.client_id)
  })
}

export function useDeleteMeeting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, clientId: _clientId }: { id: number; clientId: number }) =>
      meetingsApi.delete(id),
    onSuccess: (_void, { clientId }) => invalidateAll(qc, clientId)
  })
}
