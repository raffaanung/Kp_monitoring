<script>
  import { onMount } from 'svelte'
  import { fade, fly } from 'svelte/transition'
  import OpsChart from '../lib/OpsChart.svelte'
  import logoFull from '$lib/assets/edm-logo.png'
  import NotificationBell from '../lib/NotificationBell.svelte'
  import ProfileSwitcher from '../lib/ProfileSwitcher.svelte'
  import GlassSwitch from '../lib/GlassSwitch.svelte'
  import { link, push } from 'svelte-spa-router'
  import {
    addDays,
    toISODate,
    weeksOfMonth,
    daysOfWeek,
    dayBucket,
    monthLabel,
    weekIndexForDate,
    dateToTimelinePct,
    tasksInMonthWeeks,
    periodRange,
    tasksInRange,
    delayLabel,
    relativeWhen,
  } from '../lib/taskStore.svelte.js'
  import {
    taskModuleStore,
    workflowStatusColor,
    workflowLabel,
    workflowProgressSolid,
    workflowColumns,
    isOverdue,
  } from '../lib/taskModuleStore.svelte.js'
  import { pushTaskFilters } from '../lib/taskNav.js'
  import {
    requirementStore,
    requirementDashboardOptions,
    requirementStatusOptions,
  } from '../lib/requirementStore.svelte.js'
  import { registryStore, listDashboards } from '../lib/registryStore.svelte.js'
  import { loadAppData } from '../lib/loadAppData.js'
  import { avatarUrl } from '../lib/settingsStore.svelte.js'
  import { authStore } from '../lib/authStore.svelte.js'

  /**
   * Adapt module task → shape dipakai timeline helpers (startDate/meta/updatedAt).
   * @param {{ id: number, title: string, dashboard: string, status: string, created_at: string, deadline: string, pic: string, priority: string, updated_at: string }} t
   */
  function toBoardTask(t) {
    return {
      id: t.id,
      title: t.title,
      meta: t.dashboard,
      status: t.status,
      startDate: String(t.created_at || t.deadline).slice(0, 10),
      deadline: t.deadline,
      pic: t.pic,
      priority: t.priority,
      updatedAt: t.updated_at,
    }
  }

  const hour = new Date().getHours()
  const greet =
    hour < 11 ? 'Good morning' : hour < 15 ? 'Good afternoon' : hour < 18 ? 'Good evening' : 'Good night'

  /** @type {'today' | 'week' | 'month'} */
  let period = $state('month')

  const session = $derived.by(() => {
    void taskModuleStore.session
    return taskModuleStore.session
  })

  const profileAvatar = $derived.by(() => {
    void authStore.user
    return avatarUrl() || ''
  })

  const periodOptions = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This week' },
    { id: 'month', label: 'This month' },
  ]
  const feedOptions = [
    { id: 'tasks', label: 'Task' },
    { id: 'activity', label: 'Aktivitas' },
  ]
  const deadlineOptions = [
    { id: 'upcoming', label: 'Mendatang' },
    { id: 'overdue', label: 'Overdue' },
  ]
  const boardOptions = [
    { id: 'task', label: 'Task' },
    { id: 'requirement', label: 'Requirements' },
  ]
  const chartOptions = [
    { id: 'requirement', label: 'Requirements' },
    { id: 'dashboard', label: 'Dashboard' },
  ]

  /** @type {'task' | 'requirement'} */
  let boardView = $state('task')

  /** @param {import('../lib/requirementStore.svelte.js').Requirement} r */
  function toBoardRequirement(r) {
    return {
      id: r.id,
      title: r.title,
      meta: r.dashboard,
      status: r.status,
      startDate: String(r.created_at || r.due_date).slice(0, 10),
      deadline: r.due_date || String(r.created_at).slice(0, 10),
      pic: r.team[0] || r.created_by || '—',
      priority: '',
      updatedAt: r.updated_at,
    }
  }

  const now = new Date()
  const todayISO = toISODate(now)

  const range = $derived(periodRange(period, now))

  /** Semua task Kanban (pipeline 6 status) */
  const allBoardTasks = $derived.by(() => {
    void taskModuleStore.items
    return taskModuleStore.items.map(toBoardTask)
  })

  onMount(() => {
    loadAppData()
  })

  const allDashboards = $derived.by(() => {
    void registryStore.items
    return listDashboards()
  })
  const totalDashboardCount = $derived(allDashboards.length)

  const scopedTasks = $derived(tasksInRange(allBoardTasks, range.start, range.end))

  /** Feed & deadline — global, tidak ikut filter periode */
  const globalTasks = $derived(allBoardTasks)

  // Horizon diperluas ke 30 hari ke depan supaya deadline di minggu/bulan ini tidak hilang
  const horizonISO = toISODate(addDays(now, 30))

  const allDeadlinesCombined = $derived.by(() => {
    void taskModuleStore.items
    void requirementStore.items

    /** @type {Array<{ id: string | number, title: string, pic: string, deadline: string, priority: string, status: string, isReq: boolean, dashboard?: string }>} */
    const list = []

    // 1. Task Kanban
    for (const t of globalTasks) {
      if (!t.deadline || t.status === 'selesai') continue
      list.push({
        id: t.id,
        title: t.title,
        pic: t.pic || '—',
        deadline: t.deadline,
        priority: t.priority === 'high' ? 'High' : t.priority === 'low' ? 'Low' : 'Medium',
        status: t.status,
        isReq: false,
        dashboard: t.meta || '',
      })
    }

    // 2. Requirement
    for (const r of requirementStore.items) {
      if (!r.due_date || r.status === 'done') continue
      const picStr = Array.isArray(r.team) && r.team.length ? r.team.join(', ') : (r.created_by || '—')
      list.push({
        id: r.id,
        title: r.title,
        pic: picStr,
        deadline: r.due_date,
        priority: r.health === 'at_risk' ? 'High' : 'Medium',
        status: r.status,
        isReq: true,
        dashboard: r.dashboard || '',
      })
    }

    return list
  })

  const upcomingDeadlines = $derived(
    allDeadlinesCombined
      .filter((t) => (deadlineType === 'req' ? t.isReq : !t.isReq))
      .filter((t) => t.deadline >= todayISO && t.deadline <= horizonISO)
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 8),
  )

  const overdueTasks = $derived(
    allDeadlinesCombined
      .filter((t) => (deadlineType === 'req' ? t.isReq : !t.isReq))
      .filter((t) => t.deadline < todayISO)
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 8)
      .map((t) => ({
        ...t,
        delay: delayLabel(t.deadline, now),
      })),
  )

  const newestTasks = $derived(
    [...globalTasks]
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, 6)
      .map((t) => ({
        id: t.id,
        title: t.title,
        when: relativeWhen(t.updatedAt, now),
        status: t.status,
      })),
  )

  const recentActivities = $derived(
    [...globalTasks]
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, 6)
      .map((t) => {
        const action =
          t.status === 'selesai'
            ? 'menyelesaikan'
            : t.status === 'backlog'
              ? 'menambahkan task'
              : isOverdue(/** @type {any} */ (t))
                ? 'menandai overdue'
                : `update ${workflowLabel(t.status)}`
        const whenDate = new Date(t.updatedAt)
        const when =
          toISODate(whenDate) === todayISO
            ? whenDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            : relativeWhen(t.updatedAt, now)
        return { who: t.pic, action, target: t.title, when }
      }),
  )

  /** @type {'overdue' | 'upcoming'} */
  let deadlineTab = $state('upcoming')
  /** @type {'task' | 'req'} */
  let deadlineType = $state('task')
  /** @type {'tasks' | 'activity'} */
  let feedTab = $state('tasks')

  const heroStats = $derived.by(() => {
    const deadlineToday = scopedTasks.filter((t) => t.deadline === todayISO && t.status !== 'selesai').length
    const dueOrPast = scopedTasks.filter((t) => t.deadline <= todayISO)
    const onTime =
      dueOrPast.length === 0
        ? 100
        : Math.round((100 * dueOrPast.filter((t) => t.status === 'selesai').length) / dueOrPast.length)
    return { deadlineToday, onTime }
  })

  const metrics = $derived.by(() => {
    const total = scopedTasks.length
    const aktif = scopedTasks.filter((t) => t.status !== 'selesai').length
    const overdue = scopedTasks.filter((t) => isOverdue(/** @type {any} */ (t))).length
    const done = scopedTasks.filter((t) => t.status === 'selesai').length
    const periodNote =
      period === 'today' ? 'today' : period === 'week' ? 'this week' : 'this month'
    return [
      {
        label: 'Total Dashboard',
        value: String(totalDashboardCount),
        note: `${totalDashboardCount} sumber · ${periodNote}`,
        icon: 'dash',
        tone: 'mint',
        go: () => push('/registry/list'),
      },
      {
        label: 'Total Task',
        value: String(total),
        note: `semua status · ${periodNote}`,
        icon: 'task',
        tone: 'peach',
        go: () => pushTaskFilters({}),
      },
      {
        label: 'Task Aktif',
        value: String(aktif),
        note: 'belum selesai · pipeline Kanban',
        icon: 'aktif',
        tone: 'sky',
        go: () => pushTaskFilters({ aktif: 'yes' }),
      },
      {
        label: 'Task Overdue',
        value: String(overdue),
        note: overdue ? `melewati deadline` : 'aman',
        icon: 'alert',
        tone: 'rose',
        go: () => pushTaskFilters({ overdue: 'yes' }),
      },
      {
        label: 'Task Selesai',
        value: String(done),
        note: total ? `${Math.round((100 * done) / total)}% dari total` : 'dari total task',
        icon: 'done',
        tone: 'sand',
        go: () => pushTaskFilters({ status: 'selesai' }),
      },
    ]
  })

  const requirementLabels = ['Open', 'In progress', 'Selesai']
  const requirementColors = ['#94a3b8', '#065fc6', '#2f7a52']

  let chartDashboard = $state('')
  /** @type {'requirement' | 'dashboard'} */
  let chartView = $state('requirement')

  const chartDashboards = $derived.by(() => {
    void registryStore.items
    void requirementStore.items
    const set = new Set([
      ...allDashboards.map((d) => d.name),
      ...requirementDashboardOptions(),
    ])
    return [...set].filter(Boolean).sort()
  })

  const requirementSeries = $derived.by(() => {
    void requirementStore.items
    const source = chartDashboard
      ? requirementStore.items.filter((r) => r.dashboard === chartDashboard)
      : requirementStore.items
    const list = tasksInRange(source.map(toBoardRequirement), range.start, range.end)
    return [
      list.filter((r) => r.status === 'open').length,
      list.filter((r) => r.status === 'in_progress').length,
      list.filter((r) => r.status === 'done').length,
    ]
  })

  const dashboardBarColors = ['#065fc6', '#339ef5', '#7c6bc4', '#e0a45a', '#2f7a52', '#94a3b8']

  const dashboardBar = $derived.by(() => {
    void registryStore.items
    void taskModuleStore.items
    /** @type {Map<string, number>} */
    const counts = new Map()
    for (const d of allDashboards) {
      if (d.name) counts.set(d.name, 0)
    }
    for (const task of scopedTasks) {
      const name = task.meta
      if (name) {
        counts.set(name, (counts.get(name) || 0) + 1)
      }
    }
    const names = [...counts.keys()].sort(
      (a, b) => (counts.get(b) || 0) - (counts.get(a) || 0) || a.localeCompare(b),
    )
    return {
      labels: names,
      series: names.map((name) => counts.get(name) || 0),
      colors: names.map((_, i) => dashboardBarColors[i % dashboardBarColors.length]),
    }
  })

  const activeChart = $derived({
    labels: requirementLabels,
    series: requirementSeries,
    colors: requirementColors,
    type: /** @type {'donut'} */ ('donut'),
  })

  const chartLegend = $derived.by(() => {
    const total = activeChart.series.reduce((a, b) => a + b, 0) || 1
    return activeChart.labels.map((label, i) => {
      const value = activeChart.series[i] ?? 0
      return {
        label,
        value,
        pct: Math.round((value / total) * 100),
        color: activeChart.colors[i] ?? '#9a9aa0',
      }
    })
  })

  /** Axis buckets depend on period — drives Task per week visual */
  const boardBuckets = $derived.by(() => {
    if (period === 'today') return dayBucket(now)
    if (period === 'week') return daysOfWeek(now)
    return weeksOfMonth(now.getFullYear(), now.getMonth())
  })

  const boardTitle = $derived.by(() => {
    if (period === 'today') {
      return now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
    }
    if (period === 'week') {
      const start = boardBuckets[0]?.start
      const end = boardBuckets[boardBuckets.length - 1]?.end
      if (!start || !end) return 'This week'
      return `${start.getDate()}–${end.getDate()} ${end.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
    }
    return monthLabel(now.getFullYear(), now.getMonth())
  })

  const boardNoun = $derived(boardView === 'requirement' ? 'Requirements' : 'Tasks')
  const boardUnit = $derived(boardView === 'requirement' ? 'requirement' : 'task')

  const boardHeading = $derived(
    period === 'today' ? `${boardNoun} today` : period === 'week' ? `${boardNoun} per day` : `${boardNoun} per week`,
  )

  const weekCount = $derived(boardBuckets.length || 1)

  const currentWeekIdx = $derived.by(() => weekIndexForDate(now, boardBuckets))

  const todayPct = $derived.by(() => {
    if (currentWeekIdx < 0 || !boardBuckets.length) return -1
    return dateToTimelinePct(now, boardBuckets)
  })

  const todayChip = $derived(
    now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
  )

  const axisWeeks = $derived(
    boardBuckets.map((w, i) => {
      if (period === 'today') {
        return {
          ...w,
          range: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
          isCurrent: true,
        }
      }
      if (period === 'week') {
        return {
          ...w,
          range: String(w.start.getDate()),
          isCurrent: i === currentWeekIdx,
        }
      }
      const startMo = w.start.toLocaleDateString('id-ID', { month: 'short' })
      const endMo = w.end.toLocaleDateString('id-ID', { month: 'short' })
      const rangeLabel =
        startMo === endMo
          ? `${w.start.getDate()}–${w.end.getDate()} ${startMo}`
          : `${w.start.getDate()} ${startMo} – ${w.end.getDate()} ${endMo}`
      return { ...w, range: rangeLabel, isCurrent: i === currentWeekIdx }
    }),
  )

  const requirementBoard = $derived.by(() => {
    void requirementStore.items
    return requirementStore.items.map(toBoardRequirement)
  })

  const weekSource = $derived(
    boardView === 'requirement'
      ? tasksInRange(requirementBoard, range.start, range.end)
      : scopedTasks,
  )

  const weekItems = $derived(tasksInMonthWeeks(weekSource, boardBuckets))

  const taskCountsByStatus = $derived.by(() => {
    /** @type {Record<string, number>} */
    const counts = {}
    for (const col of workflowColumns) counts[col.key] = 0
    for (const t of weekSource) {
      if (t.status) counts[t.status] = (counts[t.status] || 0) + 1
    }
    return counts
  })

  const reqCountsByStatus = $derived.by(() => {
    /** @type {Record<string, number>} */
    const counts = { open: 0, in_progress: 0, done: 0 }
    for (const r of weekSource) {
      if (r.status) counts[r.status] = (counts[r.status] || 0) + 1
    }
    return counts
  })

  /** @type {{ task: { id: number, title: string, meta: string, status: string, startDate: string, deadline: string, pic: string }, x: number, y: number } | null} */
  let taskTip = $state(null)
  /** @type {ReturnType<typeof setTimeout> | null} */
  let tipShowTimer = null
  /** @type {ReturnType<typeof setTimeout> | null} */
  let tipHideTimer = null

  function clearTipTimers() {
    if (tipShowTimer) clearTimeout(tipShowTimer)
    if (tipHideTimer) clearTimeout(tipHideTimer)
    tipShowTimer = null
    tipHideTimer = null
  }

  /** @param {MouseEvent | FocusEvent} e @param {{ id: number, title: string, meta: string, status: string, startDate: string, deadline: string, pic: string }} task */
  function showTaskTip(e, task) {
    clearTipTimers()
    const el = /** @type {HTMLElement} */ (e.currentTarget)
    const r = el.getBoundingClientRect()
    const next = {
      task,
      x: Math.min(Math.max(r.left + r.width / 2, 140), window.innerWidth - 140),
      y: r.top,
    }
    if (taskTip) {
      taskTip = next
      return
    }
    tipShowTimer = setTimeout(() => {
      taskTip = next
      tipShowTimer = null
    }, 70)
  }

  function hideTaskTip() {
    clearTipTimers()
    tipHideTimer = setTimeout(() => {
      taskTip = null
      tipHideTimer = null
    }, 90)
  }

  /** @param {{ left: number, width: number }} bar @param {string} status */
  function weekBarStyle(bar, status = 'backlog') {
    const left = Math.max(0, Math.min(bar.left, 98))
    const width = Math.max(2, Math.min(bar.width, 100 - left))
    const ev = boardView === 'requirement' ? requirementColor(status) : workflowStatusColor(status)
    return `left:${left}%;width:${width}%;--ev:${ev}`
  }

  /** @param {string} status */
  function requirementColor(status) {
    if (status === 'done') return '#2f7a52'
    if (status === 'in_progress') return '#065fc6'
    return '#94a3b8'
  }

  /** @param {string} status */
  function barProgress(status) {
    if (boardView !== 'requirement') return workflowProgressSolid(status)
    if (status === 'done') return 1
    if (status === 'in_progress') return 0.62
    return 0.28
  }

  /** @param {string} status */
  function statusLabel(status) {
    if (boardView !== 'requirement') return workflowLabel(status)
    if (status === 'done') return 'Selesai'
    if (status === 'in_progress') return 'In progress'
    return 'Open'
  }

  /** @param {{ id: number, status: string }} item */
  function openWeekItem(item) {
    if (boardView === 'requirement') push(`/requirements/${item.id}`)
    else pushTaskFilters({ taskId: item.id })
  }

  /** @param {string} date */
  function formatDate(date) {
    return new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
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

  /** @param {string} name */
  function faceTone(name) {
    const tones = ['rose', 'sky', 'soft', 'mint', 'sand']
    let h = 0
    for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % tones.length
    return tones[h]
  }
</script>

<section class="beranda">
  <header class="page-header">
    <div class="topbar">
      <a href="/" use:link class="brand-logo" aria-label="ATA - Active Tasks Analytics" title="ATA - Active Tasks Analytics">
        <img src={logoFull} alt="ATA - Active Tasks Analytics" />
      </a>

      <div class="period-slot">
        <GlassSwitch
          label="Time range"
          options={periodOptions}
          value={period}
          onchange={(id) => (period = /** @type {'today' | 'week' | 'month'} */ (id))}
        />
      </div>

      <div class="topbar-right">
        <NotificationBell />
        <button type="button" class="circle-tool" aria-label="Bantuan">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="7.25" stroke="currentColor" stroke-width="1.7"/>
            <path d="M9.8 9.6a2.2 2.2 0 1 1 3.5 1.8c-.7.5-1.3 1-1.3 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            <circle cx="12" cy="16.4" r="0.9" fill="currentColor"/>
          </svg>
        </button>
        <ProfileSwitcher
          name={session.name}
          label={session.label}
          avatar={profileAvatar}
          currentId={session.id}
        />
      </div>
    </div>

    <div class="headline">
      <div class="headline-copy">
        <p class="hero-sub">Let's make this day productive.</p>
        <h1 class="hero-greet">{greet}, {session.name.split(' ')[0]}!</h1>
      </div>

      <div class="headline-meta">
        <div class="hero-stats">
          <div class="stat">
            <span>Deadline hari ini</span>
            <div><strong>{heroStats.deadlineToday}</strong></div>
          </div>
          <div class="stat">
            <span>On-time rate</span>
            <div><strong>{heroStats.onTime}%</strong><em class="up">↗</em></div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <div class="metrics-rail liquidGlass-wrapper">
    <div class="liquidGlass-effect"></div>
    <div class="liquidGlass-tint"></div>
    <div class="liquidGlass-shine"></div>

    <div class="metrics">
      {#key period}
        {#each metrics as m, i (m.label)}
          <div class="metric-shell" in:fly={{ y: 8, duration: 240, delay: i * 40 }}>
          <button
            type="button"
            class="metric-card liquidGlass-wrapper {m.tone} clickable"
            onclick={() => m.go()}
          >
          <div class="liquidGlass-effect"></div>
          <div class="liquidGlass-tint"></div>
          <div class="liquidGlass-shine"></div>

          <div class="metric-top">
            <span class="metric-label">{m.label}</span>
          </div>

          <div class="metric-mid">
            <strong class="metric-value">{m.value}</strong>
            <div class="metric-icon" aria-hidden="true">
              {#if m.icon === 'dash'}
                <svg viewBox="0 0 24 24" fill="none"><path d="M7 8h10M7 12h6M8.5 5.5h7A1.5 1.5 0 0 1 17 7v11.2l-5-2.4-5 2.4V7A1.5 1.5 0 0 1 8.5 5.5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {:else if m.icon === 'task'}
                <svg viewBox="0 0 24 24" fill="none"><rect x="4.5" y="4.5" width="6.2" height="6.2" rx="1.4" stroke="currentColor" stroke-width="1.7"/><rect x="13.3" y="4.5" width="6.2" height="6.2" rx="1.4" stroke="currentColor" stroke-width="1.7"/><rect x="4.5" y="13.3" width="6.2" height="6.2" rx="1.4" stroke="currentColor" stroke-width="1.7"/><rect x="13.3" y="13.3" width="6.2" height="6.2" rx="1.4" stroke="currentColor" stroke-width="1.7"/></svg>
              {:else if m.icon === 'aktif'}
                <svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5 9.2 17 19 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {:else if m.icon === 'done'}
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Z" stroke="currentColor" stroke-width="1.7"/><path d="m8.8 12.2 2.1 2.1 4.3-4.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {:else}
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16.2h.01M12 4.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
              {/if}
            </div>
          </div>

          <small class="metric-note">{m.note}</small>
        </button>
          </div>
        {/each}
      {/key}
    </div>
  </div>

  <div class="main-grid">
    <div class="panel-glow">
      <article class="panel chart-panel">
        <div class="panel-head compact chart-head">
          <div class="chart-head-top">
            <div class="head-copy">
              <h2>{chartView === 'dashboard' ? 'Dashboard' : 'Requirements'}</h2>
              <p class="sub">
                {#if chartView === 'dashboard'}
                  Jumlah task per dashboard
                {:else}
                  Open · In progress · Selesai{chartDashboard ? ` · ${chartDashboard}` : ''}
                {/if}
              </p>
            </div>
            <GlassSwitch
              class="compact"
              label="Jenis chart"
              options={chartOptions}
              value={chartView}
              onchange={(id) => (chartView = /** @type {'requirement' | 'dashboard'} */ (id))}
            />
          </div>
          {#if chartView === 'requirement'}
            <label class="chart-dash">
              <span>Dashboard</span>
              <select bind:value={chartDashboard}>
                <option value="">Semua</option>
                {#each chartDashboards as name}
                  <option value={name}>{name}</option>
                {/each}
              </select>
            </label>
          {/if}
        </div>
        {#if chartView === 'dashboard'}
          <div class="chart-box">
            <div class="chart-plot bars">
              {#if dashboardBar.labels.length}
                <OpsChart
                  type="bar"
                  horizontal
                  unit="task"
                  labels={dashboardBar.labels}
                  series={dashboardBar.series}
                  colors={dashboardBar.colors}
                />
              {:else}
                <p class="sub">Belum ada task pada periode ini.</p>
              {/if}
            </div>
          </div>
        {:else}
          <div class="chart-box split">
            <div class="chart-plot">
              <OpsChart type={activeChart.type} labels={activeChart.labels} series={activeChart.series} colors={activeChart.colors} unit="requirement" />
            </div>
            <ul class="chart-legend side-legend">
              {#each chartLegend as item (item.label)}
                <li>
                  <div class="legend-item">
                    <span class="swatch" style="background:{item.color}"></span>
                    <div class="legend-copy">
                      <strong>{item.label}</strong>
                      {#key `${period}-${chartDashboard}-${item.value}`}
                        <small in:fade={{ duration: 200 }}>{item.value} requirement</small>
                      {/key}
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </article>
    </div>

    <div class="panel-glow">
      <article class="panel activity-panel">
        <div class="panel-head compact week-head">
          <div class="head-copy">
            <h2>{boardHeading}</h2>
            <p class="sub">{boardTitle} · {weekItems.length} {boardUnit}</p>
          </div>
          <div class="head-tools week-tools">
            <GlassSwitch
              class="compact"
              label="Timeline source"
              options={boardOptions}
              value={boardView}
              onchange={(id) => {
                boardView = /** @type {'task' | 'requirement'} */ (id)
                taskTip = null
              }}
            />
          </div>
        </div>

        <div class="kanban-flow-legend" aria-label="Kanban position color guide">
          <span class="legend-title">Posisi {boardView === 'requirement' ? 'Requirement' : 'Kanban'}:</span>
          <div class="legend-chips">
            {#if boardView === 'task'}
              {#each workflowColumns as col}
                {@const count = taskCountsByStatus[col.key] || 0}
                <button
                  type="button"
                  class="flow-step"
                  class:active={count > 0}
                  style="--step-col:{workflowStatusColor(col.key)}"
                  onclick={() => pushTaskFilters({ status: col.key }, 'board')}
                  title={`Lihat task di kolom ${col.label} (${count} task)`}
                >
                  <span class="step-dot" style="background:{workflowStatusColor(col.key)}"></span>
                  <span class="step-name">{col.label}</span>
                  <span class="step-count" style="color:{workflowStatusColor(col.key)};background:color-mix(in srgb, {workflowStatusColor(col.key)} 14%, transparent)">{count}</span>
                </button>
              {/each}
            {:else}
              {#each requirementStatusOptions as st}
                {@const count = reqCountsByStatus[st.value] || 0}
                <div
                  class="flow-step"
                  class:active={count > 0}
                  style="--step-col:{requirementColor(st.value)}"
                >
                  <span class="step-dot" style="background:{requirementColor(st.value)}"></span>
                  <span class="step-name">{st.label}</span>
                  <span class="step-count" style="color:{requirementColor(st.value)};background:color-mix(in srgb, {requirementColor(st.value)} 14%, transparent)">{count}</span>
                </div>
              {/each}
            {/if}
          </div>
        </div>

        {#key period}
        <div class="day-canvas" in:fade={{ duration: 180 }}>
          <div class="day-axis week-axis" style="grid-template-columns: repeat({weekCount}, minmax(0, 1fr))">
            {#each axisWeeks as w}
              <span class:now={w.isCurrent}>
                <strong>{w.label}</strong>
                <small>{w.range}</small>
              </span>
            {/each}
          </div>

          <div class="day-board">
            <div class="day-grid" aria-hidden="true">
              {#each boardBuckets as _, i}
                <span class="grid-band" style="left:{(i / weekCount) * 100}%;width:{(1 / weekCount) * 100}%" class:alt={i % 2 === 1} class:current={i === currentWeekIdx}></span>
                <span class="grid-line" style="left:{(i / weekCount) * 100}%"></span>
              {/each}
              <span class="grid-line" style="left:100%"></span>
            </div>

            {#if todayPct >= 0}
              <div
                class="now-marker"
                class:near-start={todayPct < 14}
                class:near-end={todayPct > 86}
                style="left:{todayPct}%"
              >
                <span class="now-chip">{todayChip}</span>
                <i></i>
                <b></b>
              </div>
            {/if}

            <div class="day-tracks">
              {#key boardView}
                <div class="track-set" in:fade={{ duration: 160 }}>
                  {#if weekItems.length === 0}
                    <div class="week-empty">
                      <p>Belum ada {boardUnit} di {boardTitle}</p>
                    </div>
                  {:else}
                    {#each weekItems as item (boardView + '-' + item.task.id)}
                      <div class="day-row">
                        <div
                          class="event"
                          style={weekBarStyle(item.bar, item.task.status)}
                          role="button"
                          tabindex="0"
                          aria-label={`${item.task.title} - ${statusLabel(item.task.status)}`}
                          onmouseenter={(e) => showTaskTip(e, item.task)}
                          onmouseleave={hideTaskTip}
                          onfocus={(e) => showTaskTip(e, item.task)}
                          onblur={hideTaskTip}
                          onclick={() => openWeekItem(item.task)}
                          onkeydown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              openWeekItem(item.task)
                            }
                          }}
                        >
                          <div class="event-solid" style="flex:{barProgress(item.task.status)}">
                            <div class="event-copy">
                              <span class="event-pos-dot" style="background:var(--ev)"></span>
                              <strong>{item.task.title}</strong>
                            </div>
                            <span
                              class="event-status-chip"
                              style="background:color-mix(in srgb, var(--ev) 16%, #fff);color:var(--ev);border-color:color-mix(in srgb, var(--ev) 30%, transparent)"
                            >
                              {statusLabel(item.task.status)}
                            </span>
                            <span class="face-mini" title={item.task.pic}>{initials(item.task.pic)}</span>
                          </div>
                          {#if barProgress(item.task.status) < 1}
                            <div class="event-ghost" style="flex:{1 - barProgress(item.task.status)}"></div>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  {/if}
                </div>
              {/key}
            </div>
          </div>
        </div>
        {/key}
      </article>
    </div>

    {#if taskTip}
      <div
        class="task-tip-pos"
        style="left:{taskTip.x}px;top:{taskTip.y}px"
        in:fade={{ duration: 140 }}
        out:fade={{ duration: 110 }}
      >
        <div class="task-tip" role="tooltip">
          <div class="task-tip-head">
            <strong>{taskTip.task.title}</strong>
            <span class="chip status" style="background:color-mix(in srgb, {boardView === 'requirement' ? requirementColor(taskTip.task.status) : workflowStatusColor(taskTip.task.status)} 18%, #fff);color:{boardView === 'requirement' ? requirementColor(taskTip.task.status) : workflowStatusColor(taskTip.task.status)}">{statusLabel(taskTip.task.status)}</span>
          </div>
          <dl class="task-tip-meta">
            <div><dt>Dashboard</dt><dd>{taskTip.task.meta}</dd></div>
            <div><dt>PIC</dt><dd>{taskTip.task.pic}</dd></div>
            <div>
              <dt>{boardView === 'requirement' ? 'Status' : 'Posisi'}</dt>
              <dd>
                <span class="tip-kanban-pos" style="color:{boardView === 'requirement' ? requirementColor(taskTip.task.status) : workflowStatusColor(taskTip.task.status)}">
                  ● {statusLabel(taskTip.task.status)}
                </span>
              </dd>
            </div>
            <div><dt>Start</dt><dd>{formatDate(taskTip.task.startDate)}</dd></div>
            <div><dt>Deadline</dt><dd>{formatDate(taskTip.task.deadline)}</dd></div>
          </dl>
        </div>
      </div>
    {/if}

    <div class="panel-glow">
      <article class="panel feed-panel">
        <div class="panel-head compact">
          <div class="head-copy">
            <h2>Update Terbaru</h2>
            <p class="sub">
              {#if feedTab === 'tasks'}Baru dibuat / di-update{:else}Log operasional{/if}
            </p>
          </div>
          <div class="head-tools">
            <GlassSwitch
              class="compact"
              label="Filter update"
              options={feedOptions}
              value={feedTab}
              onchange={(id) => (feedTab = /** @type {'tasks' | 'activity'} */ (id))}
            />
          </div>
        </div>

        {#key feedTab}
          <div class="table-wrap" in:fade={{ duration: 180 }}>
            {#if feedTab === 'tasks'}
              <table class="modern-table feed-table">
                <thead>
                  <tr>
                    <th class="col-id">ID</th>
                    <th>Task</th>
                    <th class="col-when">Update</th>
                    <th class="col-status">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {#each newestTasks.slice(0, 4) as item}
                    <tr>
                      <td class="col-id"><span class="mono-id">{item.code}</span></td>
                      <td>
                        <button type="button" class="task-link" onclick={() => pushTaskFilters({ taskId: item.id, dashboard: item.dashboard })}>{item.title}</button>
                      </td>
                      <td class="col-when"><span class="muted">{item.when}</span></td>
                      <td class="col-status"><span class="status-text" style="color:{workflowStatusColor(item.status)}">{statusLabel(item.status)}</span></td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {:else}
              <table class="modern-table feed-table activity-table">
                <thead>
                  <tr>
                    <th>PIC</th>
                    <th>Aktivitas</th>
                    <th class="col-when">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {#each recentActivities.slice(0, 4) as item}
                    <tr>
                      <td>
                        <span class="pic">
                          <i class="face {faceTone(item.who)}">{initials(item.who)}</i>
                          {item.who}
                        </span>
                      </td>
                      <td>
                        <span class="activity-line">{item.action} <em>{item.target}</em></span>
                      </td>
                      <td class="col-when"><span class="muted">{item.when}</span></td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            {/if}
          </div>
        {/key}
      </article>
    </div>

    <div class="panel-glow">
      <article class="panel deadline-panel">
        <div class="panel-head compact">
          <div class="head-copy">
            <h2>Fokus Deadline</h2>
            <p class="sub" class:alert={deadlineTab === 'overdue'}>
              {#if deadlineTab === 'overdue'}
                {overdueTasks.length} overdue
              {:else}
                30 hari ke depan ({upcomingDeadlines.length} deadline)
              {/if}
            </p>
          </div>
          <div class="head-tools">
            <div class="deadline-subfilter">
              <select
                class="deadline-type-select"
                bind:value={deadlineType}
                aria-label="Filter Tipe Deadline"
              >
                <option value="task">Task</option>
                <option value="req">Requirement</option>
              </select>
              <svg class="select-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <GlassSwitch
              class="compact"
              label="Filter deadline"
              options={deadlineOptions}
              value={deadlineTab}
              onchange={(id) => (deadlineTab = /** @type {'upcoming' | 'overdue'} */ (id))}
            />
          </div>
        </div>

        {#key `${deadlineTab}:${deadlineType}`}
          <div class="table-wrap" in:fade={{ duration: 180 }}>
            {#if deadlineTab === 'overdue'}
              <table class="modern-table deadline-table">
                <thead>
                  <tr>
                    <th class="col-task">{deadlineType === 'req' ? 'Requirement' : 'Task'}</th>
                    <th class="col-pic">PIC</th>
                    <th class="col-date">Deadline</th>
                    <th class="col-late">Terlambat</th>
                    <th class="col-status">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {#if overdueTasks.length === 0}
                    <tr>
                      <td colspan="5" style="text-align:center;padding:1.5rem;color:#8e8e93;font-size:0.75rem;">
                        {#if deadlineType === 'req'}
                          Tidak ada deadline requirement yang terlewat.
                        {:else}
                          Tidak ada deadline task yang terlewat.
                        {/if}
                      </td>
                    </tr>
                  {:else}
                    {#each overdueTasks.slice(0, 6) as row}
                      <tr>
                        <td class="col-task">
                          {#if row.isReq}
                            <button type="button" class="task-link" onclick={() => push(`/requirements/${row.id}`)}>
                              {row.title}
                              {#if row.dashboard}<span class="dash-tag">{row.dashboard}</span>{/if}
                            </button>
                          {:else}
                            <button type="button" class="task-link" onclick={() => pushTaskFilters({ taskId: row.id, dashboard: row.dashboard })}>
                              {row.title}
                              {#if row.dashboard}<span class="dash-tag">{row.dashboard}</span>{/if}
                            </button>
                          {/if}
                        </td>
                        <td class="col-pic">
                          <span class="pic">
                            <i class="face {faceTone(row.pic)}">{initials(row.pic)}</i>
                            <span class="pic-name">{row.pic}</span>
                          </span>
                        </td>
                        <td class="col-date"><span class="muted">{formatDate(row.deadline)}</span></td>
                        <td class="col-late"><span class="late-text">{row.delay}</span></td>
                        <td class="col-status"><span class="status-text" style="color:{workflowStatusColor(row.status)}">{statusLabel(row.status)}</span></td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            {:else}
              <table class="modern-table deadline-table">
                <thead>
                  <tr>
                    <th class="col-task">{deadlineType === 'req' ? 'Requirement' : 'Task'}</th>
                    <th class="col-pic">PIC</th>
                    <th class="col-date">Deadline</th>
                    <th class="col-status">Prioritas</th>
                  </tr>
                </thead>
                <tbody>
                  {#if upcomingDeadlines.length === 0}
                    <tr>
                      <td colspan="4" style="text-align:center;padding:1.5rem;color:#8e8e93;font-size:0.75rem;">
                        {#if deadlineType === 'req'}
                          Tidak ada deadline requirement aktif dalam 30 hari ke depan.
                        {:else}
                          Tidak ada deadline task aktif dalam 30 hari ke depan.
                        {/if}
                      </td>
                    </tr>
                  {:else}
                    {#each upcomingDeadlines.slice(0, 6) as row}
                      <tr>
                        <td class="col-task">
                          {#if row.isReq}
                            <button type="button" class="task-link" onclick={() => push(`/requirements/${row.id}`)}>
                              {row.title}
                              {#if row.dashboard}<span class="dash-tag">{row.dashboard}</span>{/if}
                            </button>
                          {:else}
                            <button type="button" class="task-link" onclick={() => pushTaskFilters({ taskId: row.id, dashboard: row.dashboard })}>
                              {row.title}
                              {#if row.dashboard}<span class="dash-tag">{row.dashboard}</span>{/if}
                            </button>
                          {/if}
                        </td>
                        <td class="col-pic">
                          <span class="pic">
                            <i class="face {faceTone(row.pic)}">{initials(row.pic)}</i>
                            <span class="pic-name">{row.pic}</span>
                          </span>
                        </td>
                        <td class="col-date"><span class="muted">{formatDate(row.deadline)}</span></td>
                        <td class="col-status"><span class="prio-text {row.priority.toLowerCase()}">{row.priority}</span></td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            {/if}
          </div>
        {/key}
      </article>
    </div>
  </div>

</section>

<style>
  .beranda {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1 0 auto;
    height: auto;
    min-height: 100%;
    overflow: visible;
    padding-bottom: 2px;
    color: #1a1a1a;
  }

  .icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.65);
    background: rgba(255, 255, 255, 0.72);
    color: #1a1a1a;
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: background 0.15s ease, box-shadow 0.15s ease;
    flex-shrink: 0;
  }

  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  }

  .icon-btn svg { width: 15px; height: 15px; }

  .icon-btn.soft {
    width: 34px;
    height: 34px;
    background: #f3f3f6;
    border: none;
    flex-shrink: 0;
  }

  .icon-btn.soft svg { width: 15px; height: 15px; }

  .avatar {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 999px;
    object-fit: cover;
    object-position: center 18%;
    background: #d8c9f0;
    display: block;
    flex-shrink: 0;
  }

  .page-header {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 2px 0 2px;
  }

  /* Switch sits in the free space between logo and tools, so both gaps match */
  .topbar {
    display: flex;
    align-items: center;
    gap: 24px;
    min-height: 48px;
    overflow: visible;
  }

  .brand-logo {
    display: block;
    flex-shrink: 0;
    line-height: 0;
  }

  .brand-logo img {
    display: block;
    height: 36px;
    width: auto;
    max-width: 150px;
    object-fit: contain;
    image-rendering: -webkit-optimize-contrast;
  }

  .period-slot {
    flex: 1;
    display: flex;
    justify-content: center;
    min-width: 0;
    overflow: visible;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 12px;
    min-width: 0;
  }

  .circle-tool {
    position: relative;
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.72);
    color: #1a1a1a;
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
    transition: background 0.15s ease;
    flex-shrink: 0;
  }

  .circle-tool:hover {
    background: rgba(255, 255, 255, 0.95);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .circle-tool svg {
    width: 16px;
    height: 16px;
  }

  .circle-tool .dot {
    position: absolute;
    top: 9px;
    right: 10px;
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: #e5484d;
    border: 1.5px solid #fff;
  }

  .headline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    min-height: 0;
  }

  .headline-copy {
    min-width: 0;
  }

  .hero-sub {
    margin: 0 0 6px;
    color: #8e8e93;
    font-size: 0.68rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  .hero-greet {
    margin: 0;
    font-size: 1.05rem;
    letter-spacing: -0.035em;
    font-weight: 700;
    line-height: 1.12;
    color: #1a1a1a;
  }

  .headline-meta {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .hero-stats {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(7.2rem, max-content);
    column-gap: 32px;
    align-items: start;
  }

  .stat {
    min-width: 0;
  }

  .profile-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 3px 12px 3px 3px;
    border: 1px solid rgba(255, 255, 255, 0.65);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    color: inherit;
    font: inherit;
    transition: background 0.15s ease, box-shadow 0.15s ease;
    flex-shrink: 0;
  }

  .profile-chip:hover {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  }

  .profile-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    line-height: 1.15;
    padding-right: 2px;
  }

  .profile-meta strong {
    font-size: 0.65rem;
    font-weight: 700;
    color: #1a1a1a;
    white-space: nowrap;
  }

  .profile-meta small {
    font-size: 0.58rem;
    font-weight: 550;
    color: #8e8e93;
  }

  .stat span {
    display: block;
    font-size: 0.62rem;
    color: #8e8e93;
    margin-bottom: 4px;
    line-height: 1.2;
    white-space: nowrap;
  }

  .stat div {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 1.35rem;
  }

  .stat strong {
    font-size: 1rem;
    letter-spacing: -0.03em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .stat em {
    font-style: normal;
  }

  .stat em.up {
    color: #5bb98a;
  }

  .stat em.down {
    color: #d46a6a;
  }

  .cta {
    height: 40px;
    padding: 0 18px;
    border: none;
    border-radius: 999px;
    background: #1a1a1a;
    color: #fff;
    font-weight: 600;
    font-size: 0.68rem;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.14);
    white-space: nowrap;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .cta:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
  }

  /* Metrics rail — gradient biru dongker → biru muda logo EDM */
  .metrics-rail {
    position: relative;
    display: flex;
    flex-direction: column;
    margin-top: 0;
    flex-shrink: 0;
    padding: 14px;
    border-radius: 24px;
    overflow: visible;
    isolation: isolate;
    background:
      radial-gradient(90% 120% at 100% 0%, rgba(51, 158, 245, 0.45), transparent 55%),
      radial-gradient(80% 100% at 0% 100%, rgba(5, 58, 131, 0.55), transparent 50%),
      linear-gradient(125deg, #042a5c 0%, #053a83 28%, #065fc6 68%, #339ef5 100%);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow:
      0 4px 18px rgba(0, 0, 0, 0.08),
      inset 1px 1px 0 rgba(255, 255, 255, 0.18);
  }

  .metrics-rail > :global(.liquidGlass-effect),
  .metrics-rail > :global(.liquidGlass-tint) {
    display: none;
  }

  .metrics-rail > :global(.liquidGlass-shine) {
    border-radius: 28px;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow:
      inset 1.5px 1.5px 0 rgba(255, 255, 255, 0.22),
      inset -1px -1px 0 rgba(0, 20, 50, 0.12);
  }

  .metrics {
    position: relative;
    z-index: 3;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
  }

  .metric-shell {
    min-width: 0;
    padding: 4px;
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.72) 100%);
    border: 1px solid rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 12px rgba(4, 42, 92, 0.12);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .metric-shell:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(4, 42, 92, 0.16);
  }

  .metric-card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    border-radius: 16px;
    padding: 10px 12px;
    min-width: 0;
    height: auto;
    min-height: 0;
    flex-shrink: 0;
    overflow: visible;
    isolation: isolate;
    color: #0f1b2e;
    background: #fff;
    border: 1px solid rgba(120, 170, 220, 0.28);
    box-shadow: 0 1px 2px rgba(15, 27, 46, 0.04);
    transition: border-color 0.2s ease;
    font: inherit;
    text-align: left;
    width: 100%;
    cursor: pointer;
  }

  .metric-card.clickable:hover {
    box-shadow: 0 1px 2px rgba(15, 27, 46, 0.04);
  }

  .metric-card.clickable:focus-visible {
    outline: 2px solid rgba(6, 95, 198, 0.45);
    outline-offset: 2px;
  }

  .metric-card .liquidGlass-effect,
  .metric-card .liquidGlass-tint,
  .metric-card .liquidGlass-shine {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
  }

  .metric-card :global(.liquidGlass-effect) {
    display: none;
  }

  .metric-card :global(.liquidGlass-shine) {
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    box-shadow:
      inset 1px 1px 0 rgba(255, 255, 255, 0.8),
      inset -1px -1px 0 rgba(80, 140, 200, 0.04);
  }

  /* Family biru — beda lewat outline soft (+ tint sangat tipis) */
  .metric-card.mint {
    border-color: rgba(70, 170, 190, 0.55);
  }
  .metric-card.mint :global(.liquidGlass-tint) {
    background: linear-gradient(155deg, rgba(90, 190, 200, 0.1) 0%, transparent 60%);
  }

  .metric-card.lavender {
    border-color: rgba(120, 140, 210, 0.55);
  }
  .metric-card.lavender :global(.liquidGlass-tint) {
    background: linear-gradient(155deg, rgba(130, 150, 220, 0.1) 0%, transparent 60%);
  }

  .metric-card.peach {
    border-color: rgba(100, 160, 220, 0.55);
  }
  .metric-card.peach :global(.liquidGlass-tint) {
    background: linear-gradient(155deg, rgba(110, 170, 230, 0.1) 0%, transparent 60%);
  }

  .metric-card.sky {
    border-color: rgba(50, 140, 230, 0.58);
  }
  .metric-card.sky :global(.liquidGlass-tint) {
    background: linear-gradient(155deg, rgba(60, 150, 240, 0.12) 0%, transparent 60%);
  }

  /* Overdue — aksen merah jelas, tetap glass (bukan fill penuh) */
  .metric-card.rose {
    border-color: rgba(220, 80, 95, 0.55);
  }
  .metric-card.rose :global(.liquidGlass-tint) {
    background: linear-gradient(155deg, rgba(235, 90, 105, 0.22) 0%, rgba(255, 200, 205, 0.12) 45%, transparent 70%);
  }
  .metric-card.rose :global(.liquidGlass-shine) {
    box-shadow:
      inset 1px 1px 0 rgba(255, 255, 255, 0.55),
      inset -1px -1px 0 rgba(255, 255, 255, 0.28);
  }
  .metric-card.rose .metric-label {
    color: #9a3a48;
  }
  .metric-card.rose .metric-value {
    color: #c4283a;
    text-shadow: none;
  }
  .metric-card.rose .metric-note {
    color: #d44555;
  }

  .metric-card.sand {
    border-color: rgba(80, 150, 210, 0.52);
  }
  .metric-card.sand :global(.liquidGlass-tint) {
    background: linear-gradient(155deg, rgba(90, 160, 220, 0.1) 0%, transparent 60%);
  }

  .metric-top,
  .metric-mid,
  .metric-note,
  .metric-icon {
    position: relative;
    z-index: 3;
  }

  .metric-top {
    display: flex;
    align-items: flex-start;
  }

  .metric-label {
    font-size: 0.65rem;
    line-height: 1.2;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: rgba(18, 28, 44, 0.78);
  }

  .metric-mid {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 28px;
  }

  .metric-value {
    font-size: 1.45rem;
    font-weight: 750;
    letter-spacing: -0.04em;
    line-height: 1;
    color: #0b1524;
  }

  .metric-icon {
    width: 30px;
    height: 30px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    background: rgba(230, 240, 250, 0.9);
    color: #2a5080;
    border: 1px solid rgba(100, 150, 210, 0.2);
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.9);
    flex-shrink: 0;
  }

  .metric-card.mint .metric-icon {
    background: linear-gradient(160deg, rgba(90, 190, 200, 0.2), #f3fafb);
    color: #2a7a88;
    border-color: rgba(70, 170, 190, 0.28);
  }
  .metric-card.lavender .metric-icon {
    background: linear-gradient(160deg, rgba(120, 140, 210, 0.18), #f5f6fc);
    color: #4a5c9a;
    border-color: rgba(120, 140, 210, 0.28);
  }
  .metric-card.peach .metric-icon {
    background: linear-gradient(160deg, rgba(100, 160, 220, 0.18), #f4f8fd);
    color: #3a6a9a;
    border-color: rgba(100, 160, 220, 0.28);
  }
  .metric-card.sky .metric-icon {
    background: linear-gradient(160deg, rgba(50, 140, 230, 0.2), #f2f7fd);
    color: #2a6cb0;
    border-color: rgba(50, 140, 230, 0.3);
  }
  .metric-card.rose .metric-icon {
    background: linear-gradient(160deg, rgba(235, 90, 105, 0.22), #fff0f2);
    color: #d42a3c;
    border-color: rgba(220, 80, 95, 0.35);
    box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.9);
  }
  .metric-card.sand .metric-icon {
    background: linear-gradient(160deg, rgba(80, 150, 210, 0.18), #f3f8fc);
    color: #356892;
    border-color: rgba(80, 150, 210, 0.28);
  }

  .metric-icon svg { width: 15px; height: 15px; }

  .metric-note {
    display: block;
    margin: 0;
    padding: 0;
    font-size: 0.58rem;
    line-height: 1.25;
    font-weight: 500;
    color: rgba(30, 42, 60, 0.72);
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .main-grid {
    display: grid;
    grid-template-columns: minmax(260px, 0.86fr) minmax(0, 1.7fr);
    grid-template-rows: minmax(200px, 1fr) minmax(200px, 1fr);
    gap: 12px;
    min-height: 0;
    flex: 1;
  }

  .panel-glow {
    min-width: 0;
    min-height: 0;
    display: flex;
    padding: 6px;
    border-radius: 26px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.46) 100%);
    border: 1px solid rgba(255, 255, 255, 0.92);
    box-shadow:
      0 10px 28px rgba(15, 27, 46, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .panel {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 14px 16px;
    border-radius: 20px;
    background: #fff;
    border: 1px solid rgba(15, 27, 46, 0.04);
    box-shadow: 0 1px 2px rgba(15, 27, 46, 0.04);
    color: #1a1a1a;
    transition: box-shadow 0.25s ease, transform 0.25s ease;
  }

  .panel:hover {
    box-shadow: 0 2px 8px rgba(15, 27, 46, 0.06);
  }

  .feed-panel,
  .deadline-panel {
    padding: 18px 20px 16px;
  }

  .feed-panel .panel-head.compact,
  .deadline-panel .panel-head.compact {
    align-items: flex-start;
    min-height: 44px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .feed-panel .head-tools,
  .deadline-panel .head-tools {
    margin-top: 2px;
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
    flex-shrink: 0;
  }

  .panel-head.compact {
    padding-bottom: 0;
    border-bottom: 0;
    margin-bottom: 12px;
  }

  .head-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    overflow: visible;
    padding: 6px 2px;
  }

  .panel-head h2 {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 650;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }

  .sub {
    margin: 2px 0 0;
    color: #8e8e93;
    font-size: 0.62rem;
    line-height: 1.3;
  }

  .sub.alert {
    color: #c44a4a;
    font-weight: 600;
  }

  .chart-panel {
    overflow: hidden;
  }

  .chart-panel .panel-head.compact {
    align-items: stretch;
    gap: 10px;
    margin-bottom: 8px;
  }

  .chart-head {
    flex-direction: column;
  }

  .chart-head-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
  }

  .chart-panel .head-copy {
    min-width: 0;
    flex: 1;
  }

  .chart-panel .head-copy .sub {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chart-dash {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 6px;
    min-width: 0;
  }

  .chart-dash span {
    flex-shrink: 0;
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8e8e93;
    white-space: nowrap;
  }

  .chart-dash select {
    width: 132px;
    height: 26px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 999px;
    padding: 0 0.65rem;
    background: rgba(255, 255, 255, 0.86);
    font: inherit;
    font-size: 0.68rem;
    font-weight: 650;
    color: #1a1a1a;
  }

  .chart-plot.bars {
    flex: 1;
    min-height: 0;
    align-items: stretch;
  }

  .chart-box {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .chart-box.split {
    flex-direction: row;
    align-items: stretch;
    gap: 12px;
  }

  .chart-plot {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .chart-box.split .chart-plot {
    flex: 1.35 1 0;
  }

  .chart-legend {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    flex-shrink: 0;
  }

  .chart-legend.side-legend {
    flex: 0 0 min(42%, 168px);
    width: min(42%, 168px);
    align-self: stretch;
    grid-template-columns: 1fr;
    grid-auto-rows: minmax(0, 1fr);
    gap: 6px;
    max-height: none;
    overflow: auto;
    min-height: 0;
    padding-right: 2px;
  }

  .chart-legend.side-legend li {
    padding: 7px 9px;
  }

  .chart-legend.bar-legend {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    max-height: none;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: rgba(6, 95, 198, 0.28) transparent;
  }

  .chart-legend.bar-legend::-webkit-scrollbar {
    height: 4px;
  }

  .chart-legend.bar-legend::-webkit-scrollbar-thumb {
    background: rgba(6, 95, 198, 0.28);
    border-radius: 999px;
  }

  .chart-legend.bar-legend li {
    flex: 0 0 auto;
    min-width: 128px;
  }

  .chart-legend.bar-legend .legend-copy strong {
    overflow: visible;
    text-overflow: unset;
  }

  .chart-legend li {
    display: flex;
    align-items: stretch;
    min-width: 0;
    padding: 0;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.55);
    overflow: hidden;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
    padding: 8px 10px;
    color: inherit;
  }

  .deadline-go {
    height: 32px;
    padding: 0 0.9rem;
    border-radius: 999px;
    border: none;
    background:
      radial-gradient(130% 160% at 26% -30%, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 55%),
      linear-gradient(200deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 42%),
      linear-gradient(160deg, rgba(31, 122, 224, 0.92) 0%, rgba(12, 91, 194, 0.94) 52%, rgba(6, 63, 143, 0.96) 100%);
    -webkit-backdrop-filter: blur(14px) saturate(180%) brightness(1.05);
    backdrop-filter: blur(14px) saturate(180%) brightness(1.05);
    box-shadow:
      inset 0 1.5px 0 rgba(255, 255, 255, 0.55),
      inset 0 -8px 12px rgba(4, 30, 80, 0.28),
      inset 0 0 0 1px rgba(255, 255, 255, 0.18),
      0 6px 14px rgba(6, 60, 150, 0.32),
      0 2px 5px rgba(6, 60, 150, 0.22);
    font: inherit;
    font-size: 0.65rem;
    font-weight: 650;
    color: #fff;
    text-shadow: 0 1px 1px rgba(0, 30, 80, 0.35);
    cursor: pointer;
    white-space: nowrap;
    transition: filter 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
  }

  .deadline-go:hover {
    filter: brightness(1.08) saturate(1.05);
    box-shadow:
      inset 0 1.5px 0 rgba(255, 255, 255, 0.65),
      inset 0 -8px 12px rgba(4, 30, 80, 0.3),
      inset 0 0 0 1px rgba(255, 255, 255, 0.25),
      0 8px 18px rgba(6, 60, 150, 0.4),
      0 3px 7px rgba(6, 60, 150, 0.28);
  }

  .deadline-go:active {
    transform: scale(0.96);
  }

  .chart-legend .swatch {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .legend-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .legend-copy strong {
    font-size: 0.65rem;
    font-weight: 650;
    color: #1a1a1a;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .legend-copy small {
    font-size: 0.62rem;
    color: #8e8e93;
    white-space: nowrap;
  }

  .activity-panel {
    padding: 14px 16px;
  }

  .activity-panel .panel-head.compact {
    margin-bottom: 6px;
  }

  .week-head {
    flex-wrap: nowrap;
    row-gap: 4px;
    min-width: 0;
    align-items: center;
  }

  .week-tools {
    flex-wrap: nowrap;
    justify-content: flex-end;
    min-width: 0;
    gap: 6px;
  }

  .activity-panel .icon-btn.soft {
    width: 28px;
    height: 28px;
  }

  .day-canvas {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
  }

  .day-axis {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
  }

  .day-axis.week-axis {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
    margin-bottom: 0;
    min-width: 0;
    flex-shrink: 0;
  }

  .day-axis.week-axis span {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 4px 8px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.35);
    border: 1px solid rgba(0, 0, 0, 0.04);
    color: #3a3a3a;
    font-size: 0.65rem;
    font-weight: 700;
    overflow: hidden;
  }

  .day-axis.week-axis span strong {
    font-size: 0.65rem;
    font-weight: 750;
    letter-spacing: -0.02em;
    color: #1a1a1a;
    flex-shrink: 0;
  }

  .day-axis.week-axis small {
    font-size: 0.58rem;
    font-weight: 600;
    color: #6b6b6b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .day-axis.week-axis span.now {
    background: rgba(26, 26, 26, 0.92);
    border-color: transparent;
    color: #fff;
  }

  .day-axis.week-axis span.now strong,
  .day-axis.week-axis span.now small {
    color: #fff;
  }

  .day-axis span {
    font-size: 0.62rem;
    color: #9a9aa0;
    font-weight: 500;
  }

  .day-axis span.now {
    color: #1a1a1a;
    font-weight: 700;
  }

  .week-empty {
    display: grid;
    place-items: center;
    gap: 10px;
    height: 100%;
    color: #8e8e93;
    font-size: 0.68rem;
  }

  .week-empty button {
    border: none;
    border-radius: 999px;
    padding: 8px 14px;
    background: #1a1a1a;
    color: #fff;
    font: inherit;
    font-size: 0.68rem;
    font-weight: 650;
    cursor: pointer;
  }

  .day-board {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    border-radius: 18px;
    background: transparent;
    overflow: hidden;
  }

  .day-grid { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }

  .grid-band {
    position: absolute;
    top: 0;
    bottom: 0;
    background: transparent;
  }

  .grid-band.alt {
    background: rgba(0, 0, 0, 0.025);
  }

  .grid-band.current {
    background: rgba(200, 232, 168, 0.18);
  }

  .grid-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgba(0, 0, 0, 0.12);
  }

  .now-marker {
    position: absolute;
    top: 2px;
    bottom: 2px;
    width: 0;
    z-index: 4;
    pointer-events: none;
  }

  .now-chip {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    padding: 2px 6px;
    border-radius: 999px;
    background: #1a1a1a;
    color: #fff;
    font-size: 0.54rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.16);
  }

  .now-marker.near-start .now-chip {
    left: 0;
    transform: none;
  }

  .now-marker.near-end .now-chip {
    left: auto;
    right: 0;
    transform: none;
  }

  .now-marker i {
    position: absolute;
    top: 16px;
    left: -3px;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: #1a1a1a;
    box-shadow: 0 0 0 2px rgba(26, 26, 26, 0.12);
  }

  .now-marker b {
    position: absolute;
    top: 22px;
    bottom: 0;
    left: -0.5px;
    width: 1.5px;
    background: #1a1a1a;
  }

  .day-tracks {
    position: relative;
    z-index: 1;
    height: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 6px;
    padding: 10px 0 2px;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .day-row {
    position: relative;
    height: 28px;
    flex: 0 0 auto;
    min-width: 0;
  }

  .kanban-flow-legend {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 6px 14px 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .legend-title {
    font-size: 0.64rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }

  .legend-chips {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .flow-step {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.07);
    background: rgba(255, 255, 255, 0.7);
    font-size: 0.65rem;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .flow-step:hover {
    background: #ffffff;
    border-color: color-mix(in srgb, var(--step-col, #94a3b8) 40%, transparent);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .flow-step.active {
    background: color-mix(in srgb, var(--step-col, #94a3b8) 9%, #ffffff);
    border-color: color-mix(in srgb, var(--step-col, #94a3b8) 32%, transparent);
    color: #0f172a;
  }

  .step-dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    flex-shrink: 0;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--step-col, #94a3b8) 24%, transparent);
  }

  .step-name {
    line-height: 1;
  }

  .step-count {
    padding: 1px 5px;
    border-radius: 999px;
    font-size: 0.6rem;
    font-weight: 700;
    line-height: 1.1;
  }

  .tip-kanban-pos {
    font-size: 0.65rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .event {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
    border-radius: 999px;
    overflow: hidden;
    min-width: 0;
    max-width: 100%;
    cursor: pointer;
    border: 1px solid color-mix(in srgb, var(--ev, #94a3b8) 34%, transparent);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: filter 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  }

  .event:hover,
  .event:focus-visible {
    filter: brightness(0.97);
    outline: none;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.09), 0 0 0 2px color-mix(in srgb, var(--ev, #94a3b8) 40%, transparent);
  }

  .task-tip-pos {
    position: fixed;
    z-index: 90;
    pointer-events: none;
  }

  .task-tip {
    width: min(260px, calc(100vw - 24px));
    padding: 12px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid rgba(255, 255, 255, 0.72);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.12),
      inset 1px 1px 0 rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #1a1a1a;
    transform: translate(-50%, calc(-100% - 10px));
    transform-origin: bottom center;
    animation: taskTipIn 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes taskTipIn {
    from {
      opacity: 0;
      transform: translate(-50%, calc(-100% - 2px)) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translate(-50%, calc(-100% - 10px)) scale(1);
    }
  }

  .task-tip-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  .task-tip-head strong {
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.02em;
  }

  .task-tip-meta {
    margin: 0;
    display: grid;
    gap: 6px;
  }

  .task-tip-meta div {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 8px;
    align-items: baseline;
  }

  .task-tip-meta dt {
    margin: 0;
    font-size: 0.62rem;
    font-weight: 600;
    color: #8e8e93;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .task-tip-meta dd {
    margin: 0;
    font-size: 0.65rem;
    font-weight: 600;
    color: #2a2a2a;
  }

  .event-solid {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    min-width: min(150px, 100%);
    padding: 0 6px 0 8px;
    background: color-mix(in srgb, var(--ev, #94a3b8) 28%, #ffffff);
    border-left: 3.5px solid var(--ev, #94a3b8);
  }

  .event-ghost {
    min-width: 8px;
    background: color-mix(in srgb, var(--ev, #94a3b8) 12%, #ffffff);
  }

  .event-copy {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    overflow: hidden;
  }

  .event-pos-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    flex-shrink: 0;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--ev, #94a3b8) 25%, transparent);
  }

  .event-copy strong {
    display: block;
    font-size: 0.62rem;
    font-weight: 700;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.15;
  }

  .event-status-chip {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    border-radius: 999px;
    border: 1px solid;
    font-size: 0.56rem;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
    flex-shrink: 0;
    letter-spacing: -0.01em;
  }

  @media (max-width: 768px) {
    .event-status-chip {
      display: none;
    }
  }

  .face-mini {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.82);
    color: #3a3a3a;
    display: grid;
    place-items: center;
    font-size: 0.48rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .more {
    font-size: 0.62rem;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.55);
  }

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 0.66rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .chip.danger { background: #fde8ea; color: #a33b4a; }
  .chip.status.open { background: #f0f0f3; color: #5a5a5a; }
  .chip.status.in_progress { background: #e8f1ff; color: #3a5f9a; }
  .chip.status.done { background: #e5f6ec; color: #2f7a52; }
  .chip.prio.high { background: #fde8ea; color: #a33b4a; }
  .chip.prio.medium { background: #fff3e4; color: #9a6a2e; }
  .chip.prio.low { background: #e8f0f7; color: #3f6a88; }

  .table-wrap {
    flex: 1;
    min-height: 0;
    overflow: auto;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }

  .modern-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 0.68rem;
  }

  .modern-table thead th {
    text-align: left;
    font-size: 0.6rem;
    font-weight: 650;
    color: #8a8a90;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 0 10px 10px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    white-space: nowrap;
    vertical-align: bottom;
  }

  .modern-table tbody td {
    padding: 10px 10px 10px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.045);
    color: #3a3a3a;
    vertical-align: middle;
    height: 44px;
  }

  .modern-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .modern-table tbody tr:hover td {
    background: rgba(26, 26, 26, 0.025);
  }

  .feed-table .col-id { width: 40px; }
  .feed-table .col-when { width: 96px; }
  .feed-table .col-status { width: 110px; }

  .activity-table th:first-child,
  .activity-table td:first-child { width: 28%; }
  .activity-table th:nth-child(2),
  .activity-table td:nth-child(2) { width: 48%; }
  .activity-table .col-when { width: 24%; }

  .deadline-table .col-task { width: 34%; }
  .deadline-table .col-pic { width: 24%; }
  .deadline-table .col-date { width: 18%; }
  .deadline-table .col-late { width: 12%; }
  .deadline-table .col-status { width: 12%; }

  .modern-table thead th:last-child,
  .modern-table tbody td:last-child {
    padding-right: 14px;
  }

  .modern-table .col-status,
  .modern-table .col-late {
    text-align: right;
    padding-right: 14px;
  }

  .modern-table th.col-status,
  .modern-table th.col-late {
    text-align: right;
    padding-right: 14px;
  }

  .mono-id {
    font-variant-numeric: tabular-nums;
    font-size: 0.62rem;
    font-weight: 650;
    color: #9a9aa0;
  }

  .muted {
    color: #8e8e93;
    font-size: 0.65rem;
    font-weight: 500;
  }

  .task-link {
    border: none;
    background: none;
    padding: 0;
    max-width: 100%;
    color: #1a1a1a;
    font: inherit;
    font-size: 0.68rem;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    transition: color 0.15s ease;
  }

  .task-link:hover {
    color: #3a5f9a;
  }

  .pic {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
  }

  .pic-name {
    font-size: 0.65rem;
    font-weight: 550;
    color: #3a3a3a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .face {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    font-size: 0.55rem;
    font-weight: 700;
    font-style: normal;
    flex-shrink: 0;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
  }

  .face.rose { background: #f3d5da; color: #8a2f45; }
  .face.sky { background: #d5e8f8; color: #2f5f8a; }
  .face.soft { background: #ebe7f6; color: #4a3d8f; }
  .face.mint { background: #d8f0e4; color: #2f7a52; }
  .face.sand { background: #f3e6d4; color: #8a5a2f; }

  .status-text {
    font-size: 0.65rem;
    font-weight: 650;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }

  .status-text.open { color: #1a1a1a; }
  .status-text.in_progress { color: #3b6fd4; }
  .status-text.done { color: #2f7a52; }

  .late-text {
    font-size: 0.65rem;
    font-weight: 650;
    color: #c44a4a;
    white-space: nowrap;
  }

  .prio-text {
    font-size: 0.65rem;
    font-weight: 650;
    white-space: nowrap;
  }

  .prio-text.high { color: #c44a4a; }
  .prio-text.medium { color: #b07a2e; }
  .prio-text.low { color: #3f6a88; }

  .activity-line {
    display: block;
    font-size: 0.65rem;
    color: #6b6b6b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .activity-line em {
    font-style: normal;
    color: #1a1a1a;
    font-weight: 600;
  }

  @media (max-width: 1440px) {
    .metrics {
      gap: 10px;
    }
    .metric-card {
      padding: 9px 12px;
      min-height: 0;
    }
    .metric-value {
      font-size: 1.35rem;
    }
  }

  @media (max-width: 1280px) {
    .metrics {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .main-grid {
      grid-template-columns: 1fr;
      grid-template-rows: none;
    }
    .panel {
      min-height: 270px;
    }
  }

  @media (max-width: 1100px) {
    .topbar {
      flex-wrap: wrap;
      gap: 12px;
    }

    .period-slot {
      flex: 1 1 100%;
      order: 3;
      justify-content: flex-start;
      margin-top: 4px;
    }

    .topbar-right {
      width: 100%;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 10px;
    }

    .headline {
      grid-template-columns: 1fr;
      align-items: start;
      row-gap: 14px;
    }

    .headline-meta {
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 16px;
    }
  }

  @media (max-width: 768px) {
    .metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .profile-meta {
      display: none;
    }

    .profile-chip {
      padding: 4px;
      width: 40px;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .metrics {
      grid-template-columns: 1fr;
    }
  }
</style>
