/**
 * src/main/ipc/meetingProtocols.ts
 *
 * IPC-домен `meetingProtocols`. 1:1 c встречами.
 */
import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import {
  createProtocol,
  deleteProtocol,
  getByMeeting,
  getProtocol,
  updateProtocol,
  upsertByMeeting
} from '../db/repositories/meetingProtocolsRepo'
import {
  protocolCreateInput,
  protocolGetByMeetingInput,
  protocolIdInput,
  protocolUpdateInput,
  protocolUpsertByMeetingInput
} from '@shared/schemas'

export function registerMeetingProtocolsIpc(): void {
  ipcMain.handle('meeting-protocols:get-by-meeting', (_e, raw) => {
    const { meetingId } = protocolGetByMeetingInput.parse(raw)
    return getByMeeting(getDb(), meetingId)
  })

  ipcMain.handle('meeting-protocols:get', (_e, raw) => {
    const { id } = protocolIdInput.parse(raw)
    return getProtocol(getDb(), id)
  })

  ipcMain.handle('meeting-protocols:create', (_e, raw) => {
    const { meetingId, input } = protocolCreateInput.parse(raw)
    return createProtocol(getDb(), meetingId, input)
  })

  ipcMain.handle('meeting-protocols:upsert-by-meeting', (_e, raw) => {
    const { meetingId, input } = protocolUpsertByMeetingInput.parse(raw)
    return upsertByMeeting(getDb(), meetingId, input)
  })

  ipcMain.handle('meeting-protocols:update', (_e, raw) => {
    const { id, patch } = protocolUpdateInput.parse(raw)
    return updateProtocol(getDb(), id, patch)
  })

  ipcMain.handle('meeting-protocols:delete', (_e, raw) => {
    const { id } = protocolIdInput.parse(raw)
    deleteProtocol(getDb(), id)
  })
}
