/**
 * src/main/ipc/meetings.ts
 *
 * IPC-домен `meetings`.
 */
import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import {
  createMeeting,
  deleteMeeting,
  listMeetingsByClient,
  listMeetingsInRange,
  updateMeeting
} from '../db/repositories/meetingsRepo'
import {
  meetingCreateInput,
  meetingIdInput,
  meetingListByClientInput,
  meetingListInRangeInput,
  meetingUpdateInput
} from '@shared/schemas'

export function registerMeetingsIpc(): void {
  ipcMain.handle('meetings:list-by-client', (_e, raw) => {
    const { clientId } = meetingListByClientInput.parse(raw)
    return listMeetingsByClient(getDb(), clientId)
  })

  ipcMain.handle('meetings:list-in-range', (_e, raw) => {
    const { from, to } = meetingListInRangeInput.parse(raw)
    return listMeetingsInRange(getDb(), from, to)
  })

  ipcMain.handle('meetings:create', (_e, raw) => {
    const input = meetingCreateInput.parse(raw)
    return createMeeting(getDb(), input)
  })

  ipcMain.handle('meetings:update', (_e, raw) => {
    const { id, patch } = meetingUpdateInput.parse(raw)
    return updateMeeting(getDb(), id, patch)
  })

  ipcMain.handle('meetings:delete', (_e, raw) => {
    const { id } = meetingIdInput.parse(raw)
    deleteMeeting(getDb(), id)
  })
}
