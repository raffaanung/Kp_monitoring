import { f as escape_html, i as derived, u as attr } from "./server.js";
import "./navigation.js";
import { C as taskModuleStore, D as unreadNotificationCount, y as myNotifications } from "./taskModuleStore.svelte.js";
//#region src/lib/NotificationBell.svelte
function NotificationBell($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let open = false;
		derived(() => {
			taskModuleStore.notifications;
			taskModuleStore.session;
			return myNotifications();
		});
		const unread = derived(() => {
			taskModuleStore.notifications;
			taskModuleStore.session;
			return unreadNotificationCount();
		});
		$$renderer.push(`<div class="notif-wrap svelte-3pyf9h"><button type="button" class="bell svelte-3pyf9h" aria-label="Notifikasi"${attr("aria-expanded", open)}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg> `);
		if (unread() > 0) $$renderer.push(`<!--[0--><span class="badge svelte-3pyf9h">${escape_html(unread() > 9 ? "9+" : unread())}</span>`);
		else $$renderer.push(`<!--[-1--><span class="badge svelte-3pyf9h">3</span>`);
		$$renderer.push(`<!--]--></button> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/lib/ProfileSwitcher.svelte
function ProfileSwitcher($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		/** @type {{ name: string, label: string, avatar: string, currentId: string }} */
		let { name, label, avatar, currentId } = $$props;
		$$renderer.push(`<div class="switcher svelte-11ger11"><button type="button" class="profile-chip svelte-11ger11" aria-haspopup="listbox"${attr("aria-expanded", false)}${attr("aria-label", `Ganti profil, sekarang ${name}`)}><img class="avatar svelte-11ger11"${attr("src", avatar)} alt=""/> <span class="profile-meta svelte-11ger11"><strong class="svelte-11ger11">${escape_html(name)}</strong> <small class="svelte-11ger11">${escape_html(label)}</small></span></button></div> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { NotificationBell as n, ProfileSwitcher as t };

//# sourceMappingURL=ProfileSwitcher.js.map