import logo from '../assets/logo.png'
import type { AppPage } from '../stores/appStore'

const items: { id: AppPage; label: string; icon: string }[] = [
  { id: 'play', label: 'Home', icon: '🚀' },
  { id: 'servers', label: 'Servers', icon: '🌐' },
  { id: 'skins', label: 'Skins', icon: '👕' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
  { id: 'console', label: 'Console', icon: '💻' }
]

export function Sidebar(props: { page: AppPage; onChange: (page: AppPage) => void }) {
  return (
    <nav className="flex w-[84px] shrink-0 flex-col items-stretch gap-1 border-r border-white/5 bg-[var(--sidebar)]/90 px-2 py-3">
      <div className="mb-3 flex flex-col items-center gap-1 px-1">
        <img
          src={logo}
          alt="Optic"
          className="h-12 w-12 object-contain drop-shadow-[0_0_18px_rgba(62,198,255,0.35)]"
          draggable={false}
        />
        <span className="text-[9px] font-semibold tracking-[0.16em] text-[var(--muted)]">OPTIC</span>
      </div>
      {items.map((item) => {
        const active = props.page === item.id
        return (
          <button
            key={item.id}
            onClick={() => props.onChange(item.id)}
            className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] transition ${
              active ? 'nav-active text-white' : 'text-[var(--muted)] hover:bg-white/5 hover:text-white'
            }`}
            title={item.label}
          >
            <span className="text-[18px] leading-none drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]" aria-hidden>
              {item.icon}
            </span>
            <span className="leading-none">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
