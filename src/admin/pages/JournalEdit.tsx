import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { routes } from '../../config/routes'
import { sanitizeHtml } from '../../lib/sanitizeHtml'
import ConfirmDialog from '../components/ConfirmDialog'
import Dropzone from '../components/Dropzone'
import PostPreview from '../components/PostPreview'
import { errorKey } from '../lib/errors'
import {
  extractImageUrls,
  isEmptyHtml,
  trimTrailingEmpty,
} from '../lib/htmlImages'
import {
  deletePostWithFiles,
  getPost,
  removeCover,
  replaceCover,
  savePost,
  uploadPostImage,
  type PostRecord,
} from '../lib/posts'
import {
  postFormFromRow,
  toPostPayload,
  validatePostForm,
  type PostFormErrors,
  type PostFormValues,
} from '../lib/postForm'
import { removeFilesByUrl } from '../lib/storage'
import { useToast } from '../toast/useToast'
import { useLoad } from '../useLoad'

const RichTextEditor = lazy(() => import('../components/RichTextEditor'))

function Editor({ initial }: { initial: PostRecord }) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [record, setRecord] = useState(initial)
  const [values, setValues] = useState<PostFormValues>(() =>
    postFormFromRow(initial),
  )
  const [html, setHtml] = useState(initial.content_de ?? '')
  const [errors, setErrors] = useState<PostFormErrors>({})
  const [saved, setSaved] = useState(() =>
    JSON.stringify([postFormFromRow(initial), initial.content_de ?? '']),
  )
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [coverBusy, setCoverBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const dirty = JSON.stringify([values, html]) !== saved
  const title = record.title_de ?? t('admin.journal.untitled')

  // Schutz vor ungewolltem Verlassen mit ungespeicherten Änderungen
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const set = <K extends keyof PostFormValues>(
    key: K,
    value: PostFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }))

  const fieldError = (key: keyof PostFormValues) => {
    const code = errors[key]
    return code ? t(`admin.journal.error.${code}`) : undefined
  }

  const save = async () => {
    const found = validatePostForm(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      notify(t('admin.journal.error.fixErrors'), 'error')
      setTimeout(
        () =>
          document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        0,
      )
      return
    }
    setSaving(true)
    try {
      const payload = toPostPayload(values)
      const content = isEmptyHtml(html)
        ? null
        : sanitizeHtml(trimTrailingEmpty(html))
      const { slug, leftover } = await savePost(
        record,
        payload,
        content,
        extractImageUrls(content ?? ''),
      )
      const next = { ...record, ...payload, content_de: content, slug }
      setRecord(next)
      const form = postFormFromRow(next)
      setValues(form)
      setSaved(JSON.stringify([form, html]))
      notify(t('admin.journal.toast.saved'))
      if (leftover > 0)
        notify(
          t('admin.journal.toast.deletedLeftover', { count: leftover }),
          'error',
        )
    } catch {
      notify(t('admin.journal.toast.saveFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const changeCover = async (files: File[]) => {
    setCoverBusy(true)
    try {
      setRecord(await replaceCover(record, files[0]))
      notify(t('admin.journal.toast.coverSaved'))
    } catch (error) {
      notify(t(`admin.artworks.error.${errorKey(error)}`), 'error')
    } finally {
      setCoverBusy(false)
    }
  }

  const dropCover = async () => {
    setCoverBusy(true)
    try {
      setRecord(await removeCover(record))
      notify(t('admin.journal.toast.coverRemoved'))
    } catch {
      notify(t('admin.journal.toast.failed'), 'error')
    } finally {
      setCoverBusy(false)
    }
  }

  const uploadImage = useCallback(
    (file: File) => uploadPostImage(record.id, file),
    [record.id],
  )
  const discardImage = useCallback(
    (url: string) => void removeFilesByUrl([url]),
    [],
  )

  const remove = async () => {
    setDeleting(true)
    try {
      const result = await deletePostWithFiles(record.id)
      if (result.failed > 0)
        notify(
          t('admin.journal.toast.deletedLeftover', { count: result.failed }),
          'error',
        )
      else notify(t('admin.journal.toast.deleted'))
      navigate(routes.adminJournal)
    } catch {
      notify(t('admin.journal.toast.failed'), 'error')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const previewPayload = toPostPayload(values)

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <p>
        <Link to={routes.adminJournal} className="btn-link">
          {t('admin.journal.back')}
        </Link>
      </p>
      <h1 className="mt-6 break-words text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {title}
      </h1>

      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
        <button
          type="button"
          className="btn-link"
          aria-pressed={preview}
          onClick={() => setPreview((v) => !v)}
        >
          {preview ? t('admin.journal.editMode') : t('admin.journal.preview')}
        </button>
        <button
          type="button"
          className="btn-link"
          onClick={() => setConfirmDelete(true)}
        >
          {t('admin.journal.delete')}
        </button>
        {dirty && (
          <span className="label" role="status">
            {t('admin.journal.unsaved')}
          </span>
        )}
      </div>

      {preview && (
        <section className="mt-8" aria-labelledby="preview-hint">
          <p id="preview-hint" className="mb-4 text-sm text-muted">
            {t('admin.journal.previewHint')}
          </p>
          <PostPreview
            title={values.title_de.trim() || null}
            excerpt={values.excerpt_de.trim() || null}
            publishedAt={previewPayload.published_at}
            coverUrl={record.cover_image_url}
            coverWidth={record.cover_image_width}
            coverHeight={record.cover_image_height}
            html={html}
          />
        </section>
      )}

      <form
        noValidate
        className={`mt-10 ${preview ? 'hidden' : ''}`}
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        <div className="grid gap-12 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div className="space-y-8">
            <section aria-labelledby="sec-details">
              <h2 id="sec-details" className="label">
                {t('admin.journal.sectionDetails')}
              </h2>
              <div className="mt-4 space-y-6">
                <div>
                  <label htmlFor="p-title" className="label block">
                    {t('admin.journal.fields.title_de')}
                  </label>
                  <input
                    id="p-title"
                    type="text"
                    className="field"
                    value={values.title_de}
                    aria-invalid={!!errors.title_de}
                    aria-describedby={
                      errors.title_de ? 'p-title-error' : 'p-title-hint'
                    }
                    onChange={(event) => set('title_de', event.target.value)}
                  />
                  {errors.title_de ? (
                    <p id="p-title-error" role="alert" className="field-error">
                      {fieldError('title_de')}
                    </p>
                  ) : (
                    <p id="p-title-hint" className="mt-1 text-sm text-muted">
                      {t('admin.journal.slugHint')}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="p-excerpt" className="label block">
                    {t('admin.journal.fields.excerpt_de')}
                  </label>
                  <textarea
                    id="p-excerpt"
                    rows={3}
                    className="field"
                    value={values.excerpt_de}
                    aria-invalid={!!errors.excerpt_de}
                    aria-describedby={
                      errors.excerpt_de ? 'p-excerpt-error' : undefined
                    }
                    onChange={(event) => set('excerpt_de', event.target.value)}
                  />
                  {errors.excerpt_de && (
                    <p
                      id="p-excerpt-error"
                      role="alert"
                      className="field-error"
                    >
                      {fieldError('excerpt_de')}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="p-status" className="label block">
                    {t('admin.journal.fields.status')}
                  </label>
                  <select
                    id="p-status"
                    className="field min-h-11"
                    value={values.status}
                    onChange={(event) =>
                      set(
                        'status',
                        event.target.value as PostFormValues['status'],
                      )
                    }
                  >
                    <option value="entwurf">
                      {t('admin.journal.statusDraft')}
                    </option>
                    <option value="veroeffentlicht">
                      {t('admin.journal.statusPublished')}
                    </option>
                  </select>
                </div>
                <div>
                  <label htmlFor="p-date" className="label block">
                    {t('admin.journal.fields.published_at')}
                  </label>
                  <input
                    id="p-date"
                    type="datetime-local"
                    className="field min-h-11"
                    value={values.published_at}
                    aria-invalid={!!errors.published_at}
                    aria-describedby={
                      errors.published_at ? 'p-date-error' : 'p-date-hint'
                    }
                    onChange={(event) =>
                      set('published_at', event.target.value)
                    }
                  />
                  {errors.published_at ? (
                    <p id="p-date-error" role="alert" className="field-error">
                      {fieldError('published_at')}
                    </p>
                  ) : (
                    <p id="p-date-hint" className="mt-1 text-sm text-muted">
                      {t('admin.journal.dateHint')}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section aria-labelledby="sec-cover">
              <h2 id="sec-cover" className="label">
                {t('admin.journal.sectionCover')}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {t('admin.journal.coverHint')}
              </p>
              {record.cover_image_url && (
                <>
                  <img
                    src={record.cover_thumb_url ?? record.cover_image_url}
                    alt=""
                    className="mt-4 block max-h-48 max-w-full bg-line/30 object-contain"
                  />
                  <p className="mt-3">
                    <button
                      type="button"
                      className="btn-link"
                      disabled={coverBusy}
                      onClick={() => void dropCover()}
                    >
                      {t('admin.journal.coverRemove')}
                    </button>
                  </p>
                </>
              )}
              <Dropzone
                className="mt-4"
                label={t('admin.journal.coverDrop')}
                chooseLabel={t('admin.journal.coverChoose')}
                disabled={coverBusy}
                onFiles={(files) => void changeCover(files)}
              />
            </section>
          </div>

          <section aria-labelledby="sec-text">
            <h2 id="sec-text" className="label">
              {t('admin.journal.sectionText')}
            </h2>
            <div className="mt-4">
              <Suspense
                fallback={
                  <p className="label" role="status">
                    {t('admin.richtext.loading')}
                  </p>
                }
              >
                <RichTextEditor
                  key={record.id}
                  initialHtml={initial.content_de ?? ''}
                  onChange={setHtml}
                  onUploadImage={uploadImage}
                  onDiscardImage={discardImage}
                />
              </Suspense>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 mt-8 border-t border-line bg-background py-4">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? t('admin.journal.saving') : t('admin.journal.save')}
          </button>
        </div>
      </form>

      {confirmDelete && (
        <ConfirmDialog
          title={t('admin.journal.confirm.deleteTitle')}
          text={t('admin.journal.confirm.deleteText', { title })}
          confirmLabel={t('admin.journal.confirm.deleteConfirm')}
          cancelLabel={t('admin.journal.confirm.cancel')}
          busy={deleting}
          onConfirm={() => void remove()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </main>
  )
}

export default function JournalEdit() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const load = useCallback(() => getPost(id), [id])
  const { state, reload } = useLoad(load)

  if (state.status === 'loading') {
    return (
      <main className="px-4 py-10 md:px-10">
        <p className="label" role="status">
          {t('admin.loading')}
        </p>
      </main>
    )
  }
  if (state.status === 'error') {
    return (
      <main className="px-4 py-10 md:px-10">
        <p role="alert">{t('admin.journal.error.notFound')}</p>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
        <p className="mt-6 flex gap-6">
          <button type="button" className="btn" onClick={reload}>
            {t('admin.retry')}
          </button>
          <Link to={routes.adminJournal} className="btn-link">
            {t('admin.journal.back')}
          </Link>
        </p>
      </main>
    )
  }
  return <Editor key={state.data.id} initial={state.data} />
}
