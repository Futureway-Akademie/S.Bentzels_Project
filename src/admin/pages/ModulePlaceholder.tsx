import { useTranslation } from 'react-i18next'

export default function ModulePlaceholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <h1 className="text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">{t(titleKey)}</h1>
      <p className="label mt-8">{t('admin.soonTitle')}</p>
      <p className="prose-measure mt-3 text-muted">{t('admin.soonText')}</p>
    </main>
  )
}
