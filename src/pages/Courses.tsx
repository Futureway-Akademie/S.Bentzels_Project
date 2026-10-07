import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Reveal from '../components/Reveal'
import SectionLabel from '../components/SectionLabel'
import { courses } from '../data'
import {
  formatDay,
  formatLongDate,
  formatMonthYear,
  formatTimeRange,
} from '../lib/format'

export default function Courses() {
  const { t } = useTranslation()
  const [now] = useState(() => Date.now())

  const upcoming = courses
    .filter((c) => c.isPublished && new Date(c.endsAt).getTime() >= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

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
            {upcoming.map((course) => (
              <li
                key={course.id}
                className="grid-12 gap-y-4 border-b border-line py-8"
              >
                <p className="col-span-4 text-[clamp(3rem,2rem+5vw,5.5rem)] leading-none md:col-span-3">
                  {formatDay(course.startsAt)}
                  <span className="label mt-2 block">
                    {formatMonthYear(course.startsAt)}
                  </span>
                </p>
                <div className="col-span-4 md:col-span-9">
                  <h3>{course.titleDe}</h3>
                  <p className="mt-3 text-muted">
                    {formatLongDate(course.startsAt)} ·{' '}
                    {t(
                      'courses.clock',
                      formatTimeRange(course.startsAt, course.endsAt),
                    )}
                  </p>
                  <p className="text-muted">
                    {course.location} ·{' '}
                    {t('courses.places', { count: course.capacity })}
                  </p>
                  <p className="prose-measure mt-3">{course.descriptionDe}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-12">
          <a href={mailto} className="btn">
            {t('courses.inquire')}
          </a>
        </div>
      </section>
    </main>
  )
}
