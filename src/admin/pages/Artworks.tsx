import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { routes } from '../../config/routes'
import ConfirmDialog from '../components/ConfirmDialog'
import Dropzone from '../components/Dropzone'
import {
  createArtworkFromFile,
  deleteArtworkWithFiles,
  duplicateArtwork,
  listArtworks,
  saveOrder,
  setArchived,
  updateArtwork,
  type ArtworkListItem,
} from '../lib/artworks'
import { errorKey } from '../lib/errors'
import { moveBefore, moveItem } from '../lib/order'
import { useLoad } from '../useLoad'
import { useToast } from '../toast/useToast'

type Tab = 'active' | 'archive'
type UploadItem = {
  id: number
  name: string
  state: 'wait' | 'busy' | 'done' | 'error'
  message?: string
}
type Status = NonNullable<ArtworkListItem['status']>

const loadActive = () => listArtworks(false)
const loadArchive = () => listArtworks(true)
const statuses: Status[] = ['verfuegbar', 'reserviert', 'verkauft']

export default function Artworks() {
  const { t } = useTranslation()
  const { notify } = useToast()
  const [tab, setTab] = useState<Tab>('active')
  const { state, reload } = useLoad(tab === 'active' ? loadActive : loadArchive)

  const [rows, setRows] = useState<ArtworkListItem[]>([])
  const [synced, setSynced] = useState<unknown>(null)
  if (state.status === 'ready' && synced !== state.data) {
    setSynced(state.data)
    setRows(state.data)
  }

  const [publishNow, setPublishNow] = useState(true)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<ArtworkListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const switchTab = (next: Tab) => {
    if (next === tab) return
    setTab(next)
    setSynced(null)
    setRows([])
  }

  const handleFiles = useCallback(
    async (files: File[]) => {
      const items: UploadItem[] = files.map((file, index) => ({
        id: Date.now() + index,
        name: file.name,
        state: 'wait',
      }))
      setUploads(items)
      setUploading(true)
      let ok = 0
      for (const [index, file] of files.entries()) {
        const id = items[index].id
        setUploads((current) =>
          current.map((item) =>
            item.id === id ? { ...item, state: 'busy' } : item,
          ),
        )
        try {
          const created = await createArtworkFromFile(file, {
            publish: publishNow,
          })
          ok += 1
          if (tab === 'active') setRows((current) => [...current, created])
          setUploads((current) =>
            current.map((item) =>
              item.id === id ? { ...item, state: 'done' } : item,
            ),
          )
        } catch (error) {
          const message = t(`admin.artworks.error.${errorKey(error)}`)
          setUploads((current) =>
            current.map((item) =>
              item.id === id ? { ...item, state: 'error', message } : item,
            ),
          )
        }
      }
      setUploading(false)
      if (ok === files.length)
        notify(t('admin.artworks.toast.created', { count: ok }))
      else
        notify(
          t('admin.artworks.toast.createdPartial', { ok, total: files.length }),
          'error',
        )
    },
    [notify, publishNow, t, tab],
  )

  const patchRow = async (
    item: ArtworkListItem,
    patch: Partial<ArtworkListItem>,
  ) => {
    const before = rows
    setRows((current) =>
      current.map((row) => (row.id === item.id ? { ...row, ...patch } : row)),
    )
    try {
      await updateArtwork(item.id, patch)
    } catch {
      setRows(before)
      notify(t('admin.artworks.toast.saveFailed'), 'error')
    }
  }

  const persistOrder = async (ordered: ArtworkListItem[]) => {
    const before = rows
    const renumbered = ordered.map((row, index) => ({
      ...row,
      sort_order: index + 1,
    }))
    setRows(renumbered)
    try {
      await saveOrder(ordered)
      notify(t('admin.artworks.toast.orderSaved'))
    } catch {
      setRows(before)
      notify(t('admin.artworks.toast.saveFailed'), 'error')
    }
  }

  const move = (index: number, delta: number) => {
    void persistOrder(moveItem(rows, index, index + delta))
  }

  const duplicate = async (item: ArtworkListItem) => {
    setBusyId(item.id)
    try {
      await duplicateArtwork(item.id)
      notify(t('admin.artworks.toast.duplicated'))
      reload()
    } catch {
      notify(t('admin.artworks.toast.failedGeneric'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const archive = async (item: ArtworkListItem, archived: boolean) => {
    setBusyId(item.id)
    try {
      await setArchived(item.id, archived)
      setRows((current) => current.filter((row) => row.id !== item.id))
      notify(
        t(
          archived
            ? 'admin.artworks.toast.archived'
            : 'admin.artworks.toast.restored',
        ),
      )
    } catch {
      notify(t('admin.artworks.toast.failedGeneric'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const result = await deleteArtworkWithFiles(toDelete.id)
      setRows((current) => current.filter((row) => row.id !== toDelete.id))
      if (result.failed > 0)
        notify(
          t('admin.artworks.toast.deletedLeftover', { count: result.failed }),
          'error',
        )
      else notify(t('admin.artworks.toast.deleted'))
      setToDelete(null)
    } catch {
      notify(t('admin.artworks.toast.failedGeneric'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const sortable = tab === 'active'

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <h1 className="text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {t('admin.artworks.title')}
      </h1>

      <section className="mt-10 max-w-3xl" aria-labelledby="upload-title">
        <h2 id="upload-title" className="label">
          {t('admin.artworks.uploadTitle')}
        </h2>
        <Dropzone
          className="mt-3"
          label={t('admin.artworks.dropHint')}
          hint={t('admin.artworks.uploadHint')}
          chooseLabel={t('admin.artworks.choose')}
          multiple
          disabled={uploading}
          onFiles={(files) => void handleFiles(files)}
        />
        <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={publishNow}
            onChange={(event) => setPublishNow(event.target.checked)}
          />
          <span>{t('admin.artworks.publishNow')}</span>
        </label>
        {uploads.length > 0 && (
          <ul className="m-0 mt-4 list-none p-0" aria-live="polite">
            {uploads.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-line py-2 text-sm"
              >
                <span className="break-all">{item.name}</span>
                <span className={item.state === 'error' ? '' : 'text-muted'}>
                  {item.state === 'error'
                    ? `${t('admin.artworks.failed')}: ${item.message}`
                    : t(
                        item.state === 'wait'
                          ? 'admin.artworks.waiting'
                          : item.state === 'busy'
                            ? 'admin.artworks.uploading'
                            : 'admin.artworks.done',
                      )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-line pb-4">
        <button
          type="button"
          className="filter-link"
          aria-pressed={tab === 'active'}
          onClick={() => switchTab('active')}
        >
          {t('admin.artworks.tabActive')}
        </button>
        <button
          type="button"
          className="filter-link"
          aria-pressed={tab === 'archive'}
          onClick={() => switchTab('archive')}
        >
          {t('admin.artworks.tabArchive')}
        </button>
        {state.status === 'ready' && (
          <span className="label ml-auto" role="status">
            {t('admin.artworks.count', { count: rows.length })}
          </span>
        )}
      </div>
      {sortable && rows.length > 1 && (
        <p className="mt-3 text-sm text-muted">
          {t('admin.artworks.dragHint')}
        </p>
      )}

      {state.status === 'loading' && (
        <p className="label mt-8" role="status">
          {t('admin.loading')}
        </p>
      )}
      {state.status === 'error' && (
        <div className="mt-8" role="alert">
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
        <p className="mt-8 text-muted">
          {t(sortable ? 'admin.artworks.empty' : 'admin.artworks.emptyArchive')}
        </p>
      )}

      {rows.length > 0 && (
        <ul className="m-0 mt-8 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rows.map((item, index) => {
            const title = item.title_de ?? t('admin.artworks.untitled')
            const busy = busyId === item.id
            return (
              <li
                key={item.id}
                data-artwork-id={item.id}
                draggable={sortable}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', item.id)
                  setDragId(item.id)
                }}
                onDragOver={(event) => {
                  if (!sortable || !dragId) return
                  event.preventDefault()
                  setOverId(item.id)
                }}
                onDragLeave={() =>
                  setOverId((current) => (current === item.id ? null : current))
                }
                onDrop={(event) => {
                  event.preventDefault()
                  const moved = dragId
                  setDragId(null)
                  setOverId(null)
                  if (moved && moved !== item.id)
                    void persistOrder(moveBefore(rows, moved, item.id))
                }}
                onDragEnd={() => {
                  setDragId(null)
                  setOverId(null)
                }}
                className={`border p-4 ${overId === item.id && dragId !== item.id ? 'border-foreground' : 'border-line'} ${dragId === item.id ? 'opacity-50' : ''}`}
              >
                <Link
                  to={`${routes.adminArtworks}/${item.id}`}
                  className="flex aspect-[4/3] items-center justify-center bg-line/30"
                  aria-label={`${t('admin.artworks.edit')}: ${title}`}
                  draggable={false}
                >
                  <img
                    src={item.thumb_url ?? item.main_image_url}
                    width={item.image_width}
                    height={item.image_height}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="max-h-full max-w-full object-contain"
                  />
                </Link>
                <p className="mt-3 break-words text-[1.0625rem] leading-snug">
                  {title}
                </p>
                <p className="label mt-1">
                  {[
                    item.year,
                    item.status
                      ? t(`admin.artworks.status.${item.status}`)
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || ' '}
                </p>

                {sortable && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                    <button
                      type="button"
                      className="filter-link"
                      aria-pressed={item.is_published}
                      onClick={() =>
                        void patchRow(item, {
                          is_published: !item.is_published,
                        })
                      }
                    >
                      {item.is_published
                        ? t('admin.artworks.published')
                        : t('admin.artworks.hidden')}
                    </button>
                    <button
                      type="button"
                      className="filter-link"
                      aria-pressed={item.is_highlight}
                      onClick={() =>
                        void patchRow(item, {
                          is_highlight: !item.is_highlight,
                        })
                      }
                    >
                      {t('admin.artworks.highlight')}
                    </button>
                    <label className="sr-only" htmlFor={`status-${item.id}`}>
                      {t('admin.artworks.statusLabel')}
                    </label>
                    <select
                      id={`status-${item.id}`}
                      className="field !mt-0 !w-auto min-h-11"
                      value={item.status ?? ''}
                      onChange={(event) =>
                        void patchRow(item, {
                          status: (event.target.value ||
                            null) as ArtworkListItem['status'],
                        })
                      }
                    >
                      <option value="">{t('admin.artworks.statusNone')}</option>
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {t(`admin.artworks.status.${status}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-3">
                  <Link
                    to={`${routes.adminArtworks}/${item.id}`}
                    className="btn-link"
                  >
                    {t('admin.artworks.edit')}
                  </Link>
                  {sortable ? (
                    <>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={busy}
                        onClick={() => void duplicate(item)}
                      >
                        {t('admin.artworks.duplicate')}
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={busy}
                        onClick={() => void archive(item, true)}
                      >
                        {t('admin.artworks.archive')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={busy}
                        onClick={() => void archive(item, false)}
                      >
                        {t('admin.artworks.restore')}
                      </button>
                      <button
                        type="button"
                        className="btn-link"
                        disabled={busy}
                        onClick={() => setToDelete(item)}
                      >
                        {t('admin.artworks.delete')}
                      </button>
                    </>
                  )}
                </div>
                {sortable && rows.length > 1 && (
                  <div className="mt-3 flex gap-x-5">
                    <button
                      type="button"
                      className="btn-link"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      {t('admin.artworks.moveEarlier')}
                    </button>
                    <button
                      type="button"
                      className="btn-link"
                      disabled={index === rows.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      {t('admin.artworks.moveLater')}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {toDelete && (
        <ConfirmDialog
          title={t('admin.artworks.confirm.deleteTitle')}
          text={t('admin.artworks.confirm.deleteText', {
            title: toDelete.title_de ?? t('admin.artworks.untitled'),
          })}
          confirmLabel={t('admin.artworks.confirm.deleteConfirm')}
          cancelLabel={t('admin.artworks.confirm.cancel')}
          busy={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </main>
  )
}
