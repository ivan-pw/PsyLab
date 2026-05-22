/**
 * src/renderer/src/components/Layout/Sidebar.tsx
 *
 * Боковая навигация (plan §6.1):
 *   ┌────────┐
 *   │ logo   │
 *   │ Клиенты│
 *   │ Календ.│
 *   │ Настр. │
 *   │ ─────  │
 *   │ MiniCal│
 *   │ ─────  │
 *   │ Lock   │  кнопка блокировки внизу
 *   └────────┘
 */
import { CalendarDays, Lock, Settings, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { MiniCalendar } from './MiniCalendar'

const NAV = [
  { to: '/clients', i18nKey: 'nav.clients', icon: Users },
  { to: '/calendar', i18nKey: 'nav.calendar', icon: CalendarDays },
  { to: '/settings', i18nKey: 'nav.settings', icon: Settings }
] as const

export function Sidebar() {
  const { t } = useTranslation()
  const lock = useAuthStore((s) => s.lock)

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-card/40">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="grid size-8 place-items-center rounded-lg bg-primary text-base font-semibold text-primary-foreground">
          P
        </div>
        <div className="text-sm font-semibold tracking-tight">PsyNote</div>
      </div>

      <nav className="space-y-0.5 px-2">
        {NAV.map(({ to, i18nKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )
            }
          >
            <Icon className="size-4" />
            {t(i18nKey)}
          </NavLink>
        ))}
      </nav>

      <Separator className="my-3" />

      <ScrollArea className="flex-1 px-3">
        <MiniCalendar />
      </ScrollArea>

      <Separator />

      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => lock()}
        >
          <Lock className="size-4" />
          {t('nav.lock')}
        </Button>
      </div>
    </aside>
  )
}
