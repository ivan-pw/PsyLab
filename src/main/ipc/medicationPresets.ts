/**
 * src/main/ipc/medicationPresets.ts
 *
 * IPC-домен `medication-presets`. Справочник для автодополнения.
 */
import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import {
  createMedicationPreset,
  deleteMedicationPreset,
  listMedicationPresets,
  reorderMedicationPresets,
  updateMedicationPreset
} from '../db/repositories/medicationPresetsRepo'
import {
  medicationPresetCreateInput,
  medicationPresetIdInput,
  medicationPresetReorderInput,
  medicationPresetUpdateInput
} from '@shared/schemas'

export function registerMedicationPresetsIpc(): void {
  ipcMain.handle('medication-presets:list', () => listMedicationPresets(getDb()))

  ipcMain.handle('medication-presets:create', (_e, raw) => {
    const input = medicationPresetCreateInput.parse(raw)
    return createMedicationPreset(getDb(), input)
  })

  ipcMain.handle('medication-presets:update', (_e, raw) => {
    const { id, patch } = medicationPresetUpdateInput.parse(raw)
    return updateMedicationPreset(getDb(), id, patch)
  })

  ipcMain.handle('medication-presets:delete', (_e, raw) => {
    const { id } = medicationPresetIdInput.parse(raw)
    deleteMedicationPreset(getDb(), id)
  })

  ipcMain.handle('medication-presets:reorder', (_e, raw) => {
    const { ids } = medicationPresetReorderInput.parse(raw)
    reorderMedicationPresets(getDb(), ids)
  })
}
