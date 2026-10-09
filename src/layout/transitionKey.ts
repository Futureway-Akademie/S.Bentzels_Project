// Wechsel zwischen Werken, Beiträgen und Veranstaltungen (z. B. Pfeiltasten in der Großansicht)
// bleibt innerhalb derselben Seite: kein Neuaufbau, damit die Großansicht geöffnet bleibt.
const DETAIL_SECTIONS = ['galerie', 'journal', 'veranstaltungen']
export function transitionKey(pathname: string): string {
  const first = pathname.split('/')[1] ?? ''
  return DETAIL_SECTIONS.includes(first) ? first : pathname
}
