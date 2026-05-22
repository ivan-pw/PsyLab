/**
 * src/renderer/src/components/ClientFields/PermanentFieldsPanel.tsx
 *
 * Правая верхняя панель карточки клиента (plan §6.3).
 * Показывает текущие значения 6 историзируемых полей: диагноз, медикаменты,
 * мессенджер, телефон, email, видео-ссылка.
 *
 * Анамнезы здесь не отображаются — только кнопка «+ Новый анамнез».
 * Сами карточки видны в таймлайне (раскрываются по клику).
 */
import { FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditableField } from './EditableField'
import { MedicationsField } from './MedicationsField'
import { HISTORIZED_FIELDS } from '@/lib/historized'
import type { Client } from '@shared/types'
import type { HistorizedField } from '@shared/historized'

const currentKeyMap: Record<HistorizedField, keyof Client> = {
  phone: 'current_phone',
  email: 'current_email',
  messenger: 'current_messenger',
  video_link: 'current_video_link',
  diagnosis: 'current_diagnosis',
  medications: 'current_medications'
}

// Порядок отображения — как в макете (plan §6.3).
const DISPLAY_ORDER: HistorizedField[] = [
  'diagnosis',
  'medications',
  'messenger',
  'phone',
  'email',
  'video_link'
]

type Props = {
  client: Client
  onAddAnamnesis?: () => void
}

export function PermanentFieldsPanel({ client, onAddAnamnesis }: Props) {
  return (
    <div className="rounded-lg border bg-card p-3 text-card-foreground">
      <div className="divide-y">
        {DISPLAY_ORDER.map((field) => {
          if (!HISTORIZED_FIELDS.includes(field)) return null
          const value = (client[currentKeyMap[field]] as string | null) ?? null
          // Медикаменты — multi-select с автодополнением, остальные поля —
          // обычный текстовый редактор.
          if (field === 'medications') {
            return (
              <MedicationsField
                key={field}
                clientId={client.id}
                value={value}
              />
            )
          }
          return (
            <EditableField
              key={field}
              clientId={client.id}
              field={field}
              value={value}
            />
          )
        })}
      </div>
      <div className="mt-3 border-t pt-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onAddAnamnesis}
          disabled={!onAddAnamnesis}
        >
          <FilePlus className="size-4" />
          Новый анамнез
        </Button>
      </div>
    </div>
  )
}
