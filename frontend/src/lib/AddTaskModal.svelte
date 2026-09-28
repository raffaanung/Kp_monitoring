<script>
  import { addTask, toISODate, addDays } from '../lib/taskStore.svelte.js'

  /** @type {{ open?: boolean, onClose?: () => void }} */
  let { open = false, onClose = () => {} } = $props()

  let title = $state('')
  let meta = $state('')
  let pic = $state('You')
  let status = $state(/** @type {'open' | 'in_progress' | 'done'} */ ('open'))
  let startDate = $state(toISODate(new Date()))
  let deadline = $state(toISODate(addDays(new Date(), 3)))
  let error = $state('')

  $effect(() => {
    if (open) {
      title = ''
      meta = ''
      pic = 'You'
      status = 'open'
      startDate = toISODate(new Date())
      deadline = toISODate(addDays(new Date(), 3))
      error = ''
    }
  })

  function submit(e) {
    e.preventDefault()
    if (!title.trim()) {
      error = 'Judul task wajib diisi'
      return
    }
    if (deadline < startDate) {
      error = 'Deadline tidak boleh sebelum start date'
      return
    }
    addTask({ title, meta, pic, status, startDate, deadline })
    onClose()
  }

  function onKeydown(e) {
    if (e.key === 'Escape') onClose()
  }
</script>

{#if open}
  <div class="backdrop" role="presentation" onclick={onClose} onkeydown={onKeydown}>
    <div
      class="modal liquidGlass-wrapper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-task-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      <div class="liquidGlass-effect"></div>
      <div class="liquidGlass-tint"></div>
      <div class="liquidGlass-shine"></div>

      <form class="modal-body" onsubmit={submit}>
        <div class="modal-head">
          <div>
            <h2 id="add-task-title">Add task</h2>
            <p>Task baru akan muncul di tracking minggu ini</p>
          </div>
          <button type="button" class="close" aria-label="Tutup" onclick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <label>
          <span>Judul</span>
          <input bind:value={title} placeholder="Contoh: Review EDM batch" />
        </label>

        <div class="row">
          <label>
            <span>Dashboard / meta</span>
            <input bind:value={meta} placeholder="EDM Core" />
          </label>
          <label>
            <span>PIC</span>
            <input bind:value={pic} placeholder="Nama PIC" />
          </label>
        </div>

        <div class="row">
          <label>
            <span>Start</span>
            <input type="date" bind:value={startDate} />
          </label>
          <label>
            <span>Deadline</span>
            <input type="date" bind:value={deadline} />
          </label>
        </div>

        <label>
          <span>Status</span>
          <select bind:value={status}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </label>

        {#if error}
          <p class="error">{error}</p>
        {/if}

        <div class="actions">
          <button type="button" class="ghost" onclick={onClose}>Batal</button>
          <button type="submit" class="primary">Simpan task</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 80;
    background: rgba(20, 22, 30, 0.28);
    backdrop-filter: blur(6px);
    display: grid;
    place-items: center;
    padding: 20px;
  }

  .modal {
    position: relative;
    width: min(440px, 100%);
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
    overflow: hidden;
    pointer-events: none;
    box-shadow:
      inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5),
      inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5);
  }

  .modal-body {
    position: relative;
    z-index: 3;
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
    margin-bottom: 4px;
  }

  .modal-head h2 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 700;
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
    cursor: pointer;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .close svg {
    width: 14px;
    height: 14px;
    display: block;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  label span {
    font-size: 0.56rem;
    font-weight: 600;
    color: #6b6b6b;
  }

  input,
  select {
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: 10px 12px;
    font: inherit;
    font-size: 0.68rem;
    color: #1a1a1a;
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
</style>
