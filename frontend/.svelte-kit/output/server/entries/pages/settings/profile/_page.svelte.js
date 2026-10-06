import { f as escape_html, i as derived, u as attr } from "../../../../chunks/server.js";
import "../../../../chunks/avatar-farras.js";
import { C as taskModuleStore } from "../../../../chunks/taskModuleStore.svelte.js";
import { i as settingsStore, n as currentProfile } from "../../../../chunks/settingsStore.svelte.js";
import { t as GlassPanel } from "../../../../chunks/GlassPanel.js";
import { t as SubmenuHeader } from "../../../../chunks/SubmenuHeader.js";
//#region src/routes/settings/profile/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const profile = derived(() => {
			settingsStore.byPersona;
			taskModuleStore.session;
			return currentProfile();
		});
		const session = derived(() => {
			taskModuleStore.session;
			return taskModuleStore.session;
		});
		const avatarSrc = derived(() => profile().avatarDataUrl || "/edm-task-monitoring/backend/spa/_app/immutable/assets/avatar-farras.JxOz34v6.jpg");
		const shownName = derived(() => profile().displayName?.trim() || session().name);
		$$renderer.push(`<section class="page svelte-xebt6w">`);
		GlassPanel($$renderer, {
			children: ($$renderer) => {
				SubmenuHeader($$renderer, {
					eyebrow: "User Access",
					title: "Profile",
					sub: "Kelola foto dan info akun",
					meta: shownName()
				});
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----> `);
		GlassPanel($$renderer, {
			class: "fill",
			children: ($$renderer) => {
				$$renderer.push(`<div class="grid svelte-xebt6w"><article class="card svelte-xebt6w"><div class="card-top svelte-xebt6w"><div><h3 class="svelte-xebt6w">Edit Foto</h3> <p class="svelte-xebt6w">Foto profil yang tampil di header aplikasi</p></div> <button type="button" class="btn svelte-xebt6w">Ubah foto</button></div> <div class="photo-row svelte-xebt6w"><img class="avatar svelte-xebt6w"${attr("src", avatarSrc())} alt=""/> <div class="photo-meta svelte-xebt6w"><strong class="svelte-xebt6w">${escape_html(shownName())}</strong> <small class="svelte-xebt6w">${escape_html(session().label)} Â· ${escape_html(session().role)}</small></div></div></article> <article class="card svelte-xebt6w"><div class="card-top svelte-xebt6w"><div><h3 class="svelte-xebt6w">Edit Info</h3> <p class="svelte-xebt6w">Nama tampilan, kontak, dan unit</p></div> <button type="button" class="btn svelte-xebt6w">Edit info</button></div> <dl class="info-list svelte-xebt6w"><div><dt class="svelte-xebt6w">Nama tampilan</dt> <dd class="svelte-xebt6w">${escape_html(shownName())}</dd></div> <div><dt class="svelte-xebt6w">Email</dt> <dd class="svelte-xebt6w">${escape_html(profile().email || "â€”")}</dd></div> <div><dt class="svelte-xebt6w">Telepon</dt> <dd class="svelte-xebt6w">${escape_html(profile().phone || "â€”")}</dd></div> <div><dt class="svelte-xebt6w">Unit</dt> <dd class="svelte-xebt6w">${escape_html(profile().unit || "â€”")}</dd></div> <div class="full svelte-xebt6w"><dt class="svelte-xebt6w">Bio</dt> <dd class="svelte-xebt6w">${escape_html(profile().bio || "â€”")}</dd></div></dl> `);
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></article></div>`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----></section> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { _page as default };

//# sourceMappingURL=_page.svelte.js.map