<script>
  "/* link removed, native <a> works in SvelteKit */"
  import GlassPanel from '$lib/GlassPanel.svelte'
  import SubmenuHeader from '$lib/SubmenuHeader.svelte'
  import {
    getActivityLog,
    loadActivityLogDetail,
    rememberLogDetailId,
    objectTypeLabel,
    activityLogStore,
  } from '$lib/activityLogStore.svelte.js'
  import { formatDate } from '$lib/format.js'

  import { page } from '$app/state'

  const log = $derived.by(() => {
    void activityLogStore.items
    return page.params.id ? getActivityLog(page.params.id) : null
  })

  $effect(() => {
    if (page.params.id) {
      rememberLogDetailId(page.params.id)
      loadActivityLogDetail(page.params.id)
    }
  })

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
    const time = stamp.slice(11)
    return `${formatDate(date)} ${time}`
  }

  /** @param {import('../lib/activityLogStore.svelte.js').ObjectType} type @param {number} id */
  function objectLink(type, id) {
    return type === 'task' ? '/tasks/list' : `/registry/${id}`
  }
</script>

<section class="page">
  {#if !log}
    <GlassPanel>
      <SubmenuHeader title="Not found" />
      <div class="empty">
        <p>No entry with that ID.</p>
        <a class="btn" href="/activity-log">← Back</a>
      </div>
    </GlassPanel>
  {:else}
    <GlassPanel>
      <SubmenuHeader
        title={log.action}
        meta={formatStamp(log.at)}
      />

      <div class="summary">
        <div class="summary-item">
          <span class="label">Aktor</span>
          <span class="actor">
            <i class="face">{initials(log.actor)}</i>
            <strong>{log.actor}</strong>
          </span>
        </div>
        <div class="summary-item">
          <span class="label">Objek</span>
          <a class="obj-link" href={objectLink(log.objectType, log.objectId)}>
            <span class={`chip obj-${log.objectType}`}>{objectTypeLabel(log.objectType)}</span>
            {log.objectLabel}
          </a>
        </div>
        <div class="summary-item">
          <span class="label">ID</span>
          <strong class="mono">{log.id}</strong>
        </div>
      </div>
    </GlassPanel>

    <GlassPanel class="fill compare-panel">
      <div class="compare-head">
        <h3>Perbandingan</h3>
        <span class="count">{log.changes.length} field</span>
      </div>

      {#if log.changes.length === 0}
        <p class="state">No data changes.</p>
      {:else}
        <div class="compare-wrap">
          <table class="compare-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Before</th>
                <th></th>
                <th>After</th>
              </tr>
            </thead>
            <tbody>
              {#each log.changes as change (change.field)}
                <tr class:changed={change.before !== change.after}>
                  <td class="field">{change.label}</td>
                  <td class="before">
                    <span class:empty={change.before === '—'}>{change.before}</span>
                  </td>
                  <td class="arrow" aria-hidden="true">→</td>
                  <td class="after">
                    <span class:empty={change.after === '—'}>{change.after}</span>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      <div class="foot">
        <a class="back" href="/activity-log">← Back</a>
      </div>
    </GlassPanel>
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

  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .summary-item {
    display: grid;
    gap: 6px;
  }

  .label {
    font-size: 0.54rem;
    font-weight: 650;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #8a8a90;
  }

  .summary-item strong {
    font-size: 0.72rem;
    font-weight: 700;
    color: #1a1a1a;
  }

  .mono {
    font-size: 0.65rem;
    font-weight: 700;
    color: #8a8a90;
    font-family: ui-monospace, monospace;
  }

  .actor {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }

  .face {
    width: 26px;
    height: 26px;
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
    font-size: 0.54rem;
    font-weight: 700;
    background: rgba(0, 0, 0, 0.06);
    color: #3a3a3a;
    width: fit-content;
  }

  .obj-task { background: rgba(196, 210, 240, 0.4); color: #3a5080; }
  .obj-dashboard { background: rgba(242, 190, 160, 0.4); color: #8a4b2a; }

  .obj-link {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.72rem;
    font-weight: 700;
    color: #065fc6;
    text-decoration: none;
  }

  .obj-link:hover {
    text-decoration: underline;
  }

  :global(.compare-panel) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .compare-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .compare-head h3 {
    margin: 0;
    font-size: 0.76rem;
    font-weight: 750;
    color: #1a1a1a;
  }

  .count {
    font-size: 0.59rem;
    font-weight: 650;
    color: #8a8a90;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.05);
  }

  .compare-wrap {
    flex: 1;
    min-height: 0;
    overflow: auto;
    margin: -4px;
  }

  .compare-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 640px;
  }

  .compare-table th,
  .compare-table td {
    text-align: left;
    padding: 0.85rem 0.75rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    vertical-align: middle;
    font-size: 0.68rem;
  }

  .compare-table th {
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

  .compare-table tbody tr:last-child td {
    border-bottom: 0;
  }

  tr.changed .before {
    background: rgba(235, 170, 180, 0.12);
  }

  tr.changed .after {
    background: rgba(170, 220, 190, 0.15);
  }

  .field {
    font-weight: 700;
    color: #3a3a3a;
    width: 18%;
  }

  .before,
  .after {
    width: 38%;
  }

  .before span,
  .after span {
    display: block;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1.45;
    word-break: break-word;
  }

  .before span.empty,
  .after span.empty {
    color: #aeaeb2;
    font-style: italic;
  }

  .arrow {
    width: 32px;
    text-align: center;
    color: #aeaeb2;
    font-weight: 700;
    font-size: 0.79rem;
  }

  .foot {
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .back {
    font-size: 0.65rem;
    font-weight: 700;
    color: #1a1a1a;
    text-decoration: none;
  }

  .back:hover {
    text-decoration: underline;
  }

  .empty {
    margin-top: 1rem;
    padding: 1.25rem 1.35rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: grid;
    gap: 0.85rem;
    justify-items: start;
  }

  .empty p {
    margin: 0;
    font-size: 0.72rem;
    color: #64748b;
    line-height: 1.45;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    height: 2.35rem;
    padding: 0 1rem;
    border-radius: 999px;
    background: #1a1a1a;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    text-decoration: none;
  }

  .state {
    margin: 0;
    padding: 1.5rem;
    text-align: center;
    color: #7a7a80;
    font-weight: 550;
  }
</style>
