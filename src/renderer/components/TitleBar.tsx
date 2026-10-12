import logo from '../assets/logo.png'
import { useApp } from '../stores/appStore'

export function TitleBar() {
  const snap = useApp((s) => s.snap)
  const account = snap?.accounts.find((item) => item.id === snap.activeAccountId)
  const running = snap?.launch.running ? 1 : 0

  return (
    <header
      className="flex h-12 items-center justify-between border-b border-white/5 bg-black/30 pl-3 pr-1"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <img src={logo} alt="" className="h-7 w-7 object-contain" draggable={false} />
        <span className="text-[11px] font-semibold tracking-[0.08em] text-white/45">
          Atlas Client <span className="text-white/25">›</span> Launchpad
        </span>
        {account ? (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-white/25">·</span>
            <span className="truncate text-[12px] text-white/80">
              Welcome back, <span className="font-semibold text-white">{account.username}</span>
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-play)]" title="Online" />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <span className="hidden text-[11px] text-[var(--muted)] md:inline">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-play)]" />
          {running} instance{running === 1 ? '' : 's'} running
        </span>
        {(['minimize', 'maximize', 'close'] as const).map((action) => (
          <button
            key={action}
            className={`h-9 w-11 text-sm text-[var(--muted)] transition hover:bg-white/10 hover:text-white ${
              action === 'close' ? 'hover:bg-[var(--danger)] hover:text-white' : ''
            }`}
            onClick={() => void window.lunar.windowAction(action)}
          >
            {action === 'minimize' ? '–' : action === 'maximize' ? '□' : '×'}
          </button>
        ))}
      </div>
    </header>
  )
}
