import { appendFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// Ergänzt in der gebauten robots.txt die Adresse der Sitemap, sobald VITE_SITE_URL gesetzt ist.
function robotsSitemap(siteUrl: string): Plugin {
  return {
    name: 'robots-sitemap',
    apply: 'build',
    closeBundle() {
      const file = join('dist', 'robots.txt')
      if (siteUrl && existsSync(file))
        appendFileSync(
          file,
          `\nSitemap: ${siteUrl.replace(/\/+$/, '')}/sitemap.xml\n`,
        )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    robotsSitemap(loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL ?? ''),
  ],
  // Der lokale Ordnername enthält Doppelpunkte; Vites Dateizugriffsliste erkennt ihn sonst nicht (nur Dev-Server).
  server: { fs: { strict: false } },
}))
