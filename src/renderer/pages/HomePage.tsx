import { useState } from 'react'
import logo from '../assets/logo.png'
import { homeFeed, type FeedItem } from '../lib/homeFeed'

function formatDate(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function kindClass(kind: FeedItem['kind']): string {
  return kind === 'NEWS' ? 'riot-kind-news' : 'riot-kind-update'
}

function FeedArt(props: { item: FeedItem; size: 'featured' | 'thumb' | 'detail' }) {
  const src = props.item.image || logo
  const custom = Boolean(props.item.image)
  if (props.size === 'featured') {
    return (
      <div className={`riot-featured-media ${custom ? 'riot-media-photo' : `riot-media-${props.item.media}`}`}>
        <img
          src={src}
          alt=""
          className={custom ? 'riot-featured-photo' : 'riot-featured-logo'}
          draggable={false}
        />
      </div>
    )
  }
  if (props.size === 'detail') {
    return (
      <div className={`riot-detail-media ${custom ? 'riot-media-photo' : `riot-media-${props.item.media}`}`}>
        <img
          src={src}
          alt=""
          className={custom ? 'riot-detail-photo' : 'riot-detail-logo'}
          draggable={false}
        />
      </div>
    )
  }
  return (
    <div className={`riot-news-thumb ${custom ? 'riot-media-photo' : `riot-media-${props.item.media}`}`}>
      <span className={`riot-news-badge ${kindClass(props.item.kind)}`}>{props.item.kind}</span>
      {custom ? (
        <img src={src} alt="" className="riot-news-thumb-photo" draggable={false} />
      ) : null}
      {/* Logo always sits bottom-right on previous update / news cards */}
      <img src={logo} alt="" className="riot-news-thumb-logo" draggable={false} />
    </div>
  )
}

export function HomePage() {
  const { featured, cards } = homeFeed()
  const [active, setActive] = useState<FeedItem | null>(null)

  return (
    <div className="riot-news relative flex h-full min-h-0 flex-col overflow-auto px-8 py-7">
      <header className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Home</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white">What&apos;s New</h1>
      </header>

      {featured ? (
        <button type="button" className="riot-featured text-left" onClick={() => setActive(featured)}>
          <div className="riot-featured-copy">
            <div className="mb-4 flex items-center gap-2">
              <img src={logo} alt="" className="h-7 w-7 object-contain opacity-90" draggable={false} />
              <span className={`text-[11px] font-bold uppercase tracking-[0.16em] ${kindClass(featured.kind)}`}>
                {featured.kind}
              </span>
            </div>
            <h2 className="text-[26px] font-bold leading-tight tracking-tight text-white">{featured.title}</h2>
            {featured.summary ? (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">{featured.summary}</p>
            ) : null}
            {featured.publishedAt ? (
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                {formatDate(featured.publishedAt)}
              </p>
            ) : null}
          </div>
          <FeedArt item={featured} size="featured" />
        </button>
      ) : (
        <p className="text-sm text-white/40">No announcements or updates yet.</p>
      )}

      {cards.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 pb-6 xl:grid-cols-4">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              className="riot-news-card group text-left"
              onClick={() => setActive(card)}
            >
              <FeedArt item={card} size="thumb" />
              <h3 className="mt-3 text-[13px] font-bold uppercase tracking-[0.04em] text-white group-hover:text-[#5cff8a]">
                {card.title}
              </h3>
              {card.summary ? (
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-white/55">{card.summary}</p>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {active ? (
        <div className="riot-detail-root" role="dialog" aria-modal="true">
          <button type="button" className="riot-detail-backdrop" aria-label="Close" onClick={() => setActive(null)} />
          <div className="riot-detail-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-[0.16em] ${kindClass(active.kind)}`}>
                  {active.kind}
                </span>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">{active.title}</h2>
                {active.publishedAt ? (
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                    {formatDate(active.publishedAt)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="border border-white/15 px-3 py-1.5 text-sm text-white/70 hover:text-white"
                onClick={() => setActive(null)}
              >
                Close
              </button>
            </div>
            <div className="mt-5">
              <FeedArt item={active} size="detail" />
            </div>
            <div className="riot-detail-body mt-5">
              {active.description.trim() ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">{active.description}</p>
              ) : active.summary ? (
                <p className="text-sm text-white/70">{active.summary}</p>
              ) : (
                <p className="text-sm text-white/40">No description yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
