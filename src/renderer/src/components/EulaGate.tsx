/**
 * src/renderer/src/components/EulaGate.tsx
 *
 * Шлюз пользовательского соглашения.
 *
 * Логика:
 *  - Активируется только после unlock (хук useSettingQuery сам отключён,
 *    пока БД закрыта). До unlock — children рендерятся как есть, диалога нет.
 *  - Читает settings.eula_accepted_version. Если оно совпадает с
 *    CURRENT_EULA_VERSION — пропускает дальше. Иначе блокирует UI диалогом
 *    с двумя кнопками: «Принимаю» (пишет версию в settings) и «Не принимаю»
 *    (вызывает app.quit() — без согласия дальше не идём).
 *  - Пока идёт загрузка значения настройки — children тоже не показываем,
 *    чтобы не мигало.
 */
import { useState } from 'react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/components/ui/sonner'
import { useAuthStore } from '@/store/authStore'
import { useLocaleStore } from '@/store/localeStore'
import { useSettingMutation, useSettingQuery } from '@/hooks/useSetting'
import {
  CURRENT_EULA_VERSION,
  EULA_TEXT_EN,
  EULA_TEXT_RU
} from '@/lib/eula'

export function EulaGate({ children }: { children: React.ReactNode }) {
  const unlocked = useAuthStore((s) => s.unlocked)
  const locale = useLocaleStore((s) => s.locale)
  const { data: accepted, isFetched } = useSettingQuery<number | null>(
    'eula_accepted_version',
    null
  )
  const setAccepted = useSettingMutation('eula_accepted_version')
  const [busy, setBusy] = useState(false)

  // До разлочки делать ничего не надо — пропускаем (UnlockPage увидит свой UI).
  if (!unlocked) return <>{children}</>

  // Пока запрос настройки в полёте — не показываем главный UI, чтобы он не
  // успел отрисоваться и сразу «прикрыться» диалогом.
  if (!isFetched) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">…</div>
      </div>
    )
  }

  const consented =
    typeof accepted === 'number' && accepted >= CURRENT_EULA_VERSION
  if (consented) return <>{children}</>

  async function accept() {
    setBusy(true)
    try {
      await setAccepted.mutateAsync(CURRENT_EULA_VERSION)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  function decline() {
    // Без согласия дальше не идём.
    void window.api.app.quit()
  }

  const text = locale === 'en' ? EULA_TEXT_EN : EULA_TEXT_RU

  return (
    <>
      {/* children рендерятся «под» диалогом, чтобы не мигать чёрным фоном */}
      <div aria-hidden className="pointer-events-none opacity-50 blur-sm">
        {children}
      </div>
      <Dialog open modal>
        <DialogContent
          className="max-w-2xl"
          // Не даём закрыть Escape'ом или кликом вне.
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-primary" />
              {locale === 'en' ? 'License & Disclaimer' : 'Соглашение и отказ от гарантий'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'en'
                ? 'Please read the terms before continuing.'
                : 'Прочитайте условия перед началом работы.'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[55vh] rounded-md border bg-card/40 p-4">
            {/*
              whitespace-pre-line: `\n` → визуальный перенос, при этом
              длинные строки переносятся по словам через стандартный wrap.
              break-words на случай очень длинных «слов» (URL, идентификаторы).
            */}
            <div className="whitespace-pre-line break-words text-sm leading-relaxed text-foreground">
              {text}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={decline}
              disabled={busy}
            >
              {locale === 'en' ? 'Decline & quit' : 'Не принимаю — выйти'}
            </Button>
            <Button type="button" onClick={() => void accept()} disabled={busy}>
              {busy
                ? '…'
                : locale === 'en'
                  ? 'I accept'
                  : 'Принимаю'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
