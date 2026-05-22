/**
 * src/renderer/src/lib/historized.ts
 *
 * Метаинформация об историзируемых полях клиента — для UI:
 *  - label  — подпись в карточке клиента;
 *  - icon   — иконка lucide-react (используется в PermanentFields);
 *  - parseExternal — превращение значения поля в URL для shell.openExternal:
 *    мессенджер и видео-ссылка — кликабельны (см. plan.md §6.3),
 *    email/phone — открываются как mailto/tel в системном приложении.
 *
 * Сами имена полей и их whitelist живут в @shared/historized, чтобы main
 * и renderer ссылались на один источник.
 */
import {
  HISTORIZED_FIELDS,
  isHistorizedField,
  type HistorizedField
} from '@shared/historized'
import {
  Mail,
  MessageCircle,
  Phone,
  Pill,
  Stethoscope,
  Video,
  type LucideIcon
} from 'lucide-react'

export type HistorizedFieldMeta = {
  label: string
  icon: LucideIcon
  placeholder: string
  multiline?: boolean
}

export const HISTORIZED_FIELD_META: Record<HistorizedField, HistorizedFieldMeta> = {
  phone: { label: 'Телефон', icon: Phone, placeholder: '+7 999 123-45-67' },
  email: { label: 'Email', icon: Mail, placeholder: 'name@example.com' },
  messenger: {
    label: 'Мессенджер',
    icon: MessageCircle,
    placeholder: 'telegram:@username, https://…'
  },
  video_link: {
    label: 'Видео-ссылка',
    icon: Video,
    placeholder: 'https://meet.jit.si/…'
  },
  diagnosis: {
    label: 'Диагноз',
    icon: Stethoscope,
    placeholder: 'Текущий диагноз',
    multiline: true
  },
  medications: {
    label: 'Медикаменты',
    icon: Pill,
    placeholder: 'Перечислите препараты',
    multiline: true
  }
}

export { HISTORIZED_FIELDS, isHistorizedField }
export type { HistorizedField }

/**
 * Парсит значение поля и пытается превратить его в кликабельный URL.
 * Возвращает null, если ссылку построить не получилось.
 */
export function parseExternalUrl(field: HistorizedField, value: string): string | null {
  const v = value.trim()
  if (!v) return null

  if (/^https?:\/\//i.test(v)) return v

  if (field === 'phone') {
    const digits = v.replace(/[^\d+]/g, '')
    if (digits) return `tel:${digits}`
    return null
  }

  if (field === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? `mailto:${v}` : null
  }

  if (field === 'messenger') {
    const tg = v.match(/^(?:telegram|tg)\s*[:\s]\s*@?([\w_]+)/i)
    if (tg?.[1]) return `https://t.me/${tg[1]}`
    const wa = v.match(/^(?:whatsapp|wa)\s*[:\s]\s*\+?([\d-]+)/i)
    if (wa?.[1]) return `https://wa.me/${wa[1].replace(/-/g, '')}`
    return null
  }

  return null
}
