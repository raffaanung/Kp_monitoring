<script>
  import { push } from 'svelte-spa-router'
  import GlassPanel from '../lib/GlassPanel.svelte'
  import SubmenuHeader from '../lib/SubmenuHeader.svelte'
  import {
    listRequirements,
    createRequirement,
    countRequirements,
    rememberDetailId,
    reqCode,
    requirementStatusLabel,
    requirementStatusOptions,
    requirementStatusSummary,
    requirementHealthSummary,
    requirementSortOptions,
    requirementHealthLabel,
    requirementTeamRoster,
    requirementStore,
    groupByVersionRoot,
  } from '../lib/requirementStore.svelte.js'
  import { listDashboards, setRequirementsTotal, registryStore } from '../lib/registryStore.svelte.js'
  import {
    canCreateRequirement,
    currentUserName,
    tasksForRequirement,
    isOverdue,
    createModuleTask,
    taskModuleStore,
  } from '../lib/taskModuleStore.svelte.js'
  import { formatDate } from '../lib/format.js'
  import { portal } from '../lib/portal.js'

  let dashboard = $state('')
  let status = $state('')
  let q = $state('')
  let sort = $state('updated_desc')

  let applied = $state({
    dashboard: '',
    status: '',
    q: '',
    sort: 'updated_desc',
  })

  let createOpen = $state(false)
  let newTitle = $state('')
  let newDashboard = $state('')
  let newDescription = $state('')
  let newDue = $state('')
  let createError = $state('')
  /** @type {{ key: number, title: string, assignee: string, deadline: string }[]} */
  let draftTasks = $state([])
  let draftKeySeq = 0

  function todayISO() {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  const assigneePool = $derived(requirementTeamRoster().map((m) => m.name))

  const dashboards = $derived.by(() => {
    void registryStore.items
    return listDashboards({}).map((d) => d.name)
  })

  const items = $derived.by(() => {
    void requirementStore.items
    void taskModuleStore.items
    return listRequirements(applied)
  })

  /** Satu requirement bisa punya beberapa versi (V1, V2, ...) — tampil sebagai satu baris. */
  const groupedItems = $derived.by(() => groupByVersionRoot(items))

  const statusSummary = $derived.by(() => {
    void requirementStore.items
    return requirementStatusSummary(applied.dashboard)
  })

  const healthSummary = $derived.by(() => {
    void requirementStore.items
    return requirementHealthSummary(applied.dashboard)
  })

  const canAdd = $derived.by(() => {
    void taskModuleStore.session
    return canCreateRequirement()
  })

  /** @param {string} nextStatus */
  function filterByStatus(nextStatus) {
    status = nextStatus
    applied = { ...applied, status: nextStatus, dashboard, q, sort }
  }

  function onSubmit(event) {
    event.preventDefault()
    applied = { dashboard, status, q, sort }
  }

  /** @param {number} id */
  function openDetail(id) {
    rememberDetailId(id)
    push(`/requirements/${id}`)
  }

  /** Progress & jumlah task kumulatif dari semua versi requirement ini. @param {{ versions: { id: number }[] }} group */
  function progressOfGroup(group) {
    const tasks = group.versions.flatMap((v) => tasksForRequirement(v.id))
    const total = tasks.length
    const done = tasks.filter((t) => t.status === 'selesai').length
    const pct = total ? Math.round((done / total) * 100) : 0
    return { total, done, pct, overdue: tasks.filter((t) => isOverdue(t)).length }
  }

  function openCreate() {
    newTitle = ''
    newDashboard = dashboards[0] || ''
    newDescription = ''
    newDue = todayISO()
    createError = ''
    draftKeySeq = 0
    draftTasks = [
      { key: ++draftKeySeq, title: '', assignee: assigneePool[0] || '', deadline: todayISO() },
    ]
    createOpen = true
  }

  function closeCreate() {
    createOpen = false
  }

  function addDraftTask() {
    draftTasks = [
      ...draftTasks,
      {
        key: ++draftKeySeq,
        title: '',
        assignee: assigneePool[0] || '',
        deadline: newDue || todayISO(),
      },
    ]
  }

  /** @param {number} key */
  function removeDraftTask(key) {
    if (draftTasks.length <= 1) {
      draftTasks = [{ key: ++draftKeySeq, title: '', assignee: assigneePool[0] || '', deadline: newDue || todayISO() }]
      return
    }
    draftTasks = draftTasks.filter((t) => t.key !== key)
  }

  async function onCreate(event) {
    event.preventDefault()
    createError = ''
    if (!canAdd) {
      createError = 'Anda tidak punya izin Tambah Requirement'
      return
    }
    if (!newTitle.trim()) {
      createError = 'Judul requirement wajib diisi'
      return
    }
    if (!newDashboard.trim()) {
      createError = 'Dashboard wajib dipilih'
      return
    }
    if (!newDescription.trim()) {
      createError = 'Deskripsi wajib diisi'
      return
    }

    const readyTasks = draftTasks.filter((t) => t.title.trim())
    for (const t of readyTasks) {
      if (!t.assignee.trim()) {
        createError = `Task "${t.title.trim()}" belum punya assignee teknis`
        return
      }
      if (!t.deadline) {
        createError = `Task "${t.title.trim()}" belum punya deadline`
        return
      }
    }

    const team = [...new Set(readyTasks.map((t) => t.assignee.trim()).filter(Boolean))]

    const created = await createRequirement({
      dashboard: newDashboard.trim(),
      title: newTitle.trim(),
      description: newDescription.trim(),
      due_date: newDue || todayISO(),
      team,
      created_by: currentUserName(),
    })
    if (!created) {
      createError = 'Gagal menyimpan requirement'
      return
    }

    let made = 0
    for (const t of readyTasks) {
      const task = await createModuleTask({
        title: t.title.trim(),
        description: '',
        dashboard: created.dashboard,
        requirement_id: created.id,
        assignee: t.assignee.trim(),
        deadline: t.deadline,
        status: 'backlog',
      })
      if (task) made += 1
    }

    const dash = listDashboards({}).find((d) => d.name === created.dashboard)
    if (dash) await setRequirementsTotal(dash.id, countRequirements(created.dashboard))

    createOpen = false
    rememberDetailId(created.id)
    push(`/requirements/${created.id}`)
    void made
  }
</script>

<section class="page">
  <GlassPanel>
    <SubmenuHeader
      eyebrow="Requirements"
      title="Daftar Requirement"
      sub="PM: buat requirement + pecah task & assign teknis sekaligus"
      meta={`${items.length} item`}
    >
      {#snippet actions()}
        {#if canAdd}
          <button type="button" class="btn-primary" onclick={openCreate}>+ Tambah Requirement</button>
        {/if}
      {/snippet}
    </SubmenuHeader>

    <div class="legend" aria-label="Panduan status & health">
      <div class="legend-group">
        <span class="legend-label">Status</span>
        {#each statusSummary as row}
          <button
            type="button"
            class="legend-pill"
            class:on={applied.status === row.value}
            onclick={() => filterByStatus(applied.status === row.value ? '' : row.value)}
            title={row.summary}
          >
            <span class={`dot st-${row.value}`}></span>
            {row.label}
            <em>{row.count}</em>
          </button>
        {/each}
      </div>
      <span class="legend-sep" aria-hidden="true"></span>
      <div class="legend-group">
        <span class="legend-label">Health</span>
        {#each healthSummary as row}
          <span class="legend-pill static" title={row.summary}>
            <span class={`dot health-${row.value}`}></span>
            {row.label}
            <em>{row.count}</em>
          </span>
        {/each}
      </div>
    </div>

    <form class="filters" onsubmit={onSubmit}>
      <label>
        <span>Dashboard</span>
        <select bind:value={dashboard}>
          <option value="">Semua</option>
          {#each dashboards as name}
            <option value={name}>{name}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Status</span>
        <select bind:value={status}>
          <option value="">Semua</option>
          {#each requirementStatusOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </label>

      <label class="grow">
        <span>Cari</span>
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7" />
            <path d="m16.5 16.5 3.2 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
          </svg>
          <input type="search" placeholder="Judul, dashboard, owner…" bind:value={q} />
        </div>
      </label>

      <label>
        <span>Sort</span>
        <select bind:value={sort}>
          {#each requirementSortOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </label>

      <button type="submit" class="apply">Terapkan</button>
    </form>
  </GlassPanel>

  <GlassPanel class="fill table-panel">
    {#if items.length === 0}
      <p class="state">Tidak ada requirement yang cocok.</p>
    {:else}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Requirement</th>
              <th>Dashboard</th>
              <th>Progress</th>
              <th>Tasks</th>
              <th>Status</th>
              <th>Health</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {#each groupedItems as group (group.root.id)}
              {@const req = group.latest}
              {@const prog = progressOfGroup(group)}
              <tr>
                <td><span class="mono-id">{reqCode(group.root.id)}</span></td>
                <td>
                  <button type="button" class="req-link" onclick={() => openDetail(req.id)}>
                    <span class="title-line">
                      <strong>{req.title}</strong>
                      {#if group.versions.length > 1}
                        <span class="version-badge">{group.versions.length} versi</span>
                      {/if}
                    </span>
                    <span class="desc">{req.description || '—'}</span>
                  </button>
                </td>
                <td>{req.dashboard}</td>
                <td>
                  <div class="progress">
                    <div class="bar"><i style={`width:${prog.pct}%`}></i></div>
                    <span>{prog.pct}%</span>
                  </div>
                </td>
                <td>{prog.total}</td>
                <td><span class={`chip st-${req.status}`}>{requirementStatusLabel(req.status)}</span></td>
                <td><span class={`chip health-${req.health}`}>{requirementHealthLabel(req.health)}</span></td>
                <td><span class="due">{formatDate(req.due_date)}</span></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </GlassPanel>
</section>

{#if createOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="modal-backdrop" use:portal role="presentation" onclick={closeCreate} onkeydown={(e) => e.key === 'Escape' && closeCreate()}></div>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="modal"
    use:portal
    role="dialog"
    aria-modal="true"
    aria-labelledby="create-req-title"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === 'Escape' && closeCreate()}
    onsubmit={onCreate}
  >
      <header class="modal-head">
        <div class="modal-head-copy">
          <p class="eyebrow">PM · Requirements</p>
          <h2 id="create-req-title">Tambah Requirement</h2>
          <p class="hint">Isi requirement, lalu pecah ke beberapa task &amp; assign teknis (opsional).</p>
        </div>
        <button type="button" class="modal-close" aria-label="Tutup" onclick={closeCreate}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>
      </header>

      <div class="modal-body">
        <label class="field">
          <span>Judul <em>*</em></span>
          <input bind:value={newTitle} maxlength="100" placeholder="Contoh: SLA & Throughput Visibility" />
        </label>

        <div class="row2">
          <label class="field">
            <span>Dashboard <em>*</em></span>
            <select bind:value={newDashboard}>
              {#each dashboards as name}
                <option value={name}>{name}</option>
              {/each}
            </select>
          </label>
          <label class="field">
            <span>Due Date</span>
            <input type="date" bind:value={newDue} />
          </label>
        </div>

        <label class="field">
          <span>Deskripsi <em>*</em></span>
          <textarea rows="2" maxlength="600" bind:value={newDescription} placeholder="Ruang lingkup & tujuan requirement"></textarea>
        </label>

        <div class="tasks-box">
          <div class="tasks-top">
            <div>
              <span>Tasks ke Backlog</span>
              <small>Judul + assign teknis · baris kosong diabaikan</small>
            </div>
            <button type="button" class="add-task" onclick={addDraftTask}>+ Task</button>
          </div>

          <div class="draft-list">
            {#each draftTasks as task, i (task.key)}
              <div class="draft-row">
                <span class="draft-idx">{i + 1}</span>
                <input
                  class="draft-title"
                  bind:value={task.title}
                  placeholder="Judul task…"
                  maxlength="120"
                />
                <select class="draft-assignee" bind:value={task.assignee}>
                  <option value="">Assign…</option>
                  {#each assigneePool as name}
                    <option value={name}>{name}</option>
                  {/each}
                </select>
                <input class="draft-due" type="date" bind:value={task.deadline} />
                <button type="button" class="draft-remove" aria-label="Hapus task" onclick={() => removeDraftTask(task.key)}>×</button>
              </div>
            {/each}
          </div>
        </div>

        {#if createError}<p class="msg error">{createError}</p>{/if}
      </div>

      <div class="modal-actions">
        <button type="button" class="ghost" onclick={closeCreate}>Batal</button>
        <button type="submit" class="primary">Simpan Requirement</button>
      </div>
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

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: end;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin-top: 10px;
    padding: 5px 8px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.045);
  }

  .legend-group {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }

  .legend-label {
    font-size: 0.55rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #a8a8ae;
    margin-right: 2px;
  }

  .legend-sep {
    width: 1px;
    height: 12px;
    background: rgba(0, 0, 0, 0.08);
  }

  .legend-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0.12rem 0.32rem 0.12rem 0.22rem;
    border-radius: 999px;
    border: 1px solid transparent;
    background: transparent;
    font: inherit;
    font-size: 0.58rem;
    font-weight: 550;
    color: #7a7a80;
    cursor: pointer;
    line-height: 1;
  }

  .legend-pill.static {
    cursor: default;
  }

  .legend-pill:hover:not(.static),
  .legend-pill.on {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 0, 0, 0.07);
    color: #5c5c62;
  }

  .legend-pill em {
    font-style: normal;
    font-weight: 700;
    color: #3a3a40;
    font-variant-numeric: tabular-nums;
  }

  .legend .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .legend .dot.st-open {
    background: #94a3b8;
  }
  .legend .dot.st-in_progress {
    background: #065fc6;
  }
  .legend .dot.st-done {
    background: #2f7a52;
  }
  .legend .dot.health-on_track {
    background: #065fc6;
  }
  .legend .dot.health-at_risk {
    background: #d97706;
  }
  .legend .dot.health-blocked {
    background: #be123c;
  }

  @media (max-width: 720px) {
    .legend-sep {
      display: none;
    }
  }

  label {
    display: grid;
    gap: 6px;
    min-width: 140px;
  }

  label.grow {
    flex: 1;
    min-width: 220px;
  }

  label span {
    font-size: 0.56rem;
    font-weight: 650;
    color: #6b6b6b;
  }

  select,
  input,
  textarea,
  .apply,
  .ghost {
    height: 2.45rem;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 14px;
    padding: 0 0.85rem;
    background: rgba(255, 255, 255, 0.78);
    font: inherit;
    font-size: 0.68rem;
    color: #1a1a1a;
  }

  textarea {
    height: auto;
    padding: 0.65rem 0.85rem;
    resize: vertical;
  }

  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 2.45rem;
    padding: 0 0.85rem;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.78);
  }

  .search svg {
    width: 15px;
    height: 15px;
    color: #7a7a80;
    flex-shrink: 0;
  }

  .search input {
    border: 0;
    background: transparent;
    padding: 0;
    height: auto;
    width: 100%;
    outline: none;
  }

  .apply {
    background: #1a1a1a;
    color: #fff;
    border-color: transparent;
    font-weight: 700;
    cursor: pointer;
    padding: 0 1.1rem;
    border-radius: 999px;
  }

  :global(.table-panel) {
    flex: 1;
    min-height: 0;
  }

  .table-wrap {
    overflow: auto;
    flex: 1;
    min-height: 0;
    margin: -4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 920px;
  }

  th,
  td {
    text-align: left;
    padding: 0.85rem 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    vertical-align: middle;
    font-size: 0.68rem;
  }

  th {
    font-size: 0.56rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #8a8a90;
    font-weight: 700;
  }

  .state {
    margin: 0;
    padding: 2rem 0.5rem;
    text-align: center;
    color: #8a8a90;
    font-weight: 550;
  }

  .mono-id {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    color: #6b6b6b;
    font-size: 0.65rem;
  }

  .req-link {
    display: grid;
    gap: 0.15rem;
    padding: 0;
    border: 0;
    background: none;
    text-align: left;
    cursor: pointer;
    font: inherit;
    color: #0f1b2e;
  }

  .req-link strong {
    font-weight: 700;
  }

  .title-line {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .version-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.08rem 0.4rem;
    border-radius: 999px;
    background: rgba(6, 95, 198, 0.1);
    color: #065fc6;
    font-size: 0.52rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .req-link:hover strong {
    color: #065fc6;
  }

  .desc {
    font-size: 0.59rem;
    color: #8a8a90;
    font-weight: 500;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .progress {
    display: grid;
    gap: 0.25rem;
    min-width: 88px;
  }

  .progress span {
    font-size: 0.56rem;
    color: #8a8a90;
    font-weight: 600;
  }

  .bar {
    height: 6px;
    border-radius: 999px;
    background: rgba(26, 26, 26, 0.08);
    overflow: hidden;
  }

  .bar i {
    display: block;
    height: 100%;
    background: #1a1a1a;
    border-radius: inherit;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    font-size: 0.56rem;
    font-weight: 700;
  }

  .st-open {
    background: rgba(148, 163, 184, 0.2);
    color: #475569;
  }
  .st-in_progress {
    background: rgba(6, 95, 198, 0.14);
    color: #065fc6;
  }
  .st-done {
    background: rgba(47, 122, 82, 0.14);
    color: #2f7a52;
  }
  .health-on_track {
    background: rgba(6, 95, 198, 0.14);
    color: #065fc6;
  }
  .health-at_risk {
    background: rgba(224, 164, 90, 0.2);
    color: #9a6a20;
  }
  .health-blocked {
    background: rgba(225, 29, 72, 0.12);
    color: #be123c;
  }

  .due {
    font-weight: 600;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(15, 20, 30, 0.48);
  }

  .modal {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 1001;
    width: min(560px, calc(100vw - 2rem));
    max-height: min(90vh, 760px);
    background: #fff;
    border-radius: 16px;
    border: 0;
    outline: none;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.28);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    isolation: isolate;
  }

  .modal-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 1rem 1rem 0.85rem 1.15rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    background: #fff;
  }

  .modal-head-copy {
    display: grid;
    gap: 0.15rem;
    min-width: 0;
  }

  .eyebrow {
    margin: 0;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #9a9aa0;
  }

  .modal h2 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 720;
    letter-spacing: -0.02em;
    color: #1a1a1a;
    line-height: 1.25;
  }

  .hint {
    margin: 0.1rem 0 0;
    font-size: 0.68rem;
    font-weight: 500;
    color: #8a8a90;
    line-height: 1.35;
  }

  .modal-close {
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.05);
    color: #6b6b6b;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .modal-close svg {
    width: 14px;
    height: 14px;
    display: block;
  }

  .modal-close:hover {
    background: rgba(0, 0, 0, 0.09);
    color: #1a1a1a;
  }

  .modal-body {
    display: grid;
    gap: 0.7rem;
    padding: 0.95rem 1.15rem;
    overflow: auto;
    min-height: 0;
  }

  .modal .field {
    display: grid;
    gap: 0.3rem;
    min-width: 0;
  }

  .modal .field > span {
    font-size: 0.66rem;
    font-weight: 650;
    color: #5c5c62;
  }

  .modal .field > span em {
    color: #be123c;
    font-style: normal;
  }

  .modal .field input,
  .modal .field select,
  .modal .field textarea {
    width: 100%;
    box-sizing: border-box;
    height: 2.2rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 11px;
    padding: 0 0.7rem;
    background: #fff;
    font: inherit;
    font-size: 0.76rem;
    font-weight: 500;
    color: #1a1a1a;
    outline: none;
  }

  .modal .field textarea {
    height: auto;
    min-height: 3.6rem;
    padding: 0.55rem 0.7rem;
    resize: vertical;
    line-height: 1.4;
  }

  .modal .field input::placeholder,
  .modal .field textarea::placeholder {
    color: #a8a8ae;
    font-weight: 450;
  }

  .modal .field input:focus,
  .modal .field select:focus,
  .modal .field textarea:focus:focus {
    border-color: rgba(26, 26, 26, 0.28);
    box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.06);
  }

  .row2 {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 0.6rem;
  }







  .tasks-box {
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 12px;
    padding: 0.65rem;
    display: grid;
    gap: 0.5rem;
    background: rgba(6, 95, 198, 0.03);
  }

  .tasks-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .tasks-top span {
    display: block;
    font-size: 0.66rem;
    font-weight: 650;
    color: #5c5c62;
  }

  .tasks-top small {
    display: block;
    margin-top: 0.1rem;
    font-size: 0.58rem;
    color: #9a9aa0;
  }

  .add-task {
    height: 28px;
    padding: 0 0.7rem;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: #fff;
    font: inherit;
    font-size: 0.64rem;
    font-weight: 650;
    color: #1a1a1a;
    cursor: pointer;
    white-space: nowrap;
  }

  .add-task:hover {
    border-color: rgba(0, 0, 0, 0.18);
  }

  .draft-list {
    display: grid;
    gap: 0.35rem;
  }

  .draft-row {
    display: grid;
    grid-template-columns: 18px minmax(0, 1.4fr) minmax(0, 1fr) 108px 26px;
    gap: 0.3rem;
    align-items: center;
  }

  .draft-idx {
    font-size: 0.58rem;
    font-weight: 700;
    color: #9a9aa0;
    text-align: center;
  }

  .draft-title,
  .draft-assignee,
  .draft-due {
    width: 100%;
    box-sizing: border-box;
    height: 2rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 9px;
    padding: 0 0.5rem;
    background: #fff;
    font: inherit;
    font-size: 0.68rem;
    color: #1a1a1a;
    outline: none;
  }

  .draft-title:focus,
  .draft-assignee:focus,
  .draft-due:focus {
    border-color: rgba(26, 26, 26, 0.28);
    box-shadow: 0 0 0 2px rgba(26, 26, 26, 0.05);
  }

  .draft-remove {
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.04);
    color: #8a8a90;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
  }

  .draft-remove:hover {
    background: rgba(190, 18, 60, 0.1);
    color: #be123c;
  }

  @media (max-width: 640px) {
    .draft-row {
      grid-template-columns: 18px 1fr 26px;
      grid-template-areas:
        'idx title remove'
        'idx assignee remove'
        'idx due remove';
    }

    .draft-idx { grid-area: idx; }
    .draft-title { grid-area: title; }
    .draft-assignee { grid-area: assignee; }
    .draft-due { grid-area: due; }
    .draft-remove { grid-area: remove; align-self: start; }
  }














  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.45rem;
    padding: 0.8rem 1.15rem 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .modal .ghost,
  .modal .primary {
    height: 34px;
    min-width: 84px;
    border-radius: 999px;
    font: inherit;
    font-size: 0.72rem;
    font-weight: 650;
    cursor: pointer;
    padding: 0 1rem;
    border: 1px solid transparent;
  }

  .modal .primary {
    background: #1a1a1a;
    color: #fff;
  }

  .modal .primary:hover {
    background: #2a2a2a;
  }

  .modal .ghost {
    background: transparent;
    color: #5c5c62;
    border-color: rgba(0, 0, 0, 0.1);
  }

  .modal .ghost:hover {
    background: rgba(0, 0, 0, 0.03);
  }

  .msg.error {
    margin: 0;
    color: #be123c;
    font-size: 0.7rem;
    font-weight: 600;
  }

  @media (max-width: 560px) {
    .row2 {
      grid-template-columns: 1fr;
    }
  }
</style>
