import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'

export function startLocalServices(options: {
  java: string
  runtime: string
  ipc: number
  asset: number
  auth: number
  accountsFile: string
  logsDir: string
  discovery: string
  env: NodeJS.ProcessEnv
}): ChildProcess[] {
  const fakeCp = [
    path.join(options.runtime, 'libs', 'fake-launcher.jar'),
    path.join(options.runtime, 'libs', 'multiver-full', 'lunar.jar')
  ].join(path.delimiter)
  const launch = (args: string[]): ChildProcess => {
    const child = spawn(options.java, ['-cp', fakeCp, ...args], {
      detached: true,
      env: options.env,
      stdio: 'ignore',
      windowsHide: true
    })
    child.unref()
    return child
  }
  return [
    launch(['FakeLauncher', String(options.ipc), path.join(options.logsDir, 'fake-launcher.log'), options.accountsFile]),
    launch(
      [
        'FakeBackend',
        String(options.asset),
        String(options.auth),
        path.join(options.logsDir, 'fake-backend.log'),
        options.accountsFile,
        options.discovery
      ]
    )
  ]
}
