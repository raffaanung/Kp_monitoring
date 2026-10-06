import "./server.js";
//#region src/lib/accessStore.svelte.js
var STORAGE_KEY = "edm-fe-access-v4";
var defaultPermissions = [
	{
		key: "view_monitoring",
		label: "Lihat Operation Monitoring",
		group: "Monitoring"
	},
	{
		key: "manage_tasks",
		label: "Kelola Tasks",
		group: "Tasks"
	},
	{
		key: "manage_registry",
		label: "Kelola Dashboard Registry",
		group: "Registry"
	},
	{
		key: "view_activity_log",
		label: "Lihat Activity Log",
		group: "Audit"
	},
	{
		key: "manage_users",
		label: "Kelola User",
		group: "Access"
	},
	{
		key: "manage_roles",
		label: "Kelola Role & Permission",
		group: "Access"
	},
	{
		key: "manage_teams",
		label: "Kelola Tim",
		group: "Access"
	},
	{
		key: "export_data",
		label: "Export Data",
		group: "Data"
	}
];
/** @param {AccessPermission[]} list @param {Record<string, boolean>} overrides */
function allPermissions(list, overrides = {}) {
	/** @type {Record<string, boolean>} */
	const base = {};
	for (const p of list) base[p.key] = false;
	return {
		...base,
		...overrides
	};
}
/** @returns {{ users: AccessUser[], roles: AccessRole[], teams: AccessTeam[], permissions: AccessPermission[] }} */
function seedAccess() {
	const permissions = defaultPermissions.map((p) => ({ ...p }));
	return {
		users: [
			{
				id: 1,
				name: "Farras",
				email: "farras@edm.local",
				role_id: 1,
				unit: "EDM Core",
				team_ids: [1, 3],
				status: "active",
				created_at: "2026-05-01 08:00:00"
			},
			{
				id: 2,
				name: "Adhi Prasetio",
				email: "adhi.prasetio@edm.local",
				role_id: 2,
				unit: "GBO",
				team_ids: [1],
				status: "active",
				created_at: "2026-05-12 09:30:00"
			},
			{
				id: 3,
				name: "Atha Dwira",
				email: "atha.dwira@edm.local",
				role_id: 2,
				unit: "Finance",
				team_ids: [2],
				status: "active",
				created_at: "2026-05-20 10:00:00"
			},
			{
				id: 4,
				name: "Asep Wahyudi",
				email: "asep.wahyudi@edm.local",
				role_id: 4,
				unit: "GBO",
				team_ids: [1],
				status: "active",
				created_at: "2026-06-02 11:15:00"
			},
			{
				id: 5,
				name: "Alamsyah Putra",
				email: "alamsyah.putra@edm.local",
				role_id: 3,
				unit: "GBO",
				team_ids: [1, 2],
				status: "active",
				created_at: "2026-06-08 13:40:00"
			},
			{
				id: 6,
				name: "Panji Pujianto",
				email: "panji.pujianto@edm.local",
				role_id: 4,
				unit: "Finance",
				team_ids: [2],
				status: "active",
				created_at: "2026-06-18 15:00:00"
			},
			{
				id: 7,
				name: "Maggie Arsyad",
				email: "maggie.arsyad@edm.local",
				role_id: 4,
				unit: "Technology",
				team_ids: [3],
				status: "active",
				created_at: "2026-07-01 09:00:00"
			},
			{
				id: 8,
				name: "Farras Al-Risyad",
				email: "farras.al-risyad@edm.local",
				role_id: 4,
				unit: "EDM Core",
				team_ids: [1, 3],
				status: "active",
				created_at: "2026-07-10 10:30:00"
			},
			{
				id: 9,
				name: "Lifi",
				email: "lifi@edm.local",
				role_id: 4,
				unit: "Technology",
				team_ids: [3],
				status: "active",
				created_at: "2026-08-04 09:20:00"
			},
			{
				id: 10,
				name: "Mahdi",
				email: "mahdi@edm.local",
				role_id: 4,
				unit: "GBO",
				team_ids: [1],
				status: "active",
				created_at: "2026-08-11 10:00:00"
			},
			{
				id: 11,
				name: "Alfiv",
				email: "alfiv@edm.local",
				role_id: 4,
				unit: "Finance",
				team_ids: [2],
				status: "active",
				created_at: "2026-08-18 11:10:00"
			}
		],
		roles: [
			{
				id: 1,
				name: "Admin",
				description: "Akses penuh ke seluruh modul dan konfigurasi sistem.",
				permissions: allPermissions(permissions, Object.fromEntries(permissions.map((p) => [p.key, true])))
			},
			{
				id: 2,
				name: "Manager",
				description: "Mengawasi operasional dan registry.",
				permissions: allPermissions(permissions, {
					view_monitoring: true,
					manage_tasks: true,
					manage_registry: true,
					view_activity_log: true,
					manage_teams: true,
					export_data: true
				})
			},
			{
				id: 3,
				name: "PM",
				description: "Project manager untuk task dan dashboard.",
				permissions: allPermissions(permissions, {
					view_monitoring: true,
					manage_tasks: true,
					view_activity_log: true
				})
			},
			{
				id: 4,
				name: "Teknis",
				description: "Mengerjakan task dan memperbarui status.",
				permissions: allPermissions(permissions, {
					view_monitoring: true,
					manage_tasks: true,
					view_activity_log: true
				})
			}
		],
		teams: [
			{
				id: 1,
				name: "GBO Analytics",
				unit: "GBO",
				description: "Tim analitik untuk dashboard GBO dan SLA regional.",
				lead_id: 2,
				member_ids: [
					1,
					2,
					4,
					5,
					8,
					10
				],
				dashboards: ["GBO Dashboard", "CX Dashboard"],
				created_at: "2026-06-10 09:00:00"
			},
			{
				id: 2,
				name: "FinSight Ops",
				unit: "Finance",
				description: "Operasional FinSight dan laporan keuangan.",
				lead_id: 3,
				member_ids: [
					3,
					5,
					6,
					11
				],
				dashboards: ["FinSight"],
				created_at: "2026-06-12 11:30:00"
			},
			{
				id: 3,
				name: "Platform EDM",
				unit: "EDM Core",
				description: "Tim inti monitoring, TRAXIS, dan GARD.",
				lead_id: 1,
				member_ids: [
					1,
					7,
					8,
					9
				],
				dashboards: [
					"TRAXIS",
					"GARD",
					"EDM Core Monitor"
				],
				created_at: "2026-08-01 10:00:00"
			}
		],
		permissions
	};
}
function loadAccess() {
	if (typeof localStorage === "undefined") return seedAccess();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return seedAccess();
		const parsed = JSON.parse(raw);
		if (!parsed?.users?.length || !parsed?.roles?.length || !parsed?.teams?.length) return seedAccess();
		if (!Array.isArray(parsed.permissions)) parsed.permissions = defaultPermissions.map((p) => ({ ...p }));
		return parsed;
	} catch {
		return seedAccess();
	}
}
var initial = loadAccess();
var accessStore = {
	/** @type {AccessUser[]} */
	users: initial.users,
	/** @type {AccessRole[]} */
	roles: initial.roles,
	/** @type {AccessTeam[]} */
	teams: initial.teams,
	/** @type {AccessPermission[]} */
	permissions: initial.permissions
};
/** @param {number} id */
function getRole(id) {
	return accessStore.roles.find((r) => r.id === Number(id)) || null;
}
/** @param {number} id */
function getTeam(id) {
	return accessStore.teams.find((t) => t.id === Number(id)) || null;
}
/** @param {number} roleId */
function roleLabel(roleId) {
	return getRole(roleId)?.name || "—";
}
/** @param {number[]} teamIds */
function teamLabels(teamIds) {
	return teamIds.map((id) => getTeam(id)?.name).filter(Boolean);
}
function roleOptions() {
	return accessStore.roles.map((r) => ({
		value: r.id,
		label: r.name
	}));
}
function teamOptions() {
	return accessStore.teams.map((t) => ({
		value: t.id,
		label: t.name,
		unit: t.unit
	}));
}
/**
* @param {{
*   role?: string | number,
*   unit?: string,
*   team?: string | number,
*   status?: string,
*   q?: string,
* }} filters
*/
function listUsers(filters = {}) {
	const role = filters.role ? Number(filters.role) : 0;
	const team = filters.team ? Number(filters.team) : 0;
	const unit = (filters.unit || "").trim();
	const status = (filters.status || "").trim();
	const q = (filters.q || "").trim().toLowerCase();
	return accessStore.users.filter((u) => {
		if (role && u.role_id !== role) return false;
		if (unit && u.unit !== unit) return false;
		if (team && !u.team_ids.includes(team)) return false;
		if (status && u.status !== status) return false;
		if (q) {
			if (!`${u.name} ${u.email} ${roleLabel(u.role_id)} ${u.unit} ${teamLabels(u.team_ids).join(" ")}`.toLowerCase().includes(q)) return false;
		}
		return true;
	});
}
/** @param {number} roleId */
function countUsersInRole(roleId) {
	return accessStore.users.filter((u) => u.role_id === roleId).length;
}
/** @param {UserStatus} status */
function statusLabel(status) {
	return status === "active" ? "Aktif" : "Nonaktif";
}
//#endregion
export { roleOptions as a, teamOptions as c, roleLabel as i, countUsersInRole as n, statusLabel as o, listUsers as r, teamLabels as s, accessStore as t };

//# sourceMappingURL=accessStore.svelte.js.map