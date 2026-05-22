/**
 * src/main/ipc/auth.ts
 *
 * IPC-домен `auth`:
 *  - auth:get-status         → { initialized, unlocked }
 *  - auth:get-security-flags → { kdfNeedsUpgrade, weakPasswordDetected }
 *  - auth:setup              → создаёт БД, сохраняет соль, открывает соединение
 *  - auth:unlock             → проверяет пароль, открывает соединение
 *  - auth:lock               → закрывает соединение
 *  - auth:change-password    → проверяет старый, PRAGMA rekey + миграция соли на v2
 *
 * Все входные данные валидируются zod-схемами в registerAuthIpc().
 */
import { ipcMain } from 'electron'
import {
  changePassword,
  closeDatabase,
  getSecurityFlags,
  isInitialized,
  isUnlocked,
  setupDatabase,
  unlockDatabase
} from '../db/connection'
import {
  changePasswordInput,
  setupPasswordInput,
  unlockInput
} from '@shared/schemas'

export function registerAuthIpc(): void {
  ipcMain.handle('auth:get-status', () => ({
    initialized: isInitialized(),
    unlocked: isUnlocked()
  }))

  ipcMain.handle('auth:get-security-flags', () => getSecurityFlags())

  ipcMain.handle('auth:setup', (_e, raw) => {
    const { password } = setupPasswordInput.parse(raw)
    setupDatabase(password)
  })

  ipcMain.handle('auth:unlock', (_e, raw) => {
    const { password } = unlockInput.parse(raw)
    return unlockDatabase(password)
  })

  ipcMain.handle('auth:lock', () => {
    closeDatabase()
  })

  ipcMain.handle('auth:change-password', (_e, raw) => {
    const { oldPassword, newPassword } = changePasswordInput.parse(raw)
    changePassword(oldPassword, newPassword)
  })
}
