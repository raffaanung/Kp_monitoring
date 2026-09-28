<script>
  import { link, push } from 'svelte-spa-router'
  import GlassPanel from '../lib/GlassPanel.svelte'
  import SubmenuHeader from '../lib/SubmenuHeader.svelte'
  import {
    getDashboard,
    updateDashboard,
    changeDashboardStatus,
    deleteDashboard,
    addRegistryTask,
    rememberDetailId,
    registryStatusLabel,
    criticalityLabel,
    itemStatusLabel,
    registryStatusOptions,
    criticalityOptions,
    registryStore,
  } from '../lib/registryStore.svelte.js'
  import { formatDate } from '../lib/format.js'

  let { params = {} } = $props()

  /** @type {'overview' | 'tasks' | 'history' | 'actions'} */
  let tab = $state('overview')

  let taskTitle = $state('')
  let taskPic = $state('')
  let taskPriority = $state(/** @type {'high' | 'medium' | 'low'} */ ('medium'))
  let taskStatus = $state(/** @type {'open' | 'in_progress' | 'done'} */ ('open'))
  let taskError = $state('')
  let taskOk = $state('')

  let editName = $state('')
  let editCode = $state('')
  let editDescription = $state('')
  let editOwner = $state('')
  let editPlatform = $state('')
  let editCategory = $state('')
  let editUrl = $state('')
  let editVersion = $state('')
  let editCriticality = $state(/** @type {'high' | 'medium' | 'low'} */ ('medium'))
  let editSource = $state('')
  let editRefresh = $state('')
  let editMsg = $state('')

  let nextStatus = $state(/** @type {'active' | 'idle'} */ ('active'))
  let statusMsg = $state('')
  let deleteMsg = $state('')

  const item = $derived.by(() => {
    void registryStore.items
    return params?.id ? getDashboard(params.id) : null
  })

  let lastLoadedId = $state(/** @type {number | null} */ (null))

  $effect(() => {
    const id = params?.id ? Number(params.id) : null
    if (!id || lastLoadedId === id) return
    const d = getDashboard(id)
    if (!d) return

    lastLoadedId = id
    rememberDetailId(id)
    editName = d.name
    editCode = d.code
    editDescription = d.description
    editOwner = d.owner
    editPlatform = d.platform
    editCategory = d.category
    editUrl = d.url
    editVersion = d.version
    editCriticality = d.criticality
    editSource = d.metadata?.source_system || ''
    editRefresh = d.metadata?.refresh_cadence || ''
    nextStatus = d.status
    taskTitle = ''
    taskPic = ''
    taskPriority = 'medium'
    taskStatus = 'open'
    taskError = ''
    taskOk = ''
    editMsg = ''
    statusMsg = ''
    deleteMsg = ''
    tab = 'overview'
  })

  function onAddTask(event) {
    event.preventDefault()
    taskError = ''
    taskOk = ''
    if (!item) return
    const created = addRegistryTask(item.id, {
      title: taskTitle,
      pic: taskPic,
      priority: taskPriority,
      status: taskStatus,
    })
    if (!created) {
      taskError = 'Judul task wajib diisi'
      return
    }
    taskTitle = ''
    taskPic = ''
    taskPriority = 'medium'
    taskStatus = 'open'
    taskOk = 'Task berhasil ditambahkan'
  }

  function onEdit(event) {
    event.preventDefault()
    if (!item) return
    updateDashboard(item.id, {
      name: editName.trim(),
      code: editCode.trim(),
      description: editDescription.trim(),
      owner: editOwner.trim(),
      platform: editPlatform.trim(),
      category: editCategory.trim(),
      url: editUrl.trim(),
      version: editVersion.trim(),
      criticality: editCriticality,
      metadata: {
        source_system: editSource.trim(),
        refresh_cadence: editRefresh.trim(),
      },
    })
    editMsg = 'Dashboard berhasil diubah'
  }

  function onChangeStatus(event) {
    event.preventDefault()
    if (!item) return
    changeDashboardStatus(item.id, nextStatus)
    statusMsg = `Status diubah ke ${registryStatusLabel(nextStatus)}`
  }

  function onDelete() {
    if (!item) return
    if (!confirm(`Hapus dashboard "${item.name}" dari registry?`)) return
    const id = item.id
    const ok = deleteDashboard(id)
    if (!ok) {
      deleteMsg = 'Gagal menghapus dashboard'
      return
    }
    push('/registry/list')
  }

  const metaEntries = $derived(
    item
      ? Object.entries(item.metadata || {}).map(([key, value]) => ({
          key: key.replaceAll('_', ' '),
          value,
        }))
      : [],
  )
</script>

<section class="page">
  <GlassPanel>
    <SubmenuHeader
      eyebrow="Dashboard Registry"
      title="Dashboard Detail"
      sub={item ? item.description : 'Detail dashboard tidak ditemukan'}
      meta={item ? item.name : '—'}
    >
      {#snippet actions()}
        <a class="btn-primary" href="/registry/list" use:link>← Daftar</a>
      {/snippet}
    </SubmenuHeader>

  {#if !item}
    <p class="state error">Dashboard tidak ditemukan.</p>
  {:else}
    <header>
      <div class="meta">
        <span class="mono">#{item.id}</span>
        <span class={`badge status-${item.status}`}>{registryStatusLabel(item.status)}</span>
        <span class={`badge crit-${item.criticality}`}>{criticalityLabel(item.criticality)}</span>
      </div>
    </header>

    <div class="tabs" role="tablist" aria-label="Detail tabs">
      <button type="button" role="tab" class:on={tab === 'overview'} aria-selected={tab === 'overview'} onclick={() => (tab = 'overview')}>Overview</button>
    </div>

    {#key tab}
      <div class="panel">
        {#if tab === 'overview'}
          <div class="overview">
            <section>
              <h2>Quick Stats</h2>
              <div class="stats">
                <article>
                  <span>Tasks Total</span>
                  <strong>{item.quick_stats.tasks_total}</strong>
                </article>
                <article>
                  <span>Tasks Open</span>
                  <strong>{item.quick_stats.tasks_open}</strong>
                </article>
                <article>
                  <span>Tasks Done</span>
                  <strong>{item.quick_stats.tasks_done}</strong>
                </article>
                <article>
                  <span>Last Change</span>
                  <strong class="date">{formatDate(item.quick_stats.last_change)}</strong>
                </article>
              </div>
            </section>

            <section>
              <h2>Info Dasar</h2>
              <dl class="grid3">
                <div><dt>Code</dt><dd>{item.code}</dd></div>
                <div><dt>Owner</dt><dd>{item.owner}</dd></div>
                <div><dt>Platform</dt><dd>{item.platform}</dd></div>
                <div><dt>Category</dt><dd>{item.category}</dd></div>
                <div><dt>Version</dt><dd>{item.version}</dd></div>
                <div><dt>URL</dt><dd>{item.url || '—'}</dd></div>
                <div><dt>Created</dt><dd>{formatDate(item.created_at)}</dd></div>
                <div><dt>Updated</dt><dd>{formatDate(item.updated_at)}</dd></div>
              </dl>
            </section>

            <section>
              <h2>Metadata</h2>
              <dl class="grid3">
                {#each metaEntries as entry}
                  <div>
                    <dt>{entry.key}</dt>
                    <dd>{entry.value || '—'}</dd>
                  </div>
                {/each}
              </dl>
            </section>
          </div>
        {:else if tab === 'tasks'}
          <div class="req-layout">
            <section>
              <h2>List Task</h2>
              {#if item.tasks.length === 0}
                <p class="empty">Belum ada task.</p>
              {:else}
                <ul class="list">
                  {#each item.tasks as task (task.id)}
                    <li>
                      <div>
                        <strong>{task.title}</strong>
                        <small>{task.pic || '—'}</small>
                      </div>
                      <div class="chips">
                        {#if task.priority}
                          <span class={`badge crit-${task.priority}`}>{criticalityLabel(task.priority)}</span>
                        {/if}
                        <span class={`badge item-${task.status}`}>{itemStatusLabel(task.status)}</span>
                      </div>
                    </li>
                  {/each}
                </ul>
              {/if}
            </section>

            <section class="add-box">
              <h2>Tambah Task</h2>
              <form class="stack" onsubmit={onAddTask}>
                <label>
                  <span>Judul</span>
                  <input bind:value={taskTitle} placeholder="Contoh: Filter periode fiscal" />
                </label>
                <label>
                  <span>PIC</span>
                  <input bind:value={taskPic} placeholder="Nama PIC (opsional)" />
                </label>
                <div class="row2">
                  <label>
                    <span>Priority</span>
                    <select bind:value={taskPriority}>
                      {#each criticalityOptions as opt}
                        <option value={opt.value}>{opt.label}</option>
                      {/each}
                    </select>
                  </label>
                  <label>
                    <span>Status</span>
                    <select bind:value={taskStatus}>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </label>
                </div>
                {#if taskError}<p class="msg error">{taskError}</p>{/if}
                {#if taskOk}<p class="msg ok">{taskOk}</p>{/if}
                <button type="submit">Tambah</button>
              </form>
            </section>
          </div>
        {:else if tab === 'history'}
          <section>
            <h2>Activity Log per Dashboard</h2>
            {#if item.history.length === 0}
              <p class="empty">Belum ada riwayat aktivitas.</p>
            {:else}
              <ol class="timeline">
                {#each item.history as entry (entry.id)}
                  <li>
                    <div class="when">{entry.at}</div>
                    <div class="what">
                      <strong>{entry.action}</strong>
                      <span>{entry.actor}</span>
                    </div>
                  </li>
                {/each}
              </ol>
            {/if}
          </section>
        {:else}
          <div class="actions">
            <section>
              <h2>Edit Dashboard</h2>
              <form class="stack" onsubmit={onEdit}>
                <div class="row2">
                  <label>
                    <span>Nama</span>
                    <input bind:value={editName} />
                  </label>
                  <label>
                    <span>Code</span>
                    <input bind:value={editCode} />
                  </label>
                </div>
                <label>
                  <span>Deskripsi</span>
                  <textarea rows="3" bind:value={editDescription}></textarea>
                </label>
                <div class="row2">
                  <label>
                    <span>Owner</span>
                    <input bind:value={editOwner} />
                  </label>
                  <label>
                    <span>Platform</span>
                    <input bind:value={editPlatform} />
                  </label>
                </div>
                <div class="row2">
                  <label>
                    <span>Category</span>
                    <input bind:value={editCategory} />
                  </label>
                  <label>
                    <span>Version</span>
                    <input bind:value={editVersion} />
                  </label>
                </div>
                <div class="row2">
                  <label>
                    <span>URL</span>
                    <input bind:value={editUrl} />
                  </label>
                  <label>
                    <span>Kritikalitas</span>
                    <select bind:value={editCriticality}>
                      {#each criticalityOptions as opt}
                        <option value={opt.value}>{opt.label}</option>
                      {/each}
                    </select>
                  </label>
                </div>
                <div class="row2">
                  <label>
                    <span>Source system</span>
                    <input bind:value={editSource} />
                  </label>
                  <label>
                    <span>Refresh cadence</span>
                    <input bind:value={editRefresh} />
                  </label>
                </div>
                {#if editMsg}<p class="msg ok">{editMsg}</p>{/if}
                <button type="submit">Simpan perubahan</button>
              </form>
            </section>

            <section>
              <h2>Change Status</h2>
              <form class="stack inline" onsubmit={onChangeStatus}>
                <label>
                  <span>Status baru</span>
                  <select bind:value={nextStatus}>
                    {#each registryStatusOptions as opt}
                      <option value={opt.value}>{opt.label}</option>
                    {/each}
                  </select>
                </label>
                <button type="submit">Update status</button>
              </form>
              {#if statusMsg}<p class="msg ok">{statusMsg}</p>{/if}
            </section>

            <section class="danger-zone">
              <h2>Delete Dashboard</h2>
              <p>Hapus entry ini dari registry (data lokal FE).</p>
              {#if deleteMsg}<p class="msg error">{deleteMsg}</p>{/if}
              <button type="button" class="danger" onclick={onDelete}>Hapus dashboard</button>
            </section>
          </div>
        {/if}
      </div>
    {/key}
  {/if}
  </GlassPanel>
</section>

<style>
  .page {
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: auto;
    padding-bottom: 1.5rem;
  }

  header {
    margin-bottom: 1rem;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  h1 {
    margin: 0 0 0.4rem;
    font-size: 1.7rem;
  }

  .lead {
    margin: 0;
    color: var(--muted, #64748b);
    line-height: 1.5;
    max-width: 70ch;
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }

  .tabs button {
    height: 2.2rem;
    padding: 0 0.9rem;
    border-radius: 999px;
    border: 1px solid var(--border, #e2e8f0);
    background: var(--surface, #fff);
    cursor: pointer;
    color: #475569;
    font-weight: 600;
    font-size: 0.88rem;
  }

  .tabs button.on {
    background: #1a1a1a;
    color: #fff;
    border-color: #1a1a1a;
  }

  .panel {
    background: var(--surface, #fff);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius, 12px);
    box-shadow: var(--shadow, 0 1px 3px rgba(0, 0, 0, 0.06));
    padding: 1.25rem;
  }

  h2 {
    margin: 0 0 0.85rem;
    font-size: 1rem;
  }

  .overview {
    display: grid;
    gap: 1.5rem;
  }

  .grid3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin: 0;
  }

  dt {
    color: var(--muted, #64748b);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-bottom: 0.25rem;
  }

  dd {
    margin: 0;
    font-weight: 600;
    word-break: break-word;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .stats article {
    background: #f8fafc;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 10px;
    padding: 0.9rem 1rem;
    display: grid;
    gap: 0.35rem;
  }

  .stats span {
    color: var(--muted, #64748b);
    font-size: 0.82rem;
  }

  .stats strong {
    font-size: 1.45rem;
    line-height: 1;
  }

  .stats strong.date {
    font-size: 1rem;
  }

  .req-layout,
  .actions {
    display: grid;
    gap: 1.5rem;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.55rem;
  }

  .list li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 10px;
    background: #f8fafc;
  }

  .list strong {
    display: block;
    margin-bottom: 0.15rem;
  }

  .list small {
    color: var(--muted, #64748b);
  }

  .chips {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .empty {
    margin: 0;
    color: var(--muted, #64748b);
  }

  .add-box {
    border-top: 1px solid var(--border, #e2e8f0);
    padding-top: 1.25rem;
  }

  .stack {
    display: grid;
    gap: 0.75rem;
    max-width: 640px;
  }

  .stack.inline {
    grid-template-columns: minmax(0, 240px) auto;
    align-items: end;
  }

  .row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  label {
    display: grid;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: var(--muted, #64748b);
  }

  input,
  select,
  textarea,
  button {
    font: inherit;
  }

  input,
  select,
  textarea {
    border: 1px solid var(--border, #e2e8f0);
    border-radius: 8px;
    padding: 0.65rem 0.75rem;
    background: #fff;
  }

  button[type='submit'],
  .danger {
    height: 2.4rem;
    padding: 0 1rem;
    border-radius: 8px;
    border: 1px solid #1a1a1a;
    background: #1a1a1a;
    color: #fff;
    cursor: pointer;
    font-weight: 600;
    width: fit-content;
  }

  .danger {
    background: #b91c1c;
    border-color: #b91c1c;
  }

  .danger-zone {
    border-top: 1px solid var(--border, #e2e8f0);
    padding-top: 1.25rem;
  }

  .danger-zone p {
    margin: 0 0 0.75rem;
    color: var(--muted, #64748b);
  }

  .msg {
    margin: 0;
    font-size: 0.9rem;
  }

  .msg.ok {
    color: #166534;
  }

  .msg.error {
    color: #b91c1c;
  }

  .timeline {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.85rem;
  }

  .timeline li {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 1rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid var(--border, #e2e8f0);
  }

  .timeline li:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .when {
    color: var(--muted, #64748b);
    font-size: 0.86rem;
  }

  .what {
    display: grid;
    gap: 0.2rem;
  }

  .what span {
    color: var(--muted, #64748b);
    font-size: 0.86rem;
  }

  .mono {
    color: var(--muted, #64748b);
  }

  .badge {
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .status-active {
    background: #dcfce7;
    color: #166534;
  }

  .status-idle {
    background: #e2e8f0;
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

  .item-open {
    background: #e0e7ff;
    color: #3730a3;
  }

  .item-in_progress {
    background: #fef3c7;
    color: #92400e;
  }

  .item-done {
    background: #dcfce7;
    color: #166534;
  }

  .state {
    padding: 1rem;
    background: var(--surface, #fff);
    border: 1px solid var(--border, #e2e8f0);
    border-radius: var(--radius, 12px);
  }

  .state.error {
    color: #b91c1c;
  }

  @media (max-width: 900px) {
    .grid3,
    .stats,
    .row2,
    .stack.inline,
    .timeline li {
      grid-template-columns: 1fr;
    }
  }
</style>
