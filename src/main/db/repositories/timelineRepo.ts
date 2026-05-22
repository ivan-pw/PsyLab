/**
 * src/main/db/repositories/timelineRepo.ts
 *
 * Выборка из VIEW client_timeline. Сама склейка событий (встречи,
 * ревизии, анамнезы, заметки, факт создания клиента) выполнена
 * непосредственно в VIEW — здесь только фильтры и сортировка.
 *
 * Параметры:
 *  - clientId — обязательный
 *  - from/to — необязательный диапазон по полю `at` (ISO timestamp)
 *  - kinds — допустимые типы событий
 *  - limit — ограничение количества (по умолчанию 500)
 *
 * Возвращает события, отсортированные по at DESC.
 */
import type { DbHandle } from '../connection'
import type { TimelineEvent, TimelineKind, TimelineQuery } from '@shared/types'

const DEFAULT_LIMIT = 500
const MAX_LIMIT = 2000

export function listClientTimeline(
  db: DbHandle,
  clientId: number,
  query?: TimelineQuery
): TimelineEvent[] {
  const wheres: string[] = ['client_id = ?']
  const params: unknown[] = [clientId]

  if (query?.from) {
    wheres.push('at >= ?')
    params.push(query.from)
  }
  if (query?.to) {
    wheres.push('at <= ?')
    params.push(query.to)
  }
  if (query?.kinds && query.kinds.length > 0) {
    const placeholders = query.kinds.map(() => '?').join(',')
    wheres.push(`kind IN (${placeholders})`)
    params.push(...query.kinds)
  }

  const limit = Math.min(query?.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
  params.push(limit)

  const sql = `SELECT * FROM client_timeline
               WHERE ${wheres.join(' AND ')}
               ORDER BY at DESC, ref_id DESC
               LIMIT ?`

  const rows = db.prepare<unknown[], Record<string, unknown>>(sql).all(...params)
  return rows.map((r) => ({
    kind: r.kind as TimelineKind,
    ref_id: r.ref_id as number,
    client_id: r.client_id as number,
    at: r.at as string,
    payload_text: (r.payload_text as string | null) ?? null,
    aux1: (r.aux1 as string | null) ?? null,
    aux2: (r.aux2 as string | null) ?? null,
    extra: (r.extra as string | null) ?? null
  }))
}
