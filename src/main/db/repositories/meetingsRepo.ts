/**
 * src/main/db/repositories/meetingsRepo.ts
 *
 * CRUD по таблице meetings. Без хитростей: сама встреча — это одна строка,
 * историзация полей здесь не нужна (комментарий, время и статус можно
 * редактировать поверх).
 *
 * listInRange используется для подгрузки событий в большом календаре —
 * выбираем по starts_at, чтобы оставаться внутри индекса idx_meetings_starts_at.
 */
import type { DbHandle } from '../connection'
import type { Meeting, MeetingInput, MeetingStatus } from '@shared/types'

function nowIso(): string {
  return new Date().toISOString()
}

function rowToMeeting(row: Record<string, unknown>): Meeting {
  return {
    id: row.id as number,
    client_id: row.client_id as number,
    starts_at: row.starts_at as string,
    ends_at: row.ends_at as string,
    status: row.status as MeetingStatus,
    comment: (row.comment as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string
  }
}

export function listMeetingsByClient(db: DbHandle, clientId: number): Meeting[] {
  return db
    .prepare<[number], Record<string, unknown>>(
      'SELECT * FROM meetings WHERE client_id = ? ORDER BY starts_at DESC'
    )
    .all(clientId)
    .map(rowToMeeting)
}

export function listMeetingsInRange(db: DbHandle, from: string, to: string): Meeting[] {
  return db
    .prepare<[string, string], Record<string, unknown>>(
      'SELECT * FROM meetings WHERE starts_at >= ? AND starts_at < ? ORDER BY starts_at'
    )
    .all(from, to)
    .map(rowToMeeting)
}

export function getMeeting(db: DbHandle, id: number): Meeting {
  const row = db
    .prepare<[number], Record<string, unknown>>('SELECT * FROM meetings WHERE id = ?')
    .get(id)
  if (!row) throw new Error(`Встреча ${id} не найдена`)
  return rowToMeeting(row)
}

export function createMeeting(db: DbHandle, input: MeetingInput): Meeting {
  const now = nowIso()
  const result = db
    .prepare<
      [number, string, string, MeetingStatus, string | null, string, string]
    >(
      `INSERT INTO meetings (client_id, starts_at, ends_at, status, comment, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.client_id,
      input.starts_at,
      input.ends_at,
      input.status,
      input.comment ?? null,
      now,
      now
    )
  return getMeeting(db, Number(result.lastInsertRowid))
}

export function updateMeeting(
  db: DbHandle,
  id: number,
  patch: Partial<MeetingInput>
): Meeting {
  const sets: string[] = []
  const params: unknown[] = []

  if (patch.starts_at !== undefined) {
    sets.push('starts_at = ?')
    params.push(patch.starts_at)
  }
  if (patch.ends_at !== undefined) {
    sets.push('ends_at = ?')
    params.push(patch.ends_at)
  }
  if (patch.status !== undefined) {
    sets.push('status = ?')
    params.push(patch.status)
  }
  if (patch.comment !== undefined) {
    sets.push('comment = ?')
    params.push(patch.comment ?? null)
  }
  if (sets.length === 0) return getMeeting(db, id)

  sets.push('updated_at = ?')
  params.push(nowIso())
  params.push(id)

  db.prepare(`UPDATE meetings SET ${sets.join(', ')} WHERE id = ?`).run(...params)
  return getMeeting(db, id)
}

export function deleteMeeting(db: DbHandle, id: number): void {
  db.prepare('DELETE FROM meetings WHERE id = ?').run(id)
}
