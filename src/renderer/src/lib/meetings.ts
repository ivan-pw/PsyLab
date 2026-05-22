/**
 * src/renderer/src/lib/meetings.ts
 *
 * Утилиты для работы с временами встреч в UI.
 *  - localDateTimeInput: ISO → "YYYY-MM-DDTHH:MM" для <input type="datetime-local">;
 *  - inputToIso: обратно;
 *  - roundUpToHour: округляет дату вверх до ближайшего часа (для удобного дефолта
 *    при клике по дню в month view);
 *  - DEFAULT_SESSION_MINUTES — длительность сессии по умолчанию (50 мин).
 *    Будет читаться из settings.default_session_minutes в этапе 6.
 */
import type { MeetingStatus } from '@shared/types'

export const DEFAULT_SESSION_MINUTES = 50

export function localDateTimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}

export function inputToIso(local: string): string {
  // datetime-local не несёт TZ; интерпретируем как локальное время.
  return new Date(local).toISOString()
}

export function isoToLocalInput(iso: string): string {
  return localDateTimeInput(new Date(iso))
}

export function roundUpToHour(d: Date): Date {
  const x = new Date(d)
  x.setMinutes(0, 0, 0)
  if (x <= d) x.setHours(x.getHours() + 1)
  return x
}

export function addMinutes(d: Date, mins: number): Date {
  const x = new Date(d)
  x.setMinutes(x.getMinutes() + mins)
  return x
}

export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  planned: 'Запланирована',
  done: 'Проведена',
  cancelled: 'Отменена'
}

export const MEETING_STATUS_ACCENT: Record<MeetingStatus, string> = {
  planned: '#3b82f6',
  done: '#22c55e',
  cancelled: '#6b7280'
}
