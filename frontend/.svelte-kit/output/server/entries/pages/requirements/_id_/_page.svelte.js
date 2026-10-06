import { a as ensure_array_like, f as escape_html, i as derived, n as attr_style, t as attr_class, u as attr } from "../../../../chunks/server.js";
import "../../../../chunks/navigation.js";
import { C as taskModuleStore, O as workflowColumns, T as tasksForRequirement, h as isOverdue, j as workflowStatusColor, k as workflowLabel, s as canManageRequirements } from "../../../../chunks/taskModuleStore.svelte.js";
import { t as page } from "../../../../chunks/state.js";
import { a as requirementHealthLabel, c as requirementStatusLabel, d as requirementStore, l as requirementStatusOptions, p as updateRequirement, r as reqCode, t as getRequirement } from "../../../../chunks/requirementStore.svelte.js";
import { t as GlassPanel } from "../../../../chunks/GlassPanel.js";
import { t as formatDate } from "../../../../chunks/format.js";
import { t as AttachmentPanel } from "../../../../chunks/AttachmentPanel.js";
import { t as PmCreateTaskModal } from "../../../../chunks/PmCreateTaskModal.js";
//#region src/routes/requirements/[id]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let taskOpen = false;
		let msg = "";
		const item = derived(() => {
			requirementStore.items;
			return page.params.id ? getRequirement(page.params.id) : null;
		});
		const childTasks = derived(() => {
			taskModuleStore.items;
			if (!item()) return [];
			return tasksForRequirement(item().id);
		});
		const stats = derived(() => {
			const total = childTasks().length;
			const done = childTasks().filter((t) => t.status === "selesai").length;
			return {
				total,
				done,
				aktif: childTasks().filter((t) => t.status !== "selesai" && t.status !== "backlog").length,
				overdue: childTasks().filter((t) => isOverdue(t)).length,
				pct: total ? Math.round(done / total * 100) : 0
			};
		});
		const flowCols = derived(() => {
			/** @type {Record<string, number>} */
			const counts = {};
			for (const col of workflowColumns) counts[col.key] = 0;
			for (const t of childTasks()) counts[t.status] = (counts[t.status] || 0) + 1;
			return workflowColumns.map((col) => ({
				...col,
				count: counts[col.key] || 0
			}));
		});
		const activity = derived(() => {
			/** @type {{ at: string, title: string, sub: string }[]} */
			const rows = [];
			for (const t of childTasks()) for (const a of t.activity || []) rows.goto({
				at: a.at,
				title: a.action,
				sub: `${a.actor} Â· #${t.id}`
			});
			if (item()) rows.goto({
				at: item().created_at,
				title: "Requirement dibuat",
				sub: `${item().created_by} Â· ${reqCode(item().id)}`
			});
			return rows.sort((a, b) => b.at.localeCompare(a.at));
		});
		const canEdit = derived(() => {
			taskModuleStore.session;
			if (!item()) return false;
			return canManageRequirements(item().dashboard);
		});
		/** @param {'open' | 'in_progress' | 'done'} status */
		function onStatus(status) {
			if (!item() || !canEdit()) return;
			updateRequirement(item().id, { status });
			msg = "Status diperbarui";
		}
		function closeTaskModal() {
			taskOpen = false;
		}
		/** @param {{ id: number }} created */
		function onTaskCreated(created) {
			msg = `Task #${created.id} masuk Backlog Â· sudah di-assign`;
		}
		/** @param {string} name */
		function initials(name) {
			return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
		}
		$$renderer.push(`<section class="page svelte-139gesh">`);
		if (!item()) {
			$$renderer.push("<!--[0-->");
			GlassPanel($$renderer, {
				children: ($$renderer) => {
					$$renderer.push(`<p class="state error svelte-139gesh">Requirement tidak ditemukan.</p> <a class="ghost-btn svelte-139gesh" href="/requirements/list">â† Kembali ke Daftar</a>`);
				},
				$$slots: { default: true }
			});
		} else {
			$$renderer.push(`<!--[-1--><div class="layout svelte-139gesh">`);
			GlassPanel($$renderer, {
				class: "span-2",
				children: ($$renderer) => {
					$$renderer.push(`<div class="hero svelte-139gesh"><div class="hero-nav svelte-139gesh"><div class="action-pills svelte-139gesh" aria-label="Navigasi"><a class="pill on" href="/requirements/list" aria-label="Kembali ke daftar" title="Kembali ke daftar">â†</a></div> <div class="hero-side svelte-139gesh"><div class="action-pills svelte-139gesh" aria-label="File Panduan">`);
					AttachmentPanel($$renderer, {
						ownerType: "requirement",
						ownerId: item().id,
						canManage: canEdit()
					});
					$$renderer.push(`<!----></div> `);
					if (canEdit()) $$renderer.push(`<!--[0--><div class="action-pills svelte-139gesh" aria-label="Aksi"><button type="button" class="pill">Buka Kanban</button> <button type="button" class="pill on">+ Tambah Task</button></div>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div></div> <div class="hero-top svelte-139gesh"><div class="hero-main svelte-139gesh"><p class="eyebrow svelte-139gesh">Info Requirement</p> <div class="meta svelte-139gesh"><span class="mono-id svelte-139gesh">${escape_html(reqCode(item().id))}</span> <span${attr_class(`chip st-${item().status}`, "svelte-139gesh")}>${escape_html(requirementStatusLabel(item().status))}</span> <span${attr_class(`chip health-${item().health}`, "svelte-139gesh")}>${escape_html(requirementHealthLabel(item().health))}</span></div> <h2 class="svelte-139gesh">${escape_html(item().title)}</h2> <p class="lead svelte-139gesh">${escape_html(item().description || "Tidak ada deskripsi.")}</p> `);
					if (msg) $$renderer.push(`<!--[0--><p class="msg ok svelte-139gesh">${escape_html(msg)}</p>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div></div> <div class="hero-body svelte-139gesh"><div class="identity svelte-139gesh"><div class="owner-card svelte-139gesh"><i class="face svelte-139gesh">${escape_html(initials(item().created_by))}</i> <div><span class="k svelte-139gesh">Owner</span> <strong class="svelte-139gesh">${escape_html(item().created_by)}</strong></div></div> `);
					if (item().team?.length) {
						$$renderer.push(`<!--[0--><div class="assignees svelte-139gesh"><span class="k svelte-139gesh">Assignees</span> <div class="avatar-stack svelte-139gesh"><!--[-->`);
						const each_array = ensure_array_like(item().team);
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let name = each_array[$$index];
							$$renderer.push(`<span class="avatar svelte-139gesh"${attr("title", name)}><i class="face sm svelte-139gesh">${escape_html(initials(name))}</i> <em class="svelte-139gesh">${escape_html(name)}</em></span>`);
						}
						$$renderer.push(`<!--]--></div></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div> <div class="facts svelte-139gesh"><div class="fact svelte-139gesh"><span class="k svelte-139gesh">Dashboard</span> <strong class="svelte-139gesh">${escape_html(item().dashboard)}</strong></div> <div class="fact svelte-139gesh"><span class="k svelte-139gesh">Due Date</span> <strong class="svelte-139gesh">${escape_html(formatDate(item().due_date))}</strong></div> <div class="fact svelte-139gesh"><span class="k svelte-139gesh">Created</span> <strong class="svelte-139gesh">${escape_html(formatDate(item().created_at))}</strong></div> <div class="fact svelte-139gesh"><span class="k svelte-139gesh">Updated</span> <strong class="svelte-139gesh">${escape_html(formatDate(item().updated_at))}</strong></div> `);
					if (canEdit()) {
						$$renderer.push(`<!--[0--><label class="fact status-field svelte-139gesh"><span class="k svelte-139gesh">Status</span> `);
						$$renderer.select({
							value: item().status,
							onchange: (e) => onStatus(e.currentTarget.value),
							class: ""
						}, ($$renderer) => {
							$$renderer.push(`<!--[-->`);
							const each_array_1 = ensure_array_like(requirementStatusOptions);
							for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
								let opt = each_array_1[$$index_1];
								$$renderer.option({ value: opt.value }, ($$renderer) => {
									$$renderer.push(`${escape_html(opt.label)}`);
								});
							}
							$$renderer.push(`<!--]-->`);
						}, "svelte-139gesh");
						$$renderer.push(`</label>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div></div> <div class="stats svelte-139gesh" role="group" aria-label="Ringkasan task"><div class="stat svelte-139gesh"><span class="svelte-139gesh">Progress</span> <strong class="svelte-139gesh">${escape_html(stats().pct)}%</strong> <div class="stat-bar svelte-139gesh" aria-hidden="true"><span${attr_style(`width: ${Math.max(stats().pct, 0)}%`)} class="svelte-139gesh"></span></div></div> <div class="stat svelte-139gesh"><span class="svelte-139gesh">Total</span> <strong class="svelte-139gesh">${escape_html(stats().total)}</strong></div> <div class="stat svelte-139gesh"><span class="svelte-139gesh">Aktif</span> <strong class="svelte-139gesh">${escape_html(stats().aktif)}</strong></div> <div class="stat warn svelte-139gesh"><span class="svelte-139gesh">Overdue</span> <strong class="svelte-139gesh">${escape_html(stats().overdue)}</strong></div></div></div>`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> <div class="flow-rail span-2 svelte-139gesh"><div class="panel-title flow-head svelte-139gesh"><div><p class="eyebrow svelte-139gesh">Workflow</p> <h3 class="svelte-139gesh">Task Flow</h3></div> <button type="button" class="flow-btn svelte-139gesh">Buka Kanban</button></div> <div class="flow svelte-139gesh"><!--[-->`);
			const each_array_2 = ensure_array_like(flowCols());
			for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
				let col = each_array_2[$$index_2];
				$$renderer.push(`<div${attr_class("flow-col svelte-139gesh", void 0, { "has": col.count > 0 })}${attr_style(`--status-color: ${workflowStatusColor(col.key)}`)}><span class="status-mark svelte-139gesh" aria-hidden="true"></span> <span class="flow-label svelte-139gesh">${escape_html(col.label)}</span> <strong class="svelte-139gesh">${escape_html(col.count)}</strong></div>`);
			}
			$$renderer.push(`<!--]--></div></div> `);
			GlassPanel($$renderer, {
				children: ($$renderer) => {
					$$renderer.push(`<div class="panel-title svelte-139gesh"><div><p class="eyebrow svelte-139gesh">Tasks</p> <h3 class="svelte-139gesh">Task Breakdown</h3></div> `);
					if (canEdit()) $$renderer.push(`<!--[0--><button type="button" class="linkish svelte-139gesh">+ Task</button>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div> `);
					if (childTasks().length === 0) $$renderer.push(`<!--[0--><p class="empty svelte-139gesh">Belum ada task dari requirement ini.</p>`);
					else {
						$$renderer.push(`<!--[-1--><ul class="task-list svelte-139gesh"><!--[-->`);
						const each_array_3 = ensure_array_like(childTasks());
						for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
							let t = each_array_3[$$index_3];
							$$renderer.push(`<li class="svelte-139gesh"><div class="task-main svelte-139gesh"><strong class="svelte-139gesh">${escape_html(t.title)}</strong> <small class="svelte-139gesh">${escape_html(t.assignee || t.pic)} Â· ${escape_html(formatDate(t.deadline))} `);
							if (isOverdue(t)) $$renderer.push(`<!--[0--><em class="svelte-139gesh">Overdue</em>`);
							else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--></small></div> <span${attr_class(`chip st-${t.status}`, "svelte-139gesh")}>${escape_html(workflowLabel(t.status))}</span></li>`);
						}
						$$renderer.push(`<!--]--></ul>`);
					}
					$$renderer.push(`<!--]-->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			GlassPanel($$renderer, {
				children: ($$renderer) => {
					$$renderer.push(`<div class="panel-title svelte-139gesh"><div><p class="eyebrow svelte-139gesh">Log</p> <h3 class="svelte-139gesh">Activity</h3></div></div> `);
					if (activity().length === 0) $$renderer.push(`<!--[0--><p class="empty svelte-139gesh">Belum ada aktivitas.</p>`);
					else {
						$$renderer.push(`<!--[-1--><ol class="timeline svelte-139gesh"><!--[-->`);
						const each_array_4 = ensure_array_like(activity());
						for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
							let ev = each_array_4[$$index_4];
							$$renderer.push(`<li class="svelte-139gesh"><time class="when svelte-139gesh">${escape_html(ev.at)}</time> <div class="what svelte-139gesh"><strong class="svelte-139gesh">${escape_html(ev.title)}</strong> <span class="svelte-139gesh">${escape_html(ev.sub)}</span></div></li>`);
						}
						$$renderer.push(`<!--]--></ol>`);
					}
					$$renderer.push(`<!--]-->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]--></section> `);
		if (item()) {
			$$renderer.push("<!--[0-->");
			PmCreateTaskModal($$renderer, {
				open: taskOpen,
				requirementId: item().id,
				onClose: closeTaskModal,
				onCreated: onTaskCreated
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { _page as default };

//# sourceMappingURL=_page.svelte.js.map