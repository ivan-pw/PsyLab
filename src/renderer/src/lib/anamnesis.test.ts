/**
 * src/renderer/src/lib/anamnesis.test.ts
 *
 * Покрываем приоритет COALESCE в anamnesisPreview и формат todayIsoDate.
 */
import { describe, expect, it } from 'vitest'
import { anamnesisPreview, todayIsoDate } from './anamnesis'

describe('anamnesisPreview', () => {
  it('первое непустое значение в порядке complaints → notes → life_history', () => {
    expect(anamnesisPreview({ complaints: 'жалоба', notes: 'n', life_history: 'l' })).toBe(
      'жалоба'
    )
    expect(anamnesisPreview({ complaints: null, notes: 'заметка', life_history: 'l' })).toBe(
      'заметка'
    )
    expect(anamnesisPreview({ complaints: null, notes: null, life_history: 'жизнь' })).toBe(
      'жизнь'
    )
  })

  it('null если все поля пустые', () => {
    expect(anamnesisPreview({ complaints: null, notes: null, life_history: null })).toBeNull()
    expect(anamnesisPreview({ complaints: '   ', notes: '', life_history: null })).toBeNull()
  })
})

describe('todayIsoDate', () => {
  it('возвращает строку формата YYYY-MM-DD', () => {
    expect(todayIsoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
