import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  createVita,
  deleteVita,
  listVita,
  updateVita,
  type VitaRecord,
} from '../lib/vita'
import {
  emptyVitaForm,
  sortVita,
  toVitaPayload,
  validateVitaForm,
  vitaFormFromRow,
  VITA_CATEGORIES,
  type VitaCategory,
  type VitaFormErrors,
  type VitaFormValues,
} from '../lib/vitaForm'
import { useToast } from '../toast/useToast'
import { useLoad } from '../useLoad'

type EntryFormProps = {
  idPrefix: string
  initial: VitaFormValues
  onSave: (values: VitaFormValues) => Promise<void>
  onCancel: () => void
}

// Formular für einen Eintrag, direkt in der Liste (neu oder bearbeiten).
function EntryForm({ idPrefix, initial, onSave, onCancel }: EntryFormProps) {
  const { t } = useTranslation()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<VitaFormErrors>({})
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof VitaFormValues>(
    key: K,
    value: VitaFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }))

  const submit = async () => {
    const found = validateVitaForm(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setTimeout(
        () =>
          document
            .querySelector<HTMLElement>(`#${idPrefix} [aria-invalid="true"]`)
            ?.focus(),
        0,
      )
      return
    }
    setSaving(true)
    try {
      await onSave(values)
    } finally {
      setSaving(false)
    }
  }

  const field = (
    key: 'year' | 'year_end' | 'title_de' | 'place',
    extra: { inputMode?: 'numeric'; className?: string } = {},
  ) => {
    const error = errors[key]
    const id = `${idPrefix}-${key}`
    return (
      <div className={extra.className}>
        <label htmlFor={id} className="label block">
          {t(`admin.vita.fields.${key}`)}
        </label>
        <input
          id={id}
          type="text"
          className="field"
          value={values[key]}
          inputMode={extra.inputMode}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => set(key, event.target.value)}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="field-error">
            {t(`admin.vita.error.${error}`)}
          </p>
        )}
      </div>
    )
  }

  return (
    <form
      id={idPrefix}
      noValidate
      className="border border-foreground p-4"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <div className="grid gap-x-6 gap-y-5 md:grid-cols-[7rem_9rem_1fr]">
        {field('year', { inputMode: 'numeric' })}
        {field('year_end', { inputMode: 'numeric' })}
        {field('title_de')}
        {field('place', { className: 'md:col-start-3' })}
      </div>
      <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={values.is_published}
          onChange={(event) => set('is_published', event.target.checked)}
        />
        <span>{t('admin.vita.fields.is_published')}</span>
      </label>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
        <button type="submit" className="btn" disabled={saving}>
          {t('admin.vita.save')}
        </button>
        <button type="button" className="btn-link" onClick={onCancel}>
          {t('admin.vita.cancel')}
        </button>
      </div>
    </form>
  )
}

export default function Vita() {
  const { t } = useTranslation()
  const { notify } = useToast()
  const { state, reload } = useLoad(listVita)

  const [entries, setEntries] = useState<VitaRecord[]>([])
  const [synced, setSynced] = useState<unknown>(null)
  if (state.status === 'ready' && synced !== state.data) {
    setSynced(state.data)
    setEntries(state.data)
  }

  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState<VitaCategory | null>(null)
  const [toDelete, setToDelete] = useState<VitaRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const nextSort = () =>
    entries.reduce((max, entry) => Math.max(max, entry.sort_order), 0) + 1

  const create = async (category: VitaCategory, values: VitaFormValues) => {
    try {
      const created = await createVita(
        toVitaPayload({ ...values, category }),
        nextSort(),
      )
      setEntries((current) => [...current, created])
      setAdding(null)
      notify(t('admin.vita.toast.created'))
    } catch {
      notify(t('admin.vita.toast.failed'), 'error')
    }
  }

  const update = async (entry: VitaRecord, values: VitaFormValues) => {
    try {
      const payload = toVitaPayload(values)
      await updateVita(entry.id, payload)
      setEntries((current) =>
        current.map((row) =>
          row.id === entry.id ? { ...row, ...payload } : row,
        ),
      )
      setEditingId(null)
      notify(t('admin.vita.toast.saved'))
    } catch {
      notify(t('admin.vita.toast.failed'), 'error')
    }
  }

  const toggleVisible = async (entry: VitaRecord) => {
    const before = entries
    setEntries((current) =>
      current.map((row) =>
        row.id === entry.id ? { ...row, is_published: !row.is_published } : row,
      ),
    )
    try {
      await updateVita(entry.id, { is_published: !entry.is_published })
    } catch {
      setEntries(before)
      notify(t('admin.vita.toast.failed'), 'error')
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteVita(toDelete.id)
      setEntries((current) => current.filter((row) => row.id !== toDelete.id))
      setToDelete(null)
      notify(t('admin.vita.toast.deleted'))
    } catch {
      notify(t('admin.vita.toast.failed'), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <h1 className="text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {t('admin.vita.title')}
      </h1>
      <p className="prose-measure mt-6 text-muted">{t('admin.vita.intro')}</p>

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

      {state.status === 'ready' &&
        VITA_CATEGORIES.map((category) => {
          const list = sortVita(
            entries.filter((entry) => entry.category === category),
          )
          return (
            <section
              key={category}
              className="mt-14"
              aria-labelledby={`vita-${category}`}
              data-category={category}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-3">
                <h2 id={`vita-${category}`} className="label">
                  {t(`vita.category.${category}`)} ·{' '}
                  {t('admin.vita.entries', { count: list.length })}
                </h2>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => setAdding(category)}
                >
                  {t('admin.vita.add')}
                </button>
              </div>

              {adding === category && (
                <div className="mt-4">
                  <EntryForm
                    idPrefix={`vita-new-${category}`}
                    initial={emptyVitaForm(category)}
                    onSave={(values) => create(category, values)}
                    onCancel={() => setAdding(null)}
                  />
                </div>
              )}

              {list.length === 0 && adding !== category && (
                <p className="mt-4 text-muted">{t('admin.vita.empty')}</p>
              )}

              <ul className="m-0 list-none p-0">
                {list.map((entry) => (
                  <li
                    key={entry.id}
                    data-vita-id={entry.id}
                    className="border-b border-line py-4"
                  >
                    {editingId === entry.id ? (
                      <EntryForm
                        idPrefix={`vita-edit-${entry.id}`}
                        initial={vitaFormFromRow(entry)}
                        onSave={(values) => update(entry, values)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div className="grid gap-x-6 gap-y-3 md:grid-cols-[8rem_1fr_auto] md:items-baseline">
                        <p
                          className={
                            entry.is_published
                              ? 'text-muted'
                              : 'text-muted line-through'
                          }
                        >
                          {entry.year_end
                            ? t('admin.vita.years', {
                                from: entry.year,
                                to: entry.year_end,
                              })
                            : entry.year}
                        </p>
                        <p
                          className={`break-words ${entry.is_published ? '' : 'text-muted'}`}
                        >
                          {entry.title_de}
                          {entry.place && (
                            <span className="text-muted">, {entry.place}</span>
                          )}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                          <button
                            type="button"
                            className="filter-link"
                            aria-pressed={entry.is_published}
                            onClick={() => void toggleVisible(entry)}
                          >
                            {entry.is_published
                              ? t('admin.vita.visible')
                              : t('admin.vita.hidden')}
                          </button>
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() => {
                              setAdding(null)
                              setEditingId(entry.id)
                            }}
                          >
                            {t('admin.vita.edit')}
                          </button>
                          <button
                            type="button"
                            className="btn-link"
                            onClick={() => setToDelete(entry)}
                          >
                            {t('admin.vita.delete')}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

      {toDelete && (
        <ConfirmDialog
          title={t('admin.vita.confirm.deleteTitle')}
          text={t('admin.vita.confirm.deleteText', {
            title: toDelete.title_de,
          })}
          confirmLabel={t('admin.vita.confirm.deleteConfirm')}
          cancelLabel={t('admin.vita.confirm.cancel')}
          busy={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setToDelete(null)}
        />
      )}
    </main>
  )
}
