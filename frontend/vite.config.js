import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// npm run dev            → /
// npm run build          → XAMPP /edm-task-monitoring/backend/spa/
// npm run build:openshift → /backend/spa/  (isi repo ada di document root image)
const openshift = process.env.npm_lifecycle_event === 'build:openshift'
if (openshift) {
  process.env.VITE_BASE ||= '/backend/spa/'
  if (process.env.VITE_API_BASE === undefined) process.env.VITE_API_BASE = '/backend'
}

export default defineConfig(({ command }) => ({
  plugins: [svelte()],
  base: command === 'serve' ? '/' : (process.env.VITE_BASE || '/edm-task-monitoring/backend/spa/'),
  build: {
    outDir: '../backend/spa',
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    open: '/',
    proxy: {
      '/edm-task-monitoring/backend/api': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
}))
