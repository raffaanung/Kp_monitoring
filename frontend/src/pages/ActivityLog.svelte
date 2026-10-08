<script>
  import { onMount } from 'svelte'
  import { link } from 'svelte-spa-router'
  import GlassPanel from '../lib/GlassPanel.svelte'
  import SubmenuHeader from '../lib/SubmenuHeader.svelte'
  import {
    listActivityLogs,
    loadActivityLogsFromApi,
    objectTypeLabel,
    rememberLogDetailId,
    activityLogStore,
  } from '../lib/activityLogStore.svelte.js'
  import { listDashboards, registryStore } from '../lib/registryStore.svelte.js'
  import { formatDate } from '../lib/format.js'

  onMount(() => {
    loadActivityLogsFromApi()
  })

  let dateFrom = $state('')
  let dateTo = $state('')
  let dashboard = $state('')

  let applied = $state({
    dateFrom: '',
    dateTo: '',
    dashboard: '',
  })

  const items = $derived.by(() => {
    void activityLogStore.items
    return listActivityLogs(applied)
  })

  const dashboards = $derived.by(() => {
    void registryStore.items
    return listDashboards({ sort: 'name_asc' })
  })

  function onSubmit(event) {
    event.preventDefault()
    applied = { dateFrom, dateTo, dashboard }
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

  /** @param {string} stamp */
  function formatStamp(stamp) {
    const date = stamp.slice(0, 10)
    const time = stamp.slice(11, 16)
    return `${formatDate(date)} · ${time}`
  }
</script>

<section class="page">
  <GlassPanel>
    <SubmenuHeader
      title="Riwayat"
      meta={`${items.length} entri`}
    />

    <form class="filters" onsubmit={onSubmit}>
      <label>
        <span>Dari</span>
        <input type="date" bind:value={dateFrom} />
      </label>

      <label>
        <span>Sampai</span>
        <input type="date" bind:value={dateTo} />
      </label>

      <label>
        <span>Dashboard</span>
        <select bind:value={dashboard}>
          <option value="">Semua</option>
          {#each dashboards as item (item.id)}
            <option value={item.name}>{item.name}</option>
          {/each}
        </select>
      </label>

      <button type="submit" class="apply">Terapkan</button>
    </form>
  </GlassPanel>

  <GlassPanel class="fill table-panel">
    {#if items.length === 0}
      <p class="state">Tidak ada entri yang cocok.</p>
    {:else}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Waktu</th>
              <th>Aktor</th>
              <th>Aksi</th>
              <th>Objek</th>
              <th>Perubahan</th>
            </tr>
          </thead>
          <tbody>
            {#each items as log (log.id)}
              <tr>
                <td><span class="mono-id">{log.id}</span></td>
                <td><span class="when">{formatStamp(log.at)}</span></td>
                <td>
                  <span class="actor">
                    <i class="face">{initials(log.actor)}</i>
                    {log.actor}
                  </span>
                </td>
                <td><span class="action-text">{log.action}</span></td>
                <td>
                  <span class={`chip obj-${log.objectType}`}>{objectTypeLabel(log.objectType)}</span>
                  <span class="obj-label">{log.objectLabel}</span>
                </td>
                <td>
                  <a
                    class="detail-link"
                    href={`/activity-log/${log.id}`}
                    use:link
                    onclick={() => rememberLogDetailId(log.id)}
                  >
                    {log.changes.length} field
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </GlassPanel>
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

  .when {
    font-weight: 600;
    color: #5a5a60;
    white-space: nowrap;
  }

  .actor {
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
    font-size: 0.5rem;
    font-style: normal;
    font-weight: 750;
    background: rgba(26, 26, 26, 0.08);
  }

  .chip {
    display: inline-block;
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    font-size: 0.56rem;
    font-weight: 700;
    background: rgba(0, 0, 0, 0.06);
    color: #3a3a3a;
    margin-right: 0.35rem;
  }

  .obj-task { background: rgba(196, 210, 240, 0.4); color: #3a5080; }
  .obj-dashboard { background: rgba(242, 190, 160, 0.4); color: #8a4b2a; }

  .action-text {
    font-weight: 650;
    color: #1a1a1a;
  }

  .obj-label {
    display: block;
    margin-top: 0.25rem;
    font-weight: 600;
    color: #3a3a3a;
  }

  .detail-link {
    color: #1a1a1a;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .detail-link:hover {
    color: #065fc6;
  }

  .state {
    margin: 0;
    padding: 1.5rem;
    text-align: center;
    color: #7a7a80;
    font-weight: 550;
  }
</style>
