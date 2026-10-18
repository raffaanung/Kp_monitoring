<script>
  import { goto } from '$app/navigation'
  import GlassPanel from '$lib/GlassPanel.svelte'
  import SubmenuHeader from '$lib/SubmenuHeader.svelte'
  import { authStore } from '$lib/authStore.svelte.js'
  import {
    accessStore,
    createRole,
    updateRole,
    deleteRole,
    setRolePermission,
    countUsersInRole,
  } from '$lib/accessStore.svelte.js'

  const canManageRoles = $derived(
    authStore.user?.functional_role === 'manager' ||
      (authStore.user?.permissions || []).includes('manage_roles'),
  )

  $effect(() => {
    if (authStore.user && !canManageRoles) {
      goto('/access/users')
    }
  })

  const roles = $derived(accessStore.roles)
  const permissions = $derived(accessStore.permissions)

  let addOpen = $state(false)
  let name = $state('')
  let description = $state('')
  let newPerms = $state(/** @type {Record<string, boolean>} */ ({}))
  let error = $state('')

  function openAdd() {
    name = ''
    description = ''
    newPerms = {}
    error = ''
    addOpen = true
  }

  function closeAdd() {
    addOpen = false
  }

  /** @type {{ id: number, name: string, users: number } | null} */
  let confirm = $state(null)
  let confirmError = $state('')

  /** @param {import('../lib/accessStore.svelte.js').AccessRole} role */
  function askDeleteRole(role) {
    confirmError = ''
    confirm = { id: role.id, name: role.name, users: countUsersInRole(role.id) }
  }

  function closeConfirm() {
    confirm = null
  }

  let deleteSubmitting = $state(false)

  async function onConfirmDelete() {
    if (!confirm || deleteSubmitting) return
    deleteSubmitting = true
    try {
      const result = await deleteRole(confirm.id)
      if (!result.ok) {
        confirmError = result.reason
        return
      }
      confirm = null
    } finally {
      deleteSubmitting = false
    }
  }

  let editOpen = $state(false)
  let editRoleId = $state(/** @type {number | null} */ (null))
  let editName = $state('')
  let editDescription = $state('')
  let editPerms = $state(/** @type {Record<string, boolean>} */ ({}))
  let editError = $state('')

  /** @param {import('../lib/accessStore.svelte.js').AccessRole} role */
  function openEdit(role) {
    editRoleId = role.id
    editName = role.name
    editDescription = role.description
    editPerms = { ...role.permissions }
    editError = ''
    editOpen = true
  }

  function closeEdit() {
    editOpen = false
  }

  /** @param {string} key */
  function toggleEditPerm(key) {
    editPerms = { ...editPerms, [key]: !editPerms[key] }
  }

  let editSubmitting = $state(false)
  let addSubmitting = $state(false)

  /** @param {SubmitEvent} event */
  async function onEditSubmit(event) {
    event.preventDefault()
    if (editRoleId == null || editSubmitting) return
    editSubmitting = true
    try {
      const result = await updateRole(editRoleId, { name: editName, description: editDescription, permissions: editPerms })
      if (!result.ok) {
        editError = result.reason
        return
      }
      editOpen = false
    } finally {
      editSubmitting = false
    }
  }

  /** @param {string} key */
  function toggleNewPerm(key) {
    newPerms = { ...newPerms, [key]: !newPerms[key] }
  }

  /** @param {SubmitEvent} event */
  async function onAddSubmit(event) {
    event.preventDefault()
    error = ''
    const clean = name.trim()
    if (!clean) {
      error = 'Role name is required'
      return
    }
    if (roles.some((r) => r.name.toLowerCase() === clean.toLowerCase())) {
      error = 'That role name is already in use'
      return
    }
    addSubmitting = true
    try {
      await createRole({ name: clean, description, permissions: newPerms })
      addOpen = false
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    } finally {
      addSubmitting = false
    }
  }

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    if (e.key !== 'Escape') return
    closeAdd()
    closeEdit()
    closeConfirm()
  }

  /** @param {import('../lib/accessStore.svelte.js').AccessRole} role */
  function enabledCount(role) {
    return permissions.filter((p) => role.permissions[p.key]).length
  }

  /** @param {import('../lib/accessStore.svelte.js').AccessRole} role @param {string} key */
  function hasPerm(role, key) {
    return !!role.permissions[key]
  }

  /** @param {number} roleId @param {string} key */
  async function togglePerm(roleId, key) {
    const role = roles.find((r) => r.id === roleId)
    if (!role) return
    await setRolePermission(roleId, key, !role.permissions[key])
  }

  const groups = $derived.by(() => {
    /** @type {Map<string, typeof permissions>} */
    const map = new Map()
    for (const p of permissions) {
      const list = map.get(p.group) || []
      list.push(p)
      map.set(p.group, list)
    }
    return [...map.entries()]
  })
</script>

{#if canManageRoles}
<section class="page">
  <GlassPanel>
    <SubmenuHeader
      eyebrow="User Access"
      title="Role Management"
      sub="Roles and the permission matrix"
      meta={`${roles.length} role`}
    >
      {#snippet actions()}
        <div class="head-actions">
          <button type="button" class="btn-primary" onclick={openAdd}>+ Add Role</button>
        </div>
      {/snippet}
    </SubmenuHeader>
  </GlassPanel>

  <GlassPanel class="fill">
    <div class="split">
      <div class="role-list">
        <h3>List Role</h3>
        <div class="role-cards">
          {#each roles as role (role.id)}
            <article class="role-card">
              <div class="role-head">
                <strong>{role.name}</strong>
                <div class="role-meta">
                  <span class="count">{countUsersInRole(role.id)} user</span>
                  <button
                    type="button"
                    class="icon-btn"
                    title={`Edit role ${role.name}`}
                    aria-label={`Edit role ${role.name}`}
                    onclick={() => openEdit(role)}
                  >
                    {@render editIcon()}
                  </button>
                  <button
                    type="button"
                    class="icon-btn icon-del"
                    title={`Delete role ${role.name}`}
                    aria-label={`Delete role ${role.name}`}
                    onclick={() => askDeleteRole(role)}
                  >
                    {@render trashIcon()}
                  </button>
                </div>
              </div>
              <p>{role.description}</p>
              <div class="perm-summary">
                <span class="chip">{enabledCount(role)}/{permissions.length} permission</span>
              </div>
            </article>
          {/each}
        </div>
      </div>

      <div class="matrix-wrap">
        <h3>Permission Matrix</h3>
        <p class="hint">Centang untuk mengaktifkan permission pada masing-masing role.</p>
        <div class="matrix-scroll">
          <table class="matrix">
            <thead>
              <tr>
                <th class="sticky-col">Permission</th>
                {#each roles as role}
                  <th>{role.name}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#if permissions.length === 0}
                <tr>
                  <td class="empty" colspan={roles.length + 1}>
                    No permissions yet. Click "+ Add Permission" to create one.
                  </td>
                </tr>
              {/if}
              {#each groups as [group, perms]}
                <tr class="group-row">
                  <td colspan={roles.length + 1}>{group}</td>
                </tr>
                {#each perms as perm}
                  <tr>
                    <td class="sticky-col perm-label">{perm.label}</td>
                    {#each roles as role}
                      <td class="cell-check">
                        <label class="toggle" title={`${perm.label} · ${role.name}`}>
                          <input
                            type="checkbox"
                            checked={hasPerm(role, perm.key)}
                            onchange={() => togglePerm(role.id, perm.key)}
                          />
                          <span class="box" aria-hidden="true"></span>
                        </label>
                      </td>
                    {/each}
                  </tr>
                {/each}
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </GlassPanel>
</section>
{/if}

{#if addOpen}
  <div class="backdrop" role="presentation" onclick={closeAdd} onkeydown={onKeydown}>
    <div
      class="modal liquidGlass-wrapper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-role-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      {@render glass()}

      <form class="modal-body" onsubmit={onAddSubmit}>
        <div class="modal-head">
          <div>
            <h2 id="add-role-title">Add Role</h2>
            <p>Create a role, then set its permissions</p>
          </div>
          <button type="button" class="close" aria-label="Close" onclick={closeAdd}>×</button>
        </div>

        <label>
          <span>Role name</span>
          <input bind:value={name} placeholder="Contoh: Auditor" />
        </label>

        <label>
          <span>Description</span>
          <input bind:value={description} placeholder="e.g. View and approve only" />
        </label>

        <fieldset class="perm-pick">
          <legend>Initial permissions (optional)</legend>
          <div class="perm-grid">
            {#each permissions as perm}
              <label class="check">
                <input
                  type="checkbox"
                  checked={!!newPerms[perm.key]}
                  onchange={() => toggleNewPerm(perm.key)}
                />
                <span>{perm.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        {#if error}<p class="error">{error}</p>{/if}

        <div class="actions">
          <button type="button" class="ghost" onclick={closeAdd}>Cancel</button>
          <button type="submit" class="primary" disabled={addSubmitting} style="display:inline-flex;align-items:center;gap:7px;">
            {#if addSubmitting}
              <span class="btn-spinner sm"></span>
              <span>Saving…</span>
            {:else}
              <span>Save role</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if editOpen}
  <div class="backdrop" role="presentation" onclick={closeEdit} onkeydown={onKeydown}>
    <div
      class="modal liquidGlass-wrapper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-role-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      {@render glass()}

      <form class="modal-body" onsubmit={onEditSubmit}>
        <div class="modal-head">
          <div>
            <h2 id="edit-role-title">Edit Role</h2>
            <p>Edit this role's name, description, and permissions</p>
          </div>
          <button type="button" class="close" aria-label="Close" onclick={closeEdit}>×</button>
        </div>

        <label>
          <span>Role name</span>
          <input bind:value={editName} placeholder="Contoh: Auditor" />
        </label>

        <label>
          <span>Description</span>
          <input bind:value={editDescription} placeholder="e.g. View and approve only" />
        </label>

        <fieldset class="perm-pick">
          <legend>Permission</legend>
          <div class="perm-grid">
            {#each permissions as perm}
              <label class="check">
                <input
                  type="checkbox"
                  checked={!!editPerms[perm.key]}
                  onchange={() => toggleEditPerm(perm.key)}
                />
                <span>{perm.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        {#if editError}<p class="error">{editError}</p>{/if}

        <div class="actions">
          <button type="button" class="ghost" onclick={closeEdit}>Cancel</button>
          <button type="submit" class="primary" disabled={editSubmitting} style="display:inline-flex;align-items:center;gap:7px;">
            {#if editSubmitting}
              <span class="btn-spinner sm"></span>
              <span>Saving…</span>
            {:else}
              <span>Save changes</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if confirm}
  <div class="backdrop" role="presentation" onclick={closeConfirm} onkeydown={onKeydown}>
    <div
      class="modal small liquidGlass-wrapper"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      {@render glass()}

      <div class="modal-body">
        <h2 id="confirm-title">Delete role "{confirm.name}"?</h2>
        {#if confirm.users > 0}
          <p class="lead">
            This role is still assigned to <strong>{confirm.users} user</strong>. Move those users to another role
            on the Users page first, then this role can be deleted.
          </p>
        {:else}
          <p class="lead">The role and all of its permissions will be deleted. This cannot be undone.</p>
        {/if}

        {#if confirmError}<p class="error">{confirmError}</p>{/if}

        <div class="actions">
          {#if confirm.users > 0}
            <button type="button" class="primary" onclick={closeConfirm}>Mengerti</button>
          {:else}
            <button type="button" class="ghost" onclick={closeConfirm}>Cancel</button>
            <button type="button" class="danger" onclick={onConfirmDelete} disabled={deleteSubmitting} style="display:inline-flex;align-items:center;gap:7px;">
              {#if deleteSubmitting}
                <span class="btn-spinner sm"></span>
                <span>Deleting…</span>
              {:else}
                <span>Delete</span>
              {/if}
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

{#snippet glass()}
  <div class="liquidGlass-effect"></div>
  <div class="liquidGlass-tint"></div>
  <div class="liquidGlass-shine"></div>
{/snippet}

{#snippet trashIcon()}
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14h10l1-14" />
    <path d="M10 11v6M14 11v6" />
  </svg>
{/snippet}

{#snippet editIcon()}
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
{/snippet}

<style>
  .page {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  :global(.page > .panel-glow.fill) {
    flex: 1;
    min-height: 0;
  }

  .split {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(240px, 320px) 1fr;
    gap: 16px;
    overflow: hidden;
  }

  h3 {
    margin: 0 0 10px;
    font-size: 0.56rem;
    font-weight: 750;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8a8a90;
  }

  .role-list {
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-right: 4px;
    border-right: 1px solid rgba(0, 0, 0, 0.06);
  }

  .role-cards {
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: grid;
    gap: 10px;
    align-content: start;
    padding-right: 8px;
  }

  .role-card {
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.45);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .role-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }

  .role-meta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .head-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .btn-secondary {
    height: 40px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 999px;
    padding: 0 1.15rem;
    background: rgba(255, 255, 255, 0.82);
    color: #1a1a1a;
    font: inherit;
    font-size: 0.65rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 1);
  }

  .icon-btn {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    display: inline-grid;
    place-items: center;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: #9a9aa0;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .icon-btn:hover,
  .icon-btn:focus-visible {
    background: rgba(0, 0, 0, 0.06);
    color: #1a1a1a;
  }

  .icon-del:hover,
  .icon-del:focus-visible {
    background: rgba(180, 35, 24, 0.1);
    color: #b42318;
  }

  .empty {
    padding: 1.5rem 0.75rem;
    color: #8a8a90;
    font-size: 0.68rem;
  }

  .role-head strong {
    font-size: 0.68rem;
    font-weight: 750;
    color: #1a1a1a;
  }

  .count {
    font-size: 0.56rem;
    font-weight: 700;
    color: #8a8a90;
    white-space: nowrap;
  }

  .role-card p {
    margin: 0 0 10px;
    font-size: 0.59rem;
    line-height: 1.45;
    color: #6b6b6b;
  }

  .perm-summary .chip {
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.56rem;
    font-weight: 750;
    background: rgba(196, 181, 230, 0.35);
    color: #5b4a8a;
  }

  .matrix-wrap {
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .hint {
    margin: 0 0 12px;
    font-size: 0.61rem;
    color: #8a8a90;
  }

  .matrix-scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
    margin: -2px;
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    background: rgba(255, 255, 255, 0.35);
  }

  .matrix {
    width: 100%;
    border-collapse: collapse;
    min-width: 640px;
  }

  .matrix th,
  .matrix td {
    padding: 0.65rem 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    text-align: center;
    vertical-align: middle;
    font-size: 0.68rem;
  }

  .matrix th {
    font-size: 0.56rem;
    font-weight: 750;
    color: #6b6b6b;
    background: rgba(255, 255, 255, 0.6);
    position: sticky;
    top: 0;
    z-index: 2;
  }

  .sticky-col {
    text-align: left !important;
    position: sticky;
    left: 0;
    z-index: 1;
    background: rgba(255, 255, 255, 0.92);
    min-width: 200px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .perm-label {
    font-size: 0.68rem;
    font-weight: 600;
    color: #3a3a3a;
  }

  .group-row td {
    text-align: left;
    font-size: 0.56rem;
    font-weight: 750;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #8e8e93;
    background: rgba(26, 26, 26, 0.04);
    padding: 0.5rem 0.75rem;
  }

  .cell-check {
    width: 72px;
  }

  .toggle {
    display: inline-grid;
    place-items: center;
    cursor: pointer;
    position: relative;
  }

  .toggle input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .box {
    width: 22px;
    height: 22px;
    border-radius: 8px;
    border: 1.5px solid rgba(0, 0, 0, 0.12);
    background: rgba(255, 255, 255, 0.8);
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .toggle input:checked + .box {
    background: #1a1a1a;
    border-color: #1a1a1a;
    box-shadow: inset 0 0 0 2px #fff;
  }

  .toggle input:focus-visible + .box {
    outline: 2px solid rgba(26, 26, 26, 0.35);
    outline-offset: 2px;
  }

  @media (max-width: 960px) {
    .split {
      grid-template-columns: 1fr;
      overflow: auto;
    }

    .role-list {
      border-right: 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      padding-bottom: 12px;
      max-height: 240px;
    }
  }

  /* ── Modal tambah role ── */
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(20, 20, 22, 0.35);
    backdrop-filter: blur(6px);
  }

  .modal.small {
    width: min(440px, 100%);
  }

  .lead {
    margin: 0;
    font-size: 0.61rem;
    line-height: 1.5;
    color: #4a4a4a;
  }

  .modal-body h2 {
    margin: 0;
    font-size: 0.86rem;
    font-weight: 750;
  }

  .danger {
    border: none;
    border-radius: 999px;
    padding: 10px 16px;
    font: inherit;
    font-size: 0.65rem;
    font-weight: 650;
    cursor: pointer;
    background: #b42318;
    color: #fff;
  }

  .modal {
    width: min(520px, 100%);
    max-height: calc(100vh - 40px);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  }

  .liquidGlass-wrapper {
    position: relative;
    display: flex;
    overflow: hidden;
    isolation: isolate;
  }

  .liquidGlass-effect {
    position: absolute;
    z-index: 0;
    inset: 0;
    background: rgba(255, 255, 255, 0.42);
    pointer-events: none;
  }

  .liquidGlass-tint {
    z-index: 1;
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.28);
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
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    overflow-y: auto;
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
    flex-shrink: 0;
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

  .modal-body input:not([type='checkbox']) {
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: 10px 12px;
    font: inherit;
    font-size: 0.68rem;
  }

  .perm-pick {
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 14px;
    padding: 10px 12px;
    margin: 0;
  }

  .perm-pick legend {
    font-size: 0.56rem;
    font-weight: 600;
    color: #6b6b6b;
    padding: 0 4px;
  }

  .perm-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 10px;
    margin-top: 6px;
  }

  .modal-body label.check {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .modal-body label.check span {
    font-size: 0.65rem;
    font-weight: 600;
    color: #1a1a1a;
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

  @media (max-width: 520px) {
    .perm-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
