export type UploadErrorCode =
  | 'type' // Dateityp nicht erlaubt
  | 'size' // Datei zu groß
  | 'decode' // Datei lässt sich nicht lesen
  | 'encode' // Bild lässt sich nicht umwandeln
  | 'upload' // Hochladen fehlgeschlagen
  | 'delete' // Löschen fehlgeschlagen
  | 'config' // Supabase nicht eingerichtet

export class UploadError extends Error {
  readonly code: UploadErrorCode

  constructor(
    code: UploadErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options)
    this.name = 'UploadError'
    this.code = code
  }
}
