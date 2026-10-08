<script>
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
    import logoFull from '$lib/assets/edm-logo.png'
  import NotificationBell from './NotificationBell.svelte'
  import ProfileSwitcher from './ProfileSwitcher.svelte'
  import {
    taskModuleStore,
  } from './taskModuleStore.svelte.js'
  import {
    displayName,
    avatarUrl,
  } from './settingsStore.svelte.js'

  let { children } = $props()

  const session = $derived.by(() => {
    void taskModuleStore.session
    return taskModuleStore.session
  })

  const profileName = $derived.by(() => {
    void taskModuleStore.session
    return displayName()
  })

  const profileAvatar = $derived.by(() => {
    void taskModuleStore.session
    return avatarUrl() || ''
  })

  /** Expanded = full + labels; collapsed = icon-only (hide) */
  let railExpanded = $state(
    typeof localStorage === 'undefined' ? false : localStorage.getItem('edm-rail-expanded') === '1',
  )

  function setRailExpanded(open) {
    railExpanded = open
    try {
      localStorage.setItem('edm-rail-expanded', open ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  const path = $derived(page.url.pathname || '/')
  const isLoginPage = $derived(path === '/login')
  const onTasks = $derived(path.startsWith('/tasks'))
  const onRequirements = $derived(path.startsWith('/requirements'))
  const onRegistry = $derived(path.startsWith('/registry'))
  const onAccess = $derived(path.startsWith('/access'))
  
  let workboardOpen = $state(false);
  let settingsOpen = $state(false);

  $effect(() => {
    if (onTasks || onRequirements) workboardOpen = true;
    if (onAccess) settingsOpen = true;
  });

  /** Same labels as sidebar nav — driven by current route */
  const section = $derived.by(() => {
    if (path.startsWith('/tasks/board') || path === '/tasks' || path === '/tasks/new' || path === '/tasks/detail') {
      return { title: 'Workboard', sub: 'Kanban Board' }
    }
    if (path.startsWith('/tasks/list')) {
      return { title: 'Workboard', sub: 'List' }
    }
    if (path.startsWith('/tasks')) {
      return { title: 'Workboard', sub: 'Detail' }
    }
    if (path.startsWith('/requirements')) {
      return { title: 'Workboard', sub: 'Requirements & Backlog' }
    }
    if (path.startsWith('/registry')) {
      return { title: 'Katalog Aplikasi', sub: 'Daftar Portofolio Aplikasi' }
    }
    if (/^\/activity-log\/log-/.test(path)) {
      return { title: 'Activity Log', sub: 'Detail perubahan' }
    }
    if (path.startsWith('/activity-log')) {
      return { title: 'Activity Log', sub: 'Riwayat aktivitas sistem' }
    }
    if (path === '/access/users' || path === '/access') {
      return { title: 'Settings & Access', sub: 'User List' }
    }
    if (path.startsWith('/access/roles')) {
      return { title: 'Settings & Access', sub: 'Role Management' }
    }
    if (path === '/access/profile') {
      return { title: 'Settings & Access', sub: 'Profile' }
    }
    if (path.startsWith('/access')) {
      return { title: 'Settings & Access', sub: 'Manajemen akses pengguna' }
    }
    return { title: 'Dashboard', sub: 'Overview operasional proyek' }
  })

  const isHome = $derived(path === '/')

  function isTaskSub(sub) {
    if (sub === 'board') return path === '/tasks/board' || path === '/tasks'
    if (sub === 'list') return path === '/tasks/list'
    return false
  }

  function isRequirementSub(sub) {
    if (sub === 'list') return path.startsWith('/requirements')
    return false
  }

  function isRegistrySub(sub) {
    if (sub === 'list') return path.startsWith('/registry')
    return false
  }

  function isAccessSub(sub) {
    if (sub === 'users') return path === '/access' || path === '/access/users'
    if (sub === 'roles') return path === '/access/roles'
    if (sub === 'profile') return path === '/access/profile'
    return false
  }

</script>

{#if isLoginPage}
  {@render children()}
{:else}
<div class="shell" class:expanded={railExpanded}>
  <div class="rail-wrap">
    <aside class="rail" aria-label="Navigasi utama" aria-expanded={railExpanded}>
      <div class="rail-inner">
        <div class="rail-top">
          <button
            type="button"
            class="circle rail-toggle"
            aria-label={railExpanded ? 'Sembunyikan navigasi' : 'Tampilkan navigasi'}
            title={railExpanded ? 'Sembunyikan' : 'Tampilkan'}
            onclick={() => setRailExpanded(!railExpanded)}
          >
            <span class="toggle-icon collapse" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M14.5 7.5 10 12l4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="toggle-icon expand" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9.5 7.5 14 12l-4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </button>
          <span class="rail-menu-title" aria-hidden={!railExpanded}>All Menu</span>
        </div>

        <nav>
          <a href="/" class="nav-item" class:active={isHome} aria-label="Dashboard" title="Dashboard">
            <span class="circle" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="4.5" width="17" height="13" rx="2.2" stroke="currentColor" stroke-width="1.7" />
                <path d="M7 14.2 9.6 10.8l2.2 2.4 3.4-4.6 2.3 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M8 19.5h8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
            </span>
            <span class="nav-label">Dashboard</span>
          </a>

          <a
            href="/registry/list"
            
            class="nav-item"
            class:active={onRegistry}
            aria-label="Katalog Aplikasi"
            title="Katalog Aplikasi"
            onclick={() => {
              if (window.location.hash.includes('/registry/list')) {
                window.dispatchEvent(new CustomEvent('reset-registry'));
              }
            }}
          >
            <span class="circle" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M13 4.5 8.2 13h3.1L11 19.5 15.8 11h-3.1L13 4.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
              </svg>
            </span>
            <span class="nav-label">Katalog Aplikasi</span>
          </a>

          <!-- Workboard Group -->
          <div class="nav-group" class:open={workboardOpen}>
            <button
              type="button"
              class="nav-item"
              class:active={onTasks || onRequirements}
              aria-label="Workboard"
              title="Workboard"
              onclick={() => { workboardOpen = !workboardOpen; }}
            >
              <span class="circle" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M7 6.5h10M7 12h10M7 17.5h6.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                  <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
                </svg>
              </span>
              <span class="nav-label">Workboard</span>
              <span class="nav-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </button>
            <div class="subnav" class:visible={workboardOpen}>
              <a href="/requirements/list" class="sub-item" class:on={onRequirements}>Backlog & Requirements</a>
              <a href="/tasks/board" class="sub-item" class:on={onTasks}>Kanban Board</a>
            </div>
          </div>

          <!-- Settings & Access Group -->
          <div class="nav-group" class:open={settingsOpen}>
            <button
              type="button"
              class="nav-item"
              class:active={onAccess}
              aria-label="Settings & Access"
              title="Settings & Access"
              onclick={() => { settingsOpen = !settingsOpen; }}
            >
              <span class="circle" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8.5" r="3.2" stroke="currentColor" stroke-width="1.7" />
                  <path d="M6.5 19.5c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                  <path d="M16.5 7.5h3.5M18.25 5.75v3.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
                </svg>
              </span>
              <span class="nav-label">Settings & Access</span>
              <span class="nav-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </button>
            <div class="subnav" class:visible={settingsOpen}>
              <a href="/access/users" class="sub-item" class:on={isAccessSub('users')}>Users</a>
              <a href="/access/roles" class="sub-item" class:on={isAccessSub('roles')}>Roles</a>
            </div>
          </div>

          <a href="/activity-log" class="nav-item" class:active={path.startsWith('/activity-log')} aria-label="Activity Log" title="Activity Log">
            <span class="circle" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M8 5.5h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
                <path d="M9.5 9h5M9.5 12h5M9.5 15h3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
            </span>
            <span class="nav-label">Activity Log</span>
          </a>
        </nav>

        <button
          type="button"
          class="nav-item rail-foot"
          aria-label="Keluar"
          title="Keluar"
          onclick={() => {
            try { localStorage.removeItem('edm-session') } catch { /* ignore */ }
            goto('/login')
          }}
        >
          <span class="circle" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="12" r="6.2" stroke="currentColor" stroke-width="1.7" />
              <path d="M11 12h8.5M17.2 9.2 20 12l-2.8 2.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="nav-label">Keluar</span>
        </button>
      </div>
    </aside>
  </div>

  <div class="stage">
    {#if !isHome}
      <header class="section-head">
        <a href="/" class="brand-logo" aria-label="EDM Task Monitoring" title="EDM Task Monitoring">
          <img src={logoFull} alt="EDM Task Monitoring" />
        </a>
        <div class="section-copy">
          <h1>{section.title}</h1>
          <p>{section.sub}</p>
        </div>
        <div class="chrome-right">
          <NotificationBell />
          <ProfileSwitcher
            name={profileName}
            label={session.label}
            avatar={profileAvatar}
            currentId={session.id}
          />
        </div>
      </header>
    {/if}
    <div class="stage-body">
      {@render children()}
    </div>
  </div>
</div>
{/if}

<style>
  .shell {
    display: flex;
    min-height: 100vh;
    height: 100vh;
    overflow: hidden;
    color: #1a1a1a;
    font-family: 'Plus Jakarta Sans', ui-sans-serif, sans-serif;
    background:
      radial-gradient(920px 560px at 8% -6%, rgba(190, 196, 206, 0.22), transparent 62%),
      radial-gradient(760px 480px at -4% 110%, rgba(175, 182, 192, 0.12), transparent 56%),
      radial-gradient(640px 420px at 100% 0%, rgba(210, 214, 220, 0.16), transparent 52%),
      #f2f3f5;
  }

  /* Lebar slot ikut animasi — konten didorong, tidak ditutupi */
  .rail-wrap {
    position: relative;
    z-index: 5;
    flex: 0 0 auto;
    width: 76px;
    height: 100%;
    will-change: width;
    transition: width 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .shell.expanded .rail-wrap {
    width: 248px;
  }

  .rail {
    width: calc(100% - 20px);
    height: calc(100% - 28px);
    margin: 14px 8px 14px 12px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow:
      0 2px 12px rgba(0, 0, 0, 0.04),
      inset 1px 1px 0 rgba(255, 255, 255, 0.7);
    overflow: hidden;
    transform: translateZ(0);
  }

  .rail-inner {
    width: 216px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 10px;
    box-sizing: border-box;
  }

  .rail-top {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    flex-shrink: 0;
    width: 100%;
    min-height: 48px;
    padding: 4px 8px 4px 0;
    box-sizing: border-box;
  }

  .shell.expanded .rail-top {
    justify-content: flex-start;
  }

  .rail-menu-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #8e8e93;
    white-space: nowrap;
    opacity: 0;
    transform: translateX(-6px);
    pointer-events: none;
    transition:
      opacity 0.28s ease,
      transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .shell.expanded .rail-menu-title {
    opacity: 1;
    transform: translateX(0);
    transition-delay: 0.05s;
  }

  nav {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    flex: 1;
    justify-content: flex-start;
    min-height: 0;
    width: 100%;
    padding-top: 0;
    overflow: auto;
  }

  .nav-group {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .subnav {
    position: relative;
    display: none;
    grid-template-columns: 1fr;
    gap: 3px;
    margin: 3px 0 6px 20px;
    padding: 3px 0 3px 12px;
    border-left: 1.5px solid rgba(0, 0, 0, 0.12);
    overflow: hidden;
    pointer-events: none;
  }

  .subnav.visible {
    display: grid;
    pointer-events: auto;
    animation: subnav-in 0.22s ease;
  }

  @keyframes subnav-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .sub-item {
    display: block;
    padding: 0.42rem 0.75rem;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b6b6b;
    text-decoration: none;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .sub-item:hover {
    background: rgba(255, 255, 255, 0.7);
    color: #1a1a1a;
  }

  .sub-item.on {
    background: rgba(26, 26, 26, 0.09);
    color: #1a1a1a;
    font-weight: 700;
  }

  .nav-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    box-sizing: border-box;
    text-decoration: none;
    color: inherit;
    font: inherit;
    border: none;
    background: transparent;
    padding: 4px 8px 4px 0;
    cursor: pointer;
    border-radius: 999px;
    transition: background 0.28s ease;
    flex-shrink: 0;
  }

  .nav-chevron {
    margin-left: auto;
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8e8e93;
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.28s ease, transform 0.25s ease, color 0.2s ease;
    flex-shrink: 0;
  }

  .shell.expanded .nav-chevron {
    opacity: 1;
    transform: translateX(0);
  }

  .nav-group.open .nav-chevron svg {
    transform: rotate(90deg);
  }

  .nav-chevron svg {
    width: 12px;
    height: 12px;
    transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .nav-item:hover .nav-chevron {
    color: #1a1a1a;
  }

  .shell.expanded .nav-item:hover {
    background: rgba(255, 255, 255, 0.55);
  }

  .circle {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    display: grid;
    place-items: center;
    background: rgba(255, 255, 255, 0.7);
    color: #3a3a3a;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    flex-shrink: 0;
    transition: background 0.28s ease, color 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
  }

  .nav-item:hover .circle {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    color: #1a1a1a;
  }

  .circle svg {
    width: 17px;
    height: 17px;
  }

  .nav-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #2a2a2a;
    white-space: nowrap;
    opacity: 0;
    transform: translateX(-8px);
    transition:
      opacity 0.28s ease,
      transform 0.4s cubic-bezier(0.32, 0.72, 0, 1),
      color 0.28s ease;
  }

  .shell.expanded .nav-label {
    opacity: 1;
    transform: translateX(0);
    transition-delay: 0.05s;
  }

  .rail-toggle {
    position: relative;
    width: 40px;
    height: 40px;
    color: #6b6b6b;
    cursor: pointer;
    font: inherit;
    flex-shrink: 0;
  }

  .rail-toggle:hover {
    color: #1a1a1a;
  }

  .toggle-icon {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  }

  .toggle-icon svg {
    width: 15px;
    height: 15px;
  }

  .toggle-icon.collapse {
    opacity: 0;
    transform: rotate(-90deg) scale(0.85);
  }

  .toggle-icon.expand {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }

  .shell.expanded .toggle-icon.collapse {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }

  .shell.expanded .toggle-icon.expand {
    opacity: 0;
    transform: rotate(90deg) scale(0.85);
  }

  /* Active: circle tetap gelap (tidak flip mendadak saat expand) */
  :global(.rail nav .nav-item.active .circle),
  :global(.rail .nav-item.active .circle) {
    background: #1a1a1a;
    color: #fff;
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.14);
  }

  :global(.rail nav .nav-item.active:hover .circle) {
    background: #1a1a1a;
    color: #fff;
  }

  :global(.shell.expanded nav .nav-item.active) {
    background: rgba(26, 26, 26, 0.08);
  }

  :global(.shell.expanded nav .nav-item.active .nav-label) {
    color: #1a1a1a;
    font-weight: 700;
  }

  :global(.shell.expanded nav .nav-item.active .nav-chevron) {
    color: #1a1a1a;
  }

  :global(.shell.expanded nav .nav-item.active:hover) {
    background: rgba(26, 26, 26, 0.1);
  }

  .rail-foot {
    margin-top: auto;
    flex-shrink: 0;
  }

  .stage {
    flex: 1;
    min-width: 0;
    min-height: 0;
    height: 100%;
    padding: 14px 18px 16px 8px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    gap: 20px;
  }

  .section-head {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 4px 2px 10px;
    min-height: 0;
  }

  .brand-logo {
    display: block;
    flex-shrink: 0;
    line-height: 0;
  }

  .brand-logo img {
    display: block;
    height: 38px;
    width: auto;
    object-fit: contain;
    image-rendering: -webkit-optimize-contrast;
  }

  .section-copy {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    margin-left: auto;
    text-align: right;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(8px);
    padding: 6px 16px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  }

  .section-head h1 {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.2;
  }

  .section-head p {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 600;
    color: #64748b;
    line-height: 1.3;
  }

  .section-head p::before {
    content: '/';
    margin-right: 12px;
    color: #cbd5e1;
    font-weight: 400;
  }

  .chrome-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    margin-left: 8px;
  }

  .profile-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.85);
    border-radius: 999px;
    padding: 4px 12px 4px 4px;
    cursor: pointer;
    font: inherit;
    color: inherit;
    text-decoration: none;
  }

  .profile-chip:hover {
    border-color: rgba(0, 0, 0, 0.14);
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    object-fit: cover;
  }

  .profile-meta {
    display: grid;
    text-align: left;
    line-height: 1.15;
  }

  .profile-meta strong {
    font-size: 0.75rem;
    font-weight: 700;
  }

  .profile-meta small {
    font-size: 0.65rem;
    color: #8e8e93;
    font-weight: 550;
  }

  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .stage-body {
    flex: 1;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  @media (max-width: 900px) {
    .shell {
      flex-direction: column;
      height: auto;
      min-height: 100vh;
      overflow: auto;
    }

    .rail-wrap,
    .shell.expanded .rail-wrap {
      width: 100%;
      height: auto;
      transition: none;
    }

    .rail,
    .shell.expanded .rail {
      width: auto;
      height: auto;
      margin: 10px 12px 0;
      border-radius: 18px;
    }

    .rail-inner {
      width: 100%;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 10px;
    }

    .nav-label {
      display: none !important;
    }

    nav {
      flex-direction: row;
      flex: 1;
      justify-content: center;
      gap: 8px;
      padding-top: 0;
      overflow: visible;
    }

    .nav-group {
      flex-direction: row;
    }

    .subnav {
      display: none !important;
    }

    .nav-item {
      width: auto;
      padding: 0;
    }

    .rail-foot {
      margin-top: 0;
    }

    .circle {
      width: 38px;
      height: 38px;
    }

    .stage {
      height: auto;
      overflow: visible;
      padding: 12px 14px 20px;
    }
  }
</style>
