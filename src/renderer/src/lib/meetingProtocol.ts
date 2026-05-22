/**
 * src/renderer/src/lib/meetingProtocol.ts
 *
 * Метаданные подполей протокола встречи: подпись, порядок отображения,
 * подсказка. Используется в MeetingProtocolDialog и в TimelineItem.
 */
import type { MeetingProtocol } from '@shared/types'

export type ProtocolFieldKey =
  | 'summary'
  | 'techniques'
  | 'client_state'
  | 'homework'
  | 'plan_next'
  | 'private_notes'

export const PROTOCOL_FIELDS: Array<{
  key: ProtocolFieldKey
  label: string
  placeholder: string
}> = [
  {
    key: 'summary',
    label: 'Ход сессии',
    placeholder: 'О чём говорили, ключевые темы, важные моменты'
  },
  {
    key: 'techniques',
    label: 'Применённые техники',
    placeholder: 'Использованные методы, упражнения, интервенции'
  },
  {
    key: 'client_state',
    label: 'Состояние клиента',
    placeholder: 'Наблюдения: эмоции, динамика, инсайты'
  },
  {
    key: 'homework',
    label: 'Домашнее задание',
    placeholder: 'Что клиент должен сделать к следующей встрече'
  },
  {
    key: 'plan_next',
    label: 'План на следующую встречу',
    placeholder: 'На чём планируем сосредоточиться'
  },
  {
    key: 'private_notes',
    label: 'Приватные заметки',
    placeholder: 'Только для терапевта; гипотезы, идеи'
  }
]

export function protocolPreview(
  p: Pick<MeetingProtocol, 'summary' | 'plan_next' | 'client_state' | 'homework' | 'techniques' | 'private_notes'>
): string | null {
  return (
    p.summary?.trim() ||
    p.plan_next?.trim() ||
    p.client_state?.trim() ||
    p.homework?.trim() ||
    p.techniques?.trim() ||
    p.private_notes?.trim() ||
    null
  )
}
