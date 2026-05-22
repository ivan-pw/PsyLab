/**
 * src/renderer/src/api/settings.ts
 */
export const settingsApi = {
  get: <T = unknown>(key: string) => window.api.settings.get(key) as Promise<T>,
  set: (key: string, value: unknown) => window.api.settings.set(key, value)
}
