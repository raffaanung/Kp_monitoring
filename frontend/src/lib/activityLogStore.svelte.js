/** @typedef {'create' | 'update' | 'status_change' | 'delete' | 'register' | 'approval' | 'other'} ActionType */
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
 * @property {string} objectId
 * @property {string} objectLabel
 * @property {string} [dashboard]
 * @property {FieldChange[]} changes
 */

import { api } from './api.js'
import { taskModuleStore } from './taskModuleStore.svelte.js'

/**
 * Bentuk baris dari API ke bentuk yang dipakai halaman.
 * @param {any} row
 * @param {FieldChange[]} [changes]
 * @returns {ActivityLogEntry}
 */
function shapeEntry(row, changes = []) {
  return {
    id: String(row.id),
    at: row.at,
    actor: row.actor || '',
    action: row.action,
    actionType: row.actionType,
    objectType: row.objectType,
    objectId: String(row.objectId),
    objectLabel: row.objectLabel || '',
    dashboard: row.dashboard || '',
    changes,
  }
}

export const activityLogStore = $state({
  /** @type {ActivityLogEntry[]} */
  items: [],
  loading: false,
  /** @type {string | null} */
  error: null,
  /** @type {string | null} */
  lastDetailId: null,
})

/** Muat daftar log dari database. Changes yang sudah pernah dimuat dari detail tetap disimpan. */
export async function loadActivityLogsFromApi() {
  activityLogStore.loading = true
  activityLogStore.error = null
  try {
    const rows = await api.get('/api/activity-logs')
    const knownChanges = new Map(activityLogStore.items.map((l) => [l.id, l.changes]))
    activityLogStore.items = rows.map((/** @type {any} */ r) => shapeEntry(r, knownChanges.get(String(r.id)) || []))
  } catch (e) {
    activityLogStore.error = e instanceof Error ? e.message : String(e)
  } finally {
    activityLogStore.loading = false
  }
}

/** Muat satu log beserta detail perubahan field-nya, lalu simpan ke daftar. @param {string | number} id */
export async function loadActivityLogDetail(id) {
  try {
    const row = await api.get(`/api/activity-logs/${id}`)
    const changes = (row.changes || []).map((/** @type {any} */ c) => ({
      field: c.field,
      label: c.label,
      before: c.before ?? '—',
      after: c.after ?? '—',
    }))
    const entry = shapeEntry(row, changes)
    const index = activityLogStore.items.findIndex((l) => l.id === entry.id)
    if (index >= 0) activityLogStore.items[index] = entry
    else activityLogStore.items = [entry, ...activityLogStore.items]
    return true
  } catch {
    return false
  }
}

/** @param {string | number} id */
export function getActivityLog(id) {
  return activityLogStore.items.find((l) => l.id === String(id)) || null
}

/** @param {string} id */
export function rememberLogDetailId(id) {
  activityLogStore.lastDetailId = id
}

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
  { value: 'approval', label: 'Approval' },
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
