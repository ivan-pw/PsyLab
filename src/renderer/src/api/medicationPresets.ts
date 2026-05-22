/**
 * src/renderer/src/api/medicationPresets.ts
 */
import type { MedicationPresetInput } from '@shared/types'

export const medicationPresetsApi = {
  list: () => window.api.medicationPresets.list(),
  create: (input: MedicationPresetInput) => window.api.medicationPresets.create(input),
  update: (id: number, patch: Partial<MedicationPresetInput>) =>
    window.api.medicationPresets.update(id, patch),
  delete: (id: number) => window.api.medicationPresets.delete(id),
  reorder: (ids: number[]) => window.api.medicationPresets.reorder(ids)
}
