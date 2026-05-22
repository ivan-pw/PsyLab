/**
 * src/main/db/repositories/settingsRepo.ts
 *
 * Доступ к таблице `settings` (key/value, value — JSON-строка) и к таблице
 * `note_colors` (палитра, настраивается пользователем).
 *
 * Этап 1: read-only хелперы для smoke-проверок и чтения локали/темы.
 * Этап 5: добавлены CRUD по палитре + защита от удаления использованного
 * цвета (replaceAndDeleteColor: транзакция UPDATE+DELETE).
 */
import type { DbHandle } from '../connection'
import type { NoteColor, NoteColorInput } from '@shared/types'

type Row = { value: string }

export function getSetting<T = unknown>(db: DbHandle, key: string): T | undefined {
  const row = db.prepare<[string], Row>('SELECT value FROM settings WHERE key = ?').get(key)
  if (!row) return undefined
  try {
    return JSON.parse(row.value) as T
  } catch {
    return undefined
  }
}

export function setSetting(db: DbHandle, key: string, value: unknown): void {
  const json = JSON.stringify(value)
  db.prepare<[string, string]>(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, json)
}

export function listSettings(db: DbHandle): Record<string, unknown> {
  const rows = db
    .prepare<[], { key: string; value: string }>('SELECT key, value FROM settings')
    .all()
  const out: Record<string, unknown> = {}
  for (const { key, value } of rows) {
    try {
      out[key] = JSON.parse(value)
    } catch {
      out[key] = value
    }
  }
  return out
}

// ─── Палитра заметок ────────────────────────────────────────────────────────

function rowToColor(row: Record<string, unknown>): NoteColor {
  return {
    id: row.id as number,
    hex: row.hex as string,
    label: row.label as string,
    sort_order: (row.sort_order as number | null) ?? 0
  }
}

export function listColors(db: DbHandle): NoteColor[] {
  return db
    .prepare<[], Record<string, unknown>>(
      'SELECT * FROM note_colors ORDER BY sort_order, id'
    )
    .all()
    .map(rowToColor)
}

export function createColor(db: DbHandle, input: NoteColorInput): NoteColor {
  const nextOrder =
    input.sort_order ??
    ((db
      .prepare<[], { m: number | null }>('SELECT MAX(sort_order) AS m FROM note_colors')
      .get()?.m ?? 0) +
      1)

  const result = db
    .prepare<[string, string, number]>(
      'INSERT INTO note_colors (hex, label, sort_order) VALUES (?, ?, ?)'
    )
    .run(input.hex, input.label, nextOrder)
  return getColor(db, Number(result.lastInsertRowid))
}

function getColor(db: DbHandle, id: number): NoteColor {
  const row = db
    .prepare<[number], Record<string, unknown>>('SELECT * FROM note_colors WHERE id = ?')
    .get(id)
  if (!row) throw new Error(`Цвет ${id} не найден`)
  return rowToColor(row)
}

export function updateColor(
  db: DbHandle,
  id: number,
  patch: Partial<NoteColorInput>
): NoteColor {
  const sets: string[] = []
  const params: unknown[] = []
  if (patch.hex !== undefined) {
    sets.push('hex = ?')
    params.push(patch.hex)
  }
  if (patch.label !== undefined) {
    sets.push('label = ?')
    params.push(patch.label)
  }
  if (patch.sort_order !== undefined) {
    sets.push('sort_order = ?')
    params.push(patch.sort_order)
  }
  if (sets.length === 0) return getColor(db, id)

  params.push(id)
  db.prepare(`UPDATE note_colors SET ${sets.join(', ')} WHERE id = ?`).run(...params)
  return getColor(db, id)
}

export function countNotesUsingColor(db: DbHandle, id: number): number {
  const row = db
    .prepare<[number], { c: number }>('SELECT COUNT(*) AS c FROM notes WHERE color_id = ?')
    .get(id)
  return row?.c ?? 0
}

/**
 * Удалить цвет. Если toId !== null — сначала переносим все заметки на toId,
 * иначе сбрасываем color_id в NULL. Транзакция, чтобы не было полу-состояния.
 *
 * ON DELETE RESTRICT в схеме запрещает удалить цвет с привязанными заметками
 * напрямую — поэтому здесь сначала перенос, потом DELETE.
 */
export function replaceAndDeleteColor(
  db: DbHandle,
  fromId: number,
  toId: number | null
): void {
  if (fromId === toId) throw new Error('Нельзя заменить цвет самим собой')

  const tx = db.transaction(() => {
    db.prepare<[number | null, number]>(
      'UPDATE notes SET color_id = ?, updated_at = updated_at WHERE color_id = ?'
    ).run(toId, fromId)
    db.prepare<[number]>('DELETE FROM note_colors WHERE id = ?').run(fromId)
  })
  tx()
}

export function reorderColors(db: DbHandle, ids: number[]): void {
  const stmt = db.prepare<[number, number]>(
    'UPDATE note_colors SET sort_order = ? WHERE id = ?'
  )
  const tx = db.transaction(() => {
    ids.forEach((id, i) => stmt.run(i + 1, id))
  })
  tx()
}
