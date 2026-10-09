import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { routes } from '../../config/routes'
import {
  aggregateArtworkStats,
  artworkHasActivity,
  sortArtworkRows,
  topArtworks,
  type ArtworkSortKey,
} from '../lib/artworkStats'
import { loadArtworkStats } from '../lib/artworkStatsData'
import { sinceDay, sinceIso, type Period } from '../lib/eventStats'
import { useLoad } from '../useLoad'

const COLUMNS: { key: Exclude<ArtworkSortKey, 'interest'>; label: string }[] = [
  { key: 'views', label: 'admin.stats.artworks.views' },
  { key: 'clicks', label: 'admin.stats.artworks.clicks' },
  { key: 'lightboxOpens', label: 'admin.stats.artworks.lightbox' },
  { key: 'inquiryClicks', label: 'admin.stats.artworks.inquiryClicks' },
  { key: 'inquiries', label: 'admin.stats.artworks.inquiries' },
]

// Werkstatistik für Administratoren: anonyme Zähler je Werk und Tag, der Zeitraum kommt von der Seite.
export default function ArtworkStatsSection({
  period,
  now,
}: {
  period: Period
  now: Date
}) {
  const { t } = useTranslation()
  const { state, reload } = useLoad(loadArtworkStats)
  const [sort, setSort] = useState<{ key: ArtworkSortKey; desc: boolean }>({
    key: 'interest',
    desc: true,
  })
  const [showEmpty, setShowEmpty] = useState(false)

  const change = (key: ArtworkSortKey) =>
    setSort((current) =>
      current.key === key ? { key, desc: !current.desc } : { key, desc: true },
    )

  return (
    <section className="mt-16" aria-labelledby="stats-artworks">
      <h2 id="stats-artworks" className="label">
        {t('admin.stats.artworks.title')}
      </h2>
      <p className="mt-3 max-w-prose text-sm text-muted">
        {t('admin.stats.artworks.privacy')}
      </p>

      {state.status === 'loading' && (
        <p className="label mt-8" role="status">
          {t('admin.loading')}
        </p>
      )}
      {state.status === 'error' && (
        <div className="mt-8" role="alert">
          <p>{t('admin.loadError')}</p>
          <p className="mt-2 text-sm text-muted">{state.message}</p>
          <p className="mt-4">
            <button type="button" className="btn" onClick={reload}>
              {t('admin.retry')}
            </button>
          </p>
        </div>
      )}

      {state.status === 'ready' &&
        (() => {
          const { rows, totals } = aggregateArtworkStats(
            state.data.stats,
            state.data.artworks,
            state.data.inquiries,
            { day: sinceDay(period, now), iso: sinceIso(period, now) },
          )
          const sorted = sortArtworkRows(rows, sort.key, sort.desc)
          const visible = showEmpty ? sorted : sorted.filter(artworkHasActivity)
          const hidden = sorted.length - visible.length
          const top = topArtworks(rows, 3)
          const label = (title: string | null) =>
            title ?? t('admin.stats.artworks.untitled')

          return (
            <>
              <dl
                className="m-0 mt-8 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-5"
                data-artwork-totals
              >
                {COLUMNS.map((column) => (
                  <div key={column.key} className="border-t border-line pt-3">
                    <dt className="label">{t(column.label)}</dt>
                    <dd className="m-0 mt-1 text-[1.75rem] leading-none">
                      {totals[column.key]}
                    </dd>
                  </div>
                ))}
              </dl>

              {top.length > 0 && (
                <div className="mt-10" data-top-artworks>
                  <h3 className="label">{t('admin.stats.artworks.top')}</h3>
                  <ol className="m-0 mt-4 grid list-none gap-6 p-0 sm:grid-cols-3">
                    {top.map((row, index) => (
                      <li key={row.artworkId}>
                        {row.imageUrl ? (
                          <img
                            src={row.imageUrl}
                            alt=""
                            className="block h-32 w-full bg-line/30 object-contain"
                          />
                        ) : (
                          <span className="block h-32 w-full border border-line" />
                        )}
                        <p className="mt-2">
                          <span className="label">{index + 1}. </span>
                          <Link
                            to={`${routes.adminArtworks}/${row.artworkId}`}
                            className="no-underline"
                          >
                            {label(row.title)}
                          </Link>
                        </p>
                        <p className="label mt-1">
                          {t('admin.stats.artworks.topLine', {
                            inquiries: row.inquiries,
                            lightbox: row.lightboxOpens,
                            views: row.views,
                          })}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {visible.length === 0 ? (
                <p className="mt-10 text-muted">
                  {t('admin.stats.artworks.empty')}
                </p>
              ) : (
                <>
                  <table className="mt-10 hidden w-full border-collapse text-left md:table">
                    <caption className="sr-only">
                      {t('admin.stats.artworks.title')}
                    </caption>
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="border-b border-line pb-3 font-normal"
                        >
                          {t('admin.stats.artworks.artwork')}
                        </th>
                        {COLUMNS.map((column) => (
                          <th
                            key={column.key}
                            scope="col"
                            className="border-b border-line pb-3 text-right font-normal"
                          >
                            <button
                              type="button"
                              className="btn-link"
                              onClick={() => change(column.key)}
                            >
                              {t(column.label)}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((row) => (
                        <tr
                          key={row.artworkId}
                          data-artwork-row={row.artworkId}
                          className={
                            artworkHasActivity(row) ? '' : 'text-muted'
                          }
                        >
                          <th
                            scope="row"
                            className="border-b border-line py-3 pr-4 text-left font-normal"
                          >
                            <Link
                              to={`${routes.adminArtworks}/${row.artworkId}`}
                              className="no-underline"
                            >
                              {label(row.title)}
                            </Link>
                          </th>
                          <td className="border-b border-line py-3 text-right">
                            {row.views}
                          </td>
                          <td className="border-b border-line py-3 text-right">
                            {row.clicks}
                          </td>
                          <td className="border-b border-line py-3 text-right">
                            {row.lightboxOpens}
                          </td>
                          <td className="border-b border-line py-3 text-right">
                            {row.inquiryClicks}
                          </td>
                          <td className="border-b border-line py-3 text-right">
                            {row.inquiries}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <ul className="m-0 mt-8 list-none p-0 md:hidden">
                    {visible.map((row) => (
                      <li
                        key={row.artworkId}
                        className="border-t border-line py-4"
                      >
                        <p className="break-words">
                          <Link
                            to={`${routes.adminArtworks}/${row.artworkId}`}
                            className="no-underline"
                          >
                            {label(row.title)}
                          </Link>
                        </p>
                        <dl className="m-0 mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          {COLUMNS.map((column) => (
                            <div key={column.key}>
                              <dt className="label">{t(column.label)}</dt>
                              <dd className="m-0">{row[column.key]}</dd>
                            </div>
                          ))}
                        </dl>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {hidden > 0 && !showEmpty && (
                <p className="mt-6">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setShowEmpty(true)}
                  >
                    {t('admin.stats.artworks.showEmpty', { count: hidden })}
                  </button>
                </p>
              )}
              {showEmpty && (
                <p className="mt-6">
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setShowEmpty(false)}
                  >
                    {t('admin.stats.artworks.hideEmpty')}
                  </button>
                </p>
              )}
            </>
          )
        })()}
    </section>
  )
}
