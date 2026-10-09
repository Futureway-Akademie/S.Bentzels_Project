import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import EventCard from '../components/events/EventCard'
import EventFilters from '../components/events/EventFilters'
import EventListItem from '../components/events/EventListItem'
import MonthCalendar from '../components/events/MonthCalendar'
import Reveal from '../components/Reveal'
import SectionLabel from '../components/SectionLabel'
import {
  distinct,
  filterOccurrences,
  groupByMonth,
  isPastEvent,
  matchesFilters,
  monthOptions,
  nextEvents,
  nextOccurrenceOf,
  occurrencesInMonth,
  upcomingOccurrences,
  type EventFilters as Filters,
  type Occurrence,
  type PublicEvent,
} from '../lib/eventCalendar'
import { formatMonthKey } from '../lib/format'
import { loadEventData, trackEvent, type EventData } from '../lib/publicEvents'
import { useLoad } from '../lib/useLoad'

const VIEWS = ['kommende', 'liste', 'monat', 'archiv'] as const
type View = (typeof VIEWS)[number]

const monthNow = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function Calendar({ data }: { data: EventData }) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [now] = useState(() => Date.now())
  const { events, occurrences, types } = data

  const view: View = VIEWS.includes(params.get('ansicht') as View)
    ? (params.get('ansicht') as View)
    : 'kommende'
  const filters: Filters = {
    typeId: params.get('art') ?? '',
    month: params.get('monat') ?? '',
    place: params.get('ort') ?? '',
    speaker: params.get('referent') ?? '',
    availability:
      params.get('frei') === 'open' || params.get('frei') === 'full'
        ? (params.get('frei') as 'open' | 'full')
        : '',
  }
  const viewMonth = /^\d{4}-\d{2}$/.test(params.get('m') ?? '')
    ? (params.get('m') as string)
    : monthNow()

  const update = (patch: Record<string, string>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(patch)) {
          if (value === '' || (key === 'ansicht' && value === 'kommende'))
            next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: true },
    )
  // Nur die geänderten Filter schreiben, damit schnelle Änderungen sich nicht überschreiben
  const setFilters = (patch: Partial<Filters>) =>
    update({
      ...(patch.typeId !== undefined && { art: patch.typeId }),
      ...(patch.month !== undefined && { monat: patch.month }),
      ...(patch.place !== undefined && { ort: patch.place }),
      ...(patch.speaker !== undefined && { referent: patch.speaker }),
      ...(patch.availability !== undefined && { frei: patch.availability }),
    })

  const typeName = (id: string | null) =>
    types.find((type) => type.id === id)?.nameDe ?? null
  const eventById = new Map(events.map((event) => [event.id, event]))
  const pastIds = new Set(
    events.filter((e) => isPastEvent(e, occurrences, now)).map((e) => e.id),
  )
  const liveEvents = events.filter((e) => !pastIds.has(e.id))
  const pastEvents = events.filter((e) => pastIds.has(e.id))

  const highlights = nextEvents(events, occurrences, now, 3)
  const highlightKey = highlights.map((e) => e.id).join(',')
  // Die großen Karten zählen als Ansicht (einmal je Sitzung, ohne Personenbezug)
  useEffect(() => {
    for (const id of highlightKey.split(',').filter(Boolean))
      trackEvent(id, 'view')
  }, [highlightKey])
  const usedTypes = types.filter((type) =>
    events.some((e) => e.typeId === type.id),
  )
  const effective: Filters =
    view === 'monat' ? { ...filters, month: '' } : filters

  // Ansicht „Kommende“: eine Zeile je Veranstaltung mit ihrem nächsten Termin
  const upcomingRows = liveEvents
    .filter((e) => matchesFilters(e, effective))
    .map((event) => ({
      event,
      next: nextOccurrenceOf(event.id, occurrences, now),
    }))
    .filter(
      (row): row is { event: PublicEvent; next: Occurrence } =>
        row.next !== null,
    )
    .filter(
      (row) =>
        filters.month === '' ||
        filterOccurrences([row.next], events, effective).length > 0,
    )
    .sort((a, b) => a.next.startsAt.localeCompare(b.next.startsAt))
  const undated = liveEvents.filter(
    (e) =>
      e.startsAt === null &&
      !occurrences.some((o) => o.eventId === e.id) &&
      matchesFilters(e, effective) &&
      filters.month === '',
  )

  const listOccurrences = upcomingOccurrences(
    filterOccurrences(
      occurrences.filter((o) => !pastIds.has(o.eventId)),
      events,
      effective,
    ),
    now,
  )
  const monthOccurrences = occurrencesInMonth(
    filterOccurrences(occurrences, events, effective),
    viewMonth,
  )
  const archiveEvents = pastEvents
    .filter((e) => matchesFilters(e, effective))
    .map((event) => ({
      event,
      last: nextOccurrenceOf(event.id, occurrences, now),
    }))
    .filter(
      (row) =>
        filters.month === '' ||
        (row.last &&
          filterOccurrences([row.last], events, effective).length > 0),
    )
    .sort((a, b) =>
      (b.last?.startsAt ?? '').localeCompare(a.last?.startsAt ?? ''),
    )

  const places = distinct(events.map((e) => e.locationName))
  const speakers = distinct(events.map((e) => e.speakerName))
  const months = monthOptions(occurrences, now)

  const tabs: { key: View; label: string }[] = [
    { key: 'kommende', label: t('events.view.upcoming') },
    { key: 'liste', label: t('events.view.list') },
    { key: 'monat', label: t('events.view.month') },
    { key: 'archiv', label: t('events.view.archive') },
  ]

  const dateRow = (occurrence: Occurrence, more = 0) => {
    const event = eventById.get(occurrence.eventId)
    if (!event) return null
    return (
      <EventListItem
        key={`${occurrence.eventId}${occurrence.startsAt}`}
        event={event}
        occurrence={occurrence}
        typeName={typeName(event.typeId)}
        moreDates={more}
      />
    )
  }

  const empty = <p className="mt-10 text-muted">{t('events.empty')}</p>

  return (
    <>
      {highlights.length > 0 && (
        <section className="mt-20 md:mt-32" aria-labelledby="events-next">
          <SectionLabel number={1}>{t('events.next')}</SectionLabel>
          <hr className="rule mt-4" />
          <h2 id="events-next" className="sr-only">
            {t('events.next')}
          </h2>
          <ul className="m-0 mt-10 grid list-none gap-x-10 gap-y-14 p-0 md:grid-cols-2 lg:grid-cols-3">
            {highlights.map((event, index) => (
              <Reveal as="li" key={event.id} delay={index * 100}>
                <EventCard
                  event={event}
                  next={nextOccurrenceOf(event.id, occurrences, now)}
                  typeName={typeName(event.typeId)}
                  priority={index === 0}
                />
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-20 md:mt-32" aria-labelledby="events-calendar">
        <SectionLabel number={highlights.length > 0 ? 2 : 1}>
          {t('events.calendar')}
        </SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="events-calendar" className="sr-only">
          {t('events.calendar')}
        </h2>

        <div
          role="group"
          aria-label={t('events.view.label')}
          className="mt-8 flex flex-wrap gap-x-8 gap-y-3"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className="btn-link"
              aria-pressed={view === tab.key}
              onClick={() => update({ ansicht: tab.key })}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <EventFilters
          filters={filters}
          onChange={setFilters}
          types={usedTypes}
          months={months}
          places={places}
          speakers={speakers}
          showMonth={view !== 'monat'}
        />

        <div className="mt-4" aria-live="polite">
          {view === 'kommende' &&
            (upcomingRows.length === 0 && undated.length === 0 ? (
              empty
            ) : (
              <ul className="m-0 list-none p-0">
                {upcomingRows.map((row) =>
                  dateRow(
                    row.next,
                    occurrences.filter(
                      (o) =>
                        o.eventId === row.event.id &&
                        o !== row.next &&
                        o.startsAt > row.next.startsAt &&
                        !o.isCancelled,
                    ).length,
                  ),
                )}
                {undated.map((event) => (
                  <li key={event.id} className="border-b border-line py-7">
                    <p className="label">{typeName(event.typeId)}</p>
                    <h3 className="mt-1">
                      <Link
                        to={`/veranstaltungen/${event.slug}`}
                        className="no-underline"
                      >
                        {event.titleDe}
                      </Link>
                    </h3>
                    <p className="mt-2 text-muted">{t('events.dateFollows')}</p>
                  </li>
                ))}
              </ul>
            ))}

          {view === 'liste' &&
            (listOccurrences.length === 0 ? (
              empty
            ) : (
              <div>
                {groupByMonth(listOccurrences).map(([key, items]) => (
                  <div key={key}>
                    <h3 className="label mt-10">{formatMonthKey(key)}</h3>
                    <ul className="m-0 list-none p-0">
                      {items.map((o) => dateRow(o))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}

          {view === 'monat' && (
            <div className="mt-6">
              <MonthCalendar
                month={viewMonth}
                occurrences={monthOccurrences}
                onMonth={(key) => update({ m: key })}
              />
              <div className="md:hidden">
                {monthOccurrences.length === 0 ? (
                  empty
                ) : (
                  <ul className="m-0 mt-4 list-none p-0">
                    {[...monthOccurrences]
                      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
                      .map((o) => dateRow(o))}
                  </ul>
                )}
              </div>
              {monthOccurrences.length === 0 && (
                <p className="mt-8 hidden text-muted md:block">
                  {t('events.emptyMonth')}
                </p>
              )}
            </div>
          )}

          {view === 'archiv' &&
            (archiveEvents.length === 0 ? (
              <p className="mt-10 text-muted">{t('events.archiveEmpty')}</p>
            ) : (
              <ul className="m-0 mt-10 grid list-none gap-x-10 gap-y-14 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {archiveEvents.map(({ event, last }) => (
                  <li key={event.id}>
                    <EventCard
                      event={event}
                      next={last}
                      typeName={typeName(event.typeId)}
                      past
                    />
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </section>
    </>
  )
}

export default function Events() {
  const { t } = useTranslation()
  const { state, reload } = useLoad(loadEventData)

  return (
    <main className="container-page py-12 md:py-20">
      <p className="label">{t('events.label')}</p>
      <h1 className="mt-6 max-w-[16ch]">{t('events.headline')}</h1>
      <Reveal>
        <p className="prose-measure mt-12">{t('events.text')}</p>
      </Reveal>

      {state.status === 'loading' && (
        <p className="label mt-20" role="status">
          {t('events.loading')}
        </p>
      )}
      {state.status === 'error' && (
        <div className="mt-20" role="alert">
          <p>{t('events.loadError')}</p>
          <p className="mt-4">
            <button type="button" className="btn" onClick={reload}>
              {t('events.retry')}
            </button>
          </p>
        </div>
      )}
      {state.status === 'ready' && <Calendar data={state.data} />}
    </main>
  )
}
