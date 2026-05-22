/**
 * src/renderer/src/api/meetings.ts
 */
import type { MeetingInput } from '@shared/types'

export const meetingsApi = {
  listByClient: (clientId: number) => window.api.meetings.listByClient(clientId),
  listInRange: (from: string, to: string) => window.api.meetings.listInRange(from, to),
  create: (input: MeetingInput) => window.api.meetings.create(input),
  update: (id: number, patch: Partial<MeetingInput>) =>
    window.api.meetings.update(id, patch),
  delete: (id: number) => window.api.meetings.delete(id)
}
