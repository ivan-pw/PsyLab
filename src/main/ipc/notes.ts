/**
 * src/main/ipc/notes.ts
 *
 * IPC-домен `notes`. CRUD заметок клиента.
 */
import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import {
  createNote,
  deleteNote,
  listNotesByClient,
  updateNote
} from '../db/repositories/notesRepo'
import {
  noteCreateInput,
  noteIdInput,
  noteListByClientInput,
  noteUpdateInput
} from '@shared/schemas'

export function registerNotesIpc(): void {
  ipcMain.handle('notes:list-by-client', (_e, raw) => {
    const { clientId } = noteListByClientInput.parse(raw)
    return listNotesByClient(getDb(), clientId)
  })

  ipcMain.handle('notes:create', (_e, raw) => {
    const input = noteCreateInput.parse(raw)
    return createNote(getDb(), input)
  })

  ipcMain.handle('notes:update', (_e, raw) => {
    const { id, patch } = noteUpdateInput.parse(raw)
    return updateNote(getDb(), id, patch)
  })

  ipcMain.handle('notes:delete', (_e, raw) => {
    const { id } = noteIdInput.parse(raw)
    deleteNote(getDb(), id)
  })
}
