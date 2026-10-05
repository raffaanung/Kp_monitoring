import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  plugins: [svelte()],
  // Dev: root `/` supaya preview Vite sederhana.
  // Build: path XAMPP/CI3 untuk serve dari backend/spa.
  base: command === 'serve' ? '/' : '/edm-task-monitoring/backend/spa/',
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
