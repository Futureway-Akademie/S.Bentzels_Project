import DOMPurify from 'dompurify'

// Erlaubt nur das, was der Editor erzeugt. Alles andere (Skripte, Ereignis-Attribute,
// fremde Tags, data:-Adressen) wird entfernt. Wird für Vorschau und später für die öffentliche
// Seite verwendet, damit gespeicherter Text nie Code ausführen kann.
const ALLOWED_TAGS = [
  'p',
  'br',
  'h2',
  'h3',
  'strong',
  'em',
  'u',
  'a',
  'blockquote',
  'ul',
  'ol',
  'li',
  'img',
]
const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'width', 'height']

let hooked = false

export function sanitizeHtml(html: string): string {
  if (!hooked) {
    // Verweise in neuem Tab immer mit rel="noopener noreferrer"
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A' && node.getAttribute('target')) {
        node.setAttribute('rel', 'noopener noreferrer')
      }
      // Bilder nur von normalen Webadressen, keine eingebetteten data:-Bilder oder lokalen Pfade
      if (
        node.tagName === 'IMG' &&
        !/^https?:\/\//i.test(node.getAttribute('src') ?? '')
      ) {
        node.remove()
      }
    })
    hooked = true
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:)/i,
    // Diese Attribute enthalten keine Adressen und dürfen beliebige harmlose Werte tragen
    ADD_URI_SAFE_ATTR: ['width', 'height', 'target', 'rel'],
  })
}
