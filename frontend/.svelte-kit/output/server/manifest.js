export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	app_dir: "_app",
	app_path: "edm-task-monitoring/backend/spa/_app",
	assets: new Set([]),
	mime_types: {},
	client: {start:"_app/immutable/entry/start.PtWOI6Cf.js",app:"_app/immutable/entry/app.DpsR67sk.js",imports:["_app/immutable/entry/start.PtWOI6Cf.js","_app/immutable/entry/payload.DSmR2FwN.js","_app/immutable/chunks/HclGiUj8.js","_app/immutable/chunks/BMAeIK6Y.js","_app/immutable/chunks/CYDAgS3j.js","_app/immutable/chunks/D2gS26ps.js","_app/immutable/chunks/qXOS5JqA.js","_app/immutable/entry/app.DpsR67sk.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
	
	nodes: [
		__memo(() => import('./nodes/0.js')),
		__memo(() => import('./nodes/1.js')),
		__memo(() => import('./nodes/2.js')),
		__memo(() => import('./nodes/3.js')),
		__memo(() => import('./nodes/4.js')),
		__memo(() => import('./nodes/5.js')),
		__memo(() => import('./nodes/6.js')),
		__memo(() => import('./nodes/7.js')),
		__memo(() => import('./nodes/8.js')),
		__memo(() => import('./nodes/9.js')),
		__memo(() => import('./nodes/10.js')),
		__memo(() => import('./nodes/11.js')),
		__memo(() => import('./nodes/12.js')),
		__memo(() => import('./nodes/13.js')),
		__memo(() => import('./nodes/14.js')),
		__memo(() => import('./nodes/15.js')),
		__memo(() => import('./nodes/16.js'))
	],
	remotes: {
		
	},
	routes: [
		{
			id: "/",
			pattern: /^\/$/,
			params: [],
			page: { layouts: [0,], errors: [1,], leaf: 2 },
			endpoint: null
		},
		{
			id: "/access/roles",
			pattern: /^\/access\/roles\/?$/,
			params: [],
			page: { layouts: [0,], errors: [1,], leaf: 3 },
			endpoint: null
		},
		{
			id: "/access/users",
			pattern: /^\/access\/users\/?$/,
			params: [],
			page: { layouts: [0,], errors: [1,], leaf: 4 },
			endpoint: null
		},
		{
			id: "/activity-log",
			pattern: /^\/activity-log\/?$/,
			params: [],
			page: { layouts: [0,], errors: [1,], leaf: 5 },
			endpoint: null
		},
		{
			id: "/activity-log/[id]",
			pattern: /^\/activity-log\/([^/]+?)\/?$/,
			params: [{"name":"id","optional":false,"rest":false,"chained":false}],
			page: { layouts: [0,], errors: [1,], leaf: 6 },
			endpoint: null
		},
		{
			id: "/login",
			pattern: /^\/login\/?$/,
			params: [],
			page: { layouts: [0,], errors: [1,], leaf: 7 },
			endpoint: null
		},
		{
			id: "/registry/list",
			pattern: /^\/registry\/list\/?$/,
			params: [],
			page: { layouts: [0,], errors: [1,], leaf: 9 },
			endpoint: null
		},
		{
			id: "/registry/[id]",
			pattern: /^\/registry\/([^/]+?)\/?$/,
			params: [{"name":"id","optional":false,"rest":false,"chained":false}],
			page: { layouts: [0,], errors: [1,], leaf: 8 },
			endpoint: null
		},
		{
			id: "/requirements/list",
			pattern: /^\/requirements\/list\/?$/,
			params: [],
			page: { layouts: [0,], errors: [1,], leaf: 11 },
			endpoint: null
		},
		{
			id: "/requirements/new",
			pattern: /^\/requirements\/new\/?$/,
			params: [],
			page: { layouts: [0,], errors: [1,], leaf: 12 },
			endpoint: null
		},
		{
			id: "/requirements/[id]",
			pattern: /^\/requirements\/([^/]+?)\/?$/,
			params: [{"name":"id","optional":false,"rest":false,"chained":false}],
			page: { layouts: [0,], errors: [1,], leaf: 10 },
			endpoint: null
		},
		{
			id: "/settings/profile",
			pattern: /^\/settings\/profile\/?$/,
			params: [],
			page: { layouts: [0,], errors: [1,], leaf: 13 },
			endpoint: null
		},
		{
			id: "/tasks/board",
			pattern: /^\/tasks\/board\/?$/,
			params: [],
			page: { layouts: [0,], errors: [1,], leaf: 15 },
			endpoint: null
		},
		{
			id: "/tasks/list",
			pattern: /^\/tasks\/list\/?$/,
			params: [],
			page: { layouts: [0,], errors: [1,], leaf: 16 },
			endpoint: null
		},
		{
			id: "/tasks/[id]",
			pattern: /^\/tasks\/([^/]+?)\/?$/,
			params: [{"name":"id","optional":false,"rest":false,"chained":false}],
			page: { layouts: [0,], errors: [1,], leaf: 14 },
			endpoint: null
		}
	],
	prerendered_routes: new Set([]),
	matchers: async () => {
		return {};
	},
	server_assets: {}
}
})();
