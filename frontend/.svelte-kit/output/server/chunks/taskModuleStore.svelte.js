import "./server.js";
//#region src/lib/taskModuleStore.svelte.js
var STORAGE_KEY = "edm-fe-module-tasks-v6";
var NOTIF_KEY = "edm-fe-module-notifs-v3";
var SESSION_KEY = "edm-fe-session-persona-v3";
var PM_MAP_KEY = "edm-fe-dashboard-pm-v2";
var dashboardPmMap = {
	"GBO Dashboard": "Alamsyah Putra",
	FinSight: "Alamsyah Putra",
	"CX Dashboard": "Alamsyah Putra",
	TRAXIS: "Alamsyah Putra",
	GARD: "Alamsyah Putra",
	"EDM Core Monitor": "Alamsyah Putra"
};
var teknisAssignees = [
	"Asep Wahyudi",
	"Panji Pujianto",
	"Maggie Arsyad",
	"Farras Al-Risyad",
	"Lifi",
	"Mahdi",
	"Alfiv"
];
var sessionPersonas = [
	{
		id: "admin-farras",
		name: "Farras",
		role: "manager",
		label: "Admin"
	},
	{
		id: "manager-adhi",
		name: "Adhi Prasetio",
		role: "manager",
		label: "Manager"
	},
	{
		id: "manager-atha",
		name: "Atha Dwira",
		role: "manager",
		label: "Manager"
	},
	{
		id: "pm-alamsyah",
		name: "Alamsyah Putra",
		role: "pm",
		label: "PM"
	},
	{
		id: "teknis-asep",
		name: "Asep Wahyudi",
		role: "teknis",
		label: "Teknis"
	},
	{
		id: "teknis-panji",
		name: "Panji Pujianto",
		role: "teknis",
		label: "Teknis"
	},
	{
		id: "teknis-maggie",
		name: "Maggie Arsyad",
		role: "teknis",
		label: "Teknis"
	},
	{
		id: "teknis",
		name: "Farras Al-Risyad",
		role: "teknis",
		label: "Teknis"
	},
	{
		id: "teknis-lifi",
		name: "Lifi",
		role: "teknis",
		label: "Teknis"
	},
	{
		id: "teknis-mahdi",
		name: "Mahdi",
		role: "teknis",
		label: "Teknis"
	},
	{
		id: "teknis-alfiv",
		name: "Alfiv",
		role: "teknis",
		label: "Teknis"
	}
];
var defaultDashboards = [
	"GBO Dashboard",
	"FinSight",
	"CX Dashboard",
	"TRAXIS",
	"GARD",
	"EDM Core Monitor"
];
function nowStamp() {
	const d = /* @__PURE__ */ new Date();
	const pad = (n) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}
function dateOnly(stamp = nowStamp()) {
	return stamp.slice(0, 10);
}
function loadPmMap() {
	if (typeof localStorage === "undefined") return { ...dashboardPmMap };
	try {
		const raw = localStorage.getItem(PM_MAP_KEY);
		if (!raw) return { ...dashboardPmMap };
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return { ...dashboardPmMap };
		return {
			...dashboardPmMap,
			...parsed
		};
	} catch {
		return { ...dashboardPmMap };
	}
}
dashboardPmMap = loadPmMap();
/** @param {Partial<ModuleTask> & { id: number, title: string }} raw */
function normalizeTask(raw) {
	const assignee = raw.assignee || raw.pic || "You";
	return {
		id: raw.id,
		title: raw.title,
		description: raw.description || "",
		dashboard: raw.dashboard || "General",
		requirement_id: raw.requirement_id ?? null,
		status: raw.status || "backlog",
		approval_state: raw.approval_state || "approved",
		pic: assignee,
		assignee,
		created_by: raw.created_by || assignee || "System",
		deadline: raw.deadline || dateOnly(),
		created_at: raw.created_at || nowStamp(),
		updated_at: raw.updated_at || raw.created_at || nowStamp(),
		approval_note: raw.approval_note || "",
		status_move: raw.status_move || null,
		comments: Array.isArray(raw.comments) ? raw.comments : [],
		activity: Array.isArray(raw.activity) ? raw.activity : [],
		evidences: Array.isArray(raw.evidences) ? raw.evidences : []
	};
}
/** @returns {ModuleTask[]} */
/**
* Cuplikan heatmap palsu untuk presentasi. Bukan file asli.
* @param {{ title: string, note: string, empty?: boolean, mark?: boolean }} spec
*/
function demoHeatmapShot(spec) {
	const boxes = [
		["Jakarta", "#2f7a52"],
		["Jawa Barat", spec.empty ? "#d5dbe3" : "#e0a45a"],
		["Jawa Tengah", "#2f7a52"],
		["Jawa Timur", "#be123c"],
		["Sumatera", "#e0a45a"],
		["Kalimantan", "#2f7a52"]
	].map((cell, i) => {
		const x = 36 + i % 3 * 190;
		const y = 92 + Math.floor(i / 3) * 100;
		const label = spec.empty && cell[0] === "Jawa Barat" ? "kosong" : "SLA";
		const ink = spec.empty && cell[0] === "Jawa Barat" ? "#475569" : "#fff";
		return `<rect x="${x}" y="${y}" width="170" height="78" rx="12" fill="${cell[1]}"/><text x="${x + 16}" y="${y + 34}" font-family="sans-serif" font-size="15" font-weight="700" fill="${ink}">${cell[0]}</text><text x="${x + 16}" y="${y + 56}" font-family="sans-serif" font-size="12" fill="${ink}">${label}</text>`;
	}).join("");
	const ring = spec.mark ? "<ellipse cx=\"311\" cy=\"131\" rx=\"98\" ry=\"52\" fill=\"none\" stroke=\"#e11d48\" stroke-width=\"4\"/><text x=\"400\" y=\"118\" font-family=\"sans-serif\" font-size=\"13\" font-weight=\"700\" fill=\"#be123c\">perlu revisi</text>" : "";
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#eef3f8"/><rect x="20" y="16" width="600" height="44" rx="10" fill="#fff"/><text x="36" y="44" font-family="sans-serif" font-size="16" font-weight="700" fill="#0f1b2e">${spec.title}</text><text x="36" y="332" font-family="sans-serif" font-size="13" fill="#5c6770">${spec.note}</text>${boxes}${ring}</svg>`;
	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
/** @param {number} id @param {string} at @param {string} actor @param {'move_request' | 'pm_approve' | 'pm_return' | 'comment'} kind @param {string} name @param {string} dataUrl @param {string} note */
function demoFile(id, at, actor, kind, name, dataUrl, note) {
	return {
		id,
		at,
		actor,
		kind,
		name,
		mime: "image/svg+xml",
		size: dataUrl.length,
		data_url: dataUrl,
		note
	};
}
function seedTasks() {
	const legendShot = demoHeatmapShot({
		title: "SLA heatmap · legend sekarang",
		note: "Legend tidak sama dengan widget SLA lain",
		empty: true
	});
	const emptyShot = demoHeatmapShot({
		title: "SLA heatmap · progres teknis",
		note: "Sel Jawa Barat masih kosong",
		empty: true
	});
	const revisiShot = demoHeatmapShot({
		title: "SLA heatmap · catatan PM",
		note: "Jawa Barat harus kuning, bukan abu-abu",
		empty: true,
		mark: true
	});
	const fixedShot = demoHeatmapShot({
		title: "SLA heatmap · setelah revisi",
		note: "Jawa Barat sudah kuning, legend konsisten"
	});
	const siapShot = demoHeatmapShot({
		title: "SLA heatmap · siap UAT",
		note: "Bukti teknis sebelum pindah ke UAT"
	});
	return [
		normalizeTask({
			id: 1,
			title: "SLA heatmap per region",
			description: "Build heatmap widget for SLA breach by region on GBO.",
			dashboard: "GBO Dashboard",
			requirement_id: 1,
			status: "development",
			approval_state: "approved",
			assignee: "Farras Al-Risyad",
			created_by: "Alamsyah Putra",
			deadline: "2026-09-18",
			created_at: "2026-09-01 09:00:00",
			updated_at: "2026-09-22 14:45:00",
			status_move: {
				from: "development",
				to: "uat",
				requested_by: "Farras Al-Risyad",
				note: "Revisi Jawa Barat sudah masuk. Legend disamakan dengan widget SLA lain.",
				at: "2026-09-22 14:45:00",
				evidence_id: 5
			},
			evidences: [
				demoFile(1, "2026-09-12 10:00:00", "Alamsyah Putra", "comment", "legend-tidak-konsisten.svg", legendShot, "Legend masih beda"),
				demoFile(2, "2026-09-18 15:10:00", "Farras Al-Risyad", "comment", "sel-jawa-barat-kosong.svg", emptyShot, "Sel masih kosong"),
				demoFile(3, "2026-09-21 09:20:00", "Alamsyah Putra", "pm_return", "revisi-jawa-barat.svg", revisiShot, "Yang dilingkari masih salah"),
				demoFile(4, "2026-09-22 11:05:00", "Farras Al-Risyad", "comment", "heatmap-setelah-revisi.svg", fixedShot, "Sudah diperbaiki"),
				demoFile(5, "2026-09-22 14:45:00", "Farras Al-Risyad", "move_request", "heatmap-siap-uat.svg", siapShot, "Bukti siap UAT")
			],
			comments: [
				{
					id: 4,
					at: "2026-09-22 11:05:00",
					actor: "Farras Al-Risyad",
					body: "Sudah diperbaiki. Jawa Barat sekarang kuning dan legend mengikuti widget SLA lain.",
					evidence_id: 4
				},
				{
					id: 3,
					at: "2026-09-21 09:20:00",
					actor: "Alamsyah Putra",
					body: "Bagian yang dilingkari masih salah. Sel Jawa Barat harus kuning (SLA perhatian), bukan abu-abu kosong.",
					evidence_id: 3
				},
				{
					id: 2,
					at: "2026-09-18 15:10:00",
					actor: "Farras Al-Risyad",
					body: "Widget sudah dipasang. Legend saya samakan, tapi sel Jawa Barat masih kosong. Mohon cek lampirannya.",
					evidence_id: 2
				},
				{
					id: 1,
					at: "2026-09-12 10:00:00",
					actor: "Alamsyah Putra",
					body: "Pastikan legend warna konsisten dengan widget SLA lain. Saya lampirkan tampilan yang sekarang masih beda.",
					evidence_id: 1
				}
			],
			activity: [
				{
					id: 6,
					at: "2026-09-22 14:45:00",
					actor: "Farras Al-Risyad",
					action: "Ajukan pindah Development → UAT",
					evidence_id: 5
				},
				{
					id: 5,
					at: "2026-09-21 16:07:00",
					actor: "Alamsyah Putra",
					action: "Moved to Development"
				},
				{
					id: 4,
					at: "2026-09-19 11:00:00",
					actor: "Alamsyah Putra",
					action: "Moved to Testing"
				},
				{
					id: 3,
					at: "2026-09-12 11:20:00",
					actor: "Alamsyah Putra",
					action: "Moved to Development"
				},
				{
					id: 2,
					at: "2026-09-01 09:00:00",
					actor: "Alamsyah Putra",
					action: "Task dibuat dari requirement · Backlog"
				}
			]
		}),
		normalizeTask({
			id: 2,
			title: "Throughput vs target chart",
			description: "Line chart comparing daily throughput against monthly target.",
			dashboard: "GBO Dashboard",
			requirement_id: 1,
			status: "testing",
			approval_state: "approved",
			assignee: "Farras Al-Risyad",
			created_by: "Alamsyah Putra",
			deadline: "2026-09-16",
			created_at: "2026-08-28 10:00:00",
			updated_at: "2026-09-13 15:00:00",
			status_move: {
				from: "testing",
				to: "uat",
				requested_by: "Farras Al-Risyad",
				note: "Siap masuk UAT setelah smoke test.",
				at: "2026-09-14 09:30:00",
				evidence_id: 1
			},
			evidences: [demoFile(1, "2026-09-14 09:30:00", "Farras Al-Risyad", "move_request", "throughput-smoke-test.svg", demoHeatmapShot({
				title: "Throughput vs target",
				note: "Smoke test harian sudah hijau"
			}), "Smoke test")],
			comments: [{
				id: 1,
				at: "2026-09-13 14:00:00",
				actor: "Alamsyah Putra",
				body: "Cek sumbu Y supaya skala target terbaca jelas."
			}],
			activity: [
				{
					id: 1,
					at: "2026-09-14 09:30:00",
					actor: "Farras Al-Risyad",
					action: "Ajukan pindah Testing → UAT",
					evidence_id: 1
				},
				{
					id: 2,
					at: "2026-09-13 15:00:00",
					actor: "Farras Al-Risyad",
					action: "Moved to Testing"
				},
				{
					id: 3,
					at: "2026-08-28 10:00:00",
					actor: "Alamsyah Putra",
					action: "Task dibuat dari requirement · Backlog"
				}
			]
		}),
		normalizeTask({
			id: 3,
			title: "Aging bucket filter",
			description: "Add aging buckets filter for invoice cards on FinSight.",
			dashboard: "FinSight",
			requirement_id: 3,
			status: "uat",
			approval_state: "approved",
			assignee: "Asep Wahyudi",
			created_by: "Alamsyah Putra",
			deadline: "2026-09-12",
			created_at: "2026-08-20 08:30:00",
			updated_at: "2026-09-11 09:40:00",
			activity: [{
				id: 1,
				at: "2026-09-11 09:40:00",
				actor: "Alamsyah Putra",
				action: "Moved to UAT"
			}, {
				id: 2,
				at: "2026-08-20 08:30:00",
				actor: "Alamsyah Putra",
				action: "Task dibuat dari requirement · Backlog"
			}]
		}),
		normalizeTask({
			id: 4,
			title: "FX rate overlay",
			description: "Overlay FX conversion rates on vendor exposure.",
			dashboard: "FinSight",
			requirement_id: 3,
			status: "backlog",
			approval_state: "approved",
			assignee: "Asep Wahyudi",
			created_by: "Alamsyah Putra",
			deadline: "2026-09-25",
			created_at: "2026-09-08 13:00:00",
			updated_at: "2026-09-08 13:00:00",
			activity: [{
				id: 1,
				at: "2026-09-08 13:00:00",
				actor: "Alamsyah Putra",
				action: "Task dibuat dari requirement · Backlog"
			}]
		}),
		normalizeTask({
			id: 5,
			title: "CSAT trend by channel",
			description: "Trend chart for CSAT across support channels.",
			dashboard: "CX Dashboard",
			requirement_id: 4,
			status: "to_production",
			approval_state: "approved",
			assignee: "Panji Pujianto",
			created_by: "Alamsyah Putra",
			deadline: "2026-09-10",
			created_at: "2026-08-10 11:00:00",
			updated_at: "2026-09-10 16:00:00",
			activity: [{
				id: 1,
				at: "2026-09-10 16:00:00",
				actor: "Alamsyah Putra",
				action: "Moved to Production"
			}, {
				id: 2,
				at: "2026-08-10 11:00:00",
				actor: "Alamsyah Putra",
				action: "Task dibuat dari requirement · Backlog"
			}]
		}),
		normalizeTask({
			id: 6,
			title: "Backlog aging alert",
			description: "Alert rule when ticket backlog ages beyond SLA.",
			dashboard: "CX Dashboard",
			requirement_id: 4,
			status: "development",
			approval_state: "approved",
			assignee: "Panji Pujianto",
			created_by: "Alamsyah Putra",
			deadline: "2026-09-20",
			created_at: "2026-09-02 09:15:00",
			updated_at: "2026-09-12 10:00:00",
			activity: [{
				id: 1,
				at: "2026-09-12 10:00:00",
				actor: "Panji Pujianto",
				action: "Moved to Development"
			}, {
				id: 2,
				at: "2026-09-02 09:15:00",
				actor: "Alamsyah Putra",
				action: "Task dibuat dari requirement · Backlog"
			}]
		}),
		normalizeTask({
			id: 7,
			title: "Kanban burn-up widget",
			description: "Prototype burn-up chart for TRAXIS delivery board.",
			dashboard: "TRAXIS",
			requirement_id: 5,
			status: "backlog",
			approval_state: "approved",
			assignee: "Maggie Arsyad",
			created_by: "Alamsyah Putra",
			deadline: "2026-09-30",
			created_at: "2026-09-07 12:00:00",
			updated_at: "2026-09-07 12:00:00",
			activity: [{
				id: 1,
				at: "2026-09-07 12:00:00",
				actor: "Alamsyah Putra",
				action: "Task dibuat dari requirement · Backlog"
			}]
		}),
		normalizeTask({
			id: 8,
			title: "Policy exception log",
			description: "Table of policy exceptions with export action.",
			dashboard: "GARD",
			requirement_id: 6,
			status: "selesai",
			approval_state: "approved",
			assignee: "Asep Wahyudi",
			created_by: "Alamsyah Putra",
			deadline: "2026-08-31",
			created_at: "2026-08-01 10:00:00",
			updated_at: "2026-08-31 17:00:00",
			activity: [{
				id: 1,
				at: "2026-08-31 17:00:00",
				actor: "Alamsyah Putra",
				action: "Moved to Selesai"
			}, {
				id: 2,
				at: "2026-08-01 10:00:00",
				actor: "Alamsyah Putra",
				action: "Task dibuat dari requirement · Backlog"
			}]
		}),
		normalizeTask({
			id: 9,
			title: "Blocker root-cause tags",
			description: "Tagging taxonomy for delivery blockers on TRAXIS.",
			dashboard: "TRAXIS",
			requirement_id: 5,
			status: "testing",
			approval_state: "approved",
			assignee: "Maggie Arsyad",
			created_by: "Alamsyah Putra",
			deadline: "2026-09-14",
			created_at: "2026-09-03 08:00:00",
			updated_at: "2026-09-13 09:30:00",
			comments: [{
				id: 1,
				at: "2026-09-13 08:00:00",
				actor: "Alamsyah Putra",
				body: "Tambah tag “dependency vendor” di taxonomy."
			}],
			activity: [{
				id: 1,
				at: "2026-09-13 09:30:00",
				actor: "Alamsyah Putra",
				action: "Moved to Testing"
			}, {
				id: 2,
				at: "2026-09-03 08:00:00",
				actor: "Alamsyah Putra",
				action: "Task dibuat dari requirement · Backlog"
			}]
		}),
		normalizeTask({
			id: 10,
			title: "Audit trail export",
			description: "CSV/PDF export for GARD audit trail.",
			dashboard: "GARD",
			requirement_id: 6,
			status: "selesai",
			approval_state: "approved",
			assignee: "Asep Wahyudi",
			created_by: "Alamsyah Putra",
			deadline: "2026-09-01",
			created_at: "2026-08-15 14:00:00",
			updated_at: "2026-09-01 16:00:00",
			activity: [{
				id: 1,
				at: "2026-09-01 16:00:00",
				actor: "Alamsyah Putra",
				action: "Moved to Selesai"
			}, {
				id: 2,
				at: "2026-08-15 14:00:00",
				actor: "Alamsyah Putra",
				action: "Task dibuat dari requirement · Backlog"
			}]
		})
	];
}
/** @returns {AppNotification[]} */
function seedNotifications() {
	return [{
		id: 1,
		at: "2026-09-14 09:30:00",
		type: "move_request",
		title: "Request pindah status",
		body: "Farras Al-Risyad mengajukan “Throughput vs target chart” Testing → UAT.",
		taskId: 2,
		dashboard: "GBO Dashboard",
		toUser: "Alamsyah Putra",
		read: false
	}, {
		id: 2,
		at: "2026-09-12 10:00:00",
		type: "comment",
		title: "Komentar baru",
		body: "Alamsyah Putra: Pastikan legend warna konsisten…",
		taskId: 1,
		dashboard: "GBO Dashboard",
		toUser: "Farras Al-Risyad",
		read: true
	}];
}
/** @returns {ModuleTask[]} */
function loadTasks() {
	if (typeof localStorage === "undefined") return seedTasks();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return seedTasks();
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed) || parsed.length === 0) return seedTasks();
		return parsed.map((t) => normalizeTask(t));
	} catch {
		return seedTasks();
	}
}
/** @returns {AppNotification[]} */
function loadNotifications() {
	if (typeof localStorage === "undefined") return seedNotifications();
	try {
		const raw = localStorage.getItem(NOTIF_KEY);
		if (!raw) return seedNotifications();
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return seedNotifications();
		return parsed;
	} catch {
		return seedNotifications();
	}
}
/** @returns {SessionUser} */
function loadSession() {
	const fallback = sessionPersonas.find((p) => p.id === "teknis") || sessionPersonas[0];
	if (typeof localStorage === "undefined") return fallback;
	try {
		const id = localStorage.getItem(SESSION_KEY);
		return sessionPersonas.find((p) => p.id === id) || fallback;
	} catch {
		return fallback;
	}
}
function loadBoardDashboard() {
	if (typeof localStorage === "undefined") return "";
	try {
		return localStorage.getItem("edm-fe-task-board-dashboard") || "";
	} catch {
		return "";
	}
}
function initialBoardDashboard() {
	const options = defaultDashboards;
	const saved = loadBoardDashboard();
	if (saved && options.includes(saved)) return saved;
	return options[0] || "";
}
var taskModuleStore = {
	/** @type {ModuleTask[]} */
	items: loadTasks(),
	/** @type {AppNotification[]} */
	notifications: loadNotifications(),
	/** @type {SessionUser} */
	session: loadSession(),
	lastDetailId: null,
	boardDashboard: initialBoardDashboard(),
	/** @type {'kanban' | 'inbox'} */
	boardTab: "kanban"
};
function persistBoardDashboard(name) {
	if (taskModuleStore.boardDashboard === name) return;
	taskModuleStore.boardDashboard = name;
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem("edm-fe-task-board-dashboard", name);
	} catch {}
}
function currentUserName() {
	taskModuleStore.session;
	return taskModuleStore.session.name;
}
function currentUserRole() {
	taskModuleStore.session;
	return taskModuleStore.session.role;
}
/** @param {string} dashboard */
function pmOfDashboard(dashboard) {
	return dashboardPmMap[dashboard] || "";
}
/** @param {string} dashboard */
function isCurrentUserPmOf(dashboard) {
	const session = taskModuleStore.session;
	if (session.role !== "pm") return false;
	return pmOfDashboard(dashboard) === session.name;
}
function canCreateDashboard() {
	return currentUserRole() === "manager";
}
/** @param {string} [dashboard] */
function canManageRequirements(dashboard = "") {
	if (currentUserRole() !== "pm") return false;
	if (!dashboard) return true;
	return isCurrentUserPmOf(dashboard);
}
function canCreateTask() {
	return currentUserRole() === "pm";
}
/** Board interaction: PM full move, teknis request only */
function canUpdateBoard() {
	const role = currentUserRole();
	return role === "pm" || role === "teknis";
}
function canCommentOnTask() {
	const role = currentUserRole();
	return role === "pm" || role === "teknis";
}
/** @param {number} id */
function getModuleTask(id) {
	return taskModuleStore.items.find((t) => t.id === Number(id)) || null;
}
/**
* @param {{
*   dashboard?: string,
*   status?: string,
*   pic?: string,
*   overdue?: string,
*   aktif?: string,
*   q?: string,
*   approval?: string,
*   requirement_id?: number | string,
* }} [filters]
*/
function listModuleTasks({ dashboard = "", status = "", pic = "", overdue = "", aktif = "", q = "", approval = "", requirement_id = "" } = {}) {
	taskModuleStore.items;
	let items = [...taskModuleStore.items];
	const today = dateOnly();
	if (dashboard) items = items.filter((t) => t.dashboard === dashboard);
	if (status) items = items.filter((t) => t.status === status);
	if (approval) items = items.filter((t) => t.approval_state === approval);
	if (requirement_id !== "" && requirement_id != null) items = items.filter((t) => t.requirement_id === Number(requirement_id));
	if (aktif === "yes") items = items.filter((t) => t.approval_state === "approved" && t.status !== "selesai");
	if (pic) items = items.filter((t) => t.assignee === pic || t.pic === pic);
	if (overdue === "yes") items = items.filter((t) => t.approval_state === "approved" && t.status !== "selesai" && t.deadline < today);
	else if (overdue === "no") items = items.filter((t) => t.status === "selesai" || t.deadline >= today);
	if (q) {
		const needle = q.toLowerCase();
		items = items.filter((t) => `${t.title} ${t.description} ${t.dashboard} ${t.assignee} ${t.pic}`.toLowerCase().includes(needle));
	}
	return items.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
/** @param {TaskWorkflow | string} status */
function workflowProgressSolid(status) {
	switch (status) {
		case "backlog": return .22;
		case "development": return .4;
		case "testing": return .55;
		case "uat": return .7;
		case "to_production": return .85;
		case "selesai": return 1;
		default: return .35;
	}
}
/** Pipeline columns — hanya task yang sudah approved */
/** @param {TaskWorkflow} status @param {string} [dashboard] */
function tasksByColumn(status, dashboard = "") {
	taskModuleStore.items;
	return taskModuleStore.items.filter((t) => t.approval_state === "approved" && t.status === status && (!dashboard || t.dashboard === dashboard)).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
/** Inbox: pending status-move requests (dan legacy create pending jika ada) */
/** @param {string} [dashboard] */
function listInboxTasks(dashboard = "") {
	taskModuleStore.items;
	taskModuleStore.session;
	return taskModuleStore.items.filter((t) => {
		const hasMove = Boolean(t.status_move);
		const legacyPending = t.approval_state === "pending" || t.approval_state === "revision";
		if (!hasMove && !legacyPending) return false;
		if (dashboard && t.dashboard !== dashboard) return false;
		return true;
	}).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
/** @param {string} [dashboard] */
function inboxNeedsMyAction(dashboard = "") {
	return listInboxTasks(dashboard).filter((t) => {
		if (!isCurrentUserPmOf(t.dashboard)) return false;
		if (t.status_move) return true;
		return t.approval_state === "pending";
	});
}
/** @param {string} name */
function setBoardDashboard(name) {
	persistBoardDashboard(name);
}
function resolveBoardDashboard() {
	taskModuleStore.boardDashboard;
	taskModuleStore.items;
	const options = boardDashboardOptions();
	if (!options.length) return "";
	if (taskModuleStore.boardDashboard && options.includes(taskModuleStore.boardDashboard)) return taskModuleStore.boardDashboard;
	return options[0];
}
/** @param {ModuleTask} task */
function latestComment(task) {
	if (!task?.comments?.length) return null;
	return task.comments[0];
}
function myNotifications() {
	taskModuleStore.notifications;
	taskModuleStore.session;
	const name = currentUserName();
	return taskModuleStore.notifications.filter((n) => n.toUser === name).sort((a, b) => b.at.localeCompare(a.at));
}
function unreadNotificationCount() {
	return myNotifications().filter((n) => !n.read).length;
}
var workflowColumns = [
	{
		key: "backlog",
		label: "Backlog"
	},
	{
		key: "development",
		label: "Development"
	},
	{
		key: "testing",
		label: "Testing"
	},
	{
		key: "uat",
		label: "UAT"
	},
	{
		key: "to_production",
		label: "to Production"
	},
	{
		key: "selesai",
		label: "Selesai"
	}
];
var workflowStatusColors = {
	backlog: "#94a3b8",
	development: "#065fc6",
	testing: "#7c6bc4",
	uat: "#e0a45a",
	to_production: "#e11d48",
	selesai: "#2f7a52"
};
/** @param {TaskWorkflow | string} status */
function workflowStatusColor(status) {
	return workflowStatusColors[status] || "#94a3b8";
}
/** @param {TaskWorkflow | string} status */
function workflowLabel(status) {
	const found = workflowColumns.find((c) => c.key === status);
	return found ? found.label : status;
}
/** @param {ApprovalState | string} state */
function approvalLabel(state) {
	switch (state) {
		case "pending": return "Menunggu approval";
		case "revision": return "Perlu revisi";
		case "approved": return "Approved";
		default: return state;
	}
}
function dashboardOptions() {
	taskModuleStore.items;
	return [.../* @__PURE__ */ new Set([...Object.keys(dashboardPmMap), ...taskModuleStore.items.map((t) => t.dashboard)])].sort();
}
function boardDashboardOptions() {
	taskModuleStore.items;
	return [.../* @__PURE__ */ new Set([
		...defaultDashboards,
		...Object.keys(dashboardPmMap),
		...taskModuleStore.items.map((t) => t.dashboard)
	])].sort();
}
function picOptions() {
	taskModuleStore.items;
	return [.../* @__PURE__ */ new Set([...teknisAssignees, ...taskModuleStore.items.map((t) => t.assignee || t.pic)])].sort();
}
function assigneeOptions() {
	return picOptions();
}
/** @param {ModuleTask} task */
function isOverdue(task) {
	return task.approval_state === "approved" && task.status !== "selesai" && task.deadline < dateOnly();
}
/** @param {number | null | undefined} requirementId */
function tasksForRequirement(requirementId) {
	taskModuleStore.items;
	if (!requirementId) return [];
	return taskModuleStore.items.filter((t) => t.requirement_id === Number(requirementId));
}
//#endregion
export { workflowProgressSolid as A, taskModuleStore as C, unreadNotificationCount as D, teknisAssignees as E, workflowColumns as O, setBoardDashboard as S, tasksForRequirement as T, listInboxTasks as _, canCreateDashboard as a, pmOfDashboard as b, canUpdateBoard as c, dashboardOptions as d, getModuleTask as f, latestComment as g, isOverdue as h, canCommentOnTask as i, workflowStatusColor as j, workflowLabel as k, currentUserName as l, isCurrentUserPmOf as m, assigneeOptions as n, canCreateTask as o, inboxNeedsMyAction as p, boardDashboardOptions as r, canManageRequirements as s, approvalLabel as t, currentUserRole as u, listModuleTasks as v, tasksByColumn as w, resolveBoardDashboard as x, myNotifications as y };

//# sourceMappingURL=taskModuleStore.svelte.js.map