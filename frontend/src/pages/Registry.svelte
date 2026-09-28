<script>
  import { link } from 'svelte-spa-router'
  import GlassPanel from '../lib/GlassPanel.svelte'
  import AttachmentPanel from '../lib/AttachmentPanel.svelte'
  import SubmenuHeader from '../lib/SubmenuHeader.svelte'
  import {
    listDashboards,
    registryStatusLabel,
    registryStatusOptions,
    dashboardFilterOptions,
    sortOptions,
    rememberDetailId,
    changeDashboardStatus,
    createDashboard,
  } from '../lib/registryStore.svelte.js'
  import { canCreateDashboard, currentUserName } from '../lib/taskModuleStore.svelte.js'
  import { listUsers } from '../lib/accessStore.svelte.js'
  import { portal } from '../lib/portal.js'
  import { formatDate } from '../lib/format.js'

  let status = $state('')
  let dashboard = $state('')
  let q = $state('')
  let sort = $state('updated_desc')
  
  let expandedRows = $state(new Set())
  let selectedSopItem = $state(null)
  let selectedDetail = $state(null)

  let applied = $state({
    status: '',
    dashboard: '',
    q: '',
    sort: 'updated_desc',
  })

  const items = $derived(listDashboards(applied))

  const allDashboards = $derived(listDashboards())
  const allItemsCount = $derived(allDashboards.length)
  const activeCount = $derived(allDashboards.filter((d) => d.status === 'active').length)
  const idleCount = $derived(allDashboards.filter((d) => d.status === 'idle').length)

  function getInitial(name = '') {
    if (!name) return '?'
    return name.trim().charAt(0).toUpperCase()
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return '-'
    const d = new Date(dateStr.replace(' ', 'T'))
    if (isNaN(d.getTime())) return dateStr
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  function onSubmit(event) {
    event.preventDefault()
    applied = { status, dashboard, q, sort }
  }

  let createOpen = $state(false)
  let formName = $state('')
  let formPlatform = $state('')
  let formDescription = $state('')
  let formPm = $state('')
  let formUser = $state('')
  let formError = $state('')

  const canAdd = $derived(canCreateDashboard())
  const pmOptions = $derived(listUsers({ role: 3, status: 'active' }))
  const userOptions = $derived(listUsers({ status: 'active' }))

  function openCreate() {
    formName = ''
    formPlatform = ''
    formDescription = ''
    formPm = ''
    formUser = ''
    formError = ''
    createOpen = true
  }

  function closeCreate() {
    createOpen = false
  }

  function onCreate(event) {
    event.preventDefault()
    const name = formName.trim()
    const pm = formPm.trim()
    if (!name || !pm) {
      formError = 'Nama dashboard dan PM wajib diisi.'
      return
    }
    const deploy = formPlatform.trim()
    const userName = formUser.trim()
    const created = createDashboard({
      name,
      description: formDescription.trim(),
      pm,
      owner: userName || currentUserName(),
      url: deploy,
      platform: deploy || 'Custom',
      actor: currentUserName(),
    })
    if (!created) {
      formError = 'Dashboard dengan nama itu sudah ada.'
      return
    }
    createOpen = false
  }

  function downloadSopPdf() {
    if (!selectedSopItem) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>SOP - ${selectedSopItem.name}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
            h3 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            h4 { color: #0f172a; margin-top: 20px; }
            .meta { margin-bottom: 20px; }
            .meta p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h3>SOP - ${selectedSopItem.name}</h3>
          <div class="meta">
            <p><strong>Platform:</strong> ${selectedSopItem.platform}</p>
            <p><strong>Kategori:</strong> ${selectedSopItem.category}</p>
            <p><strong>Owner (PIC):</strong> ${selectedSopItem.owner}</p>
          </div>
          <h4>Prosedur Operasional Standar (SOP)</h4>
          <p>Deskripsi sistem: <em>${selectedSopItem.description}</em></p>
          <ol>
            <li>Akses dashboard melalui platform <strong>${selectedSopItem.platform}</strong> menggunakan kredensial yang berwenang.</li>
            <li>Lakukan verifikasi data harian/berkala sesuai jadwal sistem.</li>
            <li>Jika terdapat masalah atau anomali data, segera eskalasikan kepada <strong>${selectedSopItem.owner}</strong>.</li>
            <li>Pastikan untuk mereview dashboard ini kembali jika ada perubahan dari status <strong>${selectedSopItem.status}</strong>.</li>
            <li>Dokumentasikan setiap perubahan konfigurasi pada log aktivitas.</li>
          </ol>
          <script>
            window.onload = () => { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  /** @param {string} name */
  function initials(name) {
    return (name || '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }
</script>

{#if false}
<!-- KODE LAMA DI-COMMENT AGAR TIDAK DOUBLE -->
<section class="page">
  <GlassPanel>
    <SubmenuHeader
      eyebrow="Dashboard Registry"
      title="Daftar Dashboard"
      sub="SOP All Dashboard — katalog status, kritikalitas, dan kepemilikan"
      meta={`${items.length} item`}
    />

    <form class="filters" onsubmit={onSubmit}>
      <label>
        Status
        <select bind:value={status}>
          <option value="">Semua</option>
          {#each registryStatusOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </label>

      <label>
        Dashboard
        <select bind:value={dashboard}>
          <option value="">Semua</option>
          {#each dashboardFilterOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </label>

      <label class="grow">
        Cari
        <input type="search" placeholder="Nama, owner, platform…" bind:value={q} />
      </label>

      <label>
        Sort
        <select bind:value={sort}>
          {#each sortOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </label>

      <button type="submit">Terapkan</button>
    </form>

    {#if items.length === 0}
      <p class="state">Tidak ada dashboard yang cocok.</p>
    {:else}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Dashboard</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Platform</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {#each items as item (item.id)}
              <tr>
                <td class="mono">{item.id}</td>
                <td>
                  <a href={`/registry/${item.id}`} use:link onclick={() => rememberDetailId(item.id)}>
                    <strong>{item.name}</strong>
                    <span class="code">{item.code}</span>
                  </a>
                </td>
                <td>
                  <span class={`badge status-${item.status}`}>{registryStatusLabel(item.status)}</span>
                </td>
                <td>{item.owner}</td>
                <td>{item.platform}</td>
                <td>{formatDate(item.updated_at)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </GlassPanel>
</section>

<!-- ================================================================= -->
<!-- DESAIN BARU (REDSIGN DAFTAR DASHBOARD) - DIKERJAKAN DI BAWAHNYA -->
<!-- ================================================================= -->
<div class="redesign-separator">
  <span>Desain Baru — Dashboard Registry</span>
</div>
{/if}

<section class="page" class:detail={!!selectedDetail}>
{#if !selectedDetail}
  <GlassPanel>
  <SubmenuHeader
    eyebrow="Dashboard Registry"
    title="Daftar Dashboard"
    sub="Katalog status dashboard, dokumen SOP, PIC, dan pembaruan terakhir."
    meta={`${items.length} dari ${allItemsCount} dashboard`}
  >
    {#snippet actions()}
      {#if canAdd}
        <button type="button" class="btn-primary" onclick={openCreate}>+ Tambah Dashboard</button>
      {/if}
    {/snippet}
  </SubmenuHeader>

  <!-- Summary Cards Grid -->
  <div class="stats-grid">
    <!-- Card 1 -->
    <div class="stat-card">
      <div class="stat-top">
        <span class="stat-title">Total Dashboard</span>
        <div class="icon-wrapper blue-solid-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        </div>
      </div>
      <div class="stat-bottom">
        <div class="stat-value">{allItemsCount}</div>
        <div class="stat-sub">{allItemsCount} sumber · terdaftar</div>
      </div>
    </div>

    <!-- Card 2 -->
    <div class="stat-card">
      <div class="stat-top">
        <span class="stat-title">Status Active</span>
        <div class="icon-wrapper green-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
      </div>
      <div class="stat-bottom">
        <div class="stat-value">{activeCount}</div>
        <div class="stat-sub">berjalan normal · online</div>
      </div>
    </div>

    <!-- Card 3 Lama (Dokumen SOP) - di-hide -->
    <!--
    <div class="stat-card">
      <div class="stat-top">
        <span class="stat-title">Dokumen SOP</span>
        <div class="icon-wrapper purple-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
      </div>
      <div class="stat-bottom">
        <div class="stat-value">{allItemsCount}</div>
        <div class="stat-sub link-sub">Buka SOP Master Aplikasi →</div>
      </div>
    </div>
    -->

    <!-- Card 3 Baru (Status Idle) -->
    <div class="stat-card">
      <div class="stat-top">
        <span class="stat-title">Status Idle</span>
        <div class="icon-wrapper purple-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
      </div>
      <div class="stat-bottom">
        <div class="stat-value">{idleCount}</div>
        <div class="stat-sub">tidak aktif</div>
      </div>
    </div>
  </div>

  <!-- Filter & Search Bar -->
  <form class="redesign-filters" onsubmit={onSubmit}>
    <div class="filter-field grow-field">
      <div class="input-with-icon">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input id="search-input" type="search" placeholder="Cari nama dashboard, kode SOP, PIC, platform..." bind:value={q} />
      </div>
    </div>

    <div class="filter-field">
      <label for="status-select">Status Dashboard</label>
      <select id="status-select" bind:value={status}>
        <option value="">Semua Status</option>
        {#each registryStatusOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>

    <div class="filter-field">
      <label for="sort-select">Urutan</label>
      <select id="sort-select" bind:value={sort}>
        {#each sortOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>

    <button type="submit" class="apply-btn">Terapkan</button>
  </form>
  </GlassPanel>

  <GlassPanel class="fill table-panel">
  <div class="redesign-table-card">
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
              <th>SOP</th>
              <th>PIC</th>
              <th>STATUS DASHBOARD</th>
              <th>LAST UPDATES</th>
            </tr>
          </thead>
          <tbody>
            {#each items as item (item.id)}
              <tr>
                <!-- Column 1: Dashboard Info -->
                <td>
                  <div class="dashboard-cell">
                    <div class="avatar-badge">{item.code || 'DB'}</div>
                    <div class="dashboard-info">
                      <a href="#" onclick={(e) => { e.preventDefault(); selectedDetail = item; rememberDetailId(item.id); }} class="dash-name">
                        {item.name}
                      </a>
                      <span class="dash-meta">{item.platform} • {item.category}</span>
                    </div>
                  </div>
                </td>

                <!-- Column SOP -->
                <td>
                  <button class="sop-btn" onclick={() => (selectedSopItem = item)}>
                    Lihat SOP
                  </button>
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
                    onchange={(e) => changeDashboardStatus(item.id, e.target.value)}
                  >
                    {#each registryStatusOptions as opt}
                      <option value={opt.value}>{opt.label}</option>
                    {/each}
                  </select>
                </td>

                <!-- Column 4: Last Updates -->
                <td>
                  <div class="date-cell">
                    <span class="date-main">{formatDateDisplay(item.updated_at)}</span>
                    <span class="date-sub">Rev: {item.updated_at ? item.updated_at.slice(0, 10) : '-'}</span>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
  </GlassPanel>
{:else}
  <GlassPanel class="detail-panel">
    <div class="dash-hero">
      <div class="hero-nav">
        <div class="action-pills" aria-label="Navigasi">
          <button type="button" class="pill on" onclick={() => (selectedDetail = null)} aria-label="Kembali ke daftar" title="Kembali ke daftar">←</button>
        </div>
        <div class="hero-side">
          <div class="action-pills" aria-label="File Panduan">
            <AttachmentPanel ownerType="dashboard" ownerId={selectedDetail.id} />
          </div>
          <div class="action-pills" aria-label="Aksi">
            <button type="button" class="pill" onclick={() => (selectedSopItem = selectedDetail)}>Lihat SOP</button>
          </div>
        </div>
      </div>

      <div class="hero-main">
        <p class="eyebrow">Dashboard Registry</p>
        <div class="chip-row">
          <span class="mono-id">#{selectedDetail.id}</span>
          <span class={`badge status-${selectedDetail.status}`}>{registryStatusLabel(selectedDetail.status)}</span>
        </div>
        <h2>{selectedDetail.name}</h2>
        <p class="lead">{selectedDetail.description || `${selectedDetail.platform} · ${selectedDetail.category}`}</p>
      </div>

      <div class="hero-body">
        <div class="identity">
          <div class="owner-card">
            <i class="face">{initials(selectedDetail.owner)}</i>
            <div>
              <span class="k">PIC</span>
              <strong>{selectedDetail.owner}</strong>
            </div>
          </div>
          <div>
            <span class="k">Platform</span>
            <strong>{selectedDetail.platform}</strong>
          </div>
          <div>
            <span class="k">Dibuat</span>
            <strong>{formatDateDisplay(selectedDetail.created_at)}</strong>
          </div>
        </div>

        <div class="facts">
          <div class="fact"><span class="k">Code</span><strong>{selectedDetail.code}</strong></div>
          <div class="fact"><span class="k">Category</span><strong>{selectedDetail.category}</strong></div>
          <div class="fact"><span class="k">Version</span><strong>{selectedDetail.version}</strong></div>
          <div class="fact"><span class="k">URL</span><strong>{selectedDetail.url || '—'}</strong></div>
          <div class="fact"><span class="k">Framework</span><strong>{selectedDetail.metadata?.framework || 'CodeIgniter'}</strong></div>
          <div class="fact"><span class="k">Backend</span><strong>{selectedDetail.metadata?.backend || 'PHP'}</strong></div>
          <div class="fact"><span class="k">Versi Framework</span><strong>{selectedDetail.metadata?.ci_version || '4.x'}</strong></div>
          <div class="fact"><span class="k">Versi Backend</span><strong>{selectedDetail.metadata?.php_version || '8.2'}</strong></div>
          <div class="fact"><span class="k">Frontend</span><strong>{selectedDetail.metadata?.frontend || 'Svelte'}</strong></div>
          <div class="fact"><span class="k">Last Update</span><strong>{formatDateDisplay(selectedDetail.updated_at)}</strong></div>
        </div>
      </div>

      <div class="dash-stats" role="group" aria-label="Ringkasan dashboard">
        <div class="stat">
          <span>Requirement</span>
          <strong>{selectedDetail.quick_stats?.requirements_total || 0}</strong>
        </div>
        <div class="stat">
          <span>Task</span>
          <strong>{selectedDetail.quick_stats?.tasks_total || selectedDetail.tasks?.length || 0}</strong>
        </div>
        <div class="stat">
          <span>Task Done</span>
          <strong>{selectedDetail.quick_stats?.tasks_done || 0}</strong>
        </div>
        <div class="stat">
          <span>Last Update</span>
          <strong class="date">{formatDateDisplay(selectedDetail.updated_at)}</strong>
        </div>
      </div>

    </div>
  </GlassPanel>
{/if}
</section>

{#if selectedSopItem}
  <div class="sop-modal-backdrop" onclick={() => (selectedSopItem = null)}>
    <div class="sop-modal-content" onclick={(e) => e.stopPropagation()}>
      <div class="sop-modal-header">
        <h3>SOP - {selectedSopItem.name}</h3>
        <button class="close-btn" onclick={() => (selectedSopItem = null)}>×</button>
      </div>
      <div class="sop-modal-body">
        <p><strong>Platform:</strong> {selectedSopItem.platform}</p>
        <p><strong>Kategori:</strong> {selectedSopItem.category}</p>
        <p><strong>Owner (PIC):</strong> {selectedSopItem.owner}</p>
        <hr class="sop-divider" />
        <h4>Prosedur Operasional Standar (SOP)</h4>
        <p>Deskripsi sistem: <em>{selectedSopItem.description}</em></p>
        <ol class="sop-list">
           <li>Akses dashboard melalui platform <strong>{selectedSopItem.platform}</strong> menggunakan kredensial yang berwenang.</li>
           <li>Lakukan verifikasi data harian/berkala sesuai jadwal sistem.</li>
           <li>Jika terdapat masalah atau anomali data, segera eskalasikan kepada <strong>{selectedSopItem.owner}</strong>.</li>
           <li>Pastikan untuk mereview dashboard ini kembali jika ada perubahan dari status <strong>{selectedSopItem.status}</strong>.</li>
           <li>Dokumentasikan setiap perubahan konfigurasi pada log aktivitas.</li>
        </ol>
      </div>
      <div class="sop-modal-footer" style="gap: 10px;">
        <button class="sop-btn download-btn" onclick={downloadSopPdf}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download PDF
        </button>
        <!-- <button class="sop-btn" onclick={() => (selectedSopItem = null)}>Tutup SOP</button> -->
        <button class="sop-btn" onclick={() => (selectedSopItem = null)}>Tutup SOP</button>
      </div>
    </div>
  </div>
{/if}

{#if createOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="dash-backdrop" use:portal role="presentation" onclick={closeCreate} onkeydown={(e) => e.key === 'Escape' && closeCreate()}></div>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="dash-modal"
    use:portal
    role="dialog"
    aria-modal="true"
    aria-labelledby="add-dashboard-title"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === 'Escape' && closeCreate()}
    onsubmit={onCreate}
  >
    <header class="dash-modal-head">
      <div>
        <h2 id="add-dashboard-title">Tambah Dashboard</h2>
        <p>Isi detail dashboard yang akan ditambahkan</p>
      </div>
      <button type="button" class="dash-close" aria-label="Tutup" onclick={closeCreate}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
    </header>

    <div class="dash-modal-body">
      <label>
        Nama Dashboard
        <input bind:value={formName} maxlength="80" placeholder="Contoh: Operation Dashboard" />
      </label>
      <label>
        Platform (Tujuan Deploy)
        <input bind:value={formPlatform} maxlength="200" placeholder="Contoh: https://dash.example.com" />
      </label>
      <label>
        Deskripsi Dashboard (Freetext)
        <textarea rows="4" maxlength="600" bind:value={formDescription} placeholder="Deskripsikan fungsi dashboard ini..."></textarea>
      </label>
      <label>
        PM (Filter Project Manager)
        <select bind:value={formPm}>
          <option value="">Pilih PM...</option>
          {#each pmOptions as user (user.id)}
            <option value={user.name}>{user.name}</option>
          {/each}
        </select>
      </label>
      <label>
        User
        <input bind:value={formUser} maxlength="80" list="dashboard-user-options" placeholder="Masukkan nama user..." />
        <datalist id="dashboard-user-options">
          {#each userOptions as user (user.id)}
            <option value={user.name}></option>
          {/each}
        </datalist>
      </label>
      {#if formError}
        <p class="dash-error">{formError}</p>
      {/if}
    </div>

    <footer class="dash-modal-foot">
      <button type="button" class="dash-cancel" onclick={closeCreate}>Batal</button>
      <button type="submit" class="dash-save">Simpan Dashboard</button>
    </footer>
  </form>
{/if}

<style>
  .page {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  .page.detail {
    overflow: hidden;
  }

  .page.detail :global(.panel-glow.detail-panel) {
    flex: 1;
    width: 100%;
    min-height: 0;
    align-self: stretch;
  }

  .page.detail :global(.panel-glow.detail-panel .panel),
  .page.detail :global(.panel-glow.detail-panel .panel-card) {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .page.detail :global(.panel-glow.detail-panel .panel-card) {
    overflow: auto;
  }

  .dash-hero {
    display: grid;
    align-content: start;
    gap: 0.85rem;
  }

  .hero-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .hero-side {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
  }

  .action-pills {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0;
    flex-wrap: nowrap;
    padding: 3px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  }

  .action-pills :global(.pill) {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 34px;
    height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: #1a1a1a;
    font: inherit;
    font-size: 0.65rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  }

  .action-pills :global(.pill:hover) {
    color: #000;
  }

  .action-pills :global(.pill.on) {
    color: #fff;
    background: #1a1a1a;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
  }

  .action-pills :global(.pill.on:hover) {
    color: #fff;
    background: #111;
  }

  .hero-main {
    display: grid;
    gap: 0.35rem;
    min-width: 0;
  }

  .eyebrow {
    margin: 0;
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #8a8a90;
  }

  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }

  .mono-id {
    font-size: 0.58rem;
    font-weight: 750;
    color: #6b6b6b;
    font-variant-numeric: tabular-nums;
  }

  .dash-hero h2 {
    margin: 0;
    font-size: 0.96rem;
    font-weight: 760;
    letter-spacing: -0.03em;
    line-height: 1.2;
    color: #1a1a1a;
  }

  .lead {
    margin: 0;
    color: #6b6b6b;
    font-size: 0.68rem;
    font-weight: 500;
    line-height: 1.5;
    max-width: 68ch;
  }

  .hero-body {
    display: grid;
    grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
    align-items: stretch;
    border: 1px solid rgba(15, 27, 46, 0.08);
    border-radius: 16px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(247, 251, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 55%);
  }

  .identity {
    display: grid;
    gap: 0.85rem;
    align-content: start;
    padding: 0.9rem 1rem;
    border-right: 1px solid rgba(15, 27, 46, 0.07);
  }

  .owner-card {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .k {
    display: block;
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8a8a90;
    margin-bottom: 0.15rem;
  }

  .identity strong,
  .fact strong {
    font-size: 0.68rem;
    font-weight: 750;
    color: #0f1b2e;
    line-height: 1.3;
    word-break: break-word;
  }

  .face {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 0.56rem;
    font-style: normal;
    font-weight: 750;
    background: linear-gradient(145deg, #e8f1fb 0%, #d7e6f7 100%);
    color: #065fc6;
    flex-shrink: 0;
  }

  .facts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-content: start;
  }

  .fact {
    display: grid;
    gap: 0.15rem;
    padding: 0.7rem 0.9rem;
    border-bottom: 1px solid rgba(15, 27, 46, 0.06);
    border-right: 1px solid rgba(15, 27, 46, 0.06);
    min-width: 0;
  }

  .fact:nth-child(2n) {
    border-right: 0;
  }

  .facts > .fact:nth-last-child(-n + 2) {
    border-bottom: 0;
  }

  .dash-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(6, 95, 198, 0.14);
    background: linear-gradient(160deg, #f7fbff 0%, #eef5fc 100%);
  }

  .dash-stats .stat {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.65rem 0.85rem;
    border-right: 1px solid rgba(6, 95, 198, 0.1);
  }

  .dash-stats .stat:last-child {
    border-right: 0;
  }

  .dash-stats .stat span {
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(42, 80, 128, 0.7);
  }

  .dash-stats .stat strong {
    font-size: 0.92rem;
    font-weight: 760;
    letter-spacing: -0.03em;
    color: #0f1b2e;
    line-height: 1.15;
  }

  .dash-stats .stat strong.date {
    font-size: 0.72rem;
    letter-spacing: 0;
  }

  @media (max-width: 900px) {
    .hero-body,
    .facts,
    .dash-stats {
      grid-template-columns: 1fr;
    }

    .identity {
      border-right: 0;
      border-bottom: 1px solid rgba(15, 27, 46, 0.07);
    }

    .fact,
    .fact:nth-child(2n),
    .dash-stats .stat,
    .dash-stats .stat:last-child {
      border-right: 0;
    }
  }

  :global(.table-panel) {
    flex: 1;
    min-height: 0;
  }

  .redesign-container {
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: auto;
    padding-bottom: 1.5rem;
    padding-top: 1rem;
    flex: 1;
    min-width: 0;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: end;
    margin: 1rem 0;
  }

  label {
    display: grid;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: var(--muted, #64748b);
  }

  label.grow {
    flex: 1;
    min-width: 180px;
  }

  select,
  input,
  button {
    height: 2.4rem;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 8px;
    padding: 0 0.75rem;
    background: var(--surface, #fff);
    color: #0f172a; /* Fix dropdown text visibility */
  }

  select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 0.65em auto;
    padding-right: 2rem !important;
    cursor: pointer;
    min-width: 140px;
    color: #0f172a !important;
    background-color: #ffffff !important;
  }
  
  select option {
    color: #0f172a;
    background: #ffffff;
  }

  button {
    background: var(--accent, #1a1a1a);
    color: white;
    border-color: var(--accent, #1a1a1a);
    cursor: pointer;
  }

  .table-wrap {
    overflow: auto;
    background: var(--surface, #fff);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius, 12px);
    box-shadow: var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.06));
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    text-align: left;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid var(--border, #e2e8f0);
    vertical-align: top;
  }

  th {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--muted, #64748b);
    background: #f8fafc;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  a {
    color: var(--accent, #1a1a1a);
    display: grid;
    gap: 0.15rem;
  }

  a strong {
    font-weight: 600;
  }

  .code {
    font-size: 0.78rem;
    color: var(--muted, #64748b);
    font-weight: 500;
  }

  .mono {
    color: var(--muted, #64748b);
  }

  .badge {
    display: inline-block;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    font-size: 0.58rem;
    font-weight: 600;
  }

  .status-active {
    background: #dcfce7;
    color: #166534;
  }

  .status-draft {
    background: #e2e8f0;
    color: #475569;
  }

  .status-maintenance {
    background: #fef3c7;
    color: #92400e;
  }

  .status-retired {
    background: #fee2e2;
    color: #991b1b;
  }

  .status-idle {
    background: #f1f5f9;
    color: #475569;
  }

  .crit-high {
    background: #fee2e2;
    color: #991b1b;
  }

  .crit-medium {
    background: #ffedd5;
    color: #9a3412;
  }

  .crit-low {
    background: #e0e7ff;
    color: #3730a3;
  }

  .state {
    padding: 1rem;
    background: var(--surface, #fff);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius, 12px);
  }

  /* ========================================= */
  /* STYLES DESAIN BARU (REDESIGN DAFTAR DASHBOARD) */
  /* ========================================= */

  .redesign-separator {
    margin: 3rem 0 1.5rem 0;
    text-align: center;
    border-bottom: 2px dashed #cbd5e1;
    line-height: 0.1em;
  }

  .redesign-separator span {
    background: #f8fafc;
    padding: 0 1rem;
    color: #0f172a;
    font-weight: 700;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 14px 0 0;
  }

  .stat-card {
    border-radius: 18px;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 108px;
    position: relative;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 6px 16px rgba(4, 40, 90, 0.06);
  }

  .stat-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .stat-title {
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: rgba(18, 28, 44, 0.78);
  }

  .icon-wrapper {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .blue-solid-icon { background: rgba(230, 240, 250, 0.9); color: #2a5080; }
  .green-icon { background: #dcfce7; color: #16a34a; }
  .purple-icon { background: #f3e8ff; color: #9333ea; }
  .yellow-icon { background: #fef3c7; color: #d97706; }

  .stat-bottom {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-value {
    font-size: 1.65rem;
    font-weight: 750;
    letter-spacing: -0.04em;
    line-height: 0.95;
    color: #0b1524;
  }

  .stat-sub {
    font-size: 0.58rem;
    font-weight: 500;
    color: rgba(30, 42, 60, 0.72);
  }

  .link-sub {
    color: #94a3b8 !important;
    font-weight: 500;
  }

  .yellow-sub {
    color: #d97706 !important;
    font-weight: 600;
  }

  /* Redesign Filters */
  .redesign-filters {
    background: transparent;
    padding: 14px 0 0;
    margin-top: 14px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 10px;
  }

  .filter-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .filter-field label {
    font-size: 0.56rem;
    font-weight: 650;
    color: #6b6b6b;
  }

  .grow-field {
    flex: 1;
    min-width: 240px;
  }

  .input-with-icon {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    color: #94a3b8;
  }

  .input-with-icon input {
    width: 100%;
    padding-left: 2.25rem;
    padding-right: 0.75rem;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    font-size: 0.68rem;
    height: 2.45rem;
    background: rgba(255, 255, 255, 0.78);
    color: #1a1a1a;
  }

  .input-with-icon input:focus {
      outline: none;
      border-color: #94a3b8;
  }

  .redesign-filters select {
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    font-size: 0.68rem;
    height: 2.45rem;
    padding: 0 2rem 0 0.85rem;
    color: #1a1a1a;
    background-color: rgba(255, 255, 255, 0.78);
    min-width: 140px;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 5l3 3 3-3'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
  }
  
  .redesign-filters select:focus {
      outline: none;
      border-color: #94a3b8;
  }

  .apply-btn {
    height: 2.45rem;
    padding: 0 1.1rem;
    border-radius: 999px;
    background: #1a1a1a;
    color: #ffffff;
    font-weight: 700;
    font-size: 0.68rem;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
    align-self: flex-end;
  }

  .apply-btn:hover {
    background: #1e293b;
  }

  /* Redesign Table Card */
  .redesign-table-card {
    background: transparent;
    border-radius: 0;
    border: 0;
    overflow: auto;
    box-shadow: none;
    flex: 1;
    min-height: 0;
  }

  .redesign-table-wrap {
    overflow-x: auto;
  }

  .redesign-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .redesign-table th {
    background: transparent;
    padding: 0.7rem 0.75rem;
    font-size: 0.56rem;
    font-weight: 700;
    color: #8a8a90;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .redesign-table td {
    padding: 0.7rem 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    vertical-align: middle;
    font-size: 0.68rem;
  }

  .redesign-table tr:last-child td {
    border-bottom: none;
  }

  /* Dashboard Cell */
  .dashboard-cell {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .avatar-badge {
    width: 28px;
    height: 28px;
    background: #1e293b;
    color: #ffffff;
    font-weight: 700;
    font-size: 0.52rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.02em;
    flex-shrink: 0;
  }

  .dashboard-info {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .dash-name {
    font-size: 0.72rem;
    font-weight: 650;
    color: #0f172a;
    text-decoration: none;
  }

  .dash-name:hover {
    color: #0284c7;
  }

  .dash-meta {
    font-size: 0.58rem;
    color: #94a3b8;
  }

  /* PIC Cell */
  .pic-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pic-avatar {
    width: 22px;
    height: 22px;
    background: #3b82f6;
    color: #ffffff;
    font-weight: 600;
    font-size: 0.55rem;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pic-name {
    font-size: 0.68rem;
    font-weight: 500;
    color: #475569;
  }

  /* Status Pills */
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.58rem;
    font-weight: 600;
  }

  .status-pill .dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: currentColor;
  }

  .pill-active {
    background-color: #dcfce7 !important;
    color: #16a34a !important;
  }

  .pill-idle {
    background-color: #f1f5f9 !important;
    color: #64748b !important;
  }

  .status-dropdown {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 1.6rem 0.25rem 0.6rem;
    border-radius: 999px;
    font-size: 0.58rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 4l2 2 2-2'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.4rem center;
    background-size: 0.8em;
  }
  .status-dropdown:focus {
    outline: 2px solid #94a3b8;
  }
  
  .status-dropdown option {
    background-color: #ffffff;
    color: #0f172a;
  }

  /* Date Cell */
  .date-cell {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .date-main {
    font-size: 0.68rem;
    font-weight: 500;
    color: #475569;
  }

  .date-sub {
    font-size: 0.58rem;
    color: #94a3b8;
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
    color: #64748b;
    font-size: 0.68rem;
  }

  .redesign-table-wrap {
    width: 100%;
  }

  /* Sticky header for scrollable table */
  .redesign-table thead th {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
    box-shadow: 0 2px 4px -2px rgba(0,0,0,0.05); /* add slight shadow for sticky */
  }

  .sop-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: #f1f5f9;
    color: #1e3a8a;
    border: 1px solid #cbd5e1;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-size: 0.58rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .sop-btn:hover {
    background: #e2e8f0;
    border-color: #94a3b8;
  }

  /* SOP Modal Styles */
  .sop-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sop-modal-content {
    background: #ffffff;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    animation: modalPop 0.2s ease-out forwards;
  }

  @keyframes modalPop {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .sop-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .sop-modal-header h3 {
    margin: 0;
    font-size: 0.88rem;
    color: #0f172a;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    color: #64748b;
    padding: 0;
    cursor: pointer;
    height: auto;
  }

  .close-btn:hover {
    color: #0f172a;
  }

  .sop-modal-body {
    padding: 1.1rem 1.25rem;
    color: #334155;
    font-size: 0.68rem;
    line-height: 1.5;
    max-height: 60vh;
    overflow-y: auto;
  }

  .sop-modal-body p {
    margin: 0.25rem 0;
  }

  .sop-divider {
    margin: 1.25rem 0;
    border: none;
    border-top: 1px solid #e2e8f0;
  }

  .sop-modal-body h4 {
    margin: 0 0 0.5rem 0;
    color: #0f172a;
    font-size: 0.72rem;
  }

  .sop-list {
    padding-left: 1.25rem;
    margin: 0.75rem 0 0 0;
  }

  .sop-list li {
    margin-bottom: 0.5rem;
  }

  .sop-modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
  }

  .dash-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(15, 20, 30, 0.42);
  }

  .dash-modal {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 1001;
    width: min(440px, calc(100vw - 2rem));
    max-height: min(92vh, 760px);
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 22px;
    background: #eceef1;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
    overflow: hidden;
  }

  .dash-modal-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 1.15rem 1.15rem 0.35rem 1.25rem;
  }

  .dash-modal-head h2 {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 750;
    letter-spacing: -0.02em;
    color: #1a1a1a;
  }

  .dash-modal-head p {
    margin: 0.15rem 0 0;
    font-size: 0.68rem;
    color: #8b919a;
  }

  .dash-close {
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 999px;
    background: #e3e5e8;
    color: #6d737c;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
  }

  .dash-close svg {
    width: 12px;
    height: 12px;
    display: block;
  }

  .dash-modal-body {
    display: grid;
    gap: 0.75rem;
    padding: 0.7rem 1.25rem 0.4rem;
    overflow: auto;
  }

  .dash-modal-body label {
    display: grid;
    gap: 0.28rem;
    font-size: 0.68rem;
    font-weight: 650;
    color: #3a3f46;
  }

  .dash-modal-body input,
  .dash-modal-body select,
  .dash-modal-body textarea {
    width: 100%;
    box-sizing: border-box;
    border: 0;
    border-radius: 12px;
    background: #fff;
    color: #1a1a1a;
    font: inherit;
    font-size: 0.72rem;
    font-weight: 500;
    padding: 0.58rem 0.75rem;
    outline: none;
  }

  .dash-modal-body textarea {
    resize: vertical;
    min-height: 92px;
  }

  .dash-modal-body input:focus,
  .dash-modal-body select:focus,
  .dash-modal-body textarea:focus {
    box-shadow: 0 0 0 2px #3b82f6;
  }

  .dash-error {
    margin: 0;
    font-size: 0.68rem;
    font-weight: 650;
    color: #be123c;
  }

  .dash-modal-foot {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.85rem;
    padding: 0.85rem 1.25rem 1.15rem;
  }

  .dash-cancel {
    border: 0;
    background: transparent;
    color: #1a1a1a;
    font: inherit;
    font-size: 0.75rem;
    font-weight: 650;
    cursor: pointer;
  }

  .dash-save {
    border: 0;
    border-radius: 999px;
    background: #1a1a1a;
    color: #fff;
    font: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.5rem 0.9rem;
    cursor: pointer;
  }
</style>
