/**
 * src/renderer/src/api/timeline.ts
 */
import type { TimelineQuery } from '@shared/types'

export const timelineApi = {
  byClient: (clientId: number, query?: TimelineQuery) =>
    window.api.timeline.byClient(clientId, query)
}
