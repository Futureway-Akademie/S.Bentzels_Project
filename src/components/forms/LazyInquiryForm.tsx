import { lazy, Suspense, type ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'

// Die Formularprüfung (zod) wird erst geladen, wenn ein Formular erscheint, und belastet die
// übrigen Seiten nicht.
const InquiryForm = lazy(() => import('./InquiryForm'))

export default function LazyInquiryForm(
  props: ComponentProps<typeof InquiryForm>,
) {
  const { t } = useTranslation()
  return (
    <Suspense
      fallback={
        <p className="label" role="status">
          {t('content.loading')}
        </p>
      }
    >
      <InquiryForm {...props} />
    </Suspense>
  )
}
