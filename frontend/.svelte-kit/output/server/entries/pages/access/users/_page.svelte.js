import { a as ensure_array_like, f as escape_html, i as derived, t as attr_class, u as attr } from "../../../../chunks/server.js";
import { t as GlassPanel } from "../../../../chunks/GlassPanel.js";
import { t as SubmenuHeader } from "../../../../chunks/SubmenuHeader.js";
import { a as roleOptions, c as teamOptions, i as roleLabel, o as statusLabel, r as listUsers, s as teamLabels } from "../../../../chunks/accessStore.svelte.js";
//#region src/routes/access/users/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let role = "";
		let status = "";
		let q = "";
		let applied = {
			role: "",
			unit: "",
			team: "",
			status: "",
			q: ""
		};
		const items = derived(() => listUsers(applied));
		const roles = derived(roleOptions);
		derived(teamOptions);
		/** @param {string} n */
		function initials(n) {
			return n.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
		}
		$$renderer.push(`<section class="page svelte-1u98p8e">`);
		GlassPanel($$renderer, {
			children: ($$renderer) => {
				{
					function actions($$renderer) {
						$$renderer.push(`<button type="button" class="btn-primary">+ Tambah User</button>`);
					}
					SubmenuHeader($$renderer, {
						eyebrow: "User Access",
						title: "User List",
						sub: "Kelola akun pengguna, peran, unit, dan tim",
						meta: `${items().length} user`,
						actions,
						$$slots: { actions: true }
					});
				}
				$$renderer.push(`<!----> <form class="filters svelte-1u98p8e"><label class="svelte-1u98p8e"><span class="svelte-1u98p8e">Peran</span> `);
				$$renderer.select({
					value: role,
					class: ""
				}, ($$renderer) => {
					$$renderer.option({ value: "" }, ($$renderer) => {
						$$renderer.push(`Semua`);
					});
					$$renderer.push(`<!--[-->`);
					const each_array = ensure_array_like(roles());
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let opt = each_array[$$index];
						$$renderer.option({ value: opt.value }, ($$renderer) => {
							$$renderer.push(`${escape_html(opt.label)}`);
						});
					}
					$$renderer.push(`<!--]-->`);
				}, "svelte-1u98p8e");
				$$renderer.push(`</label> <label class="svelte-1u98p8e"><span class="svelte-1u98p8e">Status</span> `);
				$$renderer.select({
					value: status,
					class: ""
				}, ($$renderer) => {
					$$renderer.option({ value: "" }, ($$renderer) => {
						$$renderer.push(`Semua`);
					});
					$$renderer.option({ value: "active" }, ($$renderer) => {
						$$renderer.push(`Aktif`);
					});
					$$renderer.option({ value: "inactive" }, ($$renderer) => {
						$$renderer.push(`Nonaktif`);
					});
				}, "svelte-1u98p8e");
				$$renderer.push(`</label> <label class="grow svelte-1u98p8e"><span class="svelte-1u98p8e">Cari</span> <div class="search svelte-1u98p8e"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="svelte-1u98p8e"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7"></circle><path d="m16.5 16.5 3.2 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg> <input type="search" placeholder="Nama, email, unit, timâ€¦"${attr("value", q)} class="svelte-1u98p8e"/></div></label> <button type="submit" class="apply svelte-1u98p8e">Terapkan</button></form>`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----> `);
		GlassPanel($$renderer, {
			class: "fill table-panel",
			children: ($$renderer) => {
				if (items().length === 0) $$renderer.push(`<!--[0--><p class="state svelte-1u98p8e">Tidak ada user yang cocok.</p>`);
				else {
					$$renderer.push(`<!--[-1--><div class="table-wrap svelte-1u98p8e"><table class="svelte-1u98p8e"><thead><tr><th class="svelte-1u98p8e">ID</th><th class="svelte-1u98p8e">User</th><th class="svelte-1u98p8e">Peran</th><th class="svelte-1u98p8e">Unit</th><th class="svelte-1u98p8e">Tim</th><th class="svelte-1u98p8e">Status</th></tr></thead><tbody class="svelte-1u98p8e"><!--[-->`);
					const each_array_1 = ensure_array_like(items());
					for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
						let user = each_array_1[$$index_2];
						$$renderer.push(`<tr${attr_class("svelte-1u98p8e", void 0, { "inactive": user.status === "inactive" })}><td class="svelte-1u98p8e"><span class="mono-id svelte-1u98p8e">#${escape_html(user.id)}</span></td><td class="svelte-1u98p8e"><span class="user-cell svelte-1u98p8e"><i class="face svelte-1u98p8e">${escape_html(initials(user.name))}</i> <span><strong class="svelte-1u98p8e">${escape_html(user.name)}</strong> <small class="svelte-1u98p8e">${escape_html(user.email)}</small></span></span></td><td class="svelte-1u98p8e"><span class="chip role svelte-1u98p8e">${escape_html(roleLabel(user.role_id))}</span></td><td class="svelte-1u98p8e">${escape_html(user.unit)}</td><td class="svelte-1u98p8e"><div class="team-chips svelte-1u98p8e">`);
						const each_array_2 = ensure_array_like(teamLabels(user.team_ids));
						if (each_array_2.length !== 0) {
							$$renderer.push("<!--[-->");
							for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
								let label = each_array_2[$$index_1];
								$$renderer.push(`<span class="chip team svelte-1u98p8e">${escape_html(label)}</span>`);
							}
						} else $$renderer.push(`<!--[!--><span class="muted svelte-1u98p8e">â€”</span>`);
						$$renderer.push(`<!--]--></div></td><td class="svelte-1u98p8e"><span${attr_class(`chip st-${user.status}`, "svelte-1u98p8e")}>${escape_html(statusLabel(user.status))}</span></td></tr>`);
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