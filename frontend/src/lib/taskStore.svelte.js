/** @typedef {'open' | 'in_progress' | 'done'} TaskStatus */
/** @typedef {'high' | 'medium' | 'low'} TaskPriority */
/** @typedef {'today' | 'week' | 'month'} PeriodKey */

/**
 * @typedef {Object} FeTask
 * @property {number} id
 * @property {string} title
 * @property {string} meta
 * @property {TaskStatus} status
 * @property {TaskPriority} priority
 * @property {string} startDate
 * @property {string} deadline
 * @property {string} pic
 * @property {string} updatedAt ISO datetime
 */

const STORAGE_KEY = 'edm-fe-tasks-v3'

/** @param {Date} d */
export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** @param {Date} d @param {number} n */
export function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** Monday 00:00 of the week containing `d` */
/** @param {Date} [d] */
export function startOfWeek(d = new Date()) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - day)
  return date
}

/** @param {Date} [d] */
export function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Inclusive date range for a period filter.
 * @param {PeriodKey} period
 * @param {Date} [ref]
 * @param {{ year?: number, month?: number }} [monthOverride] used when period === 'month'
 */
export function periodRange(period, ref = new Date(), monthOverride = {}) {
  const today = startOfDay(ref)
  if (period === 'today') {
    return { start: today, end: today }
  }
  if (period === 'week') {
    const start = startOfWeek(today)
    return { start, end: addDays(start, 6) }
  }
  const year = monthOverride.year ?? today.getFullYear()
  const month = monthOverride.month ?? today.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return { start, end }
}

/**
 * Task overlaps [rangeStart, rangeEnd] inclusive by calendar day
 * if its [startDate, deadline] intersects the range.
 * @param {FeTask} task
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 */
export function taskOverlapsRange(task, rangeStart, rangeEnd) {
  const start = new Date(`${task.startDate}T00:00:00`)
  let end = new Date(`${task.deadline}T00:00:00`)
  if (end < start) end = new Date(start)
  const rs = startOfDay(rangeStart).getTime()
  const re = startOfDay(rangeEnd).getTime()
  return end.getTime() >= rs && start.getTime() <= re
}

/** @param {FeTask[]} list @param {Date} rangeStart @param {Date} rangeEnd */
export function tasksInRange(list, rangeStart, rangeEnd) {
  return list.filter((t) => taskOverlapsRange(t, rangeStart, rangeEnd))
}

/** @param {string} deadlineISO @param {Date} [ref] */
export function delayLabel(deadlineISO, ref = new Date()) {
  const today = startOfDay(ref).getTime()
  const due = new Date(`${deadlineISO}T00:00:00`).getTime()
  const days = Math.round((today - due) / 86_400_000)
  if (days <= 0) return days === 0 ? 'hari ini' : ''
  if (days === 1) return '1 hari'
  return `${days} hari`
}

/** @param {string} isoDatetime @param {Date} [ref] */
export function relativeWhen(isoDatetime, ref = new Date()) {
  const t = new Date(isoDatetime).getTime()
  if (Number.isNaN(t)) return '—'
  const diffMs = ref.getTime() - t
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) return mins <= 1 ? 'Baru saja' : `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Kemarin'
  if (days < 7) return `${days} hari lalu`
  return new Date(isoDatetime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

/** @returns {FeTask[]} */
function seedTasks() {
  const today = startOfDay()
  const week = startOfWeek(today)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  /** @param {number} dayOffset from today @param {number} hour */
  const updated = (dayOffset, hour = 10) => {
    const d = addDays(today, dayOffset)
    d.setHours(hour, (hour * 7) % 60, 0, 0)
    return d.toISOString()
  }

  /** @type {FeTask[]} */
  return [
    {
      id: 1,
      title: 'Review EDM batch Q3',
      meta: 'EDM Core',
      status: 'in_progress',
      priority: 'high',
      startDate: toISODate(addDays(today, -2)),
      deadline: toISODate(today),
      pic: 'Alamsyah Putra',
      updatedAt: updated(0, 8),
    },
    {
      id: 2,
      title: 'Sync vendor master mapping',
      meta: 'Vendor',
      status: 'open',
      priority: 'medium',
      startDate: toISODate(addDays(week, 1)),
      deadline: toISODate(addDays(week, 4)),
      pic: 'Panji Pujianto',
      updatedAt: updated(-1, 14),
    },
    {
      id: 3,
      title: 'Close overdue invoice tasks',
      meta: 'Invoice',
      status: 'open',
      priority: 'high',
      startDate: toISODate(addDays(today, -10)),
      deadline: toISODate(addDays(today, -3)),
      pic: 'Alamsyah Putra',
      updatedAt: updated(-2, 9),
    },
    {
      id: 4,
      title: 'Generate weekly EDM report',
      meta: 'GBO Dashboard',
      status: 'done',
      priority: 'medium',
      startDate: toISODate(week),
      deadline: toISODate(addDays(week, 2)),
      pic: 'Asep Wahyudi',
      updatedAt: updated(-1, 16),
    },
    {
      id: 5,
      title: 'Fix duplicate document IDs',
      meta: 'CX Dashboard',
      status: 'in_progress',
      priority: 'high',
      startDate: toISODate(addDays(today, -1)),
      deadline: toISODate(addDays(today, 3)),
      pic: 'Alamsyah Putra',
      updatedAt: updated(0, 7),
    },
    {
      id: 6,
      title: 'FinSight KPI refresh',
      meta: 'FinSight',
      status: 'open',
      priority: 'low',
      startDate: toISODate(addDays(monthStart, 8)),
      deadline: toISODate(addDays(monthStart, 14)),
      pic: 'Maggie Arsyad',
      updatedAt: updated(-3, 11),
    },
    {
      id: 7,
      title: 'Onboard new PIC checklist',
      meta: 'TRAXIS',
      status: 'open',
      priority: 'low',
      startDate: toISODate(addDays(monthStart, 15)),
      deadline: toISODate(addDays(monthStart, 25)),
      pic: 'Alamsyah Putra',
      updatedAt: updated(-4, 13),
    },
    {
      id: 8,
      title: 'Validate SLA escalation rules',
      meta: 'GARD',
      status: 'in_progress',
      priority: 'medium',
      startDate: toISODate(addDays(today, -5)),
      deadline: toISODate(addDays(today, -1)),
      pic: 'Alamsyah Putra',
      updatedAt: updated(0, 15),
    },
    {
      id: 9,
      title: 'Modul Baru FinSight',
      meta: 'FinSight',
      status: 'in_progress',
      priority: 'high',
      startDate: toISODate(addDays(monthStart, 1)),
      deadline: toISODate(addDays(monthStart, 18)),
      pic: 'Alamsyah Putra',
      updatedAt: updated(-2, 12),
    },
    {
      id: 10,
      title: 'Validasi Data GBO',
      meta: 'GBO Dashboard',
      status: 'open',
      priority: 'medium',
      startDate: toISODate(addDays(monthStart, 10)),
      deadline: toISODate(addDays(monthStart, 20)),
      pic: 'Panji Pujianto',
      updatedAt: updated(-1, 10),
    },
    {
      id: 11,
      title: 'Escalate stalled vendor sync',
      meta: 'Vendor',
      status: 'open',
      priority: 'high',
      startDate: toISODate(addDays(today, -8)),
      deadline: toISODate(addDays(today, -5)),
      pic: 'Panji Pujianto',
      updatedAt: updated(0, 6),
    },
    {
      id: 12,
      title: 'Prepare October EDM cutover',
      meta: 'EDM Core',
      status: 'open',
      priority: 'high',
      startDate: toISODate(addDays(monthStart, 20)),
      deadline: toISODate(addDays(monthStart, 28)),
      pic: 'Asep Wahyudi',
      updatedAt: updated(0, 9),
    },
    {
      id: 13,
      title: 'Daily standup notes publish',
      meta: 'CX Dashboard',
      status: 'done',
      priority: 'low',
      startDate: toISODate(today),
      deadline: toISODate(today),
      pic: 'Alamsyah Putra',
      updatedAt: updated(0, 11),
    },
    {
      id: 14,
      title: 'Patch TRAXIS alert routing',
      meta: 'TRAXIS',
      status: 'in_progress',
      priority: 'medium',
      startDate: toISODate(addDays(week, 2)),
      deadline: toISODate(addDays(week, 5)),
      pic: 'Alamsyah Putra',
      updatedAt: updated(-1, 17),
    },
    {
      id: 15,
      title: 'GARD capacity snapshot',
      meta: 'GARD',
      status: 'done',
      priority: 'low',
      startDate: toISODate(addDays(monthStart, 2)),
      deadline: toISODate(addDays(monthStart, 6)),
      pic: 'Maggie Arsyad',
      updatedAt: updated(-5, 9),
    },
    {
      id: 16,
      title: 'Hari ini: cek pipeline ingest',
      meta: 'GBO Dashboard',
      status: 'in_progress',
      priority: 'high',
      startDate: toISODate(today),
      deadline: toISODate(today),
      pic: 'Alamsyah Putra',
      updatedAt: updated(0, 12),
    },
  ]
}

/** @returns {FeTask[]} */
function loadTasks() {
  if (typeof localStorage === 'undefined') return seedTasks()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedTasks()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return seedTasks()
    return parsed.map((t) => ({
      priority: 'medium',
      updatedAt: new Date().toISOString(),
      ...t,
    }))
  } catch {
    return seedTasks()
  }
}

export const taskStore = $state({
  /** @type {FeTask[]} */
  items: loadTasks(),
})

function persist() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(taskStore.items))
}

/** @param {Omit<FeTask, 'id' | 'updatedAt' | 'priority'> & { priority?: TaskPriority }} payload */
export function addTask(payload) {
  const nextId = taskStore.items.reduce((max, t) => Math.max(max, t.id), 0) + 1
  taskStore.items = [
    {
      id: nextId,
      title: payload.title.trim(),
      meta: (payload.meta || '').trim() || 'General',
      status: payload.status || 'open',
      priority: payload.priority || 'medium',
      startDate: payload.startDate,
      deadline: payload.deadline,
      pic: (payload.pic || '').trim() || 'You',
      updatedAt: new Date().toISOString(),
    },
    ...taskStore.items,
  ]
  persist()
  return nextId
}

/** @param {TaskStatus} status */
export function statusTone(status) {
  if (status === 'done') return 'mint'
  if (status === 'in_progress') return 'lilac'
  return 'slate'
}

/** @param {TaskStatus} status */
export function progressSolid(status) {
  if (status === 'done') return 1
  if (status === 'in_progress') return 0.62
  return 0.38
}

/**
 * @param {FeTask} task
 * @param {Date} weekStart
 */
export function barInWeek(task, weekStart) {
  const weekEnd = addDays(weekStart, 7)
  const start = new Date(`${task.startDate}T00:00:00`)
  let end = new Date(`${task.deadline}T00:00:00`)
  if (end < start) end = new Date(start)

  const clipStart = Math.max(start.getTime(), weekStart.getTime())
  const clipEnd = Math.min(addDays(end, 1).getTime(), weekEnd.getTime())
  if (clipEnd <= clipStart) return null

  const dayMs = 86_400_000
  const leftDays = (clipStart - weekStart.getTime()) / dayMs
  const spanDays = (clipEnd - clipStart) / dayMs

  return {
    left: (leftDays / 7) * 100,
    width: Math.max((spanDays / 7) * 100, 100 / 7 / 2),
  }
}

/** @param {FeTask[]} list @param {Date} weekStart */
export function tasksInWeek(list, weekStart) {
  /** @type {{ task: FeTask, bar: { left: number, width: number } }[]} */
  const out = []
  for (const task of list) {
    const bar = barInWeek(task, weekStart)
    if (bar) out.push({ task, bar })
  }
  return out
}

export const weekDayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

/**
 * Fixed W1–W4 buckets inside a calendar month:
 * W1 1–7, W2 8–14, W3 15–21, W4 22–akhir bulan
 * @param {number} year
 * @param {number} monthIndex 0–11
 */
export function fourWeeksOfMonth(year, monthIndex) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const ranges = [
    [1, Math.min(7, lastDay)],
    [8, Math.min(14, lastDay)],
    [15, Math.min(21, lastDay)],
    [22, lastDay],
  ]

  return ranges
    .filter(([startDay]) => startDay <= lastDay)
    .map(([startDay, endDay], i) => ({
      key: `${year}-${monthIndex + 1}-W${i + 1}`,
      label: `W${i + 1}`,
      weekNo: i + 1,
      start: new Date(year, monthIndex, startDay),
      end: new Date(year, monthIndex, endDay),
    }))
}

/**
 * @param {number} year
 * @param {number} monthIndex 0–11
 */
export function weeksOfMonth(year, monthIndex) {
  return fourWeeksOfMonth(year, monthIndex)
}

/** Day buckets for current ISO week (Sen–Min) */
/** @param {Date} [ref] */
export function daysOfWeek(ref = new Date()) {
  const start = startOfWeek(ref)
  return weekDayLabels.map((label, i) => {
    const day = addDays(start, i)
    return {
      key: toISODate(day),
      label,
      weekNo: i + 1,
      start: day,
      end: day,
    }
  })
}

/** Single-day bucket for "Hari ini" */
/** @param {Date} [ref] */
export function dayBucket(ref = new Date()) {
  const day = startOfDay(ref)
  return [
    {
      key: toISODate(day),
      label: 'Hari ini',
      weekNo: 1,
      start: day,
      end: day,
    },
  ]
}

/** @param {number} year @param {number} monthIndex */
export function monthLabel(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

/** Which bucket (0…n) contains a date */
/** @param {Date} date @param {{ start: Date, end: Date }[]} weeks */
export function weekIndexForDate(date, weeks) {
  const t = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const idx = weeks.findIndex((w) => t >= w.start.getTime() && t <= w.end.getTime())
  return idx >= 0 ? idx : 0
}

/**
 * Place a task bar across arbitrary day/week buckets.
 * @param {FeTask} task
 * @param {{ start: Date, end: Date }[]} weeks
 */
export function barInMonthWeeks(task, weeks) {
  const n = weeks.length
  if (!n) return null

  const rangeStart = weeks[0].start.getTime()
  const rangeEnd = addDays(weeks[n - 1].end, 1).getTime()

  const start = new Date(`${task.startDate}T00:00:00`)
  let end = new Date(`${task.deadline}T00:00:00`)
  if (end < start) end = new Date(start)

  const clipStart = Math.max(start.getTime(), rangeStart)
  const clipEnd = Math.min(addDays(end, 1).getTime(), rangeEnd)
  if (clipEnd <= clipStart) return null

  const span = rangeEnd - rangeStart || 1
  return {
    left: ((clipStart - rangeStart) / span) * 100,
    width: Math.max(((clipEnd - clipStart) / span) * 100, 100 / n / 5),
  }
}

/** @param {FeTask[]} list @param {{ start: Date, end: Date }[]} weeks */
export function tasksInMonthWeeks(list, weeks) {
  /** @type {{ task: FeTask, bar: { left: number, width: number } }[]} */
  const out = []
  for (const task of list) {
    const bar = barInMonthWeeks(task, weeks)
    if (bar) out.push({ task, bar })
  }
  return out
}
