import Image from '@tiptap/extension-image'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorKey } from '../lib/errors'
import { normalizeLinkUrl } from '../lib/linkUrl'

type UploadedImage = { url: string; width: number; height: number }

type RichTextEditorProps = {
  initialHtml: string
  onChange: (html: string) => void
  /** Ohne diese beiden Angaben gibt es keine Bilder im Editor (z. B. bei Rechtstexten). */
  onUploadImage?: (file: File) => Promise<UploadedImage>
  /** Wird aufgerufen, wenn ein hochgeladenes Bild doch nicht eingefügt wird. */
  onDiscardImage?: (url: string) => void
}

// Editor für Beiträge: Überschriften, Fett, Kursiv, Zitat, Listen, Links und Bilder.
// Erzeugt nur erlaubte Elemente; für die Anzeige wird der Text zusätzlich bereinigt.
export default function RichTextEditor({
  initialHtml,
  onChange,
  onUploadImage,
  onDiscardImage,
}: RichTextEditorProps) {
  const { t } = useTranslation()
  const fileInput = useRef<HTMLInputElement>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState(false)
  const [pending, setPending] = useState<UploadedImage | null>(null)
  const [alt, setAlt] = useState('')
  const [uploading, setUploading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          protocols: ['http', 'https', 'mailto', 'tel'],
          HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
        },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        horizontalRule: false,
      }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: 'post-content rte-area',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': t('admin.richtext.area'),
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  })

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      h2: current?.isActive('heading', { level: 2 }) ?? false,
      h3: current?.isActive('heading', { level: 3 }) ?? false,
      bold: current?.isActive('bold') ?? false,
      italic: current?.isActive('italic') ?? false,
      quote: current?.isActive('blockquote') ?? false,
      bullets: current?.isActive('bulletList') ?? false,
      numbers: current?.isActive('orderedList') ?? false,
      link: current?.isActive('link') ?? false,
      canUndo: current?.can().undo() ?? false,
      canRedo: current?.can().redo() ?? false,
    }),
  })

  if (!editor || !state) return null

  const run = () => editor.chain().focus()

  const openLink = () => {
    setLinkUrl((editor.getAttributes('link').href as string | undefined) ?? '')
    setLinkError(false)
    setLinkOpen(true)
  }

  const applyLink = () => {
    const href = normalizeLinkUrl(linkUrl)
    if (!href) {
      setLinkError(true)
      return
    }
    run().extendMarkRange('link').setLink({ href }).run()
    setLinkOpen(false)
  }

  const removeLink = () => {
    run().extendMarkRange('link').unsetLink().run()
    setLinkOpen(false)
  }

  const chooseImage = async (file: File | undefined) => {
    if (!file || !onUploadImage) return
    setUploading(true)
    setImageError(null)
    try {
      setPending(await onUploadImage(file))
      setAlt('')
    } catch (error) {
      setImageError(t(`admin.artworks.error.${errorKey(error)}`))
    } finally {
      setUploading(false)
    }
  }

  const insertImage = () => {
    if (!pending) return
    // Nach dem aktuellen Absatz einfügen, markierter Text bleibt erhalten
    const { selection, doc } = editor.state
    const position =
      selection.$to.depth >= 1 ? selection.$to.after(1) : doc.content.size
    run()
      .insertContentAt(position, {
        type: 'image',
        attrs: {
          src: pending.url,
          alt: alt.trim(),
          width: pending.width,
          height: pending.height,
        },
      })
      .run()
    setPending(null)
  }

  const cancelImage = () => {
    if (pending) onDiscardImage?.(pending.url)
    setPending(null)
  }

  const button = (
    label: string,
    active: boolean,
    onClick: () => void,
    disabled = false,
  ) => (
    <button
      type="button"
      className="rte-button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  )

  return (
    <div>
      <div
        role="toolbar"
        aria-label={t('admin.richtext.toolbar')}
        className="flex flex-wrap gap-2"
      >
        {button(t('admin.richtext.h2'), state.h2, () =>
          run().toggleHeading({ level: 2 }).run(),
        )}
        {button(t('admin.richtext.h3'), state.h3, () =>
          run().toggleHeading({ level: 3 }).run(),
        )}
        {button(t('admin.richtext.bold'), state.bold, () =>
          run().toggleBold().run(),
        )}
        {button(t('admin.richtext.italic'), state.italic, () =>
          run().toggleItalic().run(),
        )}
        {button(t('admin.richtext.quote'), state.quote, () =>
          run().toggleBlockquote().run(),
        )}
        {button(t('admin.richtext.bullets'), state.bullets, () =>
          run().toggleBulletList().run(),
        )}
        {button(t('admin.richtext.numbers'), state.numbers, () =>
          run().toggleOrderedList().run(),
        )}
        {button(t('admin.richtext.link'), state.link, openLink)}
        {onUploadImage && (
          <button
            type="button"
            className="rte-button"
            aria-pressed={false}
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            {t('admin.richtext.image')}
          </button>
        )}
        {button(
          t('admin.richtext.undo'),
          false,
          () => run().undo().run(),
          !state.canUndo,
        )}
        {button(
          t('admin.richtext.redo'),
          false,
          () => run().redo().run(),
          !state.canRedo,
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            void chooseImage(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>

      {linkOpen && (
        <div className="mt-3 border border-line p-4">
          <label htmlFor="rte-link" className="label block">
            {t('admin.richtext.linkLabel')}
          </label>
          <input
            id="rte-link"
            type="text"
            inputMode="url"
            className="field"
            value={linkUrl}
            aria-invalid={linkError}
            aria-describedby={linkError ? 'rte-link-error' : undefined}
            onChange={(event) => {
              setLinkUrl(event.target.value)
              setLinkError(false)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                applyLink()
              }
            }}
          />
          {linkError && (
            <p id="rte-link-error" role="alert" className="field-error">
              {t('admin.richtext.linkInvalid')}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            <button type="button" className="btn" onClick={applyLink}>
              {t('admin.richtext.linkApply')}
            </button>
            {state.link && (
              <button type="button" className="btn-link" onClick={removeLink}>
                {t('admin.richtext.linkRemove')}
              </button>
            )}
            <button
              type="button"
              className="btn-link"
              onClick={() => setLinkOpen(false)}
            >
              {t('admin.richtext.cancel')}
            </button>
          </div>
        </div>
      )}

      {(uploading || pending || imageError) && (
        <div className="mt-3 border border-line p-4" aria-live="polite">
          {uploading && (
            <p className="label">{t('admin.artworks.uploading')}</p>
          )}
          {imageError && (
            <p role="alert" className="field-error">
              {imageError}
            </p>
          )}
          {pending && (
            <>
              <img
                src={pending.url}
                alt=""
                className="max-h-40 max-w-full object-contain"
              />
              <label htmlFor="rte-alt" className="label mt-4 block">
                {t('admin.richtext.altLabel')}
              </label>
              <input
                id="rte-alt"
                type="text"
                className="field"
                value={alt}
                onChange={(event) => setAlt(event.target.value)}
              />
              <p className="mt-1 text-sm text-muted">
                {t('admin.richtext.altHint')}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                <button type="button" className="btn" onClick={insertImage}>
                  {t('admin.richtext.imageInsert')}
                </button>
                <button
                  type="button"
                  className="btn-link"
                  onClick={cancelImage}
                >
                  {t('admin.richtext.cancel')}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="rte-frame mt-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
