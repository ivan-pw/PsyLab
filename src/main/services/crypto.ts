/**
 * src/main/services/crypto.ts
 *
 * Парольная защита БД с поддержкой двух поколений KDF:
 *
 *  - v1 (legacy): PBKDF2-SHA512, 250 000 итераций, соль 16 байт без префикса.
 *    Применяется только к уже существующим БД, созданным до этой версии.
 *  - v2 (current): Argon2id, m=64 MiB, t=3, p=4. Соль 32 байта, файл
 *    хранится с однобайтным префиксом версии (0x02).
 *
 * Формат файла `psynote.salt`:
 *   - 16 байт без префикса        → v1 (унаследованный PBKDF2).
 *   - 33 байта: [0x02, salt(32)]  → v2 (Argon2id).
 *
 * При смене пароля файл всегда переписывается в формате v2, поэтому
 * после первого `changePassword` v1-БД переезжает на новый KDF.
 *
 * Почему Argon2id: PBKDF2 хорошо параллелится на GPU/ASIC, что обнуляет
 * преимущество от итераций. Argon2id специально memory-hard — атака требует
 * заметной RAM на каждый параллельный поток. OWASP Password Storage Cheat
 * Sheet рекомендует Argon2id для современных приложений.
 */
import { argon2id } from '@noble/hashes/argon2'
import { pbkdf2Sync, randomBytes } from 'node:crypto'

export const KEY_BYTES = 32

// v1 (legacy PBKDF2)
export const SALT_BYTES_V1 = 16
export const PBKDF2_ITERATIONS = 250_000
export const PBKDF2_DIGEST = 'sha512'

// v2 (current Argon2id) — параметры по рекомендациям OWASP 2024.
export const SALT_BYTES_V2 = 32
export const ARGON2_M_KIB = 65_536 // 64 MiB
export const ARGON2_T = 3
export const ARGON2_P = 4

export type KdfVersion = 1 | 2
export const KDF_CURRENT: KdfVersion = 2

/**
 * Требования к новому паролю. Используется в setupDatabase и при смене
 * пароля. Существующие старые пароли (короче этой планки) могут открыть
 * БД, но после unlock пользователь обязан их сменить (см. WeakPasswordGate
 * на renderer).
 */
export const PASSWORD_MIN_LENGTH = 12

export function meetsCurrentPasswordRequirements(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH
}

export function ensureCurrentPasswordRequirements(password: string): void {
  if (!password) throw new Error('Введите пароль')
  if (!meetsCurrentPasswordRequirements(password)) {
    throw new Error(
      `Пароль должен быть не короче ${PASSWORD_MIN_LENGTH} символов`
    )
  }
}

// ─── Соль: генерация и (де)сериализация файла с префиксом версии ────────────

export function generateSaltV2(): Buffer {
  return randomBytes(SALT_BYTES_V2)
}

export function packSaltV2(salt: Buffer): Buffer {
  if (salt.length !== SALT_BYTES_V2) {
    throw new Error(`Соль v2: ожидалось ${SALT_BYTES_V2} байт, получено ${salt.length}`)
  }
  // 0x02 — version prefix; см. шапку файла.
  return Buffer.concat([Buffer.from([0x02]), salt])
}

export type ParsedSalt = { version: KdfVersion; salt: Buffer }

export function parseSaltFile(buf: Buffer): ParsedSalt {
  // legacy: ровно 16 байт без префикса
  if (buf.length === SALT_BYTES_V1) return { version: 1, salt: buf }
  // v2: 1 + 32 байта, первый байт = 0x02
  if (buf.length === SALT_BYTES_V2 + 1 && buf[0] === 0x02) {
    return { version: 2, salt: buf.subarray(1) }
  }
  throw new Error(
    `Файл соли повреждён или не распознан (длина ${buf.length} байт)`
  )
}

// ─── KDF ────────────────────────────────────────────────────────────────────

export function deriveKeyV1(password: string, salt: Buffer): Buffer {
  if (!password) throw new Error('Пустой пароль недопустим')
  if (salt.length !== SALT_BYTES_V1) {
    throw new Error('Соль v1 повреждена')
  }
  return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_BYTES, PBKDF2_DIGEST)
}

/**
 * Argon2id из @noble/hashes. Pure-JS, без нативного бинарника, поэтому
 * не требует electron-rebuild. Вычисление занимает ~1–2 секунды и
 * блокирует event loop main-процесса — это приемлемо, так как
 * происходит только при unlock / setup / changePassword.
 *
 * @noble/hashes ≥ 1.8 строго требует Uint8Array на входе: проверка
 * `abytes` смотрит на конструктор, и хотя Buffer наследуется от Uint8Array,
 * она его не пропускает. Поэтому явно нормализуем оба аргумента.
 */
export function deriveKeyV2(password: string, salt: Buffer): Buffer {
  if (!password) throw new Error('Пустой пароль недопустим')
  if (salt.length !== SALT_BYTES_V2) {
    throw new Error('Соль v2 повреждена')
  }
  const pwdBytes = new TextEncoder().encode(password)
  const saltBytes = new Uint8Array(salt.buffer, salt.byteOffset, salt.byteLength)
  const key = argon2id(pwdBytes, saltBytes, {
    t: ARGON2_T,
    m: ARGON2_M_KIB,
    p: ARGON2_P,
    dkLen: KEY_BYTES
  })
  return Buffer.from(key)
}

export function deriveKey(version: KdfVersion, password: string, salt: Buffer): Buffer {
  return version === 1 ? deriveKeyV1(password, salt) : deriveKeyV2(password, salt)
}

// ─── SQLCipher литерал ──────────────────────────────────────────────────────

export function keyToSqlcipherLiteral(key: Buffer): string {
  // SQLCipher распознаёт «сырой hex-ключ» (без KDF) именно по СТРОКОВОМУ
  // литералу вида "x'AABB…'" — двойные кавычки вокруг snippet'а x'…'.
  return `"x'${key.toString('hex')}'"`
}
