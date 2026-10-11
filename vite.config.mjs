import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  root,
  base: './',
  resolve: {
    alias: { '@shared': path.resolve(root, 'src/shared') }
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
})
