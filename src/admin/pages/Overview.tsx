import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { routes } from '../../config/routes'
import { formatLongDate, formatTime } from '../../lib/format'
import { loadOverview } from '../overviewData'
import { useLoad } from '../useLoad'

function Card({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border border-line p-5 md:p-6">
      <h2 className="label">{title}</h2>
      {children}
    </section>
  )
}

export default function Overview() {
  const { t } = useTranslation()
  const { state, reload } = useLoad(loadOverview)

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <h1 className="text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {t('admin.overview')}
      </h1>

      {state.status === 'loading' && (
        <p className="label mt-10" role="status">
          {t('admin.loading')}
        </p>
      )}

      {state.status === 'error' && (
        <div className="mt-10" role="alert">
          <p>{t('admin.loadError')}</p>
          <p className="mt-2 text-sm text-muted">{state.message}</p>
          <p className="mt-4">
            <button type="button" className="btn" onClick={reload}>
              {t('admin.retry')}
            </button>
          </p>
        </div>
      )}

      {state.status === 'ready' && (
        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          <Card title={t('admin.newInquiries')}>
            <p className="mt-4 text-[clamp(2.5rem,2rem+2vw,4rem)] leading-none">
              {state.data.newInquiries.count}
            </p>
            {state.data.newInquiries.latest.length === 0 ? (
              <p className="mt-4 text-muted">{t('admin.noNewInquiries')}</p>
            ) : (
              <ul className="m-0 mt-6 list-none p-0">
                {state.data.newInquiries.latest.map((inquiry) => (
                  <li key={inquiry.id} className="border-t border-line py-3">
                    <span className="label block">
                      {t(`admin.inquiryType.${inquiry.type}`, {
                        defaultValue: inquiry.type,
                      })}{' '}
                      · {formatLongDate(inquiry.created_at)}
                    </span>
                    <span className="block">{inquiry.name}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-6">
              <Link to={routes.adminInquiries} className="btn-link">
                {t('admin.allInquiries')}
              </Link>
            </p>
          </Card>

          <Card title={t('admin.nextEvent')}>
            {state.data.nextEvent ? (
              <>
                <p className="mt-4 text-[1.375rem] leading-snug">
                  {state.data.nextEvent.title_de}
                </p>
                <p className="mt-2 text-muted">
                  {formatLongDate(state.data.nextEvent.starts_at)} ·{' '}
                  {t('home.clock', {
                    time: formatTime(state.data.nextEvent.starts_at),
                  })}
                </p>
                {state.data.nextEvent.location_name && (
                  <p className="text-muted">
                    {state.data.nextEvent.location_name}
                  </p>
                )}
                <p className="mt-6 text-[1.125rem]">
                  {state.data.nextEvent.capacity
                    ? t('admin.registered', {
                        count: state.data.nextEvent.registered,
                        capacity: state.data.nextEvent.capacity,
                      })
                    : t('admin.registeredNoLimit', {
                        count: state.data.nextEvent.registered,
                      })}
                </p>
                <p className="label mt-2">
                  {state.data.nextEvent.registration_open
                    ? t('admin.registrationOpen')
                    : t('admin.registrationClosed')}
                </p>
              </>
            ) : (
              <p className="mt-4 text-muted">{t('admin.noEvent')}</p>
            )}
            <p className="mt-6">
              <Link to={routes.adminEvents} className="btn-link">
                {t('admin.allEvents')}
              </Link>
            </p>
          </Card>

          <Card title={t('admin.artworksCard')}>
            {state.data.artworks.total === 0 ? (
              <p className="mt-4 text-muted">{t('admin.noArtworks')}</p>
            ) : (
              <>
                <p className="mt-4 text-[clamp(2.5rem,2rem+2vw,4rem)] leading-none">
                  {state.data.artworks.available}
                </p>
                <p className="label mt-2">
                  {t('admin.availableArtworks', {
                    count: state.data.artworks.available,
                  })}
                </p>
                <p className="mt-4 text-muted">
                  {t('admin.totalArtworks', {
                    count: state.data.artworks.total,
                  })}
                </p>
              </>
            )}
            <p className="mt-6">
              <Link to={routes.adminArtworks} className="btn-link">
                {t('admin.allArtworks')}
              </Link>
            </p>
          </Card>
        </div>
      )}
    </main>
  )
}
