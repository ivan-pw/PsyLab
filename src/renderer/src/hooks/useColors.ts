/**
 * src/renderer/src/hooks/useColors.ts
 *
 * Палитра цветов заметок: чтение + мутации.
 * При любых изменениях цветов инвалидируем не только список цветов,
 * но и заметки всех клиентов (на карточках мог измениться рендер).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { colorsApi } from '@/api/colors'
import type { NoteColor, NoteColorInput } from '@shared/types'

export const colorsKeys = {
  all: ['colors'] as const,
  list: () => ['colors', 'list'] as const,
  usageCount: (id: number) => ['colors', 'usage-count', id] as const
}

export function useColors() {
  return useQuery({
    queryKey: colorsKeys.list(),
    queryFn: () => colorsApi.list()
  })
}

export function useColorUsageCount(id: number | null, enabled = false) {
  return useQuery({
    queryKey: id ? colorsKeys.usageCount(id) : ['colors', 'usage-count', 'none'],
    queryFn: () => colorsApi.usageCount(id as number),
    enabled: enabled && id !== null
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: colorsKeys.all })
  // Заметки рендерятся с цветом из палитры — при изменении hex/label
  // карточки должны перерисоваться. Сбрасываем кеш заметок по всем клиентам.
  void qc.invalidateQueries({ queryKey: ['notes'] })
}

export function useCreateColor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: NoteColorInput) => colorsApi.create(input),
    onSuccess: () => invalidate(qc)
  })
}

export function useUpdateColor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<NoteColorInput> }) =>
      colorsApi.update(id, patch),
    onSuccess: () => invalidate(qc)
  })
}

export function useDeleteColor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ fromId, toId }: { fromId: number; toId: number | null }) =>
      colorsApi.replaceAndDelete(fromId, toId),
    onSuccess: () => invalidate(qc)
  })
}

export function useReorderColors() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => colorsApi.reorder(ids),
    onSuccess: () => invalidate(qc)
  })
}

export function colorById(colors: NoteColor[] | undefined, id: number | null): NoteColor | null {
  if (!colors || id === null) return null
  return colors.find((c) => c.id === id) ?? null
}
