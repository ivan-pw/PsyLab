/**
 * src/renderer/src/lib/utils.test.ts
 *
 * Минимальный тест на cn() — нужен в этапе 0 как smoke-тест vitest.
 * В следующих этапах появятся тесты для repo-слоя (better-sqlite3-multiple-ciphers)
 * и хуков React Query.
 */
import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn()', () => {
  it('объединяет классы и удаляет конфликтующие Tailwind-утилиты', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('px-2', null, undefined, false, 'py-1')).toBe('px-2 py-1')
  })
})
