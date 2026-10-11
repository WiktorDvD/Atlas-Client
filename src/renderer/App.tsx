import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { TitleBar } from './components/TitleBar'
import { ToastHost } from './components/ToastHost'
import { ConsolePage } from './pages/ConsolePage'
import { InstancesPage, ModsPage, ServersPage, SkinsPage } from './pages/ExtraPages'
import { PlayPage } from './pages/PlayPage'
import { SettingsPage } from './pages/SettingsPage'
import { useApp, type AppPage } from './stores/appStore'

export function App() {
  const page = useApp((s) => s.page)
  const setPage = useApp((s) => s.setPage)
  const loading = useApp((s) => s.loading)
  const toasts = useApp((s) => s.toasts)
  const body = (current: AppPage) => {
    switch (current) {
      case 'play':
        return <PlayPage />
      case 'instances':
        return <InstancesPage />
      case 'mods':
        return <ModsPage />
      case 'servers':
        return <ServersPage />
      case 'skins':
        return <SkinsPage />
      case 'settings':
        return <SettingsPage />
      case 'console':
        return <ConsolePage />
      default: {
        const unknown: never = current
        return unknown
      }
    }
  }
  return (
    <div className="lunar-shell relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 shadow-2xl">
      <div className="lunar-stars pointer-events-none absolute inset-0" />
      <TitleBar />
      <div className="relative flex min-h-0 flex-1">
        <Sidebar page={page} onChange={setPage} />
        <main className="relative min-w-0 flex-1 p-4">
          {loading ? (
            <div className="skel h-full rounded-3xl" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                className="h-full"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {body(page)}
              </motion.div>
            </AnimatePresence>
          )}
          <ToastHost toasts={toasts} />
        </main>
      </div>
    </div>
  )
}
