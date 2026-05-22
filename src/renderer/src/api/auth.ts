/**
 * src/renderer/src/api/auth.ts
 *
 * Типизированная обёртка над window.api.auth для удобства использования
 * в компонентах и сторе. Прямые вызовы window.api тоже работают,
 * но через эту обёртку проще мокать в тестах.
 */
export const authApi = {
  getStatus: () => window.api.auth.getStatus(),
  getSecurityFlags: () => window.api.auth.getSecurityFlags(),
  setupPassword: (password: string) => window.api.auth.setupPassword(password),
  unlock: (password: string) => window.api.auth.unlock(password),
  lock: () => window.api.auth.lock(),
  changePassword: (oldPassword: string, newPassword: string) =>
    window.api.auth.changePassword(oldPassword, newPassword)
}
