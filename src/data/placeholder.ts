// Neutrale graue Bildplatzhalter in passenden Proportionen (SVG als Data-URI) für feste
// Seitenbilder (Porträt, Titelbild), solange keine eigenen Bilder vorliegen.
export function placeholderImage(width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#d9d7d0"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
