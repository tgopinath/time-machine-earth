/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5395, strictPort: true },
  build: {
    // MapLibre (~1 MB) gets its own chunk and is not preloaded from the HTML, so the
    // app shell downloads first; the map chunk is requested as soon as the shell runs.
    modulePreload: {
      resolveDependencies: (_file, deps, { hostType }) => (hostType === 'html' ? deps.filter((d) => !/maplibre|territory-index/.test(d)) : deps),
    },
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'maplibre', test: /node_modules[\\/]maplibre-gl/, priority: 3 },
            // shared app code + small libraries stay out of the map chunk, so the shell never waits for MapLibre
            { name: 'core', test: /src[\\/](lib|data|store)[\\/](?!generated[\\/]territory-index)|node_modules[\\/](?!maplibre-gl)/, priority: 1 },
          ],
        },
      },
    },
  },
  test: { environment: 'node', include: ['src/tests/**/*.test.ts'] },
})
