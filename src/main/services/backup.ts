/**
 * src/main/services/backup.ts
 *
 * Бэкапы зашифрованного файла БД.
 *
 *  - Файлы пишутся в `app.getPath('userData')/backups/psynote-<ISO>.db`.
 *  - Сам файл уже зашифрован (SQLCipher), поэтому копирование «как есть»
 *    не раскрывает данные. Для восстановления потребуется тот же пароль
 *    и та же соль — поэтому рядом сохраняем `*.salt`.
 *  - Ротация: храним N последних (по умолчанию 10 — настройка
 *    `backup_keep_count`).
 *
 * Этап 7 ограничивается ручным запуском бэкапа из настроек. Авто-бэкап
 * по расписанию (например, раз в день) можно добавить позднее: понадобится
 * setInterval в main и анализ настройки `backup_enabled`.
 */
import { app } from 'electron'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

export type BackupInfo = {
  /** Абсолютный путь к .db бэкапу. */
  path: string
  /** ISO timestamp создания (брался из mtime). */
  createdAt: string
  /** Размер в байтах. */
  size: number
}

const FILE_PREFIX = 'psynote-'
const FILE_SUFFIX_DB = '.db'
const FILE_SUFFIX_SALT = '.salt'

function backupsDir(): string {
  return join(app.getPath('userData'), 'backups')
}

function dbPath(): string {
  return join(app.getPath('userData'), 'psynote.db')
}

function saltPath(): string {
  return join(app.getPath('userData'), 'psynote.salt')
}

function ensureDir(): void {
  const d = backupsDir()
  if (!existsSync(d)) mkdirSync(d, { recursive: true, mode: 0o700 })
}

function tsForFilename(): string {
  // Файл-friendly: 2026-05-21T14-30-12-345Z
  return new Date().toISOString().replace(/[:.]/g, '-')
}

export function listBackups(): BackupInfo[] {
  if (!existsSync(backupsDir())) return []
  return readdirSync(backupsDir())
    .filter((f) => f.startsWith(FILE_PREFIX) && f.endsWith(FILE_SUFFIX_DB))
    .map((f) => {
      const p = join(backupsDir(), f)
      const st = statSync(p)
      return { path: p, createdAt: st.mtime.toISOString(), size: st.size }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createBackup(keepCount: number): BackupInfo {
  if (!existsSync(dbPath())) throw new Error('Файл БД не найден')
  if (!existsSync(saltPath())) throw new Error('Файл соли не найден')

  ensureDir()
  const ts = tsForFilename()
  const dbDst = join(backupsDir(), `${FILE_PREFIX}${ts}${FILE_SUFFIX_DB}`)
  const saltDst = join(backupsDir(), `${FILE_PREFIX}${ts}${FILE_SUFFIX_SALT}`)
  copyFileSync(dbPath(), dbDst)
  copyFileSync(saltPath(), saltDst)

  // Ротация: оставляем последние keepCount по mtime.
  rotateBackups(keepCount)

  const st = statSync(dbDst)
  return { path: dbDst, createdAt: st.mtime.toISOString(), size: st.size }
}

function rotateBackups(keepCount: number): void {
  if (keepCount <= 0) return
  const all = listBackups()
  const stale = all.slice(keepCount)
  for (const b of stale) {
    try {
      unlinkSync(b.path)
    } catch {
      // ignore
    }
    // Парный salt-файл удаляем тоже.
    const saltCandidate = b.path.replace(FILE_SUFFIX_DB, FILE_SUFFIX_SALT)
    try {
      unlinkSync(saltCandidate)
    } catch {
      // ignore
    }
  }
}

export function deleteBackup(path: string): void {
  // Защита от любых путей вне backups/.
  if (!path.startsWith(backupsDir())) {
    throw new Error('Путь вне директории бэкапов')
  }
  if (existsSync(path)) unlinkSync(path)
  const saltCandidate = path.replace(FILE_SUFFIX_DB, FILE_SUFFIX_SALT)
  if (existsSync(saltCandidate)) unlinkSync(saltCandidate)
}
