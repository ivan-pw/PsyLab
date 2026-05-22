/**
 * src/renderer/src/hooks/useBackups.ts
 *
 * Список бэкапов + мутации. Сами файлы лежат в `userData/backups/`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { backupApi } from '@/api/backup'

export const backupsKeys = {
  all: ['backups'] as const,
  list: () => ['backups', 'list'] as const
}

export function useBackups() {
  return useQuery({
    queryKey: backupsKeys.list(),
    queryFn: () => backupApi.list()
  })
}

export function useCreateBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => backupApi.createNow(),
    onSuccess: () => qc.invalidateQueries({ queryKey: backupsKeys.all })
  })
}

export function useDeleteBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (path: string) => backupApi.delete(path),
    onSuccess: () => qc.invalidateQueries({ queryKey: backupsKeys.all })
  })
}
