export function TitleBar() {
  return (
    <header
      className="flex h-11 items-center justify-between border-b border-white/5 bg-black/25 pl-4 pr-1"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold tracking-[0.22em] text-white/90">LUNAR REMAKE</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[var(--muted)]">
          1.8.9
        </span>
      </div>
      <div className="flex" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
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
