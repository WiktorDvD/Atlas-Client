import experimentImg from '../assets/update-launcher-experiment.png'

/** Editable Home / What's New feed.
 *  - NEWS: announcements (only show when you add them)
 *  - UPDATE: patch notes (only show boxes when you add them — no fillers)
 */

export type FeedKind = 'UPDATE' | 'NEWS'
export type FeedMedia = 'optic' | 'play' | 'patch' | 'pack'

export type FeedItem = {
  id: string
  kind: FeedKind
  title: string
  /** Short line under the title on cards / featured. */
  summary: string
  /** Full write-up shown when the card is opened. */
  description: string
  publishedAt: string
  media: FeedMedia
  /** Optional custom image (screenshot / art). Falls back to Optic logo. */
  image?: string
  /** Prefer this item for the large hero banner. */
  featured?: boolean
}

/** Announcements — only appear when you add items here. */
export const NEWS_ITEMS: FeedItem[] = [
  {
    id: 'news-beta-release',
    kind: 'NEWS',
    title: 'Beta release of Optic',
    summary: 'Butter reg, clean gameplay and optimized feel',
    description: 'Butter reg, clean gameplay and optimized feel',
    publishedAt: new Date().toISOString(),
    media: 'optic',
    featured: true
  }
]

/** Product / patch updates — add items when you have a real update. Empty = no update boxes. */
export const UPDATE_ITEMS: FeedItem[] = [
  {
    id: 'update-launcher-experiment',
    kind: 'UPDATE',
    title: 'new launcher experiment',
    summary: 'Heavily inspired by riot games',
    description: 'Heavily inspired by riot games',
    publishedAt: '2026-10-12T12:00:00.000Z',
    media: 'play',
    image: experimentImg
  }
]

export function homeFeed(): { featured: FeedItem | null; cards: FeedItem[] } {
  const updates = UPDATE_ITEMS.filter((item) => item.kind === 'UPDATE')
  const news = NEWS_ITEMS.filter((item) => item.kind === 'NEWS')
  const all = [...updates, ...news]

  const featured =
    all.find((item) => item.featured) ??
    updates[0] ??
    news[0] ??
    null

  const cards = all.filter((item) => !featured || item.id !== featured.id).slice(0, 4)
  return { featured, cards }
}
