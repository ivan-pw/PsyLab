/**
 * src/renderer/src/hooks/useSetting.ts
 *
 * Чтение/запись одного ключа из table `settings`.
 * Используется для theme и locale (см. store/themeStore, store/localeStore).
 *
 * Подключается к authStore: пока БД не расшифрована, запрос не выполняется
 * (иначе main кинет «БД не открыта»).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/api/settings'
import { useAuthStore } from '@/store/authStore'

export const settingsKeys = {
  byKey: (k: string) => ['settings', 'by-key', k] as const
}

export function useSettingQuery<T = unknown>(key: string, defaultValue?: T) {
  const unlocked = useAuthStore((s) => s.unlocked)
  return useQuery({
    queryKey: settingsKeys.byKey(key),
    queryFn: async () => {
      const v = await settingsApi.get<T | null>(key)
      return v === null && defaultValue !== undefined ? defaultValue : (v as T | null)
    },
    enabled: unlocked,
    staleTime: Infinity
  })
}

export function useSettingMutation(key: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (value: unknown) => settingsApi.set(key, value),
    onSuccess: (_, value) => {
      qc.setQueryData(settingsKeys.byKey(key), value)
    }
  })
}
