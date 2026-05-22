/**
 * src/renderer/src/lib/medications.test.ts
 *
 * Толерантный парсер должен есть и JSON-массив, и старый текстовый формат
 * с разделителями.
 */
import { describe, expect, it } from 'vitest'
import { parseMedications, stringifyMedications } from './medications'

describe('parseMedications', () => {
  it('пусто на null/empty', () => {
    expect(parseMedications(null)).toEqual([])
    expect(parseMedications(undefined)).toEqual([])
    expect(parseMedications('')).toEqual([])
    expect(parseMedications('   ')).toEqual([])
  })

  it('парсит JSON-массив строк', () => {
    expect(parseMedications('["Сертралин","Феварин"]')).toEqual([
      'Сертралин',
      'Феварин'
    ])
  })

  it('фоллбэк: разделители ; \\n ,', () => {
    expect(parseMedications('Сертралин; Феварин')).toEqual(['Сертралин', 'Феварин'])
    expect(parseMedications('Сертралин\nФеварин\nЛексапро')).toEqual([
      'Сертралин',
      'Феварин',
      'Лексапро'
    ])
    expect(parseMedications('Сертралин, Феварин')).toEqual(['Сертралин', 'Феварин'])
  })

  it('пропускает пустые / только-пробельные элементы', () => {
    expect(parseMedications('["", " ", "X"]')).toEqual(['X'])
    expect(parseMedications('X;  ; ; Y')).toEqual(['X', 'Y'])
  })
})

describe('stringifyMedications', () => {
  it('null для пустого массива', () => {
    expect(stringifyMedications([])).toBeNull()
    expect(stringifyMedications(['', '  '])).toBeNull()
  })

  it('JSON-массив для непустого', () => {
    expect(stringifyMedications(['A', 'B'])).toBe('["A","B"]')
  })

  it('убирает дубликаты и пробелы по краям', () => {
    expect(stringifyMedications([' A ', 'A', 'B '])).toBe('["A","B"]')
  })
})
