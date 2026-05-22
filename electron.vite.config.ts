/**
 * electron.vite.config.ts
 *
 * Конфиг для electron-vite. Сборщик понимает три «зоны» проекта:
 *  - main    (Node.js, в out/main)
 *  - preload (Node.js, мост contextBridge, в out/preload)
 *  - renderer (Vite + React, в out/renderer)
 *
 * externalizeDepsPlugin отделяет node_modules для main/preload —
 * иначе нативные модули (better-sqlite3-multiple-ciphers) ломаются при бандлинге.
 */
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main'
    },
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload'
    },
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    plugins: [react()],
    build: {
      outDir: resolve(__dirname, 'out/renderer'),
      rollupOptions: {
        input: resolve(__dirname, 'src/renderer/index.html')
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  }
})
