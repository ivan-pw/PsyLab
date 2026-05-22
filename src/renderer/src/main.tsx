/**
 * src/renderer/src/main.tsx
 *
 * Точка входа React-приложения (renderer-процесс).
 * Здесь:
 *  - монтируем <App /> в #root;
 *  - подключаем глобальные стили (Tailwind base + CSS-переменные тем).
 *
 * Всё остальное — роутинг, query-клиент, провайдеры темы и i18n —
 * подключим в App.tsx начиная с этапа 2.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Не найден #root в index.html')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
