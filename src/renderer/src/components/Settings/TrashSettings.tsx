/**
 * src/renderer/src/components/Settings/TrashSettings.tsx
 *
 * Раздел «Корзина»: архивные клиенты — восстановить / удалить навсегда /
 * очистить корзину одной кнопкой (план §6.5).
 *
 * IPC уже реализован в этапе 2 (clients.restore / purge / emptyTrash).
 * После hard-delete каскад убирает встречи, заметки, анамнезы, ревизии и
 * записи из search_index (через триггеры).
 */
import { useMemo, useState } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { useClients } from '@/hooks/useClients'
import { clientsApi } from '@/api/clients'
import { useQueryClient } from '@tanstack/react-query'
import { clientsKeys } from '@/hooks/useClients'
import { formatDate } from '@/lib/format'

export function TrashSettings() {
  const qc = useQueryClient()
  const { data: clients, isLoading } = useClients({ includeArchived: true })
  const [busyId, setBusyId] = useState<number | null>(null)

  const archived = useMemo(
    () => (clients ?? []).filter((c) => c.archived_at),
    [clients]
  )

  function invalidate() {
    void qc.invalidateQueries({ queryKey: clientsKeys.all })
  }

  async function handleRestore(id: number, name: string) {
    setBusyId(id)
    try {
      await clientsApi.restore(id)
      invalidate()
      toast.success(`«${name}» восстановлен`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  async function handlePurge(id: number, name: string) {
    if (!window.confirm(`Удалить «${name}» навсегда? Восстановить будет нельзя.`)) {
      return
    }
    setBusyId(id)
    try {
      await clientsApi.purge(id)
      invalidate()
      toast.success(`«${name}» удалён навсегда`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusyId(null)
    }
  }

  async function handleEmpty() {
    if (
      !window.confirm(
        `Удалить навсегда всех ${archived.length} архивных клиентов? Восстановить будет нельзя.`
      )
    ) {
      return
    }
    try {
      await clientsApi.emptyTrash()
      invalidate()
      toast.success('Корзина очищена')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Архивных клиентов можно восстановить или удалить навсегда. Полное
          удаление каскадно убирает все встречи, заметки и анамнезы клиента.
        </p>
        {archived.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleEmpty}>
            <Trash2 className="size-4" />
            Очистить корзину
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : archived.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Корзина пуста.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {archived.map((c) => (
            <li
              key={c.id}
              className="group flex items-center gap-3 px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium">{c.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  Архивирован{' '}
                  {c.archived_at ? formatDate(c.archived_at) : '—'}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleRestore(c.id, c.full_name)}
                disabled={busyId === c.id}
              >
                <RotateCcw className="size-4" />
                Восстановить
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => void handlePurge(c.id, c.full_name)}
                disabled={busyId === c.id}
              >
                <Trash2 className="size-4" />
                Удалить
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
