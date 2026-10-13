import type { ReactNode } from 'react'
import logo from '../assets/logo.png'
import { useApp, type AppPage } from '../stores/appStore'

const items: { id: AppPage | 'files'; label: string; icon: ReactNode }[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 3.2 3.5 10.2V21h5.5v-6.2h6V21H20.5V10.2L12 3.2z" />
      </svg>
    )
  },
  {
    id: 'play',
    label: '1.8 Minecraft',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M8 5.2v13.6L20 12 8 5.2z" />
      </svg>
    )
  },
  {
    id: 'servers',
    label: 'Servers',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M4 5h16v4H4V5zm0 5h16v4H4v-4zm0 5h16v4H4v-4z" />
      </svg>
    )
  },
  {
    id: 'skins',
    label: 'Skins',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4 0-8 2-8 4.5V21h16v-2.5C20 16 16 14 12 14z" />
      </svg>
    )
  },
  {
    id: 'files',
    label: 'Files',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-11z" />
      </svg>
    )
  }
]

export function SideRail() {
  const page = useApp((s) => s.page)
  const setPage = useApp((s) => s.setPage)

  return (
    <aside className="side-rail relative z-40 flex w-[64px] shrink-0 flex-col items-center border-r border-white/8 bg-[#0b0b0e] py-3">
      <button
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-white/5"
        onClick={() => setPage('home')}
        title="Optic"
      >
        <img src={logo} alt="Optic" className="h-9 w-9 object-contain" draggable={false} />
      </button>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {items.map((item) => {
          const active = item.id !== 'files' && page === item.id
          return (
            <button
              key={item.id}
              title={item.label}
              onClick={() => {
                if (item.id === 'files') {
                  void window.lunar
                    .openGameFiles()
                    .catch((e: unknown) =>
                      useApp.getState().toast(e instanceof Error ? e.message : 'Could not open files')
                    )
                  return
                }
                setPage(item.id)
              }}
              className={`side-rail-btn ${active ? 'side-rail-btn-active' : ''}`}
            >
              {item.icon}
            </button>
          )
        })}
      </nav>

      <button
        className={`side-rail-btn mb-1 ${page === 'settings' ? 'side-rail-btn-active' : ''}`}
        title="Settings"
        onClick={() => setPage('settings')}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.2 7.2 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.57.23-1.11.54-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.77 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.89 14.52a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.3.59.22l2.39-.96c.5.4 1.05.71 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.57-.23 1.11-.54 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
        </svg>
      </button>
    </aside>
  )
}
