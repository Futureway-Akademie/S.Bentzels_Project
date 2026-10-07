import { useTranslation } from 'react-i18next'

// Rechtstexte werden später im Dashboard gepflegt (task-29). Bis dahin Platzhalter.
export default function LegalPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return (
    <main className="container-page py-12 md:py-20">
      <h1>{t(titleKey)}</h1>
      <p className="mt-12 text-muted">{t('legal.placeholder')}</p>
    </main>
  )
}
