/**
 * src/renderer/src/lib/i18n.ts
 *
 * Инициализация react-i18next.
 * Локали ru/en подключены статически (JSON-импорт). Источник правды
 * для выбранного языка — таблица settings (ключ "locale"), но первичная
 * загрузка идёт синхронно с дефолтом "ru" — это нужно, потому что компоненты
 * могут вызвать t() до того, как успеет приехать запрос settings:get.
 * Потом LocaleProvider может вызвать changeLanguage(...) асинхронно.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from '@/locales/ru.json'
import en from '@/locales/en.json'

void i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en }
  },
  lng: 'ru',
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
  returnNull: false
})

export { i18n }
