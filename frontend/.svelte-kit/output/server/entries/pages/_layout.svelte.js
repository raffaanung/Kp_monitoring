import { f as escape_html, i as derived, s as slot, t as attr_class, u as attr } from "../../chunks/server.js";
import "../../chunks/navigation.js";
import { t as edm_logo_default } from "../../chunks/edm-logo.js";
import "../../chunks/avatar-farras.js";
import { C as taskModuleStore } from "../../chunks/taskModuleStore.svelte.js";
import { n as NotificationBell, t as ProfileSwitcher } from "../../chunks/ProfileSwitcher.js";
import { i as settingsStore, r as displayName, t as avatarUrl } from "../../chunks/settingsStore.svelte.js";
//#region src/lib/Layout.svelte
function Layout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children } = $$props;
		const session = derived(() => {
			taskModuleStore.session;
			return taskModuleStore.session;
		});
		const profileName = derived(() => {
			settingsStore.byPersona;
			taskModuleStore.session;
			return displayName();
		});
		const profileAvatar = derived(() => {
			settingsStore.byPersona;
			taskModuleStore.session;
			return avatarUrl() || "/edm-task-monitoring/backend/spa/_app/immutable/assets/avatar-farras.JxOz34v6.jpg";
		});
		/** Expanded = full + labels; collapsed = icon-only (hide) */
		let railExpanded = typeof localStorage === "undefined" ? false : localStorage.getItem("edm-rail-expanded") === "1";
		const path = derived(() => router.location || "/");
		const isLoginPage = derived(() => path() === "/login");
		const onTasks = derived(() => path().startsWith("/tasks"));
		const onRequirements = derived(() => path().startsWith("/requirements"));
		derived(() => path().startsWith("/registry"));
		const onAccess = derived(() => path().startsWith("/access"));
		let workboardOpen = false;
		let settingsOpen = false;
		/** Same labels as sidebar nav — driven by current route */
		const section = derived(() => {
			if (path().startsWith("/tasks/board") || path() === "/tasks" || path() === "/tasks/new" || path() === "/tasks/detail") return {
				title: "Workboard",
				sub: "Kanban Board"
			};
			if (path().startsWith("/tasks/list")) return {
				title: "Workboard",
				sub: "List"
			};
			if (path().startsWith("/tasks")) return {
				title: "Workboard",
				sub: "Detail"
			};
			if (path().startsWith("/requirements")) return {
				title: "Workboard",
				sub: "Requirements & Backlog"
			};
			if (path().startsWith("/registry")) return {
				title: "Katalog Aplikasi",
				sub: "Daftar Portofolio Aplikasi"
			};
			if (/^\/activity-log\/log-/.test(path())) return {
				title: "Activity Log",
				sub: "Detail perubahan"
			};
			if (path().startsWith("/activity-log")) return {
				title: "Activity Log",
				sub: "Riwayat aktivitas sistem"
			};
			if (path() === "/access/users" || path() === "/access") return {
				title: "Settings & Access",
				sub: "User List"
			};
			if (path().startsWith("/access/roles")) return {
				title: "Settings & Access",
				sub: "Role Management"
			};
			if (path() === "/access/profile") return {
				title: "Settings & Access",
				sub: "Profile"
			};
			if (path().startsWith("/access")) return {
				title: "Settings & Access",
				sub: "Manajemen akses pengguna"
			};
			return {
				title: "Dashboard",
				sub: "Overview operasional proyek"
			};
		});
		const isHome = derived(() => path() === "/");
		function isAccessSub(sub) {
			if (sub === "users") return path() === "/access" || path() === "/access/users";
			if (sub === "roles") return path() === "/access/roles";
			if (sub === "profile") return path() === "/access/profile";
			return false;
		}
		if (isLoginPage()) {
			$$renderer.push("<!--[0-->");
			children($$renderer);
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push(`<!--[-1--><div${attr_class("shell svelte-1o7793x", void 0, { "expanded": railExpanded })}><div class="rail-wrap svelte-1o7793x"><aside class="rail svelte-1o7793x" aria-label="Navigasi utama"${attr("aria-expanded", railExpanded)}><div class="rail-inner svelte-1o7793x"><div class="rail-top svelte-1o7793x"><button type="button" class="circle rail-toggle svelte-1o7793x"${attr("aria-label", railExpanded ? "Sembunyikan navigasi" : "Tampilkan navigasi")}${attr("title", railExpanded ? "Sembunyikan" : "Tampilkan")}><span class="toggle-icon collapse svelte-1o7793x" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" class="svelte-1o7793x"><path d="M14.5 7.5 10 12l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span> <span class="toggle-icon expand svelte-1o7793x" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" class="svelte-1o7793x"><path d="M9.5 7.5 14 12l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></button> <span class="rail-menu-title svelte-1o7793x"${attr("aria-hidden", !railExpanded)}>All Menu</span></div> <nav class="svelte-1o7793x"><a href="/" class="nav-item svelte-1o7793x" aria-label="Dashboard" title="Dashboard"><span class="circle svelte-1o7793x" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" class="svelte-1o7793x"><rect x="3.5" y="4.5" width="17" height="13" rx="2.2" stroke="currentColor" stroke-width="1.7"></rect><path d="M7 14.2 9.6 10.8l2.2 2.4 3.4-4.6 2.3 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 19.5h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg></span> <span class="nav-label svelte-1o7793x">Dashboard</span></a> <a href="/registry/list" class="nav-item svelte-1o7793x" aria-label="Katalog Aplikasi" title="Katalog Aplikasi"><span class="circle svelte-1o7793x" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" class="svelte-1o7793x"><path d="M13 4.5 8.2 13h3.1L11 19.5 15.8 11h-3.1L13 4.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></svg></span> <span class="nav-label svelte-1o7793x">Katalog Aplikasi</span></a> <div${attr_class("nav-group svelte-1o7793x", void 0, { "open": workboardOpen })}><button type="button"${attr_class("nav-item svelte-1o7793x", void 0, { "active": onTasks() || onRequirements() })} aria-label="Workboard" title="Workboard"><span class="circle svelte-1o7793x" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" class="svelte-1o7793x"><path d="M7 6.5h10M7 12h10M7 17.5h6.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path></svg></span> <span class="nav-label svelte-1o7793x">Workboard</span> <span class="nav-chevron svelte-1o7793x" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" class="svelte-1o7793x"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></button> <div${attr_class("subnav svelte-1o7793x", void 0, { "visible": workboardOpen })}><a href="/requirements/list"${attr_class("sub-item svelte-1o7793x", void 0, { "on": onRequirements() })}>Backlog &amp; Requirements</a> <a href="/tasks/board"${attr_class("sub-item svelte-1o7793x", void 0, { "on": onTasks() })}>Kanban Board</a></div></div> <div${attr_class("nav-group svelte-1o7793x", void 0, { "open": settingsOpen })}><button type="button"${attr_class("nav-item svelte-1o7793x", void 0, { "active": onAccess() })} aria-label="Settings &amp; Access" title="Settings &amp; Access"><span class="circle svelte-1o7793x" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" class="svelte-1o7793x"><circle cx="12" cy="8.5" r="3.2" stroke="currentColor" stroke-width="1.7"></circle><path d="M6.5 19.5c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path><path d="M16.5 7.5h3.5M18.25 5.75v3.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg></span> <span class="nav-label svelte-1o7793x">Settings &amp; Access</span> <span class="nav-chevron svelte-1o7793x" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" class="svelte-1o7793x"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></button> <div${attr_class("subnav svelte-1o7793x", void 0, { "visible": settingsOpen })}><a href="/access/users"${attr_class("sub-item svelte-1o7793x", void 0, { "on": isAccessSub("users") })}>Users</a> <a href="/access/roles"${attr_class("sub-item svelte-1o7793x", void 0, { "on": isAccessSub("roles") })}>Roles</a></div></div> <a href="/activity-log" class="nav-item svelte-1o7793x" aria-label="Activity Log" title="Activity Log"><span class="circle svelte-1o7793x" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" class="svelte-1o7793x"><path d="M8 5.5h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path><path d="M9.5 9h5M9.5 12h5M9.5 15h3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path></svg></span> <span class="nav-label svelte-1o7793x">Activity Log</span></a></nav> <button type="button" class="nav-item rail-foot svelte-1o7793x" aria-label="Keluar" title="Keluar"><span class="circle svelte-1o7793x" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" class="svelte-1o7793x"><circle cx="11" cy="12" r="6.2" stroke="currentColor" stroke-width="1.7"></circle><path d="M11 12h8.5M17.2 9.2 20 12l-2.8 2.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path></svg></span> <span class="nav-label svelte-1o7793x">Keluar</span></button></div></aside></div> <div class="stage svelte-1o7793x">`);
			if (!isHome()) {
				$$renderer.push(`<!--[0--><header class="section-head svelte-1o7793x"><a href="/" class="brand-logo svelte-1o7793x" aria-label="EDM Task Monitoring" title="EDM Task Monitoring"><img${attr("src", edm_logo_default)} alt="EDM Task Monitoring" class="svelte-1o7793x"/></a> <div class="section-copy svelte-1o7793x"><h1 class="svelte-1o7793x">${escape_html(section().title)}</h1> <p class="svelte-1o7793x">${escape_html(section().sub)}</p></div> <div class="chrome-right svelte-1o7793x">`);
				NotificationBell($$renderer, {});
				$$renderer.push(`<!----> `);
				ProfileSwitcher($$renderer, {
					name: profileName(),
					label: session().label,
					avatar: profileAvatar(),
					currentId: session().id
				});
				$$renderer.push(`<!----></div></header>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="stage-body svelte-1o7793x">`);
			children($$renderer);
			$$renderer.push(`<!----></div></div></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/routes/+layout.svelte
function _layout($$renderer, $$props) {
	Layout($$renderer, {
		children: ($$renderer) => {
			$$renderer.push(`<!--[-->`);
			slot($$renderer, $$props, "default", {}, null);
			$$renderer.push(`<!--]-->`);
		},
		$$slots: { default: true }
	});
}
//#endregion
export { _layout as default };

//# sourceMappingURL=_layout.svelte.js.map