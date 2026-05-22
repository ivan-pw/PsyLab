/**
 * src/main/db/repositories/anamnesesRepo.ts
 *
 * CRUD по таблице anamneses. Каждая запись — это полный «снимок» анамнеза
 * во времени; обновление меняет существующую запись, а не создаёт новую
 * (история — это сам список разнесённых по taken_on записей).
 *
 * payload_text для таймлайна вычисляется в VIEW client_timeline через
 * COALESCE(complaints, notes, life_history) — см. 001_init.sql.
 */
import type { DbHandle } from '../connection'
import type { Anamnesis, AnamnesisInput } from '@shared/types'

const ANAMNESIS_BODY_FIELDS = [
  'complaints',
  'life_history',
  'family_history',
  'medical_history',
  'mental_history',
  'substances',
  'notes'
] as const

function nowIso(): string {
  return new Date().toISOString()
}

function rowToAnamnesis(row: Record<string, unknown>): Anamnesis {
  return {
    id: row.id as number,
    client_id: row.client_id as number,
    taken_on: row.taken_on as string,
    complaints: (row.complaints as string | null) ?? null,
    life_history: (row.life_history as string | null) ?? null,
    family_history: (row.family_history as string | null) ?? null,
    medical_history: (row.medical_history as string | null) ?? null,
    mental_history: (row.mental_history as string | null) ?? null,
    substances: (row.substances as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string
  }
}

export function listAnamnesesByClient(db: DbHandle, clientId: number): Anamnesis[] {
  return db
    .prepare<[number], Record<string, unknown>>(
      `SELECT * FROM anamneses
       WHERE client_id = ?
       ORDER BY taken_on DESC, id DESC`
    )
    .all(clientId)
    .map(rowToAnamnesis)
}

export function getAnamnesis(db: DbHandle, id: number): Anamnesis {
  const row = db
    .prepare<[number], Record<string, unknown>>('SELECT * FROM anamneses WHERE id = ?')
    .get(id)
  if (!row) throw new Error(`Анамнез ${id} не найден`)
  return rowToAnamnesis(row)
}

export function createAnamnesis(
  db: DbHandle,
  clientId: number,
  input: AnamnesisInput
): Anamnesis {
  const now = nowIso()
  const result = db
    .prepare<
      [
        number,
        string,
        string | null,
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
      `INSERT INTO anamneses
         (client_id, taken_on, complaints, life_history, family_history,
          medical_history, mental_history, substances, notes,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      clientId,
      input.taken_on,
      input.complaints ?? null,
      input.life_history ?? null,
      input.family_history ?? null,
      input.medical_history ?? null,
      input.mental_history ?? null,
      input.substances ?? null,
      input.notes ?? null,
      now,
      now
    )
  return getAnamnesis(db, Number(result.lastInsertRowid))
}

export function updateAnamnesis(
  db: DbHandle,
  id: number,
  patch: Partial<AnamnesisInput>
): Anamnesis {
  const sets: string[] = []
  const params: unknown[] = []

  if (patch.taken_on !== undefined) {
    sets.push('taken_on = ?')
    params.push(patch.taken_on)
  }
  for (const f of ANAMNESIS_BODY_FIELDS) {
    if (patch[f] !== undefined) {
      sets.push(`${f} = ?`)
      params.push(patch[f] ?? null)
    }
  }
  if (sets.length === 0) return getAnamnesis(db, id)

  sets.push('updated_at = ?')
  params.push(nowIso())
  params.push(id)

  db.prepare(`UPDATE anamneses SET ${sets.join(', ')} WHERE id = ?`).run(...params)
  return getAnamnesis(db, id)
}

export function deleteAnamnesis(db: DbHandle, id: number): void {
  db.prepare('DELETE FROM anamneses WHERE id = ?').run(id)
}
