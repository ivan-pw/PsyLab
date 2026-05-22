/**
 * src/renderer/src/lib/format.ts
 *
 * Утилиты форматирования дат и текста, используются по всему UI.
 * Локаль пока захардкожена ru — i18n настроим в этапе 6.
 */
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'd MMM yyyy', { locale: ru })
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'd MMM yyyy, HH:mm', { locale: ru })
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { locale: ru, addSuffix: true })
}

export function truncate(s: string | null | undefined, max = 120): string {
  if (!s) return ''
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…'
}
