import { useEffect, useRef, useState } from 'react'
import { pageLabel } from '../lib/pageLabel'
import { useApp } from '../stores/appStore'

type MenuMode = 'closed' | 'list' | 'add' | 'offline'

function GuestAvatar() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded bg-[#2a2a32] text-white/70">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.8 0-8 1.9-8 4.2V20h16v-1.8C20 15.9 15.8 14 12 14z" />
      </svg>
    </span>
  )
}

export function TopChrome() {
  const page = useApp((s) => s.page)
  const snap = useApp((s) => s.snap)
  const refresh = useApp((s) => s.refresh)
  const toast = useApp((s) => s.toast)
  const login = useApp((s) => s.login)
  const accountMenuNonce = useApp((s) => s.accountMenuNonce)
  const friendsOpen = useApp((s) => s.friendsOpen)
  const toggleFriends = useApp((s) => s.toggleFriends)
  const account = snap?.accounts.find((item) => item.id === snap.activeAccountId)
  const otherAccounts = (snap?.accounts ?? []).filter((item) => item.id !== snap?.activeAccountId)

  const [menu, setMenu] = useState<MenuMode>('closed')
  const [offline, setOffline] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  const onGame = page === 'play'
  const category = pageLabel(page)

  useEffect(() => {
    if (accountMenuNonce > 0) setMenu((current) => (current === 'closed' ? 'list' : current))
  }, [accountMenuNonce])

  useEffect(() => {
    if (menu === 'closed') return
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenu('closed')
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menu])

  const openMenu = () => setMenu((current) => (current === 'closed' ? 'list' : 'closed'))

  const signOut = () => {
    if (!account) {
      setMenu('closed')
      return
    }
    void window.lunar
      .removeAccount(account.id)
      .then(() => {
        setMenu('closed')
        return refresh()
      })
      .catch((e: unknown) => toast(e instanceof Error ? e.message : 'Could not sign out'))
  }

  return (
    <header
      className={`relative z-30 flex h-14 shrink-0 items-center gap-4 border-b border-white/8 px-5 ${
        onGame ? 'top-chrome-game backdrop-blur-md' : 'bg-[#0c0c10]/90 backdrop-blur-xl'
      }`}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <span className="text-sm font-extrabold uppercase tracking-[0.14em] text-white">{category}</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="relative" ref={menuRef}>
          <button
            className="profile-pill relative flex items-center rounded-md border border-white/12 bg-[#141418]/90 p-1 hover:bg-white/5"
            onClick={() => {
              useApp.getState().setFriendsOpen(false)
              openMenu()
            }}
            title={account?.username ?? 'Profile'}
          >
            {account ? (
              <img
                alt=""
                className="h-7 w-7 rounded-sm object-cover"
                src={`https://mc-heads.net/avatar/${account.uuid}/40`}
              />
            ) : (
              <GuestAvatar />
            )}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent-play)] opacity-50" />
              <span className="relative m-auto inline-flex h-2 w-2 rounded-full bg-[var(--accent-play)]" />
            </span>
          </button>

          {menu !== 'closed' ? (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[250px] overflow-hidden rounded-xl border border-white/10 bg-[#121216]/97 shadow-2xl backdrop-blur-xl">
              {menu === 'list' ? (
                <div className="flex max-h-[320px] flex-col">
                  <div className="border-b border-white/8 px-3 py-3">
                    <div className="flex items-center gap-2">
                      {account ? (
                        <img
                          alt=""
                          className="h-9 w-9 rounded-sm"
                          src={`https://mc-heads.net/avatar/${account.uuid}/48`}
                        />
                      ) : (
                        <GuestAvatar />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {account?.username ?? 'Not signed in'}
                        </div>
                        <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                          {account ? account.kind : 'Guest'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {otherAccounts.length > 0 ? (
                    <ul className="max-h-[140px] overflow-auto border-b border-white/8 py-1">
                      {otherAccounts.map((item) => (
                        <li key={item.id}>
                          <button
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-white/5"
                            onClick={() =>
                              void window.lunar
                                .selectAccount(item.id)
                                .then(() => {
                                  setMenu('closed')
                                  return refresh()
                                })
                                .catch((e: unknown) =>
                                  toast(e instanceof Error ? e.message : 'Could not switch account')
                                )
                            }
                          >
                            <img
                              alt=""
                              className="h-7 w-7 rounded-sm"
                              src={`https://mc-heads.net/avatar/${item.uuid}/32`}
                            />
                            <div className="min-w-0">
                              <div className="truncate font-medium">{item.username}</div>
                              <div className="text-[10px] text-[var(--muted)]">{item.kind}</div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="p-1.5">
                    {account ? (
                      <button
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-white/5"
                        onClick={signOut}
                      >
                        Sign out
                      </button>
                    ) : null}
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold hover:bg-white/5"
                      onClick={() => setMenu('add')}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent-play)]/20 text-[var(--accent-play)]">
                        +
                      </span>
                      Add account
                    </button>
                  </div>
                </div>
              ) : null}

              {menu === 'add' ? (
                <div className="p-2">
                  <button
                    className="mb-1 px-2 py-1 text-[10px] text-[var(--muted)] hover:text-white"
                    onClick={() => setMenu('list')}
                  >
                    ← Back
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-[#07110a]"
                    style={{ background: 'var(--accent-play)' }}
                    onClick={() => {
                      setMenu('closed')
                      void window.lunar.startMicrosoft()
                    }}
                  >
                    Microsoft account
                  </button>
                  <button
                    className="mt-1.5 flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-left text-xs hover:bg-white/5"
                    onClick={() => setMenu('offline')}
                  >
                    Offline account
                  </button>
                </div>
              ) : null}

              {menu === 'offline' ? (
                <div className="p-2">
                  <button
                    className="mb-1 px-2 py-1 text-[10px] text-[var(--muted)] hover:text-white"
                    onClick={() => setMenu('add')}
                  >
                    ← Back
                  </button>
                  <input
                    className="mb-1.5 w-full rounded-lg border border-white/12 bg-transparent px-3 py-2 text-xs"
                    placeholder="Username"
                    value={offline}
                    autoFocus
                    onChange={(event) => setOffline(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        void window.lunar
                          .addOffline(offline)
                          .then(() => {
                            setOffline('')
                            setMenu('closed')
                            return refresh()
                          })
                          .catch((e: unknown) =>
                            toast(e instanceof Error ? e.message : 'Could not add account')
                          )
                      }
                    }}
                  />
                  <button
                    className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-[#07110a]"
                    style={{ background: 'var(--accent-play)' }}
                    onClick={() =>
                      void window.lunar
                        .addOffline(offline)
                        .then(() => {
                          setOffline('')
                          setMenu('closed')
                          return refresh()
                        })
                        .catch((e: unknown) =>
                          toast(e instanceof Error ? e.message : 'Could not add account')
                        )
                    }
                  >
                    Confirm
                  </button>
                </div>
              ) : null}

              {login?.state === 'waiting' || login?.state === 'starting' ? (
                <div className="border-t border-white/8 px-3 py-2 text-[11px] text-[var(--muted)]">
                  {login.message}
                  {login.code ? (
                    <>
                      {' '}
                      <span className="font-semibold text-white">{login.code}</span>
                    </>
                  ) : null}
                </div>
              ) : null}
              {login?.state === 'error' ? (
                <div className="border-t border-white/8 px-3 py-2 text-[11px] text-red-300">{login.message}</div>
              ) : null}
            </div>
          ) : null}
        </div>

        <button
          className={`flex h-9 w-9 items-center justify-center rounded-md border border-white/12 bg-[#141418]/90 text-[var(--accent-play)] transition hover:bg-white/5 ${
            friendsOpen ? 'bg-white/8 ring-1 ring-[var(--accent-play)]/40' : ''
          }`}
          title="Friends"
          onClick={() => {
            setMenu('closed')
            toggleFriends()
          }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v1.2h19.2v-1.2c0-3.2-6.4-4.8-9.6-4.8z" />
            <path d="M19.2 8.4v-1.2h-1.2V6h-1.2v1.2h-1.2v1.2h1.2v1.2h1.2V8.4z" />
          </svg>
        </button>

        {(['minimize', 'close'] as const).map((action) => (
          <button
            key={action}
            className={`h-9 w-10 text-sm text-[var(--muted)] transition hover:bg-white/10 hover:text-white ${
              action === 'close' ? 'hover:bg-[var(--danger)] hover:text-white' : ''
            }`}
            onClick={() => void window.lunar.windowAction(action)}
          >
            {action === 'minimize' ? '–' : '×'}
          </button>
        ))}
      </div>
    </header>
  )
}
