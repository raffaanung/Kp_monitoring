<script>
  import GlassPanel from '$lib/GlassPanel.svelte'
  import SubmenuHeader from '$lib/SubmenuHeader.svelte'
  import { portal } from '$lib/portal.js'
  import { authStore } from '$lib/authStore.svelte.js'
  import {
    listUsers,
    createUser,
    updateUser,
    roleOptions,
    dashboardTeamOptions,
    unitOptions,
    roleLabel,
    teamLabels,
    statusLabel,
  } from '$lib/accessStore.svelte.js'

  const isAdmin = $derived(
    authStore.user?.functional_role === 'admin' ||
      authStore.user?.role_name?.toLowerCase() === 'admin' ||
      authStore.user?.functional_role === 'manager',
  )

  const canManageUsers = $derived(isAdmin)

  let role = $state('')
  let status = $state('')
  let q = $state('')

  let applied = $state({ role: '', unit: '', team: '', status: '', q: '' })

  let addOpen = $state(false)
  let name = $state('')
  let username = $state('')
  let password = $state('')
  let newRole = $state('')
  let newUnit = $state('')
  let newTeam = $state(/** @type {string[]} */ ([]))
  let newStatus = $state(/** @type {'active' | 'inactive'} */ ('active'))
  let error = $state('')

  let editOpen = $state(false)
  let editId = $state('')
  let editName = $state('')
  let editUsername = $state('')
  let editRole = $state('')
  let editUnit = $state('')
  let editTeam = $state(/** @type {string[]} */ ([]))
  let editStatus = $state(/** @type {'active' | 'inactive'} */ ('active'))
  let editError = $state('')

  const items = $derived(listUsers(applied))
  const roles = $derived(roleOptions())
  const teams = $derived(dashboardTeamOptions())

  $effect(() => {
    const isModalOpen = addOpen || editOpen
    document.documentElement.classList.toggle('modal-open', isModalOpen)
    return () => {
      document.documentElement.classList.remove('modal-open')
    }
  })

  function onSubmit(event) {
    event.preventDefault()
    applied = { role, unit: '', team: '', status, q }
  }

  function openAdd() {
    name = ''
    username = ''
    password = ''
    const devRole = roles.find((r) => r.label.toLowerCase() === 'developer')
    newRole = devRole?.value || roles[0]?.value || ''
    newUnit = unitOptions[0] || ''
    newTeam = []
    newStatus = 'active'
    error = ''
    addOpen = true
  }

  function closeAdd() {
    addOpen = false
  }

  /** @param {string} id */
  function toggleNewTeam(id) {
    newTeam = newTeam.includes(id) ? newTeam.filter((t) => t !== id) : [...newTeam, id]
  }

  let addSubmitting = $state(false)
  let editSubmitting = $state(false)

  async function onAddSubmit(event) {
    event.preventDefault()
    error = ''
    if (!name.trim()) {
      error = 'Name is required'
      return
    }
    if (!/^\d{8}$/.test(username.trim())) {
      error = 'Username must be 8 digits'
      return
    }
    if (password.length < 6) {
      error = 'Password must be at least 6 characters'
      return
    }
    addSubmitting = true
    try {
      await createUser({
        name,
        username,
        password,
        role_id: newRole,
        unit: newUnit,
        team_ids: newTeam,
        status: newStatus,
      })
      addOpen = false
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    } finally {
      addSubmitting = false
    }
  }

  /** @param {import('../lib/accessStore.svelte.js').AccessUser} user */
  function openEdit(user) {
    editId = user.id
    editName = user.name
    editUsername = user.username
    editRole = user.role_id
    editUnit = user.unit || unitOptions[0]
    editTeam = [...user.team_ids]
    editStatus = user.status
    editError = ''
    editOpen = true
  }

  function closeEdit() {
    editOpen = false
  }

  /** @param {string} id */
  function toggleEditTeam(id) {
    editTeam = editTeam.includes(id) ? editTeam.filter((t) => t !== id) : [...editTeam, id]
  }

  async function onEditSubmit(event) {
    event.preventDefault()
    editError = ''
    if (!editName.trim()) {
      editError = 'Name is required'
      return
    }
    if (!/^\d{8}$/.test(editUsername.trim())) {
      editError = 'Username must be 8 digits'
      return
    }
    editSubmitting = true
    try {
      const res = await updateUser(editId, {
        name: editName,
        username: editUsername,
        role_id: editRole,
        unit: editUnit,
        team_ids: editTeam,
        status: editStatus,
      })
      if (!res.ok) {
        editError = res.reason
        return
      }
      editOpen = false
    } finally {
      editSubmitting = false
    }
  }

  /** @param {string} n */
  function initials(n) {
    return n
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      closeAdd()
      closeEdit()
    }
  }
</script>

<section class="page">
  <GlassPanel>
    <SubmenuHeader
      eyebrow="User Access"
      title="User List"
      sub="Manage user accounts, roles, units, and teams"
      meta={`${items.length} user`}
    >
      {#snippet actions()}
        {#if canManageUsers}
          <button type="button" class="btn-primary" onclick={openAdd}>+ Add User</button>
        {/if}
      {/snippet}
    </SubmenuHeader>

    <form class="filters" onsubmit={onSubmit}>
      <label>
        <span>Peran</span>
        <select bind:value={role}>
          <option value="">All</option>
          {#each roles as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Status</span>
        <select bind:value={status}>
          <option value="">All</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </label>

      <label class="grow">
        <span>Search</span>
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7" />
            <path d="m16.5 16.5 3.2 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
          </svg>
          <input type="search" placeholder="Name, username, unit, team…" bind:value={q} />
        </div>
      </label>

      <button type="submit" class="apply">Terapkan</button>
    </form>
  </GlassPanel>

  <GlassPanel class="fill table-panel">
    {#if items.length === 0}
      <p class="state">No matching users.</p>
    {:else}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Peran</th>
              <th>Unit</th>
              <th>Tim</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each items as user (user.id)}
              <tr class:inactive={user.status === 'inactive'}>
                <td><span class="mono-id">#{user.id.slice(0, 8)}</span></td>
                <td>
                  <span class="user-cell">
                    <i class="face">{initials(user.name)}</i>
                    <span>
                      <strong>{user.name}</strong>
                      <small>{user.username}</small>
                    </span>
                  </span>
                </td>
                <td><span class="chip role">{roleLabel(user.role_id)}</span></td>
                <td>{user.unit}</td>
                <td>
                  <div class="team-chips">
                    {#each teamLabels(user.team_ids) as label}
                      <span class="chip team">{label}</span>
                    {:else}
                      <span class="muted">—</span>
                    {/each}
                  </div>
                </td>
                <td>
                  <span class={`chip st-${user.status}`}>{statusLabel(user.status)}</span>
                </td>
                <td>
                  {#if canManageUsers}
                    <button type="button" class="edit-btn" onclick={() => openEdit(user)}>Edit</button>
                  {:else}
                    <span class="muted">—</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </GlassPanel>
</section>

{#if addOpen}
  <div class="backdrop" use:portal role="presentation" onclick={closeAdd} onkeydown={onKeydown}>
    <div
      class="modal liquidGlass-wrapper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-user-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      <div class="liquidGlass-effect"></div>
      <div class="liquidGlass-tint"></div>
      <div class="liquidGlass-shine"></div>

      <form class="modal-body" onsubmit={onAddSubmit}>
        <div class="modal-head">
          <div>
            <h2 id="add-user-title">Add User</h2>
            <p>Create a user account with a role and password</p>
          </div>
          <button type="button" class="close" aria-label="Close" onclick={closeAdd}>×</button>
        </div>

        <label>
          <span>Full name</span>
          <input bind:value={name} placeholder="Contoh: Alamsyah Putra" />
        </label>

        <div class="row">
          <label>
            <span>Username</span>
            <input type="text" inputmode="numeric" pattern={'[0-9]{8}'} maxlength="8" bind:value={username} placeholder="10000012" />
          </label>
          <label>
            <span>Password</span>
            <input type="password" bind:value={password} placeholder="Minimal 6 karakter" />
          </label>
        </div>

        <div class="row">
          <label>
            <span>Peran</span>
            <select bind:value={newRole}>
              {#each roles as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Unit</span>
            <select bind:value={newUnit}>
              {#each unitOptions as u}
                <option value={u}>{u}</option>
              {/each}
            </select>
          </label>
        </div>

        <div class="row">
          <label>
            <span>Status</span>
            <select bind:value={newStatus}>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>
        </div>

        <fieldset class="team-pick">
          <legend>Tim</legend>
          <div class="team-grid">
            {#each teams as opt}
              <label class="check">
                <input
                  type="checkbox"
                  checked={newTeam.includes(opt.value)}
                  onchange={() => toggleNewTeam(opt.value)}
                />
                <span>{opt.label}</span>
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
              <span>Save user</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if editOpen}
  <div class="backdrop" use:portal role="presentation" onclick={closeEdit} onkeydown={onKeydown}>
    <div
      class="modal liquidGlass-wrapper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      <div class="liquidGlass-effect"></div>
      <div class="liquidGlass-tint"></div>
      <div class="liquidGlass-shine"></div>

      <form class="modal-body" onsubmit={onEditSubmit}>
        <div class="modal-head">
          <div>
            <h2 id="edit-user-title">Edit User</h2>
            <p>Edit role, unit, and team for {editName}</p>
          </div>
          <button type="button" class="close" aria-label="Close" onclick={closeEdit}>×</button>
        </div>

        <label>
          <span>Full name</span>
          <input bind:value={editName} placeholder="Contoh: Alamsyah Putra" />
        </label>

        <div class="row">
          <label>
            <span>Username</span>
            <input type="text" inputmode="numeric" pattern={'[0-9]{8}'} maxlength="8" bind:value={editUsername} />
          </label>
          <label>
            <span>Peran</span>
            <select bind:value={editRole}>
              {#each roles as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </label>
        </div>

        <div class="row">
          <label>
            <span>Unit</span>
            <select bind:value={editUnit}>
              {#each unitOptions as u}
                <option value={u}>{u}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select bind:value={editStatus}>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </label>
        </div>

        <fieldset class="team-pick">
          <legend>Tim</legend>
          <div class="team-grid">
            {#each teams as opt}
              <label class="check">
                <input
                  type="checkbox"
                  checked={editTeam.includes(opt.value)}
                  onchange={() => toggleEditTeam(opt.value)}
                />
                <span>{opt.label}</span>
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

<style>
  .page {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: end;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  label {
    display: grid;
    gap: 4px;
    min-width: 148px;
    align-content: end;
  }

  label.grow {
    flex: 1;
    min-width: 200px;
  }

  label span {
    font-size: 0.52rem;
    font-weight: 650;
    color: #8a8a90;
    line-height: 1;
  }

  .filters select,
  .filters .search,
  .filters .apply {
    height: 34px;
    box-sizing: border-box;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 999px;
    background-color: rgba(255, 255, 255, 0.9);
    font: inherit;
    font-size: 0.65rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .filters select {
    appearance: none;
    -webkit-appearance: none;
    text-align: left;
    width: 100%;
    min-width: 148px;
    padding: 0 1.7rem 0 0.85rem;
    line-height: 32px;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6b6b' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.7rem center;
    background-size: 12px 12px;
  }

  .filters .search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 0.85rem;
  }

  .filters .search svg {
    width: 14px;
    height: 14px;
    color: #7a7a80;
    flex-shrink: 0;
  }

  .filters .search input {
    border: 0;
    background: transparent;
    padding: 0;
    height: auto;
    width: 100%;
    outline: none;
    font: inherit;
    font-size: 0.65rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .filters .apply {
    background: #1a1a1a;
    color: #fff;
    border-color: transparent;
    font-weight: 700;
    cursor: pointer;
    padding: 0 1rem;
    align-self: end;
  }

  :global(.table-panel) {
    flex: 1;
    min-height: 0;
  }

  .table-wrap {
    overflow: auto;
    flex: 1;
    min-height: 0;
    margin: -4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 880px;
  }

  th,
  td {
    text-align: left;
    padding: 0.85rem 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    vertical-align: middle;
    font-size: 0.68rem;
  }

  th {
    font-size: 0.56rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #8a8a90;
    font-weight: 700;
    position: sticky;
    top: 0;
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(8px);
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  tr.inactive td {
    opacity: 0.65;
  }

  .mono-id {
    font-size: 0.61rem;
    font-weight: 700;
    color: #8a8a90;
  }

  .user-cell {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
  }

  .user-cell strong {
    display: block;
    font-weight: 700;
    color: #1a1a1a;
  }

  .user-cell small {
    display: block;
    font-size: 0.59rem;
    color: #8a8a90;
    font-weight: 500;
  }

  .face {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 0.52rem;
    font-style: normal;
    font-weight: 750;
    background: rgba(26, 26, 26, 0.08);
    flex-shrink: 0;
  }

  .team-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .chip {
    display: inline-block;
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    font-size: 0.56rem;
    font-weight: 700;
    background: rgba(0, 0, 0, 0.06);
    color: #3a3a3a;
  }

  .chip.role {
    background: rgba(196, 181, 230, 0.4);
    color: #5b4a8a;
  }

  .chip.team {
    background: rgba(170, 210, 235, 0.4);
    color: #2a5a7a;
  }

  .st-active {
    background: rgba(170, 220, 190, 0.45);
    color: #2f6b4a;
  }

  .st-inactive {
    background: rgba(214, 184, 140, 0.3);
    color: #7a5a2e;
  }

  .muted {
    color: #aeaeb2;
    font-size: 0.65rem;
  }

  .state {
    margin: 0;
    padding: 1.5rem;
    text-align: center;
    color: #7a7a80;
    font-weight: 550;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(20, 20, 22, 0.45);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .modal {
    width: min(520px, 100%);
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
  .modal-body select {
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

  .team-pick {
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 14px;
    padding: 10px 12px;
    margin: 0;
  }

  .team-pick legend {
    font-size: 0.56rem;
    font-weight: 600;
    color: #6b6b6b;
    padding: 0 4px;
  }

  .team-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-top: 6px;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.65rem;
    font-weight: 600;
    cursor: pointer;
  }

  .check input {
    width: auto;
    height: auto;
  }

  .edit-btn {
    height: 1.9rem;
    padding: 0 0.75rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 999px;
    background: transparent;
    font: inherit;
    font-size: 0.6rem;
    font-weight: 650;
    color: #1a1a1a;
    cursor: pointer;
    white-space: nowrap;
  }

  .edit-btn:hover {
    background: rgba(0, 0, 0, 0.05);
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
</style>
