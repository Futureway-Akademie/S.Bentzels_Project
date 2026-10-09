import { useTranslation } from 'react-i18next'
import InquiryDisclosure from '../components/forms/InquiryDisclosure'
import InquiryForm from '../components/forms/LazyInquiryForm'
import Reveal from '../components/Reveal'
import SectionLabel from '../components/SectionLabel'
import { vortragFields } from '../lib/forms/definitions'

type Topic = { title: string; text: string }

export default function Talks() {
  const { t } = useTranslation()
  const items = t('talks.items', { returnObjects: true }) as Topic[]
  const mailto = `mailto:${t('footer.email')}?subject=${encodeURIComponent(t('talks.inquireSubject'))}`

  return (
    <main className="container-page py-12 md:py-20">
      <p className="label">{t('seminars.format')}</p>
      <h1 className="mt-6">{t('pages.talks')}</h1>
      <Reveal>
        <p className="prose-measure mt-12 text-[clamp(1.25rem,1rem+1vw,1.75rem)] leading-[1.4]">
          {t('talks.intro')}
        </p>
      </Reveal>

      <section className="mt-24 md:mt-40" aria-labelledby="talk-topics">
        <SectionLabel number={1}>{t('talks.topics')}</SectionLabel>
        <hr className="rule mt-4" />
        <h2 id="talk-topics" className="sr-only">
          {t('talks.topics')}
        </h2>
        <ol className="m-0 list-none p-0">
          {items.map((item, index) => (
            <Reveal
              as="li"
              key={item.title}
              className="grid-12 gap-y-3 border-b border-line py-10"
            >
              <span className="label col-span-4 md:col-span-2">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="col-span-4 md:col-span-5">{item.title}</h3>
              <p className="col-span-4 md:col-span-5">{item.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <Reveal className="mt-16">
        <p className="prose-measure">{t('talks.audience')}</p>
        <div className="mt-10">
          <InquiryDisclosure label={t('talks.inquire')}>
            <InquiryForm
              type="vortrag"
              fields={vortragFields}
              options={{
                topic: [
                  ...items.map((item) => ({
                    value: item.title,
                    label: item.title,
                  })),
                  {
                    value: t('forms.individual'),
                    label: t('forms.individual'),
                  },
                ],
              }}
              mailFallback={mailto}
            />
          </InquiryDisclosure>
        </div>
      </Reveal>
    </main>
  )
}
