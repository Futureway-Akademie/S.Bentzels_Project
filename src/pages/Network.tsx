import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import EventCard from '../components/events/EventCard'
import EventListItem from '../components/events/EventListItem'
import Reveal from '../components/Reveal'
import SectionLabel from '../components/SectionLabel'
import { routes } from '../config/routes'
import {
  isPastEvent,
  nextOccurrenceOf,
  type Occurrence,
  type PublicEvent,
} from '../lib/eventCalendar'
import { loadEventData } from '../lib/publicEvents'
import { useLoad } from '../lib/useLoad'

type NetworkEvent = { event: PublicEvent; date: Occurrence | null }

export default function Network() {
  const { t } = useTranslation()
  const [now] = useState(() => Date.now())
  const connecting = t('network.connecting', {
    returnObjects: true,
  }) as string[]

  // Die Abende des Netzwerks sind Veranstaltungen der Art „Event“ im gemeinsamen Modul.
  // Solange sie laden oder bei einer Störung bleiben die Listen leer, der Rest der Seite steht.
  const { state } = useLoad(loadEventData)
  const data = state.status === 'ready' ? state.data : null
  const eventType = data?.types.find((type) => type.slug === 'event')
  const items: NetworkEvent[] = (data?.events ?? [])
    .filter((e) => eventType && e.typeId === eventType.id)
    .map((event) => ({
      event,
      date: nextOccurrenceOf(event.id, data?.occurrences ?? [], now),
    }))
  const isPast = (item: NetworkEvent) =>
    isPastEvent(item.event, data?.occurrences ?? [], now)
  const upcoming = items
    .filter((item) => !isPast(item) && item.date)
    .sort((a, b) =>
      (a.date?.startsAt ?? '').localeCompare(b.date?.startsAt ?? ''),
    )
  const past = items
    .filter(isPast)
    .sort((a, b) =>
      (b.date?.startsAt ?? '').localeCompare(a.date?.startsAt ?? ''),
    )

  return (
    <main className="container-page py-12 md:py-20">
      <p className="label">{t('seminars.format')}</p>
      <h1 className="mt-6 max-w-[16ch]">{t('network.headline')}</h1>
      <Reveal>
        <p className="prose-measure mt-12">{t('network.text')}</p>
      </Reveal>

      {/* 01 Kunst als verbindendes Element */}
      <section className="mt-24 md:mt-40" aria-labelledby="network-connecting">
        <SectionLabel number={1}>{t('network.connectingLabel')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="network-connecting" className="sr-only">
          {t('network.connectingLabel')}
        </h2>
        <ul className="m-0 mt-8 grid list-none gap-x-12 p-0 md:grid-cols-2">
          {connecting.map((item) => (
            <li
              key={item}
              className="border-t border-line py-4 text-[1.125rem]"
            >
              {item}
            </li>
          ))}
        </ul>
        <Reveal>
          <p className="prose-measure mt-10 text-[clamp(1.25rem,1rem+1vw,1.75rem)] leading-[1.4]">
            {t('network.invitation')}
          </p>
        </Reveal>
      </section>

      {/* Dreiklang */}
      <section className="mt-24 md:mt-40" aria-label={t('network.triad')}>
        <Reveal>
          <p className="text-[clamp(2.5rem,1.5rem+6vw,7rem)] leading-[1.05]">
            {t('network.triad')}
          </p>
          <p className="prose-measure mt-8 text-muted">
            {t('network.triadText')}
          </p>
        </Reveal>
      </section>

      {/* 02 Kommende Veranstaltungen */}
      <section className="mt-24 md:mt-40" aria-labelledby="network-upcoming">
        <SectionLabel number={2}>{t('network.upcoming')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="network-upcoming" className="sr-only">
          {t('network.upcoming')}
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-10 text-muted">{t('network.noUpcoming')}</p>
        ) : (
          <ul className="m-0 list-none p-0">
            {upcoming.map(({ event, date }) =>
              date ? (
                <EventListItem
                  key={event.id}
                  event={event}
                  occurrence={date}
                  typeName={null}
                />
              ) : null,
            )}
          </ul>
        )}
        <p className="mt-8">
          <Link to={routes.events} className="btn-link">
            {t('events.toCalendar')}
          </Link>
        </p>
      </section>

      {/* 03 Archiv */}
      <section className="mt-24 md:mt-40" aria-labelledby="network-archive">
        <SectionLabel number={3}>{t('network.archive')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="network-archive" className="sr-only">
          {t('network.archive')}
        </h2>
        {past.length === 0 ? (
          <p className="mt-10 text-muted">{t('network.archiveEmpty')}</p>
        ) : (
          <ul className="m-0 mt-10 grid list-none gap-x-10 gap-y-14 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {past.map(({ event, date }) => (
              <Reveal as="li" key={event.id}>
                <EventCard event={event} next={date} typeName={null} past />
              </Reveal>
            ))}
          </ul>
        )}
      </section>

      {/* Verweis auf den exklusiven Kreis */}
      <section className="mt-24 md:mt-40">
        <hr className="rule" />
        <Reveal>
          <p className="label mt-10">{t('network.circleTeaser')}</p>
          <p className="mt-4 text-[clamp(1.75rem,1.2rem+2.5vw,3rem)] leading-[1.15]">
            {t('circle.name')}
          </p>
          <div className="mt-8">
            <Link to={routes.circle} className="btn-link">
              {t('network.circleLink')}
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
