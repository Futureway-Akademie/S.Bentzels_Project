import { useTranslation } from 'react-i18next'
import ContentGate from '../components/ContentGate'
import { loadLegal } from '../lib/content'
import { isBlankHtml, type LegalKind } from '../lib/legalDoc'
import { sanitizeHtml } from '../lib/sanitizeHtml'
import { useLoad } from '../lib/useLoad'

// Impressum und Datenschutz werden im Dashboard gepflegt (Rechtstexte).
export default function LegalPage({
  titleKey,
  kind,
}: {
  titleKey: string
  kind: LegalKind
}) {
  const { t } = useTranslation()
  const { state, reload } = useLoad(loadLegal)
  return (
    <ContentGate state={state} reload={reload}>
      {(docs) => (
        <main className="container-page py-12 md:py-20">
          <h1>{t(titleKey)}</h1>
          {isBlankHtml(docs[kind]) ? (
            <p className="mt-12 text-muted">{t('legal.placeholder')}</p>
          ) : (
            <div
              className="post-content mt-12 max-w-prose"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(docs[kind]) }}
            />
          )}
        </main>
      )}
    </ContentGate>
  )
}
