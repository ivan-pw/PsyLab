/**
 * src/renderer/src/router.tsx
 *
 * Маршруты приложения. HashRouter — потому что в prod renderer грузится
 * через file:// и обычный BrowserRouter не работает.
 *
 * Защита: RequireUnlock / RedirectIfUnlocked — проверка флага из authStore.
 * После UnlockPage все защищённые страницы рендерятся внутри AppShell
 * (сайдбар + топбар + Outlet).
 */
import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import UnlockPage from '@/pages/Unlock'
import ClientsListPage from '@/pages/ClientsList'
import ClientDetailPage from '@/pages/ClientDetail'
import CalendarPage from '@/pages/Calendar'
import SettingsPage from '@/pages/Settings'
import { AppShell } from '@/components/Layout/AppShell'

function RequireUnlock({ children }: { children: React.ReactNode }) {
  const unlocked = useAuthStore((s) => s.unlocked)
  if (!unlocked) return <Navigate to="/unlock" replace />
  return <>{children}</>
}

function RedirectIfUnlocked({ children }: { children: React.ReactNode }) {
  const unlocked = useAuthStore((s) => s.unlocked)
  if (unlocked) return <Navigate to="/clients" replace />
  return <>{children}</>
}

export function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route
          path="/unlock"
          element={
            <RedirectIfUnlocked>
              <UnlockPage />
            </RedirectIfUnlocked>
          }
        />
        <Route
          element={
            <RequireUnlock>
              <AppShell />
            </RequireUnlock>
          }
        >
          <Route path="/clients" element={<ClientsListPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/clients" replace />} />
      </Routes>
    </Router>
  )
}
