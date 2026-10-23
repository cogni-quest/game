import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // On GitHub Pages the site lives under /game/, beside /quest/ and
  // /magic-shop/ on one origin — which is what lets them share the coins.
  base: process.env['BASE_PATH'] ?? '/',
})
