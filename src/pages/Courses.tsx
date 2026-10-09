import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import SectionLabel from '../components/SectionLabel'
import { routes } from '../config/routes'
import InquiryDisclosure from '../components/forms/InquiryDisclosure'
import InquiryForm from '../components/forms/LazyInquiryForm'
import EventListItem from '../components/events/EventListItem'
import { formatEventDate } from '../lib/eventFormat'
import { kunstkursFields } from '../lib/forms/definitions'
import {
  isPastEvent,
  nextOccurrenceOf,
  type Occurrence,
  type PublicEvent,
} from '../lib/eventCalendar'
import { loadEventData } from '../lib/publicEvents'
import { useLoad } from '../lib/useLoad'

export default function Courses() {
  const { t } = useTranslation()
  const [now] = useState(() => Date.now())

  // Kunstkurse sind Veranstaltungen der Art „Gruppenkurs“ im gemeinsamen Modul.
  const { state } = useLoad(loadEventData)
  const data = state.status === 'ready' ? state.data : null
  const courseType = data?.types.find((type) => type.slug === 'gruppenkurs')
  const upcoming = (data?.events ?? [])
    .filter(
      (e: PublicEvent) =>
        courseType &&
        e.typeId === courseType.id &&
        !isPastEvent(e, data?.occurrences ?? [], now),
    )
    .map((event) => ({
      event,
      date: nextOccurrenceOf(event.id, data?.occurrences ?? [], now),
    }))
    .filter(
      (item): item is { event: PublicEvent; date: Occurrence } =>
        item.date !== null,
    )
    .sort((a, b) => a.date.startsAt.localeCompare(b.date.startsAt))

  // Auswahl: Kurse mit offener Anmeldung (Titel und Datum als Text) oder ein individueller Termin
  const courseOptions = [
    ...upcoming
      .filter(({ event }) => event.registrationOpen)
      .map(({ event, date }) => {
        const label = [
          event.titleDe,
          formatEventDate(date.startsAt, date.endsAt, date.showTime, t),
        ]
          .filter(Boolean)
          .join(', ')
        return { value: label, label }
      }),
    { value: t('forms.individualCourse'), label: t('forms.individualCourse') },
  ]

  const mailto = `mailto:${t('footer.email')}?subject=${encodeURIComponent(t('courses.inquireSubject'))}`

  return (
    <main className="container-page py-12 md:py-20">
      <p className="label">{t('seminars.format')}</p>
      <h1 className="mt-6 max-w-[18ch] text-[clamp(2rem,1.2rem+4vw,5rem)]">
        {t('courses.headline')}
      </h1>
      <Reveal>
        <p className="prose-measure mt-12">{t('courses.text')}</p>
      </Reveal>

      <section className="mt-24 md:mt-40" aria-labelledby="course-dates">
        <SectionLabel number={1}>{t('courses.upcoming')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="course-dates" className="sr-only">
          {t('courses.upcoming')}
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-10 text-muted">{t('courses.none')}</p>
        ) : (
          <ul className="m-0 list-none p-0">
            {upcoming.map(({ event, date }) => (
              <EventListItem
                key={event.id}
                event={event}
                occurrence={date}
                typeName={null}
              />
            ))}
          </ul>
        )}
        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
          <InquiryDisclosure label={t('courses.inquire')}>
            <InquiryForm
              type="kunstkurs"
              fields={kunstkursFields}
              options={{ course: courseOptions }}
              mailFallback={mailto}
            />
          </InquiryDisclosure>
          <Link to={routes.events} className="btn-link">
            {t('events.toCalendar')}
          </Link>
        </div>
      </section>
    </main>
  )
}
