import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development, forward /api requests to the Express server so the
    // browser sees a single origin (same as production).
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        // Keep the browser's Host header. The API uses it to check that
        // the request's Origin matches the host it is serving.
        changeOrigin: false,
      },
    },
  },
})
