// Titel, Beschreibung, Open Graph und strukturierte Daten je Seite (reiner Client, ohne Cookies).
import { useEffect } from 'react'
import { defaultShareImage, site } from '../config/site'

export type Seo = {
  title: string
  description?: string | null
  image?: string | null
  /** Seitentyp für Open Graph, Standard „website“ */
  type?: 'website' | 'article'
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
  noindex?: boolean
}

const MARK = 'data-seo'

function setMeta(attr: 'name' | 'property', key: string, value: string | null) {
  const selector = `meta[${attr}="${key}"][${MARK}]`
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!value) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.setAttribute(MARK, '')
    document.head.appendChild(el)
  }
  el.content = value
}

const toAbsolute = (path: string) =>
  /^https?:\/\//i.test(path)
    ? path
    : `${site.url}${path.startsWith('/') ? '' : '/'}${path}`

export const pageTitle = (title: string) =>
  title === site.name ? title : `${title} · ${site.name}`

export function applySeo(seo: Seo) {
  const title = pageTitle(seo.title)
  document.title = title
  const description = seo.description ?? null
  const rawImage =
    seo.image && !seo.image.startsWith('data:') ? seo.image : null
  const image = toAbsolute(rawImage ?? defaultShareImage)
  const url = `${site.url}${window.location.pathname}`
  setMeta('name', 'description', description)
  setMeta('name', 'robots', seo.noindex ? 'noindex, nofollow' : null)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:type', seo.type ?? 'website')
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:site_name', site.name)
  setMeta('property', 'og:locale', 'de_DE')
  // SVG-Platzhalter zeigen Netzwerke nicht an, daher nur echte Bilder als Vorschau
  setMeta('property', 'og:image', /\.svg(\?|$)/i.test(image) ? null : image)
  setMeta(
    'name',
    'twitter:card',
    /\.svg(\?|$)/i.test(image) ? 'summary' : 'summary_large_image',
  )
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)

  let link = document.head.querySelector<HTMLLinkElement>(
    `link[rel="canonical"][${MARK}]`,
  )
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    link.setAttribute(MARK, '')
    document.head.appendChild(link)
  }
  link.href = url

  document.head
    .querySelectorAll(`script[type="application/ld+json"][${MARK}]`)
    .forEach((el) => el.remove())
  const blocks = seo.jsonLd
    ? Array.isArray(seo.jsonLd)
      ? seo.jsonLd
      : [seo.jsonLd]
    : []
  for (const block of blocks) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute(MARK, '')
    // "<" maskieren, damit Inhalte das Skript nicht beenden können
    script.textContent = JSON.stringify(block).replace(/</g, '\\u003c')
    document.head.appendChild(script)
  }
}

/** Setzt die Kopfdaten der Seite. Änderungen werden über den Inhalt (JSON) erkannt. */
export function useSeo(seo: Seo) {
  const key = JSON.stringify(seo)
  useEffect(() => {
    applySeo(JSON.parse(key) as Seo)
  }, [key])
}
