<script>
  import { untrack } from 'svelte'
  import {
    createModuleTask,
    teknisAssignees,
    assigneeOptions,
    canCreateTask,
    taskModuleStore,
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
  /** @type {string[]} */
  let assignees = $state([])
  let saving = $state(false)
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

  const availableAssignees = $derived(assigneeList.filter((name) => !assignees.includes(name)))

  /** @param {string} name */
  function initials(name) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  function defaultAssignees() {
    const team = (Array.isArray(activeReq?.team) ? activeReq.team : []).filter(
      (name) => name && assigneeList.includes(name),
    )
    if (team.length) return team
    const first = assigneeList[0] || teknisAssignees()[0] || ''
    return first ? [first] : []
  }

  /** @param {string} name */
  function toggleAssignee(name) {
    assignees = assignees.includes(name)
      ? assignees.filter((item) => item !== name)
      : [...assignees, name]
  }

  // Reset form hanya saat modal dibuka. untrack() supaya effect ini tidak ikut
  // jalan ulang ketika taskModuleStore.items berubah (mis. setelah task pertama
  // dibuat), yang sebelumnya mengosongkan form di tengah loop multi-assignee.
  $effect(() => {
    if (!open) return
    untrack(() => {
      title = ''
      description = ''
      deadline = today()
      error = ''
      saving = false
      selectedReqId = requirementId || (reqChoices[0]?.id ?? '')
      assignees = defaultAssignees()
    })
  })

  $effect(() => {
    if (!open) return
    const valid = assignees.filter((name) => assigneeList.includes(name))
    if (valid.length === 0) {
      const next = defaultAssignees()
      if (next.join('\0') !== assignees.join('\0')) assignees = next
    } else if (valid.length !== assignees.length) {
      assignees = valid
    }
  })

  async function submit(event) {
    event.preventDefault()
    error = ''
    if (saving) return

    const req = activeReq
    if (!req) {
      error = 'Select a requirement first'
      return
    }
    if (!canCreateTask()) {
      error = 'You do not have permission to add a task'
      return
    }
    if (!title.trim()) {
      error = 'Task title is required'
      return
    }
    if (assignees.length === 0) {
      error = 'Select at least one engineer'
      return
    }
    if (!deadline) {
      error = 'Deadline is required'
      return
    }

    saving = true
    // Satu task, banyak assignee sekaligus — bukan 1 task terpisah per orang lagi.
    let created = null
    try {
      created = await createModuleTask({
        title: title.trim(),
        description: description.trim(),
        dashboard: req.dashboard,
        requirement_id: req.id,
        deadline,
        assignees: [...assignees],
        status: 'backlog',
      })
    } catch (err) {
      saving = false
      error = err instanceof Error ? err.message : String(err)
      return
    }
    saving = false

    if (!created) {
      error = 'Could not create the task'
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
          <p class="eyebrow">{taskModuleStore.session.label || 'PM'} · Split to Backlog</p>
          <h2 id="pm-task-title">Add Task</h2>
          <p class="hint">The task is approved immediately and lands in Backlog, assigned to an engineer.</p>
        </div>
        <button type="button" class="close" aria-label="Close" onclick={onClose}>
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
              <option value="">No active requirement</option>
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
          <span>Task title <em>*</em></span>
          <input bind:value={title} maxlength="120" placeholder="Contoh: Implement SLA heatmap widget" />
        </label>

        <label class="field">
          <span>Description</span>
          <textarea rows="3" maxlength="600" bind:value={description} placeholder="Scope of work for the engineer…"></textarea>
        </label>

        <div class="field">
          <span>Assign ke Teknis <em>*</em></span>
          {#if assignees.length}
            <div class="avatar-stack">
              {#each assignees as name (name)}
                <span class="avatar">
                  <i class="face">{initials(name)}</i>
                  <em>{name}</em>
                  <button type="button" class="avatar-remove" aria-label={`Remove ${name}`} onclick={() => toggleAssignee(name)}>×</button>
                </span>
              {/each}
            </div>
          {:else}
            <p class="assign-empty">No engineer selected yet.</p>
          {/if}
          {#if availableAssignees.length}
            <div class="team-picker">
              {#each availableAssignees as name (name)}
                <button type="button" class="team-add" onclick={() => toggleAssignee(name)}>+ {name}</button>
              {/each}
            </div>
          {:else if assigneeList.length === 0}
            <p class="assign-empty">No engineer users yet.</p>
          {/if}
        </div>

        <label class="field deadline-field">
          <span>Deadline <em>*</em></span>
          <input type="date" bind:value={deadline} />
        </label>

        {#if error}
          <p class="err">{error}</p>
        {/if}
      </div>

      <footer class="actions">
        <button type="button" class="ghost" onclick={onClose}>Cancel</button>
        <button type="submit" class="primary" disabled={!activeReq || saving}>{saving ? 'Saving…' : 'Create & Assign'}</button>
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

  .deadline-field input {
    max-width: 180px;
  }

  .assign-empty {
    margin: 0;
    font-size: 0.72rem;
    color: #8a8a90;
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
    padding: 0.2rem 0.45rem 0.2rem 0.2rem;
    border-radius: 999px;
    background: #fff;
    border: 1px solid rgba(6, 95, 198, 0.14);
    box-shadow: 0 1px 4px rgba(4, 40, 90, 0.06);
  }

  .face {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 0.48rem;
    font-style: normal;
    font-weight: 750;
    background: linear-gradient(145deg, #e8f1fb 0%, #d7e6f7 100%);
    color: #065fc6;
    flex-shrink: 0;
  }

  .avatar em {
    font-style: normal;
    font-size: 0.72rem;
    font-weight: 650;
    color: #1a1a1a;
  }

  .avatar-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.06);
    color: #6b6b6b;
    font-size: 0.7rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
  }

  .avatar-remove:hover {
    background: rgba(190, 18, 60, 0.12);
    color: #be123c;
  }

  .team-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    max-height: 108px;
    overflow: auto;
  }

  .team-add {
    height: auto;
    min-height: 0;
    padding: 0.28rem 0.6rem;
    border-radius: 999px;
    border: 1px dashed rgba(6, 95, 198, 0.28);
    background: rgba(6, 95, 198, 0.04);
    color: #065fc6;
    font: inherit;
    font-size: 0.7rem;
    font-weight: 650;
    cursor: pointer;
  }

  .team-add:hover {
    background: rgba(6, 95, 198, 0.1);
  }

  @media (max-width: 560px) {
    .deadline-field input {
      max-width: none;
    }
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
</style>
