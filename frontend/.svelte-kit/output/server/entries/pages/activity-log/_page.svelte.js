import { a as ensure_array_like, f as escape_html, i as derived, t as attr_class, u as attr } from "../../../chunks/server.js";
import { t as GlassPanel } from "../../../chunks/GlassPanel.js";
import { t as SubmenuHeader } from "../../../chunks/SubmenuHeader.js";
import { i as objectTypeLabel, r as listActivityLogs, t as activityLogStore } from "../../../chunks/activityLogStore.svelte.js";
import { i as listDashboards, s as registryStore } from "../../../chunks/registryStore.svelte.js";
import { t as formatDate } from "../../../chunks/format.js";
//#region src/routes/activity-log/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let dateFrom = "";
		let dateTo = "";
		let dashboard = "";
		let applied = {
			dateFrom: "",
			dateTo: "",
			dashboard: ""
		};
		const items = derived(() => {
			activityLogStore.items;
			return listActivityLogs(applied);
		});
		const dashboards = derived(() => {
			registryStore.items;
			return listDashboards({ sort: "name_asc" });
		});
		/** @param {string} name */
		function initials(name) {
			return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
		}
		/** @param {string} stamp */
		function formatStamp(stamp) {
			const date = stamp.slice(0, 10);
			const time = stamp.slice(11, 16);
			return `${formatDate(date)} Â· ${time}`;
		}
		$$renderer.push(`<section class="page svelte-1ud3tcn">`);
		GlassPanel($$renderer, {
			children: ($$renderer) => {
				SubmenuHeader($$renderer, {
					title: "Riwayat",
					meta: `${items().length} entri`
				});
				$$renderer.push(`<!----> <form class="filters svelte-1ud3tcn"><label class="svelte-1ud3tcn"><span class="svelte-1ud3tcn">Dari</span> <input type="date"${attr("value", dateFrom)} class="svelte-1ud3tcn"/></label> <label class="svelte-1ud3tcn"><span class="svelte-1ud3tcn">Sampai</span> <input type="date"${attr("value", dateTo)} class="svelte-1ud3tcn"/></label> <label class="svelte-1ud3tcn"><span class="svelte-1ud3tcn">Dashboard</span> `);
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
						let item = each_array[$$index];
						$$renderer.option({ value: item.name }, ($$renderer) => {
							$$renderer.push(`${escape_html(item.name)}`);
						});
					}
					$$renderer.push(`<!--]-->`);
				}, "svelte-1ud3tcn");
				$$renderer.push(`</label> <button type="submit" class="apply svelte-1ud3tcn">Terapkan</button></form>`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----> `);
		GlassPanel($$renderer, {
			class: "fill table-panel",
			children: ($$renderer) => {
				if (items().length === 0) $$renderer.push(`<!--[0--><p class="state svelte-1ud3tcn">Tidak ada entri yang cocok.</p>`);
				else {
					$$renderer.push(`<!--[-1--><div class="table-wrap svelte-1ud3tcn"><table class="svelte-1ud3tcn"><thead><tr><th class="svelte-1ud3tcn">ID</th><th class="svelte-1ud3tcn">Waktu</th><th class="svelte-1ud3tcn">Aktor</th><th class="svelte-1ud3tcn">Aksi</th><th class="svelte-1ud3tcn">Objek</th><th class="svelte-1ud3tcn">Perubahan</th></tr></thead><tbody class="svelte-1ud3tcn"><!--[-->`);
					const each_array_1 = ensure_array_like(items());
					for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
						let log = each_array_1[$$index_1];
						$$renderer.push(`<tr class="svelte-1ud3tcn"><td class="svelte-1ud3tcn"><span class="mono-id svelte-1ud3tcn">${escape_html(log.id)}</span></td><td class="svelte-1ud3tcn"><span class="when svelte-1ud3tcn">${escape_html(formatStamp(log.at))}</span></td><td class="svelte-1ud3tcn"><span class="actor svelte-1ud3tcn"><i class="face svelte-1ud3tcn">${escape_html(initials(log.actor))}</i> ${escape_html(log.actor)}</span></td><td class="svelte-1ud3tcn"><span class="action-text svelte-1ud3tcn">${escape_html(log.action)}</span></td><td class="svelte-1ud3tcn"><span${attr_class(`chip obj-${log.objectType}`, "svelte-1ud3tcn")}>${escape_html(objectTypeLabel(log.objectType))}</span> <span class="obj-label svelte-1ud3tcn">${escape_html(log.objectLabel)}</span></td><td class="svelte-1ud3tcn"><a class="detail-link svelte-1ud3tcn"${attr("href", `/activity-log/${log.id}`)}>${escape_html(log.changes.length)} field</a></td></tr>`);
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