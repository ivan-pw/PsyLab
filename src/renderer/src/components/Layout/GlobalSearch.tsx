/**
 * src/renderer/src/components/Layout/GlobalSearch.tsx
 *
 * Поле поиска в шапке + выпадающий список результатов.
 *
 *  - Дебаунс 250 мс на вводе;
 *  - Запрос через useSearch (TanStack Query);
 *  - Хоткей ⌘K / Ctrl+K — фокус на поле;
 *  - Esc — очистка и закрытие;
 *  - Результаты сгруппированы по entity_type (плана §6.1).
 *
 * Клик по результату ведёт на карточку клиента. Конкретное событие
 * (заметка/анамнез/ревизия) не подсвечивается на странице клиента — это
 * уже задел этапа после: достаточно того, что попали к правильному клиенту.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useSearch } from '@/hooks/useSearch'
import type { SearchEntity, SearchHit } from '@shared/types'
import { cn } from '@/lib/utils'

const GROUP_ORDER: SearchEntity[] = ['client', 'note', 'anamnesis', 'protocol', 'revision']

export function GlobalSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [raw, setRaw] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Дебаунс. 250 мс — комфортно для печати, не дёргаем БД на каждый символ.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(raw.trim()), 250)
    return () => clearTimeout(id)
  }, [raw])

  // ⌘K / Ctrl+K — фокус.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Клик вне — закрываем выпадашку.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const { data: hits, isFetching } = useSearch(debounced, { limit: 30 })

  const grouped = useMemo(() => {
    const out: Record<SearchEntity, SearchHit[]> = {
      client: [],
      note: [],
      anamnesis: [],
      revision: [],
      protocol: []
    }
    for (const h of hits ?? []) out[h.entity_type].push(h)
    return out
  }, [hits])

  const hasResults = (hits?.length ?? 0) > 0
  const showDropdown = open && debounced.length >= 1

  function openClient(clientId: number) {
    navigate(`/clients/${clientId}`)
    setOpen(false)
    setRaw('')
    inputRef.current?.blur()
  }

  return (
    <div className="relative max-w-md flex-1" ref={containerRef}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value)
          setOpen(true)
        }}
        onFocus={() => raw && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setRaw('')
            setOpen(false)
            inputRef.current?.blur()
          }
        }}
        placeholder={t('topbar.search_placeholder')}
        className="pl-8"
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-[60vh] overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg">
          {isFetching && !hasResults && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t('search.loading')}
            </div>
          )}
          {!isFetching && !hasResults && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t('search.no_results')}
            </div>
          )}
          {GROUP_ORDER.map((entity) => {
            const list = grouped[entity]
            if (list.length === 0) return null
            return (
              <div key={entity} className="border-b last:border-b-0">
                <div className="px-3 pt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t(`search.groups.${entity}`)}
                </div>
                <ul>
                  {list.map((h) => (
                    <li key={`${h.entity_type}-${h.entity_id}`}>
                      <button
                        type="button"
                        onClick={() => openClient(h.client_id)}
                        className={cn(
                          'flex w-full items-baseline gap-2 px-3 py-1.5 text-left text-sm',
                          'hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <span className="shrink-0 font-medium">
                          {h.client_name ?? `#${h.client_id}`}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">
                          {h.snippet}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
