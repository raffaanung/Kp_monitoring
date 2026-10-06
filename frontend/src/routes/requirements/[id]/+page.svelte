<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation'
  import GlassPanel from '$lib/GlassPanel.svelte'
  import AttachmentPanel from '$lib/AttachmentPanel.svelte'
  import PmCreateTaskModal from '$lib/PmCreateTaskModal.svelte'
  import {
    getRequirement,
    updateRequirement,
    rememberDetailId,
    reqCode,
    requirementStatusLabel,
    requirementStatusOptions,
    requirementHealthLabel,
    requirementStore,
  } from '$lib/requirementStore.svelte.js'
  import {
    canManageRequirements,
    tasksForRequirement,
    workflowLabel,
    workflowColumns,
    workflowStatusColor,
    isOverdue,
    setBoardDashboard,
    taskModuleStore,
  } from '$lib/taskModuleStore.svelte.js'
  import { formatDate } from '$lib/format.js'

  let taskOpen = $state(false)
  let msg = $state('')

  const item = $derived.by(() => {
    void requirementStore.items
    return page.params.id ? getRequirement(page.params.id) : null
  })

  const childTasks = $derived.by(() => {
    void taskModuleStore.items
    if (!item) return []
    return tasksForRequirement(item.id)
  })

  const stats = $derived.by(() => {
    const total = childTasks.length
    const done = childTasks.filter((t) => t.status === 'selesai').length
    const aktif = childTasks.filter((t) => t.status !== 'selesai' && t.status !== 'backlog').length
    const overdue = childTasks.filter((t) => isOverdue(t)).length
    const pct = total ? Math.round((done / total) * 100) : 0
    return { total, done, aktif, overdue, pct }
  })

  const flowCols = $derived.by(() => {
    /** @type {Record<string, number>} */
    const counts = {}
    for (const col of workflowColumns) counts[col.key] = 0
    for (const t of childTasks) counts[t.status] = (counts[t.status] || 0) + 1
    return workflowColumns.map((col) => ({ ...col, count: counts[col.key] || 0 }))
  })

  const activity = $derived.by(() => {
    /** @type {{ at: string, title: string, sub: string }[]} */
    const rows = []
    for (const t of childTasks) {
      for (const a of t.activity || []) {
        rows.push({
          at: a.at,
          title: a.action,
          sub: `${a.actor} Â· #${t.id}`,
        })
      }
    }
    if (item) {
      rows.push({
        at: item.created_at,
        title: 'Requirement dibuat',
        sub: `${item.created_by} Â· ${reqCode(item.id)}`,
      })
    }
    return rows.sort((a, b) => b.at.localeCompare(a.at))
  })

  const canEdit = $derived.by(() => {
    void taskModuleStore.session
    if (!item) return false
    return canManageRequirements(item.dashboard)
  })

  $effect(() => {
    const id = page.params.id ? Number(page.params.id) : null
    if (!id) return
    rememberDetailId(id)
    taskOpen = false
    msg = ''
  })

  /** @param {'open' | 'in_progress' | 'done'} status */
  function onStatus(status) {
    if (!item || !canEdit) return
    updateRequirement(item.id, { status })
    msg = 'Status diperbarui'
  }

  function openTaskModal() {
    taskOpen = true
  }

  function closeTaskModal() {
    taskOpen = false
  }

  /** @param {{ id: number }} created */
  function onTaskCreated(created) {
    msg = `Task #${created.id} masuk Backlog Â· sudah di-assign`
  }

  function openKanban() {
    if (!item) return
    setBoardDashboard(item.dashboard)
    goto('/tasks/board')
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

<section class="page">
  {#if !item}
    <GlassPanel>
      <p class="state error">Requirement tidak ditemukan.</p>
      <a class="ghost-btn" href="/requirements/list">â† Kembali ke Daftar</a>
    </GlassPanel>
  {:else}
    <div class="layout">
      <GlassPanel class="span-2">
        <div class="hero">
          <div class="hero-nav">
            <div class="action-pills" aria-label="Navigasi">
              <a class="pill on" href="/requirements/list" aria-label="Kembali ke daftar" title="Kembali ke daftar">â†</a>
            </div>
            <div class="hero-side">
              <div class="action-pills" aria-label="File Panduan">
                <AttachmentPanel ownerType="requirement" ownerId={item.id} canManage={canEdit} />
              </div>
              {#if canEdit}
                <div class="action-pills" aria-label="Aksi">
                  <button type="button" class="pill" onclick={openKanban}>Buka Kanban</button>
                  <button type="button" class="pill on" onclick={openTaskModal}>+ Tambah Task</button>
                </div>
              {/if}
            </div>
          </div>

          <div class="hero-top">
            <div class="hero-main">
              <p class="eyebrow">Info Requirement</p>
              <div class="meta">
                <span class="mono-id">{reqCode(item.id)}</span>
                <span class={`chip st-${item.status}`}>{requirementStatusLabel(item.status)}</span>
                <span class={`chip health-${item.health}`}>{requirementHealthLabel(item.health)}</span>
              </div>
              <h2>{item.title}</h2>
              <p class="lead">{item.description || 'Tidak ada deskripsi.'}</p>
              {#if msg}<p class="msg ok">{msg}</p>{/if}
            </div>
          </div>

          <div class="hero-body">
            <div class="identity">
              <div class="owner-card">
                <i class="face">{initials(item.created_by)}</i>
                <div>
                  <span class="k">Owner</span>
                  <strong>{item.created_by}</strong>
                </div>
              </div>
              {#if item.team?.length}
                <div class="assignees">
                  <span class="k">Assignees</span>
                  <div class="avatar-stack">
                    {#each item.team as name}
                      <span class="avatar" title={name}>
                        <i class="face sm">{initials(name)}</i>
                        <em>{name}</em>
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>

            <div class="facts">
              <div class="fact">
                <span class="k">Dashboard</span>
                <strong>{item.dashboard}</strong>
              </div>
              <div class="fact">
                <span class="k">Due Date</span>
                <strong>{formatDate(item.due_date)}</strong>
              </div>
              <div class="fact">
                <span class="k">Created</span>
                <strong>{formatDate(item.created_at)}</strong>
              </div>
              <div class="fact">
                <span class="k">Updated</span>
                <strong>{formatDate(item.updated_at)}</strong>
              </div>
              {#if canEdit}
                <label class="fact status-field">
                  <span class="k">Status</span>
                  <select value={item.status} onchange={(e) => onStatus(/** @type {any} */ (e.currentTarget.value))}>
                    {#each requirementStatusOptions as opt}
                      <option value={opt.value}>{opt.label}</option>
                    {/each}
                  </select>
                </label>
              {/if}
            </div>
          </div>

          <div class="stats" role="group" aria-label="Ringkasan task">
            <div class="stat">
              <span>Progress</span>
              <strong>{stats.pct}%</strong>
              <div class="stat-bar" aria-hidden="true">
                <span style={`width: ${Math.max(stats.pct, 0)}%`}></span>
              </div>
            </div>
            <div class="stat">
              <span>Total</span>
              <strong>{stats.total}</strong>
            </div>
            <div class="stat">
              <span>Aktif</span>
              <strong>{stats.aktif}</strong>
            </div>
            <div class="stat warn">
              <span>Overdue</span>
              <strong>{stats.overdue}</strong>
            </div>
          </div>
        </div>
      </GlassPanel>

      <div class="flow-rail span-2">
        <div class="panel-title flow-head">
          <div>
            <p class="eyebrow">Workflow</p>
            <h3>Task Flow</h3>
          </div>
          <button type="button" class="flow-btn" onclick={openKanban}>Buka Kanban</button>
        </div>
        <div class="flow">
          {#each flowCols as col}
            <div
              class="flow-col"
              class:has={col.count > 0}
              style={`--status-color: ${workflowStatusColor(col.key)}`}
            >
              <span class="status-mark" aria-hidden="true"></span>
              <span class="flow-label">{col.label}</span>
              <strong>{col.count}</strong>
            </div>
          {/each}
        </div>
      </div>

      <GlassPanel>
        <div class="panel-title">
          <div>
            <p class="eyebrow">Tasks</p>
            <h3>Task Breakdown</h3>
          </div>
          {#if canEdit}
            <button type="button" class="linkish" onclick={openTaskModal}>+ Task</button>
          {/if}
        </div>
        {#if childTasks.length === 0}
          <p class="empty">Belum ada task dari requirement ini.</p>
        {:else}
          <ul class="task-list">
            {#each childTasks as t (t.id)}
              <li>
                <div class="task-main">
                  <strong>{t.title}</strong>
                  <small>
                    {t.assignee || t.pic} Â· {formatDate(t.deadline)}
                    {#if isOverdue(t)} <em>Overdue</em>{/if}
                  </small>
                </div>
                <span class={`chip st-${t.status}`}>{workflowLabel(t.status)}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </GlassPanel>

      <GlassPanel>
        <div class="panel-title">
          <div>
            <p class="eyebrow">Log</p>
            <h3>Activity</h3>
          </div>
        </div>
        {#if activity.length === 0}
          <p class="empty">Belum ada aktivitas.</p>
        {:else}
          <ol class="timeline">
            {#each activity as ev}
              <li>
                <time class="when">{ev.at}</time>
                <div class="what">
                  <strong>{ev.title}</strong>
                  <span>{ev.sub}</span>
                </div>
              </li>
            {/each}
          </ol>
        {/if}
      </GlassPanel>
    </div>
  {/if}
</section>

{#if item}
  <PmCreateTaskModal
    open={taskOpen}
    requirementId={item.id}
    onClose={closeTaskModal}
    onCreated={onTaskCreated}
  />
{/if}

<style>
  .page {
    flex: 1;
    min-height: 0;
    height: 100%;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
    padding-bottom: 1.25rem;
    font-size: 0.76rem;
    line-height: 1.45;
    color: #1a1a1a;
    align-items: stretch;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    width: 100%;
    height: max-content;
    align-items: stretch;
    align-content: start;
  }

  .layout :global(.panel-glow),
  .page > :global(.panel-glow) {
    width: 100%;
    min-width: 0;
    height: auto;
    align-self: stretch;
  }

  .layout :global(.panel-glow.span-2) {
    grid-column: 1 / -1;
  }

  .layout :global(.panel-glow .panel),
  .page > :global(.panel-glow .panel) {
    width: 100%;
    height: auto;
    min-height: 0;
    overflow: visible;
    flex: 1 1 auto;
    box-shadow: 0 6px 20px rgba(15, 27, 46, 0.07);
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.85);
    padding: 18px 20px;
  }

  .hero {
    display: grid;
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

  .hero-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .hero-main {
    display: grid;
    gap: 0.35rem;
    min-width: 0;
    flex: 1;
  }

  .hero-main .eyebrow {
    margin-bottom: 0.05rem;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }

  h2 {
    margin: 0;
    font-size: 0.96rem;
    font-weight: 760;
    letter-spacing: -0.03em;
    line-height: 1.2;
  }

  .lead {
    margin: 0;
    color: #6b6b6b;
    font-size: 0.68rem;
    font-weight: 500;
    line-height: 1.5;
    max-width: 62ch;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .hero-body {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    gap: 0;
    border: 1px solid rgba(15, 27, 46, 0.08);
    border-radius: 16px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(247, 251, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 55%);
  }

  .identity {
    display: grid;
    gap: 0.85rem;
    padding: 0.9rem 1rem;
    border-right: 1px solid rgba(15, 27, 46, 0.07);
    align-content: start;
  }

  .owner-card {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .owner-card .k,
  .assignees .k,
  .fact .k {
    display: block;
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8a8a90;
    margin-bottom: 0.15rem;
  }

  .owner-card strong {
    font-size: 0.72rem;
    font-weight: 750;
    color: #0f1b2e;
  }

  .assignees {
    display: grid;
    gap: 0.4rem;
  }

  .avatar-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .avatar {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.55rem 0.2rem 0.2rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(6, 95, 198, 0.12);
    box-shadow: 0 1px 4px rgba(4, 40, 90, 0.06);
  }

  .avatar em {
    font-style: normal;
    font-size: 0.61rem;
    font-weight: 650;
    color: #1a1a1a;
  }

  .facts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }

  .fact {
    display: grid;
    gap: 0.2rem;
    padding: 0.75rem 0.9rem;
    border-bottom: 1px solid rgba(15, 27, 46, 0.06);
    border-right: 1px solid rgba(15, 27, 46, 0.06);
    min-width: 0;
  }

  .fact:nth-child(2n) {
    border-right: 0;
  }

  .facts > .fact:last-child {
    border-bottom: 0;
  }

  .facts:not(:has(.status-field)) > .fact:nth-last-child(-n + 2) {
    border-bottom: 0;
  }

  .fact strong {
    font-size: 0.68rem;
    font-weight: 750;
    color: #0f1b2e;
    line-height: 1.3;
    word-break: break-word;
  }

  .fact.status-field {
    grid-column: 1 / -1;
    border-right: 0;
    gap: 0.25rem;
  }

  .fact.status-field .k {
    margin-bottom: 0;
  }

  .fact.status-field select {
    height: 2rem;
    max-width: 220px;
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

  .face.sm {
    width: 22px;
    height: 22px;
    font-size: 0.48rem;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(6, 95, 198, 0.14);
    background: linear-gradient(160deg, #f7fbff 0%, #eef5fc 100%);
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.65rem 0.85rem;
    border-right: 1px solid rgba(6, 95, 198, 0.1);
    box-sizing: border-box;
  }

  .stat:last-child {
    border-right: 0;
  }

  .stat span {
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(42, 80, 128, 0.7);
  }

  .stat strong {
    font-size: 0.92rem;
    font-weight: 760;
    letter-spacing: -0.03em;
    color: #0f1b2e;
    line-height: 1.15;
  }

  .stat.warn {
    background: linear-gradient(160deg, rgba(255, 245, 246, 0.9) 0%, rgba(255, 236, 238, 0.75) 100%);
  }

  .stat.warn strong {
    color: #be123c;
  }

  .stat-bar {
    margin-top: 0.3rem;
    height: 4px;
    border-radius: 999px;
    background: rgba(6, 95, 198, 0.12);
    overflow: hidden;
  }

  .stat-bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: #065fc6;
    min-width: 0;
    text-transform: none;
  }

  .eyebrow {
    margin: 0 0 0.15rem;
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #8a8a90;
  }

  .section-head,
  .panel-title {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.65rem;
  }

  .team-block {
    display: grid;
    gap: 0.4rem;
    margin-top: 0.65rem;
    padding-top: 0.65rem;
    border-top: 1px solid rgba(15, 27, 46, 0.07);
  }

  .section-head h3,
  .panel-title h3,
  h3 {
    margin: 0;
    font-size: 0.79rem;
    font-weight: 750;
    letter-spacing: -0.015em;
  }

  .status-field {
    display: grid;
    gap: 0.3rem;
    min-width: 140px;
  }

  .status-field span {
    font-size: 0.54rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8a8a90;
  }

  .status-field select,
  .field select,
  .field input,
  .field textarea,
  .modal input,
  .modal select,
  .modal textarea {
    height: 2.2rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    padding: 0 0.75rem;
    background: rgba(255, 255, 255, 0.92);
    font: inherit;
    font-size: 0.68rem;
    color: #1a1a1a;
    outline: none;
    width: 100%;
    box-sizing: border-box;
  }

  .field textarea,
  .modal textarea {
    height: auto;
    padding: 0.65rem 0.85rem;
  }

  .param-grid {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
  }

  .param {
    min-width: 0;
    padding: 0.55rem 0.7rem;
    border-radius: 12px;
    background: rgba(248, 250, 252, 0.95);
    border: 1px solid rgba(15, 27, 46, 0.07);
  }

  .param dt {
    font-size: 0.54rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8a8a90;
    margin-bottom: 0.3rem;
  }

  .param dd {
    margin: 0;
    font-size: 0.68rem;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.35;
    word-break: break-word;
  }

  .team-label {
    font-size: 0.54rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8a8a90;
  }

  .team {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .pic {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.56rem;
    font-weight: 600;
    padding: 0.25rem 0.55rem 0.25rem 0.25rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .flow-rail {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 14px;
    border-radius: 28px;
    background:
      radial-gradient(90% 120% at 100% 0%, rgba(51, 158, 245, 0.45), transparent 55%),
      radial-gradient(80% 100% at 0% 100%, rgba(5, 58, 131, 0.55), transparent 50%),
      linear-gradient(125deg, #042a5c 0%, #053a83 28%, #065fc6 68%, #339ef5 100%);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow:
      0 10px 28px rgba(5, 58, 131, 0.28),
      inset 1px 1px 0 rgba(255, 255, 255, 0.2);
  }

  .layout .flow-rail.span-2 {
    grid-column: 1 / -1;
  }

  .flow-head .eyebrow {
    color: rgba(255, 255, 255, 0.72);
  }

  .flow-head h3 {
    color: #fff;
  }

  .flow-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    padding: 0 0.85rem;
    border-radius: 999px;
    font: inherit;
    font-size: 0.65rem;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
    backdrop-filter: blur(8px);
  }

  .flow-btn:hover {
    background: rgba(255, 255, 255, 0.28);
  }

  .flow {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
  }

  .flow-col {
    position: relative;
    display: grid;
    gap: 0.2rem;
    justify-items: center;
    padding: 0.7rem 0.5rem 0.65rem;
    border-radius: 16px;
    background: linear-gradient(160deg, #f7fbff 0%, #eef5fc 100%);
    border: 1.5px solid rgba(120, 170, 220, 0.4);
    border-top: 3px solid var(--status-color, rgba(120, 170, 220, 0.55));
    box-shadow:
      0 6px 16px rgba(4, 40, 90, 0.12),
      inset 1px 1px 0 rgba(255, 255, 255, 0.95);
    text-align: center;
    min-width: 0;
  }

  .flow-col.has {
    border-color: color-mix(in srgb, var(--status-color, #065fc6) 45%, rgba(120, 170, 220, 0.4));
    box-shadow:
      0 6px 16px rgba(4, 40, 90, 0.14),
      0 0 0 1px color-mix(in srgb, var(--status-color, #065fc6) 18%, transparent),
      inset 1px 1px 0 rgba(255, 255, 255, 0.95);
  }

  .status-mark {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--status-color, #94a3b8);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--status-color, #94a3b8) 18%, transparent);
  }

  .flow-label {
    font-size: 0.5rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: rgba(42, 80, 128, 0.72);
    line-height: 1.25;
  }

  .flow-col strong {
    font-size: 0.92rem;
    font-weight: 760;
    color: #0f1b2e;
  }

  .flow-col.has strong {
    color: color-mix(in srgb, var(--status-color, #065fc6) 78%, #0f1b2e);
  }

  .task-list,
  .timeline {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0;
  }

  .task-list li {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.85rem;
    padding: 0.75rem 0;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }

  .task-list li:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .task-list .chip {
    margin-top: 0.1rem;
    flex-shrink: 0;
  }

  .task-main {
    display: grid;
    gap: 0.15rem;
    min-width: 0;
  }

  .task-main strong {
    font-size: 0.68rem;
    font-weight: 700;
    color: #1a1a1a;
  }

  .task-main small {
    font-size: 0.61rem;
    color: #8a8a90;
  }

  .task-main em {
    color: #be123c;
    font-style: normal;
    font-weight: 750;
  }

  .timeline li {
    display: grid;
    grid-template-columns: 100px minmax(0, 1fr);
    gap: 0.7rem;
    align-items: start;
    padding: 0.65rem 0;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }

  .timeline li:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .when {
    font-size: 0.56rem;
    font-weight: 600;
    color: #8a8a90;
    font-variant-numeric: tabular-nums;
    line-height: 1.35;
    word-break: break-word;
  }

  .what {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
  }

  .what strong {
    font-size: 0.68rem;
    font-weight: 700;
  }

  .what span {
    font-size: 0.61rem;
    color: #6b6b6b;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.18rem 0.5rem;
    font-size: 0.56rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .mono-id {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    font-size: 0.56rem;
    color: #3d4f66;
    padding: 0.18rem 0.5rem;
    border-radius: 999px;
    background: #eef2f7;
  }

  .st-open, .st-backlog { background: rgba(148, 163, 184, 0.2); color: #475569; }
  .st-in_progress, .st-development { background: rgba(6, 95, 198, 0.12); color: #065fc6; }
  .st-testing { background: rgba(124, 107, 196, 0.14); color: #5b4a9e; }
  .st-uat { background: rgba(224, 164, 90, 0.18); color: #9a6a20; }
  .st-to_production { background: rgba(225, 29, 72, 0.1); color: #be123c; }
  .st-done, .st-selesai { background: rgba(47, 122, 82, 0.12); color: #2f7a52; }
  .health-on_track { background: rgba(47, 122, 82, 0.12); color: #2f7a52; }
  .health-at_risk { background: rgba(224, 164, 90, 0.18); color: #9a6a20; }
  .health-blocked { background: rgba(225, 29, 72, 0.1); color: #be123c; }

  .primary,
  .ghost-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    padding: 0 0.95rem;
    border-radius: 999px;
    font: inherit;
    font-size: 0.68rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    border: none;
  }

  .primary {
    background: #065fc6;
    color: #fff;
  }

  .primary:hover {
    background: #054fa3;
  }

  .ghost-btn {
    background: rgba(255, 255, 255, 0.9);
    color: #1a1a1a;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .ghost-btn.sm {
    height: 30px;
    font-size: 0.56rem;
    padding: 0 0.8rem;
  }

  .linkish {
    border: 0;
    background: none;
    color: #065fc6;
    font: inherit;
    font-size: 0.68rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0;
  }

  .empty,
  .state {
    margin: 0;
    color: #8a8a90;
    font-size: 0.68rem;
  }

  .state.error {
    color: #be123c;
    margin-bottom: 0.75rem;
  }

  .msg {
    margin: 0;
    font-size: 0.68rem;
    font-weight: 600;
  }

  .msg.ok { color: #2f7a52; }
  .msg.error { color: #be123c; }

  .field {
    display: grid;
    gap: 6px;
    margin-top: 0.85rem;
  }

  .field span {
    font-size: 0.61rem;
    font-weight: 650;
    color: #6b6b6b;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 80;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(6px);
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .modal {
    width: min(440px, 100%);
    background: #fff;
    border-radius: 18px;
    padding: 1.25rem;
    display: grid;
    gap: 0.75rem;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
  }

  .modal h2 {
    margin: 0;
    font-size: 0.92rem;
  }

  .hint {
    margin: 0;
    font-size: 0.68rem;
    color: #8a8a90;
  }

  .row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  @media (max-width: 980px) {
    .layout {
      grid-template-columns: 1fr;
    }

    .layout :global(.panel-glow.span-2),
    .layout .flow-rail.span-2 {
      grid-column: auto;
    }

    .hero-actions {
      justify-content: flex-start;
    }

    .hero-body {
      grid-template-columns: 1fr;
    }

    .identity {
      border-right: 0;
      border-bottom: 1px solid rgba(15, 27, 46, 0.07);
    }

    .flow {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .flow,
    .facts,
    .stats,
    .row2 {
      grid-template-columns: 1fr 1fr;
    }

    .stat {
      border-right: 0;
      border-bottom: 1px solid rgba(6, 95, 198, 0.1);
    }

    .stat:nth-child(2n) {
      border-right: 0;
    }

    .stat:nth-last-child(-n + 2) {
      border-bottom: 0;
    }

    .timeline li {
      grid-template-columns: 1fr;
      gap: 0.2rem;
    }
  }

  @media (max-width: 420px) {
    .flow,
    .facts,
    .stats {
      grid-template-columns: 1fr;
    }
  }
</style>

