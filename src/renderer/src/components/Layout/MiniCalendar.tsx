/**
 * src/renderer/src/components/Layout/MiniCalendar.tsx
 *
 * Компактный месячный календарь под меню сайдбара (plan §6.1).
 * Клик по дню переходит на /calendar?date=YYYY-MM-DD; саму страницу
 * календаря построим в этапе 4. До тех пор клик навигирует туда же —
 * увидим заглушку.
 *
 * Минимум зависимостей: всё через date-fns + Tailwind.
 */
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function MiniCalendar() {
  const navigate = useNavigate()
  const [cursor, setCursor] = useState(() => new Date())
  const today = new Date()

  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function jump(d: Date) {
    navigate(`/calendar?date=${format(d, 'yyyy-MM-dd')}`)
  }

  return (
    <div className="text-xs">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Предыдущий месяц"
          onClick={() => setCursor((c) => subMonths(c, 1))}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <div className="select-none font-medium capitalize">
          {format(cursor, 'LLLL yyyy', { locale: ru })}
        </div>
        <button
          type="button"
          aria-label="Следующий месяц"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 text-center text-[10px] text-muted-foreground">
        {DOW.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-y-0.5">
        {days.map((d) => {
          const isCurMonth = isSameMonth(d, cursor)
          const isToday = isSameDay(d, today)
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => jump(d)}
              className={cn(
                'aspect-square w-full rounded text-[11px] leading-none transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                !isCurMonth && 'text-muted-foreground/40',
                isToday && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {format(d, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
