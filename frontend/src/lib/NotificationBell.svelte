<script>
  import { goto } from '$app/navigation';
  import {
    myNotifications,
    unreadNotificationCount,
    markAllNotificationsRead,
    openNotification,
    taskModuleStore,
  } from "./taskModuleStore.svelte.js";
  import { formatRelativeTime } from "./format.js";

  let open = $state(false);
  let activeTab = $state('System'); // 'All' | 'System' | 'User'
  let showAll = $state(false);

  const realNotifs = $derived.by(() => {
    void taskModuleStore.notifications;
    void taskModuleStore.session;
    return myNotifications();
  });

  const unread = $derived.by(() => {
    void taskModuleStore.notifications;
    void taskModuleStore.session;
    return unreadNotificationCount();
  });

  // Sample data to guarantee rich display matching user's design when database has no records
  const sampleData = [
    {
      id: 'sample-1',
      code: 'GRD-2026-0011',
      subject: 'Test',
      action: 'Evidence uploaded',
      details: 'Requester uploaded approval evidence for Corporate & Personal NDA.',
      timeAgo: '10 days ago',
      category: 'System',
      read: false,
    },
    {
      id: 'sample-2',
      code: 'GRD-2026-0011',
      subject: 'Test',
      action: 'Evidence uploaded',
      details: 'Requester uploaded approval evidence for PDP Compliance.',
      timeAgo: '10 days ago',
      category: 'System',
      read: false,
    },
    {
      id: 'sample-3',
      code: 'GRD-2026-0011',
      subject: 'Test',
      action: 'Evidence uploaded',
      details: 'Requester uploaded approval evidence for Data Owner.',
      timeAgo: '10 days ago',
      category: 'System',
      read: false,
    },
    {
      id: 'sample-4',
      code: 'GRD-2026-0011',
      subject: 'Test',
      action: 'Evidence uploaded',
      details: 'Requester uploaded approval evidence for Direktur Use Case Owner.',
      timeAgo: '10 days ago',
      category: 'System',
      read: true,
    },
    {
      id: 'sample-5',
      code: 'GRD-2026-0011',
      subject: 'Test',
      action: 'Submitted for review',
      details: 'Assessment "Test" — new submission',
      timeAgo: '10 days ago',
      category: 'System',
      read: true,
    },
    {
      id: 'sample-6',
      code: 'TSK-001',
      subject: 'Review EDM batch',
      action: 'Comment added',
      details: 'Alamsyah Putra menambahkan catatan pada task.',
      timeAgo: '2 hours ago',
      category: 'User',
      read: false,
    },
    {
      id: 'sample-7',
      code: 'TSK-019',
      subject: 'Front End',
      action: 'Move request',
      details: 'Asep Wahyudi meminta approval untuk pindah ke Testing.',
      timeAgo: '1 day ago',
      category: 'User',
      read: false,
    },
  ];

  function mapNotification(n) {
    const isUser = n.type === 'comment' || n.type === 'move_request' || n.category === 'User';
    const code = n.taskCode || (n.title && n.title.match(/^[A-Z0-9-]+/) ? n.title.match(/^[A-Z0-9-]+/)[0] : '');
    const subject = n.taskTitle || n.dashboard || '';
    const action = n.title && n.title !== code ? n.title : (n.type === 'comment' ? 'Comment added' : 'Task update');
    const details = n.body || '';
    const timeAgo = formatRelativeTime(n.at);
    return {
      id: n.id,
      code,
      subject,
      action,
      details,
      timeAgo,
      category: isUser ? 'User' : 'System',
      read: Boolean(n.read),
      raw: n,
    };
  }

  const items = $derived.by(() => {
    if (realNotifs && realNotifs.length > 0) {
      return realNotifs.map(mapNotification);
    }
    return sampleData;
  });

  const filteredItems = $derived.by(() => {
    let list = items;
    if (activeTab === 'System') {
      list = list.filter((i) => i.category === 'System');
    } else if (activeTab === 'User') {
      list = list.filter((i) => i.category === 'User');
    }
    return showAll ? list : list.slice(0, 5);
  });

  function toggle() {
    open = !open;
  }

  function close() {
    open = false;
  }

  /** @param {any} item */
  function onPick(item) {
    if (item.raw) {
      const path = openNotification(item.raw);
      open = false;
      goto(path);
    } else {
      item.read = true;
      open = false;
      goto('/tasks/board');
    }
  }

  function onMarkAll() {
    markAllNotificationsRead();
    for (const s of sampleData) s.read = true;
  }

  function onViewAll() {
    showAll = !showAll;
  }

  /** @param {MouseEvent} e */
  function onDocClick(e) {
    if (!open) return;
    const t = /** @type {HTMLElement | null} */ (e.target);
    if (t?.closest?.(".notif-wrap")) return;
    open = false;
  }

  /** @param {KeyboardEvent} e */
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
    {/if}
  </button>

  {#if open}
    <div class="panel" role="dialog" aria-label="Notifications">
      <!-- Header -->
      <div class="panel-head">
        <h2>Notifications</h2>
        <div class="head-right">
          <button type="button" class="btn-mark-all" onclick={onMarkAll}>
            Mark all as read
          </button>
          <span class="head-bell-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </span>
        </div>
      </div>

      <!-- Filter Tabs / Pills -->
      <div class="filter-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="pill-tab"
          class:active={activeTab === 'All'}
          aria-selected={activeTab === 'All'}
          onclick={() => (activeTab = 'All')}
        >
          <svg class="tab-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="18" x="3" y="3" rx="1.5" />
            <rect width="7" height="18" x="14" y="3" rx="1.5" />
          </svg>
          <span>All</span>
        </button>

        <button
          type="button"
          role="tab"
          class="pill-tab"
          class:active={activeTab === 'System'}
          aria-selected={activeTab === 'System'}
          onclick={() => (activeTab = 'System')}
        >
          <svg class="tab-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="12" x="3" y="4" rx="2" />
            <line x1="8" x2="16" y1="20" y2="20" />
            <line x1="12" x2="12" y1="16" y2="20" />
          </svg>
          <span>System</span>
        </button>

        <button
          type="button"
          role="tab"
          class="pill-tab"
          class:active={activeTab === 'User'}
          aria-selected={activeTab === 'User'}
          onclick={() => (activeTab = 'User')}
        >
          <svg class="tab-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>User</span>
        </button>
      </div>

      <!-- Notifications List -->
      {#if filteredItems.length === 0}
        <div class="empty-state">
          <p>No {activeTab.toLowerCase()} notifications yet.</p>
        </div>
      {:else}
        <div class="notif-list">
          {#each filteredItems as item (item.id)}
            <button
              type="button"
              class="notif-card"
              class:unread={!item.read}
              onclick={() => onPick(item)}
            >
              <!-- Icon badge: purple circular badge with monitor / user icon -->
              <div class="badge-icon" aria-hidden="true">
                {#if item.category === 'User'}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                {:else}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="12" x="3" y="4" rx="2" />
                    <line x1="8" x2="16" y1="20" y2="20" />
                    <line x1="12" x2="12" y1="16" y2="20" />
                  </svg>
                {/if}
              </div>

              <!-- Content text -->
              <div class="card-content">
                <div class="main-msg">
                  {#if item.code}
                    <span class="code">{item.code}</span>
                  {/if}
                  {#if item.subject}
                    <span class="subject"> {item.subject}</span>
                  {/if}
                  {#if item.code || item.subject}
                    <span class="sep"> · </span>
                  {/if}
                  {#if item.action}
                    <span class="action">{item.action}: </span>
                  {/if}
                  <span class="details">{item.details}</span>
                </div>
                <div class="time-ago">{item.timeAgo}</div>
              </div>
            </button>
          {/each}
        </div>
      {/if}

      <!-- Bottom View All Button -->
      <button type="button" class="btn-view-all" onclick={onViewAll}>
        {showAll ? 'Show Less' : 'View All'}
      </button>
    </div>
  {/if}
</div>

<style>
  .notif-wrap {
    position: relative;
    font-family: inherit;
  }

  /* Bell trigger in navigation bar */
  .bell {
    position: relative;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.95);
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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

  /* Main dropdown panel container */
  .panel {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: min(420px, calc(100vw - 32px));
    background: #ffffff;
    border-radius: 20px;
    border: 1px solid #edf2f7;
    box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.04);
    z-index: 1000;
    padding: 18px 18px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-sizing: border-box;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Header */
  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2px;
  }

  .panel-head h2 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.01em;
  }

  .head-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .btn-mark-all {
    border: none;
    background: #eef2ff;
    color: #4338ca;
    border-radius: 9999px;
    padding: 6px 14px;
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    white-space: nowrap;
  }

  .btn-mark-all:hover {
    background: #e0e7ff;
    color: #3730a3;
  }

  .head-bell-icon {
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Filter Tabs / Pills */
  .filter-tabs {
    display: flex;
    gap: 8px;
    margin-top: 2px;
    padding: 0 2px;
  }

  .pill-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #64748b;
    transition: all 0.15s ease;
    box-sizing: border-box;
  }

  .pill-tab:hover {
    border-color: #cbd5e1;
    color: #334155;
    background: #f8fafc;
  }

  .pill-tab.active {
    background: #eef2ff;
    border: 1.5px solid #4338ca;
    color: #4338ca;
    box-shadow: 0 1px 2px rgba(67, 56, 202, 0.08);
  }

  .tab-icon {
    flex-shrink: 0;
  }

  /* Notifications list */
  .notif-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 380px;
    overflow-y: auto;
    padding-right: 2px;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }

  .notif-list::-webkit-scrollbar {
    width: 5px;
  }

  .notif-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .notif-list::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 9999px;
  }

  /* Notification card item */
  .notif-card {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    width: 100%;
    background: #f4f6fc;
    border-radius: 14px;
    padding: 12px 14px;
    border: 1px solid transparent;
    cursor: pointer;
    text-align: left;
    font: inherit;
    color: inherit;
    transition: all 0.15s ease;
    box-sizing: border-box;
  }

  .notif-card:hover {
    background: #ebf0fa;
    border-color: #e2e8f0;
    transform: translateY(-1px);
  }

  .notif-card.unread {
    background: #f1f4fd;
    border-color: rgba(99, 102, 241, 0.15);
  }

  /* Circular purple badge */
  .badge-icon {
    width: 32px;
    height: 32px;
    min-width: 32px;
    border-radius: 50%;
    background: #7c3aed;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
    box-shadow: 0 2px 6px rgba(124, 58, 237, 0.25);
  }

  /* Content typography */
  .card-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .main-msg {
    font-size: 0.72rem;
    line-height: 1.45;
    color: #334155;
    word-break: break-word;
  }

  .code {
    font-weight: 750;
    color: #0f172a;
  }

  .subject {
    font-weight: 500;
    color: #1e293b;
  }

  .sep {
    color: #64748b;
    margin: 0 1px;
  }

  .action {
    color: #334155;
    font-weight: 450;
  }

  .details {
    color: #334155;
    font-weight: 400;
  }

  .time-ago {
    font-size: 0.65rem;
    color: #94a3b8;
    font-weight: 500;
  }

  /* Empty state */
  .empty-state {
    padding: 28px 16px;
    text-align: center;
    color: #94a3b8;
    font-size: 0.75rem;
  }

  .empty-state p {
    margin: 0;
  }

  /* View All button */
  .btn-view-all {
    width: 100%;
    margin-top: 2px;
    padding: 10px 0;
    border-radius: 9999px;
    border: 1.5px dashed #cbd5e1;
    background: transparent;
    color: #1e293b;
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    transition: all 0.15s ease;
    box-sizing: border-box;
  }

  .btn-view-all:hover {
    border-color: #94a3b8;
    background: #f8fafc;
    color: #0f172a;
  }
</style>
