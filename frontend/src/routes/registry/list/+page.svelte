<script>
  import GlassPanel from '$lib/GlassPanel.svelte';
  import SubmenuHeader from '$lib/SubmenuHeader.svelte';
  import {
    listDashboards,
    registryStatusOptions,
    criticalityLabel,
    sortOptions,
    rememberDetailId,
    changeDashboardStatus,
  } from '$lib/registryStore.svelte.js';
  import { requirementStatusSummary, requirementStore } from '$lib/requirementStore.svelte.js';
  import { canCreateDashboard, listModuleTasks, taskModuleStore } from '$lib/taskModuleStore.svelte.js';
  import { listUsers } from '$lib/accessStore.svelte.js';
  import { portal } from '$lib/portal.js';
  import RegistrySopModal from '$lib/pages/registry/RegistrySopModal.svelte';
  import RegistryCreateModal from '$lib/pages/registry/RegistryCreateModal.svelte';
  import RegistryDetailPanel from '$lib/pages/registry/RegistryDetailPanel.svelte';
  import "$lib/pages/registry/registry.css";

  let status = $state("");
  let dashboard = $state("");
  let q = $state("");
  let sort = $state("updated_desc");

  let selectedSopItem = $state(null);
  let selectedDetail = $state(null);
  let detailActiveTab = $state("overview");

  const applied = $derived({ status, dashboard, q: q.trim(), sort });

  $effect(() => {
    const handleReset = () => {
      selectedDetail = null;
    };
    window.addEventListener("reset-registry", handleReset);
    return () => window.removeEventListener("reset-registry", handleReset);
  });

  $effect(() => {
    document.documentElement.classList.toggle("registry-detail-lock", !!selectedDetail);
    return () => document.documentElement.classList.remove("registry-detail-lock");
  });

  const items = $derived(listDashboards(applied));

  const progressById = $derived.by(() => {
    void requirementStore.items;
    void taskModuleStore.items;
    /** @type {Record<string, { totalReq: number, pct: number, totalTask: number }>} */
    const map = {};
    for (const item of items) {
      const summary = requirementStatusSummary(item.name);
      const totalReq = summary.reduce((sum, row) => sum + row.count, 0);
      const done = summary.find((row) => row.value === 'done')?.count ?? 0;
      map[item.id] = {
        totalReq,
        pct: totalReq ? Math.round((done / totalReq) * 100) : 0,
        totalTask: listModuleTasks({ dashboard: item.name }).length,
      };
    }
    return map;
  });

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

  const unitCount = $derived(new Set(allDashboards.map((d) => d.category).filter(Boolean)).size);
  const picCount = $derived(new Set(allDashboards.map((d) => d.owner).filter(Boolean)).size);
  const activePct = $derived(allItemsCount ? Math.round((prodCount / allItemsCount) * 100) : 0);
  const reqKpi = $derived.by(() => {
    void requirementStore.items;
    const summary = requirementStatusSummary();
    const total = summary.reduce((sum, row) => sum + row.count, 0);
    const done = summary.find((row) => row.value === 'done')?.count ?? 0;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  });
  const highPriorityCount = $derived(allDashboards.filter((d) => d.criticality === 'high').length);
  const registryMetrics = $derived([
    {
      label: 'Status Active',
      value: String(prodCount),
      note: `${activePct}% of ${allItemsCount} dashboard`,
      icon: 'active',
      tone: 'mint',
      filter: 'active',
    },
    {
      label: 'Status Idle',
      value: String(devCount),
      note: devCount ? 'inactive · click to filter' : 'all dashboards are active',
      icon: 'idle',
      tone: 'lavender',
      filter: 'idle',
    },
    {
      label: 'Requirement',
      value: String(reqKpi.total),
      note: `${reqKpi.done} selesai · ${reqKpi.pct}% progress`,
      icon: 'req',
      tone: 'sky',
      filter: '',
    },
    {
      label: 'Prioritas Tinggi',
      value: String(highPriorityCount),
      note: highPriorityCount ? 'dashboards need attention' : 'all clear',
      icon: 'priority',
      tone: highPriorityCount ? 'rose' : 'sand',
      filter: '',
    },
    {
      label: 'Units Involved',
      value: String(unitCount),
      note: `${picCount} PICs in charge`,
      icon: 'unit',
      tone: 'peach',
      filter: '',
    },
  ]);

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
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  $effect(() => {
    void applied;
    currentPage = 1;
  });

  let createOpen = $state(false);

  const canAdd = $derived(canCreateDashboard());
  const pmOptions = $derived(listUsers({ status: "active" }));
  function openCreate() {
    createOpen = true;
  }

  /** @param {{ id: string }} item */
  function openDashboard(item) {
    selectedDetail = item;
    rememberDetailId(item.id);
    detailActiveTab = "overview";
  }

</script>

<section class="page registry-page" class:detail={!!selectedDetail}>
  {#if !selectedDetail}
    <GlassPanel class="header-panel">
      <SubmenuHeader
        eyebrow="Workspaces"
        title="Dashboard List"
        sub="Dashboard status, SOP documents, PIC, and the latest update."
        meta={`${items.length} of ${allItemsCount} dashboards`}
      >
        {#snippet actions()}
          {#if canAdd}
            <button type="button" class="btn-primary" onclick={openCreate}
              >+ Add Dashboard</button
            >
          {/if}
        {/snippet}
      </SubmenuHeader>

      <div class="reg-metrics-rail">
        <div class="reg-metrics">
          {#each registryMetrics as m (m.label)}
            <div class="reg-metric-shell">
              <button
                type="button"
                class="reg-metric-card {m.tone}"
                class:active={m.filter && status === m.filter}
                disabled={!m.filter}
                onclick={() => m.filter && (status = status === m.filter ? '' : m.filter)}
              >
                <span class="reg-metric-label">{m.label}</span>
                <span class="reg-metric-mid">
                  <strong class="reg-metric-value">{m.value}</strong>
                  <span class="reg-metric-icon" aria-hidden="true">
                    {#if m.icon === 'active'}
                      <svg viewBox="0 0 24 24" fill="none"><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
                    {:else if m.icon === 'idle'}
                      <svg viewBox="0 0 24 24" fill="none"><path d="M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Z" stroke="currentColor" stroke-width="1.7"/><path d="M10 9.5v5M14 9.5v5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                    {:else if m.icon === 'req'}
                      <svg viewBox="0 0 24 24" fill="none"><path d="M14 4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8l-4-4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 4v4h4M9.5 13h5M9.5 16.5h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                    {:else if m.icon === 'priority'}
                      <svg viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 16.2h.01M10.4 4.8 3.6 17a1.8 1.8 0 0 0 1.6 2.7h13.6a1.8 1.8 0 0 0 1.6-2.7L13.6 4.8a1.8 1.8 0 0 0-3.2 0Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    {:else}
                      <svg viewBox="0 0 24 24" fill="none"><path d="M4.5 19.5v-10l7.5-5 7.5 5v10M9.5 19.5v-5h5v5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    {/if}
                  </span>
                </span>
                <small class="reg-metric-note">{m.note}</small>
              </button>
            </div>
          {/each}
        </div>
      </div>

      <form class="filters" onsubmit={(event) => event.preventDefault()}>
        <label class="grow">
          <span>Search</span>
          <div class="search">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7" />
              <path d="m16.5 16.5 3.2 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            </svg>
            <input type="search" placeholder="Name, code, SOP, PIC, platform…" bind:value={q} />
          </div>
        </label>

        <label>
          <span>Status</span>
          <select id="status-select" bind:value={status}>
            <option value="">All</option>
            {#each registryStatusOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </label>

        <label>
          <span>Sort</span>
          <select id="sort-select" bind:value={sort}>
            {#each sortOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </label>

      </form>
    </GlassPanel>

    <GlassPanel class="fill table-panel">
      {#if items.length === 0}
        <div class="empty-state">
          <p>No dashboards match your search.</p>
        </div>
      {:else}
        <div class="redesign-table-wrap">
          <table class="redesign-table">
            <thead>
              <tr>
                <th>Dashboard</th>
                <th>PIC</th>
                <th>Total Requirement</th>
                <th>Total Task</th>
                <th>Status</th>
                <th>Last Update</th>
                <th>Progress Requirement</th>
                <th>Work Priority</th>
              </tr>
            </thead>
            <tbody>
              {#each paginatedItems as item (item.id)}
                <tr class="dash-row" onclick={() => openDashboard(item)}>
                  <!-- Column 1: Dashboard Info -->
                  <td>
                    <div class="dashboard-cell">
                      <div class="avatar-badge">{item.code || "DB"}</div>
                      <div class="dashboard-info">
                        <div class="name-wrap">
                          <span class="dash-name">{item.name}</span>
                        </div>
                        <span class="dash-meta">{item.platform} · {item.category}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div class="pic-cell">
                      <div class="pic-avatar">{getInitial(item.owner)}</div>
                      <span class="pic-name">{item.owner}</span>
                    </div>
                  </td>

                  <td class="count-cell">{progressById[item.id]?.totalReq ?? 0}</td>
                  <td class="count-cell">{progressById[item.id]?.totalTask ?? 0}</td>

                  <!-- Status -->
                  <td>
                    <!-- <span class={`status-pill pill-${item.status}`}>
                    <span class="dot"></span>
                    {registryStatusLabel(item.status)}
                  </span> -->
                    <select
                      class={`status-dropdown pill-${item.status}`}
                      value={item.status}
                      onclick={(e) => e.stopPropagation()}
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
                      <span class="date-sub">Rev. {item.updated_at ? item.updated_at.slice(0, 10) : "-"}</span>
                    </div>
                  </td>

                  <td>
                    <div class="req-progress" title="{progressById[item.id]?.pct ?? 0}% of requirements done">
                      <div class="req-progress-track" aria-hidden="true">
                        <span class="req-progress-fill" style="width: {progressById[item.id]?.pct ?? 0}%"></span>
                      </div>
                      <span class="req-progress-pct">{progressById[item.id]?.pct ?? 0}%</span>
                    </div>
                  </td>

                  <td>
                    <span class="crit-badge crit-{item.criticality || 'low'}">{criticalityLabel(item.criticality) || '—'}</span>
                  </td>

                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- PAGINATION BAR -->
        <div class="pagination-bar">
          <div class="pagination-info">
            Showing <strong>{showingStart}–{showingEnd}</strong> of
            <strong>{totalItems}</strong>
          </div>
          <div class="pagination-controls">
            <div class="per-page">
              <span>Show:</span>
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

<RegistryCreateModal bind:createOpen {pmOptions} />
