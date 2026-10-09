import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { routes } from '../../config/routes'
import {
  aggregateEventStats,
  hasActivity,
  PERIODS,
  share,
  sinceDay,
  sinceIso,
  sortRows,
  type Period,
  type SortKey,
} from '../lib/eventStats'
import { loadEventStats } from '../lib/eventStatsData'
import ArtworkStatsSection from '../components/ArtworkStatsSection'
import { useAuth } from '../useAuth'
import { useLoad } from '../useLoad'

const COLUMNS: {
  key: 'views' | 'detailOpens' | 'inquiryClicks' | 'inquiries'
  label: string
}[] = [
  { key: 'views', label: 'admin.stats.views' },
  { key: 'detailOpens', label: 'admin.stats.detailOpens' },
  { key: 'inquiryClicks', label: 'admin.stats.inquiryClicks' },
  { key: 'inquiries', label: 'admin.stats.inquiries' },
]

export default function EventStats() {
  const { t } = useTranslation()
  const { state, reload } = useLoad(loadEventStats)
  const { role } = useAuth()
  const [period, setPeriod] = useState<Period>(30)
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({
    key: 'interest',
    desc: true,
  })
  const [showEmpty, setShowEmpty] = useState(false)
  // Der Zeitpunkt gilt für die Dauer des Besuchs der Seite
  const [now] = useState(() => new Date())

  const change = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, desc: !current.desc }
        : { key, desc: key !== 'title' },
    )

  const periodLabel = (value: Period) =>
    value === null
      ? t('admin.stats.periodAll')
      : t('admin.stats.periodDays', { count: value })

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <h1 className="text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {t('admin.stats.title')}
      </h1>

      <section className="mt-10" aria-labelledby="stats-events">
        <h2 id="stats-events" className="label">
          {t('admin.stats.events')}
        </h2>
        <p className="mt-3 max-w-prose text-sm text-muted">
          {t('admin.stats.privacy')}
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
            const { rows, totals } = aggregateEventStats(
              state.data.stats,
              state.data.events,
              state.data.inquiries,
              { day: sinceDay(period, now), iso: sinceIso(period, now) },
            )
            const sorted = sortRows(rows, sort.key, sort.desc)
            const visible = showEmpty ? sorted : sorted.filter(hasActivity)
            const hidden = sorted.length - visible.length
            const top = new Set(
              sortRows(rows, 'interest')
                .filter((row) => row.inquiries + row.inquiryClicks > 0)
                .slice(0, 3)
                .map((row) => row.eventId),
            )
            const rate = share(totals.inquiries, totals.detailOpens)

            return (
              <>
                <div
                  role="group"
                  aria-label={t('admin.stats.period')}
                  className="mt-8 flex flex-wrap gap-x-6 gap-y-3"
                >
                  {PERIODS.map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      className="btn-link"
                      aria-pressed={period === value}
                      onClick={() => setPeriod(value)}
                    >
                      {periodLabel(value)}
                    </button>
                  ))}
                </div>

                <dl
                  className="m-0 mt-8 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4"
                  data-stats-totals
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
                {rate !== null && (
                  <p className="mt-4 text-sm text-muted">
                    {t('admin.stats.rate', { percent: rate })}
                  </p>
                )}

                {visible.length === 0 ? (
                  <p className="mt-10 text-muted">{t('admin.stats.empty')}</p>
                ) : (
                  <>
                    {/* Breite Ansicht: Tabelle */}
                    <table className="mt-10 hidden w-full border-collapse text-left md:table">
                      <caption className="sr-only">
                        {t('admin.stats.events')}
                      </caption>
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            className="border-b border-line pb-3 font-normal"
                          >
                            <button
                              type="button"
                              className="btn-link"
                              onClick={() => change('title')}
                              aria-sort={
                                sort.key === 'title'
                                  ? sort.desc
                                    ? 'descending'
                                    : 'ascending'
                                  : undefined
                              }
                            >
                              {t('admin.stats.event')}
                            </button>
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
                            key={row.eventId}
                            data-stats-row={row.eventId}
                            className={hasActivity(row) ? '' : 'text-muted'}
                          >
                            <th
                              scope="row"
                              className="border-b border-line py-4 pr-4 text-left font-normal"
                            >
                              <Link
                                to={`${routes.adminEvents}/${row.eventId}`}
                                className="no-underline"
                              >
                                {row.title}
                              </Link>
                              {top.has(row.eventId) && (
                                <span className="label ml-3">
                                  {t('admin.stats.top')}
                                </span>
                              )}
                            </th>
                            <td className="border-b border-line py-4 text-right">
                              {row.views}
                            </td>
                            <td className="border-b border-line py-4 text-right">
                              {row.detailOpens}
                            </td>
                            <td className="border-b border-line py-4 text-right">
                              {row.inquiryClicks}
                            </td>
                            <td className="border-b border-line py-4 text-right">
                              {row.inquiries}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Schmale Ansicht: eine Karte je Veranstaltung */}
                    <ul className="m-0 mt-8 list-none p-0 md:hidden">
                      {visible.map((row) => (
                        <li
                          key={row.eventId}
                          className="border-t border-line py-4"
                        >
                          <p className="break-words">
                            <Link
                              to={`${routes.adminEvents}/${row.eventId}`}
                              className="no-underline"
                            >
                              {row.title}
                            </Link>
                          </p>
                          {top.has(row.eventId) && (
                            <p className="label mt-1">{t('admin.stats.top')}</p>
                          )}
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

                {hidden > 0 && (
                  <p className="mt-6">
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => setShowEmpty(true)}
                    >
                      {t('admin.stats.showEmpty', { count: hidden })}
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
                      {t('admin.stats.hideEmpty')}
                    </button>
                  </p>
                )}
              </>
            )
          })()}
      </section>

      {/* Die Werkstatistik ist Administratoren vorbehalten, der Zeitraum gilt für beide Bereiche */}
      {role === 'admin' && <ArtworkStatsSection period={period} now={now} />}
    </main>
  )
}
