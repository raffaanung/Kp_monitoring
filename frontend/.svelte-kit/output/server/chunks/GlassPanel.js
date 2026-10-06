import { c as stringify, t as attr_class } from "./server.js";
//#region src/lib/GlassPanel.svelte
function GlassPanel($$renderer, $$props) {
	/**
	* Kartu satu layer untuk isi halaman submenu.
	* @type {{ children?: import('svelte').Snippet, class?: string }}
	*/
	let { children, class: className = "" } = $$props;
	$$renderer.push(`<div${attr_class(`panel-glow ${stringify(className)}`, "svelte-1ketz01")}><article class="panel svelte-1ketz01">`);
	if (children) {
		$$renderer.push("<!--[0-->");
		children($$renderer);
		$$renderer.push(`<!---->`);
	} else $$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]--></article></div>`);
}
//#endregion
export { GlassPanel as t };

//# sourceMappingURL=GlassPanel.js.map