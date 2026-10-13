import { AnimatePresence, motion } from 'framer-motion'
import { FriendsDrawer } from './components/FriendsDrawer'
import { SideRail } from './components/SideRail'
import { TopChrome } from './components/TopChrome'
import { ToastHost } from './components/ToastHost'
import { ConsolePage } from './pages/ConsolePage'
import { InstancesPage, ServersPage, SkinsPage } from './pages/ExtraPages'
import { HomePage } from './pages/HomePage'
import { PlayPage } from './pages/PlayPage'
import { SettingsPage } from './pages/SettingsPage'
import logo from './assets/logo.png'
import wordmark from './assets/optic-wordmark.png'
import { useApp, type AppPage } from './stores/appStore'

export function App() {
  const page = useApp((s) => s.page)
  const setPage = useApp((s) => s.setPage)
  const loading = useApp((s) => s.loading)
  const toasts = useApp((s) => s.toasts)
  const snap = useApp((s) => s.snap)

  const body = (current: AppPage) => {
    switch (current) {
      case 'home':
        return <HomePage />
      case 'play':
        return <PlayPage />
      case 'instances':
        return <InstancesPage />
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
    <div className="optic-shell relative flex h-full min-h-0 w-full flex-1 overflow-hidden border border-white/10">
      <div className="optic-bg pointer-events-none absolute inset-0" />
      <SideRail />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <TopChrome />
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {loading ? (
            <div className="skel m-4 h-full rounded-2xl" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                className={`min-h-0 flex-1 ${page === 'play' || page === 'home' ? '' : 'overflow-auto p-4'}`}
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
          <FriendsDrawer />
        </main>
        <footer className="relative z-10 flex items-center justify-between gap-3 border-t border-white/8 bg-[#0a0a0e]/95 px-4 py-2 text-[10px] text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-4 w-4 object-contain opacity-80" draggable={false} />
            <span>{snap?.updater.version || '1.1.0'}</span>
            <button className="opacity-60 hover:opacity-100" onClick={() => setPage('console')}>
              · Console
            </button>
            <button
              className="opacity-60 hover:opacity-100"
              onClick={() =>
                void window.lunar
                  .openGameFiles()
                  .catch((e: unknown) =>
                    useApp.getState().toast(e instanceof Error ? e.message : 'Could not open files')
                  )
              }
            >
              · Files
            </button>
          </div>
          <img
            src={wordmark}
            alt="Optic"
            className="h-5 w-auto max-w-[120px] object-contain opacity-95"
            draggable={false}
          />
        </footer>
      </div>
    </div>
  )
}
