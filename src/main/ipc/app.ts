/**
 * src/main/ipc/app.ts
 *
 * IPC-домен `app`: общая инфа о приложении и системные действия.
 *  - app:info → { version, platform }
 *  - app:quit → app.quit() (используется в EULA при отказе)
 */
import { app, ipcMain } from 'electron'

export function registerAppIpc(): void {
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    platform: process.platform
  }))

  ipcMain.handle('app:quit', () => {
    app.quit()
  })
}
