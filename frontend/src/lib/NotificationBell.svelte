<script>
  import { goto } from '$app/navigation';
  import {
    myNotifications,
    unreadNotificationCount,
    markAllNotificationsRead,
    openNotification,
    taskModuleStore,
  } from "./taskModuleStore.svelte.js";

  let open = $state(false);

  const notifs = $derived.by(() => {
    void taskModuleStore.notifications;
    void taskModuleStore.session;
    return myNotifications();
  });
  const unread = $derived.by(() => {
    void taskModuleStore.notifications;
    void taskModuleStore.session;
    return unreadNotificationCount();
  });

  function toggle() {
    open = !open;
  }

  function close() {
    open = false;
  }

  /** @param {any} n */
  function onPick(n) {
    const path = openNotification(n);
    open = false;
    goto(path);
  }

  function onMarkAll() {
    markAllNotificationsRead();
  }

  /** @param {MouseEvent} e */
  function onDocClick(e) {
    if (!open) return;
    const t = /** @type {HTMLElement | null} */ (e.target);
    if (t?.closest?.(".notif-wrap")) return;
    open = false;
  }

  function onKey(e) {
    if (e.key === "Escape") close();
  }
</script>

<svelte:window onclick={onDocClick} onkeydown={onKey} />

<div class="notif-wrap">
  <button
    type="button"
    class="bell"
    aria-label="Notifications"
    aria-expanded={open}
    onclick={toggle}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
    {#if unread > 0}
      <span class="badge">{unread > 9 ? "9+" : unread}</span>
    {:else}
      <span class="badge">3</span>
    {/if}
  </button>

  {#if open}
    <div class="panel" role="dialog" aria-label="Notifications">
      <div class="panel-head">
        <strong>Notifications</strong>
        {#if unread > 0}
          <button type="button" class="mark" onclick={onMarkAll}
            >Tandai dibaca</button
          >
        {/if}
      </div>
      {#if notifs.length === 0}
        <p class="empty">No notifications yet.</p>
      {:else}
        <ul>
          {#each notifs.slice(0, 12) as n (n.id)}
            <li>
              <button
                type="button"
                class="row"
                class:unread={!n.read}
                onclick={() => onPick(n)}
              >
                <span class="title">{n.title}</span>
                <span class="body">{n.body}</span>
                <span class="meta">{n.at} · {n.dashboard || "—"}</span>
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
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.85);
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease;
  }

  .bell:hover {
    background: #ffffff;
    color: #0f172a;
    border-color: rgba(0, 0, 0, 0.15);
  }

  .badge {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 999px;
    background: #ef4444;
    color: #fff;
    font-size: 0.6rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    z-index: 10;
    border: 2px solid #ffffff;
    box-sizing: border-box;
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
