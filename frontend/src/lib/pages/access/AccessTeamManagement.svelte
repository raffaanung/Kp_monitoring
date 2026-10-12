<script>
    import GlassPanel from '$lib/GlassPanel.svelte'
  import SubmenuHeader from '$lib/SubmenuHeader.svelte'
  import {
    listTeams,
    createTeam,
    userLabel,
    unitOptions,
    userOptions,
    countMembersInTeam,
  } from '$lib/accessStore.svelte.js'
  import { defaultDashboards } from '$lib/taskModuleStore.svelte.js'

  let unit = $state('')
  let q = $state('')
  let applied = $state({ unit: '', q: '' })

  let addOpen = $state(false)
  let name = $state('')
  let newUnit = $state('GBO')
  let description = $state('')
  let leadId = $state(1)
  let memberIds = $state(/** @type {number[]} */ ([]))
  let dashboards = $state(/** @type {string[]} */ ([]))
  let error = $state('')

  const items = $derived(listTeams(applied))
  const users = $derived(userOptions())
  const dashOptions = $derived(defaultDashboards)

  function onSubmit(event) {
    event.preventDefault()
    applied = { unit, q }
  }

  function openAdd() {
    name = ''
    newUnit = unitOptions[0]
    description = ''
    leadId = users[0]?.value || 1
    memberIds = []
    dashboards = []
    error = ''
    addOpen = true
  }

  function closeAdd() {
    addOpen = false
  }

  function toggleMember(id) {
    memberIds = memberIds.includes(id) ? memberIds.filter((m) => m !== id) : [...memberIds, id]
  }

  function toggleDashboard(name) {
    dashboards = dashboards.includes(name) ? dashboards.filter((d) => d !== name) : [...dashboards, name]
  }

  function onAddSubmit(event) {
    event.preventDefault()
    error = ''
    if (!name.trim()) {
      error = 'Team name is required'
      return
    }
    if (!leadId) {
      error = 'Team lead is required'
      return
    }
    createTeam({
      name,
      unit: newUnit,
      description,
      lead_id: leadId,
      member_ids: memberIds.length ? memberIds : [leadId],
      dashboards,
    })
    addOpen = false
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
    if (e.key === 'Escape') closeAdd()
  }
</script>

<section class="page">
  <GlassPanel>
    <SubmenuHeader
      eyebrow="User Access"
      title="Team Management"
      sub="Operational teams and dashboard access"
      meta={`${items.length} tim`}
    >
      {#snippet actions()}
        <button type="button" class="btn-primary" onclick={openAdd}>+ Add Team</button>
      {/snippet}
    </SubmenuHeader>

    <form class="filters" onsubmit={onSubmit}>
      <label>
        <span>Unit</span>
        <select bind:value={unit}>
          <option value="">All</option>
          {#each unitOptions as name}
            <option value={name}>{name}</option>
          {/each}
        </select>
      </label>

      <label class="grow">
        <span>Search</span>
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.7" />
            <path d="m16.5 16.5 3.2 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
          </svg>
          <input type="search" placeholder="Team name, unit, dashboard…" bind:value={q} />
        </div>
      </label>

      <button type="submit" class="apply">Terapkan</button>
    </form>
  </GlassPanel>

  <GlassPanel class="fill table-panel">
    {#if items.length === 0}
      <p class="state">No matching teams.</p>
    {:else}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tim</th>
              <th>Unit</th>
              <th>Lead</th>
              <th>Members</th>
              <th>Dashboard</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each items as team (team.id)}
              <tr>
                <td><span class="mono-id">#{team.id}</span></td>
                <td>
                  <a class="team-link" href={`/access/teams/${team.id}`}>
                    <strong>{team.name}</strong>
                    <small>{team.description}</small>
                  </a>
                </td>
                <td>{team.unit}</td>
                <td>
                  <span class="lead">
                    <i class="face">{initials(userLabel(team.lead_id))}</i>
                    {userLabel(team.lead_id)}
                  </span>
                </td>
                <td><span class="chip count">{countMembersInTeam(team.id)} orang</span></td>
                <td>
                  <div class="dash-chips">
                    {#each team.dashboards as dash}
                      <span class="chip dash">{dash}</span>
                    {:else}
                      <span class="muted">â€”</span>
                    {/each}
                  </div>
                </td>
                <td>
                  <a class="detail-link" href={`/access/teams/${team.id}`}>Detail â†’</a>
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
  <div class="backdrop" role="presentation" onclick={closeAdd} onkeydown={onKeydown}>
    <div
      class="modal liquidGlass-wrapper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-team-title"
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
            <h2 id="add-team-title">Add Team</h2>
            <p>Create a team and set its lead and dashboards</p>
          </div>
          <button type="button" class="close" aria-label="Close" onclick={closeAdd}>Ã—</button>
        </div>

        <label>
          <span>Team name</span>
          <input bind:value={name} placeholder="Contoh: GBO Analytics" />
        </label>

        <div class="row">
          <label>
            <span>Unit</span>
            <select bind:value={newUnit}>
              {#each unitOptions as opt}
                <option value={opt}>{opt}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Team lead</span>
            <select bind:value={leadId}>
              {#each users as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </label>
        </div>

        <label>
          <span>Description</span>
          <textarea rows="2" bind:value={description} placeholder="Optional"></textarea>
        </label>

        <fieldset class="pick-block">
          <legend>Members</legend>
          <div class="pick-grid">
            {#each users as opt}
              <label class="check">
                <input
                  type="checkbox"
                  checked={memberIds.includes(opt.value)}
                  onchange={() => toggleMember(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <fieldset class="pick-block">
          <legend>Dashboard</legend>
          <div class="pick-grid">
            {#each dashOptions as dash}
              <label class="check">
                <input
                  type="checkbox"
                  checked={dashboards.includes(dash)}
                  onchange={() => toggleDashboard(dash)}
                />
                <span>{dash}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        {#if error}<p class="error">{error}</p>{/if}

        <div class="actions">
          <button type="button" class="ghost" onclick={closeAdd}>Cancel</button>
          <button type="submit" class="primary">Save team</button>
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
    gap: 6px;
    min-width: 120px;
  }

  label.grow {
    flex: 1;
    min-width: 180px;
  }

  label span {
    font-size: 0.56rem;
    font-weight: 650;
    color: #6b6b6b;
  }

  select,
  input,
  .apply {
    height: 2.45rem;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 14px;
    padding: 0 0.85rem;
    background: rgba(255, 255, 255, 0.78);
    font: inherit;
    font-size: 0.68rem;
    color: #1a1a1a;
  }

  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 2.45rem;
    padding: 0 0.85rem;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.78);
  }

  .search svg {
    width: 15px;
    height: 15px;
    color: #7a7a80;
    flex-shrink: 0;
  }

  .search input {
    border: 0;
    background: transparent;
    padding: 0;
    height: auto;
    width: 100%;
    outline: none;
  }

  .apply {
    background: #1a1a1a;
    color: #fff;
    border-color: transparent;
    font-weight: 700;
    cursor: pointer;
    padding: 0 1.1rem;
    border-radius: 999px;
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
    min-width: 920px;
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

  .mono-id {
    font-size: 0.61rem;
    font-weight: 700;
    color: #8a8a90;
  }

  .team-link {
    display: block;
    color: inherit;
    text-decoration: none;
  }

  .team-link strong {
    display: block;
    font-weight: 750;
    color: #1a1a1a;
  }

  .team-link small {
    display: block;
    margin-top: 2px;
    font-size: 0.59rem;
    color: #8a8a90;
    font-weight: 500;
    max-width: 280px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .team-link:hover strong {
    text-decoration: underline;
  }

  .lead {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-weight: 600;
  }

  .face {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 0.45rem;
    font-style: normal;
    font-weight: 750;
    background: rgba(26, 26, 26, 0.08);
  }

  .dash-chips {
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

  .chip.count {
    background: rgba(170, 210, 235, 0.4);
    color: #2a5a7a;
  }

  .chip.dash {
    background: rgba(170, 220, 190, 0.4);
    color: #2f6b4a;
  }

  .detail-link {
    font-size: 0.61rem;
    font-weight: 700;
    color: #1a1a1a;
    text-decoration: none;
  }

  .detail-link:hover {
    text-decoration: underline;
  }

  .muted {
    color: #aeaeb2;
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
    z-index: 100;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(20, 20, 22, 0.35);
    backdrop-filter: blur(6px);
  }

  .modal {
    width: min(540px, 100%);
    max-height: min(90vh, 720px);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  }

  .liquidGlass-wrapper {
    position: relative;
    display: flex;
    overflow: hidden;
    isolation: isolate;
    max-height: inherit;
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
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.55);
    overflow: auto;
    max-height: inherit;
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
    flex-shrink: 0;
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

  .pick-block {
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 14px;
    padding: 10px 12px;
    margin: 0;
  }

  .pick-block legend {
    font-size: 0.56rem;
    font-weight: 600;
    color: #6b6b6b;
    padding: 0 4px;
  }

  .pick-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-top: 6px;
    max-height: 120px;
    overflow: auto;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.61rem;
    font-weight: 600;
    cursor: pointer;
  }

  .check input {
    width: auto;
    height: auto;
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

