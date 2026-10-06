import { a as ensure_array_like, c as stringify, f as escape_html, i as derived, r as bind_props, t as attr_class, u as attr } from "../../../../chunks/server.js";
import "../../../../chunks/navigation.js";
import { a as canCreateDashboard } from "../../../../chunks/taskModuleStore.svelte.js";
import { t as GlassPanel } from "../../../../chunks/GlassPanel.js";
import { t as SubmenuHeader } from "../../../../chunks/SubmenuHeader.js";
import { r as listUsers } from "../../../../chunks/accessStore.svelte.js";
import { a as registryStatusLabel, c as sortOptions, i as listDashboards, o as registryStatusOptions, t as changeDashboardStatus } from "../../../../chunks/registryStore.svelte.js";
import { t as AttachmentPanel } from "../../../../chunks/AttachmentPanel.js";
//#region src/lib/pages/registry/RegistrySopModal.svelte
function RegistrySopModal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { selectedSopItem = void 0 } = $$props;
		if (selectedSopItem) $$renderer.push(`<!--[0--><div class="sop-modal-backdrop"><div class="sop-modal-content"><div class="sop-modal-header"><h3>SOP - ${escape_html(selectedSopItem.name)}</h3> <button class="close-btn">×</button></div> <div class="sop-modal-body"><p><strong>Platform:</strong> ${escape_html(selectedSopItem.platform)}</p> <p><strong>Kategori:</strong> ${escape_html(selectedSopItem.category)}</p> <p><strong>Owner (PIC):</strong> ${escape_html(selectedSopItem.owner)}</p> <hr class="sop-divider"/> <h4>Prosedur Operasional Standar (SOP)</h4> <p>Deskripsi sistem: <em>${escape_html(selectedSopItem.description)}</em></p> <ol class="sop-list"><li>Akses dashboard melalui platform <strong>${escape_html(selectedSopItem.platform)}</strong> menggunakan kredensial yang berwenang.</li> <li>Lakukan verifikasi data harian/berkala sesuai jadwal sistem.</li> <li>Jika terdapat masalah atau anomali data, segera eskalasikan kepada <strong>${escape_html(selectedSopItem.owner)}</strong>.</li> <li>Pastikan untuk mereview dashboard ini kembali jika ada perubahan dari status <strong>${escape_html(selectedSopItem.status)}</strong>.</li> <li>Dokumentasikan setiap perubahan konfigurasi pada log aktivitas.</li></ol></div> <div class="sop-modal-footer" style="gap: 10px;"><button class="sop-btn download-btn"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download PDF</button> <button class="sop-btn">Tutup SOP</button></div></div></div>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { selectedSopItem });
	});
}
//#endregion
//#region src/lib/pages/registry/RegistryCreateModal.svelte
function RegistryCreateModal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { createOpen = void 0, pmOptions = [], userOptions = [] } = $$props;
		let formName = "";
		let formCode = "";
		let formDescription = "";
		let formUser = "";
		let formCategory = "";
		if (createOpen) {
			$$renderer.push(`<!--[0--><div class="dash-backdrop" role="presentation"></div> <form class="dash-modal wizard-split" role="dialog" aria-modal="true" aria-labelledby="add-dashboard-title"><div class="wizard-left"><div class="left-header"><h2 id="add-dashboard-title">Registrasi Proyek</h2> <p>Ikuti panduan langkah demi langkah untuk mendaftarkan aplikasi baru ke
          dalam registry.</p></div> <div class="wizard-steps-v"><div${attr_class("step-v", void 0, {
				"active": true,
				"done": false
			})}><div class="v-circle">`);
			$$renderer.push(`<!--[-1-->1`);
			$$renderer.push(`<!--]--></div> <div class="v-info"><span class="v-title">Identitas</span> <span class="v-desc">Nama &amp; informasi dasar</span></div></div> <div${attr_class("v-line", void 0, { "active": false })}></div>  <div${attr_class("step-v", void 0, { "active": false })}><div class="v-circle">2</div> <div class="v-info"><span class="v-title">Teknis &amp; Timeline</span> <span class="v-desc">PM, target, tech stack</span></div></div></div></div> <div class="wizard-right"><header class="wizard-right-head"><button type="button" class="dash-close" aria-label="Tutup"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg></button></header> <div class="wizard-body-scroll">`);
			{
				$$renderer.push(`<!--[0--><div class="wizard-pane"><div class="pane-title-wrap"><h4 class="pane-title">Identitas &amp; Stakeholder</h4> <p class="pane-sub">Lengkapi informasi dasar mengenai aplikasi/dashboard.</p></div> <label><span>Nama Aplikasi / Dashboard <span class="req">*</span></span> <input${attr("value", formName)} maxlength="80" placeholder="Contoh: Operation Dashboard" required=""/></label> <label>Kode Aplikasi (Opsional) <input${attr("value", formCode)} maxlength="6" placeholder="Contoh: EDM, OPR"/> <span class="input-hint">Singkatan unik, maksimal 6 karakter.</span></label> <label>Deskripsi Scope Aplikasi <textarea rows="3" maxlength="600" placeholder="Deskripsikan fungsi dan tujuan aplikasi ini...">`);
				const $$body = escape_html(formDescription);
				if ($$body) $$renderer.push(`${$$body}`);
				$$renderer.push(`</textarea></label> <div class="grid-2"><label>Kategori / Departemen `);
				$$renderer.select({ value: formCategory }, ($$renderer) => {
					$$renderer.option({ value: "" }, ($$renderer) => {
						$$renderer.push(`Pilih Kategori...`);
					});
					$$renderer.option({ value: "Finance" }, ($$renderer) => {
						$$renderer.push(`Finance`);
					});
					$$renderer.option({ value: "HR" }, ($$renderer) => {
						$$renderer.push(`HR`);
					});
					$$renderer.option({ value: "Operations" }, ($$renderer) => {
						$$renderer.push(`Operations`);
					});
					$$renderer.option({ value: "Sales" }, ($$renderer) => {
						$$renderer.push(`Sales`);
					});
					$$renderer.option({ value: "Marketing" }, ($$renderer) => {
						$$renderer.push(`Marketing`);
					});
					$$renderer.option({ value: "IT" }, ($$renderer) => {
						$$renderer.push(`IT`);
					});
					$$renderer.option({ value: "Legal" }, ($$renderer) => {
						$$renderer.push(`Legal`);
					});
					$$renderer.option({ value: "General" }, ($$renderer) => {
						$$renderer.push(`Lainnya / General`);
					});
				});
				$$renderer.push(`</label> <label>Pemohon (Business Owner) <input${attr("value", formUser)} maxlength="80" list="dashboard-user-options" placeholder="Masukkan nama pemohon..."/> <datalist id="dashboard-user-options"><!--[-->`);
				const each_array = ensure_array_like(userOptions);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let user = each_array[$$index];
					$$renderer.option({ value: user.name }, ($$renderer) => {});
				}
				$$renderer.push(`<!--]--></datalist></label></div></div>`);
			}
			$$renderer.push(`<!--]--></div> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <footer class="wizard-foot">`);
			$$renderer.push(`<!--[0--><button type="button" class="dash-cancel">Batal</button> <button type="button" class="dash-save wizard-btn">Selanjutnya <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"></path></svg></button>`);
			$$renderer.push(`<!--]--></footer></div></form>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { createOpen });
	});
}
//#endregion
//#region src/lib/pages/registry/RegistryDetailPanel.svelte
function RegistryDetailPanel($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { selectedDetail = void 0, detailActiveTab = "overview", selectedSopItem = void 0 } = $$props;
		const canAdd = derived(canCreateDashboard);
		function getInitial(name = "") {
			if (!name) return "?";
			return name.trim().charAt(0).toUpperCase();
		}
		function formatDateDisplay(dateStr) {
			if (!dateStr) return "-";
			const d = new Date(dateStr.replace(" ", "T"));
			if (isNaN(d.getTime())) return dateStr;
			return `${String(d.getDate()).padStart(2, "0")} ${[
				"Jan",
				"Feb",
				"Mar",
				"Apr",
				"Mei",
				"Jun",
				"Jul",
				"Agu",
				"Sep",
				"Okt",
				"Nov",
				"Des"
			][d.getMonth()]} ${d.getFullYear()}`;
		}
		let addFieldMode = null;
		let newFieldGroup = "";
		let newFieldLabel = "";
		let newFieldValue = "";
		/** @type {string | null} key field metadata yang sedang diedit */
		let editingFieldKey = null;
		let editFieldGroup = "";
		let editFieldLabel = "";
		let editFieldValue = "";
		let editingGroup = null;
		let editGroupName = "";
		let groupedMetadata = derived(() => {
			if (!selectedDetail || !selectedDetail.metadata) return {};
			const groups = {};
			for (const [key, value] of Object.entries(selectedDetail.metadata)) {
				let group = "Lainnya";
				let label = key;
				if (key.includes("::")) {
					const parts = key.split("::");
					group = parts[0];
					label = parts.slice(1).join("::");
				}
				if (!groups[group]) groups[group] = [];
				groups[group].goto({
					originalKey: key,
					label,
					value
				});
			}
			return groups;
		});
		GlassPanel($$renderer, {
			class: "detail-panel",
			children: ($$renderer) => {
				$$renderer.push(`<div class="erp-object-header"><div class="erp-header-top"><div class="erp-header-left"><button type="button" class="erp-back-btn" aria-label="Kembali ke daftar" title="Kembali"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"></path></svg></button> <div class="erp-title-block"><div class="erp-title-row"><h2>${escape_html(selectedDetail.name)}</h2> <span${attr_class(`badge status-${selectedDetail.status}`)}>${escape_html(registryStatusLabel(selectedDetail.status))}</span> <span class="mono-id">#${escape_html(selectedDetail.id)}</span></div> <p class="erp-subtitle">${escape_html(selectedDetail.description || `${selectedDetail.platform} · ${selectedDetail.category}`)}</p></div></div> <div class="erp-header-right"><div class="erp-actions"><div class="action-pills" style="margin:0; padding:0; background:transparent; border:none; box-shadow:none;">`);
				AttachmentPanel($$renderer, {
					ownerType: "dashboard",
					ownerId: selectedDetail.id
				});
				$$renderer.push(`<!----></div> <button type="button" class="btn-outline">Lihat SOP</button> <button type="button" class="btn-primary"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Ubah Data</button></div> <div class="erp-kpi-bar"><div class="kpi-item"><span class="kpi-label">Requirement</span> <strong class="kpi-val">${escape_html(selectedDetail.quick_stats?.requirements_total || 0)}</strong></div> <div class="kpi-item"><span class="kpi-label">Task</span> <strong class="kpi-val">${escape_html(selectedDetail.quick_stats?.tasks_total || selectedDetail.tasks?.length || 0)}</strong></div> <div class="kpi-item"><span class="kpi-label">Task Done</span> <strong class="kpi-val">${escape_html(selectedDetail.quick_stats?.tasks_done || 0)}</strong></div></div></div></div> <div class="detail-tabs erp-tabs"><button type="button"${attr_class("d-tab", void 0, { "active": detailActiveTab === "overview" })}>Overview &amp; Info</button> <button type="button"${attr_class("d-tab", void 0, { "active": detailActiveTab === "tasks" })}>Board &amp; Tasks</button> <button type="button"${attr_class("d-tab", void 0, { "active": detailActiveTab === "team" })}>Tim &amp; Akses</button></div></div> <div class="detail-content">`);
				if (detailActiveTab === "overview") {
					$$renderer.push(`<!--[0--><div class="erp-facet-layout"><div class="erp-card"><div class="erp-card-header"><h3>Informasi Umum</h3></div> <div class="erp-card-body grid-2"><div class="data-field"><span class="d-label">PIC / Owner</span> <div class="d-value pic-value"><span class="pic-avatar-small">${escape_html(getInitial(selectedDetail.owner))}</span> <strong>${escape_html(selectedDetail.owner)}</strong></div></div> <div class="data-field"><span class="d-label">Kode / ID</span> <strong class="d-value">${escape_html(selectedDetail.code)}</strong></div> <div class="data-field"><span class="d-label">Kategori</span> <strong class="d-value">${escape_html(selectedDetail.category)}</strong></div> <div class="data-field"><span class="d-label">Platform</span> <strong class="d-value">${escape_html(selectedDetail.platform)}</strong></div> <div class="data-field"><span class="d-label">Prioritas</span> <div class="d-value"><span${attr_class(`crit-badge crit-${selectedDetail.criticality}`)}>${escape_html(selectedDetail.criticality)}</span></div></div> <div class="data-field"><span class="d-label">URL / Tautan</span> `);
					if (selectedDetail.url) $$renderer.push(`<!--[0--><a${attr("href", selectedDetail.url)} target="_blank" rel="noopener noreferrer" class="d-value link">${escape_html(selectedDetail.url)}</a>`);
					else $$renderer.push(`<!--[-1--><strong class="d-value text-muted">—</strong>`);
					$$renderer.push(`<!--]--></div> <div class="data-field"><span class="d-label">Dibuat Pada</span> <strong class="d-value">${escape_html(formatDateDisplay(selectedDetail.created_at))}</strong></div> <div class="data-field"><span class="d-label">Update Terakhir</span> <strong class="d-value">${escape_html(formatDateDisplay(selectedDetail.updated_at))}</strong></div></div></div> <div class="erp-card"><div class="erp-card-header"><h3>Data Spesifik &amp; Metadata</h3> `);
					if (canAdd()) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<!--[-1--><button type="button" class="btn-text">+ Kelompok / Field Baru</button>`);
						$$renderer.push(`<!--]-->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div> <div class="erp-card-body grouped-meta"><datalist id="existing-groups"><!--[-->`);
					const each_array = ensure_array_like(Object.keys(groupedMetadata()).filter((g) => g !== "Lainnya"));
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let g = each_array[$$index];
						$$renderer.option({ value: g }, ($$renderer) => {});
					}
					$$renderer.push(`<!--]--></datalist> <!--[-->`);
					const each_array_1 = ensure_array_like(Object.entries(groupedMetadata()));
					for (let $$index_3 = 0, $$length = each_array_1.length; $$index_3 < $$length; $$index_3++) {
						let [group, fields] = each_array_1[$$index_3];
						$$renderer.push(`<div class="meta-group">`);
						if (group !== "Lainnya" || Object.keys(groupedMetadata()).length > 1) {
							$$renderer.push(`<!--[0--><div class="meta-group-header">`);
							if (editingGroup === group) $$renderer.push(`<!--[0--><form class="inline-edit-form" style="flex: 1; margin-right: 12px; margin-bottom: 0; padding: 4px;"><input class="fact-input"${attr("value", editGroupName)} placeholder="Nama Kelompok" required="" style="font-weight: 800; text-transform: uppercase;"/> <div class="action-wrap"><button type="submit" class="fact-save"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></button> <button type="button" class="fact-cancel"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div></form>`);
							else {
								$$renderer.push(`<!--[-1--><h4 class="meta-group-title">${escape_html(group)}</h4> `);
								if (canAdd()) $$renderer.push(`<!--[0--><div class="action-wrap"><button type="button" class="h-btn edit" title="Ubah nama kelompok"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button> <button type="button" class="h-btn add"${attr("title", `Tambah field di kelompok ${stringify(group)}`)}><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button></div>`);
								else $$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--]-->`);
							}
							$$renderer.push(`<!--]--></div>`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> <div class="grid-2">`);
						if (addFieldMode === group) $$renderer.push(`<!--[0--><div class="data-field editing"><div class="d-label" style="color: #3b82f6; margin-bottom: -2px;">+ Tambah ke ${escape_html(group)}</div> <form class="inline-edit-form"><input type="hidden"${attr("value", newFieldGroup)}/> <input class="fact-input"${attr("value", newFieldLabel)} placeholder="Nama Field" maxlength="40" required=""/> <input class="fact-input"${attr("value", newFieldValue)} placeholder="Nilai" maxlength="200" required=""/> <div class="action-wrap"><button type="submit" class="fact-save"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></button> <button type="button" class="fact-cancel"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div></form></div>`);
						else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> <!--[-->`);
						const each_array_2 = ensure_array_like(fields);
						for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
							let field = each_array_2[$$index_2];
							$$renderer.push(`<div${attr_class("data-field", void 0, { "editing": editingFieldKey === field.originalKey })}><span class="d-label">${escape_html(field.label.replaceAll("_", " "))}</span> <div class="d-value-wrap">`);
							if (typeof field.value === "string" && field.value.includes(",")) {
								$$renderer.push(`<!--[0--><div class="d-value-tags"><!--[-->`);
								const each_array_3 = ensure_array_like(field.value.split(","));
								for (let $$index_1 = 0, $$length = each_array_3.length; $$index_1 < $$length; $$index_1++) {
									let tag = each_array_3[$$index_1];
									if (tag.trim()) $$renderer.push(`<!--[0--><span class="d-value-tag">${escape_html(tag.trim())}</span>`);
									else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]-->`);
								}
								$$renderer.push(`<!--]--></div>`);
							} else $$renderer.push(`<!--[-1--><strong class="d-value">${escape_html(field.value || "—")}</strong>`);
							$$renderer.push(`<!--]--> `);
							if (canAdd()) {
								$$renderer.push(`<!--[0--><div class="hover-actions">`);
								if (editingFieldKey !== field.originalKey) $$renderer.push(`<!--[0--><button type="button" class="h-btn edit" title="Edit"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button> <button type="button" class="h-btn delete" title="Hapus"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>`);
								else $$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--]--></div>`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--></div> `);
							if (editingFieldKey === field.originalKey) $$renderer.push(`<!--[0--><form class="inline-edit-form" style="margin-top: 8px;"><input class="fact-input"${attr("value", editFieldGroup)} placeholder="Kelompok" maxlength="40" readonly="" style="flex: 0.8; background: #f1f5f9; cursor: not-allowed; color: #94a3b8;" title="Nama kelompok tidak bisa diubah di sini"/> <input class="fact-input"${attr("value", editFieldLabel)} placeholder="Field" maxlength="40" required="" style="flex: 1"/> <input class="fact-input"${attr("value", editFieldValue)} placeholder="Nilai" maxlength="200" required="" style="flex: 2"/> <div class="action-wrap"><button type="submit" class="fact-save"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></button> <button type="button" class="fact-cancel"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div></form>`);
							else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--></div>`);
						}
						$$renderer.push(`<!--]--></div></div>`);
					}
					$$renderer.push(`<!--]--> `);
					if (Object.keys(groupedMetadata()).length === 0) $$renderer.push(`<!--[0--><div class="empty-field">Belum ada metadata khusus.</div>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div></div></div>`);
				} else if (detailActiveTab === "team") {
					$$renderer.push(`<!--[1--><div class="team-panel"><div class="team-header"><div class="team-title"><h3>Tim Pengembang &amp; Akses User</h3> <p>Atur siapa saja yang terlibat di proyek ini beserta hak akses
                  mereka.</p></div> <button type="button" class="btn-primary">+ Undang Anggota</button></div> <div class="team-table-wrap"><table class="team-table"><thead><tr><th>USER / NAMA</th><th>PROJECT ROLE</th><th>IZIN AKSES (PERMISSIONS)</th><th>STATUS</th><th></th></tr></thead><tbody><tr><td><div class="team-user"><div class="team-avatar">${escape_html(getInitial(selectedDetail.owner))}</div> <div class="team-user-info"><strong>${escape_html(selectedDetail.owner)}</strong> <span>Business Sponsor</span></div></div></td><td><span class="role-badge primary">Business Owner</span></td><td><span class="perm-text">Sign-off UAT, View Reports</span></td><td><span class="status-active">Active</span></td><td><button class="icon-btn" aria-label="Edit" title="Edit Akses"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></button></td></tr>`);
					if (selectedDetail.metadata?.pm) $$renderer.push(`<!--[0--><tr><td><div class="team-user"><div class="team-avatar">${escape_html(getInitial(selectedDetail.metadata.pm))}</div> <div class="team-user-info"><strong>${escape_html(selectedDetail.metadata.pm)}</strong> <span>IT Division</span></div></div></td><td><span class="role-badge">Project Manager</span></td><td><span class="perm-text">Full Manage, Create Tasks</span></td><td><span class="status-active">Active</span></td><td><button class="icon-btn" aria-label="Edit" title="Edit Akses"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></button></td></tr>`);
					else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></tbody></table></div> <div class="team-empty"><p>Tim masih kosong. Silakan undang Developer, QA, atau Reviewer ke
                dalam proyek ini.</p></div></div>`);
				} else if (detailActiveTab === "tasks") $$renderer.push(`<!--[2--><div class="placeholder-panel"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M8 7v7"></path><path d="M12 7v4"></path><path d="M16 7v9"></path></svg> <p><strong>Kanban Board &amp; Tasks</strong></p> <p>Fitur untuk melihat papan daftar pekerjaan proyek belum aktif.</p></div>`);
				else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			},
			$$slots: { default: true }
		});
		bind_props($$props, {
			selectedDetail,
			detailActiveTab,
			selectedSopItem
		});
	});
}
//#endregion
//#region src/routes/registry/list/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let status = "";
		let q = "";
		let sort = "updated_desc";
		let selectedSopItem = null;
		let selectedDetail = null;
		let detailActiveTab = "overview";
		let applied = {
			status: "",
			dashboard: "",
			q: "",
			sort: "updated_desc"
		};
		const items = derived(() => listDashboards(applied));
		let currentPage = 1;
		let itemsPerPage = 10;
		const totalItems = derived(() => items().length);
		const totalPages = derived(() => Math.ceil(totalItems() / itemsPerPage) || 1);
		const paginatedItems = derived(() => items().slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
		const showingStart = derived(() => totalItems() === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1);
		const showingEnd = derived(() => Math.min(currentPage * itemsPerPage, totalItems()));
		const allDashboards = derived(listDashboards);
		const allItemsCount = derived(() => allDashboards().length);
		const prodCount = derived(() => allDashboards().filter((d) => d.status === "production" || d.status === "active").length);
		const devCount = derived(() => allDashboards().filter((d) => d.status === "development" || d.status === "idle").length);
		function getInitial(name = "") {
			if (!name) return "?";
			return name.trim().charAt(0).toUpperCase();
		}
		function formatDateDisplay(dateStr) {
			if (!dateStr) return "-";
			const d = new Date(dateStr.replace(" ", "T"));
			if (isNaN(d.getTime())) return dateStr;
			return `${String(d.getDate()).padStart(2, "0")} ${[
				"Jan",
				"Feb",
				"Mar",
				"Apr",
				"Mei",
				"Jun",
				"Jul",
				"Agu",
				"Sep",
				"Okt",
				"Nov",
				"Des"
			][d.getMonth()]} ${d.getFullYear()}`;
		}
		let createOpen = false;
		const canAdd = derived(canCreateDashboard);
		const pmOptions = derived(() => listUsers({
			role: 3,
			status: "active"
		}));
		const userOptions = derived(() => listUsers({ status: "active" }));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<section${attr_class("page", void 0, { "detail": !!selectedDetail })}>`);
			if (!selectedDetail) {
				$$renderer.push("<!--[0-->");
				GlassPanel($$renderer, {
					class: "header-panel",
					children: ($$renderer) => {
						{
							function actions($$renderer) {
								if (canAdd()) $$renderer.push(`<!--[0--><button type="button" class="btn-primary">+ Tambah Dashboard</button>`);
								else $$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--]-->`);
							}
							SubmenuHeader($$renderer, {
								eyebrow: "Dashboard Registry",
								title: "Daftar Dashboard",
								sub: "Katalog status dashboard, dokumen SOP, PIC, dan pembaruan terakhir.",
								meta: `${items().length} dari ${allItemsCount()} dashboard`,
								actions,
								$$slots: { actions: true }
							});
						}
						$$renderer.push(`<!----> <div class="stats-grid" style="margin-top: 28px;"><div class="stat-card"><div class="stat-top"><span class="stat-title">Total Aplikasi</span> <div class="icon-wrapper blue-solid-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg></div></div> <div class="stat-bottom"><div class="stat-value">${escape_html(allItemsCount())}</div> <div class="stat-sub">Semua aplikasi &amp; dashboard terdaftar</div></div></div> <div class="stat-card"><div class="stat-top"><span class="stat-title">In Production</span> <div class="icon-wrapper green-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg></div></div> <div class="stat-bottom"><div class="stat-value">${escape_html(prodCount())}</div> <div class="stat-sub">Aplikasi yang sudah live &amp; dipakai user</div></div></div> <div class="stat-card"><div class="stat-top"><span class="stat-title">In Development</span> <div class="icon-wrapper yellow-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div></div> <div class="stat-bottom"><div class="stat-value">${escape_html(devCount())}</div> <div class="stat-sub">Masih dalam tahap pengerjaan</div></div></div></div> <form class="redesign-filters"><div class="filter-field grow-field"><div class="input-with-icon"><svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg> <input id="search-input" type="search" placeholder="Cari nama dashboard, kode SOP, PIC, platform..."${attr("value", q)}/></div></div> <div class="filter-field">`);
						$$renderer.select({
							id: "status-select",
							value: status
						}, ($$renderer) => {
							$$renderer.option({ value: "" }, ($$renderer) => {
								$$renderer.push(`Semua Status`);
							});
							$$renderer.push(`<!--[-->`);
							const each_array = ensure_array_like(registryStatusOptions);
							for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
								let opt = each_array[$$index];
								$$renderer.option({ value: opt.value }, ($$renderer) => {
									$$renderer.push(`${escape_html(opt.label)}`);
								});
							}
							$$renderer.push(`<!--]-->`);
						});
						$$renderer.push(`</div> <div class="filter-field">`);
						$$renderer.select({
							id: "sort-select",
							value: sort
						}, ($$renderer) => {
							$$renderer.push(`<!--[-->`);
							const each_array_1 = ensure_array_like(sortOptions);
							for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
								let opt = each_array_1[$$index_1];
								$$renderer.option({ value: opt.value }, ($$renderer) => {
									$$renderer.push(`${escape_html(opt.label)}`);
								});
							}
							$$renderer.push(`<!--]-->`);
						});
						$$renderer.push(`</div> <button type="submit" class="apply-btn">Terapkan</button></form>`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				GlassPanel($$renderer, {
					class: "table-panel",
					children: ($$renderer) => {
						if (items().length === 0) $$renderer.push(`<!--[0--><div class="empty-state"><p>Tidak ada dashboard yang cocok dengan pencarian Anda.</p></div>`);
						else {
							$$renderer.push(`<!--[-1--><div class="redesign-table-wrap"><table class="redesign-table"><thead><tr><th>DAFTAR DASHBOARD</th><th>INFO &amp; TASK</th><th>PIC</th><th>STATUS DASHBOARD</th><th>LAST UPDATES</th><th class="action-col"></th></tr></thead><tbody><!--[-->`);
							const each_array_2 = ensure_array_like(paginatedItems());
							for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
								let item = each_array_2[$$index_3];
								$$renderer.push(`<tr><td><div class="dashboard-cell"><div class="avatar-badge">${escape_html(item.code || "DB")}</div> <div class="dashboard-info"><div class="name-wrap" style="display:flex; align-items:center; gap:6px;"><a href="#" class="dash-name">${escape_html(item.name)}</a> `);
								if (item.url) $$renderer.push(`<!--[0--><a${attr("href", item.url)} target="_blank" rel="noopener noreferrer" class="ext-link" title="Buka URL"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>`);
								else $$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--]--></div> <span class="dash-meta">${escape_html(item.platform)} • ${escape_html(item.category)}</span></div></div></td><td><div class="info-task-cell"><span${attr_class(`crit-badge crit-${item.criticality}`)}>${escape_html(item.criticality === "high" ? "High" : item.criticality === "medium" ? "Medium" : "Low")}</span> <div${attr_class("task-stats", void 0, { "has-open": item.quick_stats.tasks_open > 0 })}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 6v6l4 2"></path></svg> <span>${escape_html(item.quick_stats.tasks_open)} Open</span></div></div></td><td><div class="pic-cell"><div class="pic-avatar">${escape_html(getInitial(item.owner))}</div> <span class="pic-name">${escape_html(item.owner)}</span></div></td><td>`);
								$$renderer.select({
									class: `status-dropdown pill-${item.status}`,
									value: item.status,
									onchange: (e) => changeDashboardStatus(item.id, e.target.value)
								}, ($$renderer) => {
									$$renderer.push(`<!--[-->`);
									const each_array_3 = ensure_array_like(registryStatusOptions);
									for (let $$index_2 = 0, $$length = each_array_3.length; $$index_2 < $$length; $$index_2++) {
										let opt = each_array_3[$$index_2];
										$$renderer.option({ value: opt.value }, ($$renderer) => {
											$$renderer.push(`${escape_html(opt.label)}`);
										});
									}
									$$renderer.push(`<!--]-->`);
								});
								$$renderer.push(`</td><td><div class="date-cell"><span class="date-main">${escape_html(formatDateDisplay(item.updated_at))}</span> <span class="date-sub">Rev: ${escape_html(item.updated_at ? item.updated_at.slice(0, 10) : "-")}</span></div></td><td class="action-col"><div class="row-actions"><button class="icon-btn tooltip-btn color-sop" data-tooltip="Lihat SOP" aria-label="SOP"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></button> <button class="icon-btn tooltip-btn color-view" data-tooltip="Lihat Detail" aria-label="View Detail"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button> <button class="icon-btn tooltip-btn color-edit" data-tooltip="Edit Data" aria-label="Edit"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button> <button class="icon-btn tooltip-btn danger" data-tooltip="Hapus Data" aria-label="Delete"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button></div></td></tr>`);
							}
							$$renderer.push(`<!--]--></tbody></table></div> <div class="pagination-bar"><div class="pagination-info">Menampilkan <strong>${escape_html(showingStart())}–${escape_html(showingEnd())}</strong> dari <strong>${escape_html(totalItems())}</strong> data</div> <div class="pagination-controls"><div class="per-page"><span>Tampil:</span> `);
							$$renderer.select({
								value: itemsPerPage,
								onchange: () => {
									currentPage = 1;
								}
							}, ($$renderer) => {
								$$renderer.option({ value: 5 }, ($$renderer) => {
									$$renderer.push(`5`);
								});
								$$renderer.option({ value: 10 }, ($$renderer) => {
									$$renderer.push(`10`);
								});
								$$renderer.option({ value: 15 }, ($$renderer) => {
									$$renderer.push(`15`);
								});
								$$renderer.option({ value: 25 }, ($$renderer) => {
									$$renderer.push(`25`);
								});
								$$renderer.option({ value: 50 }, ($$renderer) => {
									$$renderer.push(`50`);
								});
								$$renderer.option({ value: 100 }, ($$renderer) => {
									$$renderer.push(`100`);
								});
							});
							$$renderer.push(`</div> <div class="page-buttons"><button${attr("disabled", currentPage === 1, true)} class="page-nav"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button> <div class="page-numbers"><!--[-->`);
							const each_array_4 = ensure_array_like(Array.from({ length: totalPages() }));
							for (let i = 0, $$length = each_array_4.length; i < $$length; i++) {
								each_array_4[i];
								if (Math.abs(currentPage - (i + 1)) <= 1 || i === 0 || i === totalPages() - 1) $$renderer.push(`<!--[0--><button${attr_class("page-num", void 0, { "active": currentPage === i + 1 })}>${escape_html(i + 1)}</button>`);
								else if (Math.abs(currentPage - (i + 1)) === 2) $$renderer.push(`<!--[1--><span class="page-dots">...</span>`);
								else $$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--]-->`);
							}
							$$renderer.push(`<!--]--></div> <button${attr("disabled", currentPage === totalPages(), true)} class="page-nav"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button></div></div></div>`);
						}
						$$renderer.push(`<!--]-->`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!---->`);
			} else {
				$$renderer.push("<!--[-1-->");
				RegistryDetailPanel($$renderer, {
					get selectedDetail() {
						return selectedDetail;
					},
					set selectedDetail($$value) {
						selectedDetail = $$value;
						$$settled = false;
					},
					get detailActiveTab() {
						return detailActiveTab;
					},
					set detailActiveTab($$value) {
						detailActiveTab = $$value;
						$$settled = false;
					},
					get selectedSopItem() {
						return selectedSopItem;
					},
					set selectedSopItem($$value) {
						selectedSopItem = $$value;
						$$settled = false;
					}
				});
			}
			$$renderer.push(`<!--]--></section> `);
			RegistrySopModal($$renderer, {
				get selectedSopItem() {
					return selectedSopItem;
				},
				set selectedSopItem($$value) {
					selectedSopItem = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----> `);
			RegistryCreateModal($$renderer, {
				pmOptions: pmOptions(),
				userOptions: userOptions(),
				get createOpen() {
					return createOpen;
				},
				set createOpen($$value) {
					createOpen = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!---->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
export { _page as default };

//# sourceMappingURL=_page.svelte.js.map