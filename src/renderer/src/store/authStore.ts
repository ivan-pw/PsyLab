/**
 * src/renderer/src/store/authStore.ts
 *
 * Состояние аутентификации в renderer. Хранит:
 *  - initialized: создан ли уже пароль (false → экран первичной настройки);
 *  - unlocked:    открыта ли БД в main-процессе (true → пускаем дальше);
 *  - loading:     идёт ли запрос get-status (для первого рендера).
 *
 * Источник правды — main-процесс. Здесь только зеркалим состояние и даём
 * экшены unlock/lock/setupPassword, которые сами обновляют флаги.
 */
import { create } from 'zustand'
import { authApi } from '@/api/auth'

type AuthState = {
  initialized: boolean
  unlocked: boolean
  loading: boolean
  refresh: () => Promise<void>
  setupPassword: (password: string) => Promise<void>
  unlock: (password: string) => Promise<boolean>
  lock: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  initialized: false,
  unlocked: false,
  loading: true,

  refresh: async () => {
    const { initialized, unlocked } = await authApi.getStatus()
    set({ initialized, unlocked, loading: false })
  },

  setupPassword: async (password) => {
    await authApi.setupPassword(password)
    // setupDatabase сразу открывает соединение → разлочено.
    set({ initialized: true, unlocked: true })
  },

  unlock: async (password) => {
    const ok = await authApi.unlock(password)
    if (ok) set({ unlocked: true })
    return ok
  },

  lock: async () => {
    await authApi.lock()
    set({ unlocked: false })
  }
}))
