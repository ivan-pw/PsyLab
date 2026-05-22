/**
 * src/renderer/src/components/ui/sonner.tsx
 *
 * Обёртка над sonner, чтобы тосты подхватывали нашу тему.
 */
import { Toaster as SonnerToaster, toast } from 'sonner'
import { useThemeStore } from '@/store/themeStore'

export function Toaster() {
  const theme = useThemeStore((s) => s.theme)
  // sonner принимает 'light' | 'dark' | 'system' — у нас совпадает один-в-один.
  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'border-border'
        }
      }}
    />
  )
}

export { toast }
