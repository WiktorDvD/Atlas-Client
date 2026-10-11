import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'
import { IpcChannel } from '@shared/ipc'
import { useApp } from './stores/appStore'
import type { ConsoleLine, DownloadProgress, LaunchState, MicrosoftLoginState, UpdaterState } from '@shared/types'

function Boot() {
  const refresh = useApp((s) => s.refresh)
  const pushConsole = useApp((s) => s.pushConsole)
  useEffect(() => {
    if (!window.lunar) return
    void refresh()
    const offs = [
      window.lunar.on(IpcChannel.toast, (payload) => {
        if (typeof payload === 'string' && payload) useApp.getState().toast(payload)
      }),
      window.lunar.on(IpcChannel.console, (payload) => pushConsole(payload as ConsoleLine)),
      window.lunar.on(IpcChannel.progress, (payload) => useApp.setState({ progress: payload as DownloadProgress })),
      window.lunar.on(IpcChannel.authProgress, (payload) => {
        const next = payload as MicrosoftLoginState
        useApp.setState({ login: next })
        if (next.state === 'success') {
          useApp.getState().toast(next.message || 'Account added')
          void refresh()
        }
        if (next.state === 'error') useApp.getState().toast(next.message)
      }),
      window.lunar.on(IpcChannel.launchState, (payload) => {
        const launch = payload as LaunchState
        const snap = useApp.getState().snap
        if (snap) useApp.setState({ snap: { ...snap, launch } })
      }),
      window.lunar.on(IpcChannel.clientStatus, () => void refresh()),
      window.lunar.on(IpcChannel.updater, (payload) => {
        useApp.getState().applyUpdater(payload as UpdaterState)
      })
    ]
    return () => offs.forEach((off) => off())
  }, [refresh, pushConsole])
  return <App />
}

const root = document.getElementById('root')
if (root) createRoot(root).render(<StrictMode><Boot /></StrictMode>)
