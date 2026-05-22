/**
 * src/main/ipc/settings.ts
 *
 * IPC-домен `settings`. На этапе 6 — общий k/v API:
 *   - settings:get(key) → unknown
 *   - settings:set(key, value) → void
 *
 * Используется renderer'ом для сохранения темы / локали / прочих per-app
 * предпочтений. Колоранты-настройки (cветовая палитра, см. этап 5) живут
 * в отдельной таблице note_colors и в IPC `colors:*`.
 */
import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { getSetting, setSetting } from '../db/repositories/settingsRepo'
import { settingsGetInput, settingsSetInput } from '@shared/schemas'

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', (_e, raw) => {
    const { key } = settingsGetInput.parse(raw)
    return getSetting(getDb(), key) ?? null
  })

  ipcMain.handle('settings:set', (_e, raw) => {
    const { key, value } = settingsSetInput.parse(raw)
    setSetting(getDb(), key, value)
  })
}
