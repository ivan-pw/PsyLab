/**
 * src/renderer/src/components/ConfirmDestructiveDialog.tsx
 *
 * Реюзабельный диалог подтверждения удаления.
 *
 * Чтобы случайным кликом не снести что-то ценное, требуем ввод слова —
 * «удалить» (ru) или «delete» (en). Слово приходит из i18n, ключ
 * `destructive.word`, чтобы при смене языка ожидаемое значение менялось.
 *
 * Кнопка «Удалить навсегда» активна только когда введённое значение
 * совпадает (без учёта регистра и пробелов по краям).
 */
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  open: boolean
  /** Что именно удаляется — короткое описание. Пример: «эту встречу». */
  itemLabel?: string
  /** Дополнительный текст под основным предупреждением. */
  extraWarning?: string
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

export function ConfirmDestructiveDialog({
  open,
  itemLabel,
  extraWarning,
  busy,
  onCancel,
  onConfirm
}: Props) {
  const { t } = useTranslation()
  const requiredWord = t('destructive.word')
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open) setValue('')
  }, [open])

  const match = value.trim().toLowerCase() === requiredWord.toLowerCase()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-destructive" />
            {t('destructive.title')}
          </DialogTitle>
          <DialogDescription>
            {t('destructive.warning', { word: requiredWord })}
            {itemLabel && (
              <>
                <br />
                <span className="text-foreground">{itemLabel}</span>
              </>
            )}
            {extraWarning && (
              <>
                <br />
                {extraWarning}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('destructive.input_placeholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && match && !busy) void onConfirm()
          }}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={!match || busy}
          >
            {busy ? '…' : t('destructive.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
