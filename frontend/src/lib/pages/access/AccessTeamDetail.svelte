<script>
  import { page } from '$app/state';
    import GlassPanel from '$lib/GlassPanel.svelte'
  import SubmenuHeader from '$lib/SubmenuHeader.svelte'
  import {
    getTeam,
    getUser,
    roleLabel,
    statusLabel,
  } from '$lib/accessStore.svelte.js'
  import { formatDate } from '$lib/format.js'

  /** @type {{ params?: { id?: string } }} */
  const teamId = $derived(Number(page.params.id || 0))
  const team = $derived(getTeam(teamId))

  const members = $derived.by(() => {
    if (!team) return []
    return team.member_ids
      .map((id) => getUser(id))
      .filter(Boolean)
  })

  const lead = $derived(team ? getUser(team.lead_id) : null)

  /** @param {string} n */
  function initials(n) {
    return n
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  }
</script>

<section class="page">
  {#if !team}
    <GlassPanel>
      <div class="empty-state">
        <p>Tim tidak ditemukan.</p>
        <a href="/access/teams" class="back">â† Kembali ke daftar tim</a>
      </div>
    </GlassPanel>
  {:else}
    <GlassPanel>
      <SubmenuHeader
        eyebrow="User Access"
        title="Team Detail"
        sub={team.description || 'Detail anggota dan dashboard tim'}
        meta={team.name}
      >
        {#snippet actions()}
          <a href="/access/teams" class="btn-ghost">â† Daftar Tim</a>
        {/snippet}
      </SubmenuHeader>

      <div class="meta-grid">
        <div class="meta-card">
          <span class="label">Unit</span>
          <strong>{team.unit}</strong>
        </div>
        <div class="meta-card">
          <span class="label">Team Lead</span>
          <strong>{lead?.name || 'â€”'}</strong>
        </div>
        <div class="meta-card">
          <span class="label">Anggota</span>
          <strong>{members.length} orang</strong>
        </div>
        <div class="meta-card">
          <span class="label">Dibuat</span>
          <strong>{formatDate(team.created_at.slice(0, 10))}</strong>
        </div>
      </div>
    </GlassPanel>

    <div class="columns">
      <GlassPanel class="fill">
        <h3>Anggota Tim</h3>
        {#if members.length === 0}
          <p class="state">Belum ada anggota.</p>
        {:else}
          <div class="member-list">
            {#each members as user (user.id)}
              <article class="member" class:is-lead={user.id === team.lead_id}>
                <i class="face">{initials(user.name)}</i>
                <div class="info">
                  <strong>
                    {user.name}
                    {#if user.id === team.lead_id}
                      <span class="badge">Lead</span>
                    {/if}
                  </strong>
                  <small>{user.email}</small>
                </div>
                <div class="tags">
                  <span class="chip role">{roleLabel(user.role_id)}</span>
                  <span class={`chip st-${user.status}`}>{statusLabel(user.status)}</span>
                </div>
              </article>
            {/each}
          </div>
        {/if}
      </GlassPanel>

      <GlassPanel class="fill side">
        <h3>Dashboard Terkait</h3>
        {#if team.dashboards.length === 0}
          <p class="state">Belum ada dashboard.</p>
        {:else}
          <ul class="dash-list">
            {#each team.dashboards as dash}
              <li>
                <span class="dash-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3.5" y="4.5" width="17" height="13" rx="2.2" stroke="currentColor" stroke-width="1.7" />
                    <path d="M7 14.2 9.6 10.8l2.2 2.4 3.4-4.6 2.3 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                {dash}
              </li>
            {/each}
          </ul>
        {/if}

        <div class="about">
          <h4>Tentang Tim</h4>
          <p>{team.description || 'â€”'}</p>
        </div>
      </GlassPanel>
    </div>
  {/if}
</section>

<style>
  .page {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
  }

  .empty-state p {
    margin: 0 0 12px;
    color: #7a7a80;
    font-weight: 600;
  }

  .back {
    font-size: 0.65rem;
    font-weight: 700;
    color: #1a1a1a;
  }

  :global(.btn-ghost) {
    height: 40px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 0 1rem;
    background: rgba(26, 26, 26, 0.06);
    color: #1a1a1a;
    font-size: 0.65rem;
    font-weight: 700;
    text-decoration: none;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .meta-card {
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  .meta-card .label {
    display: block;
    font-size: 0.54rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #8a8a90;
    margin-bottom: 4px;
  }

  .meta-card strong {
    font-size: 0.72rem;
    font-weight: 750;
    color: #1a1a1a;
  }

  .columns {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 12px;
    overflow: hidden;
  }

  :global(.columns .panel-glow.fill) {
    min-height: 0;
  }

  h3 {
    margin: 0 0 12px;
    font-size: 0.65rem;
    font-weight: 750;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8a8a90;
  }

  h4 {
    margin: 0 0 8px;
    font-size: 0.61rem;
    font-weight: 750;
    color: #6b6b6b;
  }

  .member-list {
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: grid;
    gap: 8px;
    align-content: start;
  }

  .member {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.42);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }

  .member.is-lead {
    border-color: rgba(91, 74, 138, 0.2);
    background: rgba(196, 181, 230, 0.12);
  }

  .face {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 0.54rem;
    font-style: normal;
    font-weight: 750;
    background: rgba(26, 26, 26, 0.08);
  }

  .info strong {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.72rem;
    font-weight: 750;
    color: #1a1a1a;
  }

  .info small {
    display: block;
    margin-top: 2px;
    font-size: 0.59rem;
    color: #8a8a90;
  }

  .badge {
    font-size: 0.5rem;
    font-weight: 750;
    padding: 0.15rem 0.45rem;
    border-radius: 999px;
    background: rgba(196, 181, 230, 0.45);
    color: #5b4a8a;
  }

  .tags {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  .chip {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: 0.54rem;
    font-weight: 700;
  }

  .chip.role {
    background: rgba(196, 181, 230, 0.4);
    color: #5b4a8a;
  }

  .st-active {
    background: rgba(170, 220, 190, 0.45);
    color: #2f6b4a;
  }

  .st-inactive {
    background: rgba(214, 184, 140, 0.3);
    color: #7a5a2e;
  }

  .dash-list {
    list-style: none;
    margin: 0 0 20px;
    padding: 0;
    display: grid;
    gap: 8px;
  }

  .dash-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(170, 220, 190, 0.15);
    border: 1px solid rgba(47, 107, 74, 0.12);
    font-size: 0.68rem;
    font-weight: 650;
    color: #1a1a1a;
  }

  .dash-icon {
    width: 28px;
    height: 28px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.7);
    color: #2f6b4a;
  }

  .dash-icon svg {
    width: 14px;
    height: 14px;
  }

  .about p {
    margin: 0;
    font-size: 0.65rem;
    line-height: 1.5;
    color: #6b6b6b;
  }

  .state {
    margin: 0;
    padding: 1rem 0;
    color: #7a7a80;
    font-weight: 550;
    font-size: 0.68rem;
  }

  @media (max-width: 900px) {
    .meta-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .columns {
      grid-template-columns: 1fr;
      overflow: auto;
    }
  }
</style>

