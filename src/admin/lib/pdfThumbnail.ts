import { encodeCanvasAsThumb, type EncodedImage } from './images'
import { THUMB_MAX_EDGE } from './imageMath'
import { UploadError } from './uploadError'

/** Rendert die erste Seite einer PDF-Datei als Vorschaubild (WebP, höchstens 800 px). */
export async function pdfFirstPageThumbnail(file: File): Promise<EncodedImage> {
  // Wird erst bei Bedarf geladen, die Bibliothek ist groß. Das Skript des Arbeiters liegt lokal im Build.
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default

  const data = new Uint8Array(await file.arrayBuffer())
  const task = pdfjs.getDocument({ data })
  let document: Awaited<typeof task.promise>
  try {
    document = await task.promise
  } catch (cause) {
    throw new UploadError('decode', 'PDF konnte nicht gelesen werden', {
      cause,
    })
  }

  try {
    const page = await document.getPage(1)
    const base = page.getViewport({ scale: 1 })
    const scale = THUMB_MAX_EDGE / Math.max(base.width, base.height)
    const viewport = page.getViewport({ scale })

    const canvas = window.document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(viewport.width))
    canvas.height = Math.max(1, Math.round(viewport.height))
    const context = canvas.getContext('2d')
    if (!context) throw new UploadError('encode', 'Canvas nicht verfügbar')
    // PDF-Seiten haben oft keinen eigenen Hintergrund.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)

    await page.render({ canvas, canvasContext: context, viewport }).promise
    return await encodeCanvasAsThumb(canvas)
  } catch (cause) {
    if (cause instanceof UploadError) throw cause
    throw new UploadError(
      'decode',
      'Erste PDF-Seite konnte nicht dargestellt werden',
      { cause },
    )
  } finally {
    await task.destroy()
  }
}
