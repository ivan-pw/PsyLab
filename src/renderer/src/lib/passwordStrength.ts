/**
 * src/renderer/src/lib/passwordStrength.ts
 *
 * Оценка силы пароля (zxcvbn-ts) для UI Unlock/Setup и SecuritySettings.
 *
 * Инициализируем zxcvbn-ts один раз модульно: общий словарь + английский
 * языковой пакет (русский официально не публикуется на npm).
 * Min длина и допустимый score соответствуют требованиям на main-стороне
 * (см. PASSWORD_MIN_LENGTH в crypto.ts).
 */
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'
import {
  dictionary as commonDictionary,
  adjacencyGraphs
} from '@zxcvbn-ts/language-common'
import {
  dictionary as enDictionary,
  translations as enTranslations
} from '@zxcvbn-ts/language-en'

zxcvbnOptions.setOptions({
  translations: enTranslations,
  graphs: adjacencyGraphs,
  dictionary: {
    ...commonDictionary,
    ...enDictionary
  }
})

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MIN_SCORE = 3 // zxcvbn: 0 weak → 4 strong; требуем «good»

export type StrengthResult = {
  score: 0 | 1 | 2 | 3 | 4
  /** Удовлетворяет ли пароль обязательным требованиям. */
  ok: boolean
  /** Подсказки на русском (грубо переведённые). */
  hints: string[]
}

const TRANSLATIONS_RU: Record<string, string> = {
  // основные warning'и
  'Straight rows of keys are easy to guess':
    'Соседние клавиши легко угадать',
  'Short keyboard patterns are easy to guess':
    'Короткие клавиатурные шаблоны легко угадать',
  'Repeats like "aaa" are easy to guess':
    'Повторы вроде «aaa» легко угадать',
  'Repeats like "abcabcabc" are only slightly harder to guess than "abc"':
    'Повторяющиеся последовательности почти так же предсказуемы',
  'Sequences like abc or 6543 are easy to guess':
    'Последовательности abc / 6543 легко угадать',
  'Recent years are easy to guess':
    'Современные годы — частый и слабый выбор',
  'Dates are often easy to guess':
    'Даты часто легко угадать',
  'This is a top-10 common password':
    'Это один из самых распространённых паролей',
  'This is a top-100 common password':
    'Это один из 100 самых распространённых паролей',
  'This is a very common password':
    'Это очень распространённый пароль',
  'This is similar to a commonly used password':
    'Похоже на распространённый пароль',
  'A word by itself is easy to guess':
    'Одно слово легко угадать',
  'Names and surnames by themselves are easy to guess':
    'Имена и фамилии — слабый выбор',
  'Common names and surnames are easy to guess':
    'Распространённые имена легко угадать',
  // suggestions
  'Use a few words, avoid common phrases':
    'Используйте несколько слов, избегайте распространённых фраз',
  'No need for symbols, digits, or uppercase letters':
    'Цифры и символы не обязательны — достаточно длины',
  'Add another word or two. Uncommon words are better.':
    'Добавьте ещё одно-два слова. Реже встречающиеся — лучше.',
  "Capitalization doesn't help very much":
    'Заглавные буквы почти не помогают',
  'All-uppercase is almost as easy to guess as all-lowercase':
    'Только заглавные — почти то же, что только строчные',
  "Reversed words aren't much harder to guess":
    'Перевёрнутые слова почти так же легко угадать',
  "Predictable substitutions like '@' instead of 'a' don't help very much":
    'Замены вроде «@» вместо «a» почти не помогают',
  "Avoid sequences": 'Избегайте последовательностей',
  'Avoid recent years': 'Избегайте недавних годов',
  'Avoid years that are associated with you':
    'Избегайте годов, которые легко связать с вами',
  'Avoid dates and years that are associated with you':
    'Избегайте дат и годов, связанных с вами',
  'Avoid repeated words and characters':
    'Избегайте повторов букв и слов'
}

function translate(msg: string | null | undefined): string | null {
  if (!msg) return null
  return TRANSLATIONS_RU[msg] ?? msg
}

export function checkPasswordStrength(password: string): StrengthResult {
  const lengthOk = password.length >= PASSWORD_MIN_LENGTH
  if (!password) {
    return { score: 0, ok: false, hints: [] }
  }
  // zxcvbn быстро — пара миллисекунд для пары паролей, не блокирует UI.
  const result = zxcvbn(password)
  const score = (result.score ?? 0) as StrengthResult['score']
  const hints: string[] = []
  const warning = translate(result.feedback.warning)
  if (warning) hints.push(warning)
  for (const s of result.feedback.suggestions ?? []) {
    const t = translate(s)
    if (t) hints.push(t)
  }
  if (!lengthOk) {
    hints.unshift(`Минимум ${PASSWORD_MIN_LENGTH} символов`)
  }
  return {
    score,
    ok: lengthOk && score >= PASSWORD_MIN_SCORE,
    hints
  }
}

export function strengthLabel(score: 0 | 1 | 2 | 3 | 4): string {
  return ['Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Отличный'][score]!
}
