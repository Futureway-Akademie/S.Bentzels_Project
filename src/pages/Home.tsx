import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">
        {t('setup.label')}
      </p>
      <h1 className="mt-6 text-5xl font-normal leading-[1.05]">
        {t('brand.name')}
      </h1>
      <p className="mt-8 text-lg leading-[1.7]">{t('setup.text')}</p>
    </main>
  )
}
