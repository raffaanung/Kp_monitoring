import "./server.js";
//#region src/lib/requirementStore.svelte.js
var STORAGE_KEY = "edm-fe-requirements-v3";
function nowStamp() {
	const d = /* @__PURE__ */ new Date();
	const pad = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}
/**
* @param {Partial<Requirement> & { id: number, dashboard: string, title: string }} raw
* @returns {Requirement}
*/
function normalizeRequirement(raw) {
	return {
		id: Number(raw.id),
		dashboard: raw.dashboard || "",
		title: raw.title || "",
		description: raw.description || "",
		status: raw.status || "open",
		health: raw.health || "on_track",
		due_date: raw.due_date || "",
		team: Array.isArray(raw.team) ? raw.team : [],
		created_by: raw.created_by || "PM",
		created_at: raw.created_at || nowStamp(),
		updated_at: raw.updated_at || nowStamp()
	};
}
/** @returns {Requirement[]} */
function seedRequirements() {
	return [
		normalizeRequirement({
			id: 1,
			dashboard: "GBO Dashboard",
			title: "SLA & throughput visibility",
			description: "Requirement untuk heatmap SLA regional dan chart throughput vs target.",
			status: "in_progress",
			health: "on_track",
			due_date: "2026-09-20",
			team: ["Farras Al-Risyad", "Panji Pujianto"],
			created_by: "Alamsyah Putra",
			created_at: "2026-08-20 09:00:00",
			updated_at: "2026-09-12 11:00:00"
		}),
		normalizeRequirement({
			id: 2,
			dashboard: "GBO Dashboard",
			title: "Escalation & export pack",
			description: "Drill-down eskalasi dan export PDF mingguan.",
			status: "open",
			health: "on_track",
			due_date: "2026-09-01",
			team: [],
			created_by: "Alamsyah Putra",
			created_at: "2026-09-01 10:00:00",
			updated_at: "2026-09-01 10:00:00"
		}),
		normalizeRequirement({
			id: 3,
			dashboard: "FinSight",
			title: "Invoice aging & FX exposure",
			description: "Filter aging bucket, vendor exposure, dan overlay FX rate.",
			status: "in_progress",
			health: "at_risk",
			due_date: "2026-09-18",
			team: ["Asep Wahyudi"],
			created_by: "Alamsyah Putra",
			created_at: "2026-08-15 08:00:00",
			updated_at: "2026-09-11 09:00:00"
		}),
		normalizeRequirement({
			id: 4,
			dashboard: "CX Dashboard",
			title: "CSAT & backlog health",
			description: "Trend CSAT per channel dan alert aging backlog.",
			status: "in_progress",
			health: "on_track",
			due_date: "2026-09-25",
			team: ["Panji Pujianto", "Farras Al-Risyad"],
			created_by: "Alamsyah Putra",
			created_at: "2026-08-01 11:00:00",
			updated_at: "2026-09-10 16:00:00"
		}),
		normalizeRequirement({
			id: 5,
			dashboard: "TRAXIS",
			title: "Delivery board intelligence",
			description: "Burn-up widget dan taxonomy blocker.",
			status: "open",
			health: "on_track",
			due_date: "2026-09-30",
			team: [],
			created_by: "Alamsyah Putra",
			created_at: "2026-09-05 12:00:00",
			updated_at: "2026-09-07 12:00:00"
		}),
		normalizeRequirement({
			id: 6,
			dashboard: "GARD",
			title: "Governance compliance pack",
			description: "Policy exception log dan audit trail export.",
			status: "done",
			health: "on_track",
			due_date: "2026-09-01",
			team: ["Maggie Arsyad"],
			created_by: "Alamsyah Putra",
			created_at: "2026-07-01 10:00:00",
			updated_at: "2026-09-01 16:00:00"
		})
	];
}
/** @returns {Requirement[]} */
function loadRequirements() {
	if (typeof localStorage === "undefined") return seedRequirements();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return seedRequirements();
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed) || parsed.length === 0) return seedRequirements();
		return parsed.map((row) => normalizeRequirement(row));
	} catch {
		return seedRequirements();
	}
}
var requirementStore = {
	/** @type {Requirement[]} */
	items: loadRequirements(),
	/** @type {number | null} */
	lastDetailId: null
};
function persist() {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(requirementStore.items));
}
/** @param {number} id */
function reqCode(id) {
	return `REQ-${String(Number(id)).padStart(3, "0")}`;
}
/** @param {number} id */
function getRequirement(id) {
	return requirementStore.items.find((r) => r.id === Number(id)) || null;
}
/**
* @param {{
*   dashboard?: string,
*   status?: string,
*   q?: string,
*   sort?: string,
* }} [filters]
*/
function listRequirements({ dashboard = "", status = "", q = "", sort = "updated_desc" } = {}) {
	requirementStore.items;
	let items = [...requirementStore.items];
	if (dashboard) items = items.filter((r) => r.dashboard === dashboard);
	if (status) items = items.filter((r) => r.status === status);
	if (q) {
		const needle = q.toLowerCase();
		items = items.filter((r) => `${reqCode(r.id)} ${r.title} ${r.description} ${r.dashboard} ${r.created_by} ${r.team.join(" ")}`.toLowerCase().includes(needle));
	}
	const statusRank = {
		open: 0,
		in_progress: 1,
		done: 2
	};
	items.sort((a, b) => {
		switch (sort) {
			case "updated_asc": return a.updated_at.localeCompare(b.updated_at);
			case "due_asc": return (a.due_date || "9999").localeCompare(b.due_date || "9999");
			case "title_asc": return a.title.localeCompare(b.title);
			case "title_desc": return b.title.localeCompare(a.title);
			case "dashboard_asc": return a.dashboard.localeCompare(b.dashboard) || a.title.localeCompare(b.title);
			case "status_asc": return (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
			default: return b.updated_at.localeCompare(a.updated_at);
		}
	});
	return items;
}
/** Dashboard names available for filter / form select */
function requirementDashboardOptions() {
	requirementStore.items;
	return [...new Set(requirementStore.items.map((r) => r.dashboard).filter(Boolean))].sort();
}
var requirementSortOptions = [
	{
		value: "updated_desc",
		label: "Updated terbaru"
	},
	{
		value: "updated_asc",
		label: "Updated terlama"
	},
	{
		value: "due_asc",
		label: "Due date terdekat"
	},
	{
		value: "title_asc",
		label: "Judul A–Z"
	},
	{
		value: "title_desc",
		label: "Judul Z–A"
	},
	{
		value: "dashboard_asc",
		label: "Dashboard A–Z"
	},
	{
		value: "status_asc",
		label: "Status"
	}
];
/**
* @param {number} id
* @param {Partial<Pick<Requirement, 'title' | 'description' | 'status' | 'health' | 'due_date' | 'team'>>} patch
*/
function updateRequirement(id, patch) {
	const item = getRequirement(id);
	if (!item) return false;
	if (patch.title !== void 0) item.title = patch.title.trim();
	if (patch.description !== void 0) item.description = patch.description.trim();
	if (patch.status !== void 0) item.status = patch.status;
	if (patch.health !== void 0) item.health = patch.health;
	if (patch.due_date !== void 0) item.due_date = patch.due_date;
	if (patch.team !== void 0) item.team = [...patch.team];
	item.updated_at = nowStamp();
	requirementStore.items = [...requirementStore.items];
	persist();
	return true;
}
/** @param {RequirementStatus | string} status */
function requirementStatusLabel(status) {
	switch (status) {
		case "open": return "Open";
		case "in_progress": return "In Progress";
		case "done": return "Done";
		default: return status;
	}
}
/** @param {RequirementHealth | string} health */
function requirementHealthLabel(health) {
	switch (health) {
		case "on_track": return "On Track";
		case "at_risk": return "At Risk";
		case "blocked": return "Blocked";
		default: return health;
	}
}
var requirementStatusOptions = [
	{
		value: "open",
		label: "Open"
	},
	{
		value: "in_progress",
		label: "In Progress"
	},
	{
		value: "done",
		label: "Done"
	}
];
/** Standarisasi status requirement + arti bisnis */
var requirementStatusCatalog = [
	{
		value: "open",
		label: "Open",
		summary: "Requirement baru / belum dikerjakan. Belum ada progress task yang aktif."
	},
	{
		value: "in_progress",
		label: "In Progress",
		summary: "Sedang dikerjakan. Ada task yang sudah dipecah dan berjalan di backlog/board."
	},
	{
		value: "done",
		label: "Done",
		summary: "Requirement selesai. Seluruh scope dianggap complete / diterima."
	}
];
/** Standarisasi health requirement + arti bisnis */
var requirementHealthCatalog = [
	{
		value: "on_track",
		label: "On Track",
		summary: "Jalur sehat. Progress & deadline masih terkendali."
	},
	{
		value: "at_risk",
		label: "At Risk",
		summary: "Berisiko telat / scope bergeser. Perlu perhatian PM."
	},
	{
		value: "blocked",
		label: "Blocked",
		summary: "Terhambat dependency / approval. Tidak bisa lanjut tanpa keputusan."
	}
];
/**
* Ringkasan jumlah per status (opsional filter dashboard).
* @param {string} [dashboard]
*/
function requirementStatusSummary(dashboard = "") {
	requirementStore.items;
	const base = dashboard ? requirementStore.items.filter((r) => r.dashboard === dashboard) : requirementStore.items;
	return requirementStatusCatalog.map((row) => ({
		...row,
		count: base.filter((r) => r.status === row.value).length
	}));
}
/**
* Ringkasan jumlah per health (opsional filter dashboard).
* @param {string} [dashboard]
*/
function requirementHealthSummary(dashboard = "") {
	requirementStore.items;
	const base = dashboard ? requirementStore.items.filter((r) => r.dashboard === dashboard) : requirementStore.items;
	return requirementHealthCatalog.map((row) => ({
		...row,
		count: base.filter((r) => r.health === row.value).length
	}));
}
/** Seed roster for team picker (mockup) */
var requirementTeamRoster = [
	{
		name: "Asep Wahyudi",
		role: "Teknis",
		presence: "online"
	},
	{
		name: "Panji Pujianto",
		role: "Teknis",
		presence: "online"
	},
	{
		name: "Maggie Arsyad",
		role: "Teknis",
		presence: "away"
	},
	{
		name: "Farras Al-Risyad",
		role: "Teknis",
		presence: "online"
	},
	{
		name: "Lifi",
		role: "Teknis",
		presence: "online"
	},
	{
		name: "Mahdi",
		role: "Teknis",
		presence: "online"
	},
	{
		name: "Alfiv",
		role: "Teknis",
		presence: "away"
	}
];
//#endregion
export { requirementHealthLabel as a, requirementStatusLabel as c, requirementStore as d, requirementTeamRoster as f, requirementDashboardOptions as i, requirementStatusOptions as l, listRequirements as n, requirementHealthSummary as o, updateRequirement as p, reqCode as r, requirementSortOptions as s, getRequirement as t, requirementStatusSummary as u };

//# sourceMappingURL=requirementStore.svelte.js.map