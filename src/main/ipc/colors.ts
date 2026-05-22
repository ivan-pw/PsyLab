/**
 * src/main/ipc/colors.ts
 *
 * IPC-домен `colors` — палитра заметок (plan §6.5: «Цвета заметок»).
 *
 * Удаление цвета, помеченного на заметках, ходит через replaceAndDelete:
 * сначала миграция color_id на toId (или NULL), потом DELETE. Транзакция.
 * UI до вызова сам спрашивает usageCount, чтобы показать диалог замены.
 */
import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import {
  countNotesUsingColor,
  createColor,
  listColors,
  reorderColors,
  replaceAndDeleteColor,
  updateColor
} from '../db/repositories/settingsRepo'
import {
  colorCreateInput,
  colorReorderInput,
  colorReplaceInput,
  colorUpdateInput
} from '@shared/schemas'
import { z } from 'zod'

const idInput = z.object({ id: z.number().int().positive() })

export function registerColorsIpc(): void {
  ipcMain.handle('colors:list', () => listColors(getDb()))

  ipcMain.handle('colors:create', (_e, raw) => {
    const input = colorCreateInput.parse(raw)
    return createColor(getDb(), input)
  })

  ipcMain.handle('colors:update', (_e, raw) => {
    const { id, patch } = colorUpdateInput.parse(raw)
    return updateColor(getDb(), id, patch)
  })

  ipcMain.handle('colors:usage-count', (_e, raw) => {
    const { id } = idInput.parse(raw)
    return countNotesUsingColor(getDb(), id)
  })

  ipcMain.handle('colors:replace-and-delete', (_e, raw) => {
    const { fromId, toId } = colorReplaceInput.parse(raw)
    replaceAndDeleteColor(getDb(), fromId, toId)
  })

  ipcMain.handle('colors:reorder', (_e, raw) => {
    const { ids } = colorReorderInput.parse(raw)
    reorderColors(getDb(), ids)
  })
}
