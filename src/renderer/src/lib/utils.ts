/**
 * src/renderer/src/lib/utils.ts
 *
 * cn() — стандартная утилита shadcn/ui для слияния Tailwind-классов.
 * clsx собирает классы из условий, tailwind-merge убирает конфликтующие
 * (например, `px-2` + `px-4` → останется `px-4`).
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
