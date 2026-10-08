import { UploadError } from './uploadError'

/** Übersetzungsschlüssel unter admin.artworks.error.* für einen Fehler. */
export function errorKey(error: unknown): string {
  if (error instanceof UploadError) {
    if (
      error.code === 'type' ||
      error.code === 'size' ||
      error.code === 'decode'
    )
      return error.code
    return 'upload'
  }
  return 'other'
}
