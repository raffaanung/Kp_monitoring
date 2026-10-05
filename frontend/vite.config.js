import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  plugins: [svelte()],
  // Dev: root `/` supaya preview Vite sederhana.
  // Build lokal: path XAMPP. Build image: VITE_BASE=/spa/
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
