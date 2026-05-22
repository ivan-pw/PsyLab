/**
 * src/main/ipc/clients.ts
 *
 * IPC-домен `clients`. Все ключи каналов соответствуют плану §5.
 * Validate input via zod, then delegate to clientsRepo.
 */
import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import {
  archiveClient,
  createClient,
  emptyTrash,
  getClient,
  listClients,
  purgeClient,
  restoreClient,
  updateClientField,
  updateClientProfile
} from '../db/repositories/clientsRepo'
import {
  clientCreateInput,
  clientGetInput,
  clientIdInput,
  clientUpdateFieldInput,
  clientUpdateProfileInput,
  clientsListInput
} from '@shared/schemas'

export function registerClientsIpc(): void {
  ipcMain.handle('clients:list', (_e, raw) => {
    const opts = clientsListInput.parse(raw)
    return listClients(getDb(), opts)
  })

  ipcMain.handle('clients:get', (_e, raw) => {
    const { id } = clientGetInput.parse(raw)
    return getClient(getDb(), id)
  })

  ipcMain.handle('clients:create', (_e, raw) => {
    const input = clientCreateInput.parse(raw)
    return createClient(getDb(), input)
  })

  ipcMain.handle('clients:update-profile', (_e, raw) => {
    const { id, patch } = clientUpdateProfileInput.parse(raw)
    return updateClientProfile(getDb(), id, patch)
  })

  ipcMain.handle('clients:update-field', (_e, raw) => {
    const { id, field, value, note } = clientUpdateFieldInput.parse(raw)
    return updateClientField(getDb(), id, field, value, note)
  })

  ipcMain.handle('clients:archive', (_e, raw) => {
    const { id } = clientIdInput.parse(raw)
    archiveClient(getDb(), id)
  })

  ipcMain.handle('clients:restore', (_e, raw) => {
    const { id } = clientIdInput.parse(raw)
    restoreClient(getDb(), id)
  })

  ipcMain.handle('clients:purge', (_e, raw) => {
    const { id } = clientIdInput.parse(raw)
    purgeClient(getDb(), id)
  })

  ipcMain.handle('clients:empty-trash', () => {
    emptyTrash(getDb())
  })
}
