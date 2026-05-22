/**
 * src/renderer/src/components/PasswordStrengthMeter.tsx
 *
 * Полоса силы пароля (5 сегментов по zxcvbn score) + подсказки.
 * Используется в UnlockPage (setup) и SecuritySettings/WeakPasswordGate
 * (смена пароля).
 */
import { useMemo } from 'react'
import { checkPasswordStrength, strengthLabel } from '@/lib/passwordStrength'
import { cn } from '@/lib/utils'

type Props = {
  password: string
  className?: string
}

const SEGMENT_COLORS = [
  'bg-destructive',
  'bg-destructive',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-emerald-600'
] as const

export function PasswordStrengthMeter({ password, className }: Props) {
  const result = useMemo(() => checkPasswordStrength(password), [password])

  if (!password) {
    return (
      <p className={cn('text-xs text-muted-foreground', className)}>
        Минимум 12 символов, лучше — длинная фраза из нескольких слов.
      </p>
    )
  }

  const filled = Math.max(1, result.score + 1)
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded',
              i < filled ? SEGMENT_COLORS[result.score] : 'bg-muted'
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span
          className={cn(
            result.ok ? 'text-emerald-500' : 'text-muted-foreground'
          )}
        >
          {strengthLabel(result.score)}
          {!result.ok ? ' — недостаточно' : ''}
        </span>
        {result.hints.length > 0 && (
          <span className="text-muted-foreground">{result.hints[0]}</span>
        )}
      </div>
    </div>
  )
}
