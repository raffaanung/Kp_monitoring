import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import net from 'net';

let activeBackendPort = 8088;
const candidatePorts = [8088, 8089, 8090, 8091, 8092, 8093, 8094, 8095, 8080];

function probePort(port) {
	return new Promise((resolve) => {
		// Test IPv6 ::1 first (macOS default), then 127.0.0.1
		const s = net.connect({ port, host: '::1' }, () => {
			s.destroy();
			resolve(true);
		});
		s.on('error', () => {
			const s4 = net.connect({ port, host: '127.0.0.1' }, () => {
				s4.destroy();
				resolve(true);
			});
			s4.on('error', () => resolve(false));
			s4.setTimeout(150, () => { s4.destroy(); resolve(false); });
		});
		s.setTimeout(150, () => { s.destroy(); resolve(false); });
	});
}

async function refreshBackendPort() {
	for (const p of candidatePorts) {
		if (await probePort(p)) {
			activeBackendPort = p;
			return;
		}
	}
}

refreshBackendPort();
setInterval(refreshBackendPort, 2000);

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({
				pages: '../backend/spa',
				assets: '../backend/spa',
				fallback: 'index.html',
				precompress: false,
				strict: false
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
			'/edm_task/backend/api': {
				target: 'http://localhost:8088',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/edm_task\/backend/, ''),
				configure: (proxy) => {
					const origWeb = proxy.web.bind(proxy);
					proxy.web = (req, res, options, ...rest) => {
						return origWeb(
							req,
							res,
							{
								...options,
								target: `http://localhost:${activeBackendPort}`
							},
							...rest
						);
					};
					if (proxy.ws) {
						const origWs = proxy.ws.bind(proxy);
						proxy.ws = (req, socket, head, options, ...rest) => {
							return origWs(
								req,
								socket,
								head,
								{
									...options,
									target: `ws://localhost:${activeBackendPort}`
								},
								...rest
							);
						};
					}
				}
			},
		},
	},
});
