// Rechnen mit Bildausschnitten in Anteilen (0 bis 1) von Breite und Höhe, ohne Imports.

export type Crop = { x: number; y: number; width: number; height: number }

export type AspectKey = 'free' | '1:1' | '4:3' | '3:4' | '3:2' | '2:3' | '16:9'

export const ASPECTS: Record<AspectKey, number | null> = {
  free: null,
  '1:1': 1,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
  '3:2': 3 / 2,
  '2:3': 2 / 3,
  '16:9': 16 / 9,
}

const MIN_SIZE = 0.05

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/** Hält den Ausschnitt innerhalb des Bildes und mindestens so groß wie ein Minimum. */
export function clampCrop(crop: Crop): Crop {
  const width = clamp(crop.width, MIN_SIZE, 1)
  const height = clamp(crop.height, MIN_SIZE, 1)
  return {
    x: clamp(crop.x, 0, 1 - width),
    y: clamp(crop.y, 0, 1 - height),
    width,
    height,
  }
}

/**
 * Größter zentrierter Ausschnitt mit dem gewünschten Seitenverhältnis (Breite durch Höhe)
 * für ein Bild mit den gegebenen Pixelmaßen.
 */
export function cropForAspect(
  imageWidth: number,
  imageHeight: number,
  aspect: number | null,
): Crop {
  if (aspect === null) return { x: 0, y: 0, width: 1, height: 1 }
  const imageAspect = imageWidth / imageHeight
  let width = 1
  let height = 1
  if (aspect > imageAspect) height = imageAspect / aspect
  else width = aspect / imageAspect
  return { x: (1 - width) / 2, y: (1 - height) / 2, width, height }
}

/** Verschiebt den Ausschnitt um einen Anteil, bleibt im Bild. */
export function moveCrop(crop: Crop, dx: number, dy: number): Crop {
  return clampCrop({
    ...crop,
    x: clamp(crop.x + dx, 0, 1 - crop.width),
    y: clamp(crop.y + dy, 0, 1 - crop.height),
  })
}

/**
 * Ändert die Größe an der unteren rechten Ecke. Mit festem Seitenverhältnis (Pixel-Breite durch
 * Pixel-Höhe) bleibt es erhalten, der Ausschnitt wächst nur so weit, wie das Bild reicht.
 */
export function resizeCrop(
  crop: Crop,
  dWidth: number,
  dHeight: number,
  imageWidth: number,
  imageHeight: number,
  aspect: number | null,
): Crop {
  if (aspect === null) {
    return clampCrop({
      ...crop,
      width: clamp(crop.width + dWidth, MIN_SIZE, 1 - crop.x),
      height: clamp(crop.height + dHeight, MIN_SIZE, 1 - crop.y),
    })
  }
  // Maßgeblich ist die größere Bewegung, in Pixeln gerechnet
  const pixelDelta =
    Math.abs(dWidth * imageWidth) >= Math.abs(dHeight * imageHeight * aspect)
      ? dWidth * imageWidth
      : dHeight * imageHeight * aspect
  let pixelWidth = crop.width * imageWidth + pixelDelta
  const maxWidth = Math.min(
    (1 - crop.x) * imageWidth,
    (1 - crop.y) * imageHeight * aspect,
  )
  const minWidth = MIN_SIZE * imageWidth
  pixelWidth = clamp(pixelWidth, minWidth, Math.max(minWidth, maxWidth))
  return {
    x: crop.x,
    y: crop.y,
    width: pixelWidth / imageWidth,
    height: pixelWidth / aspect / imageHeight,
  }
}

/** Ist der Ausschnitt (fast) das ganze Bild? Dann zählt er nicht als Ausschnitt. */
export function isFullCrop(crop: Crop): boolean {
  return (
    crop.x < 0.001 &&
    crop.y < 0.001 &&
    crop.width > 0.999 &&
    crop.height > 0.999
  )
}

/** Prüft einen aus der Datenbank gelesenen Wert. */
export function parseCrop(value: unknown): Crop | null {
  if (!value || typeof value !== 'object') return null
  const { x, y, width, height } = value as Record<string, unknown>
  if (
    [x, y, width, height].some(
      (n) => typeof n !== 'number' || !Number.isFinite(n),
    )
  )
    return null
  return clampCrop({
    x: x as number,
    y: y as number,
    width: width as number,
    height: height as number,
  })
}
