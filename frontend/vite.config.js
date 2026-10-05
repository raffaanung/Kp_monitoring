import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

const openshiftBuild = process.env.VITE_DEPLOY === 'openshift'

export default defineConfig(({ command }) => ({
  plugins: [svelte()],
  // Dev: root `/` supaya preview Vite sederhana.
  // Build lokal: path XAMPP. Build image: VITE_BASE=/spa/
  base: command === 'serve' ? '/' : (process.env.VITE_BASE || '/edm-task-monitoring/backend/spa/'),
  build: {
    outDir: '../backend/spa',
    emptyOutDir: true,
    // Pod build OpenShift sering SIGKILL saat minify bundle besar.
    minify: openshiftBuild ? false : 'esbuild',
    cssMinify: openshiftBuild ? false : 'lightningcss',
    reportCompressedSize: !openshiftBuild,
    chunkSizeWarningLimit: 2000,
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
