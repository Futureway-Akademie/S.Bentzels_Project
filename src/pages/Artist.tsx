import { useTranslation } from 'react-i18next'
import Button from '../components/Button'
import Reveal from '../components/Reveal'
import SectionLabel from '../components/SectionLabel'
import Timeline from '../components/Timeline'
import { routes } from '../config/routes'
import { placeholderImage, vitaEntries, type VitaCategory } from '../data'

type Step = { title: string; text: string }

const vitaCategories: VitaCategory[] = [
  'ausbildung',
  'ausstellung',
  'messe',
  'kuratorisch',
]

const portrait = { width: 1200, height: 1600 }
const processImage = { width: 1600, height: 1067 }

export default function Artist() {
  const { t } = useTranslation()
  const steps = t('artist.steps', { returnObjects: true }) as Step[]

  return (
    <main>
      <h1 className="sr-only">{t('pages.artist')}</h1>

      {/* 01 Statement */}
      <section
        className="container-page pt-12 md:pt-20"
        aria-label={t('artist.statementLabel')}
      >
        <SectionLabel number={1}>{t('artist.statementLabel')}</SectionLabel>
        <hr className="rule mt-4" />
        <Reveal>
          <p className="mt-10 max-w-[22ch] text-[clamp(2rem,1.2rem+4vw,5rem)] leading-[1.1]">
            {t('artist.statement')}
          </p>
        </Reveal>
      </section>

      {/* 02 Porträt */}
      <section className="container-page mt-24 md:mt-40">
        <SectionLabel number={2}>{t('artist.portrait')}</SectionLabel>
        <hr className="rule mt-4" />
        <div className="grid-12 mt-10 gap-y-10">
          <Reveal className="col-span-4 md:col-span-5">
            <img
              src={placeholderImage(portrait.width, portrait.height)}
              width={portrait.width}
              height={portrait.height}
              alt={t('artist.portraitAlt')}
              loading="lazy"
              className="artwork-img"
            />
          </Reveal>
          <Reveal className="col-span-4 space-y-6 md:col-span-6 md:col-start-7">
            <p>{t('artist.intro1')}</p>
            <p>{t('artist.intro2')}</p>
            <p>{t('artist.intro3')}</p>
          </Reveal>
        </div>
      </section>

      {/* 03 Der kreative Prozess */}
      <section
        className="container-page mt-24 md:mt-40"
        aria-labelledby="artist-process"
      >
        <SectionLabel number={3}>{t('artist.process')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="artist-process" className="sr-only">
          {t('artist.process')}
        </h2>
        <ol className="m-0 mt-10 list-none space-y-20 p-0 md:space-y-32">
          {steps.map((step, index) => (
            <li key={step.title} className="grid-12 gap-y-6">
              <Reveal
                className={`col-span-4 md:col-span-7 ${index % 2 === 1 ? 'md:order-2 md:col-start-6' : ''}`}
              >
                <img
                  src={placeholderImage(
                    processImage.width,
                    processImage.height,
                  )}
                  width={processImage.width}
                  height={processImage.height}
                  alt={t('artist.processImageAlt')}
                  loading="lazy"
                  className="artwork-img"
                />
              </Reveal>
              <Reveal
                className={`col-span-4 self-end md:col-span-4 ${index % 2 === 1 ? 'md:order-1 md:col-start-1' : 'md:col-start-9'}`}
              >
                <p className="label">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-3 uppercase tracking-[0.12em]">
                  {step.title}
                </h3>
                <p className="mt-4">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
        <Reveal className="mt-24 md:mt-32">
          <p className="max-w-[30ch] text-[clamp(1.5rem,1rem+2.5vw,2.75rem)] leading-[1.2]">
            {t('artist.bridge')}
          </p>
          <div className="mt-8">
            <Button to={routes.artOfBecoming} variant="link">
              {t('artist.bridgeLink')}
            </Button>
          </div>
        </Reveal>
      </section>

      {/* 04 Vita */}
      <section
        className="container-page mt-24 md:mt-40"
        aria-labelledby="artist-vita"
      >
        <SectionLabel number={4}>{t('artist.vita')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="artist-vita" className="sr-only">
          {t('artist.vita')}
        </h2>
        <p className="prose-measure mt-10">{t('artist.vitaIntro')}</p>
        <div className="mt-12 space-y-16">
          {vitaCategories.map((category) => {
            const entries = vitaEntries
              .filter((e) => e.isPublished && e.category === category)
              .sort((a, b) => b.year - a.year || a.sortOrder - b.sortOrder)
            if (entries.length === 0) return null
            return (
              <div key={category}>
                <h3 className="label mb-4">{t(`vita.category.${category}`)}</h3>
                <Timeline entries={entries} />
              </div>
            )
          })}
        </div>
      </section>

      {/* 05 Stimmen */}
      <section
        className="container-page mt-24 md:mt-40"
        aria-labelledby="artist-voices"
      >
        <SectionLabel number={5}>{t('artist.voices')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="artist-voices" className="sr-only">
          {t('artist.voices')}
        </h2>
        <Reveal>
          <figure className="m-0 mt-10">
            <blockquote className="m-0 max-w-[32ch] text-[clamp(1.5rem,1rem+2.5vw,2.75rem)] leading-[1.2]">
              {t('artist.quote')}
            </blockquote>
            <figcaption className="label mt-6">
              {t('artist.quoteSource')}
            </figcaption>
          </figure>
        </Reveal>
      </section>
    </main>
  )
}
