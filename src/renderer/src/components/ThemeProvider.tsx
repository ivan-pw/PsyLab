/**
 * src/renderer/src/components/ThemeProvider.tsx
 *
 * Применяет тему к <html>:
 *  - 'light' / 'dark' — добавляет/убирает класс `dark`;
 *  - 'system'        — слушает matchMedia('(prefers-color-scheme: dark)').
 *
 * Источник правды — useThemeStore (он же синхронизирует выбор с settings).
 * Стилизация привязана к классу `.dark` в src/renderer/src/styles/globals.css.
 */
import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

function applyClass(isDark: boolean): void {
  document.documentElement.classList.toggle('dark', isDark)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    if (theme === 'dark' || theme === 'light') {
      applyClass(theme === 'dark')
      return
    }
    // theme === 'system'
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    applyClass(mq.matches)
    const onChange = (e: MediaQueryListEvent) => applyClass(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  return <>{children}</>
}
