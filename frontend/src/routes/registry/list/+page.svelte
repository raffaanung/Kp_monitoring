<script>
  import { goto } from '$app/navigation';
  import GlassPanel from '$lib/GlassPanel.svelte';
  import SubmenuHeader from '$lib/SubmenuHeader.svelte';
  import {
    listDashboards,
    registryStatusLabel,
    registryStatusOptions,
    dashboardFilterOptions,
    sortOptions,
    rememberDetailId,
    changeDashboardStatus,
  } from '$lib/registryStore.svelte.js';
  import { canCreateDashboard } from '$lib/taskModuleStore.svelte.js';
  import { listUsers } from '$lib/accessStore.svelte.js';
  import { portal } from '$lib/portal.js';
  import { formatDate } from '$lib/format.js';
  import RegistrySopModal from '$lib/pages/registry/RegistrySopModal.svelte';
  import RegistryCreateModal from '$lib/pages/registry/RegistryCreateModal.svelte';
  import RegistryDetailPanel from '$lib/pages/registry/RegistryDetailPanel.svelte';
  import "$lib/pages/registry/registry.css";

  let status = $state("");
  let dashboard = $state("");
  let q = $state("");
  let sort = $state("updated_desc");

  let expandedRows = $state(new Set());
  let selectedSopItem = $state(null);
  let selectedDetail = $state(null);
  let detailActiveTab = $state("overview");

  let applied = $state({
    status: "",
    dashboard: "",
    q: "",
    sort: "updated_desc",
  });

  $effect(() => {
    const handleReset = () => {
      selectedDetail = null;
    };
    window.addEventListener("reset-registry", handleReset);
    return () => window.removeEventListener("reset-registry", handleReset);
  });

  const items = $derived(listDashboards(applied));

  // Pagination State
  let currentPage = $state(1);
  let itemsPerPage = $state(10);

  const totalItems = $derived(items.length);
  const totalPages = $derived(Math.ceil(totalItems / itemsPerPage) || 1);
  const paginatedItems = $derived(
    items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
  );
  const showingStart = $derived(
    totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1,
  );
  const showingEnd = $derived(Math.min(currentPage * itemsPerPage, totalItems));
  const allDashboards = $derived(listDashboards());
  const allItemsCount = $derived(allDashboards.length);
  const prodCount = $derived(
    allDashboards.filter(
      (d) => d.status === "production" || d.status === "active",
    ).length,
  );
  const devCount = $derived(
    allDashboards.filter(
      (d) => d.status === "development" || d.status === "idle",
    ).length,
  );

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

  function onSubmit(event) {
    event.preventDefault();
    applied = { status, dashboard, q, sort };
    currentPage = 1; // reset pagination
  }

  let createOpen = $state(false);

  const canAdd = $derived(canCreateDashboard());
  const pmOptions = $derived(listUsers({ role: 3, status: "active" }));
  const userOptions = $derived(listUsers({ status: "active" }));

  function openCreate() {
    createOpen = true;
  }


</script>

<section class="page" class:detail={!!selectedDetail}>
  {#if !selectedDetail}
    <GlassPanel class="header-panel">
      <SubmenuHeader
        eyebrow="Dashboard Registry"
        title="Daftar Dashboard"
        sub="Katalog status dashboard, dokumen SOP, PIC, dan pembaruan terakhir."
        meta={`${items.length} dari ${allItemsCount} dashboard`}
      >
        {#snippet actions()}
          {#if canAdd}
            <button type="button" class="btn-primary" onclick={openCreate}
              >+ Tambah Dashboard</button
            >
          {/if}
        {/snippet}
      </SubmenuHeader>

      <!-- Summary Cards Grid -->
      <div class="stats-grid" style="margin-top: 28px;">
        <!-- Card 1 -->
        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-title">Total Aplikasi</span>
            <div class="icon-wrapper blue-solid-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                ><rect width="18" height="18" x="3" y="3" rx="2" /><path
                  d="M3 9h18"
                /><path d="M9 21V9" /></svg
              >
            </div>
          </div>
          <div class="stat-bottom">
            <div class="stat-value">{allItemsCount}</div>
            <div class="stat-sub">Semua aplikasi & dashboard terdaftar</div>
          </div>
        </div>

        <!-- Card 2 -->
        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-title">In Production</span>
            <div class="icon-wrapper green-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                ><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg
              >
            </div>
          </div>
          <div class="stat-bottom">
            <div class="stat-value">{prodCount}</div>
            <div class="stat-sub">Aplikasi yang sudah live & dipakai user</div>
          </div>
        </div>

        <!-- Card 3 -->
        <div class="stat-card">
          <div class="stat-top">
            <span class="stat-title">In Development</span>
            <div class="icon-wrapper yellow-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                ><path
                  d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                /></svg
              >
            </div>
          </div>
          <div class="stat-bottom">
            <div class="stat-value">{devCount}</div>
            <div class="stat-sub">Masih dalam tahap pengerjaan</div>
          </div>
        </div>
      </div>

      <!-- Filter & Search Bar -->
      <form class="redesign-filters" onsubmit={onSubmit}>
        <div class="filter-field grow-field">
          <div class="input-with-icon">
            <svg
              class="search-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              ><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg
            >
            <input
              id="search-input"
              type="search"
              placeholder="Cari nama dashboard, kode SOP, PIC, platform..."
              bind:value={q}
            />
          </div>
        </div>

        <div class="filter-field">
          <select id="status-select" bind:value={status}>
            <option value="">Semua Status</option>
            {#each registryStatusOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </div>

        <div class="filter-field">
          <select id="sort-select" bind:value={sort}>
            {#each sortOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </div>

        <button type="submit" class="apply-btn">Terapkan</button>
      </form>
    </GlassPanel>

    <GlassPanel class="table-panel">
      {#if items.length === 0}
        <div class="empty-state">
          <p>Tidak ada dashboard yang cocok dengan pencarian Anda.</p>
        </div>
      {:else}
        <div class="redesign-table-wrap">
          <table class="redesign-table">
            <thead>
              <tr>
                <th>DAFTAR DASHBOARD</th>
                <th>INFO & TASK</th>
                <th>PIC</th>
                <th>STATUS DASHBOARD</th>
                <th>LAST UPDATES</th>
                <th class="action-col"></th>
              </tr>
            </thead>
            <tbody>
              {#each paginatedItems as item (item.id)}
                <tr>
                  <!-- Column 1: Dashboard Info -->
                  <td>
                    <div class="dashboard-cell">
                      <div class="avatar-badge">{item.code || "DB"}</div>
                      <div class="dashboard-info">
                        <div
                          class="name-wrap"
                          style="display:flex; align-items:center; gap:6px;"
                        >
                          <a
                            href="#"
                            onclick={(e) => {
                              e.preventDefault();
                              selectedDetail = item;
                              rememberDetailId(item.id);
                              detailActiveTab = "overview";
                            }}
                            class="dash-name"
                          >
                            {item.name}
                          </a>
                          {#if item.url}
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="ext-link"
                              title="Buka URL"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                ><path
                                  d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                                ></path><polyline points="15 3 21 3 21 9"
                                ></polyline><line x1="10" y1="14" x2="21" y2="3"
                                ></line></svg
                              >
                            </a>
                          {/if}
                        </div>
                        <span class="dash-meta"
                          >{item.platform} • {item.category}</span
                        >
                      </div>
                    </div>
                  </td>

                  <!-- Column 1.5: Info & Tasks -->
                  <td>
                    <div class="info-task-cell">
                      <span class={`crit-badge crit-${item.criticality}`}
                        >{item.criticality === "high"
                          ? "High"
                          : item.criticality === "medium"
                            ? "Medium"
                            : "Low"}</span
                      >
                      <div
                        class="task-stats"
                        class:has-open={item.quick_stats.tasks_open > 0}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          ><path
                            d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
                          ></path><path d="M12 6v6l4 2"></path></svg
                        >
                        <span>{item.quick_stats.tasks_open} Open</span>
                      </div>
                    </div>
                  </td>

                  <!-- Column 2: PIC -->
                  <td>
                    <div class="pic-cell">
                      <div class="pic-avatar">{getInitial(item.owner)}</div>
                      <span class="pic-name">{item.owner}</span>
                    </div>
                  </td>

                  <!-- Column 3: Status -->
                  <td>
                    <!-- <span class={`status-pill pill-${item.status}`}>
                    <span class="dot"></span>
                    {registryStatusLabel(item.status)}
                  </span> -->
                    <select
                      class={`status-dropdown pill-${item.status}`}
                      value={item.status}
                      onchange={(e) =>
                        changeDashboardStatus(item.id, e.target.value)}
                    >
                      {#each registryStatusOptions as opt}
                        <option value={opt.value}>{opt.label}</option>
                      {/each}
                    </select>
                  </td>

                  <!-- Column 4: Last Updates -->
                  <td>
                    <div class="date-cell">
                      <span class="date-main"
                        >{formatDateDisplay(item.updated_at)}</span
                      >
                      <span class="date-sub"
                        >Rev: {item.updated_at
                          ? item.updated_at.slice(0, 10)
                          : "-"}</span
                      >
                    </div>
                  </td>

                  <!-- Column Action -->
                  <td class="action-col">
                    <div class="row-actions">
                      <button
                        class="icon-btn tooltip-btn color-sop"
                        data-tooltip="Lihat SOP"
                        aria-label="SOP"
                        onclick={(e) => {
                          e.preventDefault();
                          selectedSopItem = item;
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="15"
                          height="15"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          ><path
                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                          /><polyline points="14 2 14 8 20 8" /><line
                            x1="16"
                            y1="13"
                            x2="8"
                            y2="13"
                          /><line x1="16" y1="17" x2="8" y2="17" /><polyline
                            points="10 9 9 9 8 9"
                          /></svg
                        >
                      </button>
                      <button
                        class="icon-btn tooltip-btn color-view"
                        data-tooltip="Lihat Detail"
                        aria-label="View Detail"
                        onclick={(e) => {
                          e.preventDefault();
                          selectedDetail = item;
                          rememberDetailId(item.id);
                          detailActiveTab = "overview";
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          ><path
                            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                          /><circle cx="12" cy="12" r="3" /></svg
                        >
                      </button>
                      <button
                        class="icon-btn tooltip-btn color-edit"
                        data-tooltip="Edit Data"
                        aria-label="Edit"
                        onclick={(e) => {
                          e.preventDefault();
                          selectedDetail = item;
                          rememberDetailId(item.id);
                          detailActiveTab = "overview";
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          ><path
                            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                          /><path
                            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                          /></svg
                        >
                      </button>
                      <button
                        class="icon-btn tooltip-btn danger"
                        data-tooltip="Hapus Data"
                        aria-label="Delete"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          ><polyline points="3 6 5 6 21 6" /><path
                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                          /><line x1="10" y1="11" x2="10" y2="17" /><line
                            x1="14"
                            y1="11"
                            x2="14"
                            y2="17"
                          /></svg
                        >
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- PAGINATION BAR -->
        <div class="pagination-bar">
          <div class="pagination-info">
            Menampilkan <strong>{showingStart}–{showingEnd}</strong> dari
            <strong>{totalItems}</strong> data
          </div>
          <div class="pagination-controls">
            <div class="per-page">
              <span>Tampil:</span>
              <select
                bind:value={itemsPerPage}
                onchange={() => {
                  currentPage = 1;
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div class="page-buttons">
              <button
                disabled={currentPage === 1}
                onclick={() => (currentPage -= 1)}
                class="page-nav"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"><polyline points="15 18 9 12 15 6" /></svg
                >
              </button>

              <div class="page-numbers">
                {#each Array.from({ length: totalPages }) as _, i}
                  {#if Math.abs(currentPage - (i + 1)) <= 1 || i === 0 || i === totalPages - 1}
                    <button
                      class="page-num"
                      class:active={currentPage === i + 1}
                      onclick={() => (currentPage = i + 1)}
                    >
                      {i + 1}
                    </button>
                  {:else if Math.abs(currentPage - (i + 1)) === 2}
                    <span class="page-dots">...</span>
                  {/if}
                {/each}
              </div>

              <button
                disabled={currentPage === totalPages}
                onclick={() => (currentPage += 1)}
                class="page-nav"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"><polyline points="9 18 15 12 9 6" /></svg
                >
              </button>
            </div>
          </div>
        </div>
        <!-- END PAGINATION -->
      {/if}
    </GlassPanel>
  {:else}
    <RegistryDetailPanel bind:selectedDetail bind:detailActiveTab bind:selectedSopItem />
  {/if}
</section>

<RegistrySopModal bind:selectedSopItem />

<RegistryCreateModal bind:createOpen {pmOptions} {userOptions} />
