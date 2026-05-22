/**
 * src/main/ipc/search.ts
 *
 * IPC-домен `search`. Один канал — глобальный полнотекстовый поиск.
 */
import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { searchQuery } from '../db/repositories/searchRepo'
import { searchQueryInput } from '@shared/schemas'

export function registerSearchIpc(): void {
  ipcMain.handle('search:query', (_e, raw) => {
    const { q, entities, limit } = searchQueryInput.parse(raw)
    return searchQuery(getDb(), q, { entities, limit })
  })
}
