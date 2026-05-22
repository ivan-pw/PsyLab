/**
 * src/main/services/crypto.test.ts
 *
 * Покрываем:
 *  - детерминизм и базовую корректность v1 (PBKDF2) и v2 (Argon2id);
 *  - формат файла соли (16 байт без префикса = v1, 33 байта с 0x02 = v2);
 *  - keyToSqlcipherLiteral;
 *  - валидатор парольных требований.
 *
 * Argon2id-тесты намеренно используют МАЛЕНЬКИЙ payload (он медленный
 * сам по себе), но параметры — реальные. Один вызов ~1–2 секунды на CPU,
 * поэтому общий тест-сьют тут не сильно растягивается.
 */
import { describe, expect, it } from 'vitest'
import {
  KEY_BYTES,
  PASSWORD_MIN_LENGTH,
  SALT_BYTES_V1,
  SALT_BYTES_V2,
  deriveKey,
  deriveKeyV1,
  deriveKeyV2,
  ensureCurrentPasswordRequirements,
  generateSaltV2,
  keyToSqlcipherLiteral,
  meetsCurrentPasswordRequirements,
  packSaltV2,
  parseSaltFile
} from './crypto'
import { randomBytes } from 'node:crypto'

describe('parseSaltFile', () => {
  it('legacy 16 байт → v1', () => {
    const buf = randomBytes(SALT_BYTES_V1)
    const parsed = parseSaltFile(buf)
    expect(parsed.version).toBe(1)
    expect(parsed.salt.length).toBe(SALT_BYTES_V1)
  })

  it('33 байта c префиксом 0x02 → v2', () => {
    const salt = randomBytes(SALT_BYTES_V2)
    const buf = packSaltV2(salt)
    expect(buf.length).toBe(SALT_BYTES_V2 + 1)
    expect(buf[0]).toBe(0x02)
    const parsed = parseSaltFile(buf)
    expect(parsed.version).toBe(2)
    expect(parsed.salt.equals(salt)).toBe(true)
  })

  it('некорректная длина → throw', () => {
    expect(() => parseSaltFile(Buffer.alloc(8))).toThrow()
    expect(() => parseSaltFile(Buffer.alloc(100))).toThrow()
  })

  it('33 байта без префикса 0x02 → throw', () => {
    const bad = Buffer.concat([Buffer.from([0x01]), randomBytes(SALT_BYTES_V2)])
    expect(() => parseSaltFile(bad)).toThrow()
  })
})

describe('deriveKey v1 (PBKDF2)', () => {
  it('детерминирован для (password, salt)', () => {
    const salt = randomBytes(SALT_BYTES_V1)
    const a = deriveKeyV1('secret123', salt)
    const b = deriveKeyV1('secret123', salt)
    expect(a.equals(b)).toBe(true)
    expect(a.length).toBe(KEY_BYTES)
  })

  it('разные пароли → разные ключи', () => {
    const salt = randomBytes(SALT_BYTES_V1)
    const a = deriveKeyV1('one', salt)
    const b = deriveKeyV1('two', salt)
    expect(a.equals(b)).toBe(false)
  })

  it('отвергает пустой пароль и неправильную соль', () => {
    expect(() => deriveKeyV1('', randomBytes(SALT_BYTES_V1))).toThrow()
    expect(() => deriveKeyV1('x', Buffer.alloc(8))).toThrow()
  })
})

describe('deriveKey v2 (Argon2id)', () => {
  // Один вызов ~1-2 секунды; держим один контрольный тест на детерминизм.
  it('детерминирован для (password, salt)', () => {
    const salt = randomBytes(SALT_BYTES_V2)
    const a = deriveKeyV2('correct horse battery', salt)
    const b = deriveKeyV2('correct horse battery', salt)
    expect(a.equals(b)).toBe(true)
    expect(a.length).toBe(KEY_BYTES)
  }, 30_000)
})

describe('deriveKey dispatcher', () => {
  it('v1 → PBKDF2, v2 → Argon2id', () => {
    const salt = generateSaltV2()
    const v1Salt = randomBytes(SALT_BYTES_V1)
    const k1a = deriveKey(1, 'samepassword', v1Salt)
    const k1b = deriveKeyV1('samepassword', v1Salt)
    expect(k1a.equals(k1b)).toBe(true)

    // v2 — отдельная проверка только на согласованность с deriveKeyV2.
    const k2a = deriveKey(2, 'longpassword', salt)
    const k2b = deriveKeyV2('longpassword', salt)
    expect(k2a.equals(k2b)).toBe(true)
  }, 30_000)
})

describe('keyToSqlcipherLiteral', () => {
  it('возвращает строковый литерал "x\'…\'"', () => {
    const key = Buffer.from('00112233445566778899aabbccddeeff', 'hex')
    const lit = keyToSqlcipherLiteral(key)
    expect(lit).toBe(`"x'00112233445566778899aabbccddeeff'"`)
  })
})

describe('password requirements', () => {
  it(`PASSWORD_MIN_LENGTH = ${PASSWORD_MIN_LENGTH}`, () => {
    expect(PASSWORD_MIN_LENGTH).toBeGreaterThanOrEqual(12)
  })

  it('meetsCurrentPasswordRequirements: длина ≥ min', () => {
    expect(meetsCurrentPasswordRequirements('x'.repeat(PASSWORD_MIN_LENGTH))).toBe(true)
    expect(meetsCurrentPasswordRequirements('x'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe(false)
    expect(meetsCurrentPasswordRequirements('')).toBe(false)
  })

  it('ensureCurrentPasswordRequirements throws на слабых', () => {
    expect(() => ensureCurrentPasswordRequirements('')).toThrow()
    expect(() => ensureCurrentPasswordRequirements('short')).toThrow()
    expect(() =>
      ensureCurrentPasswordRequirements('x'.repeat(PASSWORD_MIN_LENGTH))
    ).not.toThrow()
  })
})
