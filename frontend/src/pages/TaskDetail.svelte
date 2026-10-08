<script>
  import { link, push } from 'svelte-spa-router'
  import GlassPanel from '../lib/GlassPanel.svelte'
  import {
    getModuleTask,
    loadModuleTaskDetail,
    moveModuleTask,
    deleteModuleTask,
    rememberDetailId,
    workflowColumns,
    workflowLabel,
    workflowStatusColor,
    isOverdue,
    taskModuleStore,
    addTaskComment,
    canUpdateBoard,
    canCommentOnTask,
    approveModuleTask,
    requestRevisionModuleTask,
    resubmitModuleTask,
    approveStatusMove,
    rejectStatusMove,
    isCurrentUserPmOf,
    currentUserName,
    currentUserRole,
    readEvidenceFile,
  } from '../lib/taskModuleStore.svelte.js'
  import { formatDate } from '../lib/format.js'

  let { params = {} } = $props()

  let nextStatus = $state(/** @type {'backlog' | 'development' | 'testing' | 'uat' | 'to_production' | 'selesai'} */ ('backlog'))
  let commentBody = $state('')
  let commentEvidence = $state(/** @type {import('../lib/taskModuleStore.svelte.js').EvidenceFile | null} */ (null))
  let commentFileLabel = $state('')
  /** @type {HTMLInputElement | null} */
  let commentPicker = $state(null)
  let msg = $state('')
  let lastLoadedId = $state(/** @type {string | null} */ (null))

  const task = $derived.by(() => {
    void taskModuleStore.items
    return params?.id ? getModuleTask(params.id) : null
  })

  const canEdit = $derived.by(() => {
    void taskModuleStore.session
    void taskModuleStore.items
    if (!task) return false
    return currentUserRole() === 'pm' && isCurrentUserPmOf(task.dashboard)
  })

  const canComment = $derived.by(() => {
    void taskModuleStore.session
    return canCommentOnTask()
  })

  const role = $derived.by(() => {
    void taskModuleStore.session
    return currentUserRole()
  })

  const asPm = $derived.by(() => {
    void taskModuleStore.session
    return task ? isCurrentUserPmOf(task.dashboard) : false
  })

  /** Approve/minta-revisi task baru adalah hak owner requirement-nya, bukan PM dashboard. */
  const asRequirementOwner = $derived.by(() => {
    void taskModuleStore.session
    return task ? task.requirement_owner === currentUserName() : false
  })

  /** Owner requirement boleh ubah status task-nya sendiri juga, apa pun role-nya (termasuk Admin). */
  const canBoard = $derived.by(() => {
    void taskModuleStore.session
    return canUpdateBoard() || asRequirementOwner
  })

  const journey = $derived.by(() => {
    if (!task) return []
    /** @type {Set<number>} */
    const used = new Set()
    /** @param {number | null | undefined} id */
    function takeFile(id) {
      const file = evidenceById(id)
      if (!file || used.has(file.id)) return null
      used.add(file.id)
      return file
    }
    /** @type {{ key: string, at: string, actor: string, kind: 'event' | 'note', text: string, file: import('../lib/taskModuleStore.svelte.js').TaskEvidence | null }[]} */
    const rows = []
    for (const entry of task.activity || []) {
      if (entry.action === 'Menambah komentar') continue
      rows.push({
        key: `a-${entry.id}`,
        at: entry.at,
        actor: entry.actor,
        kind: 'event',
        text: entry.action,
        file: takeFile(entry.evidence_id),
      })
    }
    for (const entry of task.comments || []) {
      rows.push({
        key: `c-${entry.id}`,
        at: entry.at,
        actor: entry.actor,
        kind: 'note',
        text: entry.body,
        file: takeFile(entry.evidence_id),
      })
    }
    const pendingFile = takeFile(task.status_move?.evidence_id)
    if (pendingFile) {
      const host = [...rows].reverse().find((row) => row.text.startsWith('Ajukan pindah') && !row.file)
      if (host) host.file = pendingFile
      else {
        rows.push({
          key: `e-${pendingFile.id}`,
          at: pendingFile.at,
          actor: pendingFile.actor,
          kind: 'event',
          text: pendingFile.note || pendingFile.name,
          file: pendingFile,
        })
      }
    }
    for (const file of task.evidences || []) {
      if (used.has(file.id)) continue
      used.add(file.id)
      rows.push({
        key: `e-${file.id}`,
        at: file.at,
        actor: file.actor,
        kind: file.kind === 'comment' ? 'note' : 'event',
        text: file.note || file.name,
        file,
      })
    }
    return rows.sort((a, b) => a.at.localeCompare(b.at) || a.key.localeCompare(b.key))
  })

  /** @type {'today' | 'week' | 'all'} */
  let journeyRange = $state('all')

  /** @param {string} at @param {'today' | 'week' | 'all'} range */
  function inJourneyRange(at, range) {
    if (range === 'all') return true
    const when = new Date(at.replace(' ', 'T'))
    if (Number.isNaN(when.getTime())) return true
    const now = new Date()
    if (range === 'today') return when.toDateString() === now.toDateString()
    const start = new Date(now)
    const day = start.getDay()
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1))
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return when >= start && when < end
  }

  const visibleJourney = $derived(journey.filter((row) => inJourneyRange(row.at, journeyRange)))

  /** @type {import('../lib/taskModuleStore.svelte.js').TaskEvidence | null} */
  let viewing = $state(null)

  $effect(() => {
    const id = params?.id || null
    if (!id || lastLoadedId === id) return
    const item = getModuleTask(id)
    if (!item) return

    lastLoadedId = id
    rememberDetailId(id)
    nextStatus = item.status
    msg = ''
    loadModuleTaskDetail(id)
  })

  function clearReply() {
    commentBody = ''
    commentEvidence = null
    commentFileLabel = ''
    if (commentPicker) commentPicker.value = ''
  }

  async function onReply(event) {
    event.preventDefault()
    if (!task || !canComment) return
    if (!commentBody.trim() && !commentEvidence) return
    await addTaskComment(task.id, commentBody, commentEvidence)
    clearReply()
    await loadModuleTaskDetail(task.id)
  }

  async function onMove(event) {
    event?.preventDefault?.()
    if (!task || !canBoard) return
    if (task.status_move) {
      msg = 'Sudah ada request pindah yang menunggu tanggapan PM'
      return
    }
    const taskId = task.id
    const result = await moveModuleTask(taskId, nextStatus, {
      note: commentBody,
      evidence: commentEvidence,
    })
    if (result === 'requested') {
      msg = `Pengajuan pindah ke ${workflowLabel(nextStatus)} tercatat`
      clearReply()
    } else if (result === 'moved') {
      msg = `Status diubah ke ${workflowLabel(nextStatus)}`
      clearReply()
    } else {
      msg = 'Gagal mengubah status'
    }
    await loadModuleTaskDetail(taskId)
  }

  async function onDelete() {
    if (!task || !canEdit) return
    if (!confirm(`Hapus task "${task.title}"?`)) return
    await deleteModuleTask(task.id)
    push('/tasks/list')
  }

  async function onApproveMove() {
    if (!task?.status_move || (!asPm && !asRequirementOwner)) return
    const taskId = task.id
    await approveStatusMove(taskId, commentBody, commentEvidence)
    clearReply()
    msg = 'Pindah status disetujui dan tercatat di riwayat'
    await loadModuleTaskDetail(taskId)
  }

  async function onRejectMove() {
    if (!task?.status_move || (!asPm && !asRequirementOwner)) return
    const taskId = task.id
    await rejectStatusMove(taskId, commentBody || 'Perlu revisi sebelum pindah status.', commentEvidence)
    clearReply()
    msg = 'Permintaan revisi tercatat di riwayat'
    await loadModuleTaskDetail(taskId)
  }

  /** @param {Event} e */
  async function onPickFile(e) {
    const input = /** @type {HTMLInputElement} */ (e.currentTarget)
    const file = input.files?.[0]
    if (!file) {
      commentEvidence = null
      commentFileLabel = ''
      return
    }
    try {
      commentEvidence = await readEvidenceFile(file)
      commentFileLabel = file.name
      msg = ''
    } catch (err) {
      msg = err instanceof Error ? err.message : 'Gagal membaca file'
    }
  }

  async function onApproveTask() {
    if (!task) return
    const taskId = task.id
    await approveModuleTask(taskId, commentBody, commentEvidence)
    clearReply()
    await loadModuleTaskDetail(taskId)
  }

  async function onRequestRevisionTask() {
    if (!task) return
    const taskId = task.id
    await requestRevisionModuleTask(taskId, commentBody || 'Perlu revisi.')
    clearReply()
    msg = 'Revisi tercatat'
    await loadModuleTaskDetail(taskId)
  }

  async function onResubmitTask() {
    if (!task) return
    const taskId = task.id
    await resubmitModuleTask(taskId)
    await loadModuleTaskDetail(taskId)
  }

  /** @param {number | null | undefined} id */
  function evidenceById(id) {
    if (!task || !id) return null
    return task.evidences?.find((item) => item.id === id) || null
  }
</script>

<section class="page">
  {#if !task}
    <GlassPanel>
      <p class="state error">Task tidak ditemukan.</p>
      <a class="pill on back-link" href="/tasks/board" use:link>← Kembali ke Board</a>
    </GlassPanel>
  {:else}
    <div class="layout">
      <GlassPanel class="span-2">
        <div class="hero">
          <div class="strip">
            <a class="back" href="/tasks/board" use:link aria-label="Kembali ke board">←</a>
            <div class="strip-copy">
              <div class="meta">
                <span class="mono-id">{task.code}</span>
                <span class={`chip st-${task.status}`}>{workflowLabel(task.status)}</span>
                {#if task.status_move}
                  <span class="chip appr-pending">Menunggu PM · {workflowLabel(task.status_move.to)}</span>
                {/if}
                {#if isOverdue(task)}
                  <span class="chip late">Overdue</span>
                {/if}
              </div>
              <h2>{task.title}</h2>
              <p class="meta-line">
                {task.assignee || task.pic} · {task.dashboard} · {task.requirement_code || 'tanpa requirement'} · {formatDate(task.deadline)}
              </p>
            </div>
          </div>
        </div>
      </GlassPanel>

      <div class="flow-rail span-2">
        <div class="panel-title">
          <div>
            <p class="eyebrow">Workflow</p>
            <h3>Status</h3>
          </div>
        </div>
        <div class="flow">
          {#each workflowColumns as col, i}
            {@const idx = workflowColumns.findIndex((c) => c.key === task.status)}
            <div
              class="flow-col"
              class:done={i < idx}
              class:current={i === idx}
              style={`--status-color: ${workflowStatusColor(col.key)}`}
            >
              <span class="status-mark" aria-hidden="true"></span>
              <span class="flow-label">{col.label}</span>
            </div>
          {/each}
        </div>
      </div>

      <GlassPanel class="span-2">
        <div class="panel-title">
          <div>
            <p class="eyebrow">Riwayat</p>
            <h3>Journey task</h3>
          </div>
          <div class="range-pills" role="group" aria-label="Filter waktu">
            <button type="button" class:on={journeyRange === 'today'} onclick={() => (journeyRange = 'today')}>Hari ini</button>
            <button type="button" class:on={journeyRange === 'week'} onclick={() => (journeyRange = 'week')}>Minggu ini</button>
            <button type="button" class:on={journeyRange === 'all'} onclick={() => (journeyRange = 'all')}>Semua</button>
          </div>
        </div>

        {#if journey.length === 0}
          <p class="empty">Belum ada catatan. Teknis dan PM bisa menulis di sini, termasuk lampiran gambar.</p>
        {:else if visibleJourney.length === 0}
          <p class="empty">{journeyRange === 'today' ? 'Tidak ada catatan hari ini.' : 'Tidak ada catatan minggu ini.'}</p>
        {:else}
          <ol class="journey">
            {#each visibleJourney as row (row.key)}
              <li class:note={row.kind === 'note'} class:event={row.kind === 'event'}>
                <div class="entry">
                  <strong>{row.actor}</strong>
                  <div class="entry-body">
                    {#if row.text}
                      <p class:event-text={row.kind === 'event'} class:note-text={row.kind === 'note'}>{row.text}</p>
                    {/if}
                    {#if row.file}
                      <button type="button" class="file-card" onclick={() => (viewing = row.file)}>
                        {#if row.file.mime.startsWith('image/')}
                          <img src={row.file.file_url} alt="" />
                        {:else}
                          <span class="file-ico" aria-hidden="true">FILE</span>
                        {/if}
                        <span class="file-meta">
                          <strong>{row.file.name}</strong>
                        </span>
                      </button>
                    {/if}
                  </div>
                  <time>{row.at}</time>
                </div>
              </li>
            {/each}
          </ol>
        {/if}

        {#if canComment || canBoard}
          <form class="composer" onsubmit={onReply}>
            <div class="composer-head">
              <p class="eyebrow">Tanggapan</p>
              {#if task.status_move && asPm}
                <p class="reply-context">
                  {task.status_move.requested_by} mengajukan {workflowLabel(task.status_move.from)} → {workflowLabel(task.status_move.to)}. Tulis catatan, lalu pilih satu keputusan.
                </p>
              {:else if task.status_move}
                <p class="reply-context">
                  Pengajuan {workflowLabel(task.status_move.from)} → {workflowLabel(task.status_move.to)} menunggu PM.
                </p>
              {:else}
                <p class="reply-context">Catatan dan gambar akan masuk ke riwayat task.</p>
              {/if}
            </div>
            <div class="reply-field">
              <textarea rows="2" bind:value={commentBody} placeholder="Tulis tanggapan…"></textarea>
              <div class="reply-tools">
                {#if commentEvidence?.previewUrl}
                  <img class="thumb" src={commentEvidence.previewUrl} alt="" />
                  <span class="clip-name">{commentFileLabel}</span>
                {/if}
                <button type="button" class="clip" aria-label="Lampirkan gambar" title="Lampirkan gambar" onclick={() => commentPicker?.click()}>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8.5 12.5 14.2 6.8a3 3 0 0 1 4.2 4.2l-7.4 7.4a4.5 4.5 0 0 1-6.4-6.4l7.2-7.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <input bind:this={commentPicker} class="sr" type="file" accept="image/*" onchange={onPickFile} />
              </div>
            </div>
            <div class="decision">
              {#if (asPm || asRequirementOwner) && task.status_move}
                <button type="button" class="primary" onclick={onApproveMove}>Setujui ke {workflowLabel(task.status_move.to)}</button>
                <button type="button" class="ghost-btn" onclick={onRejectMove}>Minta revisi</button>
                {#if canComment}
                  <button type="submit" class="text-btn">Catat saja</button>
                {/if}
              {:else if asRequirementOwner && task.approval_state === 'pending'}
                <button type="button" class="primary" onclick={onApproveTask}>Setujui ke Backlog</button>
                <button type="button" class="ghost-btn" onclick={onRequestRevisionTask}>Minta revisi</button>
              {:else if task.approval_state === 'revision' && (task.created_by === currentUserName() || asRequirementOwner) && canBoard}
                <button type="button" class="ghost-btn" onclick={onResubmitTask}>Ajukan ulang</button>
                {#if canComment}
                  <button type="submit" class="primary">Kirim tanggapan</button>
                {/if}
              {:else}
                {#if canBoard && task.approval_state === 'approved' && !task.status_move}
                  <select bind:value={nextStatus} aria-label="Status tujuan">
                    {#each workflowColumns as col}
                      <option value={col.key}>{col.label}</option>
                    {/each}
                  </select>
                  <button type="button" class="ghost-btn" onclick={onMove}>
                    {role === 'teknis' ? 'Ajukan pindah' : 'Ubah status'}
                  </button>
                {/if}
                {#if canComment}
                  <button type="submit" class="primary">Kirim tanggapan</button>
                {/if}
              {/if}
            </div>
          </form>
        {:else}
          <p class="empty">Mode view — tanggapan tidak tersedia.</p>
        {/if}
        {#if canEdit}
          <button type="button" class="danger-btn" onclick={onDelete}>Hapus task</button>
        {/if}
        {#if msg}<p class="msg">{msg}</p>{/if}
      </GlassPanel>
    </div>

    {#if viewing}
      <div class="viewer" role="dialog" aria-modal="true" aria-label={viewing.name}>
        <button type="button" class="viewer-backdrop" aria-label="Tutup" onclick={() => (viewing = null)}></button>
        <div class="viewer-card">
          <div class="viewer-top">
            <strong>{viewing.name}</strong>
            <button type="button" class="ghost-btn" onclick={() => (viewing = null)}>Tutup</button>
          </div>
          {#if viewing.mime.startsWith('image/')}
            <img src={viewing.file_url} alt={viewing.name} />
          {:else}
            <a class="file-link" href={viewing.file_url} download={viewing.name}>Unduh {viewing.name}</a>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</section>

<style>
  .page {
    flex: 1;
    min-height: 0;
    height: 100%;
    width: 100%;
    overflow: auto;
    padding-bottom: 1.25rem;
    font-size: 0.76rem;
    line-height: 1.45;
    color: #1a1a1a;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    align-content: start;
  }

  .layout :global(.panel-glow.span-2),
  .flow-rail.span-2 {
    grid-column: 1 / -1;
  }

  .layout :global(.panel-glow .panel) {
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.85);
    padding: 18px 20px;
  }

  .hero { display: grid; }

  .strip {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .strip-copy { min-width: 0; display: grid; gap: 0.2rem; }

  .back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex: 0 0 auto;
    border-radius: 999px;
    background: #1a1a1a;
    color: #fff;
    text-decoration: none;
    font-size: 0.85rem;
  }

  .meta-line {
    margin: 0;
    color: #7a7a80;
    font-size: 0.66rem;
  }

  .journey {
    list-style: none;
    margin: 0.2rem 0 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }

  .journey li {
    border-radius: 12px;
    background: #f4f6f8;
  }

  .journey li.note { background: #eef5fc; }

  .entry {
    display: grid;
    grid-template-columns: 132px minmax(0, 1fr) auto;
    gap: 0.65rem;
    align-items: start;
    padding: 0.55rem 0.7rem;
  }

  .entry > strong { font-size: 0.7rem; padding-top: 0.05rem; }
  .entry time { color: #8e8e93; font-size: 0.6rem; white-space: nowrap; padding-top: 0.12rem; }

  .entry-body { display: grid; gap: 0.35rem; min-width: 0; }

  .event-text, .note-text { margin: 0; font-size: 0.72rem; line-height: 1.4; }
  .event-text { color: #5c5c62; }
  .note-text { color: #1a1a1a; }

  .file-card {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    width: fit-content;
    max-width: min(320px, 100%);
    margin-top: 0.2rem;
    padding: 0.35rem 0.6rem 0.35rem 0.35rem;
    border-radius: 12px;
    border: 1px solid rgba(15, 27, 46, 0.1);
    background: #fff;
    cursor: pointer;
    text-align: left;
    font: inherit;
  }

  .file-card img,
  .file-ico {
    width: 28px;
    height: 28px;
    flex: 0 0 auto;
    border-radius: 8px;
    object-fit: cover;
    background: #f3f6fa;
  }

  .file-ico {
    display: grid;
    place-items: center;
    font-size: 0.52rem;
    font-weight: 750;
    letter-spacing: 0.04em;
    color: #065fc6;
  }

  .file-meta { display: grid; gap: 0.1rem; min-width: 0; }
  .file-meta strong {
    font-size: 0.68rem;
    font-weight: 700;
    color: #0f1b2e;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .viewer {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    place-items: center;
    padding: 1.25rem;
  }

  .viewer-backdrop {
    position: absolute;
    inset: 0;
    border: 0;
    background: rgba(15, 23, 36, 0.55);
    cursor: pointer;
  }

  .viewer-card {
    position: relative;
    z-index: 1;
    width: min(720px, 100%);
    max-height: min(86vh, 820px);
    overflow: auto;
    padding: 0.85rem;
    border-radius: 18px;
    background: #fff;
    display: grid;
    gap: 0.7rem;
  }

  .viewer-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .viewer-top strong { font-size: 0.78rem; }

  .viewer-card img {
    width: 100%;
    max-height: 70vh;
    object-fit: contain;
    border-radius: 12px;
    background: #f4f7fb;
  }

  .thumb {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    border: 1px solid rgba(15, 27, 46, 0.08);
  }

  .composer {
    display: grid;
    gap: 0.4rem;
    margin-top: 0.65rem;
    padding: 0.55rem 0.6rem;
    border-radius: 14px;
    background: rgba(247, 251, 255, 0.95);
    border: 1px solid rgba(15, 27, 46, 0.08);
  }

  .composer-head { display: grid; gap: 0.15rem; }

  .reply-field {
    display: grid;
    gap: 0.2rem;
    padding: 0.35rem 0.35rem 0.3rem 0.15rem;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: #fff;
  }

  .reply-field textarea {
    border: 0;
    background: transparent;
    box-shadow: none;
    min-height: 0;
    padding: 0.35rem 0.45rem;
    resize: none;
  }

  .reply-tools {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.4rem;
  }

  .clip {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #1a1a1a;
    cursor: pointer;
  }

  .clip svg { width: 16px; height: 16px; }

  .clip-name {
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #5c6770;
    font-size: 0.64rem;
  }

  .attach-row, .decision {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
  }

  .decision {
    padding-top: 0.35rem;
    border-top: 1px solid rgba(15, 27, 46, 0.06);
  }

  .decision select {
    width: auto;
    min-width: 140px;
    height: 34px;
    margin-left: auto;
    padding-top: 0;
    padding-bottom: 0;
  }

  .text-btn {
    height: 34px;
    padding: 0 10px;
    border: 0;
    background: transparent;
    color: #5c6770;
    font: inherit;
    font-size: 0.68rem;
    font-weight: 650;
    cursor: pointer;
  }

  .reply-context {
    margin: 0;
    color: #5c6770;
    font-size: 0.68rem;
  }

  .danger-btn { margin-top: 0.65rem; }

  .pill {
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
  }

  .pill.on {
    color: #fff;
    background: #1a1a1a;
  }

  .back-link { width: fit-content; margin-top: 0.75rem; }

  .eyebrow {
    margin: 0;
    font-size: 0.54rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8e8e93;
  }

  .meta { display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; }

  h2 {
    margin: 0;
    font-size: 0.86rem;
    font-weight: 760;
    letter-spacing: -0.03em;
  }

  h3 { margin: 0; font-size: 0.82rem; font-weight: 750; }

  .flow-rail {
    padding: 14px 16px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.7);
  }

  .panel-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .range-pills {
    display: inline-flex;
    align-items: center;
    padding: 3px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .range-pills button {
    height: 28px;
    padding: 0 12px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #1a1a1a;
    font: inherit;
    font-size: 0.64rem;
    font-weight: 650;
    cursor: pointer;
  }

  .range-pills button.on {
    background: #1a1a1a;
    color: #fff;
  }

  .flow {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
  }

  .flow-col {
    display: grid;
    gap: 0.25rem;
    padding: 0.7rem 0.65rem;
    border-radius: 14px;
    background: #f7fbff;
    border: 1px solid rgba(120, 170, 220, 0.28);
    border-top: 3px solid var(--status-color, #94a3b8);
    opacity: 0.55;
  }

  .flow-col.done, .flow-col.current { opacity: 1; }
  .flow-col.current { box-shadow: 0 0 0 2px color-mix(in srgb, var(--status-color) 28%, transparent); }

  .status-mark {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--status-color, #94a3b8);
  }

  .flow-label { font-size: 0.68rem; font-weight: 700; color: #0f1b2e; }

  .empty, .state { color: #7a7a80; font-size: 0.68rem; }

  input, select, textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 0.6rem 0.75rem;
    font: inherit;
    font-size: 0.72rem;
  }

  .primary, .ghost-btn, .danger-btn {
    height: 34px;
    width: fit-content;
    padding: 0 14px;
    border-radius: 999px;
    font: inherit;
    font-size: 0.68rem;
    font-weight: 650;
    cursor: pointer;
  }

  .primary {
    border: none;
    background: #1a1a1a;
    color: #fff;
  }

  .ghost-btn {
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: #fff;
    color: #1a1a1a;
  }

  .danger-btn {
    border: none;
    background: transparent;
    color: #b42318;
    padding: 0;
  }

  .file-link {
    color: #065fc6;
    font-weight: 700;
    font-size: 0.72rem;
  }

  .msg { margin: 0; color: #2f6b4a; font-size: 0.68rem; font-weight: 650; }
  .mono-id { color: #8a8a90; font-weight: 700; font-size: 0.65rem; }

  .chip {
    display: inline-flex;
    padding: 0.18rem 0.5rem;
    border-radius: 999px;
    font-size: 0.56rem;
    font-weight: 700;
    background: rgba(0, 0, 0, 0.06);
  }

  .chip.late, .st-to_production { background: rgba(225, 29, 72, 0.12); color: #be123c; }
  .st-backlog { background: rgba(148, 163, 184, 0.22); color: #475569; }
  .st-development { background: rgba(6, 95, 198, 0.14); color: #065fc6; }
  .st-testing { background: rgba(124, 107, 196, 0.16); color: #5b4a9e; }
  .st-uat { background: rgba(224, 164, 90, 0.22); color: #9a6a20; }
  .st-selesai { background: rgba(47, 122, 82, 0.16); color: #2f7a52; }
  .appr-pending { background: rgba(50, 140, 230, 0.16); color: #2a6cb0; }

  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .state.error { color: #b42318; font-weight: 650; }
  .empty, .state { margin: 0; }

  @media (max-width: 900px) {
    .layout, .flow, .entry { grid-template-columns: 1fr; }
  }
</style>
