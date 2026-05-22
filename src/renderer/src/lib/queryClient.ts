/**
 * src/renderer/src/lib/queryClient.ts
 *
 * Глобальный QueryClient для TanStack Query.
 *
 * Настройки выбраны под десктоп-приложение с локальной БД:
 *  - refetchOnWindowFocus: false — нет смысла, БД только наша;
 *  - staleTime: 30s — типовое CRUD-обновление; mutate'ы инвалидируют сами;
 *  - retry: 1 — IPC-ошибки обычно не рекуррентные.
 */
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1
    },
    mutations: {
      retry: 0
    }
  }
})
