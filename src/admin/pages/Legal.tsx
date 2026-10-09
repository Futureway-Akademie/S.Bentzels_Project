import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LEGAL_TEMPLATES } from '../lib/legalTemplates'
import RichTextEditor from '../components/RichTextEditor'
import {
  isBlankHtml,
  LEGAL_KEYS,
  type LegalDocs,
  type LegalKind,
} from '../../lib/legalDoc'
import { loadLegal, saveLegal } from '../lib/legal'
import { sanitizeHtml } from '../../lib/sanitizeHtml'
import { useToast } from '../toast/useToast'
import { useLoad } from '../useLoad'

const KINDS: LegalKind[] = ['imprint', 'privacy']

function LegalEditor({ kind, initial }: { kind: LegalKind; initial: string }) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const [saved, setSaved] = useState(initial)
  const [html, setHtml] = useState(initial)
  // Wechselt, wenn die Vorlage eingefügt wird, damit der Editor neu startet
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)
  const dirty = html !== saved

  const save = async () => {
    setBusy(true)
    try {
      const value = isBlankHtml(html) ? '' : html
      await saveLegal(kind, value)
      setSaved(html)
      notify(t('admin.legal.saved'))
    } catch {
      notify(t('admin.legal.failed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const insertTemplate = () => {
    if (!isBlankHtml(html) && !window.confirm(t('admin.legal.confirmTemplate')))
      return
    setHtml(LEGAL_TEMPLATES[kind])
    setVersion((current) => current + 1)
  }

  return (
    <section className="mt-12 max-w-3xl border-t border-line pt-8">
      <h2 className="text-2xl">{t(`admin.legal.${kind}`)}</h2>
      {isBlankHtml(html) && (
        <p className="mt-3 text-muted">{t('admin.legal.empty')}</p>
      )}
      <div className="mt-6">
        <RichTextEditor
          key={`${kind}-${version}`}
          initialHtml={html}
          onChange={setHtml}
        />
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="button"
          className="btn"
          onClick={() => void save()}
          disabled={busy || !dirty}
        >
          {t('admin.legal.save')}
        </button>
        <button type="button" className="btn-link" onClick={insertTemplate}>
          {t('admin.legal.template')}
        </button>
        <button
          type="button"
          className="btn-link"
          aria-pressed={preview}
          onClick={() => setPreview((current) => !current)}
        >
          {t(preview ? 'admin.legal.hidePreview' : 'admin.legal.preview')}
        </button>
        {dirty && <span className="label">{t('admin.legal.unsaved')}</span>}
      </div>
      {preview && (
        <div
          className="post-content mt-8 border border-line p-6"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
        />
      )}
    </section>
  )
}

export default function Legal() {
  const { t } = useTranslation()
  const { state, reload } = useLoad<LegalDocs>(loadLegal)
  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <h1 className="text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {t('admin.legal.title')}
      </h1>
      <p className="mt-6 max-w-prose text-muted">{t('admin.legal.intro')}</p>
      <p className="mt-3 max-w-prose text-muted">{t('admin.legal.advice')}</p>

      {state.status === 'loading' && (
        <p className="label mt-10" role="status">
          {t('admin.loading')}
        </p>
      )}
      {state.status === 'error' && (
        <div className="mt-10" role="alert">
          <p>{t('admin.loadError')}</p>
          <p className="mt-4">
            <button type="button" className="btn" onClick={reload}>
              {t('admin.retry')}
            </button>
          </p>
        </div>
      )}
      {state.status === 'ready' &&
        KINDS.map((kind) => (
          <LegalEditor
            key={LEGAL_KEYS[kind]}
            kind={kind}
            initial={state.data[kind]}
          />
        ))}
    </main>
  )
}
