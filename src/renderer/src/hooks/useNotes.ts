/**
 * src/renderer/src/hooks/useNotes.ts
 *
 * Список заметок клиента и мутации. Любая мутация инвалидирует список
 * и таймлайн клиента (заметка тоже событие).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notesApi } from '@/api/notes'
import { clientsKeys } from './useClients'

export const notesKeys = {
  byClient: (clientId: number) => ['notes', 'by-client', clientId] as const
}

export function useNotesByClient(clientId: number | null | undefined) {
  return useQuery({
    queryKey: clientId ? notesKeys.byClient(clientId) : ['notes', 'none'],
    queryFn: () => notesApi.listByClient(clientId as number),
    enabled: Boolean(clientId)
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>, clientId: number) {
  void qc.invalidateQueries({ queryKey: notesKeys.byClient(clientId) })
  void qc.invalidateQueries({ queryKey: clientsKeys.timeline(clientId) })
}

export function useCreateNote(clientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { color_id: number | null; body: string }) =>
      notesApi.create({ client_id: clientId, ...input }),
    onSuccess: () => invalidate(qc, clientId)
  })
}

export function useUpdateNote(clientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch
    }: {
      id: number
      patch: { color_id?: number | null; body?: string }
    }) => notesApi.update(id, patch),
    onSuccess: () => invalidate(qc, clientId)
  })
}

export function useDeleteNote(clientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => notesApi.delete(id),
    onSuccess: () => invalidate(qc, clientId)
  })
}
