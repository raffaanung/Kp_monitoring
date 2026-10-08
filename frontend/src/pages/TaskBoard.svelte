<script>
  import { push } from 'svelte-spa-router'
  import GlassPanel from '../lib/GlassPanel.svelte'
  import SubmenuHeader from '../lib/SubmenuHeader.svelte'
  import PmCreateTaskModal from '../lib/PmCreateTaskModal.svelte'
  import {
    workflowColumns,
    tasksByColumn,
    moveModuleTask,
    isOverdue,
    rememberDetailId,
    setBoardDashboard,
    resolveBoardDashboard,
    boardDashboardOptions,
    workflowStatusColor,
    workflowLabel,
    taskModuleStore,
    setBoardTab,
    listInboxTasks,
    inboxNeedsMyAction,
    canCreateTask,
    canUpdateBoard,
    canCommentOnTask,
    isCurrentUserPmOf,
    approveStatusMove,
    rejectStatusMove,
    approveModuleTask,
    requestRevisionModuleTask,
    resubmitModuleTask,
    latestComment,
    approvalLabel,
    pmOfDashboard,
    currentUserRole,
    currentUserName,
    addTaskComment,
    getModuleTask,
    readEvidenceFile,
  } from '../lib/taskModuleStore.svelte.js'
  import { formatDate, formatDateTime } from '../lib/format.js'
  import { portal } from '../lib/portal.js'
  import { listRequirements, reqCode, versionRootId, reqVersionSuffix, requirementStore } from '../lib/requirementStore.svelte.js'

  let dragId = $state(/** @type {number | null} */ (null))
  let overColumn = $state(/** @type {string | null} */ (null))
  /** Inline masukan per inbox card */
  let reviewNotes = $state(/** @type {Record<number, string>} */ ({}))
  /** Teknis: confirm move request */
  let moveConfirmId = $state(/** @type {number | null} */ (null))
  let moveConfirmTo = $state(/** @type {string | null} */ (null))
  let moveNote = $state('')
  let moveMsg = $state('')
  let moveEvidence = $state(/** @type {import('../lib/taskModuleStore.svelte.js').EvidenceFile | null} */ (null))
  let moveFileLabel = $state('')
  /** @type {Record<number, import('../lib/taskModuleStore.svelte.js').EvidenceFile | null>} */
  let reviewFiles = $state({})
  /** @type {Record<number, string>} */
  let reviewFileLabels = $state({})
  let suppressClick = $state(false)
  /** Inline comment composer on card */
  let commentOpenId = $state(/** @type {number | null} */ (null))
  let commentDraft = $state('')
  /** PM: create task + assign */
  let createTaskOpen = $state(false)
  /** '' = semua requirement di dashboard yang dipilih */
  let requirementId = $state('')

  const dashboards = $derived(boardDashboardOptions())
  const selectedDashboard = $derived(resolveBoardDashboard())
  const requirements = $derived.by(() => {
    void requirementStore.items
    return listRequirements({ dashboard: selectedDashboard, sort: 'title_asc' })
  })
  const boardTab = $derived.by(() => {
    void taskModuleStore.boardTab
    return taskModuleStore.boardTab
  })
  const session = $derived.by(() => {
    void taskModuleStore.session
    return taskModuleStore.session
  })
  const canAdd = $derived.by(() => {
    void taskModuleStore.session
    void taskModuleStore.boardDashboard
    return canCreateTask()
  })
  const canDrag = $derived.by(() => {
    void taskModuleStore.session
    return canUpdateBoard()
  })
  /** Owner requirement boleh geser task-nya sendiri, apa pun role-nya (termasuk Admin). @param {{ requirement_owner?: string } | null} task */
  function isTaskOwner(task) {
    void taskModuleStore.session
    return Boolean(task && task.requirement_owner === currentUserName())
  }
  /** @param {{ requirement_owner?: string } | null} task */
  function canDragTask(task) {
    return canDrag || isTaskOwner(task)
  }
  const canComment = $derived.by(() => {
    void taskModuleStore.session
    return canCommentOnTask()
  })
  const asPmHere = $derived.by(() => {
    void taskModuleStore.session
    void taskModuleStore.boardDashboard
    return isCurrentUserPmOf(selectedDashboard)
  })
  const role = $derived.by(() => {
    void taskModuleStore.session
    return currentUserRole()
  })
  /** @param {{ requirement_id?: string | null }} task */
  function inRequirement(task) {
    if (!requirementId) return true
    return task.requirement_id === requirementId
  }

  const inboxItems = $derived.by(() => {
    void taskModuleStore.items
    void requirementId
    return listInboxTasks(selectedDashboard).filter(inRequirement)
  })
  const myActionCount = $derived.by(() => {
    void taskModuleStore.items
    void taskModuleStore.session
    void requirementId
    return inboxNeedsMyAction(selectedDashboard).filter(inRequirement).length
  })
  const moveTask = $derived.by(() => {
    void taskModuleStore.items
    return moveConfirmId ? getModuleTask(moveConfirmId) : null
  })

  const columnTone = {
    backlog: 'sand',
    development: 'sky',
    testing: 'lavender',
    uat: 'peach',
    to_production: 'rose',
    selesai: 'mint',
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

  /** @param {DragEvent} e @param {number} id */
  function onDragStart(e, id) {
    const task = getModuleTask(id)
    if (!canDragTask(task)) {
      e.preventDefault()
      return
    }
    if (task?.status_move) {
      e.preventDefault()
      return
    }
    if (commentOpenId === id) {
      e.preventDefault()
      return
    }
    dragId = id
    suppressClick = true
    e.dataTransfer?.setData('text/plain', String(id))
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
  }

  function onDragEnd() {
    dragId = null
    overColumn = null
    setTimeout(() => {
      suppressClick = false
    }, 0)
  }

  /** @param {DragEvent} e @param {string} column */
  function onDragOver(e, column) {
    if (!canDragTask(getModuleTask(dragId))) return
    e.preventDefault()
    overColumn = column
  }

  /** @param {DragEvent} e @param {string} column */
  async function onDrop(e, column) {
    e.preventDefault()
    const id = e.dataTransfer?.getData('text/plain') || dragId || ''
    dragId = null
    overColumn = null
    if (!id) return

    const task = getModuleTask(id)
    if (!canDragTask(task)) return
    if (!task || task.status === column) return
    if (task.status_move) return

    if (isTaskOwner(task) || (role === 'pm' && asPmHere)) {
      await moveModuleTask(id, /** @type {any} */ (column))
      return
    }

    if (role === 'teknis') {
      moveConfirmId = id
      moveConfirmTo = column
      moveNote = ''
      moveMsg = ''
      moveEvidence = null
      moveFileLabel = ''
    }
  }

  function closeMoveConfirm() {
    moveConfirmId = null
    moveConfirmTo = null
    moveNote = ''
    moveMsg = ''
    moveEvidence = null
    moveFileLabel = ''
  }

  /** @param {Event} e */
  async function onMoveFile(e) {
    const input = /** @type {HTMLInputElement} */ (e.currentTarget)
    const file = input.files?.[0]
    if (!file) {
      moveEvidence = null
      moveFileLabel = ''
      return
    }
    try {
      moveEvidence = await readEvidenceFile(file)
      moveFileLabel = file.name
      moveMsg = ''
    } catch (err) {
      moveEvidence = null
      moveFileLabel = ''
      moveMsg = err instanceof Error ? err.message : 'Gagal membaca file'
    }
  }

  async function submitMoveRequest() {
    if (!moveConfirmId || !moveConfirmTo) return
    const result = await moveModuleTask(moveConfirmId, /** @type {any} */ (moveConfirmTo), {
      note: moveNote,
      evidence: moveEvidence,
    })
    if (result === 'requested') {
      moveMsg = 'Request dikirim ke PM'
      setTimeout(() => {
        closeMoveConfirm()
        setBoardTab('inbox')
      }, 500)
      return
    }
    if (result === 'moved') {
      closeMoveConfirm()
      return
    }
    moveMsg = 'Gagal mengajukan pindah (mungkin sudah ada request)'
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      closeMoveConfirm()
      commentOpenId = null
      commentDraft = ''
    }
  }

  /** @param {number} id */
  function inboxNote(id) {
    if (Object.hasOwn(reviewNotes, id)) return reviewNotes[id]
    const task = getModuleTask(id)
    return task?.status_move?.note || task?.approval_note || ''
  }

  /** @param {number} id @param {string} value */
  function setInboxNote(id, value) {
    reviewNotes = { ...reviewNotes, [id]: value }
  }

  /** @param {number} id @param {Event} e */
  async function onReviewFile(id, e) {
    const input = /** @type {HTMLInputElement} */ (e.currentTarget)
    const file = input.files?.[0]
    if (!file) {
      reviewFiles = { ...reviewFiles, [id]: null }
      reviewFileLabels = { ...reviewFileLabels, [id]: '' }
      return
    }
    try {
      const evidence = await readEvidenceFile(file)
      reviewFiles = { ...reviewFiles, [id]: evidence }
      reviewFileLabels = { ...reviewFileLabels, [id]: file.name }
    } catch (err) {
      reviewFiles = { ...reviewFiles, [id]: null }
      reviewFileLabels = { ...reviewFileLabels, [id]: '' }
      alert(err instanceof Error ? err.message : 'Gagal membaca file')
    }
  }

  function clearReviewFile(id) {
    const next = { ...reviewFiles }
    const labels = { ...reviewFileLabels }
    delete next[id]
    delete labels[id]
    reviewFiles = next
    reviewFileLabels = labels
  }

  /** @param {number} id @param {string} [fallback] */
  async function cardApprove(id, fallback = '') {
    const task = getModuleTask(id)
    if (!task) return
    const note = inboxNote(id) || fallback
    const evidence = reviewFiles[id] || null
    if (task.status_move) await approveStatusMove(id, note, evidence)
    else await approveModuleTask(id, note, evidence)
    setInboxNote(id, '')
    clearReviewFile(id)
  }

  /** @param {number} id @param {string} [fallback] */
  async function cardRevise(id, fallback = 'Perlu revisi.') {
    const task = getModuleTask(id)
    if (!task) return
    const note = inboxNote(id).trim() || fallback
    const evidence = reviewFiles[id] || null
    if (task.status_move) await rejectStatusMove(id, note, evidence)
    else await requestRevisionModuleTask(id, note, evidence)
    setInboxNote(id, '')
    clearReviewFile(id)
  }

  /** @param {number} id */
  async function cardReject(id) {
    const task = getModuleTask(id)
    if (!task) return
    const fallback = task.status_move ? 'Request pindah ditolak.' : 'Ditolak.'
    await cardRevise(id, fallback)
  }

  /** @param {number} id */
  function toggleComment(id) {
    if (commentOpenId === id) {
      commentOpenId = null
      commentDraft = ''
      return
    }
    commentOpenId = id
    commentDraft = ''
  }

  /** Klik badan kartu membuka area komentar di bawahnya, bukan pindah halaman. @param {MouseEvent} e @param {number} id */
  function onCardClick(e, id) {
    if (suppressClick) return
    const el = /** @type {HTMLElement | null} */ (e.target)
    if (el?.closest('button, textarea, form, input, a, label')) return
    toggleComment(id)
  }

  /** Judul task tetap jadi jalan ke halaman detail lengkap (approve/reject, riwayat, dll). @param {number} id */
  function goToCardDetail(id) {
    rememberDetailId(id)
    push(`/tasks/${id}`)
  }

  /** @param {SubmitEvent} e @param {number} id */
  async function submitCardComment(e, id) {
    e.preventDefault()
    if (!commentDraft.trim()) return
    await addTaskComment(id, commentDraft)
    commentDraft = ''
    commentOpenId = null
  }
</script>

<section class="page">
  <GlassPanel>
    <SubmenuHeader
      eyebrow="Task"
      title="Board"
      sub="Kanban per dashboard · pindah status teknis butuh approval PM"
      meta={selectedDashboard || '—'}
    >
      {#snippet actions()}
        <label class="ctrl">
          <span>Dashboard</span>
          <select
            class="ctrl-input"
            value={selectedDashboard}
            onchange={(e) => {
              requirementId = ''
              setBoardDashboard(/** @type {HTMLSelectElement} */ (e.currentTarget).value)
            }}
          >
            {#each dashboards as name}
              <option value={name}>{name}</option>
            {/each}
          </select>
        </label>
        <label class="ctrl">
          <span>Requirement</span>
          <select class="ctrl-input req-filter" bind:value={requirementId}>
            <option value="">Semua requirement</option>
            {#each requirements as req (req.id)}
              <option value={String(req.id)}>{reqCode(versionRootId(req))}{reqVersionSuffix(req)} · {req.title}</option>
            {/each}
          </select>
        </label>
        {#if canAdd}
          <button type="button" class="btn-primary" onclick={() => (createTaskOpen = true)}>
            + Tambah Task
          </button>
        {/if}
      {/snippet}
    </SubmenuHeader>

    <div class="tabs" role="tablist" aria-label="Board views">
      <button
        type="button"
        role="tab"
        class="tab"
        class:on={boardTab === 'kanban'}
        aria-selected={boardTab === 'kanban'}
        onclick={() => setBoardTab('kanban')}
      >
        Kanban
      </button>
      <button
        type="button"
        role="tab"
        class="tab"
        class:on={boardTab === 'inbox'}
        aria-selected={boardTab === 'inbox'}
        onclick={() => setBoardTab('inbox')}
      >
        Status approval
        {#if myActionCount > 0}
          <span class="tab-alert">{myActionCount}</span>
        {:else if inboxItems.length > 0}
          <span class="tab-count">{inboxItems.length}</span>
        {/if}
      </button>
      <p class="tab-hint">
        {#if role === 'viewer' || role === 'manager'}
          Mode view saja
        {:else if asPmHere}
          Anda PM {selectedDashboard} · drag langsung · review request teknis
        {:else if role === 'pm'}
          PM {pmOfDashboard(selectedDashboard) || '—'} · Anda PM dashboard lain
        {:else}
          Teknis · drag = ajukan pindah status (butuh approval PM)
        {/if}
      </p>
    </div>
  </GlassPanel>

  {#if boardTab === 'inbox'}
    <div class="inbox-rail">
      {#if inboxItems.length === 0}
        <p class="inbox-empty">Tidak ada request pindah status untuk {selectedDashboard}.</p>
      {:else}
        <div class="inbox-list">
          {#each inboxItems as task (task.id)}
            {@const canActMove = (isCurrentUserPmOf(task.dashboard) || isTaskOwner(task)) && Boolean(task.status_move)}
            {@const canActLegacy =
              task.requirement_owner === session.name &&
              !task.status_move &&
              task.approval_state === 'pending'}
            {@const canResubmit =
              task.approval_state === 'revision' &&
              (task.created_by === session.name || task.requirement_owner === session.name)}
            {@const canAct = canActMove || canActLegacy}
            {@const badgeState = task.status_move
              ? 'pending'
              : task.approval_state === 'revision'
                ? 'revision'
                : task.approval_state === 'approved'
                  ? 'approved'
                  : 'pending'}
            {@const badgeText = task.status_move
              ? `Pindah ${workflowLabel(task.status_move.from)} → ${workflowLabel(task.status_move.to)}`
              : approvalLabel(task.approval_state)}
            {@const actor = task.status_move?.requested_by || task.created_by}
            {@const when = formatDateTime(task.status_move?.at || task.updated_at || task.created_at)}
            {@const existingNote = task.status_move?.note || task.approval_note || ''}
            <article class="inbox-card" class:rev={badgeState === 'revision'}>
              <div class="inbox-card-top">
                <h3 class="inbox-card-title">
                  {task.status_move ? 'Status approval' : 'Task approval'}
                </h3>
                <span class={`appr a-${badgeState}`}>
                  <i class="appr-dot" aria-hidden="true"></i>
                  {badgeText}
                </span>
              </div>

              <p class="inbox-task-name">{task.title}</p>

              <p class="inbox-reviewer">
                {badgeState === 'approved' ? 'Reviewer' : 'Diajukan'}:
                <strong>{actor}</strong>
                <span aria-hidden="true">·</span>
                {when}
              </p>

              <label class="inbox-masukan">
                <span>Masukan</span>
                {#if canAct}
                  <textarea
                    rows="3"
                    placeholder="Tulis catatan review…"
                    value={Object.hasOwn(reviewNotes, task.id) ? reviewNotes[task.id] : existingNote}
                    oninput={(e) => setInboxNote(task.id, /** @type {HTMLTextAreaElement} */ (e.currentTarget).value)}
                  ></textarea>
                {:else}
                  <textarea
                    rows="3"
                    readonly
                    value={existingNote || (badgeState === 'revision' ? 'Menunggu perbaikan dari teknis.' : 'Belum ada masukan.')}
                  ></textarea>
                {/if}
              </label>

              {#if canAct}
                <label class="inbox-file">
                  <span>Lampiran bukti (opsional, max 900 KB)</span>
                  <input type="file" onchange={(e) => onReviewFile(task.id, e)} />
                  {#if reviewFileLabels[task.id]}
                    <em>{reviewFileLabels[task.id]}</em>
                  {/if}
                </label>
              {/if}

              <div class="inbox-acts">
                {#if canAct}
                  <button type="button" class="act approve" onclick={() => cardApprove(task.id)}>Setujui</button>
                  <button type="button" class="act reject" onclick={() => cardReject(task.id)}>Tolak</button>
                {:else if canResubmit && role !== 'viewer'}
                  <button type="button" class="act approve" onclick={() => resubmitModuleTask(task.id)}>
                    Ajukan ulang
                  </button>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <div class="board-rail">
      <div class="board">
        {#each workflowColumns as col}
          {@const cards = tasksByColumn(col.key, selectedDashboard).filter(inRequirement)}
          <div
            class="column tone-{columnTone[col.key] || 'sand'}"
            class:drop={overColumn === col.key}
            style="--status-color: {workflowStatusColor(col.key)}"
            ondragover={(e) => onDragOver(e, col.key)}
            ondragleave={() => {
              if (overColumn === col.key) overColumn = null
            }}
            ondrop={(e) => onDrop(e, col.key)}
            role="list"
            aria-label={col.label}
          >
            <header>
              <div class="head-main">
                <span class="status-mark" aria-hidden="true"></span>
                <div>
                  <h3>{col.label}</h3>
                  <p>Drag antar kolom</p>
                </div>
              </div>
              <span class="count">{cards.length}</span>
            </header>

            <div class="cards" class:is-empty={cards.length === 0}>
              {#each cards as task (task.id)}
                {@const comment = latestComment(task)}
                {@const comments = task.comments || []}
                <article
                  class="card"
                  class:dragging={dragId === task.id}
                  class:late={isOverdue(task)}
                  class:commenting={commentOpenId === task.id}
                  class:pending-move={Boolean(task.status_move)}
                  draggable={canDragTask(task) && commentOpenId !== task.id && !task.status_move}
                  ondragstart={(e) => onDragStart(e, task.id)}
                  ondragend={onDragEnd}
                  onclick={(e) => onCardClick(e, task.id)}
                  role="listitem"
                >
                  <div class="card-body">
                    {#if task.status_move}
                      <span class="move-badge">
                        Menunggu PM · → {workflowLabel(task.status_move.to)}
                      </span>
                    {/if}
                    <button
                      type="button"
                      class="card-title-link"
                      onclick={(e) => { e.stopPropagation(); goToCardDetail(task.id) }}
                      title="Buka detail task"
                    >
                      {task.title}
                    </button>
                    <div class="foot">
                      <span class="due">{formatDate(task.deadline)}</span>
                    </div>
                    <div class="pic-row">
                      <i class="face">{initials(task.assignee || task.pic)}</i>
                      <span>{task.assignee || task.pic}</span>
                    </div>

                    <div class="card-comments">
                      {#if comments.length > 0}
                        <ul class="c-list">
                          {#each comments.slice(0, 2) as c (c.id)}
                            <li>
                              <span class="c-actor">{c.actor.split(' ')[0]}</span>
                              {c.body}
                            </li>
                          {/each}
                        </ul>
                        {#if comments.length > 2}
                          <p class="c-more">+{comments.length - 2} komentar lain</p>
                        {/if}
                      {:else if comment}
                        <p class="card-comment">{comment.body}</p>
                      {/if}

                      {#if canComment}
                        {#if commentOpenId === task.id}
                          <form
                            class="c-form"
                            onsubmit={(e) => submitCardComment(e, task.id)}
                            onmousedown={(e) => e.stopPropagation()}
                          >
                            <textarea
                              rows="2"
                              bind:value={commentDraft}
                              placeholder="Tulis komentar…"
                              onkeydown={(e) => e.stopPropagation()}
                            ></textarea>
                            <div class="c-acts">
                              <button type="button" class="c-ghost" onclick={() => toggleComment(task.id)}>Batal</button>
                              <button type="submit" class="c-send">Kirim</button>
                            </div>
                          </form>
                        {:else}
                          <button
                            type="button"
                            class="c-toggle"
                            onclick={(e) => {
                              e.stopPropagation()
                              toggleComment(task.id)
                            }}
                            onmousedown={(e) => e.stopPropagation()}
                          >
                            {comments.length > 0 ? `Komentar (${comments.length})` : '+ Komentar'}
                          </button>
                        {/if}
                      {:else if comments.length > 0}
                        <span class="c-count-only">{comments.length} komentar</span>
                      {/if}
                    </div>
                  </div>
                </article>
              {:else}
                <p class="empty">Belum ada task</p>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

{#if moveTask && moveConfirmTo}
  <div class="backdrop" use:portal role="presentation" onclick={closeMoveConfirm} onkeydown={onKeydown}>
    <div
      class="modal liquidGlass-wrapper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-req-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      <div class="liquidGlass-effect"></div>
      <div class="liquidGlass-tint"></div>
      <div class="liquidGlass-shine"></div>
      <div class="modal-body">
        <div class="modal-head">
          <div>
            <h2 id="move-req-title">Ajukan pindah status</h2>
            <p>
              {workflowLabel(moveTask.status)} → <strong>{workflowLabel(moveConfirmTo)}</strong>
              · menunggu PM ({pmOfDashboard(moveTask.dashboard) || '—'})
            </p>
          </div>
          <button type="button" class="close" aria-label="Tutup" onclick={closeMoveConfirm}>×</button>
        </div>
        <div class="review-summary">
          <strong>{moveTask.title}</strong>
        </div>
        <label>
          <span>Catatan (opsional)</span>
          <textarea rows="2" bind:value={moveNote} placeholder="Alasan pindah kolom…"></textarea>
        </label>
        <label class="file-field">
          <span>Bukti pengerjaan (opsional, max 900 KB)</span>
          <input type="file" onchange={onMoveFile} />
          {#if moveFileLabel}<em class="file-name">{moveFileLabel}</em>{/if}
        </label>
        {#if moveMsg}<p class="error">{moveMsg}</p>{/if}
        <div class="actions">
          <button type="button" class="ghost" onclick={closeMoveConfirm}>Batal</button>
          <button type="button" class="primary" onclick={submitMoveRequest}>Kirim ke PM</button>
        </div>
      </div>
    </div>
  </div>
{/if}

<PmCreateTaskModal
  open={createTaskOpen}
  dashboard={selectedDashboard}
  onClose={() => (createTaskOpen = false)}
/>

<style>
  :global(.submenu-head .actions select.req-filter) {
    max-width: 240px;
  }

  .page {
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .tab {
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.7);
    border-radius: 999px;
    padding: 7px 14px;
    font: inherit;
    font-size: 0.61rem;
    font-weight: 650;
    color: #4a6080;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .tab.on {
    background: #0f1b2e;
    border-color: #0f1b2e;
    color: #fff;
  }

  .tab-count {
    font-size: 0.54rem;
    font-weight: 750;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    background: rgba(50, 140, 230, 0.18);
    color: inherit;
  }

  .tab.on .tab-count {
    background: rgba(255, 255, 255, 0.2);
  }

  .tab-alert {
    font-size: 0.52rem;
    font-weight: 750;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: #e11d48;
    color: #fff;
    display: grid;
    place-items: center;
  }

  .tab-hint {
    margin: 0 0 0 auto;
    font-size: 0.56rem;
    color: #8a9bb0;
    font-weight: 550;
  }

  .inbox-rail {
    flex: 1;
    min-height: 0;
    overflow: auto;
    border-radius: 18px;
    padding: 14px;
    background: #f3f5f8;
    border: 1px solid rgba(15, 40, 80, 0.06);
  }

  .inbox-empty {
    margin: 0;
    padding: 2rem 1rem;
    text-align: center;
    color: #7a90a8;
    font-size: 0.68rem;
    font-weight: 550;
  }

  .inbox-list {
    display: grid;
    gap: 12px;
    max-width: 440px;
  }

  .inbox-card {
    display: grid;
    gap: 10px;
    padding: 16px 18px;
    border-radius: 18px;
    background: #fff;
    border: 1px solid rgba(15, 40, 80, 0.1);
    box-shadow: 0 2px 10px rgba(15, 40, 80, 0.04);
  }

  .inbox-card.rev {
    border-color: rgba(208, 137, 42, 0.4);
  }

  .inbox-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .inbox-card-title {
    margin: 0;
    font-size: 0.84rem;
    font-weight: 750;
    color: #2a2a2a;
    letter-spacing: -0.01em;
    line-height: 1.3;
  }

  .inbox-task-name {
    margin: -4px 0 0;
    font-size: 0.66rem;
    font-weight: 600;
    color: #5a7088;
    line-height: 1.35;
  }

  .inbox-reviewer {
    margin: 0;
    font-size: 0.62rem;
    color: #8a8a8a;
    font-weight: 500;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
  }

  .inbox-reviewer strong {
    font-weight: 700;
    color: #4a4a4a;
  }

  .appr {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.56rem;
    font-weight: 700;
    border-radius: 999px;
    padding: 0.28rem 0.65rem;
    flex-shrink: 0;
    max-width: 100%;
  }

  .appr-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: currentColor;
    flex-shrink: 0;
  }

  .a-pending {
    background: #e8f1fb;
    color: #3a6ea5;
  }

  .a-revision {
    background: #f8eedc;
    color: #9a6a20;
  }

  .a-approved {
    background: #e5f3ea;
    color: #3d7a55;
  }

  .inbox-masukan {
    display: grid;
    gap: 6px;
    margin: 2px 0 0;
  }

  .inbox-masukan > span {
    font-size: 0.66rem;
    font-weight: 750;
    color: #2a2a2a;
  }

  .inbox-masukan textarea {
    width: 100%;
    resize: vertical;
    min-height: 72px;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: #f3f3f3;
    padding: 10px 12px;
    font: inherit;
    font-size: 0.64rem;
    color: #5a5a5a;
    line-height: 1.45;
  }

  .inbox-masukan textarea:focus {
    outline: none;
    border-color: rgba(15, 40, 80, 0.28);
    background: #f7f7f7;
  }

  .inbox-masukan textarea[readonly] {
    cursor: default;
    color: #6a6a6a;
  }

  .inbox-file,
  .file-field {
    display: grid;
    gap: 6px;
    margin-top: 8px;
    font-size: 0.72rem;
    font-weight: 650;
    color: #4a6080;
  }

  .inbox-file input,
  .file-field input {
    font: inherit;
    font-size: 0.75rem;
    font-weight: 550;
  }

  .inbox-file em,
  .file-name {
    font-style: normal;
    font-weight: 650;
    color: #2a6cb0;
  }

  .inbox-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 2px;
  }

  .act {
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 8px 16px;
    font: inherit;
    font-size: 0.62rem;
    font-weight: 700;
    cursor: pointer;
  }

  .act.approve {
    background: #2f7a52;
    color: #fff;
  }

  .act.approve:hover {
    background: #26693f;
  }

  .act.revise {
    background: #fff;
    border-color: rgba(0, 0, 0, 0.14);
    color: #6a6a6a;
  }

  .act.revise:hover {
    background: #f7f7f7;
  }

  .act.reject {
    background: #e8a0a0;
    color: #fff;
  }

  .act.reject:hover {
    background: #de8f8f;
  }

  @media (max-width: 640px) {
    .inbox-list {
      max-width: none;
    }

    .inbox-card-top {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .board-rail {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 14px;
    border-radius: 28px;
    overflow: hidden;
    background:
      radial-gradient(90% 120% at 100% 0%, rgba(51, 158, 245, 0.45), transparent 55%),
      radial-gradient(80% 100% at 0% 100%, rgba(5, 58, 131, 0.55), transparent 50%),
      linear-gradient(125deg, #042a5c 0%, #053a83 28%, #065fc6 68%, #339ef5 100%);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow:
      0 10px 28px rgba(5, 58, 131, 0.28),
      inset 1px 1px 0 rgba(255, 255, 255, 0.2);
  }

  .board {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(6, minmax(210px, 1fr));
    align-items: start;
    gap: 12px;
    overflow: auto;
    padding: 2px;
  }

  .column {
    min-width: 0;
    min-height: 300px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-radius: 20px;
    padding: 14px 12px;
    background: linear-gradient(160deg, #f7fbff 0%, #eef5fc 100%);
    border: 1.5px solid rgba(120, 170, 220, 0.4);
    border-top: 3px solid var(--status-color, rgba(120, 170, 220, 0.55));
    box-shadow:
      0 6px 16px rgba(4, 40, 90, 0.12),
      inset 1px 1px 0 rgba(255, 255, 255, 0.95);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
  }

  .column.drop {
    border-color: rgba(50, 140, 230, 0.75);
    box-shadow:
      0 0 0 2px rgba(51, 158, 245, 0.28),
      0 8px 20px rgba(4, 40, 90, 0.18),
      inset 1px 1px 0 rgba(255, 255, 255, 1);
  }

  .tone-sand {
    border-color: rgba(80, 150, 210, 0.52);
  }
  .tone-sky {
    border-color: rgba(50, 140, 230, 0.58);
  }
  .tone-lavender {
    border-color: rgba(120, 140, 210, 0.55);
  }
  .tone-peach {
    border-color: rgba(100, 160, 220, 0.55);
  }
  .tone-rose {
    border-color: rgba(90, 120, 200, 0.55);
  }
  .tone-mint {
    border-color: rgba(70, 170, 190, 0.55);
  }

  .column > header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }

  .head-main {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
  }

  .status-mark {
    width: 8px;
    height: 8px;
    margin-top: 0.35rem;
    border-radius: 999px;
    flex-shrink: 0;
    background: var(--status-color, #94a3b8);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--status-color, #94a3b8) 18%, transparent);
  }

  .column h3 {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 750;
    color: #0f1b2e;
  }

  .column > header p {
    margin: 2px 0 0;
    font-size: 0.56rem;
    font-weight: 500;
    color: rgba(42, 80, 128, 0.72);
  }

  .count {
    font-size: 0.56rem;
    font-weight: 750;
    border-radius: 999px;
    padding: 0.22rem 0.55rem;
    background: color-mix(in srgb, var(--status-color, #065fc6) 16%, #ffffff);
    color: color-mix(in srgb, var(--status-color, #065fc6) 72%, #0f1b2e);
  }

  .cards {
    display: grid;
    gap: 10px;
    align-content: start;
    flex: 1;
  }

  .cards.is-empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card {
    border-radius: 16px;
    background: linear-gradient(160deg, #ffffff 0%, #f4f8fc 100%);
    border: 1.5px solid rgba(120, 170, 220, 0.38);
    box-shadow:
      0 4px 12px rgba(4, 40, 90, 0.1),
      inset 1px 1px 0 rgba(255, 255, 255, 0.95);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, border-color 0.15s ease;
  }

  .card.commenting {
    cursor: default;
    border-color: rgba(50, 140, 230, 0.55);
  }

  .card:hover {
    transform: translateY(-1px);
    border-color: rgba(50, 140, 230, 0.55);
  }

  .card.dragging {
    opacity: 0.5;
  }

  .card.late {
    border-color: rgba(80, 120, 200, 0.55);
  }

  .card.pending-move {
    border-color: rgba(224, 164, 90, 0.55);
  }

  .move-badge {
    display: inline-block;
    margin-bottom: 0.35rem;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    font-size: 0.54rem;
    font-weight: 700;
    background: #fef3c7;
    color: #92400e;
  }

  .card-body {
    display: grid;
    gap: 0.4rem;
    padding: 0.85rem 0.9rem;
    color: inherit;
  }

  .card strong {
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1.35;
    color: #0f1b2e;
  }

  .card-title-link {
    display: block;
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    text-align: left;
    font: inherit;
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1.35;
    color: #0f1b2e;
    cursor: pointer;
  }

  .card-title-link:hover {
    color: #065fc6;
    text-decoration: underline;
  }

  .card-comments {
    display: grid;
    gap: 6px;
    margin-top: 2px;
    padding-top: 6px;
    border-top: 1px solid rgba(120, 170, 220, 0.25);
  }

  .c-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }

  .c-list li {
    font-size: 0.54rem;
    color: #4a6080;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .c-actor {
    font-weight: 750;
    color: #2a6cb0;
    margin-right: 4px;
  }

  .c-more {
    margin: 0;
    font-size: 0.5rem;
    color: #8a9bb0;
    font-weight: 600;
  }

  .c-toggle,
  .c-count-only {
    border: none;
    background: transparent;
    padding: 0;
    font: inherit;
    font-size: 0.54rem;
    font-weight: 700;
    color: #2a6cb0;
    cursor: pointer;
    text-align: left;
  }

  .c-count-only {
    cursor: default;
    color: #7a90a8;
  }

  .c-form {
    display: grid;
    gap: 6px;
  }

  .c-form textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(50, 140, 230, 0.35);
    border-radius: 10px;
    padding: 8px;
    font: inherit;
    font-size: 0.56rem;
    resize: vertical;
    background: #fff;
  }

  .c-acts {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }

  .c-ghost,
  .c-send {
    border: none;
    border-radius: 999px;
    padding: 5px 10px;
    font: inherit;
    font-size: 0.54rem;
    font-weight: 650;
    cursor: pointer;
  }

  .c-ghost {
    background: transparent;
    color: #6b6b6b;
  }

  .c-send {
    background: #0f1b2e;
    color: #fff;
  }

  .review-summary {
    display: grid;
    gap: 6px;
    padding: 12px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .review-summary strong {
    font-size: 0.76rem;
  }

  .review-summary p {
    margin: 0;
    font-size: 0.61rem;
    color: #5a7088;
    line-height: 1.4;
  }

  .review-acts {
    flex-wrap: wrap;
  }

  .ghost.warn {
    color: #9a6a20;
  }

  .foot {
    display: flex;
    justify-content: space-between;
    gap: 0.4rem;
    align-items: center;
  }

  .due {
    font-size: 0.56rem;
    color: rgba(42, 80, 128, 0.72);
    font-weight: 600;
  }

  .pic-row {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.56rem;
    color: #2a5080;
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
    background: rgba(50, 140, 230, 0.16);
    color: #2a6cb0;
  }

  .empty {
    margin: 0;
    padding: 1.4rem 0.5rem;
    text-align: center;
    color: rgba(42, 80, 128, 0.55);
    font-size: 0.61rem;
    font-weight: 550;
    border: 1.5px dashed rgba(100, 160, 220, 0.4);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.45);
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(20, 22, 30, 0.45);
    display: grid;
    place-items: center;
    padding: 20px;
  }

  .modal {
    position: relative;
    width: min(480px, 100%);
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1);
  }

  .liquidGlass-effect {
    position: absolute;
    z-index: 0;
    inset: 0;
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    pointer-events: none;
  }

  .liquidGlass-tint {
    z-index: 1;
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.25);
    pointer-events: none;
  }

  .liquidGlass-shine {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    box-shadow:
      inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5),
      inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5);
  }

  .modal-body {
    position: relative;
    z-index: 3;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.55);
  }

  .modal-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .modal-head h2 {
    margin: 0;
    font-size: 0.86rem;
    font-weight: 750;
  }

  .modal-head p {
    margin: 4px 0 0;
    font-size: 0.61rem;
    color: #6b6b6b;
  }

  .close {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.06);
    color: #1a1a1a;
    font-size: 0.95rem;
    line-height: 1;
    cursor: pointer;
  }

  .modal-body label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .modal-body label span {
    font-size: 0.56rem;
    font-weight: 600;
    color: #6b6b6b;
  }

  .modal-body input,
  .modal-body select,
  .modal-body textarea {
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: 10px 12px;
    font: inherit;
    font-size: 0.68rem;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .error {
    margin: 0;
    font-size: 0.59rem;
    color: #b42318;
    font-weight: 600;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
  }

  .ghost,
  .primary {
    border: none;
    border-radius: 999px;
    padding: 10px 16px;
    font: inherit;
    font-size: 0.65rem;
    font-weight: 650;
    cursor: pointer;
  }

  .ghost {
    background: transparent;
    color: #5a5a5a;
  }

  .primary {
    background: #1a1a1a;
    color: #fff;
  }

  @media (max-width: 1200px) {
    .board {
      grid-template-columns: repeat(3, minmax(220px, 1fr));
    }
  }

  @media (max-width: 720px) {
    .board {
      grid-template-columns: minmax(260px, 1fr);
    }

    .row {
      grid-template-columns: 1fr;
    }

    .tab-hint {
      margin-left: 0;
      width: 100%;
    }
  }
</style>
