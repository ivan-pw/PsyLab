/**
 * src/main/db/repositories/medicationPresetsRepo.ts
 *
 * Справочник пресетов медикаментов (UI-автодополнение). Сами значения,
 * присвоенные клиенту, хранятся отдельно в client_field_revisions /
 * clients.current_medications как JSON-массив строк.
 *
 * UNIQUE COLLATE NOCASE на name — не даёт двух одинаковых «Сертралин» и
 * «сертралин» одновременно. Удаление пресета не трогает уже сохранённые
 * значения у клиентов.
 */
import type { DbHandle } from '../connection'
import type { MedicationPreset, MedicationPresetInput } from '@shared/types'

function rowToPreset(row: Record<string, unknown>): MedicationPreset {
  return {
    id: row.id as number,
    name: row.name as string,
    sort_order: (row.sort_order as number | null) ?? 0
  }
}

export function listMedicationPresets(db: DbHandle): MedicationPreset[] {
  return db
    .prepare<[], Record<string, unknown>>(
      'SELECT * FROM medication_presets ORDER BY sort_order, id'
    )
    .all()
    .map(rowToPreset)
}

function getById(db: DbHandle, id: number): MedicationPreset {
  const row = db
    .prepare<[number], Record<string, unknown>>(
      'SELECT * FROM medication_presets WHERE id = ?'
    )
    .get(id)
  if (!row) throw new Error(`Пресет медикамента ${id} не найден`)
  return rowToPreset(row)
}

export function createMedicationPreset(
  db: DbHandle,
  input: MedicationPresetInput
): MedicationPreset {
  const nextOrder =
    input.sort_order ??
    ((db
      .prepare<[], { m: number | null }>('SELECT MAX(sort_order) AS m FROM medication_presets')
      .get()?.m ?? 0) +
      1)

  const result = db
    .prepare<[string, number]>(
      'INSERT INTO medication_presets (name, sort_order) VALUES (?, ?)'
    )
    .run(input.name, nextOrder)
  return getById(db, Number(result.lastInsertRowid))
}

export function updateMedicationPreset(
  db: DbHandle,
  id: number,
  patch: Partial<MedicationPresetInput>
): MedicationPreset {
  const sets: string[] = []
  const params: unknown[] = []
  if (patch.name !== undefined) {
    sets.push('name = ?')
    params.push(patch.name)
  }
  if (patch.sort_order !== undefined) {
    sets.push('sort_order = ?')
    params.push(patch.sort_order)
  }
  if (sets.length === 0) return getById(db, id)
  params.push(id)
  db.prepare(`UPDATE medication_presets SET ${sets.join(', ')} WHERE id = ?`).run(...params)
  return getById(db, id)
}

export function deleteMedicationPreset(db: DbHandle, id: number): void {
  db.prepare('DELETE FROM medication_presets WHERE id = ?').run(id)
}

export function reorderMedicationPresets(db: DbHandle, ids: number[]): void {
  const stmt = db.prepare<[number, number]>(
    'UPDATE medication_presets SET sort_order = ? WHERE id = ?'
  )
  const tx = db.transaction(() => {
    ids.forEach((id, i) => stmt.run(i + 1, id))
  })
  tx()
}
