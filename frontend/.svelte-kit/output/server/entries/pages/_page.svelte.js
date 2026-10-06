import { a as ensure_array_like, c as stringify, f as escape_html, i as derived, n as attr_style, t as attr_class, u as attr } from "../../chunks/server.js";
import "../../chunks/navigation.js";
import { t as edm_logo_default } from "../../chunks/edm-logo.js";
import { t as avatar_farras_default } from "../../chunks/avatar-farras.js";
import { A as workflowProgressSolid, C as taskModuleStore, h as isOverdue, j as workflowStatusColor, k as workflowLabel } from "../../chunks/taskModuleStore.svelte.js";
import { n as NotificationBell, t as ProfileSwitcher } from "../../chunks/ProfileSwitcher.js";
import { t as pushTaskFilters } from "../../chunks/taskNav.js";
import { d as requirementStore, i as requirementDashboardOptions } from "../../chunks/requirementStore.svelte.js";
import "apexcharts";
//#region src/lib/OpsChart.svelte
function OpsChart($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		/** @type {{ type?: 'donut' | 'bar', labels?: string[], series?: number[], colors?: string[], horizontal?: boolean, unit?: string }} */
		let { type = "donut", labels = [], series = [], colors = [
			"#1a1a1a",
			"#6b6b73",
			"#b8b8bf",
			"#d9c8f2",
			"#8bbfa0"
		], horizontal = false, unit = "task" } = $$props;
		const total = derived(() => series.reduce((a, b) => a + b, 0));
		derived(() => `${type}|${horizontal ? "h" : "v"}|${unit}|${series.join(",")}|${labels.join(",")}|${colors.join(",")}`);
		$$renderer.push(`<div${attr_class("ops-chart-wrap svelte-atpjmz", void 0, { "donut": type === "donut" })}><!---->`);
		$$renderer.push(`<div${attr_class("ops-chart svelte-atpjmz", void 0, { "square": type === "donut" })}${attr_style(void 0)}></div>`);
		$$renderer.push(`<!----> `);
		if (type === "donut") {
			$$renderer.push(`<!--[0--><div class="donut-center svelte-atpjmz"${attr_style(void 0)} aria-hidden="true"><!---->`);
			$$renderer.push(`<strong class="svelte-atpjmz">${escape_html(total())}</strong>`);
			$$renderer.push(`<!----> <span class="svelte-atpjmz">Total</span></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/lib/GlassSwitch.svelte
function GlassSwitch($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		/**
		* Segmented control dengan lensa kaca yang membesarkan opsi aktif.
		* @type {{
		*   options: { id: string, label: string }[],
		*   value: string,
		*   onchange: (id: string) => void,
		*   label?: string,
		*   class?: string,
		* }}
		*/
		let { options, value, onchange, label = "", class: className = "" } = $$props;
		let lx = 0;
		let tx = 0;
		$$renderer.push(`<div${attr_class(`lb ${stringify(
			/** @param {number} clientX */
			/** @param {PointerEvent} e */
			/** @param {PointerEvent} e */
			className
		)}`, "svelte-13yky7r", {
			"ready": false,
			"pressed": false
		})} role="tablist"${attr("aria-label", label)}${attr_style("", { "--n": options.length })}><div class="track svelte-13yky7r"></div> <div class="row-items base svelte-13yky7r"><!--[-->`);
		const each_array = ensure_array_like(options);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let opt = each_array[$$index];
			$$renderer.push(`<button type="button" role="tab"${attr("aria-selected", value === opt.id)}${attr_class("svelte-13yky7r", void 0, { "on": value === opt.id })}>${escape_html(opt.label)}</button>`);
		}
		$$renderer.push(`<!--]--></div> <div class="lens svelte-13yky7r" aria-hidden="true"${attr_style("", { "--lx": `${stringify(lx)}px` })}><div class="row-items mag svelte-13yky7r"${attr_style("", { "--tx": `${stringify(tx)}px` })}><!--[-->`);
		const each_array_1 = ensure_array_like(options);
		for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
			let opt = each_array_1[$$index_1];
			$$renderer.push(`<span${attr_class("item svelte-13yky7r", void 0, { "on": value === opt.id })}>${escape_html(opt.label)}</span>`);
		}
		$$renderer.push(`<!--]--></div> <i class="band t svelte-13yky7r"></i> <i class="band b svelte-13yky7r"></i> <i class="rim svelte-13yky7r"></i></div></div>`);
	});
}
//#endregion
//#region src/lib/taskStore.svelte.js
var STORAGE_KEY = "edm-fe-tasks-v3";
function toISODate(d) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** @param {Date} d @param {number} n */
function addDays(d, n) {
	const x = new Date(d);
	x.setDate(x.getDate() + n);
	return x;
}
/** Monday 00:00 of the week containing `d` */
/** @param {Date} [d] */
function startOfWeek(d = /* @__PURE__ */ new Date()) {
	const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	const day = (date.getDay() + 6) % 7;
	date.setDate(date.getDate() - day);
	return date;
}
/** @param {Date} [d] */
function startOfDay(d = /* @__PURE__ */ new Date()) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
/**
* Inclusive date range for a period filter.
* @param {PeriodKey} period
* @param {Date} [ref]
* @param {{ year?: number, month?: number }} [monthOverride] used when period === 'month'
*/
function periodRange(period, ref = /* @__PURE__ */ new Date(), monthOverride = {}) {
	const today = startOfDay(ref);
	if (period === "today") return {
		start: today,
		end: today
	};
	if (period === "week") {
		const start = startOfWeek(today);
		return {
			start,
			end: addDays(start, 6)
		};
	}
	const year = monthOverride.year ?? today.getFullYear();
	const month = monthOverride.month ?? today.getMonth();
	return {
		start: new Date(year, month, 1),
		end: new Date(year, month + 1, 0)
	};
}
/**
* Task overlaps [rangeStart, rangeEnd] inclusive by calendar day
* if its [startDate, deadline] intersects the range.
* @param {FeTask} task
* @param {Date} rangeStart
* @param {Date} rangeEnd
*/
function taskOverlapsRange(task, rangeStart, rangeEnd) {
	const start = /* @__PURE__ */ new Date(`${task.startDate}T00:00:00`);
	let end = /* @__PURE__ */ new Date(`${task.deadline}T00:00:00`);
	if (end < start) end = new Date(start);
	const rs = startOfDay(rangeStart).getTime();
	const re = startOfDay(rangeEnd).getTime();
	return end.getTime() >= rs && start.getTime() <= re;
}
/** @param {FeTask[]} list @param {Date} rangeStart @param {Date} rangeEnd */
function tasksInRange(list, rangeStart, rangeEnd) {
	return list.filter((t) => taskOverlapsRange(t, rangeStart, rangeEnd));
}
/** @param {string} deadlineISO @param {Date} [ref] */
function delayLabel(deadlineISO, ref = /* @__PURE__ */ new Date()) {
	const today = startOfDay(ref).getTime();
	const due = (/* @__PURE__ */ new Date(`${deadlineISO}T00:00:00`)).getTime();
	const days = Math.round((today - due) / 864e5);
	if (days <= 0) return days === 0 ? "hari ini" : "";
	if (days === 1) return "1 hari";
	return `${days} hari`;
}
/** @param {string} isoDatetime @param {Date} [ref] */
function relativeWhen(isoDatetime, ref = /* @__PURE__ */ new Date()) {
	const t = new Date(isoDatetime).getTime();
	if (Number.isNaN(t)) return "—";
	const diffMs = ref.getTime() - t;
	const mins = Math.floor(diffMs / 6e4);
	if (mins < 60) return mins <= 1 ? "Baru saja" : `${mins} menit lalu`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours} jam lalu`;
	const days = Math.floor(hours / 24);
	if (days === 1) return "Kemarin";
	if (days < 7) return `${days} hari lalu`;
	return new Date(isoDatetime).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short"
	});
}
/** @returns {FeTask[]} */
function seedTasks() {
	const today = startOfDay();
	const week = startOfWeek(today);
	const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
	/** @param {number} dayOffset from today @param {number} hour */
	const updated = (dayOffset, hour = 10) => {
		const d = addDays(today, dayOffset);
		d.setHours(hour, hour * 7 % 60, 0, 0);
		return d.toISOString();
	};
	/** @type {FeTask[]} */
	return [
		{
			id: 1,
			title: "Review EDM batch Q3",
			meta: "EDM Core",
			status: "in_progress",
			priority: "high",
			startDate: toISODate(addDays(today, -2)),
			deadline: toISODate(today),
			pic: "Alamsyah Putra",
			updatedAt: updated(0, 8)
		},
		{
			id: 2,
			title: "Sync vendor master mapping",
			meta: "Vendor",
			status: "open",
			priority: "medium",
			startDate: toISODate(addDays(week, 1)),
			deadline: toISODate(addDays(week, 4)),
			pic: "Panji Pujianto",
			updatedAt: updated(-1, 14)
		},
		{
			id: 3,
			title: "Close overdue invoice tasks",
			meta: "Invoice",
			status: "open",
			priority: "high",
			startDate: toISODate(addDays(today, -10)),
			deadline: toISODate(addDays(today, -3)),
			pic: "Alamsyah Putra",
			updatedAt: updated(-2, 9)
		},
		{
			id: 4,
			title: "Generate weekly EDM report",
			meta: "GBO Dashboard",
			status: "done",
			priority: "medium",
			startDate: toISODate(week),
			deadline: toISODate(addDays(week, 2)),
			pic: "Asep Wahyudi",
			updatedAt: updated(-1, 16)
		},
		{
			id: 5,
			title: "Fix duplicate document IDs",
			meta: "CX Dashboard",
			status: "in_progress",
			priority: "high",
			startDate: toISODate(addDays(today, -1)),
			deadline: toISODate(addDays(today, 3)),
			pic: "Alamsyah Putra",
			updatedAt: updated(0, 7)
		},
		{
			id: 6,
			title: "FinSight KPI refresh",
			meta: "FinSight",
			status: "open",
			priority: "low",
			startDate: toISODate(addDays(monthStart, 8)),
			deadline: toISODate(addDays(monthStart, 14)),
			pic: "Maggie Arsyad",
			updatedAt: updated(-3, 11)
		},
		{
			id: 7,
			title: "Onboard new PIC checklist",
			meta: "TRAXIS",
			status: "open",
			priority: "low",
			startDate: toISODate(addDays(monthStart, 15)),
			deadline: toISODate(addDays(monthStart, 25)),
			pic: "Alamsyah Putra",
			updatedAt: updated(-4, 13)
		},
		{
			id: 8,
			title: "Validate SLA escalation rules",
			meta: "GARD",
			status: "in_progress",
			priority: "medium",
			startDate: toISODate(addDays(today, -5)),
			deadline: toISODate(addDays(today, -1)),
			pic: "Alamsyah Putra",
			updatedAt: updated(0, 15)
		},
		{
			id: 9,
			title: "Modul Baru FinSight",
			meta: "FinSight",
			status: "in_progress",
			priority: "high",
			startDate: toISODate(addDays(monthStart, 1)),
			deadline: toISODate(addDays(monthStart, 18)),
			pic: "Alamsyah Putra",
			updatedAt: updated(-2, 12)
		},
		{
			id: 10,
			title: "Validasi Data GBO",
			meta: "GBO Dashboard",
			status: "open",
			priority: "medium",
			startDate: toISODate(addDays(monthStart, 10)),
			deadline: toISODate(addDays(monthStart, 20)),
			pic: "Panji Pujianto",
			updatedAt: updated(-1, 10)
		},
		{
			id: 11,
			title: "Escalate stalled vendor sync",
			meta: "Vendor",
			status: "open",
			priority: "high",
			startDate: toISODate(addDays(today, -8)),
			deadline: toISODate(addDays(today, -5)),
			pic: "Panji Pujianto",
			updatedAt: updated(0, 6)
		},
		{
			id: 12,
			title: "Prepare October EDM cutover",
			meta: "EDM Core",
			status: "open",
			priority: "high",
			startDate: toISODate(addDays(monthStart, 20)),
			deadline: toISODate(addDays(monthStart, 28)),
			pic: "Asep Wahyudi",
			updatedAt: updated(0, 9)
		},
		{
			id: 13,
			title: "Daily standup notes publish",
			meta: "CX Dashboard",
			status: "done",
			priority: "low",
			startDate: toISODate(today),
			deadline: toISODate(today),
			pic: "Alamsyah Putra",
			updatedAt: updated(0, 11)
		},
		{
			id: 14,
			title: "Patch TRAXIS alert routing",
			meta: "TRAXIS",
			status: "in_progress",
			priority: "medium",
			startDate: toISODate(addDays(week, 2)),
			deadline: toISODate(addDays(week, 5)),
			pic: "Alamsyah Putra",
			updatedAt: updated(-1, 17)
		},
		{
			id: 15,
			title: "GARD capacity snapshot",
			meta: "GARD",
			status: "done",
			priority: "low",
			startDate: toISODate(addDays(monthStart, 2)),
			deadline: toISODate(addDays(monthStart, 6)),
			pic: "Maggie Arsyad",
			updatedAt: updated(-5, 9)
		},
		{
			id: 16,
			title: "Hari ini: cek pipeline ingest",
			meta: "GBO Dashboard",
			status: "in_progress",
			priority: "high",
			startDate: toISODate(today),
			deadline: toISODate(today),
			pic: "Alamsyah Putra",
			updatedAt: updated(0, 12)
		}
	];
}
/** @returns {FeTask[]} */
function loadTasks() {
	if (typeof localStorage === "undefined") return seedTasks();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return seedTasks();
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed) || parsed.length === 0) return seedTasks();
		return parsed.map((t) => ({
			priority: "medium",
			updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			...t
		}));
	} catch {
		return seedTasks();
	}
}
loadTasks();
var weekDayLabels = [
	"Sen",
	"Sel",
	"Rab",
	"Kam",
	"Jum",
	"Sab",
	"Min"
];
/**
* Fixed W1–W4 buckets inside a calendar month:
* W1 1–7, W2 8–14, W3 15–21, W4 22–akhir bulan
* @param {number} year
* @param {number} monthIndex 0–11
*/
function fourWeeksOfMonth(year, monthIndex) {
	const lastDay = new Date(year, monthIndex + 1, 0).getDate();
	return [
		[1, Math.min(7, lastDay)],
		[8, Math.min(14, lastDay)],
		[15, Math.min(21, lastDay)],
		[22, lastDay]
	].filter(([startDay]) => startDay <= lastDay).map(([startDay, endDay], i) => ({
		key: `${year}-${monthIndex + 1}-W${i + 1}`,
		label: `W${i + 1}`,
		weekNo: i + 1,
		start: new Date(year, monthIndex, startDay),
		end: new Date(year, monthIndex, endDay)
	}));
}
/**
* @param {number} year
* @param {number} monthIndex 0–11
*/
function weeksOfMonth(year, monthIndex) {
	return fourWeeksOfMonth(year, monthIndex);
}
/** Day buckets for current ISO week (Sen–Min) */
/** @param {Date} [ref] */
function daysOfWeek(ref = /* @__PURE__ */ new Date()) {
	const start = startOfWeek(ref);
	return weekDayLabels.map((label, i) => {
		const day = addDays(start, i);
		return {
			key: toISODate(day),
			label,
			weekNo: i + 1,
			start: day,
			end: day
		};
	});
}
/** Single-day bucket for "Hari ini" */
/** @param {Date} [ref] */
function dayBucket(ref = /* @__PURE__ */ new Date()) {
	const day = startOfDay(ref);
	return [{
		key: toISODate(day),
		label: "Hari ini",
		weekNo: 1,
		start: day,
		end: day
	}];
}
/** @param {number} year @param {number} monthIndex */
function monthLabel(year, monthIndex) {
	return new Date(year, monthIndex, 1).toLocaleDateString("id-ID", {
		month: "long",
		year: "numeric"
	});
}
/** Which bucket (0…n) contains a date */
/** @param {Date} date @param {{ start: Date, end: Date }[]} weeks */
function weekIndexForDate(date, weeks) {
	const t = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
	const idx = weeks.findIndex((w) => t >= w.start.getTime() && t <= w.end.getTime());
	return idx >= 0 ? idx : 0;
}
/**
* Place a task bar across arbitrary day/week buckets.
* @param {FeTask} task
* @param {{ start: Date, end: Date }[]} weeks
*/
function barInMonthWeeks(task, weeks) {
	const n = weeks.length;
	if (!n) return null;
	const rangeStart = weeks[0].start.getTime();
	const rangeEnd = addDays(weeks[n - 1].end, 1).getTime();
	const start = /* @__PURE__ */ new Date(`${task.startDate}T00:00:00`);
	let end = /* @__PURE__ */ new Date(`${task.deadline}T00:00:00`);
	if (end < start) end = new Date(start);
	const clipStart = Math.max(start.getTime(), rangeStart);
	const clipEnd = Math.min(addDays(end, 1).getTime(), rangeEnd);
	if (clipEnd <= clipStart) return null;
	const span = rangeEnd - rangeStart || 1;
	return {
		left: (clipStart - rangeStart) / span * 100,
		width: Math.max((clipEnd - clipStart) / span * 100, 100 / n / 5)
	};
}
/** @param {FeTask[]} list @param {{ start: Date, end: Date }[]} weeks */
function tasksInMonthWeeks(list, weeks) {
	/** @type {{ task: FeTask, bar: { left: number, width: number } }[]} */
	const out = [];
	for (const task of list) {
		const bar = barInMonthWeeks(task, weeks);
		if (bar) out.goto({
			task,
			bar
		});
	}
	return out;
}
//#endregion
//#region src/lib/pages/Beranda.svelte
function Beranda($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		/**
		* Adapt module task → shape dipakai timeline helpers (startDate/meta/updatedAt).
		* @param {{ id: number, title: string, dashboard: string, status: string, created_at: string, deadline: string, pic: string, priority: string, updated_at: string }} t
		*/
		function toBoardTask(t) {
			return {
				id: t.id,
				title: t.title,
				meta: t.dashboard,
				status: t.status,
				startDate: String(t.created_at || t.deadline).slice(0, 10),
				deadline: t.deadline,
				pic: t.pic,
				priority: t.priority,
				updatedAt: t.updated_at
			};
		}
		const hour = (/* @__PURE__ */ new Date()).getHours();
		const greet = hour < 11 ? "Good morning" : hour < 15 ? "Good afternoon" : hour < 18 ? "Good evening" : "Good night";
		/** @type {'today' | 'week' | 'month'} */
		let period = "month";
		const session = derived(() => {
			taskModuleStore.session;
			return taskModuleStore.session;
		});
		const periodOptions = [
			{
				id: "today",
				label: "Today"
			},
			{
				id: "week",
				label: "This week"
			},
			{
				id: "month",
				label: "This month"
			}
		];
		const feedOptions = [{
			id: "tasks",
			label: "Task"
		}, {
			id: "activity",
			label: "Aktivitas"
		}];
		const deadlineOptions = [{
			id: "upcoming",
			label: "Mendatang"
		}, {
			id: "overdue",
			label: "Overdue"
		}];
		const boardOptions = [{
			id: "task",
			label: "Task"
		}, {
			id: "requirement",
			label: "Requirements"
		}];
		const chartOptions = [{
			id: "requirement",
			label: "Requirements"
		}, {
			id: "dashboard",
			label: "Dashboard"
		}];
		/** @type {'task' | 'requirement'} */
		let boardView = "task";
		/** @param {import('../lib/requirementStore.svelte.js').Requirement} r */
		function toBoardRequirement(r) {
			return {
				id: r.id,
				title: r.title,
				meta: r.dashboard,
				status: r.status,
				startDate: String(r.created_at || r.due_date).slice(0, 10),
				deadline: r.due_date || String(r.created_at).slice(0, 10),
				pic: r.team[0] || r.created_by || "—",
				priority: "",
				updatedAt: r.updated_at
			};
		}
		const now = /* @__PURE__ */ new Date();
		const todayISO = toISODate(now);
		const range = derived(() => periodRange(period, now));
		/** Semua task Kanban (pipeline 6 status) */
		const allBoardTasks = derived(() => {
			taskModuleStore.items;
			return taskModuleStore.items.map(toBoardTask);
		});
		const scopedTasks = derived(() => tasksInRange(allBoardTasks(), range().start, range().end));
		/** Feed & deadline — global, tidak ikut filter periode */
		const globalTasks = derived(allBoardTasks);
		const horizonISO = toISODate(addDays(now, 7));
		const overdueTasks = derived(() => globalTasks().filter((t) => isOverdue(t)).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 8).map((t) => ({
			id: t.id,
			title: t.title,
			pic: t.pic,
			deadline: t.deadline,
			status: t.status,
			delay: delayLabel(t.deadline, now)
		})));
		const upcomingDeadlines = derived(() => globalTasks().filter((t) => t.deadline >= todayISO && t.deadline <= horizonISO && t.status !== "selesai").sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 8).map((t) => ({
			id: t.id,
			title: t.title,
			pic: t.pic,
			deadline: t.deadline,
			priority: t.priority === "high" ? "High" : t.priority === "low" ? "Low" : "Medium"
		})));
		const newestTasks = derived(() => [...globalTasks()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 6).map((t) => ({
			id: t.id,
			title: t.title,
			when: relativeWhen(t.updatedAt, now),
			status: t.status
		})));
		const recentActivities = derived(() => [...globalTasks()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 6).map((t) => {
			const action = t.status === "selesai" ? "menyelesaikan" : t.status === "backlog" ? "menambahkan task" : isOverdue(t) ? "menandai overdue" : `update ${workflowLabel(t.status)}`;
			const whenDate = new Date(t.updatedAt);
			const when = toISODate(whenDate) === todayISO ? whenDate.toLocaleTimeString("id-ID", {
				hour: "2-digit",
				minute: "2-digit"
			}) : relativeWhen(t.updatedAt, now);
			return {
				who: t.pic,
				action,
				target: t.title,
				when
			};
		}));
		/** @type {'overdue' | 'upcoming'} */
		let deadlineTab = "upcoming";
		/** @type {'tasks' | 'activity'} */
		let feedTab = "tasks";
		const heroStats = derived(() => {
			const deadlineToday = scopedTasks().filter((t) => t.deadline === todayISO && t.status !== "selesai").length;
			const dueOrPast = scopedTasks().filter((t) => t.deadline <= todayISO);
			return {
				deadlineToday,
				onTime: dueOrPast.length === 0 ? 100 : Math.round(100 * dueOrPast.filter((t) => t.status === "selesai").length / dueOrPast.length)
			};
		});
		const metrics = derived(() => {
			const total = scopedTasks().length;
			const aktif = scopedTasks().filter((t) => t.status !== "selesai").length;
			const overdue = scopedTasks().filter((t) => isOverdue(t)).length;
			const done = scopedTasks().filter((t) => t.status === "selesai").length;
			const dashboards = new Set(scopedTasks().map((t) => t.meta)).size;
			const periodNote = period === "today" ? "today" : period === "week" ? "this week" : "this month";
			return [
				{
					label: "Total Dashboard",
					value: String(dashboards),
					note: `${dashboards} sumber · ${periodNote}`,
					icon: "dash",
					tone: "mint",
					go: () => pushTaskFilters({}, "board")
				},
				{
					label: "Total Task",
					value: String(total),
					note: `semua status · ${periodNote}`,
					icon: "task",
					tone: "peach",
					go: () => pushTaskFilters({})
				},
				{
					label: "Task Aktif",
					value: String(aktif),
					note: "belum selesai · pipeline Kanban",
					icon: "aktif",
					tone: "sky",
					go: () => pushTaskFilters({ aktif: "yes" })
				},
				{
					label: "Task Overdue",
					value: String(overdue),
					note: overdue ? `melewati deadline` : "aman",
					icon: "alert",
					tone: "rose",
					go: () => pushTaskFilters({ overdue: "yes" })
				},
				{
					label: "Task Selesai",
					value: String(done),
					note: total ? `${Math.round(100 * done / total)}% dari total` : "dari total task",
					icon: "done",
					tone: "sand",
					go: () => pushTaskFilters({ status: "selesai" })
				}
			];
		});
		const requirementLabels = [
			"Open",
			"In progress",
			"Selesai"
		];
		const requirementColors = [
			"#94a3b8",
			"#065fc6",
			"#2f7a52"
		];
		let chartDashboard = "";
		/** @type {'requirement' | 'dashboard'} */
		let chartView = "requirement";
		const chartDashboards = derived(() => {
			requirementStore.items;
			return requirementDashboardOptions();
		});
		const requirementSeries = derived(() => {
			requirementStore.items;
			const source = requirementStore.items;
			const list = tasksInRange(source.map(toBoardRequirement), range().start, range().end);
			return [
				list.filter((r) => r.status === "open").length,
				list.filter((r) => r.status === "in_progress").length,
				list.filter((r) => r.status === "done").length
			];
		});
		const dashboardBarColors = [
			"#065fc6",
			"#339ef5",
			"#7c6bc4",
			"#e0a45a",
			"#2f7a52",
			"#94a3b8"
		];
		const dashboardBar = derived(() => {
			/** @type {Map<string, number>} */
			const counts = /* @__PURE__ */ new Map();
			for (const task of scopedTasks()) {
				const name = task.meta || "—";
				counts.set(name, (counts.get(name) || 0) + 1);
			}
			const names = [...counts.keys()].sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0) || a.localeCompare(b));
			return {
				labels: names,
				series: names.map((name) => counts.get(name) || 0),
				colors: names.map((_, i) => dashboardBarColors[i % dashboardBarColors.length])
			};
		});
		const activeChart = derived(() => ({
			labels: requirementLabels,
			series: requirementSeries(),
			colors: requirementColors,
			type: "donut"
		}));
		const chartLegend = derived(() => {
			const total = activeChart().series.reduce((a, b) => a + b, 0) || 1;
			return activeChart().labels.map((label, i) => {
				const value = activeChart().series[i] ?? 0;
				return {
					label,
					value,
					pct: Math.round(value / total * 100),
					color: activeChart().colors[i] ?? "#9a9aa0"
				};
			});
		});
		/** Axis buckets depend on period — drives Task per week visual */
		const boardBuckets = derived(() => {
			if (period === "today") return dayBucket(now);
			if (period === "week") return daysOfWeek(now);
			return weeksOfMonth(now.getFullYear(), now.getMonth());
		});
		const boardTitle = derived(() => {
			if (period === "today") return now.toLocaleDateString("id-ID", {
				weekday: "long",
				day: "numeric",
				month: "long"
			});
			if (period === "week") {
				const start = boardBuckets()[0]?.start;
				const end = boardBuckets()[boardBuckets().length - 1]?.end;
				if (!start || !end) return "This week";
				return `${start.getDate()}–${end.getDate()} ${end.toLocaleDateString("id-ID", {
					month: "long",
					year: "numeric"
				})}`;
			}
			return monthLabel(now.getFullYear(), now.getMonth());
		});
		const boardNoun = derived(() => boardView === "requirement" ? "Requirements" : "Tasks");
		const boardUnit = derived(() => boardView === "requirement" ? "requirement" : "task");
		const boardHeading = derived(() => period === "today" ? `${boardNoun()} today` : period === "week" ? `${boardNoun()} per day` : `${boardNoun()} per week`);
		const weekCount = derived(() => boardBuckets().length || 1);
		const currentWeekIdx = derived(() => weekIndexForDate(now, boardBuckets()));
		const todayPct = derived(() => {
			if (currentWeekIdx() < 0 || !boardBuckets().length) return -1;
			const rangeStart = boardBuckets()[0].start.getTime();
			const rangeEnd = addDays(boardBuckets()[boardBuckets().length - 1].end, 1).getTime();
			const t = (/* @__PURE__ */ new Date(`${todayISO}T00:00:00`)).getTime();
			if (t < rangeStart || t >= rangeEnd) return -1;
			return (t - rangeStart) / (rangeEnd - rangeStart) * 100;
		});
		const todayChip = derived(() => now.toLocaleDateString("id-ID", {
			weekday: "short",
			day: "numeric",
			month: "short"
		}));
		const axisWeeks = derived(() => boardBuckets().map((w, i) => {
			if (period === "today") return {
				...w,
				range: now.toLocaleDateString("id-ID", {
					day: "numeric",
					month: "short",
					year: "numeric"
				}),
				isCurrent: true
			};
			if (period === "week") return {
				...w,
				range: String(w.start.getDate()),
				isCurrent: i === currentWeekIdx()
			};
			const startMo = w.start.toLocaleDateString("id-ID", { month: "short" });
			const endMo = w.end.toLocaleDateString("id-ID", { month: "short" });
			const rangeLabel = startMo === endMo ? `${w.start.getDate()}–${w.end.getDate()} ${startMo}` : `${w.start.getDate()} ${startMo} – ${w.end.getDate()} ${endMo}`;
			return {
				...w,
				range: rangeLabel,
				isCurrent: i === currentWeekIdx()
			};
		}));
		const requirementBoard = derived(() => {
			requirementStore.items;
			return requirementStore.items.map(toBoardRequirement);
		});
		const weekSource = derived(() => boardView === "requirement" ? tasksInRange(requirementBoard(), range().start, range().end) : scopedTasks());
		const weekItems = derived(() => tasksInMonthWeeks(weekSource(), boardBuckets()));
		/** @type {{ task: { id: number, title: string, meta: string, status: string, startDate: string, deadline: string, pic: string }, x: number, y: number } | null} */
		let taskTip = null;
		/** @param {{ left: number, width: number }} bar @param {string} status */
		function weekBarStyle(bar, status = "backlog") {
			const left = Math.max(0, Math.min(bar.left, 98));
			return `left:${left}%;width:${Math.max(2, Math.min(bar.width, 100 - left))}%;--ev:${boardView === "requirement" ? requirementColor(status) : workflowStatusColor(status)}`;
		}
		/** @param {string} status */
		function requirementColor(status) {
			if (status === "done") return "#2f7a52";
			if (status === "in_progress") return "#065fc6";
			return "#94a3b8";
		}
		/** @param {string} status */
		function barProgress(status) {
			if (boardView !== "requirement") return workflowProgressSolid(status);
			if (status === "done") return 1;
			if (status === "in_progress") return .62;
			return .28;
		}
		/** @param {string} status */
		function statusLabel(status) {
			if (boardView !== "requirement") return workflowLabel(status);
			if (status === "done") return "Selesai";
			if (status === "in_progress") return "In progress";
			return "Open";
		}
		/** @param {string} date */
		function formatDate(date) {
			return (/* @__PURE__ */ new Date(date + "T00:00:00")).toLocaleDateString("id-ID", {
				day: "numeric",
				month: "short",
				year: "numeric"
			});
		}
		/** @param {string} name */
		function initials(name) {
			return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
		}
		/** @param {string} name */
		function faceTone(name) {
			const tones = [
				"rose",
				"sky",
				"soft",
				"mint",
				"sand"
			];
			let h = 0;
			for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % tones.length;
			return tones[h];
		}
		$$renderer.push(`<section class="beranda svelte-1agm3et"><header class="page-header svelte-1agm3et"><div class="topbar svelte-1agm3et"><a href="/" class="brand-logo svelte-1agm3et" aria-label="EDM Task Monitoring" title="EDM Task Monitoring"><img${attr("src", edm_logo_default)} alt="EDM Task Monitoring" class="svelte-1agm3et"/></a> <div class="period-slot svelte-1agm3et">`);
		GlassSwitch($$renderer, {
			label: "Time range",
			options: periodOptions,
			value: period,
			onchange: (id) => period = id
		});
		$$renderer.push(`<!----></div> <div class="topbar-right svelte-1agm3et">`);
		NotificationBell($$renderer, {});
		$$renderer.push(`<!----> <button type="button" class="circle-tool svelte-1agm3et" aria-label="Bantuan"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="svelte-1agm3et"><circle cx="12" cy="12" r="7.25" stroke="currentColor" stroke-width="1.7"></circle><path d="M9.8 9.6a2.2 2.2 0 1 1 3.5 1.8c-.7.5-1.3 1-1.3 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path><circle cx="12" cy="16.4" r="0.9" fill="currentColor"></circle></svg></button> `);
		ProfileSwitcher($$renderer, {
			name: session().name,
			label: session().label,
			avatar: avatar_farras_default,
			currentId: session().id
		});
		$$renderer.push(`<!----></div></div> <div class="headline svelte-1agm3et"><div class="headline-copy svelte-1agm3et"><p class="hero-sub svelte-1agm3et">Let's make this day productive.</p> <h1 class="hero-greet svelte-1agm3et">${escape_html(greet)}, ${escape_html(session().name.split(" ")[0])}!</h1></div> <div class="headline-meta svelte-1agm3et"><div class="hero-stats svelte-1agm3et"><div class="stat svelte-1agm3et"><span class="svelte-1agm3et">Deadline hari ini</span> <div class="svelte-1agm3et"><strong class="svelte-1agm3et">${escape_html(heroStats().deadlineToday)}</strong></div></div> <div class="stat svelte-1agm3et"><span class="svelte-1agm3et">On-time rate</span> <div class="svelte-1agm3et"><strong class="svelte-1agm3et">${escape_html(heroStats().onTime)}%</strong><em class="up svelte-1agm3et">↗</em></div></div></div></div></div></header> <div class="metrics-rail liquidGlass-wrapper svelte-1agm3et"><div class="liquidGlass-effect"></div> <div class="liquidGlass-tint"></div> <div class="liquidGlass-shine"></div> <div class="metrics svelte-1agm3et"><!---->`);
		{
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(metrics());
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let m = each_array[i];
				$$renderer.push(`<button type="button"${attr_class(`metric-card liquidGlass-wrapper ${stringify(m.tone)} clickable`, "svelte-1agm3et")}><div class="liquidGlass-effect svelte-1agm3et"></div> <div class="liquidGlass-tint svelte-1agm3et"></div> <div class="liquidGlass-shine svelte-1agm3et"></div> <div class="metric-top svelte-1agm3et"><span class="metric-label svelte-1agm3et">${escape_html(m.label)}</span></div> <div class="metric-mid svelte-1agm3et"><strong class="metric-value svelte-1agm3et">${escape_html(m.value)}</strong> <div class="metric-icon svelte-1agm3et" aria-hidden="true">`);
				if (m.icon === "dash") $$renderer.push(`<!--[0--><svg viewBox="0 0 24 24" fill="none" class="svelte-1agm3et"><path d="M7 8h10M7 12h6M8.5 5.5h7A1.5 1.5 0 0 1 17 7v11.2l-5-2.4-5 2.4V7A1.5 1.5 0 0 1 8.5 5.5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path></svg>`);
				else if (m.icon === "task") $$renderer.push(`<!--[1--><svg viewBox="0 0 24 24" fill="none" class="svelte-1agm3et"><rect x="4.5" y="4.5" width="6.2" height="6.2" rx="1.4" stroke="currentColor" stroke-width="1.7"></rect><rect x="13.3" y="4.5" width="6.2" height="6.2" rx="1.4" stroke="currentColor" stroke-width="1.7"></rect><rect x="4.5" y="13.3" width="6.2" height="6.2" rx="1.4" stroke="currentColor" stroke-width="1.7"></rect><rect x="13.3" y="13.3" width="6.2" height="6.2" rx="1.4" stroke="currentColor" stroke-width="1.7"></rect></svg>`);
				else if (m.icon === "aktif") $$renderer.push(`<!--[2--><svg viewBox="0 0 24 24" fill="none" class="svelte-1agm3et"><path d="M5 12.5 9.2 17 19 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>`);
				else if (m.icon === "done") $$renderer.push(`<!--[3--><svg viewBox="0 0 24 24" fill="none" class="svelte-1agm3et"><path d="M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Z" stroke="currentColor" stroke-width="1.7"></path><path d="m8.8 12.2 2.1 2.1 4.3-4.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path></svg>`);
				else $$renderer.push(`<!--[-1--><svg viewBox="0 0 24 24" fill="none" class="svelte-1agm3et"><path d="M12 8v5M12 16.2h.01M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg>`);
				$$renderer.push(`<!--]--></div></div> <small class="metric-note svelte-1agm3et">${escape_html(m.note)}</small></button>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!----></div></div> <div class="main-grid svelte-1agm3et"><div class="panel-glow svelte-1agm3et"><article class="panel chart-panel svelte-1agm3et"><div class="panel-head compact chart-head svelte-1agm3et"><div class="chart-head-top svelte-1agm3et"><div class="head-copy svelte-1agm3et"><h2 class="svelte-1agm3et">${escape_html(chartView === "dashboard" ? "Dashboard" : "Requirements")}</h2> <p class="sub svelte-1agm3et">`);
		if (chartView === "dashboard") $$renderer.push(`<!--[0-->Jumlah task per dashboard`);
		else $$renderer.push(`<!--[-1-->Open · In progress · Selesai${escape_html("")}`);
		$$renderer.push(`<!--]--></p></div> `);
		GlassSwitch($$renderer, {
			class: "compact",
			label: "Jenis chart",
			options: chartOptions,
			value: chartView,
			onchange: (id) => chartView = id
		});
		$$renderer.push(`<!----></div> `);
		if (chartView === "requirement") {
			$$renderer.push(`<!--[0--><label class="chart-dash svelte-1agm3et"><span class="svelte-1agm3et">Dashboard</span> `);
			$$renderer.select({
				value: chartDashboard,
				class: ""
			}, ($$renderer) => {
				$$renderer.option({ value: "" }, ($$renderer) => {
					$$renderer.push(`Semua`);
				});
				$$renderer.push(`<!--[-->`);
				const each_array_1 = ensure_array_like(chartDashboards());
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let name = each_array_1[$$index_1];
					$$renderer.option({ value: name }, ($$renderer) => {
						$$renderer.push(`${escape_html(name)}`);
					});
				}
				$$renderer.push(`<!--]-->`);
			}, "svelte-1agm3et");
			$$renderer.push(`</label>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> `);
		if (chartView === "dashboard") {
			$$renderer.push(`<!--[0--><div class="chart-box svelte-1agm3et"><div class="chart-plot bars svelte-1agm3et">`);
			if (dashboardBar().labels.length) {
				$$renderer.push("<!--[0-->");
				OpsChart($$renderer, {
					type: "bar",
					horizontal: true,
					unit: "task",
					labels: dashboardBar().labels,
					series: dashboardBar().series,
					colors: dashboardBar().colors
				});
			} else $$renderer.push(`<!--[-1--><p class="sub svelte-1agm3et">Belum ada task pada periode ini.</p>`);
			$$renderer.push(`<!--]--></div></div>`);
		} else {
			$$renderer.push(`<!--[-1--><div class="chart-box split svelte-1agm3et"><div class="chart-plot svelte-1agm3et">`);
			OpsChart($$renderer, {
				type: activeChart().type,
				labels: activeChart().labels,
				series: activeChart().series,
				colors: activeChart().colors,
				unit: "requirement"
			});
			$$renderer.push(`<!----></div> <ul class="chart-legend side-legend svelte-1agm3et"><!--[-->`);
			const each_array_2 = ensure_array_like(chartLegend());
			for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
				let item = each_array_2[$$index_2];
				$$renderer.push(`<li class="svelte-1agm3et"><div class="legend-item svelte-1agm3et"><span class="swatch svelte-1agm3et"${attr_style(`background:${stringify(item.color)}`)}></span> <div class="legend-copy svelte-1agm3et"><strong class="svelte-1agm3et">${escape_html(item.label)}</strong> <!---->`);
				$$renderer.push(`<small class="svelte-1agm3et">${escape_html(item.value)} requirement</small>`);
				$$renderer.push(`<!----></div></div></li>`);
			}
			$$renderer.push(`<!--]--></ul></div>`);
		}
		$$renderer.push(`<!--]--></article></div> <div class="panel-glow svelte-1agm3et"><article class="panel activity-panel svelte-1agm3et"><div class="panel-head compact week-head svelte-1agm3et"><div class="head-copy"><h2 class="svelte-1agm3et">${escape_html(boardHeading())}</h2> <p class="sub svelte-1agm3et">${escape_html(boardTitle())} · ${escape_html(weekItems().length)} ${escape_html(boardUnit())}</p></div> <div class="head-tools week-tools svelte-1agm3et">`);
		GlassSwitch($$renderer, {
			class: "compact",
			label: "Timeline source",
			options: boardOptions,
			value: boardView,
			onchange: (id) => {
				boardView = id;
				taskTip = null;
			}
		});
		$$renderer.push(`<!----></div></div> <!---->`);
		{
			$$renderer.push(`<div class="day-canvas svelte-1agm3et"><div class="day-axis week-axis svelte-1agm3et"${attr_style(`grid-template-columns: repeat(${stringify(weekCount())}, minmax(0, 1fr))`)}><!--[-->`);
			const each_array_3 = ensure_array_like(axisWeeks());
			for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
				let w = each_array_3[$$index_3];
				$$renderer.push(`<span${attr_class("svelte-1agm3et", void 0, { "now": w.isCurrent })}><strong class="svelte-1agm3et">${escape_html(w.label)}</strong> <small class="svelte-1agm3et">${escape_html(w.range)}</small></span>`);
			}
			$$renderer.push(`<!--]--></div> <div class="day-board svelte-1agm3et"><div class="day-grid svelte-1agm3et" aria-hidden="true"><!--[-->`);
			const each_array_4 = ensure_array_like(boardBuckets());
			for (let i = 0, $$length = each_array_4.length; i < $$length; i++) {
				each_array_4[i];
				$$renderer.push(`<span${attr_class("grid-band svelte-1agm3et", void 0, {
					"alt": i % 2 === 1,
					"current": i === currentWeekIdx()
				})}${attr_style(`left:${stringify(i / weekCount() * 100)}%;width:${stringify(1 / weekCount() * 100)}%`)}></span> <span class="grid-line svelte-1agm3et"${attr_style(`left:${stringify(i / weekCount() * 100)}%`)}></span>`);
			}
			$$renderer.push(`<!--]--> <span class="grid-line svelte-1agm3et" style="left:100%"></span></div> `);
			if (todayPct() >= 0) $$renderer.push(`<!--[0--><div${attr_class("now-marker svelte-1agm3et", void 0, {
				"near-start": todayPct() < 14,
				"near-end": todayPct() > 86
			})}${attr_style(`left:${stringify(todayPct())}%`)}><span class="now-chip svelte-1agm3et">${escape_html(todayChip())}</span> <i class="svelte-1agm3et"></i> <b class="svelte-1agm3et"></b></div>`);
			else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="day-tracks svelte-1agm3et"><!---->`);
			$$renderer.push(`<div class="track-set">`);
			if (weekItems().length === 0) $$renderer.push(`<!--[0--><div class="week-empty svelte-1agm3et"><p>Belum ada ${escape_html(boardUnit())} di ${escape_html(boardTitle())}</p></div>`);
			else {
				$$renderer.push(`<!--[-1--><!--[-->`);
				const each_array_5 = ensure_array_like(weekItems());
				for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
					let item = each_array_5[$$index_5];
					$$renderer.push(`<div class="day-row svelte-1agm3et"><div class="event svelte-1agm3et"${attr_style(weekBarStyle(item.bar, item.task.status))} role="button" tabindex="0"${attr("aria-label", item.task.title)}><div class="event-solid svelte-1agm3et"${attr_style(`flex:${stringify(barProgress(item.task.status))}`)}><div class="event-copy svelte-1agm3et"><strong class="svelte-1agm3et">${escape_html(item.task.title)}</strong> <small class="svelte-1agm3et">${escape_html(item.task.meta)} · ${escape_html(statusLabel(item.task.status))}</small></div> <div class="event-people svelte-1agm3et"><span class="face-mini svelte-1agm3et">${escape_html(initials(item.task.pic))}</span></div></div> `);
					if (barProgress(item.task.status) < 1) $$renderer.push(`<!--[0--><div class="event-ghost svelte-1agm3et"${attr_style(`flex:${stringify(1 - barProgress(item.task.status))}`)}></div>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div></div>`);
				}
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></div>`);
			$$renderer.push(`<!----></div></div></div>`);
		}
		$$renderer.push(`<!----></article></div> `);
		if (taskTip) $$renderer.push(`<!--[0--><div class="task-tip-pos svelte-1agm3et"${attr_style(`left:${stringify(taskTip.x)}px;top:${stringify(taskTip.y)}px`)}><div class="task-tip svelte-1agm3et" role="tooltip"><div class="task-tip-head svelte-1agm3et"><strong class="svelte-1agm3et">${escape_html(taskTip.task.title)}</strong> <span class="chip status svelte-1agm3et"${attr_style(`background:color-mix(in srgb, ${stringify(boardView === "requirement" ? requirementColor(taskTip.task.status) : workflowStatusColor(taskTip.task.status))} 18%, #fff);color:${stringify(boardView === "requirement" ? requirementColor(taskTip.task.status) : workflowStatusColor(taskTip.task.status))}`)}>${escape_html(statusLabel(taskTip.task.status))}</span></div> <dl class="task-tip-meta svelte-1agm3et"><div class="svelte-1agm3et"><dt class="svelte-1agm3et">Dashboard</dt><dd class="svelte-1agm3et">${escape_html(taskTip.task.meta)}</dd></div> <div class="svelte-1agm3et"><dt class="svelte-1agm3et">PIC</dt><dd class="svelte-1agm3et">${escape_html(taskTip.task.pic)}</dd></div> <div class="svelte-1agm3et"><dt class="svelte-1agm3et">Start</dt><dd class="svelte-1agm3et">${escape_html(formatDate(taskTip.task.startDate))}</dd></div> <div class="svelte-1agm3et"><dt class="svelte-1agm3et">Deadline</dt><dd class="svelte-1agm3et">${escape_html(formatDate(taskTip.task.deadline))}</dd></div></dl></div></div>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="panel-glow svelte-1agm3et"><article class="panel feed-panel svelte-1agm3et"><div class="panel-head compact svelte-1agm3et"><div class="head-copy"><h2 class="svelte-1agm3et">Update Terbaru</h2> <p class="sub svelte-1agm3et">`);
		if (feedTab === "tasks") $$renderer.push(`<!--[0-->Baru dibuat / di-update`);
		else $$renderer.push(`<!--[-1-->Log operasional`);
		$$renderer.push(`<!--]--></p></div> <div class="head-tools svelte-1agm3et">`);
		GlassSwitch($$renderer, {
			class: "compact",
			label: "Filter update",
			options: feedOptions,
			value: feedTab,
			onchange: (id) => feedTab = id
		});
		$$renderer.push(`<!----></div></div> <!---->`);
		$$renderer.push(`<div class="table-wrap svelte-1agm3et">`);
		if (feedTab === "tasks") {
			$$renderer.push(`<!--[0--><table class="modern-table feed-table svelte-1agm3et"><thead class="svelte-1agm3et"><tr><th class="col-id svelte-1agm3et">ID</th><th class="svelte-1agm3et">Task</th><th class="col-when svelte-1agm3et">Update</th><th class="col-status svelte-1agm3et">Status</th></tr></thead><tbody class="svelte-1agm3et"><!--[-->`);
			const each_array_6 = ensure_array_like(newestTasks().slice(0, 4));
			for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
				let item = each_array_6[$$index_6];
				$$renderer.push(`<tr class="svelte-1agm3et"><td class="col-id svelte-1agm3et"><span class="mono-id svelte-1agm3et">#${escape_html(item.id)}</span></td><td class="svelte-1agm3et"><button type="button" class="task-link svelte-1agm3et">${escape_html(item.title)}</button></td><td class="col-when svelte-1agm3et"><span class="muted svelte-1agm3et">${escape_html(item.when)}</span></td><td class="col-status svelte-1agm3et"><span class="status-text svelte-1agm3et"${attr_style(`color:${stringify(workflowStatusColor(item.status))}`)}>${escape_html(statusLabel(item.status))}</span></td></tr>`);
			}
			$$renderer.push(`<!--]--></tbody></table>`);
		} else {
			$$renderer.push(`<!--[-1--><table class="modern-table feed-table activity-table svelte-1agm3et"><thead class="svelte-1agm3et"><tr><th class="svelte-1agm3et">PIC</th><th class="svelte-1agm3et">Aktivitas</th><th class="col-when svelte-1agm3et">Waktu</th></tr></thead><tbody class="svelte-1agm3et"><!--[-->`);
			const each_array_7 = ensure_array_like(recentActivities().slice(0, 4));
			for (let $$index_7 = 0, $$length = each_array_7.length; $$index_7 < $$length; $$index_7++) {
				let item = each_array_7[$$index_7];
				$$renderer.push(`<tr class="svelte-1agm3et"><td class="svelte-1agm3et"><span class="pic svelte-1agm3et"><i${attr_class(`face ${stringify(faceTone(item.who))}`, "svelte-1agm3et")}>${escape_html(initials(item.who))}</i> ${escape_html(item.who)}</span></td><td class="svelte-1agm3et"><span class="activity-line svelte-1agm3et">${escape_html(item.action)} <em class="svelte-1agm3et">${escape_html(item.target)}</em></span></td><td class="col-when svelte-1agm3et"><span class="muted svelte-1agm3et">${escape_html(item.when)}</span></td></tr>`);
			}
			$$renderer.push(`<!--]--></tbody></table>`);
		}
		$$renderer.push(`<!--]--></div>`);
		$$renderer.push(`<!----></article></div> <div class="panel-glow svelte-1agm3et"><article class="panel deadline-panel svelte-1agm3et"><div class="panel-head compact svelte-1agm3et"><div class="head-copy"><h2 class="svelte-1agm3et">Fokus Deadline</h2> <p${attr_class("sub svelte-1agm3et", void 0, { "alert": deadlineTab === "overdue" })}>`);
		if (deadlineTab === "overdue") $$renderer.push(`<!--[0-->${escape_html(overdueTasks().length)} overdue`);
		else $$renderer.push(`<!--[-1-->7 hari ke depan`);
		$$renderer.push(`<!--]--></p></div> <div class="head-tools svelte-1agm3et"><button type="button" class="deadline-go svelte-1agm3et">Lihat list</button> `);
		GlassSwitch($$renderer, {
			class: "compact",
			label: "Filter deadline",
			options: deadlineOptions,
			value: deadlineTab,
			onchange: (id) => deadlineTab = id
		});
		$$renderer.push(`<!----></div></div> <!---->`);
		$$renderer.push(`<div class="table-wrap svelte-1agm3et">`);
		if (deadlineTab === "overdue") {
			$$renderer.push(`<!--[0--><table class="modern-table deadline-table svelte-1agm3et"><thead class="svelte-1agm3et"><tr><th class="col-task svelte-1agm3et">Task</th><th class="col-pic svelte-1agm3et">PIC</th><th class="col-date svelte-1agm3et">Deadline</th><th class="col-late svelte-1agm3et">Terlambat</th><th class="col-status svelte-1agm3et">Status</th></tr></thead><tbody class="svelte-1agm3et"><!--[-->`);
			const each_array_8 = ensure_array_like(overdueTasks().slice(0, 4));
			for (let $$index_8 = 0, $$length = each_array_8.length; $$index_8 < $$length; $$index_8++) {
				let row = each_array_8[$$index_8];
				$$renderer.push(`<tr class="svelte-1agm3et"><td class="col-task svelte-1agm3et"><button type="button" class="task-link svelte-1agm3et">${escape_html(row.title)}</button></td><td class="col-pic svelte-1agm3et"><span class="pic svelte-1agm3et"><i${attr_class(`face ${stringify(faceTone(row.pic))}`, "svelte-1agm3et")}>${escape_html(initials(row.pic))}</i> <span class="pic-name svelte-1agm3et">${escape_html(row.pic)}</span></span></td><td class="col-date svelte-1agm3et"><span class="muted svelte-1agm3et">${escape_html(formatDate(row.deadline))}</span></td><td class="col-late svelte-1agm3et"><span class="late-text svelte-1agm3et">${escape_html(row.delay)}</span></td><td class="col-status svelte-1agm3et"><span class="status-text svelte-1agm3et"${attr_style(`color:${stringify(workflowStatusColor(row.status))}`)}>${escape_html(statusLabel(row.status))}</span></td></tr>`);
			}
			$$renderer.push(`<!--]--></tbody></table>`);
		} else {
			$$renderer.push(`<!--[-1--><table class="modern-table deadline-table svelte-1agm3et"><thead class="svelte-1agm3et"><tr><th class="col-task svelte-1agm3et">Task</th><th class="col-pic svelte-1agm3et">PIC</th><th class="col-date svelte-1agm3et">Deadline</th><th class="col-status svelte-1agm3et">Prioritas</th></tr></thead><tbody class="svelte-1agm3et"><!--[-->`);
			const each_array_9 = ensure_array_like(upcomingDeadlines().slice(0, 4));
			for (let $$index_9 = 0, $$length = each_array_9.length; $$index_9 < $$length; $$index_9++) {
				let row = each_array_9[$$index_9];
				$$renderer.push(`<tr class="svelte-1agm3et"><td class="col-task svelte-1agm3et"><button type="button" class="task-link svelte-1agm3et">${escape_html(row.title)}</button></td><td class="col-pic svelte-1agm3et"><span class="pic svelte-1agm3et"><i${attr_class(`face ${stringify(faceTone(row.pic))}`, "svelte-1agm3et")}>${escape_html(initials(row.pic))}</i> <span class="pic-name svelte-1agm3et">${escape_html(row.pic)}</span></span></td><td class="col-date svelte-1agm3et"><span class="muted svelte-1agm3et">${escape_html(formatDate(row.deadline))}</span></td><td class="col-status svelte-1agm3et"><span${attr_class(`prio-text ${stringify(row.priority.toLowerCase())}`, "svelte-1agm3et")}>${escape_html(row.priority)}</span></td></tr>`);
			}
			$$renderer.push(`<!--]--></tbody></table>`);
		}
		$$renderer.push(`<!--]--></div>`);
		$$renderer.push(`<!----></article></div></div></section>`);
	});
}
//#endregion
//#region src/routes/+page.svelte
function _page($$renderer) {
	$$renderer.push(`<div class="home svelte-1uha8ag">`);
	Beranda($$renderer, {});
	$$renderer.push(`<!----></div>`);
}
//#endregion
export { _page as default };

//# sourceMappingURL=_page.svelte.js.map