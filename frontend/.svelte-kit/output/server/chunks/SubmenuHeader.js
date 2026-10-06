import { f as escape_html } from "./server.js";
//#region src/lib/SubmenuHeader.svelte
function SubmenuHeader($$renderer, $$props) {
	/**
	* Standard header for non-home submenus (Task, Registry, …).
	* @type {{
	*   eyebrow?: string,
	*   title: string,
	*   sub?: string,
	*   meta?: string,
	*   actions?: import('svelte').Snippet,
	* }}
	*/
	let { eyebrow = "", title, sub = "", meta = "", actions } = $$props;
	$$renderer.push(`<div class="submenu-head svelte-j27j47"><div class="left svelte-j27j47">`);
	if (eyebrow) $$renderer.push(`<!--[0--><span class="eyebrow svelte-j27j47">${escape_html(eyebrow)}</span>`);
	else $$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]--> <div class="title-row svelte-j27j47"><h2 class="svelte-j27j47">${escape_html(title)}</h2> `);
	if (meta) $$renderer.push(`<!--[0--><span class="meta svelte-j27j47">${escape_html(meta)}</span>`);
	else $$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]--></div> `);
	if (sub) $$renderer.push(`<!--[0--><p class="sub svelte-j27j47">${escape_html(sub)}</p>`);
	else $$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]--></div> `);
	if (actions) {
		$$renderer.push(`<!--[0--><div class="actions svelte-j27j47">`);
		actions($$renderer);
		$$renderer.push(`<!----></div>`);
	} else $$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]--></div>`);
}
//#endregion
export { SubmenuHeader as t };

//# sourceMappingURL=SubmenuHeader.js.map