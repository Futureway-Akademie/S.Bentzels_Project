// Einfaches Blockformat für Platzhalterbeiträge: Absätze durch Leerzeilen getrennt,
// „[[bild]]“ steht für ein Bild im Text. In Phase 2 ersetzt der Rich-Text-Editor dieses Format.
export type PostBlock = { type: 'paragraph'; text: string } | { type: 'image' }

export function parsePostContent(content: string): PostBlock[] {
  return content
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part): PostBlock =>
      part === '[[bild]]'
        ? { type: 'image' }
        : { type: 'paragraph', text: part },
    )
}
