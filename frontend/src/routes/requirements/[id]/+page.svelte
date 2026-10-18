<script>
  import { goto } from '$app/navigation'
  import GlassPanel from '$lib/GlassPanel.svelte'
  import PmCreateTaskModal from '$lib/PmCreateTaskModal.svelte'
  import { attachmentStore, listAttachments, loadAttachmentsFromApi, useAttachment } from '$lib/attachmentStore.svelte.js'
  import TaskBoard from '$lib/pages/tasks/TaskBoard.svelte'
  import TaskList from '$lib/pages/tasks/TaskList.svelte'
  import {
    getRequirement,
    updateRequirement,
    rememberDetailId,
    reqCode,
    versionRootId,
    requirementVersions,
    createRequirementVersion,
    deleteRequirementVersion,
    requirementStatusOptions,
    requirementHealthLabel,
    requirementTeamRoster,
    requirementStore,
  } from '$lib/requirementStore.svelte.js'
  import {
    canManageRequirements,
    canCreateRequirement,
    canAddAssignee,
    tasksForRequirement,
    workflowLabel,
    workflowColumns,
    workflowStatusColor,
    isOverdue,
    displayTaskProgress,
    currentUserName,
    approveModuleTask,
    requestRevisionModuleTask,
    setBoardDashboard,
    taskModuleStore,
  } from '$lib/taskModuleStore.svelte.js'
  import { formatDate } from '$lib/format.js'
  import { portal } from '$lib/portal.js'

  import { page } from '$app/state'

  let {
    requirementId = '',
    embedded = false,
    onBack = () => {},
    onOpen = () => {},
    onOpenTask = () => {},
    onOpenBoard = () => {},
  } = $props()

  const activeId = $derived(String(requirementId || page.params.id || ''))

  let taskOpen = $state(false)
  /** @type {'detail' | 'kanban' | 'tasks'} */
  let reqView = $state(page.url.searchParams.get('view') === 'kanban' ? 'kanban' : 'detail')
  let msg = $state('')
  let versionMsg = $state('')
  let versionOpen = $state(false)
  let versionTitle = $state('')
  let versionDescription = $state('')
  /** @type {string[]} */
  let versionTeam = $state([])
  let versionError = $state('')
  let savingVersion = $state(false)
  let deletingVersion = $state(false)
  let addingAssignee = $state(false)
  let newAssigneeName = $state('')
  let assigneeMsg = $state('')
  let downloading = $state(false)

  const attachments = $derived.by(() => {
    void attachmentStore.items
    if (!item) return []
    return listAttachments('requirement', item.id)
  })

  const item = $derived.by(() => {
    void requirementStore.items
    return activeId ? getRequirement(activeId) : null
  })

  /** Semua versi (V1, V2, ...) dari requirement ini, termasuk yang sedang dibuka. */
  const versions = $derived.by(() => {
    void requirementStore.items
    return item ? requirementVersions(item.id) : []
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
    const sum = childTasks.reduce((acc, t) => acc + displayTaskProgress(t), 0)
    const pct = total ? Math.round(sum / total) : 0
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
          sub: `${a.actor} · #${t.id}`,
        })
      }
    }
    if (item) {
      rows.push({
        at: item.created_at,
        title: 'Requirement dibuat',
        sub: `${item.created_by} · ${reqCode(versionRootId(item))}${item.version_no > 1 ? ' · V' + item.version_no : ''}`,
      })
    }
    return rows.sort((a, b) => b.at.localeCompare(a.at))
  })

  const canEdit = $derived.by(() => {
    void taskModuleStore.session
    if (!item) return false
    return canManageRequirements(item.dashboard)
  })

  /** Tambah versi baru mengikuti permission "create_requirement", terpisah dari hak kelola task/status di atas. */
  const canAddVersion = $derived.by(() => {
    void taskModuleStore.session
    return canCreateRequirement()
  })

  /** Tombol Tambah Assignee mengikuti permission "add_assignee", terpisah dari hak kelola task/status di atas. */
  const canAddAssigneePerm = $derived.by(() => {
    void taskModuleStore.session
    return canAddAssignee()
  })

  /** Task yang dibuat assignee (bukan owner) menunggu approval owner sebelum masuk Backlog/Kanban. */
  const isRequirementOwner = $derived.by(() => {
    void taskModuleStore.session
    return item ? item.created_by === currentUserName() : false
  })

  /** @param {number} taskId */
  async function quickApproveTask(taskId) {
    await approveModuleTask(taskId, '')
  }

  /** @param {number} taskId */
  async function quickReviseTask(taskId) {
    await requestRevisionModuleTask(taskId, 'Needs revision.')
  }

  /** Teknis yang belum jadi assignee requirement ini, untuk dropdown Tambah Assignee. */
  const availableAssignees = $derived.by(() => {
    if (!item) return []
    const current = item.team || []
    return requirementTeamRoster().filter((m) => !current.includes(m.name))
  })

  /** Semua Teknis aktif, untuk checklist assignees di form Tambah Versi. */
  const versionAssigneePool = $derived.by(() => requirementTeamRoster().map((m) => m.name))

  $effect(() => {
    const id = activeId || null
    if (!id) return
    rememberDetailId(id)
    taskOpen = false
    msg = ''
    versionMsg = ''
    versionOpen = false
    addingAssignee = false
    assigneeMsg = ''
    loadAttachmentsFromApi('requirement', id)
  })

  async function downloadAttachments() {
    if (!attachments.length || downloading) return
    downloading = true
    try {
      for (const file of attachments) {
        await useAttachment(file.id, 'download')
      }
    } finally {
      downloading = false
    }
  }

  /** @param {number} id */
  function goToVersion(id) {
    rememberDetailId(id)
    if (embedded) onOpen(id)
    else goto(`/requirements/${id}`)
  }

  function openVersionModal() {
    if (!item || !canAddVersion) return
    versionTitle = item.title
    versionDescription = item.description || ''
    versionTeam = [...(item.team || [])]
    versionError = ''
    versionOpen = true
  }

  function closeVersionModal() {
    versionOpen = false
  }

  /** @param {string} name */
  function toggleVersionAssignee(name) {
    versionTeam = versionTeam.includes(name)
      ? versionTeam.filter((n) => n !== name)
      : [...versionTeam, name]
  }

  async function confirmCreateVersion(event) {
    event.preventDefault()
    if (!item || !canAddVersion || savingVersion) return
    versionError = ''
    if (!versionTitle.trim()) {
      versionError = 'Title is required'
      return
    }
    if (!versionDescription.trim()) {
      versionError = 'Description is required'
      return
    }
    savingVersion = true
    const created = await createRequirementVersion(item.id, {
      title: versionTitle,
      description: versionDescription,
      team: versionTeam,
    })
    savingVersion = false
    if (!created) {
      versionError = 'Could not create the new version'
      return
    }
    versionOpen = false
    goToVersion(created.id)
  }

  /** Hapus versi yang sedang dibuka. Peringatan konfirmasi dulu — tindakan tidak bisa dibatalkan. */
  async function onDeleteVersion() {
    if (!item || !canAddVersion || deletingVersion) return
    const label = `${reqCode(versionRootId(item))}${item.version_no > 1 ? ' · V' + item.version_no : ''}`
    const ok = confirm(`Delete version ${label} - "${item.title}"?\n\nTasks that were linked are not deleted. Only the link to this version is removed. This cannot be undone.`)
    if (!ok) return

    const currentId = item.id
    const remaining = versions.filter((v) => v.id !== currentId)
    // Pilih versi terdekat di bawah yang dihapus (mis. hapus V3 → balik ke V2), atau versi
    // berikutnya kalau yang dihapus adalah V1.
    const fallback = [...remaining].reverse().find((v) => v.version_no < item.version_no) || remaining[0]

    deletingVersion = true
    const deleted = await deleteRequirementVersion(currentId)
    deletingVersion = false
    if (!deleted) {
      versionMsg = 'Could not delete the version'
      return
    }
    if (fallback) goToVersion(fallback.id)
    else if (embedded) onBack()
    else goto('/registry/list')
  }

  /** @param {'open' | 'in_progress' | 'done'} status */
  async function onStatus(status) {
    if (!item || !canEdit) return
    await updateRequirement(item.id, { status })
    msg = 'Status diperbarui'
  }

  function openAddAssignee() {
    if (!canAddAssigneePerm) return
    assigneeMsg = ''
    newAssigneeName = availableAssignees[0]?.name || ''
    addingAssignee = true
  }

  function cancelAddAssignee() {
    addingAssignee = false
  }

  async function confirmAddAssignee(event) {
    event.preventDefault()
    if (!item || !newAssigneeName) return
    const ok = await updateRequirement(item.id, { team: [...(item.team || []), newAssigneeName] })
    if (ok) addingAssignee = false
    else assigneeMsg = 'Could not add the assignee'
  }

  /** @param {string} name */
  async function removeAssignee(name) {
    if (!item || !canEdit) return
    if (!confirm(`Remove ${name} from assignees?`)) return
    const ok = await updateRequirement(item.id, { team: (item.team || []).filter((n) => n !== name) })
    if (!ok) assigneeMsg = 'Could not remove the assignee'
  }

  function openTaskModal() {
    taskOpen = true
  }

  function closeTaskModal() {
    taskOpen = false
  }

  /** @param {{ id: number }} created */
  function onTaskCreated(created) {
    msg = `Task #${created.id} is in Backlog · assigned`
  }

  function openKanban() {
    if (!item) return
    setBoardDashboard(item.dashboard)
    reqView = 'kanban'
  }

  /** @param {number} id */
  function openChildTask(id) {
    if (embedded) onOpenTask(id)
    else goto(`/registry/list?focusTask=${id}`)
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
  {#if !item}
    <GlassPanel>
      <p class="state error">Requirement not found.</p>
      {#if embedded}
        <button type="button" class="ghost-btn" onclick={onBack}>← Back to list</button>
      {:else}
        <a class="ghost-btn" href="/registry/list">← Back</a>
      {/if}
    </GlassPanel>
  {:else}
    <div class="layout">
      <GlassPanel class="span-2">
        <div class="hero req-header">
          <div class="req-header-top">
            <div class="req-header-left">
              {#if embedded}
                <button type="button" class="req-back" aria-label="Back" title="Back" onclick={onBack}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
              {:else}
                <a class="req-back" href="/registry/list" aria-label="Back" title="Back">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </a>
              {/if}
              <div class="req-title-block">
                <span class="req-eyebrow">Requirements</span>
                <div class="req-id-row">
                  <span class="mono-id">{reqCode(versionRootId(item))}</span>
                  <span class={`chip health-${item.health}`}>{requirementHealthLabel(item.health)}</span>
                </div>
                <div class="title-row">
                  <h2>{item.title}</h2>
                  <div class="version-switch" aria-label="Requirement versions">
                    {#if versions.length > 1}
                      {#each versions as v (v.id)}
                        <button type="button" class="version-pill" class:on={v.id === item.id} onclick={() => goToVersion(v.id)}>V{v.version_no}</button>
                      {/each}
                    {/if}
                    {#if canAddVersion}
                      <button type="button" class="version-add" onclick={openVersionModal} title="Create a new version of this requirement">+ Add Version</button>
                      <button type="button" class="version-delete" onclick={onDeleteVersion} disabled={deletingVersion} title="Delete this version">{deletingVersion ? 'Deleting…' : 'Delete Version'}</button>
                    {/if}
                  </div>
                </div>
                <p class="req-subtitle">{item.description || 'No description.'}</p>
                {#if msg}<p class="msg ok">{msg}</p>{/if}
                {#if versionMsg}<p class="msg error">{versionMsg}</p>{/if}
              </div>
            </div>
            <div class="req-actions">
              <button
                type="button"
                class="req-download"
                onclick={downloadAttachments}
                disabled={!attachments.length || downloading}
                title={attachments.length ? 'Download requirement attachments' : 'No attachments yet'}
                style="display:inline-flex;align-items:center;gap:6px;"
              >
                {#if downloading}
                  <span class="btn-spinner blue sm"></span>
                  <span>Mengunduh…</span>
                {:else}
                  <span>Download Attachment</span>
                {/if}
              </button>
              {#if canEdit}
                <button type="button" class="req-add" onclick={openTaskModal}>+ Add Task</button>
              {/if}
            </div>
          </div>
          <div class="view-switch" role="tablist" aria-label="Requirement view">
            <button type="button" class="view-tab" class:on={reqView === 'detail'} onclick={() => (reqView = 'detail')}>Detail Information</button>
            <button type="button" class="view-tab" class:on={reqView !== 'detail'} onclick={openKanban}>Kanban</button>
          </div>

          {#if reqView === 'detail'}
          <div class="info-grid">
            <div class="info-cell">
              <span class="k">Owner</span>
              <div class="owner-line">
                <i class="face">{initials(item.created_by)}</i>
                <strong>{item.created_by || '—'}</strong>
              </div>
            </div>
            <div class="info-cell">
              <span class="k">Dashboard</span>
              <strong>{item.dashboard || '—'}</strong>
            </div>
            <div class="info-cell">
              <span class="k">Due Date</span>
              <strong>{formatDate(item.due_date)}</strong>
            </div>
            <div class="info-cell">
              <span class="k">Status</span>
              {#if canEdit}
                <select class="status-select" value={item.status} onchange={(e) => onStatus(/** @type {any} */ (e.currentTarget.value))}>
                  {#each requirementStatusOptions as opt}
                    <option value={opt.value}>{opt.label}</option>
                  {/each}
                </select>
              {:else}
                <strong>{item.status}</strong>
              {/if}
            </div>
            <div class="info-cell">
              <div class="assignees-head">
                <span class="k">Assignees</span>
                {#if canAddAssigneePerm}
                  <button type="button" class="assignee-add-btn" onclick={openAddAssignee}>+ Assignee</button>
                {/if}
              </div>
              {#if addingAssignee}
                <form class="assignee-add-form" onsubmit={confirmAddAssignee}>
                  <select bind:value={newAssigneeName}>
                    {#if availableAssignees.length === 0}
                      <option value="">Every engineer is already an assignee</option>
                    {/if}
                    {#each availableAssignees as m (m.name)}
                      <option value={m.name}>{m.name}</option>
                    {/each}
                  </select>
                  <button type="submit" class="assignee-save" disabled={!newAssigneeName}>Add</button>
                  <button type="button" class="assignee-cancel" onclick={cancelAddAssignee}>Cancel</button>
                </form>
              {/if}
              {#if assigneeMsg}<small class="assignee-error">{assigneeMsg}</small>{/if}
              {#if item.team?.length}
                <div class="avatar-stack">
                  {#each item.team as name}
                    <span class="avatar" title={name}>
                      <i class="face sm">{initials(name)}</i>
                      <em>{name}</em>
                      {#if canEdit}
                        <button type="button" class="avatar-remove" aria-label={`Remove ${name}`} onclick={() => removeAssignee(name)}>×</button>
                      {/if}
                    </span>
                  {/each}
                </div>
              {:else if !addingAssignee}
                <p class="assignees-empty">No assignees yet.</p>
              {/if}
            </div>
            <div class="info-cell">
              <span class="k">Created</span>
              <strong>{formatDate(item.created_at)}</strong>
            </div>
            <div class="info-cell">
              <span class="k">Updated</span>
              <strong>{formatDate(item.updated_at)}</strong>
            </div>
            <div class="info-cell">
              <span class="k">Health</span>
              <strong>{requirementHealthLabel(item.health)}</strong>
            </div>
          </div>
          {/if}
        </div>
      </GlassPanel>

      {#if reqView === 'kanban'}
        <div class="kanban-embed span-2">
          <TaskBoard
            lockedDashboard={item.dashboard}
            initialRequirement={String(item.id)}
            embedded
            onOpenTask={openChildTask}
            onOpenList={() => (reqView = 'tasks')}
          />
        </div>
      {:else if reqView === 'tasks'}
        <div class="kanban-embed span-2">
          <TaskList
            lockedDashboard={item.dashboard}
            embedded
            onOpenTask={openChildTask}
            onOpenBoard={openKanban}
          />
        </div>
      {:else}
      <section class="task-section span-2">
        <header class="section-head">
          <div>
            <h3>Task</h3>
            <p>{childTasks.length} task</p>
          </div>
          {#if canEdit}
            <button type="button" class="req-add" onclick={openTaskModal}>+ Add Task</button>
          {/if}
        </header>
        <div class="task-scroll">
          {#if childTasks.length === 0}
            <p class="empty">No tasks yet.</p>
          {:else}
            <table class="task-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>PIC</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {#each childTasks as t (t.id)}
                  <tr>
                    <td>
                      <button type="button" class="task-open" onclick={() => openChildTask(t.id)}>{t.title}</button>
                      {#if t.approval_state === 'pending'}
                        <small class="approval-note">Menunggu approval owner.</small>
                      {:else if t.approval_state === 'revision'}
                        <small class="approval-note rev">Revision requested.</small>
                      {/if}
                    </td>
                    <td>
                      {#if isRequirementOwner && t.approval_state === 'pending'}
                        <div class="task-approve-acts">
                          <button type="button" class="task-approve" onclick={() => quickApproveTask(t.id)}>Setujui</button>
                          <button type="button" class="task-revise" onclick={() => quickReviseTask(t.id)}>Request revision</button>
                        </div>
                      {:else}
                        <span class={`chip st-${t.status}`}>{workflowLabel(t.status)}</span>
                      {/if}
                    </td>
                    <td>{t.assignee || t.pic || '—'}</td>
                    <td class:late={isOverdue(t)}>{formatDate(t.deadline)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
      </section>
      {/if}
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

{#if versionOpen && item}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="modal-backdrop" use:portal role="presentation" onclick={closeVersionModal} onkeydown={(e) => e.key === 'Escape' && closeVersionModal()}></div>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="modal"
    use:portal
    role="dialog"
    aria-modal="true"
    aria-labelledby="create-version-title"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.key === 'Escape' && closeVersionModal()}
    onsubmit={confirmCreateVersion}
  >
    <header class="modal-head">
      <div class="modal-head-copy">
        <p class="eyebrow">PM · Requirements</p>
        <h2 id="create-version-title">Add Version</h2>
        <p class="hint">New version of {reqCode(versionRootId(item))}. Existing tasks are not copied.</p>
      </div>
      <button type="button" class="modal-close" aria-label="Close" onclick={closeVersionModal}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
    </header>

    <div class="modal-body">
      <label class="field">
        <span>Title <em>*</em></span>
        <input bind:value={versionTitle} maxlength="100" placeholder="New version title" />
      </label>

      <label class="field">
        <span>Description <em>*</em></span>
        <textarea rows="3" maxlength="600" bind:value={versionDescription} placeholder="Scope and goal of this version"></textarea>
      </label>

      <div class="field">
        <span>Assignees</span>
        {#if versionAssigneePool.length === 0}
          <p class="assignees-empty">No active engineers.</p>
        {:else}
          <div class="team-picker">
            {#each versionAssigneePool as name}
              <label class="team-check">
                <input type="checkbox" checked={versionTeam.includes(name)} onchange={() => toggleVersionAssignee(name)} />
                <span>{name}</span>
              </label>
            {/each}
          </div>
        {/if}
      </div>

      {#if versionError}<p class="msg error">{versionError}</p>{/if}
    </div>

    <div class="modal-actions">
      <button type="button" class="ghost-btn" onclick={closeVersionModal}>Cancel</button>
      <button type="submit" class="primary" disabled={savingVersion}>{savingVersion ? 'Saving…' : 'Create Version'}</button>
    </div>
  </form>
{/if}

<style>
  .view-switch {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.85rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e8edf3;
  }

  .view-tab {
    height: auto;
    min-height: 0;
    padding: 0.32rem 0.7rem;
    border-radius: 8px;
    border: 1px solid transparent;
    background: #fff;
    color: #64748b;
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 1.3;
    cursor: pointer;
  }

  .view-tab.on {
    border-color: #065fc6;
    color: #065fc6;
  }

  .req-header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }

  .req-header-left {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    min-width: 0;
  }

  .req-back {
    width: 32px;
    height: 32px;
    min-width: 32px;
    padding: 0;
    border-radius: 50%;
    background: #1a1a1a;
    border: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
    flex-shrink: 0;
    margin-top: 1px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
    text-decoration: none;
  }

  .req-back:hover {
    background: #1f2937;
    color: #fff;
  }

  .req-title-block {
    display: grid;
    gap: 0.28rem;
    min-width: 0;
  }

  .req-eyebrow {
    margin: 0;
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #8a8a90;
  }

  .req-id-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .req-id-row .mono-id {
    font-size: 0.58rem;
    font-weight: 750;
    color: #6b6b6b;
  }

  .req-title-block h2 {
    margin: 0;
    font-size: 0.96rem;
    font-weight: 760;
    letter-spacing: -0.02em;
    color: #111827;
  }

  .req-subtitle {
    margin: 0;
    font-size: 0.68rem;
    font-weight: 500;
    line-height: 1.45;
    color: #6b6b6b;
  }

  .req-actions {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-shrink: 0;
  }

  .req-download {
    height: 34px;
    padding: 0 16px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #334155;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .req-download:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #94a3b8;
    color: #0f172a;
  }

  .req-download:disabled {
    opacity: 0.55;
    cursor: default;
  }

  .req-add {
    height: 32px;
    padding: 0 0.75rem;
    border: 0;
    border-radius: 999px;
    background: #0f1b2e;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .kanban-embed {
    min-width: 0;
  }

  .layout > .span-2 {
    grid-column: 1 / -1;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1px;
    margin-top: 0.85rem;
    border: 1px solid #e6ebf2;
    border-radius: 12px;
    overflow: hidden;
    background: #e8edf3;
  }

  .info-cell {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.12rem;
    min-width: 0;
    padding: 0.4rem 0.65rem;
    background: #fff;
  }

  .info-cell .k {
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #94a3b8;
  }

  .info-cell strong {
    font-size: 0.68rem;
    font-weight: 750;
    color: #111827;
  }

  .owner-line {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .status-select {
    height: 28px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    font-size: 0.68rem;
    font-weight: 650;
    color: #111827;
  }

  .task-section {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    padding: 1rem 1.1rem;
    background: #fff;
    border: 1px solid rgba(15, 27, 46, 0.06);
    border-radius: 16px;
  }

  .section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .section-head h3 {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 750;
    color: #0f172a;
  }

  .section-head p {
    margin: 0.15rem 0 0;
    font-size: 0.68rem;
    color: #64748b;
  }

  .task-scroll {
    max-height: 280px;
    overflow: auto;
    border: 1px solid #e8edf3;
    border-radius: 10px;
  }

  .task-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .task-table th:nth-child(1) { width: 40%; }
  .task-table th:nth-child(2) { width: 22%; }
  .task-table th:nth-child(3) { width: 22%; }
  .task-table th:nth-child(4) { width: 16%; }

  .task-table th {
    position: sticky;
    top: 0;
    background: #f8fafc;
    text-align: left;
    padding: 0.4rem 0.55rem;
    font-size: 0.52rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #94a3b8;
  }

  .task-table td {
    padding: 0.4rem 0.55rem;
    border-top: 1px solid #eef2f6;
    font-size: 0.65rem;
    color: #111827;
    vertical-align: middle;
  }

  .task-table td.late {
    color: #be123c;
  }

  .task-open {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
    font-size: 0.68rem;
    font-weight: 700;
    color: #0f172a;
    cursor: pointer;
  }

  @media (max-width: 900px) {
    .info-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

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

  .page.embedded {
    height: 68vh;
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

  .title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .version-switch {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .version-pill,
  .version-add {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 22px;
    padding: 0 0.55rem;
    border-radius: 999px;
    border: 1px solid rgba(6, 95, 198, 0.18);
    background: rgba(6, 95, 198, 0.06);
    color: #065fc6;
    font: inherit;
    font-size: 0.58rem;
    font-weight: 700;
    cursor: pointer;
  }

  .version-pill:hover,
  .version-add:hover {
    background: rgba(6, 95, 198, 0.12);
  }

  .version-pill.on {
    background: #065fc6;
    border-color: #065fc6;
    color: #fff;
  }

  .version-add {
    border-style: dashed;
  }

  .version-add:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .version-delete {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 22px;
    padding: 0 0.55rem;
    border-radius: 999px;
    border: 1px dashed rgba(190, 18, 60, 0.25);
    background: rgba(190, 18, 60, 0.05);
    color: #be123c;
    font: inherit;
    font-size: 0.58rem;
    font-weight: 700;
    cursor: pointer;
  }

  .version-delete:hover {
    background: rgba(190, 18, 60, 0.11);
  }

  .version-delete:disabled {
    opacity: 0.6;
    cursor: default;
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

  .assignees-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .assignee-add-btn {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 0.5rem;
    border-radius: 999px;
    border: 1px dashed rgba(6, 95, 198, 0.3);
    background: rgba(6, 95, 198, 0.06);
    color: #065fc6;
    font: inherit;
    font-size: 0.56rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .assignee-add-btn:hover {
    background: rgba(6, 95, 198, 0.12);
  }

  .assignee-add-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
  }

  .assignee-add-form select {
    height: 1.9rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 0 0.5rem;
    font: inherit;
    font-size: 0.62rem;
    background: #fff;
    min-width: 140px;
  }

  .assignee-save,
  .assignee-cancel {
    height: 1.9rem;
    padding: 0 0.6rem;
    border-radius: 8px;
    border: 1px solid transparent;
    font: inherit;
    font-size: 0.6rem;
    font-weight: 700;
    cursor: pointer;
  }

  .assignee-save {
    background: #065fc6;
    color: #fff;
  }

  .assignee-save:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .assignee-cancel {
    background: rgba(0, 0, 0, 0.05);
    color: #5c5c62;
  }

  .assignee-error {
    color: #be123c;
    font-size: 0.58rem;
    font-weight: 600;
  }

  .assignees-empty {
    margin: 0;
    font-size: 0.6rem;
    color: #8a8a90;
  }

  .avatar-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    margin-left: 0.1rem;
    border: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.06);
    color: #6b6b6b;
    font-size: 0.6rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
  }

  .avatar-remove:hover {
    background: rgba(190, 18, 60, 0.12);
    color: #be123c;
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

  .task-main strong,
  .task-open {
    font-size: 0.68rem;
    font-weight: 700;
    color: #1a1a1a;
  }

  .task-open {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
  }

  .task-open:hover {
    color: #065fc6;
    text-decoration: underline;
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

  .approval-note {
    color: #9a6a20;
    font-weight: 650;
  }

  .approval-note.rev {
    color: #be123c;
  }

  .task-approve-acts {
    display: flex;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .task-approve,
  .task-revise {
    height: 24px;
    padding: 0 0.6rem;
    border-radius: 999px;
    border: 1px solid transparent;
    font: inherit;
    font-size: 0.58rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .task-approve {
    background: #2f7a52;
    color: #fff;
  }

  .task-revise {
    background: rgba(0, 0, 0, 0.05);
    color: #5c5c62;
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
    z-index: 1000;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(6px);
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .modal {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 1001;
    width: min(440px, 100%);
    max-height: min(90vh, 640px);
    background: #fff;
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
  }

  .modal h2 {
    margin: 0;
    font-size: 0.92rem;
  }

  .hint {
    margin: 0.15rem 0 0;
    font-size: 0.68rem;
    color: #8a8a90;
  }

  .modal-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 1rem 1.1rem 0.85rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    flex-shrink: 0;
  }

  .modal-head-copy {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
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
    gap: 0.75rem;
    padding: 1rem 1.1rem;
    overflow: auto;
    min-height: 0;
  }

  .team-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    max-height: 140px;
    overflow: auto;
    padding: 0.1rem;
  }

  .team-check {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.6rem;
    border-radius: 999px;
    background: rgba(6, 95, 198, 0.05);
    border: 1px solid rgba(6, 95, 198, 0.12);
    font-size: 0.64rem;
    font-weight: 600;
    color: #1a1a1a;
    cursor: pointer;
  }

  .team-check input {
    width: auto;
    height: auto;
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
    padding: 0.85rem 1.1rem 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    flex-shrink: 0;
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
