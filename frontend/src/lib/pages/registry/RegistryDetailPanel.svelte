<script>
  import GlassPanel from '$lib/GlassPanel.svelte';
  import {
    registryStatusLabel,
    registryStatusOptions,
    changeDashboardStatus,
    setDashboardField,
    renameDashboardField,
    removeDashboardField,
  } from '$lib/registryStore.svelte.js';
  import { canCreateDashboard } from '$lib/taskModuleStore.svelte.js';
  import { formatDate } from '$lib/format.js';
  import AttachmentPanel from '$lib/AttachmentPanel.svelte';
  import RegistryEditModal from './RegistryEditModal.svelte';
  import RegistryInviteModal from './RegistryInviteModal.svelte';

  let { selectedDetail = $bindable(), detailActiveTab = $bindable("overview"), selectedSopItem = $bindable() } = $props();

  let editOpen = $state(false);
  let inviteOpen = $state(false);

  const canAdd = $derived(canCreateDashboard());
  function getInitial(name = "") {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr.replace(" ", "T"));
    if (isNaN(d.getTime())) return dateStr;
    const months = [
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
      "Des",
    ];
    return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
  let addFieldMode = $state(null);
  let newFieldGroup = $state("");
  let newFieldLabel = $state("");
  let newFieldValue = $state("");

  function openAddField(mode) {
    if (mode === "global") {
      newFieldGroup = "";
    } else {
      newFieldGroup = mode === "Lainnya" ? "" : mode;
    }
    newFieldLabel = "";
    newFieldValue = "";
    addFieldMode = mode;
  }

  function cancelAddField() {
    addFieldMode = null;
  }

  function submitAddField(event) {
    event.preventDefault();
    if (!selectedDetail) return;
    const finalKey = newFieldGroup.trim()
      ? `${newFieldGroup.trim()}::${newFieldLabel.trim()}`
      : newFieldLabel.trim();
    if (setDashboardField(selectedDetail.id, finalKey, newFieldValue)) {
      addFieldMode = null;
    }
  }

  /** @type {string | null} key field metadata yang sedang diedit */
  let editingFieldKey = $state(null);
  let editFieldGroup = $state("");
  let editFieldLabel = $state("");
  let editFieldValue = $state("");

  function startEditField(originalKey, label, group, value) {
    editingFieldKey = originalKey;
    editFieldGroup = group === "Lainnya" ? "" : group;
    editFieldLabel = label;
    editFieldValue = value;
  }

  function cancelEditField() {
    editingFieldKey = null;
  }

  let editingGroup = $state(null);
  let editGroupName = $state("");

  function startEditGroup(groupName) {
    editingGroup = groupName;
    editGroupName = groupName;
  }

  function submitEditGroup(event, oldGroup) {
    event.preventDefault();
    if (!selectedDetail) return;
    const newG = editGroupName.trim();
    if (!newG || newG === oldGroup) {
      editingGroup = null;
      return;
    }

    const fields = groupedMetadata[oldGroup];
    if (fields) {
      for (const field of fields) {
        let rawLabel = field.originalKey;
        if (field.originalKey.includes("::")) {
          rawLabel = field.originalKey.split("::")[1];
        }
        const newKey = `${newG}::${rawLabel}`;
        renameDashboardField(
          selectedDetail.id,
          field.originalKey,
          newKey,
          field.value,
        );
      }
    }
    editingGroup = null;
  }

  function cancelEditGroup() {
    editingGroup = null;
  }

  function submitEditField(event, originalKey) {
    event.preventDefault();
    if (!selectedDetail) return;
    const finalKey = editFieldGroup.trim()
      ? `${editFieldGroup.trim()}::${editFieldLabel.trim()}`
      : editFieldLabel.trim();
    if (
      renameDashboardField(
        selectedDetail.id,
        originalKey,
        finalKey,
        editFieldValue,
      )
    ) {
      editingFieldKey = null;
    }
  }

  let groupedMetadata = $derived.by(() => {
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
      groups[group].push({ originalKey: key, label, value });
    }
    return groups;
  });

  function onDeleteField(key) {
    if (!selectedDetail) return;
    if (!confirm(`Hapus field "${key}"?`)) return;
    removeDashboardField(selectedDetail.id, key);
  }
</script>

<GlassPanel class="detail-panel">
      <!-- ERP Standard Object Header -->
      <div class="erp-object-header">
        <div class="erp-header-top">
          <div class="erp-header-left">
            <button
              type="button"
              class="erp-back-btn"
              onclick={() => (selectedDetail = null)}
              aria-label="Kembali ke daftar"
              title="Kembali"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                ><path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg
              >
            </button>
            <div class="erp-title-block">
              <div class="erp-title-row">
                <h2>{selectedDetail.name}</h2>
                <span class={`badge status-${selectedDetail.status}`}
                  >{registryStatusLabel(selectedDetail.status)}</span
                >
                <span class="mono-id">#{selectedDetail.id}</span>
              </div>
              <p class="erp-subtitle">
                {selectedDetail.description ||
                  `${selectedDetail.platform} · ${selectedDetail.category}`}
              </p>
            </div>
          </div>

          <div class="erp-header-right">
            <div class="erp-actions">
              <div
                class="action-pills"
                style="margin:0; padding:0; background:transparent; border:none; box-shadow:none;"
              >
                <AttachmentPanel
                  ownerType="dashboard"
                  ownerId={selectedDetail.id}
                />
              </div>
              <button
                type="button"
                class="btn-outline"
                onclick={() => (selectedSopItem = selectedDetail)}
                >Lihat SOP</button
              >
              <button
                type="button"
                class="btn-primary"
                onclick={() => editOpen = true}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  ><path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  ></path><path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  ></path></svg
                >
                Ubah Data
              </button>
            </div>

            <div class="erp-kpi-bar">
              <div class="kpi-item">
                <span class="kpi-label">Requirement</span>
                <strong class="kpi-val"
                  >{selectedDetail.quick_stats?.requirements_total || 0}</strong
                >
              </div>
              <div class="kpi-item">
                <span class="kpi-label">Task</span>
                <strong class="kpi-val"
                  >{selectedDetail.quick_stats?.tasks_total ||
                    selectedDetail.tasks?.length ||
                    0}</strong
                >
              </div>
              <div class="kpi-item">
                <span class="kpi-label">Task Done</span>
                <strong class="kpi-val"
                  >{selectedDetail.quick_stats?.tasks_done || 0}</strong
                >
              </div>
            </div>
          </div>
        </div>

        <div class="detail-tabs erp-tabs">
          <button
            type="button"
            class="d-tab"
            class:active={detailActiveTab === "overview"}
            onclick={() => (detailActiveTab = "overview")}
            >Overview & Info</button
          >
          <button
            type="button"
            class="d-tab"
            class:active={detailActiveTab === "team"}
            onclick={() => (detailActiveTab = "team")}>Tim & Akses</button
          >
        </div>
      </div>

      <div class="detail-content">
        {#if detailActiveTab === "overview"}
          <div class="erp-facet-layout">
            <!-- Facet 1: General Info -->
            <div class="erp-card">
              <div class="erp-card-header">
                <h3>Informasi Umum</h3>
              </div>
              <div class="erp-card-body grid-2">
                <div class="data-field">
                  <span class="d-label">PIC / Owner</span>
                  <div class="d-value pic-value">
                    <span class="pic-avatar-small"
                      >{getInitial(selectedDetail.owner)}</span
                    >
                    <strong>{selectedDetail.owner}</strong>
                  </div>
                </div>
                <div class="data-field">
                  <span class="d-label">Kode / ID</span>
                  <strong class="d-value">{selectedDetail.code}</strong>
                </div>
                <div class="data-field">
                  <span class="d-label">Kategori</span>
                  <strong class="d-value">{selectedDetail.category}</strong>
                </div>
                <div class="data-field">
                  <span class="d-label">Platform</span>
                  <strong class="d-value">{selectedDetail.platform}</strong>
                </div>
                <div class="data-field">
                  <span class="d-label">Prioritas</span>
                  <div class="d-value">
                    <span
                      class={`crit-badge crit-${selectedDetail.criticality}`}
                      >{selectedDetail.criticality}</span
                    >
                  </div>
                </div>
                <div class="data-field">
                  <span class="d-label">URL / Tautan</span>
                  {#if selectedDetail.url}
                    <a
                      href={selectedDetail.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="d-value link">{selectedDetail.url}</a
                    >
                  {:else}
                    <strong class="d-value text-muted">—</strong>
                  {/if}
                </div>
                <div class="data-field">
                  <span class="d-label">Dibuat Pada</span>
                  <strong class="d-value"
                    >{formatDateDisplay(selectedDetail.created_at)}</strong
                  >
                </div>
                <div class="data-field">
                  <span class="d-label">Update Terakhir</span>
                  <strong class="d-value"
                    >{formatDateDisplay(selectedDetail.updated_at)}</strong
                  >
                </div>
              </div>
            </div>

            <!-- Facet 2: Technical & Metadata -->
            <div class="erp-card">
              <div class="erp-card-header">
                <h3>Data Spesifik & Metadata</h3>
                {#if canAdd}
                  {#if addFieldMode === "global"}
                    <form class="inline-add-form" onsubmit={submitAddField}>
                      <input
                        class="fact-input"
                        bind:value={newFieldGroup}
                        list="existing-groups"
                        placeholder="Kelompok Baru"
                        maxlength="40"
                      />
                      <input
                        class="fact-input"
                        bind:value={newFieldLabel}
                        placeholder="Nama Field"
                        maxlength="40"
                        required
                      />
                      <input
                        class="fact-input"
                        bind:value={newFieldValue}
                        placeholder="Nilai"
                        maxlength="200"
                        required
                      />
                      <button type="submit" class="fact-save" title="Simpan">
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          ><polyline points="20 6 9 17 4 12"></polyline></svg
                        >
                      </button>
                      <button
                        type="button"
                        class="fact-cancel"
                        onclick={cancelAddField}
                        title="Batal"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          ><line x1="18" y1="6" x2="6" y2="18"></line><line
                            x1="6"
                            y1="6"
                            x2="18"
                            y2="18"
                          ></line></svg
                        >
                      </button>
                    </form>
                  {:else}
                    <button
                      type="button"
                      class="btn-text"
                      onclick={() => openAddField("global")}
                      >+ Kelompok / Field Baru</button
                    >
                  {/if}
                {/if}
              </div>
              <div class="erp-card-body grouped-meta">
                <datalist id="existing-groups">
                  {#each Object.keys(groupedMetadata).filter((g) => g !== "Lainnya") as g}
                    <option value={g}></option>
                  {/each}
                </datalist>

                {#each Object.entries(groupedMetadata) as [group, fields]}
                  <div class="meta-group">
                    {#if group !== "Lainnya" || Object.keys(groupedMetadata).length > 1}
                      <div class="meta-group-header">
                        {#if editingGroup === group}
                          <form
                            class="inline-edit-form"
                            style="flex: 1; margin-right: 12px; margin-bottom: 0; padding: 4px;"
                            onsubmit={(e) => submitEditGroup(e, group)}
                          >
                            <input
                              class="fact-input"
                              bind:value={editGroupName}
                              placeholder="Nama Kelompok"
                              required
                              style="font-weight: 800; text-transform: uppercase;"
                            />
                            <div class="action-wrap">
                              <button type="submit" class="fact-save"
                                ><svg
                                  viewBox="0 0 24 24"
                                  width="14"
                                  height="14"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2.5"
                                  ><polyline points="20 6 9 17 4 12"
                                  ></polyline></svg
                                ></button
                              >
                              <button
                                type="button"
                                class="fact-cancel"
                                onclick={cancelEditGroup}
                                ><svg
                                  viewBox="0 0 24 24"
                                  width="14"
                                  height="14"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2.5"
                                  ><line x1="18" y1="6" x2="6" y2="18"
                                  ></line><line x1="6" y1="6" x2="18" y2="18"
                                  ></line></svg
                                ></button
                              >
                            </div>
                          </form>
                        {:else}
                          <h4 class="meta-group-title">{group}</h4>
                          {#if canAdd}
                            <div class="action-wrap">
                              <button
                                type="button"
                                class="h-btn edit"
                                onclick={() => startEditGroup(group)}
                                title="Ubah nama kelompok"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  width="12"
                                  height="12"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2.5"
                                  ><path
                                    d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
                                  ></path></svg
                                >
                              </button>
                              <button
                                type="button"
                                class="h-btn add"
                                onclick={() => openAddField(group)}
                                title="Tambah field di kelompok {group}"
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  width="12"
                                  height="12"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2.5"
                                  ><line x1="12" y1="5" x2="12" y2="19"
                                  ></line><line x1="5" y1="12" x2="19" y2="12"
                                  ></line></svg
                                >
                              </button>
                            </div>
                          {/if}
                        {/if}
                      </div>
                    {/if}
                    <div class="grid-2">
                      {#if addFieldMode === group}
                        <div class="data-field editing">
                          <div
                            class="d-label"
                            style="color: #3b82f6; margin-bottom: -2px;"
                          >
                            + Tambah ke {group}
                          </div>
                          <form
                            class="inline-edit-form"
                            onsubmit={submitAddField}
                          >
                            <input type="hidden" bind:value={newFieldGroup} />
                            <input
                              class="fact-input"
                              bind:value={newFieldLabel}
                              placeholder="Nama Field"
                              maxlength="40"
                              required
                            />
                            <input
                              class="fact-input"
                              bind:value={newFieldValue}
                              placeholder="Nilai"
                              maxlength="200"
                              required
                            />
                            <div class="action-wrap">
                              <button type="submit" class="fact-save"
                                ><svg
                                  viewBox="0 0 24 24"
                                  width="14"
                                  height="14"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2.5"
                                  ><polyline points="20 6 9 17 4 12"
                                  ></polyline></svg
                                ></button
                              >
                              <button
                                type="button"
                                class="fact-cancel"
                                onclick={cancelAddField}
                                ><svg
                                  viewBox="0 0 24 24"
                                  width="14"
                                  height="14"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2.5"
                                  ><line x1="18" y1="6" x2="6" y2="18"
                                  ></line><line x1="6" y1="6" x2="18" y2="18"
                                  ></line></svg
                                ></button
                              >
                            </div>
                          </form>
                        </div>
                      {/if}
                      {#each fields as field (field.originalKey)}
                        <div
                          class="data-field"
                          class:editing={editingFieldKey === field.originalKey}
                        >
                          <span class="d-label"
                            >{field.label.replaceAll("_", " ")}</span
                          >
                          <div class="d-value-wrap">
                            {#if typeof field.value === "string" && field.value.includes(",")}
                              <div class="d-value-tags">
                                {#each field.value.split(",") as tag}
                                  {#if tag.trim()}
                                    <span class="d-value-tag">{tag.trim()}</span
                                    >
                                  {/if}
                                {/each}
                              </div>
                            {:else}
                              <strong class="d-value"
                                >{field.value || "—"}</strong
                              >
                            {/if}
                            {#if canAdd}
                              <div class="hover-actions">
                                {#if editingFieldKey !== field.originalKey}
                                  <button
                                    type="button"
                                    class="h-btn edit"
                                    onclick={() =>
                                      startEditField(
                                        field.originalKey,
                                        field.label,
                                        group,
                                        field.value,
                                      )}
                                    title="Edit"
                                    ><svg
                                      viewBox="0 0 24 24"
                                      width="12"
                                      height="12"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2.5"
                                      ><path
                                        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
                                      ></path></svg
                                    ></button
                                  >
                                  <button
                                    type="button"
                                    class="h-btn delete"
                                    onclick={() =>
                                      onDeleteField(field.originalKey)}
                                    title="Hapus"
                                    ><svg
                                      viewBox="0 0 24 24"
                                      width="12"
                                      height="12"
                                      fill="none"
                                      stroke="currentColor"
                                      stroke-width="2.5"
                                      ><polyline points="3 6 5 6 21 6"
                                      ></polyline><path
                                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                      ></path></svg
                                    ></button
                                  >
                                {/if}
                              </div>
                            {/if}
                          </div>

                          {#if editingFieldKey === field.originalKey}
                            <form
                              class="inline-edit-form"
                              style="margin-top: 8px;"
                              onsubmit={(e) =>
                                submitEditField(e, field.originalKey)}
                            >
                              <input
                                class="fact-input"
                                bind:value={editFieldGroup}
                                placeholder="Kelompok"
                                maxlength="40"
                                readonly
                                style="flex: 0.8; background: #f1f5f9; cursor: not-allowed; color: #94a3b8;"
                                title="Nama kelompok tidak bisa diubah di sini"
                              />
                              <input
                                class="fact-input"
                                bind:value={editFieldLabel}
                                placeholder="Field"
                                maxlength="40"
                                required
                                style="flex: 1"
                              />
                              <input
                                class="fact-input"
                                bind:value={editFieldValue}
                                placeholder="Nilai"
                                maxlength="200"
                                required
                                style="flex: 2"
                              />
                              <div class="action-wrap">
                                <button type="submit" class="fact-save"
                                  ><svg
                                    viewBox="0 0 24 24"
                                    width="14"
                                    height="14"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                    ><polyline points="20 6 9 17 4 12"
                                    ></polyline></svg
                                  ></button
                                >
                                <button
                                  type="button"
                                  class="fact-cancel"
                                  onclick={cancelEditField}
                                  ><svg
                                    viewBox="0 0 24 24"
                                    width="14"
                                    height="14"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                    ><line x1="18" y1="6" x2="6" y2="18"
                                    ></line><line x1="6" y1="6" x2="18" y2="18"
                                    ></line></svg
                                  ></button
                                >
                              </div>
                            </form>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
                {#if Object.keys(groupedMetadata).length === 0}
                  <div class="empty-field">Belum ada metadata khusus.</div>
                {/if}
              </div>
            </div>
          </div>
        {:else if detailActiveTab === "team"}
          <div class="team-panel">
            <div class="team-header">
              <div class="team-title">
                <h3>Tim Pengembang & Akses User</h3>
                <p>
                  Atur siapa saja yang terlibat di proyek ini beserta hak akses
                  mereka.
                </p>
              </div>
              <button type="button" class="btn-primary" onclick={() => inviteOpen = true}>+ Undang Anggota</button
              >
            </div>

            <div class="team-table-wrap">
              <table class="team-table">
                <thead>
                  <tr>
                    <th>USER / NAMA</th>
                    <th>PROJECT ROLE</th>
                    <th>IZIN AKSES (PERMISSIONS)</th>
                    <th>STATUS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="team-user">
                        <div class="team-avatar">
                          {getInitial(selectedDetail.owner)}
                        </div>
                        <div class="team-user-info">
                          <strong>{selectedDetail.owner}</strong>
                          <span>Business Sponsor</span>
                        </div>
                      </div>
                    </td>
                    <td
                      ><span class="role-badge primary">Business Owner</span
                      ></td
                    >
                    <td
                      ><span class="perm-text">Sign-off UAT, View Reports</span
                      ></td
                    >
                    <td><span class="status-active">Active</span></td>
                    <td
                      ><button
                        class="icon-btn"
                        aria-label="Edit"
                        title="Edit Akses"
                        ><svg
                          viewBox="0 0 24 24"
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          ><circle cx="12" cy="12" r="1" /><circle
                            cx="12"
                            cy="5"
                            r="1"
                          /><circle cx="12" cy="19" r="1" /></svg
                        ></button
                      ></td
                    >
                  </tr>
                  {#if selectedDetail.metadata?.pm}
                    <tr>
                      <td>
                        <div class="team-user">
                          <div class="team-avatar">
                            {getInitial(selectedDetail.metadata.pm)}
                          </div>
                          <div class="team-user-info">
                            <strong>{selectedDetail.metadata.pm}</strong>
                            <span>IT Division</span>
                          </div>
                        </div>
                      </td>
                      <td><span class="role-badge">Project Manager</span></td>
                      <td
                        ><span class="perm-text">Full Manage, Create Tasks</span
                        ></td
                      >
                      <td><span class="status-active">Active</span></td>
                      <td
                        ><button
                          class="icon-btn"
                          aria-label="Edit"
                          title="Edit Akses"
                          ><svg
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            ><circle cx="12" cy="12" r="1" /><circle
                              cx="12"
                              cy="5"
                              r="1"
                            /><circle cx="12" cy="19" r="1" /></svg
                          ></button
                        ></td
                      >
                    </tr>
                  {/if}
                </tbody>
              </table>
            </div>
            <div class="team-empty">
              <p>
                Tim masih kosong. Silakan undang Developer, QA, atau Reviewer ke
                dalam proyek ini.
              </p>
            </div>
          </div>
        {/if}
      </div>
    </GlassPanel>

<RegistryEditModal bind:editOpen bind:dashboard={selectedDetail} />
<RegistryInviteModal bind:inviteOpen bind:dashboard={selectedDetail} />
