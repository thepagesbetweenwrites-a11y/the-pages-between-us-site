import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three + R3F + postprocessing form one ~1.5 MB (460 KB gzip) WebGL bundle by design.
    chunkSizeWarningLimit: 1700,
  },
})
