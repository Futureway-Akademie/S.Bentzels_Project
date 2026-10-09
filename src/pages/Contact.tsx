import { useTranslation } from 'react-i18next'
import InquiryForm from '../components/forms/LazyInquiryForm'
import { kontaktFields } from '../lib/forms/definitions'

export default function Contact() {
  const { t } = useTranslation()
  const mailFallback = `mailto:${t('footer.email')}?subject=${encodeURIComponent(t('contact.defaultSubject'))}`

  return (
    <main className="container-page py-12 md:py-20">
      <h1>{t('pages.contact')}</h1>
      <p className="prose-measure mt-10">{t('contact.intro')}</p>

      <div className="grid-12 mt-16 gap-y-16">
        <section
          className="col-span-4 md:col-span-4"
          aria-labelledby="contact-details"
        >
          <h2 id="contact-details" className="label">
            {t('contact.address')}
          </h2>
          <address className="mt-4 not-italic">
            {t('footer.names')}
            <br />
            {t('footer.street')}
            <br />
            {t('footer.city')}
          </address>
          <p className="label mt-10">{t('contact.email')}</p>
          <p className="mt-2">
            <a href={`mailto:${t('footer.email')}`} className="footer-link">
              {t('footer.email')}
            </a>
          </p>
          <p className="label mt-8">{t('contact.phone')}</p>
          <p className="mt-2">
            <a href={`tel:${t('footer.phoneHref')}`} className="footer-link">
              {t('footer.phone')}
            </a>
          </p>
        </section>

        <section
          className="col-span-4 md:col-span-7 md:col-start-6"
          aria-labelledby="contact-form"
        >
          <h2 id="contact-form" className="label">
            {t('contact.form')}
          </h2>
          <InquiryForm
            type="kontakt"
            fields={kontaktFields}
            mailFallback={mailFallback}
            className="mt-6"
          />
        </section>
      </div>
    </main>
  )
}
