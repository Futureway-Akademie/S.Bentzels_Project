import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '../components/ConfirmDialog'
import Dropzone from '../components/Dropzone'
import { TextField } from '../components/FormField'
import {
  createCurated,
  deleteCurated,
  listCurated,
  removeCuratedThumbnail,
  replaceCuratedThumbnail,
  saveCuratedOrder,
  updateCurated,
  type CuratedRecord,
} from '../lib/curated'
import {
  curatedFormFromRow,
  hostOf,
  isWebUrl,
  toCuratedPayload,
  validateCuratedForm,
  type CuratedFormErrors,
  type CuratedFormValues,
} from '../lib/curatedForm'
import { errorKey } from '../lib/errors'
import { moveItem } from '../lib/order'
import { useDragSort } from '../lib/useDragSort'
import { useToast } from '../toast/useToast'
import { useLoad } from '../useLoad'

export default function Curated() {
  const { t } = useTranslation()
  const { notify } = useToast()
  const { state, reload } = useLoad(listCurated)

  const [rows, setRows] = useState<CuratedRecord[]>([])
  const [synced, setSynced] = useState<unknown>(null)
  if (state.status === 'ready' && synced !== state.data) {
    setSynced(state.data)
    setRows(state.data)
  }

  const [newUrl, setNewUrl] = useState('')
  const [newError, setNewError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<CuratedFormValues>(
    curatedFormFromRow({}),
  )
  const [errors, setErrors] = useState<CuratedFormErrors>({})
  const [toDelete, setToDelete] = useState<CuratedRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const replaceRow = (next: CuratedRecord) =>
    setRows((current) =>
      current.map((row) => (row.id === next.id ? next : row)),
    )

  const persistOrder = async (next: CuratedRecord[]) => {
    const previous = rows
    setRows(next)
    try {
      await saveCuratedOrder(next)
      setRows(next.map((row, index) => ({ ...row, sort_order: index + 1 })))
    } catch {
      setRows(previous)
      notify(t('admin.curated.toast.failed'), 'error')
    }
  }
  const { dragId, overId, itemProps } = useDragSort(
    rows,
    (next) => void persistOrder(next),
  )

  const add = async (event: FormEvent) => {
    event.preventDefault()
    if (newUrl.trim() === '') return setNewError('required')
    if (!isWebUrl(newUrl)) return setNewError('urlInvalid')
    setNewError(null)
    setAdding(true)
    try {
      const created = await createCurated(newUrl)
      setRows((current) => [...current, created])
      setNewUrl('')
      notify(t('admin.curated.toast.added'))
    } catch {
      notify(t('admin.curated.toast.failed'), 'error')
    } finally {
      setAdding(false)
    }
  }

  const togglePublished = async (row: CuratedRecord) => {
    setBusyId(row.id)
    try {
      await updateCurated(row.id, { is_published: !row.is_published })
      replaceRow({ ...row, is_published: !row.is_published })
      notify(
        t(
          row.is_published
            ? 'admin.curated.toast.hidden'
            : 'admin.curated.toast.published',
        ),
      )
    } catch {
      notify(t('admin.curated.toast.failed'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const startEdit = (row: CuratedRecord) => {
    setEditingId(row.id)
    setValues(curatedFormFromRow(row))
    setErrors({})
  }

  const save = async (row: CuratedRecord) => {
    const found = validateCuratedForm(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      notify(t('admin.curated.error.fixErrors'), 'error')
      setTimeout(
        () =>
          document
            .querySelector<HTMLElement>(
              '[data-curated-edit] [aria-invalid="true"]',
            )
            ?.focus(),
        0,
      )
      return
    }
    setBusyId(row.id)
    try {
      const payload = toCuratedPayload(values)
      await updateCurated(row.id, payload)
      replaceRow({ ...row, ...payload })
      setEditingId(null)
      notify(t('admin.curated.toast.saved'))
    } catch {
      notify(t('admin.curated.toast.saveFailed'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const changeThumbnail = async (row: CuratedRecord, files: File[]) => {
    setBusyId(row.id)
    try {
      replaceRow(await replaceCuratedThumbnail(row, files[0]))
      notify(t('admin.curated.toast.thumbSaved'))
    } catch (error) {
      notify(t(`admin.artworks.error.${errorKey(error)}`), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const dropThumbnail = async (row: CuratedRecord) => {
    setBusyId(row.id)
    try {
      replaceRow(await removeCuratedThumbnail(row))
      notify(t('admin.curated.toast.thumbRemoved'))
    } catch {
      notify(t('admin.curated.toast.failed'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const leftover = await deleteCurated(toDelete)
      setRows((current) => current.filter((row) => row.id !== toDelete.id))
      if (editingId === toDelete.id) setEditingId(null)
      if (leftover > 0)
        notify(
          t('admin.curated.toast.deletedLeftover', { count: leftover }),
          'error',
        )
      else notify(t('admin.curated.toast.deleted'))
      setToDelete(null)
    } catch {
      notify(t('admin.curated.toast.failed'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const label = (row: CuratedRecord) => row.title_de ?? hostOf(row.url)

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <h1 className="text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {t('admin.curated.title')}
      </h1>
      <p className="mt-6 max-w-prose text-muted">{t('admin.curated.intro')}</p>

      <form
        noValidate
        className="mt-8 flex max-w-2xl flex-wrap items-end gap-3"
        onSubmit={(event) => void add(event)}
        aria-label={t('admin.curated.addTitle')}
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="curated-new" className="label block">
            {t('admin.curated.newLink')}
          </label>
          <input
            id="curated-new"
            type="url"
            className="field"
            value={newUrl}
            aria-invalid={newError !== null}
            aria-describedby={newError ? 'curated-new-error' : undefined}
            onChange={(event) => {
              setNewUrl(event.target.value)
              setNewError(null)
            }}
          />
          {newError && (
            <p id="curated-new-error" role="alert" className="field-error">
              {t(`admin.curated.error.${newError}`)}
            </p>
          )}
        </div>
        <button type="submit" className="btn" disabled={adding}>
          {t('admin.curated.add')}
        </button>
      </form>
      <p className="mt-3 text-sm text-muted">{t('admin.curated.addHint')}</p>

      {state.status === 'loading' && (
        <p className="label mt-10" role="status">
          {t('admin.loading')}
        </p>
      )}
      {state.status === 'error' && (
        <div className="mt-10" role="alert">
          <p>{t('admin.loadError')}</p>
          <p className="mt-2 text-sm text-muted">{state.message}</p>
          <p className="mt-4">
            <button type="button" className="btn" onClick={reload}>
              {t('admin.retry')}
            </button>
          </p>
        </div>
      )}
      {state.status === 'ready' && rows.length === 0 && (
        <p className="mt-10 text-muted">{t('admin.curated.empty')}</p>
      )}

      {rows.length > 0 && (
        <>
          <p className="label mt-10" role="status">
            {t('admin.curated.count', { count: rows.length })}
          </p>
          <p className="mt-2 text-sm text-muted">
            {t('admin.curated.dragHint')}
          </p>
          <ul className="m-0 mt-4 list-none p-0">
            {rows.map((row, index) => {
              const busy = busyId === row.id
              const editing = editingId === row.id
              return (
                <li
                  key={row.id}
                  data-curated-id={row.id}
                  {...(editing ? {} : itemProps(row.id))}
                  className={`grid gap-x-6 gap-y-3 border-t py-5 md:grid-cols-[6rem_minmax(0,1fr)] ${overId === row.id && dragId !== row.id ? 'border-foreground' : 'border-line'} ${dragId === row.id ? 'opacity-50' : ''}`}
                >
                  <div className="hidden md:block">
                    {row.thumbnail_url ? (
                      <img
                        src={row.thumbnail_url}
                        alt=""
                        draggable={false}
                        loading="lazy"
                        className="h-16 w-24 bg-line/30 object-contain"
                      />
                    ) : (
                      <span className="block h-16 w-24 border border-line" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-[1.125rem] leading-snug">
                      {label(row)}
                    </p>
                    <p className="label mt-1 break-all">
                      {[row.source, hostOf(row.url)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <p className="label mt-1">
                      {row.is_published
                        ? t('admin.curated.published')
                        : t('admin.curated.hidden')}
                    </p>

                    {!editing && (
                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => startEdit(row)}
                        >
                          {t('admin.curated.edit')}
                        </button>
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-link"
                        >
                          {t('admin.curated.open')}
                        </a>
                        <button
                          type="button"
                          className="btn-link"
                          disabled={busy}
                          onClick={() => void togglePublished(row)}
                        >
                          {row.is_published
                            ? t('admin.curated.hide')
                            : t('admin.curated.publish')}
                        </button>
                        <button
                          type="button"
                          className="btn-link"
                          disabled={index === 0}
                          onClick={() =>
                            void persistOrder(moveItem(rows, index, index - 1))
                          }
                        >
                          {t('admin.curated.up')}
                        </button>
                        <button
                          type="button"
                          className="btn-link"
                          disabled={index === rows.length - 1}
                          onClick={() =>
                            void persistOrder(moveItem(rows, index, index + 1))
                          }
                        >
                          {t('admin.curated.down')}
                        </button>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => setToDelete(row)}
                        >
                          {t('admin.curated.delete')}
                        </button>
                      </div>
                    )}

                    {editing && (
                      <form
                        noValidate
                        data-curated-edit
                        className="mt-6 max-w-2xl space-y-6"
                        onSubmit={(event) => {
                          event.preventDefault()
                          void save(row)
                        }}
                      >
                        <TextField
                          id={`c-url-${row.id}`}
                          type="url"
                          label={t('admin.curated.fields.url')}
                          value={values.url}
                          error={
                            errors.url
                              ? t(`admin.curated.error.${errors.url}`)
                              : undefined
                          }
                          onChange={(v) => setValues((c) => ({ ...c, url: v }))}
                        />
                        <TextField
                          id={`c-title-${row.id}`}
                          label={t('admin.curated.fields.title_de')}
                          value={values.title_de}
                          error={
                            errors.title_de
                              ? t(`admin.curated.error.${errors.title_de}`)
                              : undefined
                          }
                          onChange={(v) =>
                            setValues((c) => ({ ...c, title_de: v }))
                          }
                        />
                        <TextField
                          id={`c-source-${row.id}`}
                          label={t('admin.curated.fields.source')}
                          value={values.source}
                          error={
                            errors.source
                              ? t(`admin.curated.error.${errors.source}`)
                              : undefined
                          }
                          onChange={(v) =>
                            setValues((c) => ({ ...c, source: v }))
                          }
                        />
                        <TextField
                          id={`c-note-${row.id}`}
                          rows={3}
                          label={t('admin.curated.fields.note_de')}
                          value={values.note_de}
                          error={
                            errors.note_de
                              ? t(`admin.curated.error.${errors.note_de}`)
                              : undefined
                          }
                          onChange={(v) =>
                            setValues((c) => ({ ...c, note_de: v }))
                          }
                        />
                        <div>
                          <p className="label">
                            {t('admin.curated.thumbnail')}
                          </p>
                          {row.thumbnail_url && (
                            <>
                              <img
                                src={row.thumbnail_url}
                                alt=""
                                className="mt-3 block max-h-40 max-w-full bg-line/30 object-contain"
                              />
                              <p className="mt-2">
                                <button
                                  type="button"
                                  className="btn-link"
                                  disabled={busy}
                                  onClick={() => void dropThumbnail(row)}
                                >
                                  {t('admin.curated.thumbRemove')}
                                </button>
                              </p>
                            </>
                          )}
                          <Dropzone
                            className="mt-3"
                            label={t('admin.curated.thumbDrop')}
                            chooseLabel={t('admin.curated.thumbChoose')}
                            disabled={busy}
                            onFiles={(files) =>
                              void changeThumbnail(row, files)
                            }
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                          <button type="submit" className="btn" disabled={busy}>
                            {t('admin.curated.save')}
                          </button>
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() => setEditingId(null)}
                          >
                            {t('admin.curated.cancel')}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {toDelete && (
        <ConfirmDialog
          title={t('admin.curated.confirm.deleteTitle')}
          text={t('admin.curated.confirm.deleteText', {
            title: label(toDelete),
          })}
          confirmLabel={t('admin.curated.confirm.deleteConfirm')}
          cancelLabel={t('admin.curated.confirm.cancel')}
          busy={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </main>
  )
}
