import { a as ensure_array_like, f as escape_html, i as derived, t as attr_class, u as attr } from "../../../../chunks/server.js";
import "../../../../chunks/navigation.js";
import { t as page } from "../../../../chunks/state.js";
import { t as GlassPanel } from "../../../../chunks/GlassPanel.js";
import { t as SubmenuHeader } from "../../../../chunks/SubmenuHeader.js";
import { a as registryStatusLabel, n as criticalityLabel, r as getDashboard, s as registryStore } from "../../../../chunks/registryStore.svelte.js";
import { t as formatDate } from "../../../../chunks/format.js";
//#region src/routes/registry/[id]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const item = derived(() => {
			registryStore.items;
			return page.params.id ? getDashboard(page.params.id) : null;
		});
		const metaEntries = derived(() => item() ? Object.entries(item().metadata || {}).map(([key, value]) => ({
			key: key.replaceAll("_", " "),
			value
		})) : []);
		$$renderer.push(`<section class="page svelte-1gfvjpg">`);
		GlassPanel($$renderer, {
			children: ($$renderer) => {
				{
					function actions($$renderer) {
						$$renderer.push(`<a class="btn-primary" href="/registry/list">â† Daftar</a>`);
					}
					SubmenuHeader($$renderer, {
						eyebrow: "Dashboard Registry",
						title: "Dashboard Detail",
						sub: item() ? item().description : "Detail dashboard tidak ditemukan",
						meta: item() ? item().name : "â€”",
						actions,
						$$slots: { actions: true }
					});
				}
				$$renderer.push(`<!----> `);
				if (!item()) $$renderer.push(`<!--[0--><p class="state error svelte-1gfvjpg">Dashboard tidak ditemukan.</p>`);
				else {
					$$renderer.push(`<!--[-1--><header class="svelte-1gfvjpg"><div class="meta svelte-1gfvjpg"><span class="mono svelte-1gfvjpg">#${escape_html(item().id)}</span> <span${attr_class(`badge status-${item().status}`, "svelte-1gfvjpg")}>${escape_html(registryStatusLabel(item().status))}</span> <span${attr_class(`badge crit-${item().criticality}`, "svelte-1gfvjpg")}>${escape_html(criticalityLabel(item().criticality))}</span></div></header> <div class="tabs svelte-1gfvjpg" role="tablist" aria-label="Detail tabs"><button type="button" role="tab"${attr("aria-selected", true)}${attr_class("svelte-1gfvjpg", void 0, { "on": true })}>Overview</button></div> <!---->`);
					$$renderer.push(`<div class="panel svelte-1gfvjpg">`);
					{
						$$renderer.push(`<!--[0--><div class="overview svelte-1gfvjpg"><section><h2 class="svelte-1gfvjpg">Quick Stats</h2> <div class="stats svelte-1gfvjpg"><article class="svelte-1gfvjpg"><span class="svelte-1gfvjpg">Tasks Total</span> <strong class="svelte-1gfvjpg">${escape_html(item().quick_stats.tasks_total)}</strong></article> <article class="svelte-1gfvjpg"><span class="svelte-1gfvjpg">Tasks Open</span> <strong class="svelte-1gfvjpg">${escape_html(item().quick_stats.tasks_open)}</strong></article> <article class="svelte-1gfvjpg"><span class="svelte-1gfvjpg">Tasks Done</span> <strong class="svelte-1gfvjpg">${escape_html(item().quick_stats.tasks_done)}</strong></article> <article class="svelte-1gfvjpg"><span class="svelte-1gfvjpg">Last Change</span> <strong class="date svelte-1gfvjpg">${escape_html(formatDate(item().quick_stats.last_change))}</strong></article></div></section> <section><h2 class="svelte-1gfvjpg">Info Dasar</h2> <dl class="grid3 svelte-1gfvjpg"><div><dt class="svelte-1gfvjpg">Code</dt><dd class="svelte-1gfvjpg">${escape_html(item().code)}</dd></div> <div><dt class="svelte-1gfvjpg">Owner</dt><dd class="svelte-1gfvjpg">${escape_html(item().owner)}</dd></div> <div><dt class="svelte-1gfvjpg">Platform</dt><dd class="svelte-1gfvjpg">${escape_html(item().platform)}</dd></div> <div><dt class="svelte-1gfvjpg">Category</dt><dd class="svelte-1gfvjpg">${escape_html(item().category)}</dd></div> <div><dt class="svelte-1gfvjpg">Version</dt><dd class="svelte-1gfvjpg">${escape_html(item().version)}</dd></div> <div><dt class="svelte-1gfvjpg">URL</dt><dd class="svelte-1gfvjpg">${escape_html(item().url || "â€”")}</dd></div> <div><dt class="svelte-1gfvjpg">Created</dt><dd class="svelte-1gfvjpg">${escape_html(formatDate(item().created_at))}</dd></div> <div><dt class="svelte-1gfvjpg">Updated</dt><dd class="svelte-1gfvjpg">${escape_html(formatDate(item().updated_at))}</dd></div></dl></section> <section><h2 class="svelte-1gfvjpg">Metadata</h2> <dl class="grid3 svelte-1gfvjpg"><!--[-->`);
						const each_array = ensure_array_like(metaEntries());
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let entry = each_array[$$index];
							$$renderer.push(`<div><dt class="svelte-1gfvjpg">${escape_html(entry.key)}</dt> <dd class="svelte-1gfvjpg">${escape_html(entry.value || "â€”")}</dd></div>`);
						}
						$$renderer.push(`<!--]--></dl></section></div>`);
					}
					$$renderer.push(`<!--]--></div>`);
					$$renderer.push(`<!---->`);
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