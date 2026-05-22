/**
 * src/renderer/src/lib/historized.test.ts
 *
 * Smoke-тесты на парсер кликабельных значений мессенджера/телефона/email.
 * Цель: убедиться, что плюс-минус популярные форматы распознаются,
 * а мусор не превращается в фейковую ссылку.
 */
import { describe, expect, it } from 'vitest'
import { parseExternalUrl } from './historized'

describe('parseExternalUrl', () => {
  it('http(s) URL возвращается как есть', () => {
    expect(parseExternalUrl('messenger', 'https://t.me/foo')).toBe('https://t.me/foo')
    expect(parseExternalUrl('video_link', 'http://meet.jit.si/abc')).toBe(
      'http://meet.jit.si/abc'
    )
  })

  it('телефон превращается в tel:', () => {
    expect(parseExternalUrl('phone', '+7 (999) 123-45-67')).toBe('tel:+79991234567')
  })

  it('email превращается в mailto: только если валидный', () => {
    expect(parseExternalUrl('email', 'foo@bar.com')).toBe('mailto:foo@bar.com')
    expect(parseExternalUrl('email', 'foo')).toBeNull()
  })

  it('messenger: telegram → t.me', () => {
    expect(parseExternalUrl('messenger', 'telegram:@ivanov')).toBe('https://t.me/ivanov')
    expect(parseExternalUrl('messenger', 'tg: @ivanov')).toBe('https://t.me/ivanov')
  })

  it('messenger: whatsapp → wa.me', () => {
    expect(parseExternalUrl('messenger', 'whatsapp:+79991234567')).toBe(
      'https://wa.me/79991234567'
    )
  })

  it('неизвестный мессенджер не превращается в ссылку', () => {
    expect(parseExternalUrl('messenger', 'просто заметка')).toBeNull()
  })
})
