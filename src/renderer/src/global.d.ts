/**
 * src/renderer/src/global.d.ts
 *
 * Глобальные типы для renderer-кода. Здесь объявлен `window.api`,
 * который выставляется preload-скриптом через contextBridge.
 *
 * Тип Api описан в @shared/api — общий для preload и renderer.
 */
import type { Api } from '@shared/api'

declare global {
  interface Window {
    api: Api
  }
}

export {}
