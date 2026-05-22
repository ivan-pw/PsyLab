/**
 * src/renderer/src/components/Layout/TopBar.tsx
 *
 * Верхняя панель: заголовок + глобальный поиск + переключатели темы и языка.
 * Тема и язык хранятся в zustand-сторах + БД-настройках; здесь UI-обёртки.
 */
import { Globe, Laptop, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useThemeStore } from '@/store/themeStore'
import { useLocaleStore } from '@/store/localeStore'
import { GlobalSearch } from './GlobalSearch'
import type { Locale, Theme } from '@shared/types'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  className?: string
}

const THEME_CYCLE: Theme[] = ['system', 'light', 'dark']
const THEME_ICON: Record<Theme, typeof Sun> = {
  system: Laptop,
  light: Sun,
  dark: Moon
}

export function TopBar({ title, className }: Props) {
  const { t } = useTranslation()
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.set)
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.set)

  const Icon = THEME_ICON[theme]

  function cycleTheme() {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length]
    void setTheme(next ?? 'system')
  }

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center gap-3 border-b bg-background/60 px-4 backdrop-blur',
        className
      )}
    >
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>

      <div className="ml-4 flex-1">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('topbar.toggle_theme')}
              onClick={cycleTheme}
            >
              <Icon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t('topbar.toggle_theme')} ({t(`theme.${theme}`)})
          </TooltipContent>
        </Tooltip>

        <Select value={locale} onValueChange={(v) => void setLocale(v as Locale)}>
          <SelectTrigger className="h-9 w-[140px] gap-1" aria-label={t('topbar.language')}>
            <Globe className="size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ru">{t('language.ru')}</SelectItem>
            <SelectItem value="en">{t('language.en')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
  )
}
