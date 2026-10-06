import { a as ensure_array_like, f as escape_html, i as derived, n as attr_style, t as attr_class, u as attr } from "../../../../chunks/server.js";
import "../../../../chunks/navigation.js";
import { C as taskModuleStore, T as tasksForRequirement, h as isOverdue, m as isCurrentUserPmOf, s as canManageRequirements } from "../../../../chunks/taskModuleStore.svelte.js";
import { a as requirementHealthLabel, c as requirementStatusLabel, d as requirementStore, f as requirementTeamRoster, l as requirementStatusOptions, n as listRequirements, o as requirementHealthSummary, r as reqCode, s as requirementSortOptions, u as requirementStatusSummary } from "../../../../chunks/requirementStore.svelte.js";
import { t as GlassPanel } from "../../../../chunks/GlassPanel.js";
import { t as SubmenuHeader } from "../../../../chunks/SubmenuHeader.js";
import { i as listDashboards, s as registryStore } from "../../../../chunks/registryStore.svelte.js";
import { t as formatDate } from "../../../../chunks/format.js";
//#region src/routes/requirements/list/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let dashboard = "";
		let status = "";
		let q = "";
		let sort = "updated_desc";
		let applied = {
			dashboard: "",
			status: "",
			q: "",
			sort: "updated_desc"
		};
		derived(() => requirementTeamRoster.map((m) => m.name));
		const dashboards = derived(() => {
			registryStore.items;
			return listDashboards({}).map((d) => d.name);
		});
		derived(() => {
			taskModuleStore.session;
			registryStore.items;
			if (!canManageRequirements()) return [];
			return dashboards().filter((name) => isCurrentUserPmOf(name));
		});
		const items = derived(() => {
			requirementStore.items;
			taskModuleStore.items;
			return listRequirements(applied);
		});
		const statusSummary = derived(() => {
			requirementStore.items;
			return requirementStatusSummary(applied.dashboard);
		});
		const healthSummary = derived(() => {
			requirementStore.items;
			return requirementHealthSummary(applied.dashboard);
		});
		const canAdd = derived(() => {
			taskModuleStore.session;
			return canManageRequirements();
		});
		/** @param {{ id: number }} req */
		function progressOf(req) {
			const tasks = tasksForRequirement(req.id);
			const total = tasks.length;
			const done = tasks.filter((t) => t.status === "selesai").length;
			return {
				total,
				done,
				pct: total ? Math.round(done / total * 100) : 0,
				overdue: tasks.filter((t) => isOverdue(t)).length
			};
		}
		$$renderer.push(`<section class="page svelte-v90uay">`);
		GlassPanel($$renderer, {
			children: ($$renderer) => {
				{
					function actions($$renderer) {
						if (canAdd()) $$renderer.push(`<!--[0--><button type="button" class="btn-primary">+ Tambah Requirement</button>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					}
					SubmenuHeader($$renderer, {
						eyebrow: "Requirements",
						title: "Daftar Requirement",
						sub: "PM: buat requirement + pecah task & assign teknis sekaligus",
						meta: `${items().length} item`,
						actions,
						$$slots: { actions: true }
					});
				}
				$$renderer.push(`<!----> <div class="legend svelte-v90uay" aria-label="Panduan status &amp; health"><div class="legend-group svelte-v90uay"><span class="legend-label svelte-v90uay">Status</span> <!--[-->`);
				const each_array = ensure_array_like(statusSummary());
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let row = each_array[$$index];
					$$renderer.push(`<button type="button"${attr_class("legend-pill svelte-v90uay", void 0, { "on": applied.status === row.value })}${attr("title", row.summary)}><span${attr_class(`dot st-${row.value}`, "svelte-v90uay")}></span> ${escape_html(row.label)} <em class="svelte-v90uay">${escape_html(row.count)}</em></button>`);
				}
				$$renderer.push(`<!--]--></div> <span class="legend-sep svelte-v90uay" aria-hidden="true"></span> <div class="legend-group svelte-v90uay"><span class="legend-label svelte-v90uay">Health</span> <!--[-->`);
				const each_array_1 = ensure_array_like(healthSummary());
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let row = each_array_1[$$index_1];
					$$renderer.push(`<span class="legend-pill static svelte-v90uay"${attr("title", row.summary)}><span${attr_class(`dot health-${row.value}`, "svelte-v90uay")}></span> ${escape_html(row.label)} <em class="svelte-v90uay">${escape_html(row.count)}</em></span>`);
				}
				$$renderer.push(`<!--]--></div></div> <form class="filters svelte-v90uay"><label class="svelte-v90uay"><span class="svelte-v90uay">Dashboard</span> `);
				$$renderer.select({
					value: dashboard,
					class: ""
				}, ($$renderer) => {
					$$renderer.option({ value: "" }, ($$renderer) => {
						$$renderer.push(`Semua`);
					});
					$$renderer.push(`<!--[-->`);
					const each_array_2 = ensure_array_like(dashboards());
					for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
						let name = each_array_2[$$index_2];
						$$renderer.option({ value: name }, ($$renderer) => {
							$$renderer.push(`${escape_html(name)}`);
						});
					}
					$$renderer.push(`<!--]-->`);
				}, "svelte-v90uay");
				$$renderer.push(`</label> <label class="svelte-v90uay"><span class="svelte-v90uay">Status</span> `);
				$$renderer.select({
					value: status,
					class: ""
				}, ($$renderer) => {
					$$renderer.option({ value: "" }, ($$renderer) => {
						$$renderer.push(`Semua`);
					});
					$$renderer.push(`<!--[-->`);
					const each_array_3 = ensure_array_like(requirementStatusOptions);
					for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
						let opt = each_array_3[$$index_3];
						$$renderer.option({ value: opt.value }, ($$renderer) => {
							$$renderer.push(`${escape_html(opt.label)}`);
						});
					}
					$$renderer.push(`<!--]-->`);
				}, "svelte-v90uay");
				$$renderer.push(`</label> <label class="grow svelte-v90uay"><span class="svelte-v90uay">Cari</span> <div class="search svelte-v90uay"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="svelte-v90uay"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7"></circle><path d="m16.5 16.5 3.2 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg> <input type="search" placeholder="Judul, dashboard, ownerâ€¦"${attr("value", q)} class="svelte-v90uay"/></div></label> <label class="svelte-v90uay"><span class="svelte-v90uay">Sort</span> `);
				$$renderer.select({
					value: sort,
					class: ""
				}, ($$renderer) => {
					$$renderer.push(`<!--[-->`);
					const each_array_4 = ensure_array_like(requirementSortOptions);
					for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
						let opt = each_array_4[$$index_4];
						$$renderer.option({ value: opt.value }, ($$renderer) => {
							$$renderer.push(`${escape_html(opt.label)}`);
						});
					}
					$$renderer.push(`<!--]-->`);
				}, "svelte-v90uay");
				$$renderer.push(`</label> <button type="submit" class="apply svelte-v90uay">Terapkan</button></form>`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----> `);
		GlassPanel($$renderer, {
			class: "fill table-panel",
			children: ($$renderer) => {
				if (items().length === 0) $$renderer.push(`<!--[0--><p class="state svelte-v90uay">Tidak ada requirement yang cocok.</p>`);
				else {
					$$renderer.push(`<!--[-1--><div class="table-wrap svelte-v90uay"><table class="svelte-v90uay"><thead><tr><th class="svelte-v90uay">ID</th><th class="svelte-v90uay">Requirement</th><th class="svelte-v90uay">Dashboard</th><th class="svelte-v90uay">Progress</th><th class="svelte-v90uay">Tasks</th><th class="svelte-v90uay">Status</th><th class="svelte-v90uay">Health</th><th class="svelte-v90uay">Due</th></tr></thead><tbody><!--[-->`);
					const each_array_5 = ensure_array_like(items());
					for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
						let req = each_array_5[$$index_5];
						const prog = progressOf(req);
						$$renderer.push(`<tr><td class="svelte-v90uay"><span class="mono-id svelte-v90uay">${escape_html(reqCode(req.id))}</span></td><td class="svelte-v90uay"><button type="button" class="req-link svelte-v90uay"><strong class="svelte-v90uay">${escape_html(req.title)}</strong> <span class="desc svelte-v90uay">${escape_html(req.description || "â€”")}</span></button></td><td class="svelte-v90uay">${escape_html(req.dashboard)}</td><td class="svelte-v90uay"><div class="progress svelte-v90uay"><div class="bar svelte-v90uay"><i${attr_style(`width:${prog.pct}%`)} class="svelte-v90uay"></i></div> <span class="svelte-v90uay">${escape_html(prog.pct)}%</span></div></td><td class="svelte-v90uay">${escape_html(prog.total)}</td><td class="svelte-v90uay"><span${attr_class(`chip st-${req.status}`, "svelte-v90uay")}>${escape_html(requirementStatusLabel(req.status))}</span></td><td class="svelte-v90uay"><span${attr_class(`chip health-${req.health}`, "svelte-v90uay")}>${escape_html(requirementHealthLabel(req.health))}</span></td><td class="svelte-v90uay"><span class="due svelte-v90uay">${escape_html(formatDate(req.due_date))}</span></td></tr>`);
					}
					$$renderer.push(`<!--]--></tbody></table></div>`);
				}
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----></section> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { _page as default };

//# sourceMappingURL=_page.svelte.js.map