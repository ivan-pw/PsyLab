/**
 * src/renderer/src/components/Settings/ColorPaletteSettings.tsx
 *
 * Раздел «Цвета заметок» в настройках (plan §6.5).
 *
 *  - Список цветов с превью, hex и подписью (label).
 *  - Inline-редактирование hex/label по клику + Enter / blur.
 *  - Кнопки «вверх/вниз» для сортировки (плана §0 не требует drag-n-drop;
 *    кнопок достаточно, без extra-либ).
 *  - Удаление: если цвет уже используется в заметках, показываем диалог
 *    замены (ReplaceColorDialog).
 *  - «+ Добавить цвет» — открывает форму создания внизу списка.
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
import {
  useColors,
  useCreateColor,
  useDeleteColor,
  useReorderColors,
  useUpdateColor
} from '@/hooks/useColors'
import { colorsApi } from '@/api/colors'
import { ReplaceColorDialog } from './ReplaceColorDialog'
import type { NoteColor } from '@shared/types'

export function ColorPaletteSettings() {
  const { data: colors, isLoading } = useColors()
  const create = useCreateColor()
  const update = useUpdateColor()
  const reorder = useReorderColors()
  const remove = useDeleteColor()

  const [newColor, setNewColor] = useState<{ hex: string; label: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [replaceState, setReplaceState] = useState<{
    target: NoteColor
    others: NoteColor[]
    usageCount: number
  } | null>(null)

  async function handleDelete(c: NoteColor) {
    setError(null)
    try {
      const usage = await colorsApi.usageCount(c.id)
      if (usage === 0) {
        if (!window.confirm(`Удалить цвет «${c.label}»?`)) return
        await remove.mutateAsync({ fromId: c.id, toId: null })
      } else {
        setReplaceState({
          target: c,
          others: (colors ?? []).filter((x) => x.id !== c.id),
          usageCount: usage
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function move(c: NoteColor, dir: -1 | 1) {
    if (!colors) return
    const idx = colors.findIndex((x) => x.id === c.id)
    const next = idx + dir
    if (idx < 0 || next < 0 || next >= colors.length) return
    const ids = colors.map((x) => x.id)
    ids.splice(idx, 1)
    ids.splice(next, 0, c.id)
    reorder.mutate(ids)
  }

  async function handleCreate() {
    if (!newColor) return
    setError(null)
    try {
      await create.mutateAsync(newColor)
      setNewColor(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <section className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Каждая заметка может быть помечена цветом из палитры. К каждому цвету
        привязана текстовая подпись-бейдж.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <ul className="space-y-1">
          {(colors ?? []).map((c, idx) => (
            <ColorRow
              key={c.id}
              color={c}
              isFirst={idx === 0}
              isLast={idx === (colors?.length ?? 0) - 1}
              onMoveUp={() => move(c, -1)}
              onMoveDown={() => move(c, +1)}
              onDelete={() => void handleDelete(c)}
              onPatch={(patch) => update.mutate({ id: c.id, patch })}
            />
          ))}
        </ul>
      )}

      {newColor ? (
        <div className="flex items-end gap-2 rounded-md border border-dashed bg-card/40 p-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Цвет</label>
            <Input
              type="color"
              value={newColor.hex}
              className="h-9 w-12 cursor-pointer p-1"
              onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Подпись</label>
            <Input
              value={newColor.label}
              autoFocus
              placeholder="Срочно / Идея / …"
              onChange={(e) => setNewColor({ ...newColor, label: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate()
                if (e.key === 'Escape') setNewColor(null)
              }}
            />
          </div>
          <Button size="sm" onClick={() => void handleCreate()} disabled={create.isPending}>
            Добавить
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setNewColor(null)}>
            Отмена
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setNewColor({ hex: '#888888', label: '' })}
        >
          <Plus className="size-4" />
          Добавить цвет
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <ReplaceColorDialog
        open={replaceState !== null}
        target={replaceState?.target ?? null}
        others={replaceState?.others ?? []}
        usageCount={replaceState?.usageCount ?? 0}
        onClose={() => setReplaceState(null)}
      />
    </section>
  )
}

type RowProps = {
  color: NoteColor
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onPatch: (patch: { hex?: string; label?: string }) => void
}

function ColorRow({
  color,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onPatch
}: RowProps) {
  const [label, setLabel] = useState(color.label)
  const [hex, setHex] = useState(color.hex)

  return (
    <li className="group flex items-center gap-2 rounded-md border bg-card/40 px-2 py-1.5">
      <Input
        type="color"
        value={hex}
        className="h-7 w-9 cursor-pointer p-1"
        onChange={(e) => setHex(e.target.value)}
        onBlur={() => {
          if (hex !== color.hex) onPatch({ hex })
        }}
      />
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => {
          if (label.trim() && label !== color.label) onPatch({ label: label.trim() })
          else if (!label.trim()) setLabel(color.label)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') {
            setLabel(color.label)
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
