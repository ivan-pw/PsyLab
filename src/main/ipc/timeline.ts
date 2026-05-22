/**
 * src/main/ipc/timeline.ts
 *
 * IPC-домен `timeline`. Возвращает агрегированную ленту событий клиента
 * из VIEW client_timeline.
 */
import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { listClientTimeline } from '../db/repositories/timelineRepo'
import { timelineByClientInput } from '@shared/schemas'

export function registerTimelineIpc(): void {
  ipcMain.handle('timeline:by-client', (_e, raw) => {
    const { clientId, query } = timelineByClientInput.parse(raw)
    return listClientTimeline(getDb(), clientId, query)
  })
}
