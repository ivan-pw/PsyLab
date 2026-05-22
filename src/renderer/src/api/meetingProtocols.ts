/**
 * src/renderer/src/api/meetingProtocols.ts
 */
import type { MeetingProtocolInput } from '@shared/types'

export const meetingProtocolsApi = {
  getByMeeting: (meetingId: number) =>
    window.api.meetingProtocols.getByMeeting(meetingId),
  get: (id: number) => window.api.meetingProtocols.get(id),
  upsertByMeeting: (meetingId: number, input: MeetingProtocolInput) =>
    window.api.meetingProtocols.upsertByMeeting(meetingId, input),
  delete: (id: number) => window.api.meetingProtocols.delete(id)
}
