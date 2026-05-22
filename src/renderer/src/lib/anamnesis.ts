/**
 * src/renderer/src/lib/anamnesis.ts
 *
 * Метаданные структурного анамнеза для UI: подписи и порядок отображения
 * подполей в форме и в раскрытой карточке.
 *
 * Превью для таймлайна (anamnesisPreview) — короткая строка из первого
 * непустого подполя в порядке complaints → notes → life_history.
 * В таймлайн VIEW client_timeline эту же логику делает COALESCE,
 * но в renderer бывает удобно посчитать локально (например, на свежесозданном
 * анамнезе до инвалидации запроса).
 */
import type { Anamnesis } from '@shared/types'

export type AnamnesisFieldKey =
  | 'complaints'
  | 'life_history'
  | 'family_history'
  | 'medical_history'
  | 'mental_history'
  | 'substances'
  | 'notes'

export const ANAMNESIS_FIELDS: Array<{ key: AnamnesisFieldKey; label: string }> = [
  { key: 'complaints', label: 'Жалобы' },
  { key: 'life_history', label: 'Анамнез жизни' },
  { key: 'family_history', label: 'Семейный анамнез' },
  { key: 'medical_history', label: 'Соматический анамнез' },
  { key: 'mental_history', label: 'Психический анамнез' },
  { key: 'substances', label: 'ПАВ' },
  { key: 'notes', label: 'Заметки' }
]

export function anamnesisPreview(a: Pick<Anamnesis, 'complaints' | 'notes' | 'life_history'>): string | null {
  return a.complaints?.trim() || a.notes?.trim() || a.life_history?.trim() || null
}

export function todayIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
