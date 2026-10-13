import { useApp } from '../stores/appStore'

export function FriendsDrawer() {
  const open = useApp((s) => s.friendsOpen)
  const setFriendsOpen = useApp((s) => s.setFriendsOpen)

  return (
    <>
      {open ? (
        <button
          className="absolute inset-0 z-40 bg-black/45"
          aria-label="Close friends"
          onClick={() => setFriendsOpen(false)}
        />
      ) : null}

      <aside
        className={`friends-drawer absolute bottom-0 right-0 top-0 z-50 flex w-[280px] flex-col border-l border-white/10 bg-[#0e0e12]/97 shadow-2xl backdrop-blur-xl transition-transform duration-250 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent-play)]" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2h19.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z" />
                <path d="M19.2 8.4v-1.2h-1.2V6h-1.2v1.2h-1.2v1.2h1.2v1.2h1.2V8.4z" />
              </svg>
            </span>
            <h2 className="text-sm font-semibold">Friends</h2>
          </div>
          <button
            className="rounded-md px-2 py-1 text-sm text-[var(--muted)] hover:bg-white/5 hover:text-white"
            onClick={() => setFriendsOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-xs text-[var(--muted)]">
          <span className="text-3xl opacity-35">☹</span>
          <p>Nobody is currently online.</p>
          <p className="text-[10px] opacity-70">Friend list coming soon.</p>
        </div>
      </aside>
    </>
  )
}
