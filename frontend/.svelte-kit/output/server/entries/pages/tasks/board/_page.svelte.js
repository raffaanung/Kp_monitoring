import { a as ensure_array_like, c as stringify, f as escape_html, i as derived, n as attr_style, t as attr_class, u as attr } from "../../../../chunks/server.js";
import "../../../../chunks/navigation.js";
import { C as taskModuleStore, O as workflowColumns, S as setBoardDashboard, _ as listInboxTasks, b as pmOfDashboard, c as canUpdateBoard, g as latestComment, h as isOverdue, i as canCommentOnTask, j as workflowStatusColor, k as workflowLabel, m as isCurrentUserPmOf, o as canCreateTask, p as inboxNeedsMyAction, r as boardDashboardOptions, t as approvalLabel, u as currentUserRole, w as tasksByColumn, x as resolveBoardDashboard } from "../../../../chunks/taskModuleStore.svelte.js";
import { d as requirementStore, n as listRequirements, r as reqCode } from "../../../../chunks/requirementStore.svelte.js";
import { t as GlassPanel } from "../../../../chunks/GlassPanel.js";
import { t as SubmenuHeader } from "../../../../chunks/SubmenuHeader.js";
import { n as formatDateTime, t as formatDate } from "../../../../chunks/format.js";
import { t as PmCreateTaskModal } from "../../../../chunks/PmCreateTaskModal.js";
//#region src/routes/tasks/board/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let dragId = null;
		let overColumn = null;
		/** Inline masukan per inbox card */
		let reviewNotes = {};
		let moveConfirmTo = null;
		/** @type {Record<number, string>} */
		let reviewFileLabels = {};
		/** Inline comment composer on card */
		let commentOpenId = null;
		let commentDraft = "";
		/** PM: create task + assign */
		let createTaskOpen = false;
		/** '' = semua requirement di dashboard yang dipilih */
		let requirementId = "";
		const dashboards = derived(boardDashboardOptions);
		const selectedDashboard = derived(resolveBoardDashboard);
		const requirements = derived(() => {
			requirementStore.items;
			return listRequirements({
				dashboard: selectedDashboard(),
				sort: "title_asc"
			});
		});
		const boardTab = derived(() => {
			taskModuleStore.boardTab;
			return taskModuleStore.boardTab;
		});
		const session = derived(() => {
			taskModuleStore.session;
			return taskModuleStore.session;
		});
		const canAdd = derived(() => {
			taskModuleStore.session;
			taskModuleStore.boardDashboard;
			return canCreateTask() && isCurrentUserPmOf(selectedDashboard());
		});
		const canDrag = derived(() => {
			taskModuleStore.session;
			return canUpdateBoard();
		});
		const canComment = derived(() => {
			taskModuleStore.session;
			return canCommentOnTask();
		});
		const asPmHere = derived(() => {
			taskModuleStore.session;
			taskModuleStore.boardDashboard;
			return isCurrentUserPmOf(selectedDashboard());
		});
		const role = derived(() => {
			taskModuleStore.session;
			return currentUserRole();
		});
		/** @param {{ requirement_id?: number | null }} task */
		function inRequirement(task) {
			if (!requirementId) return true;
			return Number(task.requirement_id) === Number(requirementId);
		}
		const inboxItems = derived(() => {
			taskModuleStore.items;
			return listInboxTasks(selectedDashboard()).filter(inRequirement);
		});
		const myActionCount = derived(() => {
			taskModuleStore.items;
			taskModuleStore.session;
			return inboxNeedsMyAction(selectedDashboard()).filter(inRequirement).length;
		});
		const moveTask = derived(() => {
			taskModuleStore.items;
			return null;
		});
		const columnTone = {
			backlog: "sand",
			development: "sky",
			testing: "lavender",
			uat: "peach",
			to_production: "rose",
			selesai: "mint"
		};
		/** @param {string} name */
		function initials(name) {
			return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
		}
		$$renderer.push(`<section class="page svelte-rdju5e">`);
		GlassPanel($$renderer, {
			children: ($$renderer) => {
				{
					function actions($$renderer) {
						$$renderer.push(`<label class="ctrl"><span>Dashboard</span> `);
						$$renderer.select({
							class: "ctrl-input",
							value: selectedDashboard(),
							onchange: (e) => {
								requirementId = "";
								setBoardDashboard(e.currentTarget.value);
							}
						}, ($$renderer) => {
							$$renderer.push(`<!--[-->`);
							const each_array = ensure_array_like(dashboards());
							for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
								let name = each_array[$$index];
								$$renderer.option({ value: name }, ($$renderer) => {
									$$renderer.push(`${escape_html(name)}`);
								});
							}
							$$renderer.push(`<!--]-->`);
						});
						$$renderer.push(`</label> <label class="ctrl"><span>Requirement</span> `);
						$$renderer.select({
							class: "ctrl-input req-filter",
							value: requirementId
						}, ($$renderer) => {
							$$renderer.option({ value: "" }, ($$renderer) => {
								$$renderer.push(`Semua requirement`);
							});
							$$renderer.push(`<!--[-->`);
							const each_array_1 = ensure_array_like(requirements());
							for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
								let req = each_array_1[$$index_1];
								$$renderer.option({ value: String(req.id) }, ($$renderer) => {
									$$renderer.push(`${escape_html(reqCode(req.id))} Â· ${escape_html(req.title)}`);
								});
							}
							$$renderer.push(`<!--]-->`);
						});
						$$renderer.push(`</label> `);
						if (canAdd()) $$renderer.push(`<!--[0--><button type="button" class="btn-primary">+ Tambah Task</button>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					}
					SubmenuHeader($$renderer, {
						eyebrow: "Task",
						title: "Board View",
						sub: "Kanban per dashboard Â· pindah status teknis butuh approval PM",
						meta: selectedDashboard() || "â€”",
						actions,
						$$slots: { actions: true }
					});
				}
				$$renderer.push(`<!----> <div class="main-tabs svelte-rdju5e" role="tablist"><button type="button" class="main-tab on svelte-rdju5e" aria-selected="true">Board</button> <button type="button" class="main-tab svelte-rdju5e">List</button></div> <div class="tabs svelte-rdju5e" role="tablist" aria-label="Board views"><button type="button" role="tab"${attr_class("tab svelte-rdju5e", void 0, { "on": boardTab() === "kanban" })}${attr("aria-selected", boardTab() === "kanban")}>Kanban</button> <button type="button" role="tab"${attr_class("tab svelte-rdju5e", void 0, { "on": boardTab() === "inbox" })}${attr("aria-selected", boardTab() === "inbox")}>Status approval `);
				if (myActionCount() > 0) $$renderer.push(`<!--[0--><span class="tab-alert svelte-rdju5e">${escape_html(myActionCount())}</span>`);
				else if (inboxItems().length > 0) $$renderer.push(`<!--[1--><span class="tab-count svelte-rdju5e">${escape_html(inboxItems().length)}</span>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></button> <p class="tab-hint svelte-rdju5e">`);
				if (role() === "viewer" || role() === "manager") $$renderer.push(`<!--[0-->Mode view saja`);
				else if (asPmHere()) $$renderer.push(`<!--[1-->Anda PM ${escape_html(selectedDashboard())} Â· drag langsung Â· review request teknis`);
				else if (role() === "pm") $$renderer.push(`<!--[2-->PM ${escape_html(pmOfDashboard(selectedDashboard()) || "â€”")} Â· Anda PM dashboard lain`);
				else $$renderer.push(`<!--[-1-->Teknis Â· drag = ajukan pindah status (butuh approval PM)`);
				$$renderer.push(`<!--]--></p></div>`);
			},
			$$slots: { default: true }
		});
		$$renderer.push(`<!----> `);
		if (boardTab() === "inbox") {
			$$renderer.push(`<!--[0--><div class="inbox-rail svelte-rdju5e">`);
			if (inboxItems().length === 0) $$renderer.push(`<!--[0--><p class="inbox-empty svelte-rdju5e">Tidak ada request pindah status untuk ${escape_html(selectedDashboard())}.</p>`);
			else {
				$$renderer.push(`<!--[-1--><div class="inbox-list svelte-rdju5e"><!--[-->`);
				const each_array_2 = ensure_array_like(inboxItems());
				for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
					let task = each_array_2[$$index_2];
					const canActMove = isCurrentUserPmOf(task.dashboard) && Boolean(task.status_move);
					const canActLegacy = isCurrentUserPmOf(task.dashboard) && !task.status_move && task.approval_state === "pending";
					const canResubmit = task.approval_state === "revision" && (task.created_by === session().name || isCurrentUserPmOf(task.dashboard));
					const canAct = canActMove || canActLegacy;
					const badgeState = task.status_move ? "pending" : task.approval_state === "revision" ? "revision" : task.approval_state === "approved" ? "approved" : "pending";
					const badgeText = task.status_move ? `Pindah ${workflowLabel(task.status_move.from)} â†’ ${workflowLabel(task.status_move.to)}` : approvalLabel(task.approval_state);
					const actor = task.status_move?.requested_by || task.created_by;
					const when = formatDateTime(task.status_move?.at || task.updated_at || task.created_at);
					const existingNote = task.status_move?.note || task.approval_note || "";
					$$renderer.push(`<article${attr_class("inbox-card svelte-rdju5e", void 0, { "rev": badgeState === "revision" })}><div class="inbox-card-top svelte-rdju5e"><h3 class="inbox-card-title svelte-rdju5e">${escape_html(task.status_move ? "Status approval" : "Task approval")}</h3> <span${attr_class(`appr a-${badgeState}`, "svelte-rdju5e")}><i class="appr-dot svelte-rdju5e" aria-hidden="true"></i> ${escape_html(badgeText)}</span></div> <p class="inbox-task-name svelte-rdju5e">${escape_html(task.title)}</p> <p class="inbox-reviewer svelte-rdju5e">${escape_html(badgeState === "approved" ? "Reviewer" : "Diajukan")}: <strong class="svelte-rdju5e">${escape_html(actor)}</strong> <span aria-hidden="true">Â·</span> ${escape_html(when)}</p> <label class="inbox-masukan svelte-rdju5e"><span class="svelte-rdju5e">Masukan</span> `);
					if (canAct) {
						$$renderer.push(`<!--[0--><textarea rows="3" placeholder="Tulis catatan reviewâ€¦" class="svelte-rdju5e">`);
						const $$body = escape_html(Object.hasOwn(reviewNotes, task.id) ? reviewNotes[task.id] : existingNote);
						if ($$body) $$renderer.push(`${$$body}`);
						$$renderer.push(`</textarea>`);
					} else {
						$$renderer.push(`<!--[-1--><textarea rows="3" readonly="" class="svelte-rdju5e">`);
						const $$body_1 = escape_html(existingNote || (badgeState === "revision" ? "Menunggu perbaikan dari teknis." : "Belum ada masukan."));
						if ($$body_1) $$renderer.push(`${$$body_1}`);
						$$renderer.push(`</textarea>`);
					}
					$$renderer.push(`<!--]--></label> `);
					if (canAct) {
						$$renderer.push(`<!--[0--><label class="inbox-file svelte-rdju5e"><span>Lampiran bukti (opsional, max 900 KB)</span> <input type="file" class="svelte-rdju5e"/> `);
						if (reviewFileLabels[task.id]) $$renderer.push(`<!--[0--><em class="svelte-rdju5e">${escape_html(reviewFileLabels[task.id])}</em>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--></label>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <div class="inbox-acts svelte-rdju5e">`);
					if (canAct) $$renderer.push(`<!--[0--><button type="button" class="act approve svelte-rdju5e">Setujui</button> <button type="button" class="act revise svelte-rdju5e">Minta revisi</button> <button type="button" class="act reject svelte-rdju5e">Tolak</button>`);
					else if (canResubmit && role() !== "viewer") $$renderer.push(`<!--[1--><button type="button" class="act approve svelte-rdju5e">Ajukan ulang</button>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div></article>`);
				}
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else {
			$$renderer.push(`<!--[-1--><div class="board-rail svelte-rdju5e"><div class="board svelte-rdju5e"><!--[-->`);
			const each_array_3 = ensure_array_like(workflowColumns);
			for (let $$index_5 = 0, $$length = each_array_3.length; $$index_5 < $$length; $$index_5++) {
				let col = each_array_3[$$index_5];
				const cards = tasksByColumn(col.key, selectedDashboard()).filter(inRequirement);
				$$renderer.push(`<div${attr_class(`column tone-${stringify(columnTone[col.key] || "sand")}`, "svelte-rdju5e", { "drop": overColumn === col.key })}${attr_style(`--status-color: ${stringify(workflowStatusColor(col.key))}`)} role="list"${attr("aria-label", col.label)}><header class="svelte-rdju5e"><div class="head-main svelte-rdju5e"><span class="status-mark svelte-rdju5e" aria-hidden="true"></span> <div><h3 class="svelte-rdju5e">${escape_html(col.label)}</h3> <p class="svelte-rdju5e">Drag antar kolom</p></div></div> <span class="count svelte-rdju5e">${escape_html(cards.length)}</span></header> <div class="cards svelte-rdju5e">`);
				const each_array_4 = ensure_array_like(cards);
				if (each_array_4.length !== 0) {
					$$renderer.push("<!--[-->");
					for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
						let task = each_array_4[$$index_4];
						const comment = latestComment(task);
						$$renderer.push(`<article${attr_class("card svelte-rdju5e", void 0, {
							"dragging": dragId === task.id,
							"late": isOverdue(task),
							"commenting": commentOpenId === task.id,
							"pending-move": Boolean(task.status_move)
						})}${attr("draggable", canDrag() && commentOpenId !== task.id && !task.status_move)} role="listitem"><div class="card-body svelte-rdju5e">`);
						if (task.status_move) $$renderer.push(`<!--[0--><span class="move-badge svelte-rdju5e">Menunggu PM Â· â†’ ${escape_html(workflowLabel(task.status_move.to))}</span>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> <strong class="svelte-rdju5e">${escape_html(task.title)}</strong> <div class="foot svelte-rdju5e"><span class="due svelte-rdju5e">${escape_html(formatDate(task.deadline))}</span></div> <div class="pic-row svelte-rdju5e"><i class="face svelte-rdju5e">${escape_html(initials(task.assignee || task.pic))}</i> <span>${escape_html(task.assignee || task.pic)}</span></div> <div class="card-comments svelte-rdju5e">`);
						if (task.comments.length > 0) {
							$$renderer.push(`<!--[0--><ul class="c-list svelte-rdju5e"><!--[-->`);
							const each_array_5 = ensure_array_like(task.comments.slice(0, 2));
							for (let $$index_3 = 0, $$length = each_array_5.length; $$index_3 < $$length; $$index_3++) {
								let c = each_array_5[$$index_3];
								$$renderer.push(`<li class="svelte-rdju5e"><span class="c-actor svelte-rdju5e">${escape_html(c.actor.split(" ")[0])}</span> ${escape_html(c.body)}</li>`);
							}
							$$renderer.push(`<!--]--></ul> `);
							if (task.comments.length > 2) $$renderer.push(`<!--[0--><p class="c-more svelte-rdju5e">+${escape_html(task.comments.length - 2)} komentar lain</p>`);
							else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						} else if (comment) $$renderer.push(`<!--[1--><p class="card-comment svelte-rdju5e">${escape_html(comment.body)}</p>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> `);
						if (canComment()) {
							$$renderer.push("<!--[0-->");
							if (commentOpenId === task.id) {
								$$renderer.push(`<!--[0--><form class="c-form svelte-rdju5e"><textarea rows="2" placeholder="Tulis komentarâ€¦" class="svelte-rdju5e">`);
								const $$body_2 = escape_html(commentDraft);
								if ($$body_2) $$renderer.push(`${$$body_2}`);
								$$renderer.push(`</textarea> <div class="c-acts svelte-rdju5e"><button type="button" class="c-ghost svelte-rdju5e">Batal</button> <button type="submit" class="c-send svelte-rdju5e">Kirim</button></div></form>`);
							} else $$renderer.push(`<!--[-1--><button type="button" class="c-toggle svelte-rdju5e">${escape_html(task.comments.length > 0 ? `Komentar (${task.comments.length})` : "+ Komentar")}</button>`);
							$$renderer.push(`<!--]-->`);
						} else if (task.comments.length > 0) $$renderer.push(`<!--[1--><span class="c-count-only svelte-rdju5e">${escape_html(task.comments.length)} komentar</span>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--></div></div></article>`);
					}
				} else $$renderer.push(`<!--[!--><p class="empty svelte-rdju5e">Belum ada task</p>`);
				$$renderer.push(`<!--]--></div></div>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]--></section> `);
		if (moveTask() && moveConfirmTo);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		PmCreateTaskModal($$renderer, {
			open: createTaskOpen,
			dashboard: selectedDashboard(),
			onClose: () => createTaskOpen = false
		});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
export { _page as default };

//# sourceMappingURL=_page.svelte.js.map