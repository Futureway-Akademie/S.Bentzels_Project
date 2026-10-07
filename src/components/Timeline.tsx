import type { VitaEntry } from '../data'

type TimelineProps = {
  entries: VitaEntry[]
}

// Typografische Zeitleiste: Jahr links, Eintrag rechts.
export default function Timeline({ entries }: TimelineProps) {
  return (
    <ol className="m-0 list-none p-0">
      {entries.map((entry) => (
        <li key={entry.id} className="grid-12 border-t border-line py-4">
          <span className="col-span-1 text-muted md:col-span-2">
            {entry.year}
            {entry.yearEnd ? `–${entry.yearEnd}` : ''}
          </span>
          <span className="col-span-3 md:col-span-10">
            {entry.titleDe}
            {entry.place && <span className="text-muted">, {entry.place}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}
