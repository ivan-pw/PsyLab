/**
 * src/renderer/src/api/notes.ts
 */
export const notesApi = {
  listByClient: (clientId: number) => window.api.notes.listByClient(clientId),
  create: (input: { client_id: number; color_id: number | null; body: string }) =>
    window.api.notes.create(input),
  update: (id: number, patch: { color_id?: number | null; body?: string }) =>
    window.api.notes.update(id, patch),
  delete: (id: number) => window.api.notes.delete(id)
}
