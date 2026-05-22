/**
 * src/main/db/repositories/searchRepo.ts
 *
 * Глобальный поиск через FTS5 (search_index).
 *
 * Запрос пользователя нормализуем минимально: FTS5 сам справляется со
 * стеммингом-токенизацией. Чтобы поиск был «по началу слова», добавляем
 * `*` к каждому токену длиной 2+ — типичный приём для FTS5.
 *
 * Результаты:
 *  - sortable: FTS5 даёт BM25-like rank; чем меньше — тем релевантнее.
 *  - JOIN clients только чтобы вернуть client_name (renderer не дёргает второй запрос).
 *  - snippet: используем встроенный snippet() для подсветки.
 */
import type { DbHandle } from '../connection'
import type { SearchEntity, SearchHit } from '@shared/types'

const DEFAULT_LIMIT = 30

function normalize(q: string): string {
  // Раскладываем на токены и навешиваем * для prefix-search.
  // Спец-символы FTS5 экранируем удалением — пользователь обычно вводит обычные слова.
  return q
    .split(/\s+/)
    .map((t) => t.replace(/["'*()]/g, '').trim())
    .filter((t) => t.length > 0)
    .map((t) => (t.length >= 2 ? `${t}*` : t))
    .join(' ')
}

export function searchQuery(
  db: DbHandle,
  q: string,
  opts?: { entities?: SearchEntity[]; limit?: number }
): SearchHit[] {
  const fts = normalize(q)
  if (!fts) return []

  const limit = Math.min(opts?.limit ?? DEFAULT_LIMIT, 100)
  const entities = opts?.entities

  const filters: string[] = []
  const params: unknown[] = [fts]
  if (entities && entities.length > 0) {
    filters.push(`s.entity_type IN (${entities.map(() => '?').join(',')})`)
    params.push(...entities)
  }
  params.push(limit)

  const sql = `
    SELECT
      s.entity_type AS entity_type,
      s.entity_id   AS entity_id,
      s.client_id   AS client_id,
      snippet(search_index, 3, '«', '»', '…', 16) AS snippet,
      c.full_name   AS client_name
    FROM search_index s
    LEFT JOIN clients c ON c.id = s.client_id
    WHERE search_index MATCH ?
      ${filters.length > 0 ? 'AND ' + filters.join(' AND ') : ''}
    ORDER BY rank
    LIMIT ?
  `

  const rows = db
    .prepare<unknown[], Record<string, unknown>>(sql)
    .all(...params)

  return rows.map((r) => ({
    entity_type: r.entity_type as SearchEntity,
    entity_id: r.entity_id as number,
    client_id: r.client_id as number,
    snippet: (r.snippet as string | null) ?? '',
    client_name: (r.client_name as string | null) ?? null
  }))
}
