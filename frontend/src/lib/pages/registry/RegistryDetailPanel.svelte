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
            class:active={detailActiveTab === "tasks"}
            onclick={() => (detailActiveTab = "tasks")}>Board & Tasks</button
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
        {:else if detailActiveTab === "tasks"}
          <div class="kanban-wrapper">
            <div class="kanban-header">
              <div class="kanban-title">
                <h3>Kanban Board & Tasks</h3>
                <p>Kelola daftar pekerjaan dan backlog untuk aplikasi ini secara visual.</p>
              </div>
              <div class="kanban-actions">
                <input type="text" placeholder="Cari task (contoh: TRX-101)..." class="k-search" />
                <button type="button" class="btn-primary" style="padding: 8px 16px;">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 6px; vertical-align: text-bottom;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Task Baru
                </button>
              </div>
            </div>

            <div class="kanban-board">
              <!-- Column: Backlog -->
              <div class="k-column">
                <div class="k-column-header">
                  <span class="k-col-title">BACKLOG</span>
                  <span class="k-col-count">2</span>
                </div>
                <div class="k-cards">
                  <div class="k-card">
                    <div class="k-card-tags"><span class="k-tag feat">Feature</span></div>
                    <h5 class="k-card-title">Setup authentication repository & middleware</h5>
                    <div class="k-card-footer">
                      <span class="k-card-id">#{selectedDetail.code}-101</span>
                      <div class="k-card-assignee" title="Unassigned">?</div>
                    </div>
                  </div>
                  <div class="k-card">
                    <div class="k-card-tags"><span class="k-tag task">Task</span></div>
                    <h5 class="k-card-title">Define database schema for user profiles</h5>
                    <div class="k-card-footer">
                      <span class="k-card-id">#{selectedDetail.code}-102</span>
                      <div class="k-card-assignee" style="background:#fce7f3; color:#be185d; border-color:#fbcfe8;" title="Gita Lestari">GL</div>
                    </div>
                  </div>
                </div>
                <button class="k-add-btn">+ Tambah Card</button>
              </div>
              
              <!-- Column: To Do -->
              <div class="k-column">
                <div class="k-column-header">
                  <span class="k-col-title">TO DO</span>
                  <span class="k-col-count">1</span>
                </div>
                <div class="k-cards">
                  <div class="k-card">
                    <div class="k-card-tags"><span class="k-tag bug">Bug</span><span class="k-tag prio-high">High</span></div>
                    <h5 class="k-card-title">Fix responsive layout on dashboard header</h5>
                    <div class="k-card-footer">
                      <span class="k-card-id">#{selectedDetail.code}-105</span>
                      <div class="k-card-assignee" style="background:#e0e7ff; color:#4338ca; border-color:#c7d2fe;" title="Developer">DV</div>
                    </div>
                  </div>
                </div>
                <button class="k-add-btn">+ Tambah Card</button>
              </div>
              
              <!-- Column: In Progress -->
              <div class="k-column">
                <div class="k-column-header">
                  <span class="k-col-title" style="color: #0284c7;">IN PROGRESS</span>
                  <span class="k-col-count" style="background: #e0f2fe; color: #0284c7;">1</span>
                </div>
                <div class="k-cards">
                  <div class="k-card">
                    <div class="k-card-tags"><span class="k-tag feat">Feature</span></div>
                    <h5 class="k-card-title">Create API endpoints for application registry</h5>
                    <div class="k-card-footer">
                      <span class="k-card-id">#{selectedDetail.code}-099</span>
                      <div class="k-card-assignee" style="background:#dcfce7; color:#15803d; border-color:#bbf7d0;" title="System Admin">SA</div>
                    </div>
                  </div>
                </div>
                <button class="k-add-btn">+ Tambah Card</button>
              </div>
              
              <!-- Column: Done -->
              <div class="k-column" style="opacity: 0.8;">
                <div class="k-column-header">
                  <span class="k-col-title" style="color: #16a34a;">DONE</span>
                  <span class="k-col-count" style="background: #dcfce7; color: #16a34a;">1</span>
                </div>
                <div class="k-cards">
                  <div class="k-card">
                    <div class="k-card-tags"><span class="k-tag task">Task</span></div>
                    <h5 class="k-card-title" style="text-decoration: line-through; color: #94a3b8;">Initial project setup and repository creation</h5>
                    <div class="k-card-footer">
                      <span class="k-card-id">#{selectedDetail.code}-001</span>
                      <div class="k-card-assignee" style="background:#f3f4f6; color:#64748b; border-color:#e2e8f0;">SA</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </GlassPanel>

<RegistryEditModal bind:editOpen bind:dashboard={selectedDetail} />
<RegistryInviteModal bind:inviteOpen bind:dashboard={selectedDetail} />

<style>
  /* Kanban Board Styles */
  .kanban-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 16px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }
  
  .kanban-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 8px;
  }
  
  .kanban-title h3 {
    margin: 0 0 6px 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
  }
  
  .kanban-title p {
    margin: 0;
    font-size: 0.85rem;
    color: #64748b;
  }
  
  .kanban-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .k-search {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.85rem;
    outline: none;
    width: 240px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .k-search:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
  
  .kanban-board {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    flex: 1;
    min-height: 400px;
    padding-bottom: 12px;
  }
  
  .k-column {
    background: #f1f5f9;
    border-radius: 12px;
    min-width: 290px;
    width: 290px;
    display: flex;
    flex-direction: column;
    padding: 14px;
    border: 1px solid #e2e8f0;
  }
  
  .k-column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 0 4px;
  }
  
  .k-col-title {
    font-weight: 750;
    font-size: 0.85rem;
    color: #475569;
    letter-spacing: 0.05em;
  }
  
  .k-col-count {
    background: #e2e8f0;
    color: #475569;
    font-size: 0.75rem;
    font-weight: 750;
    padding: 2px 8px;
    border-radius: 999px;
  }
  
  .k-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    flex: 1;
    margin-bottom: 12px;
  }
  
  .k-card {
    background: #ffffff;
    border-radius: 10px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(15, 23, 42, 0.04);
    border: 1px solid #e2e8f0;
    cursor: grab;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .k-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
    border-color: #cbd5e1;
  }
  
  .k-card-tags {
    display: flex;
    gap: 6px;
    margin-bottom: 10px;
  }
  
  .k-tag {
    font-size: 0.65rem;
    font-weight: 750;
    padding: 3px 8px;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
  
  .k-tag.feat { background: #dbeafe; color: #1d4ed8; }
  .k-tag.bug { background: #fee2e2; color: #b91c1c; }
  .k-tag.task { background: #f3f4f6; color: #475569; }
  .k-tag.prio-high { background: #ffedd5; color: #c2410c; }
  
  .k-card-title {
    margin: 0 0 16px 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.4;
  }
  
  .k-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px dashed #e2e8f0;
    padding-top: 12px;
  }
  
  .k-card-id {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 600;
  }
  
  .k-card-assignee {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #f1f5f9;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 750;
    border: 1px solid #cbd5e1;
  }

  .k-add-btn {
    background: transparent;
    border: 1px dashed #cbd5e1;
    color: #64748b;
    padding: 10px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .k-add-btn:hover {
    background: #ffffff;
    border-color: #94a3b8;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
</style>
