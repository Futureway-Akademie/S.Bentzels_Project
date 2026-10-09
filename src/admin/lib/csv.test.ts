import assert from 'node:assert/strict'
import { test } from 'node:test'
import { csvCell, csvFilename, toCsv } from './csv.ts'

test('Zellen: Semikolon, Anführungszeichen und Zeilenumbrüche werden maskiert', () => {
  assert.equal(csvCell('einfach'), 'einfach')
  assert.equal(csvCell('a;b'), '"a;b"')
  assert.equal(csvCell('sie sagte "hi"'), '"sie sagte ""hi"""')
  assert.equal(csvCell('zwei\nZeilen'), '"zwei\nZeilen"')
  assert.equal(csvCell(null), '')
  assert.equal(csvCell(undefined), '')
  assert.equal(csvCell(3), '3')
  assert.equal(csvCell(0), '0')
})

test('Formeln werden entschärft', () => {
  assert.equal(csvCell('=1+1'), "'=1+1")
  assert.equal(csvCell('+49 171'), "'+49 171")
  assert.equal(csvCell('-1'), "'-1")
  assert.equal(csvCell('@summe'), "'@summe")
  assert.equal(csvCell('Anna-Maria'), 'Anna-Maria')
  assert.equal(csvCell('=HYPERLINK("x";"y")'), '"\'=HYPERLINK(""x"";""y"")"')
})

test('Tabelle mit BOM, Kopfzeile und CRLF', () => {
  const csv = toCsv(
    [
      { name: 'Anna', persons: 2 },
      { name: 'Bernd; Co', persons: null },
    ],
    [
      { header: 'Name', value: (r) => r.name },
      { header: 'Personen', value: (r) => r.persons },
    ],
  )
  assert.equal(csv, '﻿Name;Personen\r\nAnna;2\r\n"Bernd; Co";\r\n')
  assert.equal(toCsv([], [{ header: 'A', value: () => '' }]), '﻿A\r\n')
})

test('Dateiname mit Datum', () => {
  assert.equal(
    csvFilename('eingaenge', new Date(2026, 9, 8)),
    'eingaenge-2026-10-08.csv',
  )
  assert.equal(
    csvFilename('gaesteliste', new Date(2027, 0, 5)),
    'gaesteliste-2027-01-05.csv',
  )
})
