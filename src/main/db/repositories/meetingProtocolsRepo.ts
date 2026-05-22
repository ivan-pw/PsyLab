/**
 * src/main/db/repositories/meetingProtocolsRepo.ts
 *
 * CRUD по таблице meeting_protocols (1:1 c meetings).
 *
 * upsertByMeeting — основной метод для UI: «сохранить протокол этой
 * встречи», без необходимости знать, был ли он до этого. Идемпотентен:
 * при наличии существующего апдейтит, иначе создаёт.
 *
 * При создании автоматически тянем client_id из meetings, чтобы избежать
 * рассинхронизации (нельзя создать протокол клиента А на встрече клиента Б).
 */
import type { DbHandle } from '../connection'
import type { MeetingProtocol, MeetingProtocolInput } from '@shared/types'

function nowIso(): string {
  return new Date().toISOString()
}

function rowToProtocol(row: Record<string, unknown>): MeetingProtocol {
  return {
    id: row.id as number,
    meeting_id: row.meeting_id as number,
    client_id: row.client_id as number,
    summary: (row.summary as string | null) ?? null,
    techniques: (row.techniques as string | null) ?? null,
    client_state: (row.client_state as string | null) ?? null,
    homework: (row.homework as string | null) ?? null,
    plan_next: (row.plan_next as string | null) ?? null,
    private_notes: (row.private_notes as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string
  }
}

function clientIdOfMeeting(db: DbHandle, meetingId: number): number {
  const row = db
    .prepare<[number], { client_id: number }>(
      'SELECT client_id FROM meetings WHERE id = ?'
    )
    .get(meetingId)
  if (!row) throw new Error(`Встреча ${meetingId} не найдена`)
  return row.client_id
}

export function getByMeeting(
  db: DbHandle,
  meetingId: number
): MeetingProtocol | null {
  const row = db
    .prepare<[number], Record<string, unknown>>(
      'SELECT * FROM meeting_protocols WHERE meeting_id = ?'
    )
    .get(meetingId)
  return row ? rowToProtocol(row) : null
}

export function getProtocol(db: DbHandle, id: number): MeetingProtocol {
  const row = db
    .prepare<[number], Record<string, unknown>>(
      'SELECT * FROM meeting_protocols WHERE id = ?'
    )
    .get(id)
  if (!row) throw new Error(`Протокол ${id} не найден`)
  return rowToProtocol(row)
}

export function createProtocol(
  db: DbHandle,
  meetingId: number,
  input: MeetingProtocolInput
): MeetingProtocol {
  const existing = getByMeeting(db, meetingId)
  if (existing) {
    throw new Error('Для этой встречи протокол уже существует')
  }
  const clientId = clientIdOfMeeting(db, meetingId)
  const now = nowIso()
  const result = db
    .prepare<
      [
        number,
        number,
        string | null,
        string | null,
        string | null,
        string | null,
        string | null,
        string | null,
        string,
        string
      ]
    >(
      `INSERT INTO meeting_protocols
         (meeting_id, client_id, summary, techniques, client_state,
          homework, plan_next, private_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      meetingId,
      clientId,
      input.summary ?? null,
      input.techniques ?? null,
      input.client_state ?? null,
      input.homework ?? null,
      input.plan_next ?? null,
      input.private_notes ?? null,
      now,
      now
    )
  return getProtocol(db, Number(result.lastInsertRowid))
}

export function updateProtocol(
  db: DbHandle,
  id: number,
  patch: MeetingProtocolInput
): MeetingProtocol {
  const sets: string[] = []
  const params: unknown[] = []
  const map: Array<[keyof MeetingProtocolInput, string]> = [
    ['summary', 'summary'],
    ['techniques', 'techniques'],
    ['client_state', 'client_state'],
    ['homework', 'homework'],
    ['plan_next', 'plan_next'],
    ['private_notes', 'private_notes']
  ]
  for (const [k, col] of map) {
    if (patch[k] !== undefined) {
      sets.push(`${col} = ?`)
      params.push(patch[k] ?? null)
    }
  }
  if (sets.length === 0) return getProtocol(db, id)

  sets.push('updated_at = ?')
  params.push(nowIso())
  params.push(id)
  db.prepare(`UPDATE meeting_protocols SET ${sets.join(', ')} WHERE id = ?`).run(
    ...params
  )
  return getProtocol(db, id)
}

export function upsertByMeeting(
  db: DbHandle,
  meetingId: number,
  input: MeetingProtocolInput
): MeetingProtocol {
  const existing = getByMeeting(db, meetingId)
  if (existing) return updateProtocol(db, existing.id, input)
  return createProtocol(db, meetingId, input)
}

export function deleteProtocol(db: DbHandle, id: number): void {
  db.prepare('DELETE FROM meeting_protocols WHERE id = ?').run(id)
}
