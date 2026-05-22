/**
 * src/renderer/src/pages/Settings/index.tsx
 *
 * Страница настроек: разделы внутри Accordion. Несколько секций могут быть
 * открыты одновременно (type="multiple"); по умолчанию первая раскрытая —
 * «Безопасность» (часто запрашиваемая настройка), остальные свёрнуты.
 */
import { useShellTitle } from '@/components/Layout/AppShell'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { ColorPaletteSettings } from '@/components/Settings/ColorPaletteSettings'
import { MedicationPresetsSettings } from '@/components/Settings/MedicationPresetsSettings'
import { SecuritySettings } from '@/components/Settings/SecuritySettings'
import { BackupSettings } from '@/components/Settings/BackupSettings'
import { TrashSettings } from '@/components/Settings/TrashSettings'

export default function SettingsPage() {
  useShellTitle('Настройки')

  return (
    <div className="mx-auto h-full max-w-2xl overflow-auto p-6">
      <Accordion
        type="multiple"
        defaultValue={['security']}
        className="w-full"
      >
        <AccordionItem value="security">
          <AccordionTrigger>Безопасность</AccordionTrigger>
          <AccordionContent>
            <SecuritySettings />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="colors">
          <AccordionTrigger>Цвета заметок</AccordionTrigger>
          <AccordionContent>
            <ColorPaletteSettings />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="medications">
          <AccordionTrigger>Медикаменты — пресеты</AccordionTrigger>
          <AccordionContent>
            <MedicationPresetsSettings />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="data">
          <AccordionTrigger>Резервные копии и экспорт</AccordionTrigger>
          <AccordionContent>
            <BackupSettings />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="trash">
          <AccordionTrigger>Корзина</AccordionTrigger>
          <AccordionContent>
            <TrashSettings />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
