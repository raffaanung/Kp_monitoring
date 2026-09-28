/** @typedef {'create' | 'update' | 'status_change' | 'delete' | 'register' | 'other'} ActionType */
/** @typedef {'task' | 'dashboard'} ObjectType */

/**
 * @typedef {Object} FieldChange
 * @property {string} field
 * @property {string} label
 * @property {string} before
 * @property {string} after
 */

/**
 * @typedef {Object} ActivityLogEntry
 * @property {string} id
 * @property {string} at
 * @property {string} actor
 * @property {string} action
 * @property {ActionType} actionType
 * @property {ObjectType} objectType
 * @property {number} objectId
 * @property {string} objectLabel
 * @property {string} [dashboard]
 * @property {FieldChange[]} changes
 */

import { taskModuleStore } from './taskModuleStore.svelte.js'

const STORAGE_KEY = 'edm-fe-activity-log-v2'

function nowStamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

/** @returns {ActivityLogEntry[]} */
function seedLogs() {
  return [
    {
      id: 'log-001',
      at: '2026-09-13 15:00:00',
      actor: 'Alamsyah Putra',
      action: 'Moved task to Testing',
      actionType: 'status_change',
      objectType: 'task',
      objectId: 2,
      objectLabel: 'Throughput vs target chart',
      changes: [
        { field: 'status', label: 'Status', before: 'Development', after: 'Testing' },
      ],
    },
    {
      id: 'log-002',
      at: '2026-09-12 11:20:00',
      actor: 'Alamsyah Putra',
      action: 'Moved task to Development',
      actionType: 'status_change',
      objectType: 'task',
      objectId: 1,
      objectLabel: 'SLA heatmap per region',
      changes: [
        { field: 'status', label: 'Status', before: 'Backlog', after: 'Development' },
      ],
    },
    {
      id: 'log-003',
      at: '2026-09-11 09:40:00',
      actor: 'Alamsyah Putra',
      action: 'Moved task to UAT',
      actionType: 'status_change',
      objectType: 'task',
      objectId: 3,
      objectLabel: 'Aging bucket filter',
      changes: [
        { field: 'status', label: 'Status', before: 'Testing', after: 'UAT' },
      ],
    },
    {
      id: 'log-004',
      at: '2026-09-10 14:20:00',
      actor: 'Alamsyah Putra',
      action: 'Updated dashboard metadata',
      actionType: 'update',
      objectType: 'dashboard',
      objectId: 1,
      objectLabel: 'GBO Dashboard',
      changes: [
        { field: 'refresh_cadence', label: 'Refresh Cadence', before: 'Daily', after: 'Hourly' },
        { field: 'version', label: 'Version', before: '2.3', after: '2.4' },
      ],
    },
    {
      id: 'log-005',
      at: '2026-09-10 10:15:00',
      actor: 'Asep Wahyudi',
      action: 'Updated task details',
      actionType: 'update',
      objectType: 'task',
      objectId: 5,
      objectLabel: 'CSAT trend by channel',
      changes: [
        { field: 'deadline', label: 'Deadline', before: '2026-09-20', after: '2026-09-15' },
      ],
    },
    {
      id: 'log-006',
      at: '2026-09-08 13:00:00',
      actor: 'System',
      action: 'Task created',
      actionType: 'create',
      objectType: 'task',
      objectId: 4,
      objectLabel: 'FX rate overlay',
      changes: [
        { field: 'title', label: 'Judul', before: '—', after: 'FX rate overlay' },
        { field: 'dashboard', label: 'Dashboard', before: '—', after: 'FinSight' },
        { field: 'status', label: 'Status', before: '—', after: 'Backlog' },
        { field: 'pic', label: 'PIC', before: '—', after: 'Asep Wahyudi' },
      ],
    },
    {
      id: 'log-007',
      at: '2026-09-05 11:00:00',
      actor: 'Panji Pujianto',
      action: 'Added task to dashboard',
      actionType: 'create',
      objectType: 'dashboard',
      objectId: 1,
      objectLabel: 'GBO Dashboard',
      changes: [
        { field: 'task', label: 'Task Baru', before: '—', after: 'Escalation drill-down' },
      ],
    },
    {
      id: 'log-008',
      at: '2026-09-05 14:00:00',
      actor: 'Alamsyah Putra',
      action: 'Moved task to Development',
      actionType: 'status_change',
      objectType: 'task',
      objectId: 2,
      objectLabel: 'Throughput vs target chart',
      changes: [
        { field: 'status', label: 'Status', before: 'Backlog', after: 'Development' },
      ],
    },
    {
      id: 'log-009',
      at: '2026-09-03 16:45:00',
      actor: 'Alamsyah Putra',
      action: 'Changed dashboard status',
      actionType: 'status_change',
      objectType: 'dashboard',
      objectId: 3,
      objectLabel: 'CX Dashboard',
      changes: [
        { field: 'status', label: 'Status', before: 'Draft', after: 'Active' },
      ],
    },
    {
      id: 'log-010',
      at: '2026-09-01 09:00:00',
      actor: 'System',
      action: 'Task created',
      actionType: 'create',
      objectType: 'task',
      objectId: 1,
      objectLabel: 'SLA heatmap per region',
      changes: [
        { field: 'title', label: 'Judul', before: '—', after: 'SLA heatmap per region' },
        { field: 'dashboard', label: 'Dashboard', before: '—', after: 'GBO Dashboard' },
        { field: 'status', label: 'Status', before: '—', after: 'Backlog' },
        { field: 'pic', label: 'PIC', before: '—', after: 'Alamsyah Putra' },
      ],
    },
    {
      id: 'log-011',
      at: '2026-08-28 10:00:00',
      actor: 'System',
      action: 'Task created',
      actionType: 'create',
      objectType: 'task',
      objectId: 2,
      objectLabel: 'Throughput vs target chart',
      changes: [
        { field: 'title', label: 'Judul', before: '—', after: 'Throughput vs target chart' },
        { field: 'dashboard', label: 'Dashboard', before: '—', after: 'GBO Dashboard' },
      ],
    },
    {
      id: 'log-012',
      at: '2026-08-20 16:30:00',
      actor: 'Alamsyah Putra',
      action: 'Changed dashboard status',
      actionType: 'status_change',
      objectType: 'dashboard',
      objectId: 1,
      objectLabel: 'GBO Dashboard',
      changes: [
        { field: 'status', label: 'Status', before: 'Draft', after: 'Active' },
      ],
    },
    {
      id: 'log-013',
      at: '2026-08-20 08:30:00',
      actor: 'System',
      action: 'Task created',
      actionType: 'create',
      objectType: 'task',
      objectId: 3,
      objectLabel: 'Aging bucket filter',
      changes: [
        { field: 'title', label: 'Judul', before: '—', after: 'Aging bucket filter' },
        { field: 'dashboard', label: 'Dashboard', before: '—', after: 'FinSight' },
      ],
    },
    {
      id: 'log-014',
      at: '2026-08-15 14:00:00',
      actor: 'Alamsyah Putra',
      action: 'Updated task details',
      actionType: 'update',
      objectType: 'task',
      objectId: 3,
      objectLabel: 'Aging bucket filter',
      changes: [
        { field: 'description', label: 'Deskripsi', before: 'Add aging filter', after: 'Add aging buckets filter for invoice cards on FinSight.' },
        { field: 'pic', label: 'PIC', before: 'Asep Wahyudi', after: 'Alamsyah Putra' },
      ],
    },
    {
      id: 'log-015',
      at: '2025-11-12 09:00:00',
      actor: 'System',
      action: 'Dashboard registered',
      actionType: 'register',
      objectType: 'dashboard',
      objectId: 1,
      objectLabel: 'GBO Dashboard',
      changes: [
        { field: 'name', label: 'Nama', before: '—', after: 'GBO Dashboard' },
        { field: 'code', label: 'Kode', before: '—', after: 'GBO' },
        { field: 'platform', label: 'Platform', before: '—', after: 'Power BI' },
        { field: 'owner', label: 'Owner', before: '—', after: 'Alamsyah Putra' },
      ],
    },
  ]
}

/** @returns {ActivityLogEntry[]} */
function loadLogs() {
  if (typeof localStorage === 'undefined') return seedLogs()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedLogs()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : seedLogs()
  } catch {
    return seedLogs()
  }
}

export const activityLogStore = $state({
  /** @type {ActivityLogEntry[]} */
  items: loadLogs(),
  /** @type {string | null} */
  lastDetailId: null,
})

function persist() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activityLogStore.items))
}

/** @param {string} id */
export function getActivityLog(id) {
  return activityLogStore.items.find((l) => l.id === id) || null
}

/** @param {string} id */
export function rememberLogDetailId(id) {
  activityLogStore.lastDetailId = id
}

/**
 * @param {{
 *   dateFrom?: string,
 *   dateTo?: string,
 *   actor?: string,
 *   actionType?: string,
 *   objectType?: string,
 *   dashboard?: string,
 *   q?: string,
 * }} [filters]
 */
/** @param {ActivityLogEntry} log */
export function entryDashboard(log) {
  if (log.dashboard) return log.dashboard
  if (log.objectType === 'dashboard') return log.objectLabel || ''
  const fromChange = (log.changes || []).find(
    (c) => c.field === 'dashboard' && c.after && c.after !== '—',
  )
  if (fromChange) return fromChange.after
  if (log.objectType === 'task') {
    const task = taskModuleStore.items.find((t) => t.id === log.objectId)
    if (task?.dashboard) return task.dashboard
  }
  return ''
}

export function listActivityLogs({
  dateFrom = '',
  dateTo = '',
  actor = '',
  actionType = '',
  objectType = '',
  dashboard = '',
  q = '',
} = {}) {
  let items = [...activityLogStore.items]

  if (dateFrom) items = items.filter((l) => l.at.slice(0, 10) >= dateFrom)
  if (dateTo) items = items.filter((l) => l.at.slice(0, 10) <= dateTo)
  if (actor) items = items.filter((l) => l.actor === actor)
  if (actionType) items = items.filter((l) => l.actionType === actionType)
  if (objectType) items = items.filter((l) => l.objectType === objectType)
  if (dashboard) items = items.filter((l) => entryDashboard(l) === dashboard)
  if (q) {
    const needle = q.toLowerCase()
    items = items.filter((l) =>
      `${l.action} ${l.actor} ${l.objectLabel} ${l.id}`.toLowerCase().includes(needle),
    )
  }

  return items.sort((a, b) => (a.at < b.at ? 1 : -1))
}

export function actorOptions() {
  void activityLogStore.items
  return [...new Set(activityLogStore.items.map((l) => l.actor))].sort()
}

export const actionTypeOptions = [
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'delete', label: 'Delete' },
  { value: 'register', label: 'Register' },
  { value: 'other', label: 'Other' },
]

export const objectTypeOptions = [
  { value: 'task', label: 'Task' },
  { value: 'dashboard', label: 'Dashboard' },
]

/** @param {ActionType | string} type */
export function actionTypeLabel(type) {
  const found = actionTypeOptions.find((o) => o.value === type)
  return found ? found.label : type
}

/** @param {ObjectType | string} type */
export function objectTypeLabel(type) {
  const found = objectTypeOptions.find((o) => o.value === type)
  return found ? found.label : type
}

/**
 * Append a new log entry (for future integration with task/registry stores).
 * @param {Omit<ActivityLogEntry, 'id'> & { id?: string }} entry
 */
export function appendActivityLog(entry) {
  const nextNum = activityLogStore.items.reduce((max, l) => {
    const num = parseInt(l.id.replace('log-', ''), 10)
    return Number.isFinite(num) ? Math.max(max, num) : max
  }, 0) + 1
  const id = entry.id || `log-${String(nextNum).padStart(3, '0')}`
  /** @type {ActivityLogEntry} */
  const log = {
    id,
    at: entry.at || nowStamp(),
    actor: entry.actor,
    action: entry.action,
    actionType: entry.actionType,
    objectType: entry.objectType,
    objectId: entry.objectId,
    objectLabel: entry.objectLabel,
    changes: entry.changes || [],
  }
  activityLogStore.items = [log, ...activityLogStore.items]
  persist()
  return log
}
