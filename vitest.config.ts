/**
 * vitest.config.ts
 *
 * Тесты для repo-слоя и утилит. Используем jsdom для тестов компонентов
 * (понадобится позже, в этапе 2+).
 */
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: []
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  }
})
