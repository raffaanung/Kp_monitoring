import { api } from './api.js'

/**
 * @typedef {Object} RegistryTask
 * @property {number} id
 * @property {string} title
 * @property {'open' | 'in_progress' | 'done'} status
 * @property {string} pic
 * @property {'high' | 'medium' | 'low'} [priority]
 */

/**
 * @typedef {Object} RegistryHistory
 * @property {number} id
 * @property {string} at
 * @property {string} actor
 * @property {string} action
 */

/**
 * @typedef {Object} RegistryDashboard
 * @property {number} id
 * @property {string} name
 * @property {string} code
 * @property {string} description
 * @property {'active' | 'idle'} status
 * @property {'high' | 'medium' | 'low'} criticality
 * @property {string} owner
 * @property {string} platform
 * @property {string} category
 * @property {string} url
 * @property {string} version
 * @property {string} created_at
 * @property {string} updated_at
 * @property {Record<string, string>} metadata
 * @property {{ tasks_total: number, tasks_open: number, tasks_done: number, last_change: string, requirements_total?: number }} quick_stats
 * @property {RegistryTask[]} tasks
 * @property {RegistryHistory[]} history
 */

export const registryStore = $state({
  /** @type {RegistryDashboard[]} */
  items: [],
  /** @type {number | null} */
  lastDetailId: null,
  loading: false,
  /** @type {string | null} */
  error: null,
})

export async function loadDashboardsFromApi() {
  registryStore.loading = true
  registryStore.error = null
  try {
    registryStore.items = await api.get('/api/dashboards')
  } catch (e) {
    registryStore.error = e instanceof Error ? e.message : String(e)
  } finally {
    registryStore.loading = false
  }
}

/** @param {number} id */
export function getDashboard(id) {
  return registryStore.items.find((d) => d.id === id) || null
}

/** @param {number} id */
export function rememberDetailId(id) {
  registryStore.lastDetailId = id
}

/**
 * @param {{ status?: string, dashboard?: string, criticality?: string, q?: string, sort?: string }} [filters]
 */
export function listDashboards(filters = {}) {
  const { status = '', dashboard = '', criticality = '', q = '', sort = 'updated_desc' } = filters
  let items = registryStore.items.slice()

  if (status) items = items.filter((d) => d.status === status)
  if (criticality) items = items.filter((d) => d.criticality === criticality)
  if (dashboard) {
    const needle = dashboard.toLowerCase()
    items = items.filter((d) => `${d.name} ${d.code} ${d.category}`.toLowerCase().includes(needle))
  }
  if (q) {
    const needle = q.toLowerCase()
    items = items.filter((d) =>
      `${d.name} ${d.code} ${d.description} ${d.owner} ${d.platform} ${d.category}`.toLowerCase().includes(needle),
    )
  }

  const rank = { high: 3, medium: 2, low: 1 }
  switch (sort) {
    case 'name_asc':
      items.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'name_desc':
      items.sort((a, b) => b.name.localeCompare(a.name))
      break
    case 'criticality_desc':
      items.sort((a, b) => (rank[b.criticality] || 0) - (rank[a.criticality] || 0))
      break
    case 'criticality_asc':
      items.sort((a, b) => (rank[a.criticality] || 0) - (rank[b.criticality] || 0))
      break
    case 'status_asc':
      items.sort((a, b) => a.status.localeCompare(b.status))
      break
    case 'updated_asc':
      items.sort((a, b) => a.updated_at.localeCompare(b.updated_at))
      break
    default:
      items.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  }

  return items
}

/**
 * @param {{ name: string, description?: string, pm?: string, owner?: string, url?: string, platform?: string, actor?: string }} payload
 * @returns {Promise<RegistryDashboard | null>}
 */
export async function createDashboard(payload) {
  try {
    const created = await api.post('/api/dashboards', payload)
    await loadDashboardsFromApi()
    return created
  } catch {
    return null
  }
}

/**
 * @param {number} id
 * @param {Partial<Pick<RegistryDashboard, 'name' | 'code' | 'description' | 'owner' | 'platform' | 'category' | 'url' | 'version' | 'criticality' | 'metadata'>>} patch
 */
export async function updateDashboard(id, patch) {
  try {
    await api.put(`/api/dashboards/${id}`, patch)
    await loadDashboardsFromApi()
    return true
  } catch {
    return false
  }
}

/** @param {number} id */
export async function deleteDashboard(id) {
  try {
    await api.del(`/api/dashboards/${id}`)
    await loadDashboardsFromApi()
    return true
  } catch {
    return false
  }
}

/** @param {number} id @param {'active' | 'idle'} status */
export async function changeDashboardStatus(id, status) {
  try {
    await api.put(`/api/dashboards/${id}/status`, { status })
    await loadDashboardsFromApi()
    return true
  } catch {
    return false
  }
}

/** @param {number} id @param {string} key @param {string} value */
export async function setDashboardField(id, key, value) {
  const clean = (key || '').trim()
  if (!clean) return false
  try {
    await api.post(`/api/dashboards/${id}/fields`, { key: clean, value })
    await loadDashboardsFromApi()
    return true
  } catch {
    return false
  }
}

/** @param {number} id @param {string} oldKey @param {string} newKey @param {string} value */
export async function renameDashboardField(id, oldKey, newKey, value) {
  const clean = (newKey || '').trim()
  if (!clean) return false
  try {
    await api.put(`/api/dashboards/${id}/fields`, { old_key: oldKey, new_key: clean, value })
    await loadDashboardsFromApi()
    return true
  } catch {
    return false
  }
}

/** @param {number} id @param {string} key */
export async function removeDashboardField(id, key) {
  try {
    await api.del(`/api/dashboards/${id}/fields`, { key })
    await loadDashboardsFromApi()
    return true
  } catch {
    return false
  }
}

/**
 * Dashboard requirement counts are now computed live server-side (quick_stats.requirements_total),
 * so this just re-syncs the cached list after a requirement is created elsewhere.
 * @param {number} _id @param {number} _total
 */
export async function setRequirementsTotal(_id, _total) {
  await loadDashboardsFromApi()
  return true
}

/**
 * Legacy per-dashboard mini task list — kept only so RegistryDetail.svelte's unreachable
 * "Tasks" tab doesn't throw on import. Not backed by the database (no UI path reaches it).
 * @param {number} dashboardId @param {{ title: string, pic?: string, status?: string, priority?: string }} payload
 */
export function addRegistryTask(dashboardId, payload) {
  const item = getDashboard(dashboardId)
  if (!item) return null
  const title = (payload.title || '').trim()
  if (!title) return null
  const nextId = item.tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1
  /** @type {RegistryTask} */
  const task = {
    id: nextId,
    title,
    status: payload.status || 'open',
    pic: payload.pic || '',
    priority: payload.priority || 'medium',
  }
  item.tasks = [task, ...item.tasks]
  registryStore.items = [...registryStore.items]
  return task
}

/** @param {'active' | 'idle'} status */
export function registryStatusLabel(status) {
  if (status === 'active') return 'Active'
  if (status === 'idle') return 'Idle'
  return status
}

/** @param {'high' | 'medium' | 'low'} value */
export function criticalityLabel(value) {
  if (value === 'high') return 'High'
  if (value === 'medium') return 'Medium'
  if (value === 'low') return 'Low'
  return value
}

/** @param {'open' | 'in_progress' | 'done'} status */
export function itemStatusLabel(status) {
  if (status === 'open') return 'Open'
  if (status === 'in_progress') return 'In Progress'
  if (status === 'done') return 'Done'
  return status
}

export const registryStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'idle', label: 'Idle' },
]

export const criticalityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

/** @deprecated unused by the live UI — kept only in case something still imports it. */
export const dashboardFilterOptions = []

export const sortOptions = [
  { value: 'updated_desc', label: 'Terbaru diperbarui' },
  { value: 'updated_asc', label: 'Terlama diperbarui' },
  { value: 'name_asc', label: 'Nama A-Z' },
  { value: 'name_desc', label: 'Nama Z-A' },
  { value: 'criticality_desc', label: 'Kritikalitas tinggi' },
  { value: 'criticality_asc', label: 'Kritikalitas rendah' },
  { value: 'status_asc', label: 'Status' },
]
