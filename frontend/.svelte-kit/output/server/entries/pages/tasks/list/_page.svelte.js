import { a as ensure_array_like, f as escape_html, i as derived, t as attr_class, u as attr } from "../../../../chunks/server.js";
import "../../../../chunks/navigation.js";
import { O as workflowColumns, d as dashboardOptions, h as isOverdue, k as workflowLabel, v as listModuleTasks } from "../../../../chunks/taskModuleStore.svelte.js";
import "../../../../chunks/index-server.js";
import "../../../../chunks/taskNav.js";
import { t as GlassPanel } from "../../../../chunks/GlassPanel.js";
import { t as SubmenuHeader } from "../../../../chunks/SubmenuHeader.js";
import { t as formatDate } from "../../../../chunks/format.js";
//#region src/routes/tasks/list/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let dashboard = "";
		let status = "";
		let q = "";
		let aktif = "";
		let applied = {
			dashboard: "",
			status: "",
			pic: "",
			overdue: "",
			aktif: "",
			q: ""
		};
		const items = derived(() => listModuleTasks(applied));
		const dashboards = derived(dashboardOptions);
		const deepLinkActive = derived(() => Boolean(aktif));
		/** @param {string} name */
		function initials(name) {
			return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
		}
		$$renderer.push(`<section class="page svelte-lhooy4">`);
		GlassPanel($$renderer, {
			children: ($$renderer) => {
				SubmenuHeader($$renderer, {
					eyebrow: "Task",
					title: "List View",
					sub: "Tabel monitoring task",
					meta: `${items().length} task`
				});
				$$renderer.push(`<!----> <div class="main-tabs svelte-lhooy4" role="tablist"><button type="button" class="main-tab svelte-lhooy4">Board</button> <button type="button" class="main-tab on svelte-lhooy4" aria-selected="true">List</button></div> <form class="filters svelte-lhooy4"><label class="svelte-lhooy4"><span class="svelte-lhooy4">Dashboard</span> `);
				$$renderer.select({
					value: dashboard,
					class: ""
				}, ($$renderer) => {
					$$renderer.option({ value: "" }, ($$renderer) => {
						$$renderer.push(`Semua`);
					});
					$$renderer.push(`<!--[-->`);
					const each_array = ensure_array_like(dashboards());
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let name = each_array[$$index];
						$$renderer.option({ value: name }, ($$renderer) => {
							$$renderer.push(`${escape_html(name)}`);
						});
					}
					$$renderer.push(`<!--]-->`);
				}, "svelte-lhooy4");
				$$renderer.push(`</label> <label class="svelte-lhooy4"><span class="svelte-lhooy4">Status</span> `);
				$$renderer.select({
					value: status,
					class: ""
				}, ($$renderer) => {
					$$renderer.option({ value: "" }, ($$renderer) => {
						$$renderer.push(`Semua`);
					});
					$$renderer.push(`<!--[-->`);
					const each_array_1 = ensure_array_like(workflowColumns);
					for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
						let col = each_array_1[$$index_1];
						$$renderer.option({ value: col.key }, ($$renderer) => {
							$$renderer.push(`${escape_html(col.label)}`);
						});
					}
					$$renderer.push(`<!--]-->`);
				}, "svelte-lhooy4");
				$$renderer.push(`</label> <label class="grow svelte-lhooy4"><span class="svelte-lhooy4">Cari</span> <div class="search svelte-lhooy4"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="svelte-lhooy4"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7"></circle><path d="m16.5 16.5 3.2 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg> <input type="search" placeholder="Judul, PIC, dashboardâ€¦"${attr("value", q)} class="svelte-lhooy4"/></div></label> <button type="submit" class="apply svelte-lhooy4">Terapkan</button></form> `);
				if (deepLinkActive()) $$renderer.push(`<!--[0--><p class="deep svelte-lhooy4">Filter tambahan dari Beranda aktif. <button type="button" class="svelte-lhooy4">Reset</button></p>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----> `);
		GlassPanel($$renderer, {
			class: "fill table-panel",
			children: ($$renderer) => {
				if (items().length === 0) $$renderer.push(`<!--[0--><p class="state svelte-lhooy4">Tidak ada task yang cocok.</p>`);
				else {
					$$renderer.push(`<!--[-1--><div class="table-wrap svelte-lhooy4"><table class="svelte-lhooy4"><thead><tr><th class="svelte-lhooy4">ID</th><th class="svelte-lhooy4">Task</th><th class="svelte-lhooy4">Dashboard</th><th class="svelte-lhooy4">Status</th><th class="svelte-lhooy4">PIC</th><th class="svelte-lhooy4">Deadline</th></tr></thead><tbody><!--[-->`);
					const each_array_2 = ensure_array_like(items());
					for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
						let task = each_array_2[$$index_2];
						$$renderer.push(`<tr${attr_class("svelte-lhooy4", void 0, { "late": isOverdue(task) })}><td class="svelte-lhooy4"><span class="mono-id svelte-lhooy4">#${escape_html(task.id)}</span></td><td class="svelte-lhooy4"><span class="task-link svelte-lhooy4">${escape_html(task.title)}</span></td><td class="svelte-lhooy4">${escape_html(task.dashboard)}</td><td class="svelte-lhooy4"><span${attr_class(`chip st-${task.status}`, "svelte-lhooy4")}>${escape_html(workflowLabel(task.status))}</span></td><td class="svelte-lhooy4"><span class="pic svelte-lhooy4"><i class="face svelte-lhooy4">${escape_html(initials(task.pic))}</i> ${escape_html(task.pic)}</span></td><td class="svelte-lhooy4"><span class="due svelte-lhooy4">${escape_html(formatDate(task.deadline))}</span> `);
						if (isOverdue(task)) $$renderer.push(`<!--[0--><span class="over svelte-lhooy4">Overdue</span>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--></td></tr>`);
					}
					$$renderer.push(`<!--]--></tbody></table></div>`);
				}
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----></section>`);
	});
}
//#endregion
export { _page as default };

//# sourceMappingURL=_page.svelte.js.map