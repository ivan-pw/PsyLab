/**
 * src/renderer/src/store/localeStore.ts
 *
 * Управление текущей локалью.
 *  - При старте читаем settings.locale из main; если пусто — оставляем 'ru'.
 *  - При выборе пользователем — пишем обратно и сразу зовём i18n.changeLanguage.
 *
 * Сам i18n инициализирован в lib/i18n.ts; этот стор лишь синхронизирует
 * выбор с БД и triggers re-render через подписку.
 */
import { create } from 'zustand'
import { settingsApi } from '@/api/settings'
import { i18n } from '@/lib/i18n'
import type { Locale } from '@shared/types'

type State = {
  locale: Locale
  load: () => Promise<void>
  set: (loc: Locale) => Promise<void>
}

function isLocale(x: unknown): x is Locale {
  return x === 'ru' || x === 'en'
}

export const useLocaleStore = create<State>((set) => ({
  locale: 'ru',
  load: async () => {
    try {
      const v = await settingsApi.get<Locale | null>('locale')
      if (isLocale(v)) {
        set({ locale: v })
        if (i18n.language !== v) await i18n.changeLanguage(v)
      }
    } catch {
      // первичный запуск без БД — просто оставим 'ru'
    }
  },
  set: async (loc) => {
    set({ locale: loc })
    await i18n.changeLanguage(loc)
    try {
      await settingsApi.set('locale', loc)
    } catch {
      // ignore: например, БД закрыта — настройка применится только в памяти
    }
  }
}))
