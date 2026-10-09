import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { routes } from '../../config/routes'
import ConfirmDialog from '../components/ConfirmDialog'
import Dropzone from '../components/Dropzone'
import { CheckField, Section, TextField } from '../components/FormField'
import { errorKey } from '../lib/errors'
import {
  deletePressItem,
  getPressItem,
  listPressCategories,
  removePressFile,
  replacePressFile,
  updatePressItem,
  type PressCategory,
  type PressRecord,
} from '../lib/press'
import {
  fileKind,
  MEDIUM_TYPES,
  pressFormFromRow,
  toPressPayload,
  validatePressForm,
  type MediumType,
  type PressFormErrors,
  type PressFormValues,
} from '../lib/pressForm'
import { useToast } from '../toast/useToast'
import { useLoad } from '../useLoad'

type Loaded = { record: PressRecord; categories: PressCategory[] }

function Editor({ initial }: { initial: Loaded }) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [record, setRecord] = useState(initial.record)
  const [values, setValues] = useState<PressFormValues>(() =>
    pressFormFromRow(initial.record),
  )
  const [saved, setSaved] = useState(() =>
    JSON.stringify(pressFormFromRow(initial.record)),
  )
  const [errors, setErrors] = useState<PressFormErrors>({})
  const [saving, setSaving] = useState(false)
  const [fileBusy, setFileBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const dirty = JSON.stringify(values) !== saved
  const title =
    record.title_de ?? record.external_url ?? t('admin.press.untitled')

  // Schutz vor ungewolltem Verlassen mit ungespeicherten Änderungen
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const set = <K extends keyof PressFormValues>(
    key: K,
    value: PressFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }))
  const err = (key: keyof PressFormValues) =>
    errors[key] ? t(`admin.press.error.${errors[key]}`) : undefined
  const f = (key: string) => t(`admin.press.fields.${key}`)

  const save = async () => {
    const found = validatePressForm(values, Boolean(record.file_url))
    setErrors(found)
    if (Object.keys(found).length > 0) {
      notify(t('admin.press.error.fixErrors'), 'error')
      setTimeout(
        () =>
          document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        0,
      )
      return
    }
    setSaving(true)
    try {
      const payload = toPressPayload(values)
      await updatePressItem(record.id, payload)
      setRecord({ ...record, ...payload })
      const form = pressFormFromRow(payload)
      setValues(form)
      setSaved(JSON.stringify(form))
      notify(t('admin.press.toast.saved'))
    } catch {
      notify(t('admin.press.toast.saveFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const changeFile = async (files: File[]) => {
    const file = files[0]
    if (fileKind(file) === null) {
      notify(t('admin.press.error.type'), 'error')
      return
    }
    setFileBusy(true)
    try {
      setRecord(await replacePressFile(record, file))
      notify(t('admin.press.toast.fileSaved'))
    } catch (error) {
      const key =
        fileKind(file) === 'pdf' && errorKey(error) === 'size'
          ? 'pdfSize'
          : errorKey(error)
      notify(t(`admin.press.error.${key}`), 'error')
    } finally {
      setFileBusy(false)
    }
  }

  const dropFile = async () => {
    setFileBusy(true)
    try {
      setRecord(await removePressFile(record))
      notify(t('admin.press.toast.fileRemoved'))
    } catch {
      notify(t('admin.press.toast.failed'), 'error')
    } finally {
      setFileBusy(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      const result = await deletePressItem(record.id)
      if (result.failed > 0)
        notify(
          t('admin.press.toast.deletedLeftover', { count: result.failed }),
          'error',
        )
      else notify(t('admin.press.toast.deleted'))
      navigate(routes.adminPress)
    } catch {
      notify(t('admin.press.toast.failed'), 'error')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  // Der Link kann nur entfallen, solange eine Datei vorhanden ist, und umgekehrt
  const canRemoveFile =
    record.file_url !== null && values.external_url.trim() !== ''

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <p>
        <Link to={routes.adminPress} className="btn-link">
          {t('admin.press.back')}
        </Link>
      </p>
      <h1 className="mt-6 break-words text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {title}
      </h1>

      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
        <button
          type="button"
          className="btn-link"
          onClick={() => setConfirmDelete(true)}
        >
          {t('admin.press.delete')}
        </button>
        {dirty && (
          <span className="label" role="status">
            {t('admin.press.unsaved')}
          </span>
        )}
      </div>

      <p
        className="mt-6 max-w-prose border border-line p-4 text-sm"
        role="note"
      >
        {t('admin.press.copyright')}
      </p>

      <form
        noValidate
        className="mt-10 max-w-3xl space-y-10"
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        <Section id="sec-file" title={t('admin.press.section.file')}>
          {record.file_url ? (
            <div>
              {(record.thumbnail_url ?? record.file_url) && (
                <img
                  src={record.thumbnail_url ?? record.file_url ?? ''}
                  alt=""
                  className="block max-h-56 max-w-full bg-line/30 object-contain"
                />
              )}
              <p className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                <a
                  href={record.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-link"
                >
                  {record.file_type === 'pdf'
                    ? t('admin.press.openPdf')
                    : t('admin.press.openImage')}
                </a>
                <button
                  type="button"
                  className="btn-link"
                  disabled={fileBusy || !canRemoveFile}
                  onClick={() => void dropFile()}
                >
                  {t('admin.press.removeFile')}
                </button>
              </p>
              {!canRemoveFile && (
                <p className="mt-1 text-sm text-muted">
                  {t('admin.press.removeFileHint')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted">{t('admin.press.noFile')}</p>
          )}
          <Dropzone
            accept="image/jpeg,image/png,image/webp,application/pdf"
            label={
              record.file_url
                ? t('admin.press.replaceDrop')
                : t('admin.press.addFileDrop')
            }
            chooseLabel={t('admin.press.choose')}
            disabled={fileBusy}
            onFiles={(files) => void changeFile(files)}
          />
        </Section>

        <Section id="sec-details" title={t('admin.press.section.details')}>
          <TextField
            id="p-title"
            label={f('title_de')}
            value={values.title_de}
            error={err('title_de')}
            onChange={(v) => set('title_de', v)}
          />
          <TextField
            id="p-medium"
            label={f('medium')}
            value={values.medium}
            error={err('medium')}
            onChange={(v) => set('medium', v)}
          />
          <div>
            <label htmlFor="p-mtype" className="label block">
              {f('medium_type')}
            </label>
            <select
              id="p-mtype"
              className="field min-h-11"
              value={values.medium_type}
              onChange={(event) =>
                set('medium_type', event.target.value as '' | MediumType)
              }
            >
              <option value="">{t('admin.press.noSelection')}</option>
              {MEDIUM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`admin.press.mediumType.${type}`)}
                </option>
              ))}
            </select>
          </div>
          <TextField
            id="p-author"
            label={f('author')}
            value={values.author}
            error={err('author')}
            onChange={(v) => set('author', v)}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              id="p-date"
              type="date"
              label={f('published_at')}
              value={values.published_at}
              error={err('published_at')}
              onChange={(v) => set('published_at', v)}
            />
            <TextField
              id="p-year"
              inputMode="numeric"
              label={f('year')}
              value={values.year}
              error={err('year')}
              hint={t('admin.press.yearHint')}
              onChange={(v) => set('year', v)}
            />
          </div>
          <div>
            <label htmlFor="p-category" className="label block">
              {f('category')}
            </label>
            <select
              id="p-category"
              className="field min-h-11"
              value={values.category}
              onChange={(event) => set('category', event.target.value)}
            >
              <option value="">{t('admin.press.noSelection')}</option>
              {initial.categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name_de}
                </option>
              ))}
            </select>
          </div>
          <TextField
            id="p-summary"
            rows={3}
            label={f('summary_de')}
            value={values.summary_de}
            error={err('summary_de')}
            onChange={(v) => set('summary_de', v)}
          />
          <TextField
            id="p-description"
            rows={6}
            label={f('description_de')}
            value={values.description_de}
            error={err('description_de')}
            onChange={(v) => set('description_de', v)}
          />
          <TextField
            id="p-url"
            type="url"
            label={f('external_url')}
            value={values.external_url}
            error={err('external_url')}
            hint={t('admin.press.urlHint')}
            onChange={(v) => set('external_url', v)}
          />
        </Section>

        <Section
          id="sec-visibility"
          title={t('admin.press.section.visibility')}
        >
          <CheckField
            id="p-published"
            label={t('admin.press.publishedLabel')}
            checked={values.is_published}
            hint={t('admin.press.publishedHint')}
            onChange={(v) => set('is_published', v)}
          />
          <CheckField
            id="p-highlight"
            label={t('admin.press.highlightLabel')}
            checked={values.is_highlight}
            onChange={(v) => set('is_highlight', v)}
          />
        </Section>

        <div className="sticky bottom-0 border-t border-line bg-background py-4">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? t('admin.press.saving') : t('admin.press.save')}
          </button>
        </div>
      </form>

      {confirmDelete && (
        <ConfirmDialog
          title={t('admin.press.confirm.deleteTitle')}
          text={t('admin.press.confirm.deleteText', { title })}
          confirmLabel={t('admin.press.confirm.deleteConfirm')}
          cancelLabel={t('admin.press.confirm.cancel')}
          busy={deleting}
          onConfirm={() => void remove()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </main>
  )
}

export default function PressEdit() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const load = useCallback(async (): Promise<Loaded> => {
    const [record, categories] = await Promise.all([
      getPressItem(id),
      listPressCategories(),
    ])
    return { record, categories }
  }, [id])
  const { state, reload } = useLoad(load)

  if (state.status === 'loading')
    return (
      <main className="px-4 py-10 md:px-10">
        <p className="label" role="status">
          {t('admin.loading')}
        </p>
      </main>
    )
  if (state.status === 'error')
    return (
      <main className="px-4 py-10 md:px-10">
        <p role="alert">{t('admin.press.error.notFound')}</p>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
        <p className="mt-6 flex gap-6">
          <button type="button" className="btn" onClick={reload}>
            {t('admin.retry')}
          </button>
          <Link to={routes.adminPress} className="btn-link">
            {t('admin.press.back')}
          </Link>
        </p>
      </main>
    )
  return <Editor key={state.data.record.id} initial={state.data} />
}
