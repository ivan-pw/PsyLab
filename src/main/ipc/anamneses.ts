/**
 * src/main/ipc/anamneses.ts
 *
 * IPC-домен `anamneses`. Структурный анамнез: список по клиенту,
 * получение полной карточки (для раскрытия из таймлайна),
 * создание/обновление/удаление.
 */
import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import {
  createAnamnesis,
  deleteAnamnesis,
  getAnamnesis,
  listAnamnesesByClient,
  updateAnamnesis
} from '../db/repositories/anamnesesRepo'
import {
  anamnesisCreateInput,
  anamnesisIdInput,
  anamnesisListByClientInput,
  anamnesisUpdateInput
} from '@shared/schemas'

export function registerAnamnesesIpc(): void {
  ipcMain.handle('anamneses:list-by-client', (_e, raw) => {
    const { clientId } = anamnesisListByClientInput.parse(raw)
    return listAnamnesesByClient(getDb(), clientId)
  })

  ipcMain.handle('anamneses:get', (_e, raw) => {
    const { id } = anamnesisIdInput.parse(raw)
    return getAnamnesis(getDb(), id)
  })

  ipcMain.handle('anamneses:create', (_e, raw) => {
    const { client_id, input } = anamnesisCreateInput.parse(raw)
    return createAnamnesis(getDb(), client_id, input)
  })

  ipcMain.handle('anamneses:update', (_e, raw) => {
    const { id, patch } = anamnesisUpdateInput.parse(raw)
    return updateAnamnesis(getDb(), id, patch)
  })

  ipcMain.handle('anamneses:delete', (_e, raw) => {
    const { id } = anamnesisIdInput.parse(raw)
    deleteAnamnesis(getDb(), id)
  })
}
