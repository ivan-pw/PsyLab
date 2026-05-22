/**
 * src/main/db/repositories/notesRepo.ts
 *
 * CRUD заметок. Минимум полей: body + опциональный color_id из палитры.
 *
 * Заметки уже попадают в таймлайн через VIEW client_timeline; здесь сама
 * запись/чтение — без хитростей.
 */
import type { DbHandle } from '../connection'
import type { Note } from '@shared/types'

function nowIso(): string {
  return new Date().toISOString()
}

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as number,
    client_id: row.client_id as number,
    color_id: (row.color_id as number | null) ?? null,
    body: row.body as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string
  }
}

export function listNotesByClient(db: DbHandle, clientId: number): Note[] {
  return db
    .prepare<[number], Record<string, unknown>>(
      'SELECT * FROM notes WHERE client_id = ? ORDER BY updated_at DESC, id DESC'
    )
    .all(clientId)
    .map(rowToNote)
}

export function getNote(db: DbHandle, id: number): Note {
  const row = db
    .prepare<[number], Record<string, unknown>>('SELECT * FROM notes WHERE id = ?')
    .get(id)
  if (!row) throw new Error(`Заметка ${id} не найдена`)
  return rowToNote(row)
}

export function createNote(
  db: DbHandle,
  input: { client_id: number; color_id: number | null; body: string }
): Note {
  const now = nowIso()
  const result = db
    .prepare<[number, number | null, string, string, string]>(
      `INSERT INTO notes (client_id, color_id, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(input.client_id, input.color_id, input.body, now, now)
  return getNote(db, Number(result.lastInsertRowid))
}

export function updateNote(
  db: DbHandle,
  id: number,
  patch: { color_id?: number | null; body?: string }
): Note {
  const sets: string[] = []
  const params: unknown[] = []
  if (patch.color_id !== undefined) {
    sets.push('color_id = ?')
    params.push(patch.color_id)
  }
  if (patch.body !== undefined) {
    sets.push('body = ?')
    params.push(patch.body)
  }
  if (sets.length === 0) return getNote(db, id)

  sets.push('updated_at = ?')
  params.push(nowIso())
  params.push(id)

  db.prepare(`UPDATE notes SET ${sets.join(', ')} WHERE id = ?`).run(...params)
  return getNote(db, id)
}

export function deleteNote(db: DbHandle, id: number): void {
  db.prepare('DELETE FROM notes WHERE id = ?').run(id)
}
