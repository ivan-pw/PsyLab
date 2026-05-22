/**
 * src/renderer/src/lib/medications.ts
 *
 * Сериализация значений поля «Медикаменты».
 *
 * В БД (`clients.current_medications` и `client_field_revisions.value`) одно
 * текстовое поле. Чтобы хранить несколько значений сразу — мы пишем туда
 * JSON-массив строк (`["Сертралин", "Феварин"]`).
 *
 * Чтение должно быть толерантно к старым форматам:
 *  - JSON-массив строк → как есть
 *  - просто строка → разбиваем по `;` / `\n` / `,` как best-effort
 *  - null/пусто → пустой массив
 *
 * Запись: если массив пустой → возвращаем `null` (сбрасываем поле — это видно
 * в таймлайне как «Очищено»). Иначе — `JSON.stringify(array)`.
 */
export function parseMedications(raw: string | null | undefined): string[] {
  if (!raw) return []
  const s = raw.trim()
  if (!s) return []
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s)
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x).trim()).filter((x) => x.length > 0)
      }
    } catch {
      // fall through to delimiter-based parsing
    }
  }
  return s
    .split(/[;\n,]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

export function stringifyMedications(values: string[]): string | null {
  const cleaned = Array.from(
    new Set(
      values
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
    )
  )
  if (cleaned.length === 0) return null
  return JSON.stringify(cleaned)
}

export function isMedicationsField(field: string | null | undefined): boolean {
  return field === 'medications'
}

/**
 * Удобное представление значения медикаментов в одной строке (для таймлайна,
 * истории, превью). Парсит JSON или старый разделённый формат и собирает
 * читабельную строку.
 */
export function medicationsToText(raw: string | null | undefined): string {
  const arr = parseMedications(raw)
  if (arr.length === 0) return ''
  return arr.join(', ')
}
