import { create } from 'zustand'
import type { AppSnapshot, ConsoleLine, DownloadProgress, MicrosoftLoginState, UpdaterState } from '@shared/types'

interface Toast {
  id: number
  text: string
}

export type AppPage = 'play' | 'instances' | 'mods' | 'servers' | 'skins' | 'settings' | 'console'

interface AppState {
  snap: AppSnapshot | null
  page: AppPage
  loading: boolean
  toasts: Toast[]
  progress: DownloadProgress | null
  login: MicrosoftLoginState | null
  consoleLines: ConsoleLine[]
  setPage: (page: AppPage) => void
  toast: (text: string) => void
  refresh: () => Promise<void>
  pushConsole: (line: ConsoleLine) => void
  applyUpdater: (updater: UpdaterState) => void
}

let toastId = 1
let seenUpdaterSeq = 0
let pendingUpdater: UpdaterState | null = null

export const useApp = create<AppState>((set, get) => ({
  snap: null,
  page: 'play',
  loading: true,
  toasts: [],
  progress: null,
  login: null,
  consoleLines: [],
  setPage: (page) => set({ page }),
  toast: (text) => {
    const id = toastId++
    set({ toasts: [...get().toasts, { id, text }] })
    setTimeout(() => set({ toasts: get().toasts.filter((item) => item.id !== id) }), 3200)
  },
  refresh: async () => {
    const snap = await window.lunar.snapshot()
    document.documentElement.dataset.theme = snap.settings.theme
    document.documentElement.style.setProperty('--accent', snap.settings.accent)
    set((current) => {
      let updater = snap.updater
      if (pendingUpdater && pendingUpdater.seq > updater.seq) updater = pendingUpdater
      if (current.snap && current.snap.updater.seq > updater.seq) updater = current.snap.updater
      seenUpdaterSeq = Math.max(seenUpdaterSeq, updater.seq)
      pendingUpdater = null
      return { snap: { ...snap, updater }, loading: false }
    })
  },
  applyUpdater: (updater) => {
    if (updater.seq <= seenUpdaterSeq) return
    seenUpdaterSeq = updater.seq
    pendingUpdater = updater
    const snap = get().snap
    if (snap) set({ snap: { ...snap, updater } })
    if (updater.notify && updater.status) get().toast(updater.status)
  },
  pushConsole: (line) => set({ consoleLines: [...get().consoleLines.slice(-400), line] })
}))
