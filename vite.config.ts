import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Der lokale Ordnername enthält Doppelpunkte; Vites Dateizugriffsliste erkennt ihn sonst nicht (nur Dev-Server).
  server: { fs: { strict: false } },
})
