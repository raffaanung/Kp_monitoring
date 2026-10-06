import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({
				pages: '../backend/spa',
				assets: '../backend/spa',
				fallback: 'index.html',
				precompress: false,
				strict: true
			}),
			paths: {
				base: process.env.NODE_ENV === 'production' ? '/edm-task-monitoring/backend/spa' : ''
			},
			alias: {
				'$lib': 'src/lib'
			}
		})
	],
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
});
