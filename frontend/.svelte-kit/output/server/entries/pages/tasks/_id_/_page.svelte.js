import { a as ensure_array_like, f as escape_html, i as derived, n as attr_style, t as attr_class, u as attr } from "../../../../chunks/server.js";
import "../../../../chunks/navigation.js";
import { C as taskModuleStore, O as workflowColumns, c as canUpdateBoard, f as getModuleTask, h as isOverdue, i as canCommentOnTask, j as workflowStatusColor, k as workflowLabel, l as currentUserName, m as isCurrentUserPmOf, u as currentUserRole } from "../../../../chunks/taskModuleStore.svelte.js";
import { t as page } from "../../../../chunks/state.js";
import { r as reqCode } from "../../../../chunks/requirementStore.svelte.js";
import { t as GlassPanel } from "../../../../chunks/GlassPanel.js";
import { t as formatDate } from "../../../../chunks/format.js";
//#region src/routes/tasks/[id]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let nextStatus = "backlog";
		let commentBody = "";
		const task = derived(() => {
			taskModuleStore.items;
			return page.params.id ? getModuleTask(page.params.id) : null;
		});
		const canEdit = derived(() => {
			taskModuleStore.session;
			taskModuleStore.items;
			if (!task()) return false;
			return currentUserRole() === "pm" && isCurrentUserPmOf(task().dashboard);
		});
		const canBoard = derived(() => {
			taskModuleStore.session;
			return canUpdateBoard();
		});
		const canComment = derived(() => {
			taskModuleStore.session;
			return canCommentOnTask();
		});
		const role = derived(() => {
			taskModuleStore.session;
			return currentUserRole();
		});
		const asPm = derived(() => {
			taskModuleStore.session;
			return task() ? isCurrentUserPmOf(task().dashboard) : false;
		});
		const journey = derived(() => {
			if (!task()) return [];
			/** @type {Set<number>} */
			const used = /* @__PURE__ */ new Set();
			/** @param {number | null | undefined} id */
			function takeFile(id) {
				const file = evidenceById(id);
				if (!file || used.has(file.id)) return null;
				used.add(file.id);
				return file;
			}
			/** @type {{ key: string, at: string, actor: string, kind: 'event' | 'note', text: string, file: import('../../lib/taskModuleStore.svelte.js').TaskEvidence | null }[]} */
			const rows = [];
			for (const entry of task().activity || []) {
				if (entry.action === "Menambah komentar") continue;
				rows.goto({
					key: `a-${entry.id}`,
					at: entry.at,
					actor: entry.actor,
					kind: "event",
					text: entry.action,
					file: takeFile(entry.evidence_id)
				});
			}
			for (const entry of task().comments || []) rows.goto({
				key: `c-${entry.id}`,
				at: entry.at,
				actor: entry.actor,
				kind: "note",
				text: entry.body,
				file: takeFile(entry.evidence_id)
			});
			const pendingFile = takeFile(task().status_move?.evidence_id);
			if (pendingFile) {
				const host = [...rows].reverse().find((row) => row.text.startsWith("Ajukan pindah") && !row.file);
				if (host) host.file = pendingFile;
				else rows.goto({
					key: `e-${pendingFile.id}`,
					at: pendingFile.at,
					actor: pendingFile.actor,
					kind: "event",
					text: pendingFile.note || pendingFile.name,
					file: pendingFile
				});
			}
			for (const file of task().evidences || []) {
				if (used.has(file.id)) continue;
				used.add(file.id);
				rows.goto({
					key: `e-${file.id}`,
					at: file.at,
					actor: file.actor,
					kind: file.kind === "comment" ? "note" : "event",
					text: file.note || file.name,
					file
				});
			}
			return rows.sort((a, b) => a.at.localeCompare(b.at) || a.key.localeCompare(b.key));
		});
		/** @type {'today' | 'week' | 'all'} */
		let journeyRange = "week";
		/** @param {string} at @param {'today' | 'week' | 'all'} range */
		function inJourneyRange(at, range) {
			if (range === "all") return true;
			const when = new Date(at.replace(" ", "T"));
			if (Number.isNaN(when.getTime())) return true;
			const now = /* @__PURE__ */ new Date();
			if (range === "today") return when.toDateString() === now.toDateString();
			const start = new Date(now);
			const day = start.getDay();
			start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
			start.setHours(0, 0, 0, 0);
			const end = new Date(start);
			end.setDate(start.getDate() + 7);
			return when >= start && when < end;
		}
		const visibleJourney = derived(() => journey().filter((row) => inJourneyRange(row.at, journeyRange)));
		/** @param {number | null | undefined} id */
		function evidenceById(id) {
			if (!task() || !id) return null;
			return task().evidences?.find((item) => item.id === id) || null;
		}
		$$renderer.push(`<section class="page svelte-13zy71l">`);
		if (!task()) {
			$$renderer.push("<!--[0-->");
			GlassPanel($$renderer, {
				children: ($$renderer) => {
					$$renderer.push(`<p class="state error svelte-13zy71l">Task tidak ditemukan.</p> <a class="pill on back-link svelte-13zy71l" href="/tasks/board">â† Kembali ke Board</a>`);
				},
				$$slots: { default: true }
			});
		} else {
			$$renderer.push(`<!--[-1--><div class="layout svelte-13zy71l">`);
			GlassPanel($$renderer, {
				class: "span-2",
				children: ($$renderer) => {
					$$renderer.push(`<div class="hero svelte-13zy71l"><div class="strip svelte-13zy71l"><a class="back svelte-13zy71l" href="/tasks/board" aria-label="Kembali ke board">â†</a> <div class="strip-copy svelte-13zy71l"><div class="meta svelte-13zy71l"><span class="mono-id svelte-13zy71l">#${escape_html(task().id)}</span> <span${attr_class(`chip st-${task().status}`, "svelte-13zy71l")}>${escape_html(workflowLabel(task().status))}</span> `);
					if (task().status_move) $$renderer.push(`<!--[0--><span class="chip appr-pending svelte-13zy71l">Menunggu PM Â· ${escape_html(workflowLabel(task().status_move.to))}</span>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (isOverdue(task())) $$renderer.push(`<!--[0--><span class="chip late svelte-13zy71l">Overdue</span>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div> <h2 class="svelte-13zy71l">${escape_html(task().title)}</h2> <p class="meta-line svelte-13zy71l">${escape_html(task().assignee || task().pic)} Â· ${escape_html(task().dashboard)} Â· ${escape_html(task().requirement_id ? reqCode(task().requirement_id) : "tanpa requirement")} Â· ${escape_html(formatDate(task().deadline))}</p></div></div></div>`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> <div class="flow-rail span-2 svelte-13zy71l"><div class="panel-title svelte-13zy71l"><div><p class="eyebrow svelte-13zy71l">Workflow</p> <h3 class="svelte-13zy71l">Status</h3></div></div> <div class="flow svelte-13zy71l"><!--[-->`);
			const each_array = ensure_array_like(workflowColumns);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let col = each_array[i];
				const idx = workflowColumns.findIndex((c) => c.key === task().status);
				$$renderer.push(`<div${attr_class("flow-col svelte-13zy71l", void 0, {
					"done": i < idx,
					"current": i === idx
				})}${attr_style(`--status-color: ${workflowStatusColor(col.key)}`)}><span class="status-mark svelte-13zy71l" aria-hidden="true"></span> <span class="flow-label svelte-13zy71l">${escape_html(col.label)}</span></div>`);
			}
			$$renderer.push(`<!--]--></div></div> `);
			GlassPanel($$renderer, {
				class: "span-2",
				children: ($$renderer) => {
					$$renderer.push(`<div class="panel-title svelte-13zy71l"><div><p class="eyebrow svelte-13zy71l">Riwayat</p> <h3 class="svelte-13zy71l">Journey task</h3></div> <div class="range-pills svelte-13zy71l" role="group" aria-label="Filter waktu"><button type="button"${attr_class("svelte-13zy71l", void 0, { "on": false })}>Hari ini</button> <button type="button"${attr_class("svelte-13zy71l", void 0, { "on": true })}>Minggu ini</button> <button type="button"${attr_class("svelte-13zy71l", void 0, { "on": false })}>Semua</button></div></div> `);
					if (journey().length === 0) $$renderer.push(`<!--[0--><p class="empty svelte-13zy71l">Belum ada catatan. Teknis dan PM bisa menulis di sini, termasuk lampiran gambar.</p>`);
					else if (visibleJourney().length === 0) $$renderer.push(`<!--[1--><p class="empty svelte-13zy71l">${escape_html("Tidak ada catatan minggu ini.")}</p>`);
					else {
						$$renderer.push(`<!--[-1--><ol class="journey svelte-13zy71l"><!--[-->`);
						const each_array_1 = ensure_array_like(visibleJourney());
						for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
							let row = each_array_1[$$index_1];
							$$renderer.push(`<li${attr_class("svelte-13zy71l", void 0, {
								"note": row.kind === "note",
								"event": row.kind === "event"
							})}><div class="entry svelte-13zy71l"><strong class="svelte-13zy71l">${escape_html(row.actor)}</strong> <div class="entry-body svelte-13zy71l">`);
							if (row.text) $$renderer.push(`<!--[0--><p${attr_class("svelte-13zy71l", void 0, {
								"event-text": row.kind === "event",
								"note-text": row.kind === "note"
							})}>${escape_html(row.text)}</p>`);
							else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							if (row.file) {
								$$renderer.push(`<!--[0--><button type="button" class="file-card svelte-13zy71l">`);
								if (row.file.mime.startsWith("image/")) $$renderer.push(`<!--[0--><img${attr("src", row.file.data_url)} alt="" class="svelte-13zy71l"/>`);
								else $$renderer.push(`<!--[-1--><span class="file-ico svelte-13zy71l" aria-hidden="true">FILE</span>`);
								$$renderer.push(`<!--]--> <span class="file-meta svelte-13zy71l"><strong class="svelte-13zy71l">${escape_html(row.file.name)}</strong></span></button>`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--></div> <time class="svelte-13zy71l">${escape_html(row.at)}</time></div></li>`);
						}
						$$renderer.push(`<!--]--></ol>`);
					}
					$$renderer.push(`<!--]--> `);
					if (canComment() || canBoard()) {
						$$renderer.push(`<!--[0--><form class="composer svelte-13zy71l"><div class="composer-head svelte-13zy71l"><p class="eyebrow svelte-13zy71l">Tanggapan</p> `);
						if (task().status_move && asPm()) $$renderer.push(`<!--[0--><p class="reply-context svelte-13zy71l">${escape_html(task().status_move.requested_by)} mengajukan ${escape_html(workflowLabel(task().status_move.from))} â†’ ${escape_html(workflowLabel(task().status_move.to))}. Tulis catatan, lalu pilih satu keputusan.</p>`);
						else if (task().status_move) $$renderer.push(`<!--[1--><p class="reply-context svelte-13zy71l">Pengajuan ${escape_html(workflowLabel(task().status_move.from))} â†’ ${escape_html(workflowLabel(task().status_move.to))} menunggu PM.</p>`);
						else $$renderer.push(`<!--[-1--><p class="reply-context svelte-13zy71l">Catatan dan gambar akan masuk ke riwayat task.</p>`);
						$$renderer.push(`<!--]--></div> <div class="reply-field svelte-13zy71l"><textarea rows="2" placeholder="Tulis tanggapanâ€¦" class="svelte-13zy71l">`);
						const $$body = escape_html(commentBody);
						if ($$body) $$renderer.push(`${$$body}`);
						$$renderer.push(`</textarea> <div class="reply-tools svelte-13zy71l">`);
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> <button type="button" class="clip svelte-13zy71l" aria-label="Lampirkan gambar" title="Lampirkan gambar"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="svelte-13zy71l"><path d="M8.5 12.5 14.2 6.8a3 3 0 0 1 4.2 4.2l-7.4 7.4a4.5 4.5 0 0 1-6.4-6.4l7.2-7.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path></svg></button> <input class="sr svelte-13zy71l" type="file" accept="image/*"/></div></div> <div class="decision svelte-13zy71l">`);
						if (asPm() && task().status_move) {
							$$renderer.push(`<!--[0--><button type="button" class="primary svelte-13zy71l">Setujui ke ${escape_html(workflowLabel(task().status_move.to))}</button> <button type="button" class="ghost-btn svelte-13zy71l">Minta revisi</button> `);
							if (canComment()) $$renderer.push(`<!--[0--><button type="submit" class="text-btn svelte-13zy71l">Catat saja</button>`);
							else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						} else if (asPm() && task().approval_state === "pending") $$renderer.push(`<!--[1--><button type="button" class="primary svelte-13zy71l">Setujui ke Backlog</button> <button type="button" class="ghost-btn svelte-13zy71l">Minta revisi</button>`);
						else if (task().approval_state === "revision" && (task().created_by === currentUserName() || asPm()) && canBoard()) {
							$$renderer.push(`<!--[2--><button type="button" class="ghost-btn svelte-13zy71l">Ajukan ulang</button> `);
							if (canComment()) $$renderer.push(`<!--[0--><button type="submit" class="primary svelte-13zy71l">Kirim tanggapan</button>`);
							else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						} else {
							$$renderer.push("<!--[-1-->");
							if (canBoard() && task().approval_state === "approved" && !task().status_move) {
								$$renderer.push("<!--[0-->");
								$$renderer.select({
									value: nextStatus,
									"aria-label": "Status tujuan",
									class: ""
								}, ($$renderer) => {
									$$renderer.push(`<!--[-->`);
									const each_array_2 = ensure_array_like(workflowColumns);
									for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
										let col = each_array_2[$$index_2];
										$$renderer.option({ value: col.key }, ($$renderer) => {
											$$renderer.push(`${escape_html(col.label)}`);
										});
									}
									$$renderer.push(`<!--]-->`);
								}, "svelte-13zy71l");
								$$renderer.push(` <button type="button" class="ghost-btn svelte-13zy71l">${escape_html(role() === "teknis" ? "Ajukan pindah" : "Ubah status")}</button>`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							if (canComment()) $$renderer.push(`<!--[0--><button type="submit" class="primary svelte-13zy71l">Kirim tanggapan</button>`);
							else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						}
						$$renderer.push(`<!--]--></div></form>`);
					} else $$renderer.push(`<!--[-1--><p class="empty svelte-13zy71l">Mode view â€” tanggapan tidak tersedia.</p>`);
					$$renderer.push(`<!--]--> `);
					if (canEdit()) $$renderer.push(`<!--[0--><button type="button" class="danger-btn svelte-13zy71l">Hapus task</button>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----></div> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></section>`);
	});
}
//#endregion
export { _page as default };

//# sourceMappingURL=_page.svelte.js.map