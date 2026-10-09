import { useCallback, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { routes } from '../../config/routes'
import { downloadDatasheet } from '../../lib/datasheetFlow'
import ConfirmDialog from '../components/ConfirmDialog'
import CropEditor from '../components/CropEditor'
import Dropzone from '../components/Dropzone'
import {
  addArtworkImage,
  applyThumbCrop,
  cropOf,
  deleteArtworkWithFiles,
  duplicateArtwork,
  getArtwork,
  listArtworkImages,
  removeArtworkImage,
  replaceMainImage,
  saveArtwork,
  saveImageOrder,
  setArchived,
  type ArtworkImageRecord,
  type ArtworkRecord,
} from '../lib/artworks'
import {
  fromRow,
  toPayload,
  validateArtworkForm,
  type ArtworkFormErrors,
  type ArtworkFormValues,
} from '../lib/artworkForm'
import type { Crop } from '../lib/cropMath'
import { errorKey } from '../lib/errors'
import { moveItem } from '../lib/order'
import { useToast } from '../toast/useToast'
import { useLoad } from '../useLoad'

function Field({
  id,
  label,
  error,
  hint,
  className = '',
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label block">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

const supportOptions = ['Leinwand', 'Papier', 'Holz', 'Karton', 'Metall']

function Editor({
  initialRecord,
  initialImages,
}: {
  initialRecord: ArtworkRecord
  initialImages: ArtworkImageRecord[]
}) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [record, setRecord] = useState(initialRecord)
  const [images, setImages] = useState(initialImages)
  const [values, setValues] = useState<ArtworkFormValues>(() =>
    fromRow(initialRecord),
  )
  const [errors, setErrors] = useState<ArtworkFormErrors>({})
  const [saving, setSaving] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [cropBusy, setCropBusy] = useState(false)
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [imageToRemove, setImageToRemove] = useState<ArtworkImageRecord | null>(
    null,
  )

  const archived = record.archived_at != null
  const title = record.title_de ?? t('admin.artworks.untitled')

  const set = <K extends keyof ArtworkFormValues>(
    key: K,
    value: ArtworkFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }))

  const fieldError = (key: keyof ArtworkFormValues) => {
    const code = errors[key]
    return code ? t(`admin.artworks.error.${code}`) : undefined
  }
  const describedBy = (key: keyof ArtworkFormValues, hint?: boolean) =>
    errors[key] ? `f-${key}-error` : hint ? `f-${key}-hint` : undefined

  const save = async () => {
    const found = validateArtworkForm(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      notify(t('admin.artworks.error.fixErrors'), 'error')
      setTimeout(
        () =>
          document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        0,
      )
      return
    }
    setSaving(true)
    try {
      const payload = toPayload(values)
      const slug = await saveArtwork(record, payload)
      setRecord({ ...record, ...payload, slug })
      notify(t('admin.artworks.toast.saved'))
    } catch {
      notify(t('admin.artworks.toast.saveFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const replaceImage = async (files: File[]) => {
    setReplacing(true)
    try {
      setRecord(await replaceMainImage(record, files[0]))
      notify(t('admin.artworks.toast.imageReplaced'))
    } catch (error) {
      notify(t(`admin.artworks.error.${errorKey(error)}`), 'error')
    } finally {
      setReplacing(false)
    }
  }

  const applyCrop = async (crop: Crop | null) => {
    setCropBusy(true)
    try {
      setRecord(await applyThumbCrop(record, crop))
      notify(
        t(
          crop
            ? 'admin.artworks.toast.cropSaved'
            : 'admin.artworks.toast.cropReset',
        ),
      )
    } catch (error) {
      notify(t(`admin.artworks.error.${errorKey(error)}`), 'error')
    } finally {
      setCropBusy(false)
    }
  }

  const addImages = async (files: File[]) => {
    setAdding(true)
    let list = images
    let added = 0
    for (const file of files) {
      try {
        const created = await addArtworkImage(record.id, file, list)
        list = [...list, created]
        setImages(list)
        added += 1
      } catch (error) {
        notify(
          `${file.name}: ${t(`admin.artworks.error.${errorKey(error)}`)}`,
          'error',
        )
      }
    }
    setAdding(false)
    if (added > 0)
      notify(t('admin.artworks.toast.imageAdded', { count: added }))
  }

  const moveImage = async (index: number, delta: number) => {
    const before = images
    const ordered = moveItem(images, index, index + delta)
    setImages(ordered.map((image, i) => ({ ...image, sort_order: i + 1 })))
    try {
      await saveImageOrder(ordered)
    } catch {
      setImages(before)
      notify(t('admin.artworks.toast.saveFailed'), 'error')
    }
  }

  const removeImage = async () => {
    if (!imageToRemove) return
    setBusy(true)
    try {
      await removeArtworkImage(imageToRemove)
      setImages((current) =>
        current.filter((image) => image.id !== imageToRemove.id),
      )
      notify(t('admin.artworks.toast.imageRemoved'))
      setImageToRemove(null)
    } catch {
      notify(t('admin.artworks.toast.failedGeneric'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const duplicate = async () => {
    setBusy(true)
    try {
      const copy = await duplicateArtwork(record.id)
      notify(t('admin.artworks.toast.duplicated'))
      navigate(`${routes.adminArtworks}/${copy.id}`)
    } catch {
      notify(t('admin.artworks.toast.failedGeneric'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const toggleArchive = async () => {
    setBusy(true)
    try {
      await setArchived(record.id, !archived)
      setRecord({
        ...record,
        archived_at: archived ? null : new Date().toISOString(),
      })
      notify(
        t(
          archived
            ? 'admin.artworks.toast.restored'
            : 'admin.artworks.toast.archived',
        ),
      )
    } catch {
      notify(t('admin.artworks.toast.failedGeneric'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      const result = await deleteArtworkWithFiles(record.id)
      if (result.failed > 0)
        notify(
          t('admin.artworks.toast.deletedLeftover', { count: result.failed }),
          'error',
        )
      else notify(t('admin.artworks.toast.deleted'))
      navigate(routes.adminArtworks)
    } catch {
      notify(t('admin.artworks.toast.failedGeneric'), 'error')
      setBusy(false)
      setConfirmDelete(false)
    }
  }

  const text = (
    key: keyof ArtworkFormValues,
    extra: { inputMode?: 'decimal' | 'numeric'; list?: string } = {},
  ) => (
    <input
      id={`f-${key}`}
      type="text"
      className="field"
      value={values[key] as string}
      inputMode={extra.inputMode}
      list={extra.list}
      aria-invalid={!!errors[key]}
      aria-describedby={describedBy(key, key === 'alt_text_de')}
      onChange={(event) => set(key, event.target.value as never)}
    />
  )

  const area = (
    key: 'description_de' | 'description_en' | 'alt_text_de',
    rows: number,
  ) => (
    <textarea
      id={`f-${key}`}
      rows={rows}
      className="field"
      value={values[key]}
      aria-invalid={!!errors[key]}
      aria-describedby={describedBy(key, key === 'alt_text_de')}
      onChange={(event) => set(key, event.target.value)}
    />
  )

  const f = (key: string) => t(`admin.artworks.fields.${key}`)

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <p>
        <Link to={routes.adminArtworks} className="btn-link">
          {t('admin.artworks.back')}
        </Link>
      </p>
      <h1 className="mt-6 break-words text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {title}
      </h1>
      {archived && (
        <p className="mt-4 border border-foreground p-3" role="status">
          {t('admin.artworks.archivedNotice')}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
        <button
          type="button"
          className="btn-link"
          disabled={busy}
          onClick={() => void duplicate()}
        >
          {t('admin.artworks.duplicate')}
        </button>
        <button
          type="button"
          className="btn-link"
          disabled={busy}
          onClick={() => void toggleArchive()}
        >
          {t(archived ? 'admin.artworks.restore' : 'admin.artworks.archive')}
        </button>
        <button
          type="button"
          className="btn-link"
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
        >
          {t('admin.artworks.delete')}
        </button>
        <button
          type="button"
          className="btn-link"
          disabled={busy}
          aria-describedby="datasheet-hint"
          onClick={() =>
            // Interne Vollversion: alle gespeicherten Angaben, unabhängig von den Sichtbarkeitsschaltern
            void downloadDatasheet({
              input: {
                title: record.title_de,
                artist: record.artist,
                cycle: record.cycle,
                year: record.year,
                technique: record.technique_de,
                support: record.support_de,
                heightCm: record.height_cm,
                widthCm: record.width_cm,
                depthCm: record.depth_cm,
                framed: record.framed,
                status: record.status,
                priceEur: record.price_eur,
                description: record.description_de,
              },
              slug: record.slug,
              imageUrl: record.main_image_url,
              internal: true,
              t,
            }).catch(() => notify(t('admin.artworks.datasheetFailed'), 'error'))
          }
        >
          {t('admin.artworks.datasheet')}
        </button>
      </div>
      <p id="datasheet-hint" className="mt-2 max-w-prose text-sm text-muted">
        {t('admin.artworks.datasheetHint')}
      </p>

      <div className="mt-10 grid gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-12">
          <section aria-labelledby="sec-image">
            <h2 id="sec-image" className="label">
              {t('admin.artworks.sectionImage')}
            </h2>
            <div
              className="mt-4 flex justify-center bg-line/30"
              style={{
                aspectRatio: `${record.image_width} / ${record.image_height}`,
                maxHeight: '60vh',
                margin: '1rem auto 0',
                width: `min(100%, calc(60vh * ${record.image_width / record.image_height}))`,
              }}
            >
              <img
                src={record.main_image_url}
                width={record.image_width}
                height={record.image_height}
                alt={title}
                className="h-full w-full object-contain"
              />
            </div>
            <p className="mt-2 text-center text-sm text-muted">
              {t('admin.artworks.imageInfo', {
                width: record.image_width,
                height: record.image_height,
              })}
            </p>
            <Dropzone
              className="mt-4"
              label={t('admin.artworks.replaceHint')}
              chooseLabel={t('admin.artworks.replaceChoose')}
              disabled={replacing}
              onFiles={(files) => void replaceImage(files)}
            />
          </section>

          <section aria-labelledby="sec-preview">
            <h2 id="sec-preview" className="label">
              {t('admin.artworks.sectionPreview')}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {t('admin.artworks.previewHint')}
            </p>
            <div className="mt-4">
              <CropEditor
                key={record.main_image_url}
                imageUrl={record.main_image_url}
                imageWidth={record.image_width}
                imageHeight={record.image_height}
                initialCrop={cropOf(record)}
                busy={cropBusy}
                onApply={(crop) => void applyCrop(crop)}
              />
            </div>
            {record.thumb_url && (
              <img
                src={record.thumb_url}
                alt=""
                className="mt-6 block max-h-40 max-w-full border border-line object-contain"
              />
            )}
          </section>

          <section aria-labelledby="sec-extra">
            <h2 id="sec-extra" className="label">
              {t('admin.artworks.sectionExtra')}
            </h2>
            {images.length === 0 ? (
              <p className="mt-3 text-muted">{t('admin.artworks.noExtra')}</p>
            ) : (
              <ul className="m-0 mt-3 list-none p-0">
                {images.map((image, index) => (
                  <li
                    key={image.id}
                    className="flex flex-wrap items-center gap-4 border-t border-line py-3"
                  >
                    <img
                      src={image.thumb_url ?? image.image_url}
                      alt=""
                      className="h-20 w-24 bg-line/30 object-contain"
                    />
                    <div className="flex flex-wrap gap-x-5 gap-y-3">
                      <button
                        type="button"
                        className="btn-link"
                        disabled={index === 0}
                        onClick={() => void moveImage(index, -1)}
                      >
                        {t('admin.artworks.moveEarlier')}
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={index === images.length - 1}
                        onClick={() => void moveImage(index, 1)}
                      >
                        {t('admin.artworks.moveLater')}
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => setImageToRemove(image)}
                      >
                        {t('admin.artworks.removeImage')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Dropzone
              className="mt-4"
              label={t('admin.artworks.addHint')}
              chooseLabel={t('admin.artworks.addChoose')}
              multiple
              disabled={adding}
              onFiles={(files) => void addImages(files)}
            />
          </section>
        </div>

        <form
          noValidate
          aria-labelledby="sec-details"
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          <h2 id="sec-details" className="label">
            {t('admin.artworks.sectionDetails')}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t('admin.artworks.optionalAll')}
          </p>

          <div className="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-2">
            <Field
              id="f-title_de"
              label={f('title_de')}
              error={fieldError('title_de')}
              hint={t('admin.artworks.slugHint')}
            >
              {text('title_de')}
            </Field>
            <Field
              id="f-title_en"
              label={f('title_en')}
              error={fieldError('title_en')}
            >
              {text('title_en')}
            </Field>
            <Field
              id="f-artist"
              label={f('artist')}
              error={fieldError('artist')}
            >
              {text('artist')}
            </Field>
            <Field id="f-cycle" label={f('cycle')} error={fieldError('cycle')}>
              {text('cycle')}
            </Field>
            <Field id="f-year" label={f('year')} error={fieldError('year')}>
              {text('year', { inputMode: 'numeric' })}
            </Field>
            <Field
              id="f-support_de"
              label={f('support_de')}
              error={fieldError('support_de')}
            >
              {text('support_de', { list: 'support-options' })}
              <datalist id="support-options">
                {supportOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </Field>
            <Field
              id="f-technique_de"
              label={f('technique_de')}
              error={fieldError('technique_de')}
            >
              {text('technique_de')}
            </Field>
            <Field
              id="f-technique_en"
              label={f('technique_en')}
              error={fieldError('technique_en')}
            >
              {text('technique_en')}
            </Field>
            <Field
              id="f-height_cm"
              label={f('height_cm')}
              error={fieldError('height_cm')}
            >
              {text('height_cm', { inputMode: 'decimal' })}
            </Field>
            <Field
              id="f-width_cm"
              label={f('width_cm')}
              error={fieldError('width_cm')}
            >
              {text('width_cm', { inputMode: 'decimal' })}
            </Field>
            <Field
              id="f-depth_cm"
              label={f('depth_cm')}
              error={fieldError('depth_cm')}
            >
              {text('depth_cm', { inputMode: 'decimal' })}
            </Field>
            <Field id="f-framed" label={f('framed')}>
              <select
                id="f-framed"
                className="field"
                value={values.framed}
                onChange={(event) =>
                  set(
                    'framed',
                    event.target.value as ArtworkFormValues['framed'],
                  )
                }
              >
                <option value="">{t('admin.artworks.framedUnknown')}</option>
                <option value="ja">{t('admin.artworks.framedYes')}</option>
                <option value="nein">{t('admin.artworks.framedNo')}</option>
              </select>
            </Field>
            <Field
              id="f-price_eur"
              label={f('price_eur')}
              error={fieldError('price_eur')}
            >
              {text('price_eur', { inputMode: 'decimal' })}
            </Field>
            <Field id="f-status" label={f('status')}>
              <select
                id="f-status"
                className="field"
                value={values.status}
                onChange={(event) =>
                  set(
                    'status',
                    event.target.value as ArtworkFormValues['status'],
                  )
                }
              >
                <option value="">{t('admin.artworks.statusNone')}</option>
                <option value="verfuegbar">
                  {t('admin.artworks.status.verfuegbar')}
                </option>
                <option value="reserviert">
                  {t('admin.artworks.status.reserviert')}
                </option>
                <option value="verkauft">
                  {t('admin.artworks.status.verkauft')}
                </option>
              </select>
            </Field>
            <Field
              id="f-description_de"
              label={f('description_de')}
              error={fieldError('description_de')}
              className="md:col-span-2"
            >
              {area('description_de', 5)}
            </Field>
            <Field
              id="f-description_en"
              label={f('description_en')}
              error={fieldError('description_en')}
              className="md:col-span-2"
            >
              {area('description_en', 4)}
            </Field>
            <Field
              id="f-alt_text_de"
              label={f('alt_text_de')}
              error={fieldError('alt_text_de')}
              hint={t('admin.artworks.altHint')}
              className="md:col-span-2"
            >
              {area('alt_text_de', 2)}
            </Field>
          </div>

          <div className="mt-6 space-y-1">
            {(['is_multipart', 'is_highlight', 'is_published'] as const).map(
              (key) => (
                <label
                  key={key}
                  className="flex min-h-11 cursor-pointer items-center gap-3"
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={values[key]}
                    onChange={(event) => set(key, event.target.checked)}
                  />
                  <span>{f(key)}</span>
                </label>
              ),
            )}
          </div>

          <div className="sticky bottom-0 mt-8 border-t border-line bg-background py-4">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? t('admin.artworks.saving') : t('admin.artworks.save')}
            </button>
          </div>
        </form>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={t('admin.artworks.confirm.deleteTitle')}
          text={t('admin.artworks.confirm.deleteText', { title })}
          confirmLabel={t('admin.artworks.confirm.deleteConfirm')}
          cancelLabel={t('admin.artworks.confirm.cancel')}
          busy={busy}
          onConfirm={() => void remove()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {imageToRemove && (
        <ConfirmDialog
          title={t('admin.artworks.confirm.removeImageTitle')}
          text={t('admin.artworks.confirm.removeImageText')}
          confirmLabel={t('admin.artworks.confirm.removeImageConfirm')}
          cancelLabel={t('admin.artworks.confirm.cancel')}
          busy={busy}
          onConfirm={() => void removeImage()}
          onCancel={() => setImageToRemove(null)}
        />
      )}
    </main>
  )
}

export default function ArtworkEdit() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const load = useCallback(
    () => Promise.all([getArtwork(id), listArtworkImages(id)]),
    [id],
  )
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
        <p role="alert">{t('admin.artworks.error.notFound')}</p>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
        <p className="mt-6 flex gap-6">
          <button type="button" className="btn" onClick={reload}>
            {t('admin.retry')}
          </button>
          <Link to={routes.adminArtworks} className="btn-link">
            {t('admin.artworks.back')}
          </Link>
        </p>
      </main>
    )
  }
  return (
    <Editor
      key={state.data[0].id}
      initialRecord={state.data[0]}
      initialImages={state.data[1]}
    />
  )
}
