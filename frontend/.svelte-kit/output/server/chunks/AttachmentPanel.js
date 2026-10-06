import { f as escape_html, i as derived } from "./server.js";
import "./taskModuleStore.svelte.js";
//#region src/lib/attachmentStore.svelte.js
var META_KEY = "edm-fe-attachments-v1";
function loadMeta() {
	if (typeof localStorage === "undefined") return [];
	try {
		const raw = localStorage.getItem(META_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
var attachmentStore = { 
/** @type {AttachmentMeta[]} */
items: loadMeta() };
/**
* @param {AttachmentOwner} ownerType
* @param {string | number} ownerId
*/
function listAttachments(ownerType, ownerId) {
	const id = String(ownerId);
	return attachmentStore.items.filter((item) => item.ownerType === ownerType && item.ownerId === id).sort((a, b) => a.uploadedAt < b.uploadedAt ? 1 : -1);
}
//#endregion
//#region src/lib/AttachmentPanel.svelte
function AttachmentPanel($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		/**
		* @type {{
		*   ownerType: 'requirement' | 'dashboard',
		*   ownerId: string | number,
		*   canManage?: boolean,
		* }}
		*/
		let { ownerType, ownerId, canManage = true } = $$props;
		const files = derived(() => {
			attachmentStore.items;
			return listAttachments(ownerType, ownerId);
		});
		$$renderer.push(`<button type="button" class="pill attach-trigger svelte-xa9mpg">File Panduan${escape_html(files().length ? ` · ${files().length}` : "")}</button> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { AttachmentPanel as t };

//# sourceMappingURL=AttachmentPanel.js.map