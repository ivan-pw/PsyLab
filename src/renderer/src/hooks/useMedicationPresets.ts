/**
 * src/renderer/src/hooks/useMedicationPresets.ts
 *
 * Справочник пресетов медикаментов: чтение + мутации.
 * Подключён к authStore, чтобы не дёргать БД до unlock'а.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { medicationPresetsApi } from '@/api/medicationPresets'
import { useAuthStore } from '@/store/authStore'
import type { MedicationPresetInput } from '@shared/types'

export const medicationPresetsKeys = {
  all: ['medication-presets'] as const,
  list: () => ['medication-presets', 'list'] as const
}

export function useMedicationPresets() {
  const unlocked = useAuthStore((s) => s.unlocked)
  return useQuery({
    queryKey: medicationPresetsKeys.list(),
    queryFn: () => medicationPresetsApi.list(),
    enabled: unlocked,
    staleTime: 60_000
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: medicationPresetsKeys.all })
}

export function useCreateMedicationPreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MedicationPresetInput) => medicationPresetsApi.create(input),
    onSuccess: () => invalidate(qc)
  })
}

export function useUpdateMedicationPreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch
    }: {
      id: number
      patch: Partial<MedicationPresetInput>
    }) => medicationPresetsApi.update(id, patch),
    onSuccess: () => invalidate(qc)
  })
}

export function useDeleteMedicationPreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => medicationPresetsApi.delete(id),
    onSuccess: () => invalidate(qc)
  })
}

export function useReorderMedicationPresets() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => medicationPresetsApi.reorder(ids),
    onSuccess: () => invalidate(qc)
  })
}
