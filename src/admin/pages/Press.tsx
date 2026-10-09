import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { routes } from '../../config/routes'
import ConfirmDialog from '../components/ConfirmDialog'
import Dropzone from '../components/Dropzone'
import { errorKey } from '../lib/errors'
import { moveItem } from '../lib/order'
import {
  addPressCategory,
  createPressFromFile,
  createPressFromLink,
  deletePressCategory,
  deletePressItem,
  listPressCategories,
  listPressItems,
  renamePressCategory,
  savePressOrder,
  updatePressItem,
  type PressCategory,
  type PressRecord,
} from '../lib/press'
import { fileKind } from '../lib/pressForm'
import { useDragSort } from '../lib/useDragSort'
import { useToast } from '../toast/useToast'
import { useLoad } from '../useLoad'

async function loadAll() {
  const [items, categories] = await Promise.all([
    listPressItems(),
    listPressCategories(),
  ])
  return { items, categories }
}

export default function Press() {
  const { t } = useTranslation()
  const { notify } = useToast()
  const { state, reload } = useLoad(loadAll)

  const [rows, setRows] = useState<PressRecord[]>([])
  const [categories, setCategories] = useState<PressCategory[]>([])
  const [synced, setSynced] = useState<unknown>(null)
  if (state.status === 'ready' && synced !== state.data) {
    setSynced(state.data)
    setRows(state.data.items)
    setCategories(state.data.categories)
  }

  const [progress, setProgress] = useState<{
    current: number
    total: number
  } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<PressRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [categoryToDelete, setCategoryToDelete] =
    useState<PressCategory | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})

  const categoryName = (slug: string | null) =>
    categories.find((category) => category.slug === slug)?.name_de ?? null

  const persistOrder = async (next: PressRecord[]) => {
    const previous = rows
    setRows(next)
    try {
      await savePressOrder(next)
      setRows(next.map((row, index) => ({ ...row, sort_order: index + 1 })))
    } catch {
      setRows(previous)
      notify(t('admin.press.toast.failed'), 'error')
    }
  }

  const { dragId, overId, itemProps } = useDragSort(
    rows,
    (next) => void persistOrder(next),
  )

  const upload = async (files: File[]) => {
    const accepted = files.filter((file) => fileKind(file) !== null)
    if (accepted.length < files.length)
      notify(t('admin.press.error.type'), 'error')
    let created = 0
    for (const [index, file] of accepted.entries()) {
      setProgress({ current: index + 1, total: accepted.length })
      try {
        const item = await createPressFromFile(file)
        created += 1
        setRows((current) => [...current, item])
      } catch (error) {
        const key =
          fileKind(file) === 'pdf' && errorKey(error) === 'size'
            ? 'pdfSize'
            : errorKey(error)
        notify(`${file.name}: ${t(`admin.press.error.${key}`)}`, 'error')
      }
    }
    setProgress(null)
    if (accepted.length > 0)
      notify(t('admin.press.toast.uploaded', { count: accepted.length }))
  }

  const addLink = async (event: FormEvent) => {
    event.preventDefault()
    if (!/^https?:\/\/\S+$/i.test(linkUrl.trim())) {
      setLinkError(true)
      return
    }
    setLinkError(false)
    try {
      const created = await createPressFromLink(linkUrl)
      setRows((current) => [...current, created])
      setLinkUrl('')
      notify(t('admin.press.toast.linkAdded'))
    } catch {
      notify(t('admin.press.toast.failed'), 'error')
    }
  }

  const patch = async (
    row: PressRecord,
    change: Partial<PressRecord>,
    message: string,
  ) => {
    setBusyId(row.id)
    try {
      await updatePressItem(row.id, change)
      setRows((current) =>
        current.map((item) =>
          item.id === row.id ? { ...item, ...change } : item,
        ),
      )
      notify(message)
    } catch {
      notify(t('admin.press.toast.failed'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const result = await deletePressItem(toDelete.id)
      setRows((current) => current.filter((row) => row.id !== toDelete.id))
      if (result.failed > 0)
        notify(
          t('admin.press.toast.deletedLeftover', { count: result.failed }),
          'error',
        )
      else notify(t('admin.press.toast.deleted'))
      setToDelete(null)
    } catch {
      notify(t('admin.press.toast.failed'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const createCategory = async () => {
    const name = newCategory.trim()
    if (!name) return
    try {
      const created = await addPressCategory(name, categories)
      setCategories((current) => [...current, created])
      setNewCategory('')
      notify(t('admin.press.toast.categoryAdded'))
    } catch {
      notify(t('admin.press.toast.failed'), 'error')
    }
  }

  const renameCategory = async (category: PressCategory) => {
    const name = (names[category.id] ?? category.name_de).trim()
    if (!name || name === category.name_de) return
    try {
      await renamePressCategory(category.id, name)
      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? { ...item, name_de: name } : item,
        ),
      )
      notify(t('admin.press.toast.categoryRenamed'))
    } catch {
      notify(t('admin.press.toast.failed'), 'error')
    }
  }

  const removeCategory = async () => {
    if (!categoryToDelete) return
    try {
      await deletePressCategory(categoryToDelete.id)
      setCategories((current) =>
        current.filter((item) => item.id !== categoryToDelete.id),
      )
      setRows((current) =>
        current.map((row) =>
          row.category === categoryToDelete.slug
            ? { ...row, category: null }
            : row,
        ),
      )
      notify(t('admin.press.toast.categoryDeleted'))
    } catch {
      notify(t('admin.press.toast.failed'), 'error')
    } finally {
      setCategoryToDelete(null)
    }
  }

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <h1 className="text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {t('admin.press.title')}
      </h1>

      <p
        className="mt-6 max-w-prose border border-line p-4 text-sm"
        role="note"
      >
        {t('admin.press.copyright')}
      </p>

      <Dropzone
        className="mt-8"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf"
        label={t('admin.press.drop')}
        hint={t('admin.press.dropHint')}
        chooseLabel={t('admin.press.choose')}
        disabled={progress !== null}
        onFiles={(files) => void upload(files)}
      />
      {progress && (
        <p className="label mt-4" role="status">
          {t('admin.press.uploading', progress)}
        </p>
      )}

      <form
        noValidate
        className="mt-8 flex max-w-2xl flex-wrap items-end gap-3"
        onSubmit={(event) => void addLink(event)}
        aria-label={t('admin.press.linkTitle')}
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="press-link" className="label block">
            {t('admin.press.linkLabel')}
          </label>
          <input
            id="press-link"
            type="url"
            className="field"
            value={linkUrl}
            aria-invalid={linkError}
            aria-describedby={linkError ? 'press-link-error' : undefined}
            onChange={(event) => {
              setLinkUrl(event.target.value)
              setLinkError(false)
            }}
          />
          {linkError && (
            <p id="press-link-error" role="alert" className="field-error">
              {t('admin.press.error.urlInvalid')}
            </p>
          )}
        </div>
        <button type="submit" className="btn">
          {t('admin.press.linkAdd')}
        </button>
      </form>

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
        <p className="mt-10 text-muted">{t('admin.press.empty')}</p>
      )}

      {rows.length > 0 && (
        <>
          <p className="label mt-10" role="status">
            {t('admin.press.count', { count: rows.length })}
          </p>
          <p className="mt-2 text-sm text-muted">{t('admin.press.dragHint')}</p>
          <ul className="m-0 mt-4 list-none p-0">
            {rows.map((row, index) => {
              const busy = busyId === row.id
              const meta = [categoryName(row.category), row.medium, row.year]
                .filter(Boolean)
                .join(' · ')
              return (
                <li
                  key={row.id}
                  data-press-id={row.id}
                  {...itemProps(row.id)}
                  className={`grid gap-x-6 gap-y-3 border-t py-5 md:grid-cols-[6rem_minmax(0,1fr)] ${overId === row.id && dragId !== row.id ? 'border-foreground' : 'border-line'} ${dragId === row.id ? 'opacity-50' : ''}`}
                >
                  <Link
                    to={`${routes.adminPress}/${row.id}`}
                    aria-hidden="true"
                    tabIndex={-1}
                    className="hidden md:block"
                  >
                    {(row.thumbnail_url ?? row.file_url) ? (
                      <img
                        src={row.thumbnail_url ?? row.file_url ?? ''}
                        alt=""
                        draggable={false}
                        loading="lazy"
                        className="h-20 w-24 bg-line/30 object-contain"
                      />
                    ) : (
                      <span className="flex h-20 w-24 items-center justify-center border border-line text-sm text-muted">
                        {t('admin.press.link')}
                      </span>
                    )}
                  </Link>
                  <div>
                    <p className="break-words text-[1.125rem] leading-snug">
                      {row.title_de ??
                        row.external_url ??
                        t('admin.press.untitled')}
                    </p>
                    {meta && <p className="label mt-1">{meta}</p>}
                    <p className="label mt-1">
                      {row.is_published
                        ? t('admin.press.published')
                        : t('admin.press.hidden')}
                      {row.is_highlight && ` · ${t('admin.press.highlight')}`}
                      {row.file_type === 'pdf' && ' · PDF'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
                      <Link
                        to={`${routes.adminPress}/${row.id}`}
                        className="btn-link"
                      >
                        {t('admin.press.edit')}
                      </Link>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={busy}
                        onClick={() =>
                          void patch(
                            row,
                            { is_published: !row.is_published },
                            t(
                              row.is_published
                                ? 'admin.press.toast.hidden'
                                : 'admin.press.toast.published',
                            ),
                          )
                        }
                      >
                        {row.is_published
                          ? t('admin.press.hide')
                          : t('admin.press.publish')}
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={busy}
                        aria-pressed={row.is_highlight}
                        onClick={() =>
                          void patch(
                            row,
                            { is_highlight: !row.is_highlight },
                            t(
                              row.is_highlight
                                ? 'admin.press.toast.unhighlighted'
                                : 'admin.press.toast.highlighted',
                            ),
                          )
                        }
                      >
                        {row.is_highlight
                          ? t('admin.press.unhighlight')
                          : t('admin.press.setHighlight')}
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={index === 0}
                        onClick={() =>
                          void persistOrder(moveItem(rows, index, index - 1))
                        }
                      >
                        {t('admin.press.up')}
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={index === rows.length - 1}
                        onClick={() =>
                          void persistOrder(moveItem(rows, index, index + 1))
                        }
                      >
                        {t('admin.press.down')}
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => setToDelete(row)}
                      >
                        {t('admin.press.delete')}
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {state.status === 'ready' && (
        <details className="mt-14 max-w-2xl border-t border-line pt-6">
          <summary className="label cursor-pointer select-none py-2">
            {t('admin.press.categories')}
          </summary>
          <p className="mt-3 text-sm text-muted">
            {t('admin.press.categoriesHint')}
          </p>
          <ul className="m-0 mt-4 list-none space-y-3 p-0">
            {categories.map((category) => (
              <li key={category.id} className="flex flex-wrap items-end gap-3">
                <div className="min-w-0 flex-1">
                  <label htmlFor={`cat-${category.id}`} className="sr-only">
                    {t('admin.press.categoryName')}
                  </label>
                  <input
                    id={`cat-${category.id}`}
                    type="text"
                    className="field"
                    value={names[category.id] ?? category.name_de}
                    onChange={(event) =>
                      setNames((current) => ({
                        ...current,
                        [category.id]: event.target.value,
                      }))
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => void renameCategory(category)}
                >
                  {t('admin.press.rename')}
                </button>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => setCategoryToDelete(category)}
                >
                  {t('admin.press.delete')}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="cat-new" className="label block">
                {t('admin.press.newCategory')}
              </label>
              <input
                id="cat-new"
                type="text"
                className="field"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn"
              disabled={newCategory.trim() === ''}
              onClick={() => void createCategory()}
            >
              {t('admin.press.addCategory')}
            </button>
          </div>
        </details>
      )}

      {toDelete && (
        <ConfirmDialog
          title={t('admin.press.confirm.deleteTitle')}
          text={t('admin.press.confirm.deleteText', {
            title:
              toDelete.title_de ??
              toDelete.external_url ??
              t('admin.press.untitled'),
          })}
          confirmLabel={t('admin.press.confirm.deleteConfirm')}
          cancelLabel={t('admin.press.confirm.cancel')}
          busy={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
      {categoryToDelete && (
        <ConfirmDialog
          title={t('admin.press.confirm.categoryTitle')}
          text={t('admin.press.confirm.categoryText', {
            name: categoryToDelete.name_de,
          })}
          confirmLabel={t('admin.press.confirm.categoryConfirm')}
          cancelLabel={t('admin.press.confirm.cancel')}
          busy={false}
          onConfirm={() => void removeCategory()}
          onCancel={() => setCategoryToDelete(null)}
        />
      )}
    </main>
  )
}
