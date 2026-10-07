import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import ArtworkCard from '../components/ArtworkCard'
import Button from '../components/Button'
import Lightbox from '../components/Lightbox'
import SectionLabel from '../components/SectionLabel'
import Timeline from '../components/Timeline'
import { artworks, vitaEntries } from '../data'
import Reveal from '../components/Reveal'

const colors = [
  { name: '--background', value: '#F7F6F2', cls: 'bg-background' },
  { name: '--foreground', value: '#141414', cls: 'bg-foreground' },
  { name: '--muted', value: '#6B6B66', cls: 'bg-muted' },
  { name: '--line', value: '#D9D7D0', cls: 'bg-line' },
]

export default function DesignSystem() {
  const { t } = useTranslation()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const lightboxImages = artworks.map((a) => ({
    src: a.mainImageUrl,
    alt: `${a.titleDe}, ${a.year}`,
    width: a.imageWidth,
    height: a.imageHeight,
  }))
  return (
    <main className="container-page py-16 md:py-24">
      <p className="label">{t('designSystem.label')}</p>
      <h1 className="mt-6">{t('designSystem.title')}</h1>
      <p className="prose-measure mt-8">{t('designSystem.intro')}</p>

      <section className="mt-24" aria-labelledby="ds-colors">
        <h2 id="ds-colors" className="label">
          {t('designSystem.colors')}
        </h2>
        <hr className="rule mt-4" />
        <ul className="grid-12 mt-8 gap-y-6">
          {colors.map((c) => (
            <li key={c.name} className="col-span-2 md:col-span-3">
              <div className={`${c.cls} h-28 border border-line`} />
              <p className="label mt-3">{c.name}</p>
              <p>{c.value}</p>
            </li>
          ))}
        </ul>
        <p className="label mt-8">{t('designSystem.noAccent')}</p>
      </section>

      <section className="mt-24" aria-labelledby="ds-type">
        <h2 id="ds-type" className="label">
          {t('designSystem.type')}
        </h2>
        <hr className="rule mt-4" />
        <div className="mt-8 space-y-8">
          <h1>{t('designSystem.h1')}</h1>
          <h2>{t('designSystem.h2')}</h2>
          <h3>{t('designSystem.h3')}</h3>
          <p className="label">{t('designSystem.labelSample')}</p>
          <p className="prose-measure">{t('designSystem.body')}</p>
        </div>
      </section>

      <section className="mt-24" aria-labelledby="ds-grid">
        <h2 id="ds-grid" className="label">
          {t('designSystem.grid')}
        </h2>
        <hr className="rule mt-4" />
        <div className="grid-12 mt-8">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="col-span-1 border border-line py-6 text-center text-muted"
            >
              {i + 1}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24" aria-labelledby="ds-buttons">
        <h2 id="ds-buttons" className="label">
          {t('designSystem.buttons')}
        </h2>
        <hr className="rule mt-4" />
        <div className="mt-8 flex flex-wrap items-center gap-8">
          <Button>{t('designSystem.button')}</Button>
          <Button variant="link">{t('designSystem.buttonLink')}</Button>
        </div>
      </section>

      <section className="mt-24" aria-labelledby="ds-motion">
        <h2 id="ds-motion" className="label">
          {t('designSystem.motion')}
        </h2>
        <hr className="rule mt-4" />
        <div className="mt-[60vh] pb-[40vh]">
          <Reveal>
            <h3>{t('designSystem.revealHint')}</h3>
          </Reveal>
        </div>
      </section>

      <section className="mt-24" aria-labelledby="ds-components">
        <h2 id="ds-components" className="label">
          {t('designSystem.components')}
        </h2>
        <hr className="rule mt-4" />
        <SectionLabel number={1} className="mt-8">
          {t('designSystem.sectionLabelSample')}
        </SectionLabel>
        <h3 className="label mt-12">{t('designSystem.cardsTitle')}</h3>
        <div className="grid-12 mt-6 gap-y-10">
          <ArtworkCard
            artwork={artworks[2]}
            className="col-span-2 md:col-span-4"
          />
          <ArtworkCard
            artwork={artworks[3]}
            className="col-span-2 md:col-span-3"
          />
          <ArtworkCard
            artwork={artworks[7]}
            className="col-span-4 md:col-span-3"
          />
          <ArtworkCard
            artwork={artworks[0]}
            className="col-span-4 md:col-span-12"
          />
        </div>
        <h3 className="label mt-16">{t('designSystem.timelineTitle')}</h3>
        <div className="mt-6">
          <Timeline entries={vitaEntries.slice(0, 6)} />
        </div>
        <h3 className="label mt-16">{t('designSystem.lightboxTitle')}</h3>
        <div className="mt-6">
          <Button onClick={() => setLightboxIndex(0)}>
            {t('designSystem.openLightbox')}
          </Button>
        </div>
      </section>
      {lightboxIndex !== null && (
        <Lightbox
          images={lightboxImages}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </main>
  )
}
