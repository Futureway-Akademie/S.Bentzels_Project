import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  hasFilters,
  type EventFilters as Filters,
} from '../../lib/eventCalendar'
import { formatMonthKey } from '../../lib/format'
import type { EventType } from '../../lib/publicEvents'

type Props = {
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  types: EventType[]
  months: string[]
  places: string[]
  speakers: string[]
  /** In der Monatsansicht wählt die Monatsnavigation den Monat */
  showMonth: boolean
}

function Select({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="label block">
        {label}
      </label>
      <select
        id={id}
        className="field min-h-11"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </div>
  )
}

// Dezente Filter, standardmäßig eingeklappt. Sie öffnen sich, solange ein Filter aktiv ist.
export default function EventFilters({
  filters,
  onChange,
  types,
  months,
  places,
  speakers,
  showMonth,
}: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(hasFilters(filters))
  const set = (patch: Partial<Filters>) => onChange(patch)
  const active = hasFilters(filters)

  return (
    <details
      className="mt-8 border-y border-line py-4"
      open={open || active}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="label cursor-pointer select-none py-2">
        {t('events.filter.title')}
        {active && ` (${t('events.filter.active')})`}
      </summary>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {types.length > 1 && (
          <Select
            id="f-type"
            label={t('events.filter.type')}
            value={filters.typeId}
            onChange={(typeId) => set({ typeId })}
          >
            <option value="">{t('events.filter.all')}</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.nameDe}
              </option>
            ))}
          </Select>
        )}
        {showMonth && months.length > 0 && (
          <Select
            id="f-month"
            label={t('events.filter.month')}
            value={filters.month}
            onChange={(month) => set({ month })}
          >
            <option value="">{t('events.filter.all')}</option>
            {months.map((key) => (
              <option key={key} value={key}>
                {formatMonthKey(key)}
              </option>
            ))}
          </Select>
        )}
        {places.length > 0 && (
          <Select
            id="f-place"
            label={t('events.filter.place')}
            value={filters.place}
            onChange={(place) => set({ place })}
          >
            <option value="">{t('events.filter.all')}</option>
            {places.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </Select>
        )}
        {speakers.length > 0 && (
          <Select
            id="f-speaker"
            label={t('events.filter.speaker')}
            value={filters.speaker}
            onChange={(speaker) => set({ speaker })}
          >
            <option value="">{t('events.filter.all')}</option>
            {speakers.map((speaker) => (
              <option key={speaker} value={speaker}>
                {speaker}
              </option>
            ))}
          </Select>
        )}
        <Select
          id="f-availability"
          label={t('events.filter.availability')}
          value={filters.availability}
          onChange={(value) =>
            set({ availability: value as Filters['availability'] })
          }
        >
          <option value="">{t('events.filter.all')}</option>
          <option value="open">{t('events.filter.open')}</option>
          <option value="full">{t('events.filter.full')}</option>
        </Select>
      </div>
      {active && (
        <p className="mt-6">
          <button
            type="button"
            className="btn-link"
            onClick={() =>
              onChange({
                typeId: '',
                month: '',
                place: '',
                speaker: '',
                availability: '',
              })
            }
          >
            {t('events.filter.reset')}
          </button>
        </p>
      )}
    </details>
  )
}
