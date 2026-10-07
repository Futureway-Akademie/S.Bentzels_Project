import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import SectionLabel from '../components/SectionLabel'
import { routes } from '../config/routes'

const tiles = [
  {
    to: routes.artOfBecoming,
    titleKey: 'seminars.tileBecoming',
    subKey: 'seminars.tileCompanies',
  },
  { to: routes.courses, titleKey: 'seminars.tileCourses', subKey: null },
  { to: routes.talks, titleKey: 'seminars.tileTalks', subKey: null },
]

export default function Seminars() {
  const { t } = useTranslation()
  return (
    <main className="container-page py-12 md:py-20">
      <p className="label">{t('seminars.format')}</p>
      <h1 className="mt-6 max-w-[16ch]">{t('seminars.headline')}</h1>
      <Reveal>
        <p className="prose-measure mt-12">{t('seminars.text')}</p>
      </Reveal>

      <section className="mt-24 md:mt-40" aria-labelledby="seminar-formats">
        <SectionLabel number={1}>{t('seminars.formats')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="seminar-formats" className="sr-only">
          {t('seminars.formats')}
        </h2>
        <ul className="m-0 mt-10 grid list-none gap-6 p-0 md:grid-cols-3">
          {tiles.map((tile, index) => (
            <Reveal as="li" key={tile.to} delay={index * 100}>
              <Link
                to={tile.to}
                className="tile flex min-h-72 flex-col justify-between border border-foreground p-6 no-underline md:min-h-96 md:p-8"
              >
                <span className="label tile-label">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>
                  {tile.subKey && (
                    <span className="label tile-label block">
                      {t(tile.subKey)}
                    </span>
                  )}
                  <span className="mt-3 block text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] leading-[1.1]">
                    {t(tile.titleKey)}
                  </span>
                  <span className="label tile-label mt-6 block">
                    {t('seminars.open')}
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>
    </main>
  )
}
