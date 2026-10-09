import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { routes } from '../../config/routes'
import { formatLongDate, formatTime } from '../../lib/format'
import { csvFilename, toCsv } from '../lib/csv'
import {
  listGuestlistEvents,
  listGuests,
  listInquiries,
  loadReferenceTitles,
  setInquiryStatus,
  type EventOption,
  type GuestRow,
} from '../lib/inquiries'
import {
  countByStatus,
  emptyInquiryFilters,
  filterInquiries,
  INQUIRY_STATUSES,
  INQUIRY_TYPES,
  mailtoReply,
  newestFirst,
  payloadEntries,
  replySubject,
  type InquiryFilters,
  type InquiryRow,
  type InquiryStatus,
  type InquiryType,
} from '../lib/inquiryList'
import { useToast } from '../toast/useToast'
import { useLoad } from '../useLoad'

type Data = {
  inquiries: InquiryRow[]
  guests: GuestRow[]
  events: EventOption[]
  titles: Awaited<ReturnType<typeof loadReferenceTitles>>
}

async function loadAll(): Promise<Data> {
  const [inquiries, guests, events, titles] = await Promise.all([
    listInquiries(),
    listGuests(),
    listGuestlistEvents(),
    loadReferenceTitles(),
  ])
  return { inquiries, guests, events, titles }
}

// Zeitpunkt des Exports, außerhalb der Darstellung gelesen
const today = () => new Date()

function download(filename: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'text/csv;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function Inquiries() {
  const { t } = useTranslation()
  const { notify } = useToast()
  const { state, reload } = useLoad(loadAll)

  const [rows, setRows] = useState<InquiryRow[]>([])
  const [synced, setSynced] = useState<unknown>(null)
  if (state.status === 'ready' && synced !== state.data) {
    setSynced(state.data)
    setRows(state.data.inquiries)
  }

  const [tab, setTab] = useState<'inquiries' | 'guests'>('inquiries')
  const [filters, setFilters] = useState<InquiryFilters>(emptyInquiryFilters)
  const [openId, setOpenId] = useState<string | null>(null)
  const [eventId, setEventId] = useState('')

  const titles =
    state.status === 'ready' ? state.data.titles : { events: {}, artworks: {} }
  const reference = (row: InquiryRow): string | null =>
    (row.artwork_id && titles.artworks[row.artwork_id]) ||
    (row.event_id && titles.events[row.event_id]) ||
    null

  const visible = newestFirst(filterInquiries(rows, filters))
  const counts = countByStatus(rows)

  const changeStatus = async (row: InquiryRow, status: InquiryStatus) => {
    const previous = row.status
    setRows((current) =>
      current.map((r) => (r.id === row.id ? { ...r, status } : r)),
    )
    try {
      await setInquiryStatus(row.id, status)
      notify(
        t('admin.inquiries.toast.status', {
          status: t(`admin.inquiries.status.${status}`),
        }),
      )
    } catch {
      setRows((current) =>
        current.map((r) => (r.id === row.id ? { ...r, status: previous } : r)),
      )
      notify(t('admin.inquiries.toast.failed'), 'error')
    }
  }

  const exportInquiries = () => {
    download(
      csvFilename('eingaenge', today()),
      toCsv(visible, [
        { header: t('admin.inquiries.csv.date'), value: (r) => r.created_at },
        {
          header: t('admin.inquiries.csv.type'),
          value: (r) => t(`admin.inquiries.type.${r.type}`),
        },
        {
          header: t('admin.inquiries.csv.status'),
          value: (r) => t(`admin.inquiries.status.${r.status}`),
        },
        { header: t('admin.inquiries.csv.name'), value: (r) => r.name },
        { header: t('admin.inquiries.csv.email'), value: (r) => r.email },
        { header: t('admin.inquiries.csv.phone'), value: (r) => r.phone },
        { header: t('admin.inquiries.csv.company'), value: (r) => r.company },
        {
          header: t('admin.inquiries.csv.reference'),
          value: (r) => reference(r),
        },
        { header: t('admin.inquiries.csv.persons'), value: (r) => r.persons },
        { header: t('admin.inquiries.csv.message'), value: (r) => r.message },
      ]),
    )
  }

  const data = state.status === 'ready' ? state.data : null
  const guests = (data?.guests ?? []).filter((g) => g.event_id === eventId)
  const event = data?.events.find((e) => e.id === eventId)
  const seats = guests
    .filter((g) => g.status === 'angemeldet')
    .reduce((n, g) => n + 1 + g.guests, 0)
  const waiting = guests
    .filter((g) => g.status === 'warteliste')
    .reduce((n, g) => n + 1 + g.guests, 0)

  const exportGuests = () => {
    download(
      csvFilename('gaesteliste', today()),
      toCsv(guests, [
        { header: t('admin.inquiries.guest.name'), value: (g) => g.name },
        { header: t('admin.inquiries.guest.email'), value: (g) => g.email },
        { header: t('admin.inquiries.guest.phone'), value: (g) => g.phone },
        { header: t('admin.inquiries.guest.company'), value: (g) => g.company },
        {
          header: t('admin.inquiries.guest.persons'),
          value: (g) => 1 + g.guests,
        },
        {
          header: t('admin.inquiries.guest.status'),
          value: (g) => t(`admin.inquiries.guestStatus.${g.status}`),
        },
        { header: t('admin.inquiries.guest.date'), value: (g) => g.created_at },
      ]),
    )
  }

  const payloadValue = (key: string, value: string) => {
    const option = `forms.options.${key}.${value}`
    const translated = t(option)
    return translated === option ? value : translated
  }

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <h1 className="text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {t('admin.inquiries.title')}
      </h1>

      <div
        role="group"
        aria-label={t('admin.inquiries.view')}
        className="mt-8 flex flex-wrap gap-x-8 gap-y-3"
      >
        <button
          type="button"
          className="btn-link"
          aria-pressed={tab === 'inquiries'}
          onClick={() => setTab('inquiries')}
        >
          {t('admin.inquiries.tabInquiries')}
        </button>
        <button
          type="button"
          className="btn-link"
          aria-pressed={tab === 'guests'}
          onClick={() => setTab('guests')}
        >
          {t('admin.inquiries.tabGuests')}
        </button>
      </div>

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

      {state.status === 'ready' && tab === 'inquiries' && (
        <>
          <p className="label mt-8" role="status">
            {t('admin.inquiries.summary', {
              neu: counts.neu,
              beantwortet: counts.beantwortet,
              erledigt: counts.erledigt,
            })}
          </p>

          <div className="mt-6 grid max-w-3xl gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="f-type" className="label block">
                {t('admin.inquiries.filterType')}
              </label>
              <select
                id="f-type"
                className="field min-h-11"
                value={filters.type}
                onChange={(event) =>
                  setFilters((c) => ({
                    ...c,
                    type: event.target.value as '' | InquiryType,
                  }))
                }
              >
                <option value="">{t('admin.inquiries.all')}</option>
                {INQUIRY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`admin.inquiries.type.${type}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-status" className="label block">
                {t('admin.inquiries.filterStatus')}
              </label>
              <select
                id="f-status"
                className="field min-h-11"
                value={filters.status}
                onChange={(event) =>
                  setFilters((c) => ({
                    ...c,
                    status: event.target.value as '' | InquiryStatus,
                  }))
                }
              >
                <option value="">{t('admin.inquiries.all')}</option>
                {INQUIRY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`admin.inquiries.status.${status}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-query" className="label block">
                {t('admin.inquiries.search')}
              </label>
              <input
                id="f-query"
                type="search"
                className="field"
                value={filters.query}
                onChange={(event) =>
                  setFilters((c) => ({ ...c, query: event.target.value }))
                }
              />
            </div>
          </div>

          <p className="mt-6">
            <button
              type="button"
              className="btn-link"
              disabled={visible.length === 0}
              onClick={exportInquiries}
            >
              {t('admin.inquiries.export')}
            </button>
          </p>

          {rows.length === 0 && (
            <p className="mt-10 text-muted">{t('admin.inquiries.empty')}</p>
          )}
          {rows.length > 0 && visible.length === 0 && (
            <p className="mt-10 text-muted">
              {t('admin.inquiries.emptyFilter')}
            </p>
          )}

          <ul className="m-0 mt-6 list-none p-0">
            {visible.map((row) => {
              const open = openId === row.id
              const ref = reference(row)
              return (
                <li
                  key={row.id}
                  data-inquiry-id={row.id}
                  className="border-t border-line py-5"
                >
                  <button
                    type="button"
                    className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : row.id)}
                  >
                    <span className="block break-words text-[1.125rem] leading-snug">
                      {row.name}
                      {ref && <span className="text-muted">{` · ${ref}`}</span>}
                    </span>
                    <span className="label mt-1 block">
                      {t(`admin.inquiries.type.${row.type}`)}
                      {` · ${formatLongDate(row.created_at)} ${formatTime(row.created_at)}`}
                      {` · ${t(`admin.inquiries.status.${row.status}`)}`}
                    </span>
                  </button>

                  {open && (
                    <div className="mt-5 max-w-2xl space-y-3">
                      <p className="m-0 text-muted">
                        {[row.email, row.phone, row.company]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      {row.persons && (
                        <p className="m-0">
                          {t('admin.inquiries.persons', { count: row.persons })}
                        </p>
                      )}
                      {payloadEntries(row.payload).map(([key, value]) => (
                        <p key={key} className="m-0">
                          <span className="label">
                            {t(`admin.inquiries.payload.${key}`, {
                              defaultValue: key,
                            })}
                          </span>
                          <br />
                          {payloadValue(key, value)}
                        </p>
                      ))}
                      {row.message && (
                        <p className="m-0 whitespace-pre-wrap">{row.message}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                        <a
                          className="btn"
                          href={mailtoReply(row, replySubject(row, ref))}
                        >
                          {t('admin.inquiries.reply')}
                        </a>
                        {INQUIRY_STATUSES.filter((s) => s !== row.status).map(
                          (status) => (
                            <button
                              key={status}
                              type="button"
                              className="btn-link"
                              onClick={() => void changeStatus(row, status)}
                            >
                              {t(`admin.inquiries.markAs.${status}`)}
                            </button>
                          ),
                        )}
                        {row.event_id && (
                          <Link
                            to={`${routes.adminEvents}/${row.event_id}`}
                            className="btn-link"
                          >
                            {t('admin.inquiries.toEvent')}
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

      {state.status === 'ready' && tab === 'guests' && (
        <>
          <div className="mt-8 max-w-xl">
            <label htmlFor="g-event" className="label block">
              {t('admin.inquiries.guestEvent')}
            </label>
            <select
              id="g-event"
              className="field min-h-11"
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
            >
              <option value="">{t('admin.inquiries.guestChoose')}</option>
              {(data?.events ?? []).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title_de}
                  {option.starts_at
                    ? ` (${formatLongDate(option.starts_at)})`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          {eventId && (
            <>
              <p className="label mt-6" role="status">
                {t('admin.inquiries.guestSummary', {
                  seats,
                  capacity: event?.capacity ?? '–',
                  waiting,
                })}
              </p>
              <p className="mt-4">
                <button
                  type="button"
                  className="btn-link"
                  disabled={guests.length === 0}
                  onClick={exportGuests}
                >
                  {t('admin.inquiries.export')}
                </button>
              </p>
              {guests.length === 0 && (
                <p className="mt-8 text-muted">
                  {t('admin.inquiries.guestEmpty')}
                </p>
              )}
              <ul className="m-0 mt-6 list-none p-0" data-guestlist>
                {guests.map((guest) => (
                  <li key={guest.id} className="border-t border-line py-4">
                    <p className="m-0 break-words">
                      {guest.name}
                      <span className="text-muted">{` · ${t('admin.inquiries.persons', { count: 1 + guest.guests })}`}</span>
                    </p>
                    <p className="label mt-1">
                      {t(`admin.inquiries.guestStatus.${guest.status}`)}
                      {` · ${guest.email}`}
                      {guest.phone ? ` · ${guest.phone}` : ''}
                      {guest.company ? ` · ${guest.company}` : ''}
                    </p>
                    <p className="mt-2">
                      <a
                        className="btn-link"
                        href={`mailto:${guest.email}?subject=${encodeURIComponent(`Re: ${event?.title_de ?? ''}`)}`}
                      >
                        {t('admin.inquiries.reply')}
                      </a>
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </main>
  )
}
