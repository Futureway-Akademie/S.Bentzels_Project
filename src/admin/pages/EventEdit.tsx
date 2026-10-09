import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { routes } from '../../config/routes'
import { formatLongDate } from '../../lib/format'
import ConfirmDialog from '../components/ConfirmDialog'
import Dropzone from '../components/Dropzone'
import { CheckField, Section, TextField } from '../components/FormField'
import { errorKey } from '../lib/errors'
import {
  EVENT_STATUSES,
  eventFormFromRow,
  generateRecurrence,
  shiftToDay,
  toDatePayloads,
  toEventPayload,
  validateEventForm,
  type EventFormValues,
  type EventStatus,
  type RecurrenceRule,
} from '../lib/eventForm'
import {
  addEventPhoto,
  addEventType,
  deleteEventWithFiles,
  duplicateEvent,
  getEvent,
  listEventDates,
  listEventInquiries,
  listEventPhotos,
  listEventTypes,
  removeEventImage,
  removeEventPdf,
  removeEventPhoto,
  replaceEventImage,
  replaceEventPdf,
  saveEvent,
  type EventDateRecord,
  type EventInquiryRecord,
  type EventPhotoRecord,
  type EventRecord,
  type EventTypeRecord,
} from '../lib/events'
import { UploadError } from '../lib/uploadError'
import { useToast } from '../toast/useToast'
import { useLoad } from '../useLoad'

type Loaded = {
  record: EventRecord
  dates: EventDateRecord[]
  photos: EventPhotoRecord[]
  types: EventTypeRecord[]
  inquiries: EventInquiryRecord[]
}

const RULES: RecurrenceRule[] = ['weekly', 'biweekly', 'monthly']

const snapshot = (values: EventFormValues) =>
  JSON.stringify({
    ...values,
    dates: values.dates.map(({ key: _key, ...rest }) => rest),
  })

function pdfErrorKey(error: unknown): string {
  if (error instanceof UploadError) {
    if (error.code === 'type') return 'pdfType'
    if (error.code === 'size') return 'pdfSize'
  }
  return 'upload'
}

function Editor({ initial }: { initial: Loaded }) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [record, setRecord] = useState(initial.record)
  const [types, setTypes] = useState(initial.types)
  const [photos, setPhotos] = useState(initial.photos)
  const [values, setValues] = useState<EventFormValues>(() =>
    eventFormFromRow(initial.record, initial.dates),
  )
  const [saved, setSaved] = useState(() =>
    snapshot(eventFormFromRow(initial.record, initial.dates)),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [imageBusy, setImageBusy] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newType, setNewType] = useState('')
  const [shiftDay, setShiftDay] = useState('')
  const [rule, setRule] = useState<RecurrenceRule>('weekly')
  const [repeat, setRepeat] = useState('4')
  const pdfInput = useRef<HTMLInputElement>(null)

  const dirty = snapshot(values) !== saved

  // Schutz vor ungewolltem Verlassen mit ungespeicherten Änderungen
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const set = <K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }))

  const fieldError = (key: string) => {
    const code = errors[key]
    return code ? t(`admin.events.error.${code}`) : undefined
  }
  const f = (key: string) => t(`admin.events.fields.${key}`)

  const save = async () => {
    const found = validateEventForm(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      notify(t('admin.events.error.fixErrors'), 'error')
      setTimeout(
        () =>
          document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        0,
      )
      return
    }
    setSaving(true)
    try {
      const payload = toEventPayload(values)
      const datePayloads = toDatePayloads(values).map((date, index) => ({
        id: values.dates[index].id,
        ...date,
      }))
      const result = await saveEvent(record, payload, datePayloads)
      const next = { ...record, ...payload, slug: result.slug }
      setRecord(next)
      const form = eventFormFromRow(next, result.dates)
      setValues(form)
      setSaved(snapshot(form))
      notify(t('admin.events.toast.saved'))
    } catch {
      notify(t('admin.events.toast.saveFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  // ----- Termin
  const shift = () => {
    const moved = shiftToDay(values.starts_at, values.ends_at, shiftDay)
    if (!moved) {
      notify(t('admin.events.error.dateInvalid'), 'error')
      return
    }
    setValues((current) => ({ ...current, ...moved, status: 'verschoben' }))
    setShiftDay('')
    notify(t('admin.events.toast.shifted'))
  }

  const cancel = () => {
    set('status', 'abgesagt')
    notify(t('admin.events.toast.cancelPending'))
  }

  const addDate = () =>
    setValues((current) => ({
      ...current,
      dates: [
        ...current.dates,
        {
          id: null,
          key: crypto.randomUUID(),
          starts_at: '',
          ends_at: '',
          note_de: '',
          is_cancelled: false,
        },
      ],
    }))

  const changeDate = (
    key: string,
    change: Partial<EventFormValues['dates'][number]>,
  ) =>
    setValues((current) => ({
      ...current,
      dates: current.dates.map((date) =>
        date.key === key ? { ...date, ...change } : date,
      ),
    }))

  const removeDate = (key: string) =>
    setValues((current) => ({
      ...current,
      dates: current.dates.filter((date) => date.key !== key),
    }))

  const generate = () => {
    const created = generateRecurrence(
      values.starts_at,
      values.ends_at,
      rule,
      Number(repeat),
    )
    if (created.length === 0) {
      notify(t('admin.events.error.recurrence'), 'error')
      return
    }
    setValues((current) => ({
      ...current,
      dates: [
        ...current.dates,
        ...created.map((date) => ({
          id: null,
          key: crypto.randomUUID(),
          starts_at: date.starts_at,
          ends_at: date.ends_at,
          note_de: '',
          is_cancelled: false,
        })),
      ],
    }))
    notify(t('admin.events.toast.generated', { count: created.length }))
  }

  // ----- Art
  const createType = async () => {
    const name = newType.trim()
    if (!name) return
    try {
      const created = await addEventType(name, types)
      setTypes((current) => [...current, created])
      set('type_id', created.id)
      setNewType('')
      notify(t('admin.events.toast.typeAdded'))
    } catch {
      notify(t('admin.events.toast.failed'), 'error')
    }
  }

  // ----- Dateien
  const changeImage = async (files: File[]) => {
    setImageBusy(true)
    try {
      setRecord(await replaceEventImage(record, files[0]))
      notify(t('admin.events.toast.imageSaved'))
    } catch (error) {
      notify(t(`admin.artworks.error.${errorKey(error)}`), 'error')
    } finally {
      setImageBusy(false)
    }
  }

  const dropImage = async () => {
    setImageBusy(true)
    try {
      setRecord(await removeEventImage(record))
      notify(t('admin.events.toast.imageRemoved'))
    } catch {
      notify(t('admin.events.toast.failed'), 'error')
    } finally {
      setImageBusy(false)
    }
  }

  const changePdf = async (file: File | undefined) => {
    if (!file) return
    setPdfBusy(true)
    try {
      setRecord(await replaceEventPdf(record, file))
      notify(t('admin.events.toast.pdfSaved'))
    } catch (error) {
      notify(t(`admin.events.error.${pdfErrorKey(error)}`), 'error')
    } finally {
      setPdfBusy(false)
    }
  }

  const dropPdf = async () => {
    setPdfBusy(true)
    try {
      setRecord(await removeEventPdf(record))
      notify(t('admin.events.toast.pdfRemoved'))
    } catch {
      notify(t('admin.events.toast.failed'), 'error')
    } finally {
      setPdfBusy(false)
    }
  }

  const addPhotos = async (files: File[]) => {
    setPhotoBusy(true)
    let order = Math.max(-1, ...photos.map((photo) => photo.sort_order)) + 1
    for (const file of files) {
      try {
        const photo = await addEventPhoto(record.id, file, order)
        order += 1
        setPhotos((current) => [...current, photo])
      } catch (error) {
        notify(t(`admin.artworks.error.${errorKey(error)}`), 'error')
      }
    }
    setPhotoBusy(false)
  }

  const dropPhoto = async (photo: EventPhotoRecord) => {
    setPhotoBusy(true)
    try {
      await removeEventPhoto(photo)
      setPhotos((current) => current.filter((item) => item.id !== photo.id))
      notify(t('admin.events.toast.photoRemoved'))
    } catch {
      notify(t('admin.events.toast.failed'), 'error')
    } finally {
      setPhotoBusy(false)
    }
  }

  const duplicate = async () => {
    setDuplicating(true)
    try {
      const copy = await duplicateEvent(record.id)
      notify(t('admin.events.toast.duplicated'))
      navigate(`${routes.adminEvents}/${copy.id}`)
    } catch {
      notify(t('admin.events.toast.failed'), 'error')
      setDuplicating(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      const result = await deleteEventWithFiles(record.id)
      if (result.failed > 0)
        notify(
          t('admin.events.toast.deletedLeftover', { count: result.failed }),
          'error',
        )
      else notify(t('admin.events.toast.deleted'))
      navigate(routes.adminEvents)
    } catch {
      notify(t('admin.events.toast.failed'), 'error')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const title = record.title_de || t('admin.events.untitled')

  return (
    <main className="px-4 py-10 md:px-10 md:py-14">
      <p>
        <Link to={routes.adminEvents} className="btn-link">
          {t('admin.events.back')}
        </Link>
      </p>
      <h1 className="mt-6 break-words text-[clamp(2rem,1.4rem+2.5vw,3.5rem)]">
        {title}
      </h1>

      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
        <button
          type="button"
          className="btn-link"
          disabled={duplicating}
          onClick={() => void duplicate()}
        >
          {t('admin.events.duplicate')}
        </button>
        <button
          type="button"
          className="btn-link"
          onClick={() => setConfirmDelete(true)}
        >
          {t('admin.events.delete')}
        </button>
        {dirty && (
          <span className="label" role="status">
            {t('admin.events.unsaved')}
          </span>
        )}
      </div>

      <form
        noValidate
        className="mt-10 max-w-3xl space-y-10"
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        <Section id="sec-basic" title={t('admin.events.section.basic')}>
          <TextField
            id="e-title"
            label={f('title_de')}
            value={values.title_de}
            error={fieldError('title_de')}
            hint={t('admin.events.slugHint')}
            onChange={(value) => set('title_de', value)}
          />
          <div>
            <label htmlFor="e-type" className="label block">
              {f('type_id')}
            </label>
            <select
              id="e-type"
              className="field min-h-11"
              value={values.type_id}
              onChange={(event) => set('type_id', event.target.value)}
            >
              <option value="">{t('admin.events.noType')}</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name_de}
                </option>
              ))}
            </select>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1">
                <label htmlFor="e-newtype" className="label block">
                  {t('admin.events.newType')}
                </label>
                <input
                  id="e-newtype"
                  type="text"
                  className="field"
                  value={newType}
                  onChange={(event) => setNewType(event.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn"
                disabled={newType.trim() === ''}
                onClick={() => void createType()}
              >
                {t('admin.events.addType')}
              </button>
            </div>
          </div>
          <TextField
            id="e-category"
            label={f('category')}
            value={values.category}
            error={fieldError('category')}
            onChange={(value) => set('category', value)}
          />
          <TextField
            id="e-short"
            label={f('short_description_de')}
            rows={3}
            value={values.short_description_de}
            error={fieldError('short_description_de')}
            onChange={(value) => set('short_description_de', value)}
          />
          <TextField
            id="e-desc"
            label={f('description_de')}
            rows={8}
            value={values.description_de}
            error={fieldError('description_de')}
            hint={t('admin.events.descriptionHint')}
            onChange={(value) => set('description_de', value)}
          />
        </Section>

        <Section id="sec-status" title={t('admin.events.section.status')}>
          <div>
            <label htmlFor="e-status" className="label block">
              {f('status')}
            </label>
            <select
              id="e-status"
              className="field min-h-11"
              value={values.status}
              onChange={(event) =>
                set('status', event.target.value as EventStatus)
              }
            >
              {EVENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`admin.events.status.${status}`)}
                </option>
              ))}
            </select>
            <p className="mt-3">
              <button type="button" className="btn-link" onClick={cancel}>
                {t('admin.events.cancelEvent')}
              </button>
            </p>
          </div>
          <CheckField
            id="e-published"
            label={t('admin.events.publishedLabel')}
            checked={values.is_published}
            onChange={(value) => set('is_published', value)}
            hint={t('admin.events.publishedHint')}
          />
          <CheckField
            id="e-featured"
            label={t('admin.events.featuredLabel')}
            checked={values.is_featured}
            onChange={(value) => set('is_featured', value)}
          />
          <CheckField
            id="e-archive"
            label={t('admin.events.archiveVisibleLabel')}
            checked={values.archive_visible}
            onChange={(value) => set('archive_visible', value)}
            hint={t('admin.events.archiveVisibleHint')}
          />
        </Section>

        <Section
          id="sec-dates"
          title={t('admin.events.section.dates')}
          hint={t('admin.events.datesHint')}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              id="e-start"
              type="datetime-local"
              label={f('starts_at')}
              value={values.starts_at}
              error={fieldError('starts_at')}
              onChange={(value) => set('starts_at', value)}
            />
            <TextField
              id="e-end"
              type="datetime-local"
              label={f('ends_at')}
              value={values.ends_at}
              error={fieldError('ends_at')}
              onChange={(value) => set('ends_at', value)}
            />
          </div>
          <CheckField
            id="e-showtime"
            label={t('admin.events.showTimeLabel')}
            checked={values.show_time}
            onChange={(value) => set('show_time', value)}
          />
          <CheckField
            id="e-multi"
            label={t('admin.events.multiDayLabel')}
            checked={values.is_multi_day}
            onChange={(value) => set('is_multi_day', value)}
          />

          <div>
            <p className="label">{t('admin.events.shiftTitle')}</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="e-shift" className="sr-only">
                  {t('admin.events.shiftDay')}
                </label>
                <input
                  id="e-shift"
                  type="date"
                  className="field min-h-11"
                  value={shiftDay}
                  onChange={(event) => setShiftDay(event.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn"
                disabled={shiftDay === ''}
                onClick={shift}
              >
                {t('admin.events.shift')}
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">
              {t('admin.events.shiftHint')}
            </p>
          </div>

          <div>
            <p className="label">{t('admin.events.moreDatesTitle')}</p>
            {values.dates.length === 0 && (
              <p className="mt-2 text-sm text-muted">
                {t('admin.events.noMoreDates')}
              </p>
            )}
            <ul className="m-0 mt-3 list-none space-y-6 p-0">
              {values.dates.map((date, index) => (
                <li
                  key={date.key}
                  data-date-row
                  className="space-y-4 border border-line p-4"
                >
                  <p className="label">
                    {t('admin.events.dateNumber', { number: index + 2 })}
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      id={`d-${date.key}-start`}
                      type="datetime-local"
                      label={f('starts_at')}
                      value={date.starts_at}
                      error={fieldError(`date:${date.key}`)}
                      onChange={(value) =>
                        changeDate(date.key, { starts_at: value })
                      }
                    />
                    <TextField
                      id={`d-${date.key}-end`}
                      type="datetime-local"
                      label={f('ends_at')}
                      value={date.ends_at}
                      onChange={(value) =>
                        changeDate(date.key, { ends_at: value })
                      }
                    />
                  </div>
                  <TextField
                    id={`d-${date.key}-note`}
                    label={f('note_de')}
                    value={date.note_de}
                    onChange={(value) =>
                      changeDate(date.key, { note_de: value })
                    }
                  />
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                    <CheckField
                      id={`d-${date.key}-cancelled`}
                      label={t('admin.events.dateCancelled')}
                      checked={date.is_cancelled}
                      onChange={(value) =>
                        changeDate(date.key, { is_cancelled: value })
                      }
                    />
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => removeDate(date.key)}
                    >
                      {t('admin.events.dateRemove')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              <button type="button" className="btn" onClick={addDate}>
                {t('admin.events.addDate')}
              </button>
            </p>
          </div>

          <div>
            <p className="label">{t('admin.events.repeatTitle')}</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="e-rule" className="label block">
                  {t('admin.events.repeatRule')}
                </label>
                <select
                  id="e-rule"
                  className="field min-h-11"
                  value={rule}
                  onChange={(event) =>
                    setRule(event.target.value as RecurrenceRule)
                  }
                >
                  {RULES.map((item) => (
                    <option key={item} value={item}>
                      {t(`admin.events.rule.${item}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <label htmlFor="e-repeat" className="label block">
                  {t('admin.events.repeatCount')}
                </label>
                <input
                  id="e-repeat"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={60}
                  className="field min-h-11"
                  value={repeat}
                  onChange={(event) => setRepeat(event.target.value)}
                />
              </div>
              <button type="button" className="btn" onClick={generate}>
                {t('admin.events.repeatCreate')}
              </button>
            </div>
            <p className="mt-1 text-sm text-muted">
              {t('admin.events.repeatHint')}
            </p>
          </div>
        </Section>

        <Section id="sec-place" title={t('admin.events.section.place')}>
          <TextField
            id="e-place"
            label={f('location_name')}
            value={values.location_name}
            error={fieldError('location_name')}
            onChange={(value) => set('location_name', value)}
          />
          <TextField
            id="e-address"
            label={f('location_address')}
            value={values.location_address}
            error={fieldError('location_address')}
            onChange={(value) => set('location_address', value)}
          />
          <TextField
            id="e-speaker"
            label={f('speaker_name')}
            value={values.speaker_name}
            error={fieldError('speaker_name')}
            onChange={(value) => set('speaker_name', value)}
          />
        </Section>

        <Section
          id="sec-places"
          title={t('admin.events.section.places')}
          hint={t('admin.events.visibilityHint')}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              id="e-capacity"
              inputMode="numeric"
              label={f('capacity')}
              value={values.capacity}
              error={fieldError('capacity')}
              onChange={(value) => set('capacity', value)}
            />
            <TextField
              id="e-available"
              inputMode="numeric"
              label={f('places_available')}
              value={values.places_available}
              error={fieldError('places_available')}
              onChange={(value) => set('places_available', value)}
            />
          </div>
          <TextField
            id="e-price"
            inputMode="decimal"
            label={f('price_eur')}
            value={values.price_eur}
            error={fieldError('price_eur')}
            onChange={(value) => set('price_eur', value)}
          />
          <CheckField
            id="e-onrequest"
            label={t('admin.events.priceOnRequestLabel')}
            checked={values.price_on_request}
            onChange={(value) => set('price_on_request', value)}
          />
          <TextField
            id="e-pricenote"
            label={f('price_note_de')}
            value={values.price_note_de}
            error={fieldError('price_note_de')}
            onChange={(value) => set('price_note_de', value)}
          />
          <div>
            <label htmlFor="e-regmode" className="label block">
              {f('registration_mode')}
            </label>
            <select
              id="e-regmode"
              className="field min-h-11"
              value={values.registration_mode}
              onChange={(event) =>
                set(
                  'registration_mode',
                  event.target.value as 'anfrage' | 'verbindlich',
                )
              }
            >
              <option value="anfrage">
                {t('admin.events.registrationMode.anfrage')}
              </option>
              <option value="verbindlich">
                {t('admin.events.registrationMode.verbindlich')}
              </option>
            </select>
            <p className="mt-1 text-sm text-muted">
              {t('admin.events.registrationModeHint')}
            </p>
          </div>
          <CheckField
            id="e-regopen"
            label={t('admin.events.registrationOpenLabel')}
            checked={values.registration_open}
            onChange={(value) => set('registration_open', value)}
          />
          <TextField
            id="e-deadline"
            type="datetime-local"
            label={f('registration_deadline')}
            value={values.registration_deadline}
            error={fieldError('registration_deadline')}
            onChange={(value) => set('registration_deadline', value)}
          />
        </Section>

        <Section id="sec-info" title={t('admin.events.section.info')}>
          <TextField
            id="e-audience"
            rows={3}
            label={f('audience_de')}
            value={values.audience_de}
            error={fieldError('audience_de')}
            onChange={(value) => set('audience_de', value)}
          />
          <TextField
            id="e-requirements"
            rows={3}
            label={f('requirements_de')}
            value={values.requirements_de}
            error={fieldError('requirements_de')}
            onChange={(value) => set('requirements_de', value)}
          />
          <TextField
            id="e-materials"
            rows={3}
            label={f('materials_de')}
            value={values.materials_de}
            error={fieldError('materials_de')}
            onChange={(value) => set('materials_de', value)}
          />
          <TextField
            id="e-included"
            rows={3}
            label={f('included_de')}
            value={values.included_de}
            error={fieldError('included_de')}
            onChange={(value) => set('included_de', value)}
          />
          <TextField
            id="e-contact-name"
            label={f('contact_name')}
            value={values.contact_name}
            error={fieldError('contact_name')}
            onChange={(value) => set('contact_name', value)}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              id="e-contact-email"
              type="email"
              label={f('contact_email')}
              value={values.contact_email}
              error={fieldError('contact_email')}
              onChange={(value) => set('contact_email', value)}
            />
            <TextField
              id="e-contact-phone"
              type="tel"
              label={f('contact_phone')}
              value={values.contact_phone}
              error={fieldError('contact_phone')}
              onChange={(value) => set('contact_phone', value)}
            />
          </div>
          <TextField
            id="e-url"
            type="url"
            label={f('external_url')}
            value={values.external_url}
            error={fieldError('external_url')}
            hint={t('admin.events.urlHint')}
            onChange={(value) => set('external_url', value)}
          />
        </Section>

        <Section
          id="sec-files"
          title={t('admin.events.section.files')}
          hint={t('admin.events.filesHint')}
        >
          <div>
            <p className="label">{t('admin.events.coverTitle')}</p>
            {record.image_url && (
              <>
                <img
                  src={record.image_thumb_url ?? record.image_url}
                  alt=""
                  className="mt-4 block max-h-48 max-w-full bg-line/30 object-contain"
                />
                <p className="mt-3">
                  <button
                    type="button"
                    className="btn-link"
                    disabled={imageBusy}
                    onClick={() => void dropImage()}
                  >
                    {t('admin.events.coverRemove')}
                  </button>
                </p>
              </>
            )}
            <Dropzone
              className="mt-4"
              label={t('admin.events.coverDrop')}
              chooseLabel={t('admin.events.coverChoose')}
              disabled={imageBusy}
              onFiles={(files) => void changeImage(files)}
            />
          </div>

          <div>
            <p className="label">{t('admin.events.photosTitle')}</p>
            {photos.length > 0 && (
              <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-4">
                {photos.map((photo) => (
                  <li key={photo.id} data-photo-id={photo.id}>
                    <img
                      src={photo.thumb_url ?? photo.image_url}
                      alt=""
                      loading="lazy"
                      className="block h-28 w-full bg-line/30 object-contain"
                    />
                    <button
                      type="button"
                      className="btn-link mt-2"
                      disabled={photoBusy}
                      onClick={() => void dropPhoto(photo)}
                    >
                      {t('admin.events.photoRemove')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Dropzone
              className="mt-4"
              multiple
              label={t('admin.events.photosDrop')}
              chooseLabel={t('admin.events.photosChoose')}
              disabled={photoBusy}
              onFiles={(files) => void addPhotos(files)}
            />
          </div>

          <div>
            <p className="label">{t('admin.events.pdfTitle')}</p>
            {record.pdf_url && (
              <p className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                <a
                  href={record.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-link"
                >
                  {t('admin.events.pdfOpen')}
                </a>
                <button
                  type="button"
                  className="btn-link"
                  disabled={pdfBusy}
                  onClick={() => void dropPdf()}
                >
                  {t('admin.events.pdfRemove')}
                </button>
              </p>
            )}
            <p className="mt-3">
              <button
                type="button"
                className="btn"
                disabled={pdfBusy}
                onClick={() => pdfInput.current?.click()}
              >
                {record.pdf_url
                  ? t('admin.events.pdfReplace')
                  : t('admin.events.pdfChoose')}
              </button>
            </p>
            <input
              ref={pdfInput}
              type="file"
              accept="application/pdf"
              className="sr-only"
              tabIndex={-1}
              aria-label={t('admin.events.pdfChoose')}
              onChange={(event) => {
                void changePdf(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            <div className="mt-4">
              <TextField
                id="e-pdflabel"
                label={f('pdf_label_de')}
                value={values.pdf_label_de}
                error={fieldError('pdf_label_de')}
                hint={t('admin.events.pdfLabelHint')}
                onChange={(value) => set('pdf_label_de', value)}
              />
            </div>
          </div>
        </Section>

        <Section
          id="sec-inquiries"
          title={t('admin.events.section.inquiries')}
          hint={t('admin.events.inquiriesHint')}
        >
          {initial.inquiries.length === 0 ? (
            <p className="text-muted">{t('admin.events.noInquiries')}</p>
          ) : (
            <ul className="m-0 list-none space-y-5 p-0" data-event-inquiries>
              {initial.inquiries.map((inquiry) => (
                <li key={inquiry.id} className="border-t border-line pt-4">
                  <p className="break-words">
                    {inquiry.name}
                    <span className="text-muted">
                      {' · '}
                      {inquiry.email}
                      {inquiry.phone ? ` · ${inquiry.phone}` : ''}
                    </span>
                  </p>
                  <p className="label mt-1">
                    {formatLongDate(inquiry.created_at)}
                    {inquiry.persons
                      ? ` · ${t('admin.events.inquiryPersons', { count: inquiry.persons })}`
                      : ''}
                    {inquiry.payload?.interest
                      ? ` · ${t('admin.events.inquiryInterest')}`
                      : ''}
                  </p>
                  {inquiry.message && (
                    <p className="mt-2 whitespace-pre-wrap">
                      {inquiry.message}
                    </p>
                  )}
                  <p className="mt-2">
                    <a
                      className="btn-link"
                      href={`mailto:${inquiry.email}?subject=${encodeURIComponent(
                        `Re: ${record.title_de}`,
                      )}`}
                    >
                      {t('admin.events.inquiryReply')}
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          id="sec-internal"
          title={t('admin.events.section.internal')}
          hint={t('admin.events.internalHint')}
        >
          <TextField
            id="e-internal"
            rows={4}
            label={f('internal_note')}
            value={values.internal_note}
            error={fieldError('internal_note')}
            onChange={(value) => set('internal_note', value)}
          />
        </Section>

        <div className="sticky bottom-0 border-t border-line bg-background py-4">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? t('admin.events.saving') : t('admin.events.save')}
          </button>
        </div>
      </form>

      {confirmDelete && (
        <ConfirmDialog
          title={t('admin.events.confirm.deleteTitle')}
          text={t('admin.events.confirm.deleteText', { title })}
          confirmLabel={t('admin.events.confirm.deleteConfirm')}
          cancelLabel={t('admin.events.confirm.cancel')}
          busy={deleting}
          onConfirm={() => void remove()}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </main>
  )
}

export default function EventEdit() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const load = useCallback(async (): Promise<Loaded> => {
    const [record, dates, photos, types, inquiries] = await Promise.all([
      getEvent(id),
      listEventDates(id),
      listEventPhotos(id),
      listEventTypes(),
      listEventInquiries(id),
    ])
    return { record, dates, photos, types, inquiries }
  }, [id])
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
        <p role="alert">{t('admin.events.error.notFound')}</p>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
        <p className="mt-6 flex gap-6">
          <button type="button" className="btn" onClick={reload}>
            {t('admin.retry')}
          </button>
          <Link to={routes.adminEvents} className="btn-link">
            {t('admin.events.back')}
          </Link>
        </p>
      </main>
    )
  }
  return <Editor key={state.data.record.id} initial={state.data} />
}
