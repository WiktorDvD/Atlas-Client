import type { AppPage } from '../stores/appStore'

const items: { id: AppPage; label: string; icon: string }[] = [
  { id: 'play', label: 'Home', icon: '▶' },
  { id: 'instances', label: 'Profiles', icon: '▣' },
  { id: 'mods', label: 'Mods', icon: '◈' },
  { id: 'servers', label: 'Servers', icon: '◎' },
  { id: 'skins', label: 'Cosmetics', icon: '◇' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
  { id: 'console', label: 'Console', icon: '⌘' }
]

export function Sidebar(props: { page: AppPage; onChange: (page: AppPage) => void }) {
  return (
    <nav className="flex w-[92px] flex-col items-stretch gap-1 border-r border-white/5 bg-black/20 px-2 py-3">
      <div className="mb-3 flex flex-col items-center gap-1 px-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b8cff] to-[#5cff8a] text-sm font-bold text-[#07090e] shadow-[0_0_24px_rgba(92,255,138,0.25)]">
          LR
        </div>
        <span className="text-[10px] font-semibold tracking-[0.14em] text-[var(--muted)]">REMAKE</span>
      </div>
      {items.map((item) => {
        const active = props.page === item.id
        return (
          <button
            key={item.id}
            onClick={() => props.onChange(item.id)}
            className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[11px] transition ${
              active ? 'nav-item-active' : 'text-[var(--muted)] hover:bg-white/5 hover:text-white'
            }`}
            title={item.label}
          >
            <span className="text-base leading-none opacity-90">{item.icon}</span>
            <span className="leading-none">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
