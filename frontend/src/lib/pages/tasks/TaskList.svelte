<script>
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import GlassPanel from '$lib/GlassPanel.svelte'
  import SubmenuHeader from '$lib/SubmenuHeader.svelte'
  import {
    listModuleTasks,
    workflowColumns,
    workflowLabel,
    dashboardOptions,
    isOverdue,
  } from '$lib/taskModuleStore.svelte.js'
  import TaskViewSwitch from '$lib/TaskViewSwitch.svelte'
  import { formatDate } from '$lib/format.js'
  import { readHashTaskFilters } from '$lib/taskNav.js'

  let { lockedDashboard = '', embedded = false, onOpenTask = () => {}, onOpenBoard = () => {} } = $props()

  let dashboard = $state('')
  let status = $state('')
  let q = $state('')

  /** Hidden extras — only from deep-link Beranda (hash), tidak ditampilkan di bar filter */
  let pic = $state('')
  let overdue = $state('')
  let aktif = $state('')

  let applied = $state({
    dashboard: '',
    status: '',
    pic: '',
    overdue: '',
    aktif: '',
    q: '',
  })

  /** @param {Record<string, string>} raw */
  function applyFromQuery(raw) {
    dashboard = raw.dashboard || ''
    status = raw.status || ''
    pic = raw.pic || ''
    overdue = raw.overdue || ''
    aktif = raw.aktif || ''
    q = raw.q || ''
    applied = { dashboard, status, pic, overdue, aktif, q }
  }

  onMount(() => {
    if (lockedDashboard) {
      dashboard = lockedDashboard
      applied = { ...applied, dashboard: lockedDashboard }
      return
    }
    applyFromQuery(/** @type {Record<string, string>} */ (readHashTaskFilters()))
    const onHash = () => applyFromQuery(/** @type {Record<string, string>} */ (readHashTaskFilters()))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  })

  $effect(() => {
    if (!lockedDashboard || applied.dashboard === lockedDashboard) return
    dashboard = lockedDashboard
    applied = { ...applied, dashboard: lockedDashboard }
  })

  /** @param {number | string} id */
  function openTask(id) {
    if (embedded) onOpenTask(id)
    else goto(`/registry/list?focusTask=${id}`)
  }

  const items = $derived(listModuleTasks(applied))
  const dashboards = $derived(dashboardOptions())

  const deepLinkActive = $derived(Boolean(pic || overdue || aktif))

  function onSubmit(event) {
    event.preventDefault()
    // UI filter hanya 3 field; clear deep-link extras saat user apply manual
    pic = ''
    overdue = ''
    aktif = ''
    applied = { dashboard, status, pic: '', overdue: '', aktif: '', q }
  }

  function clearDeepLink() {
    pic = ''
    overdue = ''
    aktif = ''
    applied = { dashboard, status, pic: '', overdue: '', aktif: '', q }
  }

  /** @param {string} name */
  function initials(name) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  }
</script>

<section class="page" class:embedded>
  <GlassPanel>
    <SubmenuHeader
      eyebrow="Task"
      title="List Task"
      sub="Tabel monitoring task"
      meta={`${items.length} task`}
    >
      {#snippet actions()}
        <form class="filters" onsubmit={onSubmit}>
          {#if !lockedDashboard}
            <label class="ctrl">
              <span>Dashboard</span>
              <select class="ctrl-input" bind:value={dashboard}>
                <option value="">All</option>
                {#each dashboards as name}
                  <option value={name}>{name}</option>
                {/each}
              </select>
            </label>
          {/if}

          <label class="ctrl">
            <span>Status</span>
            <select class="ctrl-input" bind:value={status}>
              <option value="">All</option>
              {#each workflowColumns as col}
                <option value={col.key}>{col.label}</option>
              {/each}
            </select>
          </label>

          <label class="ctrl">
            <span>Search</span>
            <div class="ctrl-input search">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7" />
                <path d="m16.5 16.5 3.2 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
              <input type="search" placeholder="Title, assignee, dashboard…" bind:value={q} />
            </div>
          </label>

          <button type="submit" class="btn-primary">Terapkan</button>
        </form>
      {/snippet}
    </SubmenuHeader>

    <TaskViewSwitch active="list" {embedded} onBoard={onOpenBoard} />

    {#if deepLinkActive}
      <p class="deep">
        Extra filters from Operation Monitoring are active.
        <button type="button" onclick={clearDeepLink}>Reset</button>
      </p>
    {/if}
  </GlassPanel>

  <GlassPanel class="fill table-panel">
    {#if items.length === 0}
      <p class="state">No matching tasks.</p>
    {:else}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Task</th>
              {#if !lockedDashboard}<th>Dashboard</th>{/if}
              <th>Status</th>
              <th>Assignee</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            {#each items as task (task.id)}
              <tr class:late={isOverdue(task)}>
                <td><span class="mono-id">{task.code}</span></td>
                <td>
                  <button type="button" class="task-link" onclick={() => openTask(task.id)}>{task.title}</button>
                </td>
                {#if !lockedDashboard}<td>{task.dashboard}</td>{/if}
                <td><span class={`chip st-${task.status}`}>{workflowLabel(task.status)}</span></td>
                <td>
                  <span class="pic">
                    <i class="face">{initials(task.pic)}</i>
                    {task.pic}
                  </span>
                </td>
                <td>
                  <span class="due">{formatDate(task.deadline)}</span>
                  {#if isOverdue(task)}
                    <span class="over">Overdue</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </GlassPanel>
</section>

<style>
  .page {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  .page.embedded {
    height: 68vh;
  }

  .filters {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    margin: 0;
    flex-wrap: wrap;
  }

  .search {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 180px;
    max-width: 240px;
  }

  .search svg {
    width: 14px;
    height: 14px;
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
    font: inherit;
    font-size: 0.65rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .deep {
    margin: 10px 0 0;
    font-size: 0.59rem;
    color: #6b6b6b;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .deep button {
    border: none;
    background: transparent;
    color: #2a6cb0;
    font: inherit;
    font-size: 0.59rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
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
    min-width: 860px;
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

  .task-link {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    font-weight: 700;
    color: #0f1b2e;
    cursor: pointer;
    text-align: left;
  }

  .task-link:hover {
    color: #065fc6;
    text-decoration: underline;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    font-size: 0.56rem;
    font-weight: 700;
  }

  .st-backlog { background: rgba(148, 163, 184, 0.2); color: #475569; }
  .st-development { background: rgba(6, 95, 198, 0.14); color: #065fc6; }
  .st-testing { background: rgba(124, 107, 196, 0.16); color: #5b4a9e; }
  .st-uat { background: rgba(224, 164, 90, 0.2); color: #9a6a20; }
  .st-to_production { background: rgba(225, 29, 72, 0.12); color: #be123c; }
  .st-selesai { background: rgba(47, 122, 82, 0.14); color: #2f7a52; }

  .pic {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-weight: 600;
  }

  .face {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 0.45rem;
    font-style: normal;
    font-weight: 750;
    background: rgba(26, 26, 26, 0.08);
  }

  .due {
    font-weight: 600;
  }

  .over {
    margin-left: 0.4rem;
    font-size: 0.54rem;
    font-weight: 750;
    color: #be123c;
  }

  tr.late td {
    background: rgba(225, 29, 72, 0.03);
  }
</style>
