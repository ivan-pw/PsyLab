/**
 * src/renderer/src/store/themeStore.ts
 *
 * Тема приложения: 'system' (по умолчанию) | 'light' | 'dark'.
 * Резолв в фактический класс на <html> делается в ThemeProvider — он же
 * слушает matchMedia('prefers-color-scheme') при theme='system'.
 */
import { create } from 'zustand'
import { settingsApi } from '@/api/settings'
import type { Theme } from '@shared/types'

type State = {
  theme: Theme
  load: () => Promise<void>
  set: (t: Theme) => Promise<void>
}

function isTheme(x: unknown): x is Theme {
  return x === 'system' || x === 'light' || x === 'dark'
}

export const useThemeStore = create<State>((set) => ({
  theme: 'system',
  load: async () => {
    try {
      const v = await settingsApi.get<Theme | null>('theme')
      if (isTheme(v)) set({ theme: v })
    } catch {
      // БД ещё не открыта — оставим 'system'
    }
  },
  set: async (t) => {
    set({ theme: t })
    try {
      await settingsApi.set('theme', t)
    } catch {
      // ignore
    }
  }
}))
