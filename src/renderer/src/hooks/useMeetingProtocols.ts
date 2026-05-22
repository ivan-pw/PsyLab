/**
 * src/renderer/src/hooks/useMeetingProtocols.ts
 *
 * Запросы по протоколам встреч. Любая мутация инвалидирует:
 *  - конкретный протокол (by meeting + by id),
 *  - таймлайн клиента (kind='protocol' появляется/исчезает).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { meetingProtocolsApi } from '@/api/meetingProtocols'
import { clientsKeys } from './useClients'
import type { MeetingProtocolInput } from '@shared/types'

export const protocolKeys = {
  byMeeting: (meetingId: number) =>
    ['meeting-protocols', 'by-meeting', meetingId] as const,
  detail: (id: number) => ['meeting-protocols', 'detail', id] as const
}

export function useProtocolByMeeting(meetingId: number | null | undefined) {
  return useQuery({
    queryKey: meetingId
      ? protocolKeys.byMeeting(meetingId)
      : ['meeting-protocols', 'by-meeting', 'none'],
    queryFn: () => meetingProtocolsApi.getByMeeting(meetingId as number),
    enabled: Boolean(meetingId)
  })
}

export function useUpsertProtocol(meetingId: number, clientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MeetingProtocolInput) =>
      meetingProtocolsApi.upsertByMeeting(meetingId, input),
    onSuccess: (p) => {
      qc.setQueryData(protocolKeys.byMeeting(meetingId), p)
      qc.setQueryData(protocolKeys.detail(p.id), p)
      void qc.invalidateQueries({ queryKey: clientsKeys.timeline(clientId) })
    }
  })
}

export function useDeleteProtocol(meetingId: number, clientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => meetingProtocolsApi.delete(id),
    onSuccess: () => {
      qc.setQueryData(protocolKeys.byMeeting(meetingId), null)
      void qc.invalidateQueries({ queryKey: clientsKeys.timeline(clientId) })
    }
  })
}
