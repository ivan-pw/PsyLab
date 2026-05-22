/**
 * src/main/ipc/revisions.ts
 *
 * IPC-домен `revisions`:
 *  - revisions:list-by-field — история значений одного поля клиента;
 *  - revisions:delete — удалить отдельную ревизию (с пересчётом current_*
 *    если она была последней — см. deleteFieldRevision).
 *
 * Запись ревизий идёт через clients:update-field (см. clients.ts).
 */
import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { deleteFieldRevision } from '../db/repositories/clientsRepo'
import { listRevisionsByField } from '../db/repositories/revisionsRepo'
import { revisionIdInput, revisionsListByFieldInput } from '@shared/schemas'

export function registerRevisionsIpc(): void {
  ipcMain.handle('revisions:list-by-field', (_e, raw) => {
    const { clientId, field } = revisionsListByFieldInput.parse(raw)
    return listRevisionsByField(getDb(), clientId, field)
  })

  ipcMain.handle('revisions:delete', (_e, raw) => {
    const { id } = revisionIdInput.parse(raw)
    deleteFieldRevision(getDb(), id)
  })
}
