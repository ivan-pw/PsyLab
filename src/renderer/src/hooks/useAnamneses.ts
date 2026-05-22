/**
 * src/renderer/src/hooks/useAnamneses.ts
 *
 * Запросы по анамнезам клиента. Все мутации инвалидируют таймлайн клиента
 * (там анамнезы — события вида 'anamnesis') и сам список.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { anamnesesApi } from '@/api/anamneses'
import { clientsKeys } from './useClients'
import type { AnamnesisInput } from '@shared/types'

export const anamnesesKeys = {
  byClient: (clientId: number) => ['anamneses', 'by-client', clientId] as const,
  detail: (id: number) => ['anamneses', 'detail', id] as const
}

export function useAnamneses(clientId: number | null | undefined) {
  return useQuery({
    queryKey: clientId ? anamnesesKeys.byClient(clientId) : ['anamneses', 'none'],
    queryFn: () => anamnesesApi.listByClient(clientId as number),
    enabled: Boolean(clientId)
  })
}

export function useAnamnesis(id: number | null | undefined) {
  return useQuery({
    queryKey: id ? anamnesesKeys.detail(id) : ['anamneses', 'detail', 'none'],
    queryFn: () => anamnesesApi.get(id as number),
    enabled: Boolean(id)
  })
}

export function useCreateAnamnesis(clientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AnamnesisInput) => anamnesesApi.create(clientId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: anamnesesKeys.byClient(clientId) })
      void qc.invalidateQueries({ queryKey: clientsKeys.timeline(clientId) })
    }
  })
}

export function useUpdateAnamnesis(clientId: number, id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<AnamnesisInput>) => anamnesesApi.update(id, patch),
    onSuccess: (a) => {
      qc.setQueryData(anamnesesKeys.detail(id), a)
      void qc.invalidateQueries({ queryKey: anamnesesKeys.byClient(clientId) })
      void qc.invalidateQueries({ queryKey: clientsKeys.timeline(clientId) })
    }
  })
}

export function useDeleteAnamnesis(clientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => anamnesesApi.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: anamnesesKeys.byClient(clientId) })
      void qc.invalidateQueries({ queryKey: clientsKeys.timeline(clientId) })
    }
  })
}
