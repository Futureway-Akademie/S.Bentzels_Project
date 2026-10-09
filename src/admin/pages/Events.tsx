import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { routes } from '../../config/routes'
import { formatLongDate, formatTime } from '../../lib/format'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  scopeOf,
  EVENT_STATUSES,
  type EventScope,
  type EventStatus,
} from '../lib/eventForm'
import { fromLocalInput } from '../lib/postForm'
import {
  createEvent,
  deleteEventWithFiles,
  duplicateEvent,
  listAllEventDates,
  listEvents,
  listEventTypes,
  updateEvent,
  type EventDateRecord,
  type EventRecord,
  type EventTypeRecord,
} from '../lib/events'
import { useToast } from '../toast/useToast'
import { useLoad } from '../useLoad'

type Loaded = {
  events: EventRecord[]
  dates: EventDateRecord[]
  types: EventTypeRecord[]
}

const SCOPES: EventScope[] = ['upcoming', 'past', 'archive', 'all']

async function loadAll(): Promise<Loaded> {
  const [events, dates, types] = await Promise.all([
    listEvents(),
    listAllEventDates(),
    listEventTypes(),
  ])
  return { events, dates, types }
}

export default function Events() {
  const { t } = useTranslation()
  const { notify } = useToast()
  const navigate = useNavigate()
  const { state, reload } = useLoad(loadAll)

  const [rows, setRows] = useState<EventRecord[]>([])
  const [dates, setDates] = useState<EventDateRecord[]>([])
  const [types, setTypes] = useState<EventTypeRecord[]>([])
  const [synced, setSynced] = useState<unknown>(null)
  if (state.status === 'ready' && synced !== state.data) {
    setSynced(state.data)
    setRows(state.data.events)
    setDates(state.data.dates)
    setTypes(state.data.types)
  }

  const [scope, setScope] = useState<EventScope>('upcoming')
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState('')
  const [typeId, setTypeId] = useState('')
  const [titleError, setTitleError] = useState(false)
  const [dateError, setDateError] = useState(false)
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<EventRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const typeName = (id: string | null) =>
    types.find((type) => type.id === id)?.name_de ?? null

  // Der Zeitpunkt gilt für die Dauer des Besuchs der Seite
  const [now] = useState(() => Date.now())
  const datesOf = (id: string) => dates.filter((date) => date.event_id === id)
  const scopeFor = (event: EventRecord) =>
    scopeOf(event, datesOf(event.id), now)
  const visible = rows.filter(
    (event) => scope === 'all' || scopeFor(event) === scope,
  )
  const counts = (key: EventScope) =>
    key === 'all'
      ? rows.length
      : rows.filter((event) => scopeFor(event) === key).length

  const create = async (event: FormEvent) => {
    event.preventDefault()
    const clean = title.trim()
    const startsAt = fromLocalInput(when)
    setTitleError(clean === '')
    setDateError(when.trim() !== '' && startsAt === null)
    if (clean === '' || (when.trim() !== '' && startsAt === null)) return
    setCreating(true)
    try {
      const created = await createEvent({
        title: clean,
        startsAt,
        typeId: typeId || null,
      })
      setRows((current) => [...current, created])
      setTitle('')
      setWhen('')
      setScope(scopeOf(created, [], Date.now()))
      notify(t('admin.events.toast.created'))
    } catch {
      notify(t('admin.events.toast.failed'), 'error')
    } finally {
      setCreating(false)
    }
  }

  const patch = async (event: EventRecord, change: Partial<EventRecord>) => {
    setBusyId(event.id)
    try {
      await updateEvent(event.id, change)
      setRows((current) =>
        current.map((row) =>
          row.id === event.id ? { ...row, ...change } : row,
        ),
      )
      return true
    } catch {
      notify(t('admin.events.toast.failed'), 'error')
      return false
    } finally {
      setBusyId(null)
    }
  }

  const changeStatus = async (event: EventRecord, status: EventStatus) => {
    if (await patch(event, { status }))
      notify(
        t('admin.events.toast.status', {
          status: t(`admin.events.status.${status}`),
        }),
      )
  }

  const togglePublished = async (event: EventRecord) => {
    const next = !event.is_published
    if (await patch(event, { is_published: next }))
      notify(
        t(next ? 'admin.events.toast.published' : 'admin.events.toast.hidden'),
      )
  }

  const toggleFeatured = async (event: EventRecord) => {
    const next = !event.is_featured
    if (await patch(event, { is_featured: next }))
      notify(
        t(
          next
            ? 'admin.events.toast.featured'
            : 'admin.events.toast.unfeatured',
        ),
      )
  }

  const toggleArchive = async (event: EventRecord) => {
    const archive = event.status !== 'archiviert'
    if (await patch(event, { status: archive ? 'archiviert' : 'geplant' }))
      notify(
        t(
          archive
            ? 'admin.events.toast.archived'
            : 'admin.events.toast.restored',
        ),
      )
  }

  const duplicate = async (event: EventRecord) => {
    setBusyId(event.id)
    try {
      const copy = await duplicateEvent(event.id)
      notify(t('admin.events.toast.duplicated'))
      navigate(`${routes.adminEvents}/${copy.id}`)
    } catch {
      notify(t('admin.events.toast.failed'), 'error')
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const result = await deleteEventWithFiles(toDelete.id)
      setRows((current) => current.filter((row) => row.id !== toDelete.id))
      setDates((current) =>
        current.filter((date) => date.event_id !== toDelete.id),
      )
      if (result.failed > 0)
        notify(
          t('admin.events.toast.deletedLeftover', { count: result.failed }),
          'error',
        )
      else notify(t('admin.events.toast.deleted'))
      setToDelete(null)
    } catch {
      notify(t('admin.events.toast.failed'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const summary = (event: EventRecord) => {
    const parts: string[] = []
    if (event.starts_at) {
      parts.push(
        event.show_time
          ? `${formatLongDate(event.starts_at)} · ${t('home.clock', { time: formatTime(event.starts_at) })}`
          : formatLongDate(event.starts_at),
      )
    } else parts.push(t('admin.events.noDate'))
    const more = datesOf(event.id).length
    if (more > 0) parts.push(t('admin.events.moreDates', { count: more }))
    return parts.join(' · ')
  }

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <h1 className="text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {t('admin.events.title')}
      </h1>

      <form
        noValidate
        className="mt-8 grid gap-4 border-t border-line pt-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start"
        onSubmit={(event) => void create(event)}
        aria-label={t('admin.events.quickTitle')}
      >
        <div>
          <label htmlFor="ev-title" className="label block">
            {t('admin.events.fields.title_de')}
          </label>
          <input
            id="ev-title"
            type="text"
            className="field"
            value={title}
            aria-invalid={titleError}
            aria-describedby={titleError ? 'ev-title-error' : undefined}
            onChange={(event) => {
              setTitle(event.target.value)
              setTitleError(false)
            }}
          />
          {titleError && (
            <p id="ev-title-error" role="alert" className="field-error">
              {t('admin.events.error.required')}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="ev-when" className="label block">
            {t('admin.events.quickDate')}
          </label>
          <input
            id="ev-when"
            type="datetime-local"
            className="field min-h-11"
            value={when}
            aria-invalid={dateError}
            aria-describedby={dateError ? 'ev-when-error' : undefined}
            onChange={(event) => {
              setWhen(event.target.value)
              setDateError(false)
            }}
          />
          {dateError && (
            <p id="ev-when-error" role="alert" className="field-error">
              {t('admin.events.error.dateInvalid')}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="ev-type" className="label block">
            {t('admin.events.fields.type_id')}
          </label>
          <select
            id="ev-type"
            className="field min-h-11"
            value={typeId}
            onChange={(event) => setTypeId(event.target.value)}
          >
            <option value="">{t('admin.events.noType')}</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name_de}
              </option>
            ))}
          </select>
        </div>
        <div className="md:pt-6">
          <button type="submit" className="btn w-full" disabled={creating}>
            {t('admin.events.create')}
          </button>
        </div>
      </form>
      <p className="mt-3 text-sm text-muted">{t('admin.events.quickHint')}</p>

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
        <>
          <div
            role="group"
            aria-label={t('admin.events.scopeLabel')}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-3"
          >
            {SCOPES.map((key) => (
              <button
                key={key}
                type="button"
                className="btn-link"
                aria-pressed={scope === key}
                onClick={() => setScope(key)}
              >
                {t(`admin.events.scope.${key}`)} ({counts(key)})
              </button>
            ))}
          </div>

          {rows.length === 0 && (
            <p className="mt-10 text-muted">{t('admin.events.empty')}</p>
          )}
          {rows.length > 0 && visible.length === 0 && (
            <p className="mt-10 text-muted">{t('admin.events.emptyScope')}</p>
          )}

          {visible.length > 0 && (
            <ul className="m-0 mt-6 list-none p-0">
              {visible.map((event) => {
                const name = typeName(event.type_id)
                const busy = busyId === event.id
                return (
                  <li
                    key={event.id}
                    data-event-id={event.id}
                    className="grid gap-x-6 gap-y-4 border-t border-line py-5 md:grid-cols-[6rem_minmax(0,1fr)] md:items-start"
                  >
                    <Link
                      to={`${routes.adminEvents}/${event.id}`}
                      aria-hidden="true"
                      tabIndex={-1}
                      className="hidden md:block"
                    >
                      {(event.image_thumb_url ?? event.image_url) ? (
                        <img
                          src={event.image_thumb_url ?? event.image_url ?? ''}
                          alt=""
                          loading="lazy"
                          className="h-16 w-24 bg-line/30 object-contain"
                        />
                      ) : (
                        <span className="block h-16 w-24 border border-line" />
                      )}
                    </Link>
                    <div>
                      <p className="break-words text-[1.125rem] leading-snug">
                        {event.title_de}
                      </p>
                      <p className="label mt-1">
                        {[name, summary(event)].filter(Boolean).join(' · ')}
                      </p>
                      <p className="label mt-1">
                        <span>
                          {event.is_published
                            ? t('admin.events.published')
                            : t('admin.events.hidden')}
                        </span>
                        {event.is_featured && (
                          <span> · {t('admin.events.featured')}</span>
                        )}
                      </p>
                      <div className="mt-3 max-w-xs">
                        <label
                          htmlFor={`status-${event.id}`}
                          className="sr-only"
                        >
                          {t('admin.events.fields.status')}
                        </label>
                        <select
                          id={`status-${event.id}`}
                          className="field min-h-11"
                          value={event.status}
                          disabled={busy}
                          onChange={(change) =>
                            void changeStatus(
                              event,
                              change.target.value as EventStatus,
                            )
                          }
                        >
                          {EVENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {t(`admin.events.status.${status}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 md:col-start-2">
                      <Link
                        to={`${routes.adminEvents}/${event.id}`}
                        className="btn-link"
                      >
                        {t('admin.events.edit')}
                      </Link>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={busy}
                        onClick={() => void togglePublished(event)}
                      >
                        {event.is_published
                          ? t('admin.events.hide')
                          : t('admin.events.publish')}
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={busy}
                        aria-pressed={event.is_featured}
                        onClick={() => void toggleFeatured(event)}
                      >
                        {event.is_featured
                          ? t('admin.events.unfeature')
                          : t('admin.events.feature')}
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={busy}
                        onClick={() => void duplicate(event)}
                      >
                        {t('admin.events.duplicate')}
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={busy}
                        onClick={() => void toggleArchive(event)}
                      >
                        {event.status === 'archiviert'
                          ? t('admin.events.restore')
                          : t('admin.events.archive')}
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => setToDelete(event)}
                      >
                        {t('admin.events.delete')}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {toDelete && (
        <ConfirmDialog
          title={t('admin.events.confirm.deleteTitle')}
          text={t('admin.events.confirm.deleteText', {
            title: toDelete.title_de,
          })}
          confirmLabel={t('admin.events.confirm.deleteConfirm')}
          cancelLabel={t('admin.events.confirm.cancel')}
          busy={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </main>
  )
}
