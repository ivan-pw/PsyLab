/**
 * src/renderer/src/components/Settings/MedicationPresetsSettings.tsx
 *
 * Раздел «Медикаменты (пресеты)» — справочник для автодополнения на странице
 * клиента (см. MedicationsField).
 *
 * Поддерживает: добавление, inline-редактирование названия, сортировку
 * стрелками, удаление с подтверждением. Не имеет связки с уже сохранёнными
 * у клиентов значениями: удаление пресета не трогает их.
 */
import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { toast } from '@/components/ui/sonner'
import {
  useCreateMedicationPreset,
  useDeleteMedicationPreset,
  useMedicationPresets,
  useReorderMedicationPresets,
  useUpdateMedicationPreset
} from '@/hooks/useMedicationPresets'
import type { MedicationPreset } from '@shared/types'

export function MedicationPresetsSettings() {
  const { data: items, isLoading } = useMedicationPresets()
  const create = useCreateMedicationPreset()
  const update = useUpdateMedicationPreset()
  const remove = useDeleteMedicationPreset()
  const reorder = useReorderMedicationPresets()

  const [newName, setNewName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (newName === null) return
    const v = newName.trim()
    if (!v) {
      setError('Введите название')
      return
    }
    setError(null)
    try {
      await create.mutateAsync({ name: v })
      setNewName(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleDelete(p: MedicationPreset) {
    if (!window.confirm(`Удалить пресет «${p.name}»?\nЭто не затронет уже сохранённых значений у клиентов.`)) {
      return
    }
    try {
      await remove.mutateAsync(p.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  function move(p: MedicationPreset, dir: -1 | 1) {
    if (!items) return
    const idx = items.findIndex((x) => x.id === p.id)
    const next = idx + dir
    if (idx < 0 || next < 0 || next >= items.length) return
    const ids = items.map((x) => x.id)
    ids.splice(idx, 1)
    ids.splice(next, 0, p.id)
    reorder.mutate(ids)
  }

  return (
    <section className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Этот список используется для автодополнения в поле «Медикаменты» на
        странице клиента. Кастомные значения, введённые на странице клиента,
        сюда автоматически не попадают — добавляйте их вручную.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : !items || items.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Пресетов пока нет.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((p, idx) => (
            <PresetRow
              key={p.id}
              preset={p}
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
              onMoveUp={() => move(p, -1)}
              onMoveDown={() => move(p, +1)}
              onDelete={() => void handleDelete(p)}
              onRename={(name) => update.mutate({ id: p.id, patch: { name } })}
            />
          ))}
        </ul>
      )}

      {newName !== null ? (
        <div className="flex items-end gap-2 rounded-md border border-dashed bg-card/40 p-2">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Название</label>
            <Input
              autoFocus
              value={newName}
              placeholder="Сертралин / Венлафаксин / …"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate()
                if (e.key === 'Escape') setNewName(null)
              }}
            />
          </div>
          <Button size="sm" onClick={() => void handleCreate()} disabled={create.isPending}>
            Добавить
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setNewName(null)}>
            Отмена
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setNewName('')}>
          <Plus className="size-4" />
          Добавить
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  )
}

type RowProps = {
  preset: MedicationPreset
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onRename: (name: string) => void
}

function PresetRow({
  preset,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onRename
}: RowProps) {
  const [name, setName] = useState(preset.name)

  return (
    <li className="group flex items-center gap-2 rounded-md border bg-card/40 px-2 py-1.5">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const v = name.trim()
          if (v && v !== preset.name) onRename(v)
          else if (!v) setName(preset.name)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') {
            setName(preset.name)
            ;(e.target as HTMLInputElement).blur()
          }
        }}
        className="h-7 flex-1"
      />
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              disabled={isFirst}
              onClick={onMoveUp}
            >
              <ArrowUp className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Выше</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              disabled={isLast}
              onClick={onMoveDown}
            >
              <ArrowDown className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ниже</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Удалить</TooltipContent>
        </Tooltip>
      </div>
    </li>
  )
}
