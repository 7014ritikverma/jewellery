import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  cacheDir: `.vite-cache/dev-${process.pid}`,
  plugins: [react(), tailwindcss()],
  build: {
    // Some Windows processes can keep old hashed assets locked and make
    // Vite's pre-build cleanup fail with EPERM. New builds still write a
    // fresh index.html that references only the newly generated assets.
    emptyOutDir: false,
  },
})
