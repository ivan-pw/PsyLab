/**
 * src/renderer/src/api/anamneses.ts
 *
 * Типизированная обёртка над window.api.anamneses.
 */
import type { AnamnesisInput } from '@shared/types'

export const anamnesesApi = {
  listByClient: (clientId: number) => window.api.anamneses.listByClient(clientId),
  get: (id: number) => window.api.anamneses.get(id),
  create: (clientId: number, input: AnamnesisInput) =>
    window.api.anamneses.create(clientId, input),
  update: (id: number, patch: Partial<AnamnesisInput>) =>
    window.api.anamneses.update(id, patch),
  delete: (id: number) => window.api.anamneses.delete(id)
}
