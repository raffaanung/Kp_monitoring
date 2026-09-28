<script>
  import { push } from 'svelte-spa-router'
  import {
    myNotifications,
    unreadNotificationCount,
    markAllNotificationsRead,
    openNotification,
    taskModuleStore,
  } from './taskModuleStore.svelte.js'

  let open = $state(false)

  const notifs = $derived.by(() => {
    void taskModuleStore.notifications
    void taskModuleStore.session
    return myNotifications()
  })
  const unread = $derived.by(() => {
    void taskModuleStore.notifications
    void taskModuleStore.session
    return unreadNotificationCount()
  })

  function toggle() {
    open = !open
  }

  function close() {
    open = false
  }

  /** @param {any} n */
  function onPick(n) {
    const path = openNotification(n)
    open = false
    push(path)
  }

  function onMarkAll() {
    markAllNotificationsRead()
  }

  /** @param {MouseEvent} e */
  function onDocClick(e) {
    if (!open) return
    const t = /** @type {HTMLElement | null} */ (e.target)
    if (t?.closest?.('.notif-wrap')) return
    open = false
  }

  function onKey(e) {
    if (e.key === 'Escape') close()
  }
</script>

<svelte:window onclick={onDocClick} onkeydown={onKey} />

<div class="notif-wrap">
  <button type="button" class="bell" aria-label="Notifikasi" aria-expanded={open} onclick={toggle}>
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 16.5h11M8 16.5V10a4 4 0 1 1 8 0v6.5M10.2 16.5a1.8 1.8 0 0 0 3.6 0"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    {#if unread > 0}
      <span class="badge">{unread > 9 ? '9+' : unread}</span>
    {/if}
  </button>

  {#if open}
    <div class="panel" role="dialog" aria-label="Daftar notifikasi">
      <div class="panel-head">
        <strong>Notifikasi</strong>
        {#if unread > 0}
          <button type="button" class="mark" onclick={onMarkAll}>Tandai dibaca</button>
        {/if}
      </div>
      {#if notifs.length === 0}
        <p class="empty">Belum ada notifikasi.</p>
      {:else}
        <ul>
          {#each notifs.slice(0, 12) as n (n.id)}
            <li>
              <button type="button" class="row" class:unread={!n.read} onclick={() => onPick(n)}>
                <span class="title">{n.title}</span>
                <span class="body">{n.body}</span>
                <span class="meta">{n.at} · {n.dashboard || '—'}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>

<style>
  .notif-wrap {
    position: relative;
  }

  .bell {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.85);
    color: #2a5080;
    display: grid;
    place-items: center;
    cursor: pointer;
    padding: 0;
  }

  .bell svg {
    width: 18px;
    height: 18px;
  }

  .bell:hover {
    border-color: rgba(50, 140, 230, 0.35);
  }

  .badge {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: #e11d48;
    color: #fff;
    font-size: 0.45rem;
    font-weight: 750;
    display: grid;
    place-items: center;
    line-height: 1;
  }

  .panel {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: min(340px, calc(100vw - 32px));
    max-height: 380px;
    overflow: auto;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 12px 32px rgba(4, 40, 90, 0.16);
    z-index: 90;
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 12px 14px 8px;
    position: sticky;
    top: 0;
    background: rgba(255, 255, 255, 0.96);
  }

  .panel-head strong {
    font-size: 0.68rem;
  }

  .mark {
    border: none;
    background: transparent;
    color: #2a6cb0;
    font: inherit;
    font-size: 0.56rem;
    font-weight: 650;
    cursor: pointer;
    padding: 0;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0 0 8px;
  }

  .row {
    width: 100%;
    display: grid;
    gap: 2px;
    text-align: left;
    border: none;
    background: transparent;
    padding: 10px 14px;
    cursor: pointer;
    font: inherit;
    color: inherit;
  }

  .row:hover {
    background: rgba(50, 140, 230, 0.08);
  }

  .row.unread {
    background: rgba(50, 140, 230, 0.06);
  }

  .title {
    font-size: 0.61rem;
    font-weight: 700;
    color: #0f1b2e;
  }

  .body {
    font-size: 0.59rem;
    color: #4a6080;
    line-height: 1.35;
  }

  .meta {
    font-size: 0.52rem;
    color: #8a9bb0;
    font-weight: 550;
  }

  .empty {
    margin: 0;
    padding: 16px 14px 20px;
    font-size: 0.61rem;
    color: #8a9bb0;
  }
</style>
