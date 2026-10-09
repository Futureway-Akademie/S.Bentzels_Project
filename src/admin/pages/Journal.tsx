import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { routes } from '../../config/routes'
import { formatLongDate } from '../../lib/format'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  createDraft,
  deletePostWithFiles,
  listPosts,
  setPostStatus,
  type PostListItem,
} from '../lib/posts'
import { useToast } from '../toast/useToast'
import { useLoad } from '../useLoad'

export default function Journal() {
  const { t } = useTranslation()
  const { notify } = useToast()
  const navigate = useNavigate()
  const { state, reload } = useLoad(listPosts)

  const [rows, setRows] = useState<PostListItem[]>([])
  const [synced, setSynced] = useState<unknown>(null)
  if (state.status === 'ready' && synced !== state.data) {
    setSynced(state.data)
    setRows(state.data)
  }

  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<PostListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const create = async () => {
    setCreating(true)
    try {
      const draft = await createDraft()
      notify(t('admin.journal.toast.created'))
      navigate(`${routes.adminJournal}/${draft.id}`)
    } catch {
      notify(t('admin.journal.toast.failed'), 'error')
      setCreating(false)
    }
  }

  const toggleStatus = async (post: PostListItem) => {
    const next =
      post.status === 'veroeffentlicht' ? 'entwurf' : 'veroeffentlicht'
    setBusyId(post.id)
    try {
      const { published_at } = await setPostStatus(post, next)
      setRows((current) =>
        current.map((row) =>
          row.id === post.id ? { ...row, status: next, published_at } : row,
        ),
      )
      notify(
        t(
          next === 'veroeffentlicht'
            ? 'admin.journal.toast.published'
            : 'admin.journal.toast.unpublished',
        ),
      )
    } catch {
      notify(t('admin.journal.toast.failed'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      const result = await deletePostWithFiles(toDelete.id)
      setRows((current) => current.filter((row) => row.id !== toDelete.id))
      if (result.failed > 0)
        notify(
          t('admin.journal.toast.deletedLeftover', { count: result.failed }),
          'error',
        )
      else notify(t('admin.journal.toast.deleted'))
      setToDelete(null)
    } catch {
      notify(t('admin.journal.toast.failed'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
          {t('admin.journal.title')}
        </h1>
        <button
          type="button"
          className="btn"
          disabled={creating}
          onClick={() => void create()}
        >
          {t('admin.journal.new')}
        </button>
      </div>

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
        <p className="mt-10 text-muted">{t('admin.journal.empty')}</p>
      )}

      {rows.length > 0 && (
        <>
          <p className="label mt-10" role="status">
            {t('admin.journal.count', { count: rows.length })}
          </p>
          <ul className="m-0 mt-4 list-none p-0">
            {rows.map((post) => {
              const published = post.status === 'veroeffentlicht'
              const title = post.title_de ?? t('admin.journal.untitled')
              return (
                <li
                  key={post.id}
                  data-post-id={post.id}
                  className="grid gap-x-6 gap-y-3 border-t border-line py-5 md:grid-cols-[6rem_1fr_auto] md:items-center"
                >
                  <Link
                    to={`${routes.adminJournal}/${post.id}`}
                    aria-hidden="true"
                    tabIndex={-1}
                    className="hidden md:block"
                  >
                    {(post.cover_thumb_url ?? post.cover_image_url) ? (
                      <img
                        src={post.cover_thumb_url ?? post.cover_image_url ?? ''}
                        alt=""
                        loading="lazy"
                        className="h-16 w-24 bg-line/30 object-contain"
                      />
                    ) : (
                      <span className="block h-16 w-24 border border-line" />
                    )}
                  </Link>
                  <div>
                    <p className="break-words text-[1.125rem] leading-snug">
                      {title}
                    </p>
                    <p className="label mt-1">
                      <span>
                        {published
                          ? t('admin.journal.statusPublished')
                          : t('admin.journal.statusDraft')}
                      </span>
                      {' · '}
                      <span>
                        {post.published_at
                          ? formatLongDate(post.published_at)
                          : t('admin.journal.noDate')}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    <Link
                      to={`${routes.adminJournal}/${post.id}`}
                      className="btn-link"
                    >
                      {t('admin.journal.edit')}
                    </Link>
                    <button
                      type="button"
                      className="btn-link"
                      disabled={busyId === post.id}
                      onClick={() => void toggleStatus(post)}
                    >
                      {published
                        ? t('admin.journal.unpublish')
                        : t('admin.journal.publish')}
                    </button>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => setToDelete(post)}
                    >
                      {t('admin.journal.delete')}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {toDelete && (
        <ConfirmDialog
          title={t('admin.journal.confirm.deleteTitle')}
          text={t('admin.journal.confirm.deleteText', {
            title: toDelete.title_de ?? t('admin.journal.untitled'),
          })}
          confirmLabel={t('admin.journal.confirm.deleteConfirm')}
          cancelLabel={t('admin.journal.confirm.cancel')}
          busy={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </main>
  )
}
