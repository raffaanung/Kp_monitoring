<script>
  import {
    createModuleTask,
    teknisAssignees,
    assigneeOptions,
    canCreateTask,
  } from './taskModuleStore.svelte.js'
  import {
    listRequirements,
    reqCode,
    versionRootId,
    reqVersionSuffix,
    getRequirement,
    requirementStore,
  } from './requirementStore.svelte.js'
  import { portal } from './portal.js'

  /**
   * Form PM: pecah requirement → task backlog + assign ke teknis.
   * @type {{
   *   open?: boolean,
   *   requirementId?: number | null,
   *   dashboard?: string,
   *   onClose?: () => void,
   *   onCreated?: (task: { id: number }) => void,
   * }}
   */
  let {
    open = false,
    requirementId = null,
    dashboard = '',
    onClose = () => {},
    onCreated = () => {},
  } = $props()

  let title = $state('')
  let description = $state('')
  let assignee = $state('')
  let deadline = $state('')
  let selectedReqId = $state(/** @type {string} */ (''))
  let error = $state('')

  function today() {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  /** Requirement yang jadi default saat modal dibuka dari dalam halaman requirement tertentu — tetap bisa diganti. */
  const presetReq = $derived.by(() => {
    void requirementStore.items
    return requirementId ? getRequirement(requirementId) : null
  })

  const reqChoices = $derived.by(() => {
    void requirementStore.items
    const dash = presetReq?.dashboard || dashboard
    if (!dash) return listRequirements({})
    return listRequirements({ dashboard: dash }).filter((r) => r.status !== 'done')
  })

  const activeReq = $derived.by(() => {
    void requirementStore.items
    if (selectedReqId === '' || selectedReqId == null) return null
    return getRequirement(String(selectedReqId))
  })

  const assigneeList = $derived.by(() => {
    const team = Array.isArray(activeReq?.team) ? activeReq.team.filter(Boolean) : []
    const rest = assigneeOptions().filter((n) => !team.includes(n))
    const base = [...team, ...rest]
    return base.length ? base : teknisAssignees()
  })

  $effect(() => {
    if (!open) return
    title = ''
    description = ''
    deadline = today()
    error = ''
    selectedReqId = requirementId || (reqChoices[0]?.id ?? '')
    const preferred = activeReq?.team?.[0] || assigneeList[0] || teknisAssignees()[0] || ''
    assignee = preferred
  })

  $effect(() => {
    if (!open) return
    // Saat ganti requirement, default assignee ke anggota tim requirement
    const next = activeReq?.team?.[0] || assigneeList[0] || ''
    if (next && (!assignee || !assigneeList.includes(assignee))) assignee = next
  })

  async function submit(event) {
    event.preventDefault()
    error = ''

    const req = activeReq
    if (!req) {
      error = 'Pilih requirement terlebih dahulu'
      return
    }
    if (!canCreateTask()) {
      error = 'Anda tidak punya izin Tambah Task'
      return
    }
    if (!title.trim()) {
      error = 'Judul task wajib diisi'
      return
    }
    if (!assignee.trim()) {
      error = 'Assignee teknis wajib dipilih'
      return
    }
    if (!deadline) {
      error = 'Deadline wajib diisi'
      return
    }

    const created = await createModuleTask({
      title: title.trim(),
      description: description.trim(),
      dashboard: req.dashboard,
      requirement_id: req.id,
      assignee: assignee.trim(),
      deadline,
      status: 'backlog',
    })

    if (!created) {
      error = 'Gagal membuat task'
      return
    }

    onCreated(created)
    onClose()
  }

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    if (e.key === 'Escape') onClose()
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="backdrop" use:portal role="presentation" onclick={onClose} onkeydown={onKeydown}></div>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="modal"
    use:portal
    role="dialog"
    aria-modal="true"
    aria-labelledby="pm-task-title"
    onclick={(e) => e.stopPropagation()}
    onkeydown={onKeydown}
    onsubmit={submit}
  >
      <header class="head">
        <div>
          <p class="eyebrow">PM · Pecah ke Backlog</p>
          <h2 id="pm-task-title">Tambah Task</h2>
          <p class="hint">Task langsung approved → kolom Backlog · assign ke teknis.</p>
        </div>
        <button type="button" class="close" aria-label="Tutup" onclick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </button>
      </header>

      <div class="body">
        <label class="field">
          <span>Requirement <em>*</em></span>
          <select bind:value={selectedReqId}>
            {#if reqChoices.length === 0}
              <option value="">Tidak ada requirement aktif</option>
            {:else}
              {#each reqChoices as r}
                <option value={r.id}>{reqCode(versionRootId(r))}{reqVersionSuffix(r)} · {r.title}</option>
              {/each}
            {/if}
          </select>
        </label>
        {#if activeReq}
          <p class="meta">Dashboard: <strong>{activeReq.dashboard}</strong></p>
        {/if}

        <label class="field">
          <span>Judul task <em>*</em></span>
          <input bind:value={title} maxlength="120" placeholder="Contoh: Implement SLA heatmap widget" />
        </label>

        <label class="field">
          <span>Deskripsi</span>
          <textarea rows="3" maxlength="600" bind:value={description} placeholder="Ruang lingkup pekerjaan untuk teknis…"></textarea>
        </label>

        <div class="row2">
          <label class="field">
            <span>Assign ke Teknis <em>*</em></span>
            <select bind:value={assignee}>
              {#each assigneeList as name}
                <option value={name}>{name}</option>
              {/each}
            </select>
          </label>
          <label class="field">
            <span>Deadline <em>*</em></span>
            <input type="date" bind:value={deadline} />
          </label>
        </div>

        {#if error}
          <p class="err">{error}</p>
        {/if}
      </div>

      <footer class="actions">
        <button type="button" class="ghost" onclick={onClose}>Batal</button>
        <button type="submit" class="primary" disabled={!activeReq}>Buat &amp; Assign</button>
      </footer>
  </form>
{/if}

<style>
  .backdrop {
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
    width: min(480px, calc(100vw - 2rem));
    max-height: min(88vh, 680px);
    overflow: hidden;
    border-radius: 16px;
    background: #fff;
    border: 0;
    outline: none;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.28);
    display: flex;
    flex-direction: column;
    isolation: isolate;
  }

  .head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 1rem 1rem 0.85rem 1.15rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    background: #fff;
    flex-shrink: 0;
  }

  .eyebrow {
    margin: 0 0 0.2rem;
    font-size: 0.62rem;
    font-weight: 750;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #8a8a90;
  }

  h2 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 750;
    color: #1a1a1a;
  }

  .hint {
    margin: 0.25rem 0 0;
    font-size: 0.72rem;
    color: #8a8a90;
  }

  .close {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 0;
    background: rgba(0, 0, 0, 0.05);
    cursor: pointer;
    color: #6b6b6b;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0;
  }

  .close svg {
    width: 14px;
    height: 14px;
    display: block;
  }

  .close:hover {
    background: rgba(0, 0, 0, 0.09);
    color: #1a1a1a;
  }

  .body {
    display: grid;
    gap: 0.75rem;
    padding: 1rem 1.15rem;
    overflow: auto;
    min-height: 0;
    background: #fff;
  }

  .field {
    display: grid;
    gap: 0.35rem;
  }

  .field span {
    font-size: 0.68rem;
    font-weight: 650;
    color: #5c5c62;
  }

  .field em {
    color: #be123c;
    font-style: normal;
  }

  .field input,
  .field select,
  .field textarea {
    width: 100%;
    box-sizing: border-box;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: #fff;
    padding: 0.55rem 0.7rem;
    font: inherit;
    font-size: 0.8rem;
    color: #1a1a1a;
  }

  .field input:disabled {
    background: rgba(0, 0, 0, 0.04);
    color: #5c5c62;
  }

  .row2 {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 0.65rem;
  }

  .meta {
    margin: -0.25rem 0 0;
    font-size: 0.7rem;
    color: #8a8a90;
  }

  .meta strong {
    color: #1a1a1a;
    font-weight: 650;
  }

  .err {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 600;
    color: #be123c;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 0.85rem 1.15rem 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    background: #fff;
    flex-shrink: 0;
  }

  .ghost,
  .primary {
    height: 36px;
    padding: 0 1rem;
    border-radius: 999px;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 650;
    cursor: pointer;
  }

  .ghost {
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: transparent;
    color: #5c5c62;
  }

  .primary {
    border: none;
    background: #1a1a1a;
    color: #fff;
  }

  .primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  @media (max-width: 560px) {
    .row2 {
      grid-template-columns: 1fr;
    }
  }
</style>
