import { a as ensure_array_like, f as escape_html, i as derived, u as attr } from "./server.js";
import { E as teknisAssignees, n as assigneeOptions } from "./taskModuleStore.svelte.js";
import { d as requirementStore, n as listRequirements, r as reqCode, t as getRequirement } from "./requirementStore.svelte.js";
//#region src/lib/PmCreateTaskModal.svelte
function PmCreateTaskModal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		/**
		* Form PM: pecah requirement → task backlog + assign ke teknis.
		* @type {{
		*   open?: boolean,
		*   requirementId?: number | null,
		*   dashboard?: string,
		*   onClose?: () => void,
		*   onCreated?: (task: { id: number }) => void,
		* }}
		*/
		let { open = false, requirementId = null, dashboard = "", onClose = () => {}, onCreated = () => {} } = $$props;
		let title = "";
		let description = "";
		let assignee = "";
		let deadline = "";
		let selectedReqId = "";
		const lockedReq = derived(() => {
			requirementStore.items;
			return requirementId ? getRequirement(requirementId) : null;
		});
		const reqChoices = derived(() => {
			requirementStore.items;
			const dash = lockedReq()?.dashboard || dashboard;
			if (!dash) return listRequirements({});
			return listRequirements({ dashboard: dash }).filter((r) => r.status !== "done");
		});
		const activeReq = derived(() => {
			requirementStore.items;
			if (lockedReq()) return lockedReq();
			return null;
		});
		const assigneeList = derived(() => {
			const team = Array.isArray(activeReq()?.team) ? activeReq().team.filter(Boolean) : [];
			const rest = assigneeOptions().filter((n) => !team.includes(n));
			const base = [...team, ...rest];
			return base.length ? base : [...teknisAssignees];
		});
		if (open) {
			$$renderer.push(`<!--[0--><div class="backdrop svelte-1997bi6" role="presentation"></div> <form class="modal svelte-1997bi6" role="dialog" aria-modal="true" aria-labelledby="pm-task-title"><header class="head svelte-1997bi6"><div><p class="eyebrow svelte-1997bi6">PM · Pecah ke Backlog</p> <h2 id="pm-task-title" class="svelte-1997bi6">Tambah Task</h2> <p class="hint svelte-1997bi6">Task langsung approved → kolom Backlog · assign ke teknis.</p></div> <button type="button" class="close svelte-1997bi6" aria-label="Tutup"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="svelte-1997bi6"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg></button></header> <div class="body svelte-1997bi6">`);
			if (lockedReq()) $$renderer.push(`<!--[0--><label class="field svelte-1997bi6"><span class="svelte-1997bi6">Requirement</span> <input${attr("value", `${reqCode(lockedReq().id)} · ${lockedReq().title}`)} disabled="" class="svelte-1997bi6"/></label> <p class="meta svelte-1997bi6">Dashboard: <strong class="svelte-1997bi6">${escape_html(lockedReq().dashboard)}</strong></p>`);
			else {
				$$renderer.push(`<!--[-1--><label class="field svelte-1997bi6"><span class="svelte-1997bi6">Requirement <em class="svelte-1997bi6">*</em></span> `);
				$$renderer.select({
					value: selectedReqId,
					class: ""
				}, ($$renderer) => {
					if (reqChoices().length === 0) {
						$$renderer.push("<!--[0-->");
						$$renderer.option({ value: "" }, ($$renderer) => {
							$$renderer.push(`Tidak ada requirement aktif`);
						});
					} else {
						$$renderer.push(`<!--[-1--><!--[-->`);
						const each_array = ensure_array_like(reqChoices());
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let r = each_array[$$index];
							$$renderer.option({ value: r.id }, ($$renderer) => {
								$$renderer.push(`${escape_html(reqCode(r.id))} · ${escape_html(r.title)}`);
							});
						}
						$$renderer.push(`<!--]-->`);
					}
					$$renderer.push(`<!--]-->`);
				}, "svelte-1997bi6");
				$$renderer.push(`</label> `);
				if (activeReq()) $$renderer.push(`<!--[0--><p class="meta svelte-1997bi6">Dashboard: <strong class="svelte-1997bi6">${escape_html(activeReq().dashboard)}</strong></p>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--> <label class="field svelte-1997bi6"><span class="svelte-1997bi6">Judul task <em class="svelte-1997bi6">*</em></span> <input${attr("value", title)} maxlength="120" placeholder="Contoh: Implement SLA heatmap widget" class="svelte-1997bi6"/></label> <label class="field svelte-1997bi6"><span class="svelte-1997bi6">Deskripsi</span> <textarea rows="3" maxlength="600" placeholder="Ruang lingkup pekerjaan untuk teknis…" class="svelte-1997bi6">`);
			const $$body = escape_html(description);
			if ($$body) $$renderer.push(`${$$body}`);
			$$renderer.push(`</textarea></label> <div class="row2 svelte-1997bi6"><label class="field svelte-1997bi6"><span class="svelte-1997bi6">Assign ke Teknis <em class="svelte-1997bi6">*</em></span> `);
			$$renderer.select({
				value: assignee,
				class: ""
			}, ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				const each_array_1 = ensure_array_like(assigneeList());
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let name = each_array_1[$$index_1];
					$$renderer.option({ value: name }, ($$renderer) => {
						$$renderer.push(`${escape_html(name)}`);
					});
				}
				$$renderer.push(`<!--]-->`);
			}, "svelte-1997bi6");
			$$renderer.push(`</label> <label class="field svelte-1997bi6"><span class="svelte-1997bi6">Deadline <em class="svelte-1997bi6">*</em></span> <input type="date"${attr("value", deadline)} class="svelte-1997bi6"/></label></div> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <footer class="actions svelte-1997bi6"><button type="button" class="ghost svelte-1997bi6">Batal</button> <button type="submit" class="primary svelte-1997bi6"${attr("disabled", !activeReq(), true)}>Buat &amp; Assign</button></footer></form>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { PmCreateTaskModal as t };

//# sourceMappingURL=PmCreateTaskModal.js.map