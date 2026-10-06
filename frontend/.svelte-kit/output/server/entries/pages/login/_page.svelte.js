import { a as ensure_array_like, c as stringify, f as escape_html, n as attr_style, t as attr_class, u as attr } from "../../../chunks/server.js";
import "../../../chunks/navigation.js";
import { t as edm_logo_default } from "../../../chunks/edm-logo.js";
//#region src/lib/assets/edm-logo-white.png
var edm_logo_white_default = "/edm-task-monitoring/backend/spa/_app/immutable/assets/edm-logo-white.DFYKH4Gt.png";
//#endregion
//#region src/routes/login/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const FEATURES = [
			{
				label: "Real-time",
				color: "#7c8cf8"
			},
			{
				label: "Analytics",
				color: "#34d399"
			},
			{
				label: "Terintegrasi",
				color: "#f59e0b"
			}
		];
		let username = "";
		let password = "";
		let remember = true;
		$$renderer.push(`<div class="login-page svelte-1x05zx6"><div class="login-frame svelte-1x05zx6"><aside class="brand-panel svelte-1x05zx6" aria-label="EDM Task Monitoring"><div class="brand-glow svelte-1x05zx6" aria-hidden="true"></div> <div class="brand-glow-2 svelte-1x05zx6" aria-hidden="true"></div> <div class="brand-glow-3 svelte-1x05zx6" aria-hidden="true"></div> <div class="brand-edge-line svelte-1x05zx6" aria-hidden="true"></div> <div class="brand-watermark svelte-1x05zx6" aria-hidden="true"><img${attr("src", edm_logo_white_default)} alt="" class="svelte-1x05zx6"/></div> <div class="brand-ring svelte-1x05zx6" aria-hidden="true"></div> <div class="brand-diamond svelte-1x05zx6" aria-hidden="true"></div> <div class="brand-top svelte-1x05zx6"></div> <div class="brand-copy svelte-1x05zx6"><span class="live-badge svelte-1x05zx6"><span class="live-dot svelte-1x05zx6" aria-hidden="true"></span> Operation Monitoring <span class="dot-sep svelte-1x05zx6">•</span> Live</span> <h1 class="brand-title svelte-1x05zx6">Kelola Tugas,<br class="svelte-1x05zx6"/>Tingkatkan Produktivitas</h1> <p class="brand-sub svelte-1x05zx6">Pantau, kelola, dan capai target tim Anda dalam satu platform yang terintegrasi secara
          real-time.</p> <div class="brand-tags svelte-1x05zx6" role="list"><!--[-->`);
		const each_array = ensure_array_like(FEATURES);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let f = each_array[$$index];
			$$renderer.push(`<span class="feature-pill svelte-1x05zx6" role="listitem"><span class="feature-dot svelte-1x05zx6"${attr_style(`background:${stringify(f.color)}`)} aria-hidden="true"></span> ${escape_html(f.label)}</span>`);
		}
		$$renderer.push(`<!--]--></div></div> <footer class="brand-foot svelte-1x05zx6"><span class="foot-icon svelte-1x05zx6"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="svelte-1x05zx6"><circle cx="9" cy="8.5" r="2.6" stroke="currentColor" stroke-width="1.6" class="svelte-1x05zx6"></circle><path d="M4.5 18c.6-2.6 2.3-4 4.5-4s3.9 1.4 4.5 4M15 9.2c1.5.2 2.6 1.1 3 3.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" class="svelte-1x05zx6"></path></svg></span> <span class="foot-icon svelte-1x05zx6"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="svelte-1x05zx6"><path d="M3 12h3.5l2-5 4 10 2-7 1.5 2H21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="svelte-1x05zx6"></path></svg></span> <span class="foot-text svelte-1x05zx6">COPYRIGHT EDM TASK MONITOR – ${escape_html((/* @__PURE__ */ new Date()).getFullYear())}</span> <span class="foot-line svelte-1x05zx6" aria-hidden="true"></span></footer></aside> <section class="form-panel svelte-1x05zx6"><div class="form-inner svelte-1x05zx6"><header class="form-head svelte-1x05zx6"><img${attr("src", edm_logo_default)} alt="EDM Task Monitoring" class="form-logo svelte-1x05zx6"/> <h2 class="form-title svelte-1x05zx6">Selamat datang kembali</h2> <p class="form-sub svelte-1x05zx6">Masuk ke akun EDM Task Monitoring Anda</p></header> <span class="dash-tag svelte-1x05zx6"><span class="dash-dot svelte-1x05zx6" aria-hidden="true"></span> Task Monitoring Dashboard</span> <form class="form svelte-1x05zx6" novalidate=""><div${attr_class("field svelte-1x05zx6", void 0, { "on": false })}><label for="username" class="svelte-1x05zx6">Username</label> <div class="input-shell svelte-1x05zx6"><span class="input-icon svelte-1x05zx6" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" class="svelte-1x05zx6"><circle cx="12" cy="8.5" r="3.2" stroke="currentColor" stroke-width="1.7" class="svelte-1x05zx6"></circle><path d="M6.5 19.5c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" class="svelte-1x05zx6"></path></svg></span> <input id="username" type="text" placeholder="Masukkan username" autocomplete="username"${attr("value", username)} class="svelte-1x05zx6"/></div></div> <div${attr_class("field svelte-1x05zx6", void 0, { "on": false })}><label for="password" class="svelte-1x05zx6">Password</label> <div class="input-shell svelte-1x05zx6"><span class="input-icon svelte-1x05zx6" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" class="svelte-1x05zx6"><rect x="5" y="11" width="14" height="10" rx="2.2" stroke="currentColor" stroke-width="1.7" class="svelte-1x05zx6"></rect><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" class="svelte-1x05zx6"></path></svg></span> <input id="password"${attr("type", "password")} placeholder="Masukkan password" autocomplete="current-password"${attr("value", password)} class="svelte-1x05zx6"/> <button type="button" class="eye svelte-1x05zx6"${attr("aria-label", "Tampilkan password")} tabindex="-1">`);
		$$renderer.push(`<!--[-1--><svg viewBox="0 0 24 24" fill="none" class="svelte-1x05zx6"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5.4 0-9-6-9-6a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c5.4 0 9 6 9 6a18.5 18.5 0 0 1-2.16 3.19M3 3l18 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" class="svelte-1x05zx6"></path></svg>`);
		$$renderer.push(`<!--]--></button></div></div> <div class="form-row svelte-1x05zx6"><label class="check svelte-1x05zx6"><input type="checkbox"${attr("checked", remember, true)} class="svelte-1x05zx6"/> <span class="svelte-1x05zx6">Ingat saya</span></label> <button type="button" class="link-quiet svelte-1x05zx6">Lupa password?</button></div> <button type="submit" class="btn-primary svelte-1x05zx6">Masuk <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="svelte-1x05zx6"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svelte-1x05zx6"></path></svg></button></form> <div class="divider svelte-1x05zx6"><span class="svelte-1x05zx6">EDM</span></div> <p class="form-foot svelte-1x05zx6">Task Monitoring System <br class="svelte-1x05zx6"/>Hubungi admin untuk bantuan akses.</p></div></section></div></div>`);
	});
}
//#endregion
export { _page as default };

//# sourceMappingURL=_page.svelte.js.map