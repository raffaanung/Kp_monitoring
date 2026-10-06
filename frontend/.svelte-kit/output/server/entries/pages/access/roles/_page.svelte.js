import { a as ensure_array_like, f as escape_html, i as derived, u as attr } from "../../../../chunks/server.js";
import { t as GlassPanel } from "../../../../chunks/GlassPanel.js";
import { t as SubmenuHeader } from "../../../../chunks/SubmenuHeader.js";
import { n as countUsersInRole, t as accessStore } from "../../../../chunks/accessStore.svelte.js";
//#region src/routes/access/roles/+page.svelte
function trashIcon($$renderer) {
	$$renderer.push(`<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M6 6l1 14h10l1-14"></path><path d="M10 11v6M14 11v6"></path></svg>`);
}
function editIcon($$renderer) {
	$$renderer.push(`<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`);
}
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const roles = derived(() => accessStore.roles);
		const permissions = derived(() => accessStore.permissions);
		/** @param {import('../../lib/accessStore.svelte.js').AccessRole} role */
		function enabledCount(role) {
			return permissions().filter((p) => role.permissions[p.key]).length;
		}
		/** @param {import('../../lib/accessStore.svelte.js').AccessRole} role @param {string} key */
		function hasPerm(role, key) {
			return !!role.permissions[key];
		}
		const groups = derived(() => {
			/** @type {Map<string, typeof permissions>} */
			const map = /* @__PURE__ */ new Map();
			for (const p of permissions()) {
				const list = map.get(p.group) || [];
				list.goto(p);
				map.set(p.group, list);
			}
			return [...map.entries()];
		});
		$$renderer.push(`<section class="page svelte-1x26vnh">`);
		GlassPanel($$renderer, {
			children: ($$renderer) => {
				{
					function actions($$renderer) {
						$$renderer.push(`<div class="head-actions svelte-1x26vnh"><button type="button" class="btn-primary">+ Tambah Role</button></div>`);
					}
					SubmenuHeader($$renderer, {
						eyebrow: "User Access",
						title: "Role Management",
						sub: "Daftar peran dan matriks permission",
						meta: `${roles().length} role`,
						actions,
						$$slots: { actions: true }
					});
				}
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----> `);
		GlassPanel($$renderer, {
			class: "fill",
			children: ($$renderer) => {
				$$renderer.push(`<div class="split svelte-1x26vnh"><div class="role-list svelte-1x26vnh"><h3 class="svelte-1x26vnh">List Role</h3> <div class="role-cards svelte-1x26vnh"><!--[-->`);
				const each_array = ensure_array_like(roles());
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let role = each_array[$$index];
					$$renderer.push(`<article class="role-card svelte-1x26vnh"><div class="role-head svelte-1x26vnh"><strong class="svelte-1x26vnh">${escape_html(role.name)}</strong> <div class="role-meta svelte-1x26vnh"><span class="count svelte-1x26vnh">${escape_html(countUsersInRole(role.id))} user</span> <button type="button" class="icon-btn svelte-1x26vnh"${attr("title", `Edit role ${role.name}`)}${attr("aria-label", `Edit role ${role.name}`)}>`);
					editIcon($$renderer);
					$$renderer.push(`<!----></button> <button type="button" class="icon-btn icon-del svelte-1x26vnh"${attr("title", `Hapus role ${role.name}`)}${attr("aria-label", `Hapus role ${role.name}`)}>`);
					trashIcon($$renderer);
					$$renderer.push(`<!----></button></div></div> <p class="svelte-1x26vnh">${escape_html(role.description)}</p> <div class="perm-summary svelte-1x26vnh"><span class="chip svelte-1x26vnh">${escape_html(enabledCount(role))}/${escape_html(permissions().length)} permission</span></div></article>`);
				}
				$$renderer.push(`<!--]--></div></div> <div class="matrix-wrap svelte-1x26vnh"><h3 class="svelte-1x26vnh">Permission Matrix</h3> <p class="hint svelte-1x26vnh">Centang untuk mengaktifkan permission pada masing-masing role.</p> <div class="matrix-scroll svelte-1x26vnh"><table class="matrix svelte-1x26vnh"><thead><tr><th class="sticky-col svelte-1x26vnh">Permission</th><!--[-->`);
				const each_array_1 = ensure_array_like(roles());
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let role = each_array_1[$$index_1];
					$$renderer.push(`<th class="svelte-1x26vnh">${escape_html(role.name)}</th>`);
				}
				$$renderer.push(`<!--]--></tr></thead><tbody>`);
				if (permissions().length === 0) $$renderer.push(`<!--[0--><tr><td class="empty svelte-1x26vnh"${attr("colspan", roles().length + 1)}>Belum ada permission. Klik "+ Tambah Permission" untuk membuat.</td></tr>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--><!--[-->`);
				const each_array_2 = ensure_array_like(groups());
				for (let $$index_4 = 0, $$length = each_array_2.length; $$index_4 < $$length; $$index_4++) {
					let [group, perms] = each_array_2[$$index_4];
					$$renderer.push(`<tr class="group-row svelte-1x26vnh"><td${attr("colspan", roles().length + 1)} class="svelte-1x26vnh">${escape_html(group)}</td></tr> <!--[-->`);
					const each_array_3 = ensure_array_like(perms);
					for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
						let perm = each_array_3[$$index_3];
						$$renderer.push(`<tr><td class="sticky-col perm-label svelte-1x26vnh">${escape_html(perm.label)}</td><!--[-->`);
						const each_array_4 = ensure_array_like(roles());
						for (let $$index_2 = 0, $$length = each_array_4.length; $$index_2 < $$length; $$index_2++) {
							let role = each_array_4[$$index_2];
							$$renderer.push(`<td class="cell-check svelte-1x26vnh"><label class="toggle svelte-1x26vnh"${attr("title", `${perm.label} Â· ${role.name}`)}><input type="checkbox"${attr("checked", hasPerm(role, perm.key), true)} class="svelte-1x26vnh"/> <span class="box svelte-1x26vnh" aria-hidden="true"></span></label></td>`);
						}
						$$renderer.push(`<!--]--></tr>`);
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]--></tbody></table></div></div></div>`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----></section> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { _page as default };

//# sourceMappingURL=_page.svelte.js.map