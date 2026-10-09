// Erzeugt das Werkblatt als PDF (nur im Browser, wird erst beim Klick geladen).
// Layout im Stil der Website: Galeriepapier, viel Weißraum, Name als Schriftzug, feine Linien,
// Beschriftungen in Großbuchstaben. Es wird die Standardschrift Helvetica verwendet.
import { PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib'
import { wrapText, type Datasheet } from './datasheet'

export type DatasheetPdfOptions = {
  /** Bildadresse des Werks (WebP, JPEG, PNG oder SVG). Ohne Bild entfällt die Abbildung. */
  imageUrl: string | null
  /** Kopfzeile, z. B. „Werkblatt“ oder „Werkblatt (intern)“ */
  heading: string
  siteName: string
  /** Fußzeile: Anschrift und Kontakt, je eine Zeile */
  footerLines: string[]
}

const PAGE = { width: 595.28, height: 841.89 }
const MARGIN = 56
const INK = rgb(0.078, 0.078, 0.078)
const MUTED = rgb(0.42, 0.42, 0.4)
const LINE = rgb(0.85, 0.84, 0.82)
const PAPER = rgb(0.969, 0.965, 0.949)

/** Lässt Zeichen weg, die die Standardschrift nicht darstellen kann (sonst bricht das Erzeugen ab). */
function safe(font: PDFFont, text: string): string {
  let out = ''
  for (const char of text.replace(/ /g, ' ')) {
    try {
      font.encodeText(char)
      out += char
    } catch {
      out += '?'
    }
  }
  return out
}

async function imageAsJpeg(
  url: string,
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    try {
      const image = new Image()
      image.decoding = 'async'
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Bild nicht lesbar'))
        image.src = objectUrl
      })
      const longest = Math.max(image.naturalWidth, image.naturalHeight)
      if (!longest) return null
      const scale = Math.min(1, 1600 / longest)
      const width = Math.max(1, Math.round(image.naturalWidth * scale))
      const height = Math.max(1, Math.round(image.naturalHeight * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) return null
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)
      const jpeg = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.9),
      )
      if (!jpeg) return null
      return { bytes: new Uint8Array(await jpeg.arrayBuffer()), width, height }
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  } catch {
    return null
  }
}

export async function createDatasheetPdf(
  sheet: Datasheet,
  options: DatasheetPdfOptions,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`${sheet.title} · ${options.heading}`)
  pdf.setAuthor(options.siteName)
  pdf.setCreator(options.siteName)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const contentWidth = PAGE.width - MARGIN * 2

  let page = pdf.addPage([PAGE.width, PAGE.height])
  const paper = () =>
    page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE.width,
      height: PAGE.height,
      color: PAPER,
    })
  paper()

  // pdf-lib kennt keine Buchstabenabstände: bei Abstand wird Zeichen für Zeichen gesetzt
  const text = (
    value: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont,
    color = INK,
    spacing = 0,
  ) => {
    const clean = safe(font, value)
    if (!spacing) {
      page.drawText(clean, { x, y, size, font, color })
      return
    }
    let cursor = x
    for (const char of clean) {
      page.drawText(char, { x: cursor, y, size, font, color })
      cursor += font.widthOfTextAtSize(char, size) + spacing
    }
  }
  const rule = (y: number) =>
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE.width - MARGIN, y },
      thickness: 0.5,
      color: LINE,
    })

  // Kopf: Name als Schriftzug, rechts die Art des Blatts
  let y = PAGE.height - MARGIN
  text(options.siteName.toUpperCase(), MARGIN, y - 8, 8.5, regular, INK, 1.6)
  const heading = options.heading.toUpperCase()
  const headingWidth =
    regular.widthOfTextAtSize(safe(regular, heading), 8.5) +
    heading.length * 1.6
  text(
    heading,
    PAGE.width - MARGIN - headingWidth,
    y - 8,
    8.5,
    regular,
    MUTED,
    1.6,
  )
  y -= 22
  rule(y)
  y -= 28

  // Abbildung
  const footerReserve = 72
  const image = options.imageUrl ? await imageAsJpeg(options.imageUrl) : null
  if (image) {
    const embedded = await pdf.embedJpg(image.bytes)
    const maxHeight = 300
    const scale = Math.min(contentWidth / image.width, maxHeight / image.height)
    const width = image.width * scale
    const height = image.height * scale
    page.drawImage(embedded, { x: MARGIN, y: y - height, width, height })
    y -= height + 30
  }

  // Titel
  const titleLines = wrapText(sheet.title, contentWidth, (v) =>
    regular.widthOfTextAtSize(safe(regular, v), 24),
  )
  for (const line of titleLines) {
    text(line, MARGIN, y - 20, 24, regular)
    y -= 30
  }
  y -= 14

  const ensure = (needed: number) => {
    if (y - needed >= MARGIN + footerReserve) return
    page = pdf.addPage([PAGE.width, PAGE.height])
    paper()
    y = PAGE.height - MARGIN
  }

  // Angaben: Beschriftung links, Wert rechts, durch feine Linien getrennt
  const labelWidth = 120
  for (const [label, value] of sheet.rows) {
    const lines = wrapText(value, contentWidth - labelWidth, (v) =>
      regular.widthOfTextAtSize(safe(regular, v), 11),
    )
    ensure(lines.length * 15 + 18)
    rule(y)
    text(label.toUpperCase(), MARGIN, y - 17, 7.5, regular, MUTED, 1.2)
    lines.forEach((line, index) =>
      text(line, MARGIN + labelWidth, y - 17 - index * 15, 11, regular),
    )
    y -= lines.length * 15 + 14
  }
  if (sheet.rows.length > 0) {
    rule(y)
    y -= 26
  }

  // Beschreibung
  if (sheet.description) {
    const lines = wrapText(sheet.description, contentWidth, (v) =>
      regular.widthOfTextAtSize(safe(regular, v), 11),
    )
    for (const line of lines) {
      ensure(18)
      if (line) text(line, MARGIN, y - 12, 11, regular)
      y -= 17
    }
  }

  // Fußzeile auf jeder Seite
  const pages = pdf.getPages()
  pages.forEach((current, index) => {
    page = current
    rule(MARGIN + 44)
    options.footerLines.forEach((line, row) =>
      text(line, MARGIN, MARGIN + 28 - row * 12, 8.5, regular, MUTED),
    )
    if (pages.length > 1) {
      const label = `${index + 1} / ${pages.length}`
      text(
        label,
        PAGE.width - MARGIN - regular.widthOfTextAtSize(label, 8.5),
        MARGIN + 28,
        8.5,
        regular,
        MUTED,
      )
    }
  })
  return pdf.save()
}

/** Startet den Download der Datei im Browser. */
export function downloadPdf(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
