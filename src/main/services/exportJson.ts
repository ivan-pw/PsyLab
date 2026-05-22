/**
 * src/main/services/exportJson.ts
 *
 * «Расшифрованный» экспорт всех данных в один JSON-файл (план §0 #26).
 *
 * Использовать с осторожностью: файл содержит данные в открытом виде.
 * UI обязан показать предупреждение перед запуском.
 */
import { writeFileSync } from 'node:fs'
import type { DbHandle } from '../db/connection'

type ExportPayload = {
  generated_at: string
  schema_version: number
  clients: unknown[]
  client_field_revisions: unknown[]
  anamneses: unknown[]
  meetings: unknown[]
  notes: unknown[]
  note_colors: unknown[]
  settings: unknown[]
}

export function exportToJson(db: DbHandle, dstPath: string): void {
  const schemaVersion = (db.pragma('user_version', { simple: true }) as number) ?? 0
  const dump = (sql: string): unknown[] => db.prepare(sql).all()

  const payload: ExportPayload = {
    generated_at: new Date().toISOString(),
    schema_version: schemaVersion,
    clients: dump('SELECT * FROM clients ORDER BY id'),
    client_field_revisions: dump(
      'SELECT * FROM client_field_revisions ORDER BY id'
    ),
    anamneses: dump('SELECT * FROM anamneses ORDER BY id'),
    meetings: dump('SELECT * FROM meetings ORDER BY id'),
    notes: dump('SELECT * FROM notes ORDER BY id'),
    note_colors: dump('SELECT * FROM note_colors ORDER BY id'),
    settings: dump('SELECT * FROM settings ORDER BY key')
  }

  writeFileSync(dstPath, JSON.stringify(payload, null, 2), { mode: 0o600 })
}
