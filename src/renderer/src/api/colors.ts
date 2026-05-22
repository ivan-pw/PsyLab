/**
 * src/renderer/src/api/colors.ts
 */
import type { NoteColorInput } from '@shared/types'

export const colorsApi = {
  list: () => window.api.colors.list(),
  create: (input: NoteColorInput) => window.api.colors.create(input),
  update: (id: number, patch: Partial<NoteColorInput>) =>
    window.api.colors.update(id, patch),
  usageCount: (id: number) => window.api.colors.usageCount(id),
  replaceAndDelete: (fromId: number, toId: number | null) =>
    window.api.colors.replaceAndDelete(fromId, toId),
  reorder: (ids: number[]) => window.api.colors.reorder(ids)
}
