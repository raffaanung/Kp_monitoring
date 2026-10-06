import { a as ensure_array_like, f as escape_html, i as derived, t as attr_class, u as attr } from "../../../../chunks/server.js";
import { t as page } from "../../../../chunks/state.js";
import { t as GlassPanel } from "../../../../chunks/GlassPanel.js";
import { t as SubmenuHeader } from "../../../../chunks/SubmenuHeader.js";
import { i as objectTypeLabel, n as getActivityLog, t as activityLogStore } from "../../../../chunks/activityLogStore.svelte.js";
import { t as formatDate } from "../../../../chunks/format.js";
//#region src/routes/activity-log/[id]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const log = derived(() => {
			activityLogStore.items;
			return page.params.id ? getActivityLog(page.params.id) : null;
		});
		/** @param {string} name */
		function initials(name) {
			return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
		}
		/** @param {string} stamp */
		function formatStamp(stamp) {
			const date = stamp.slice(0, 10);
			const time = stamp.slice(11);
			return `${formatDate(date)} ${time}`;
		}
		/** @param {import('../../lib/activityLogStore.svelte.js').ObjectType} type @param {number} id */
		function objectLink(type, id) {
			return type === "task" ? "/tasks/list" : `/registry/${id}`;
		}
		$$renderer.push(`<section class="page svelte-1lr878v">`);
		if (!log()) {
			$$renderer.push("<!--[0-->");
			GlassPanel($$renderer, {
				children: ($$renderer) => {
					SubmenuHeader($$renderer, { title: "Tidak ditemukan" });
					$$renderer.push(`<!----> <div class="empty svelte-1lr878v"><p class="svelte-1lr878v">Entri dengan ID tersebut tidak ada.</p> <a class="btn svelte-1lr878v" href="/activity-log">â† Kembali</a></div>`);
				},
				$$slots: { default: true }
			});
		} else {
			$$renderer.push("<!--[-1-->");
			GlassPanel($$renderer, {
				children: ($$renderer) => {
					SubmenuHeader($$renderer, {
						title: log().action,
						meta: formatStamp(log().at)
					});
					$$renderer.push(`<!----> <div class="summary svelte-1lr878v"><div class="summary-item svelte-1lr878v"><span class="label svelte-1lr878v">Aktor</span> <span class="actor svelte-1lr878v"><i class="face svelte-1lr878v">${escape_html(initials(log().actor))}</i> <strong class="svelte-1lr878v">${escape_html(log().actor)}</strong></span></div> <div class="summary-item svelte-1lr878v"><span class="label svelte-1lr878v">Objek</span> <a class="obj-link svelte-1lr878v"${attr("href", objectLink(log().objectType, log().objectId))}><span${attr_class(`chip obj-${log().objectType}`, "svelte-1lr878v")}>${escape_html(objectTypeLabel(log().objectType))}</span> ${escape_html(log().objectLabel)}</a></div> <div class="summary-item svelte-1lr878v"><span class="label svelte-1lr878v">ID</span> <strong class="mono svelte-1lr878v">${escape_html(log().id)}</strong></div></div>`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			GlassPanel($$renderer, {
				class: "fill compare-panel",
				children: ($$renderer) => {
					$$renderer.push(`<div class="compare-head svelte-1lr878v"><h3 class="svelte-1lr878v">Perbandingan</h3> <span class="count svelte-1lr878v">${escape_html(log().changes.length)} field</span></div> `);
					if (log().changes.length === 0) $$renderer.push(`<!--[0--><p class="state svelte-1lr878v">Tidak ada perubahan data.</p>`);
					else {
						$$renderer.push(`<!--[-1--><div class="compare-wrap svelte-1lr878v"><table class="compare-table svelte-1lr878v"><thead><tr><th class="svelte-1lr878v">Field</th><th class="svelte-1lr878v">Before</th><th class="svelte-1lr878v"></th><th class="svelte-1lr878v">After</th></tr></thead><tbody class="svelte-1lr878v"><!--[-->`);
						const each_array = ensure_array_like(log().changes);
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let change = each_array[$$index];
							$$renderer.push(`<tr${attr_class("svelte-1lr878v", void 0, { "changed": change.before !== change.after })}><td class="field svelte-1lr878v">${escape_html(change.label)}</td><td class="before svelte-1lr878v"><span${attr_class("svelte-1lr878v", void 0, { "empty": change.before === "â€”" })}>${escape_html(change.before)}</span></td><td class="arrow svelte-1lr878v" aria-hidden="true">â†’</td><td class="after svelte-1lr878v"><span${attr_class("svelte-1lr878v", void 0, { "empty": change.after === "â€”" })}>${escape_html(change.after)}</span></td></tr>`);
						}
						$$renderer.push(`<!--]--></tbody></table></div>`);
					}
					$$renderer.push(`<!--]--> <div class="foot svelte-1lr878v"><a class="back svelte-1lr878v" href="/activity-log">â† Kembali</a></div>`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!---->`);
		}
		$$renderer.push(`<!--]--></section>`);
	});
}
//#endregion
export { _page as default };

//# sourceMappingURL=_page.svelte.js.map