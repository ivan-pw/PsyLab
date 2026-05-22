/**
 * src/renderer/src/components/Layout/AppShell.tsx
 *
 * Общий каркас защищённой части приложения: слева Sidebar, сверху TopBar,
 * внутри — Outlet для вложенных страниц.
 *
 * Заголовок TopBar управляется на уровне страниц через context (см. ниже)
 * — это позволяет каждой странице задать свой title без проп-дрейлинга
 * через роутер. Минимально, без дополнительных библиотек.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

type ShellState = {
  title: string
  setTitle: (t: string) => void
}

const ShellCtx = createContext<ShellState | null>(null)

export function useShellTitle(title: string) {
  const ctx = useContext(ShellCtx)
  useEffect(() => {
    ctx?.setTitle(title)
  }, [ctx, title])
}

export function AppShell() {
  const [title, setTitle] = useState('PsyNote')
  const value = useMemo(() => ({ title, setTitle }), [title])

  return (
    <ShellCtx.Provider value={value}>
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar title={title} />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ShellCtx.Provider>
  )
}
