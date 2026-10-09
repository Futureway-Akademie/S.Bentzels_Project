// CSV-Export (reine Funktionen, ohne Imports). Format für deutsches Excel: Trennzeichen Semikolon,
// Zeilenende CRLF, mit BOM, damit Umlaute richtig erscheinen. Zellen, die wie Formeln beginnen,
// werden entschärft, damit eine Eingabe wie „=1+1“ nicht in der Tabelle ausgeführt wird.

export type CsvColumn<T> = {
  header: string
  value: (row: T) => string | number | null | undefined
}

const DANGEROUS = /^[=+\-@\t\r]/

export function csvCell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? '' : String(value)
  if (DANGEROUS.test(text)) text = `'${text}`
  if (/[";\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`
  return text
}

export function toCsv<T>(
  rows: readonly T[],
  columns: readonly CsvColumn<T>[],
): string {
  const lines = [
    columns.map((column) => csvCell(column.header)).join(';'),
    ...rows.map((row) =>
      columns.map((column) => csvCell(column.value(row))).join(';'),
    ),
  ]
  return `﻿${lines.join('\r\n')}\r\n`
}

/** Dateiname mit Datum, z. B. eingaenge-2026-10-08.csv. */
export function csvFilename(base: string, now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${base}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`
}
