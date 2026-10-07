import { useTranslation } from 'react-i18next'
import Reveal from '../components/Reveal'
import SectionLabel from '../components/SectionLabel'
import { placeholderImage } from '../data'

type Module = { title: string; subtitle: string; text: string }
type Science = { title: string; source: string; text: string }
type Lead = { name: string; role: string; bio: string }

const portrait = { width: 900, height: 1200 }

export default function ArtOfBecoming() {
  const { t } = useTranslation()
  const lines = t('becoming.lines', { returnObjects: true }) as string[]
  const modules = t('becoming.modules', { returnObjects: true }) as Module[]
  const experience = t('becoming.experience', {
    returnObjects: true,
  }) as string[]
  const science = t('becoming.science', { returnObjects: true }) as Science[]
  const facts = t('becoming.facts', { returnObjects: true }) as string[]
  const lead = t('becoming.lead', { returnObjects: true }) as Lead[]
  const mailto = `mailto:${t('footer.email')}?subject=${encodeURIComponent(t('becoming.ctaSubject'))}`

  return (
    <main>
      {/* Hero */}
      <section className="container-page pt-12 md:pt-20">
        <p className="label">{t('seminars.format')}</p>
        <h1 className="mt-6 uppercase tracking-[0.04em]">
          {t('becoming.title')}
        </h1>
        <p className="label mt-8 max-w-[60ch]">{t('becoming.subtitle')}</p>
        <Reveal>
          <p className="mt-16 max-w-[20ch] text-[clamp(2rem,1.2rem+4vw,5rem)] leading-[1.1] md:mt-24">
            {t('becoming.core')}
          </p>
        </Reveal>
      </section>

      {/* Einleitung */}
      <section className="container-page mt-24 md:mt-40">
        <Reveal>
          <p className="prose-measure">{t('becoming.intro')}</p>
        </Reveal>
      </section>

      {/* Vierzeiler, Zeile für Zeile */}
      <section
        className="container-page mt-24 md:mt-40"
        aria-label={t('becoming.core')}
      >
        <ul className="m-0 list-none space-y-4 p-0 md:space-y-6">
          {lines.map((line, index) => (
            <Reveal
              as="li"
              key={line}
              slow
              delay={index * 450}
              className="text-[clamp(1.5rem,1rem+2.5vw,3rem)] leading-[1.2]"
            >
              {line}
            </Reveal>
          ))}
        </ul>
      </section>

      {/* 01 Die vier Module */}
      <section
        className="container-page mt-24 md:mt-40"
        aria-labelledby="becoming-modules"
      >
        <SectionLabel number={1}>{t('becoming.modulesLabel')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="becoming-modules" className="sr-only">
          {t('becoming.modulesLabel')}
        </h2>
        <ol className="m-0 list-none p-0">
          {modules.map((module, index) => (
            <Reveal
              as="li"
              key={module.title}
              className="grid-12 gap-y-4 border-b border-line py-12 md:py-16"
            >
              <p className="label col-span-4 md:col-span-2">
                {String(index + 1).padStart(2, '0')}
              </p>
              <div className="col-span-4 md:col-span-4">
                <h3 className="uppercase tracking-[0.12em]">{module.title}</h3>
                <p className="label mt-4">{module.subtitle}</p>
              </div>
              <p className="col-span-4 md:col-span-5 md:col-start-8">
                {module.text}
              </p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* 02 Was Führungskräfte erleben */}
      <section
        className="container-page mt-24 md:mt-40"
        aria-labelledby="becoming-experience"
      >
        <SectionLabel number={2}>{t('becoming.experienceLabel')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="becoming-experience" className="sr-only">
          {t('becoming.experienceLabel')}
        </h2>
        <ul className="m-0 mt-10 grid list-none gap-x-12 p-0 md:grid-cols-2">
          {experience.map((item) => (
            <li
              key={item}
              className="border-t border-line py-4 text-[1.125rem] md:py-5"
            >
              {item}
            </li>
          ))}
        </ul>
        <Reveal>
          <p className="mt-16 text-[clamp(1.5rem,1rem+2.5vw,3rem)] leading-[1.2]">
            {t('becoming.experienceClosing')}
          </p>
        </Reveal>
      </section>

      {/* 03 Das wissenschaftliche Fundament */}
      <section
        className="container-page mt-24 md:mt-40"
        aria-labelledby="becoming-science"
      >
        <SectionLabel number={3}>{t('becoming.scienceLabel')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="becoming-science" className="sr-only">
          {t('becoming.scienceLabel')}
        </h2>
        <div className="mt-8">
          {science.map((entry) => (
            <details
              key={entry.title}
              className="accordion border-b border-line"
            >
              <summary className="accordion-summary flex cursor-pointer list-none items-baseline justify-between gap-6 py-5">
                <span>
                  {entry.title}
                  <span className="label ml-3">{entry.source}</span>
                </span>
                <span className="accordion-icon label" aria-hidden="true" />
              </summary>
              <p className="prose-measure pb-6">{entry.text}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 04 Eckdaten */}
      <section
        className="container-page mt-24 md:mt-40"
        aria-labelledby="becoming-facts"
      >
        <SectionLabel number={4}>{t('becoming.factsLabel')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="becoming-facts" className="sr-only">
          {t('becoming.factsLabel')}
        </h2>
        <ul className="m-0 mt-8 grid list-none gap-y-4 p-0 md:grid-cols-4 md:gap-x-6">
          {facts.map((fact) => (
            <li
              key={fact}
              className="border-t border-foreground pt-4 text-[1.125rem]"
            >
              {fact}
            </li>
          ))}
        </ul>
      </section>

      {/* 05 Leitung */}
      <section
        className="container-page mt-24 md:mt-40"
        aria-labelledby="becoming-lead"
      >
        <SectionLabel number={5}>{t('becoming.leadLabel')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="becoming-lead" className="sr-only">
          {t('becoming.leadLabel')}
        </h2>
        <ul className="m-0 mt-10 grid list-none gap-12 p-0 md:grid-cols-2 md:gap-x-16">
          {lead.map((person) => (
            <Reveal as="li" key={person.name}>
              <img
                src={placeholderImage(portrait.width, portrait.height)}
                width={portrait.width}
                height={portrait.height}
                alt={t('becoming.photoAlt')}
                loading="lazy"
                className="artwork-img max-w-sm"
              />
              <h3 className="mt-6 text-[clamp(1.5rem,1.2rem+1vw,2rem)]">
                {person.name}
              </h3>
              <p className="label mt-2">{person.role}</p>
              <p className="prose-measure mt-4">{person.bio}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Abschluss */}
      <section className="container-page mt-24 md:mt-40">
        <hr className="rule" />
        <Reveal>
          <p className="mt-12 max-w-[28ch] text-[clamp(1.5rem,1rem+2.5vw,3rem)] leading-[1.2]">
            {t('becoming.cta')}
          </p>
          <div className="mt-10">
            <a href={mailto} className="btn">
              {t('becoming.ctaButton')}
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
