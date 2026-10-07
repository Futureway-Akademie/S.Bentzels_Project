import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

type Errors = { name?: string; email?: string; message?: string }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contact() {
  const { t } = useTranslation()
  const [errors, setErrors] = useState<Errors>({})

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const subject = String(data.get('subject') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()

    const next: Errors = {}
    if (!name) next.name = t('contact.errorName')
    if (!emailPattern.test(email)) next.email = t('contact.errorEmail')
    if (!message) next.message = t('contact.errorMessage')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    // Übergangslösung bis zum Formularversand (task-22/23): öffnet das E-Mail-Programm.
    const body = `${message}\n\n${name} <${email}>`
    window.location.href = `mailto:${t('footer.email')}?subject=${encodeURIComponent(
      subject || t('contact.defaultSubject'),
    )}&body=${encodeURIComponent(body)}`
  }

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
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-8">
            <div>
              <label htmlFor="c-name" className="label block">
                {t('contact.name')} *
              </label>
              <input
                id="c-name"
                name="name"
                type="text"
                autoComplete="name"
                className="field"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'c-name-err' : undefined}
              />
              {errors.name && (
                <p id="c-name-err" role="alert" className="field-error">
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="c-email" className="label block">
                {t('contact.emailField')} *
              </label>
              <input
                id="c-email"
                name="email"
                type="email"
                autoComplete="email"
                className="field"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'c-email-err' : undefined}
              />
              {errors.email && (
                <p id="c-email-err" role="alert" className="field-error">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="c-subject" className="label block">
                {t('contact.subject')}
              </label>
              <input
                id="c-subject"
                name="subject"
                type="text"
                className="field"
              />
            </div>
            <div>
              <label htmlFor="c-message" className="label block">
                {t('contact.message')} *
              </label>
              <textarea
                id="c-message"
                name="message"
                rows={6}
                className="field"
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'c-message-err' : undefined}
              />
              {errors.message && (
                <p id="c-message-err" role="alert" className="field-error">
                  {errors.message}
                </p>
              )}
            </div>
            <div>
              <button type="submit" className="btn">
                {t('contact.send')}
              </button>
              <p className="mt-4 text-sm text-muted">{t('contact.mailNote')}</p>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
