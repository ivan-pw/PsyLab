/**
 * src/main/db/repositories/revisionsRepo.ts
 *
 * Чтение истории значений по одному полю клиента. Запись — только через
 * clientsRepo.updateClientField (там единая транзакция: ревизия + current_*).
 *
 * Сортировка — changed_at DESC (новое сверху). Индекс
 * idx_revisions_client_field покрывает этот запрос.
 */
import type { DbHandle } from '../connection'
import type { HistorizedField } from '@shared/historized'
import type { FieldRevision } from '@shared/types'

export function listRevisionsByField(
  db: DbHandle,
  clientId: number,
  field: HistorizedField
): FieldRevision[] {
  const rows = db
    .prepare<[number, string], Record<string, unknown>>(
      `SELECT * FROM client_field_revisions
       WHERE client_id = ? AND field_key = ?
       ORDER BY changed_at DESC, id DESC`
    )
    .all(clientId, field)
  return rows.map((r) => ({
    id: r.id as number,
    client_id: r.client_id as number,
    field_key: r.field_key as HistorizedField,
    value: (r.value as string | null) ?? null,
    changed_at: r.changed_at as string,
    note: (r.note as string | null) ?? null
  }))
}
