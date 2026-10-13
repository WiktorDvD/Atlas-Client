import type { AppPage } from '../stores/appStore'

const labels: Record<AppPage, string> = {
  home: 'Home',
  play: 'Play',
  instances: 'Profiles',
  servers: 'Servers',
  skins: 'Skins',
  settings: 'Settings',
  console: 'Console'
}

export function pageLabel(page: AppPage): string {
  return labels[page] ?? 'Optic'
}
