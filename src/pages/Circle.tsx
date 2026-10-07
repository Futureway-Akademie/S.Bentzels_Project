import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import { routes } from '../config/routes'

// Exklusiver Kreis innerhalb des Netzwerks. Der Name ist ein Arbeitstitel und steht
// ausschließlich in de.json unter circle.* und circlePage.*; hier gibt es keinen Eigennamen im Code.
export default function Circle() {
  const { t } = useTranslation()
  const mailto = `mailto:${t('footer.email')}?subject=${encodeURIComponent(t('circle.interestSubject'))}`

  return (
    <main className="container-page py-20 md:py-40">
      <p className="label">{t('seminars.format')}</p>
      <Reveal slow>
        <h1 className="mt-8 max-w-[14ch]">{t('circle.name')}</h1>
      </Reveal>
      <Reveal slow delay={500}>
        <p className="prose-measure mt-24 text-[clamp(1.25rem,1rem+1vw,1.75rem)] leading-[1.5] md:mt-40">
          {t('circlePage.text', { name: t('circle.nameWithArticle') })}
        </p>
      </Reveal>
      <Reveal slow delay={300} className="mt-24 md:mt-40">
        <a href={mailto} className="btn">
          {t('circle.interest')}
        </a>
      </Reveal>
      <p className="mt-24 md:mt-40">
        <Link to={routes.network} className="btn-link">
          {t('pages.network')}
        </Link>
      </p>
    </main>
  )
}
