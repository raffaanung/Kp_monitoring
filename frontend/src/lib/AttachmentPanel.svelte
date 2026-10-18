<script>
  import { onMount } from 'svelte'
  import { portal } from './portal.js'
  import {
    addAttachments,
    attachmentKindLabel,
    attachmentStore,
    formatBytes,
    listAttachments,
    loadAttachmentsFromApi,
    removeAttachment,
    useAttachment,
  } from './attachmentStore.svelte.js'
  import { formatDate } from './format.js'

  /**
   * @type {{
   *   ownerType: 'requirement' | 'dashboard',
   *   ownerId: string | number,
   *   canManage?: boolean,
   * }}
   */
  let { ownerType, ownerId, canManage = true, triggerLabel = 'File Panduan' } = $props()

  let open = $state(false)
  let error = $state('')
  let busy = $state(false)
  /** @type {HTMLInputElement | null} */
  let picker = $state(null)

  const files = $derived.by(() => {
    void attachmentStore.items
    return listAttachments(ownerType, ownerId)
  })

  onMount(() => {
    loadAttachmentsFromApi(ownerType, ownerId)
  })

  function openModal() {
    error = ''
    open = true
    loadAttachmentsFromApi(ownerType, ownerId)
  }

  function closeModal() {
    open = false
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    if (event.key === 'Escape') closeModal()
  }

  function openPicker() {
    error = ''
    picker?.click()
  }

  /** @param {Event} event */
  async function onPick(event) {
    const input = /** @type {HTMLInputElement} */ (event.currentTarget)
    const selected = input.files
    if (!selected?.length) return
    busy = true
    error = ''
    try {
      const result = await addAttachments(ownerType, ownerId, selected)
      if (result.rejected.length) {
        error = result.rejected.map((item) => `${item.name}: ${item.reason}`).join('. ')
      }
    } catch {
      error = 'Could not save the file.'
    } finally {
      busy = false
      input.value = ''
    }
  }

  /** @param {string} id */
  async function onRemove(id) {
    await removeAttachment(id)
  }

  /** @param {string} stamp */
  function when(stamp) {
    return formatDate(stamp.slice(0, 10))
  }
</script>

<button type="button" class="pill attach-trigger" onclick={openModal}>
  {triggerLabel}{files.length ? ` · ${files.length}` : ''}
</button>

{#if open}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="backdrop" use:portal role="presentation" onclick={closeModal} onkeydown={onKeydown}></div>
  <div
    class="modal"
    use:portal
    role="dialog"
    aria-modal="true"
    aria-labelledby="attach-title"
    tabindex="-1"
    onkeydown={onKeydown}
  >
    <header class="head">
      <div>
        <p class="eyebrow">File Panduan</p>
        <h2 id="attach-title">Guide files</h2>
        <p class="hint">Maksimal 20 MB.</p>
      </div>
      <button type="button" class="close" aria-label="Close" onclick={closeModal}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
    </header>

    <div class="body">
      {#if error}<p class="error">{error}</p>{/if}
      {#if files.length === 0}
        <p class="empty">No guide files yet.</p>
      {:else}
        <ul>
          {#each files as file (file.id)}
            <li>
              <span class={`kind kind-${file.kind}`}>{attachmentKindLabel(file.kind, file.name)}</span>
              <div class="meta">
                <strong>{file.name}</strong>
                <span>{formatBytes(file.size)} · {when(file.uploadedAt)} · {file.uploadedBy}</span>
              </div>
              <div class="row-actions">
                <button type="button" onclick={() => useAttachment(file.id, 'open')}>Buka</button>
                <button type="button" onclick={() => useAttachment(file.id, 'download')}>Download</button>
                {#if canManage}
                  <button type="button" class="danger" onclick={() => onRemove(file.id)}>Delete</button>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <footer class="foot">
      <button type="button" class="ghost" onclick={closeModal}>Close</button>
      {#if canManage}
        <button type="button" class="primary" onclick={openPicker} disabled={busy} style="display:inline-flex;align-items:center;gap:7px;">
          {#if busy}
            <span class="btn-spinner sm"></span>
            <span>Saving…</span>
          {:else}
            <span>Upload</span>
          {/if}
        </button>
        <input bind:this={picker} type="file" multiple onchange={onPick} />
      {/if}
    </footer>
  </div>
{/if}

<style>
  .attach-trigger {
    width: max-content;
    flex: 0 0 auto;
  }
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
    width: min(560px, calc(100vw - 2rem));
    max-height: min(88vh, 680px);
    overflow: hidden;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.28);
    display: flex;
    flex-direction: column;
  }

  .head,
  .foot {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem 1rem 0.85rem 1.15rem;
  }

  .foot {
    align-items: center;
    justify-content: flex-end;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .eyebrow {
    margin: 0 0 0.15rem;
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #8a8a90;
  }

  h2 {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .hint,
  .empty,
  .error {
    margin: 0.25rem 0 0;
    font-size: 0.65rem;
    color: #6b6b6b;
  }

  .error {
    margin: 0 0 0.55rem;
    color: #9a3412;
  }

  .empty {
    margin: 0;
  }

  .close {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.05);
    color: #1a1a1a;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .close svg {
    width: 14px;
    height: 14px;
  }

  .body {
    overflow: auto;
    padding: 0 1.15rem 0.4rem;
    min-height: 4.5rem;
  }

  input {
    display: none;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.45rem;
  }

  li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.35rem 0.7rem;
    align-items: center;
    padding: 0.6rem 0.7rem;
    border-radius: 14px;
    background: #f7f7f8;
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .kind {
    grid-row: span 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.4rem;
    height: 1.45rem;
    padding: 0 0.4rem;
    border-radius: 999px;
    font-size: 0.56rem;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .kind-pdf {
    background: #fee2e2;
    color: #991b1b;
  }

  .kind-ppt {
    background: #ffedd5;
    color: #9a3412;
  }

  .kind-xls {
    background: #dcfce7;
    color: #166534;
  }

  .kind-file {
    background: #e5e7eb;
    color: #374151;
  }

  .meta {
    min-width: 0;
    display: grid;
    gap: 0.1rem;
  }

  .meta strong {
    font-size: 0.68rem;
    font-weight: 680;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta span {
    font-size: 0.58rem;
    color: #6b6b6b;
  }

  .row-actions {
    display: flex;
    gap: 0.35rem;
    grid-column: 2;
  }

  .row-actions button,
  .ghost,
  .primary {
    height: 2rem;
    border-radius: 999px;
    padding: 0 0.85rem;
    font: inherit;
    font-size: 0.62rem;
    font-weight: 700;
    cursor: pointer;
  }

  .row-actions button,
  .ghost {
    background: #fff;
    color: #1a1a1a;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .row-actions .danger {
    color: #991b1b;
  }

  .primary {
    border: 0;
    background: #1a1a1a;
    color: #fff;
  }

  .primary:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>
