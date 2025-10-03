import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, '../'), // tell Vite to use repo root
  build: {
    outDir: 'dist',
  },
})
