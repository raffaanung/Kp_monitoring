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
 * Mengambil semua data IP dari dashboard (dari metadata development_ip, production_ip, dsb.)
 * @param {any} d
 * @returns {string[]}
 */
export function getDashboardIps(d) {
  if (!d) return []
  const ips = []
  if (d.ip) ips.push(String(d.ip).trim())

  let meta = d.metadata
  if (typeof meta === 'string') {
    try {
      meta = JSON.parse(meta)
    } catch {
      const matches = meta.match(/\b\d{1,3}(?:\.\d{1,3}){1,3}\b/g)
      if (matches) ips.push(...matches)
      meta = null
    }
  }

  if (meta && typeof meta === 'object') {
    for (const [key, val] of Object.entries(meta)) {
      if (!val) continue
      const strVal = String(val).trim()
      if (!strVal) continue

      const k = key.toLowerCase()
      // Jika key mengandung 'ip' (development_ip, production_ip, server_ip, dsb.)
      if (k.includes('ip')) {
        ips.push(strVal)
      } else if (/\b\d{1,3}(?:\.\d{1,3}){1,3}\b/.test(strVal)) {
        // Atau jika nilai mengandung format IP address
        const matches = strVal.match(/\b\d{1,3}(?:\.\d{1,3}){1,3}\b/g)
        if (matches) ips.push(...matches)
      }
    }
  }

  if (d.url) {
    const urlMatches = String(d.url).match(/\b\d{1,3}(?:\.\d{1,3}){1,3}\b/g)
    if (urlMatches) ips.push(...urlMatches)
  }

  return ips
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
    const needle = q.toLowerCase().trim()
    items = items.filter((d) => {
      // 1. Pencarian berdasarkan nama aplikasi (dan kode singkatan)
      const name = (d.name || '').toLowerCase()
      const code = (d.code || '').toLowerCase()
      if (name.includes(needle) || (code && code.includes(needle))) {
        return true
      }

      // 2. Pencarian berdasarkan data IP (development_ip, production_ip, server IP, dsb.)
      const ips = getDashboardIps(d)
      if (ips.some((ip) => ip.toLowerCase().includes(needle))) {
        return true
      }

      return false
    })
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
  const created = await api.post('/api/dashboards', payload)
  await loadDashboardsFromApi()
  return created
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

/** Ganti Work Priority (criticality) — endpoint sendiri, Admin atau PIC dashboard itu aja yang boleh. @param {number} id @param {'low' | 'medium' | 'high'} criticality */
export async function changeDashboardCriticality(id, criticality) {
  try {
    await api.put(`/api/dashboards/${id}/criticality`, { criticality })
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
  { value: 'updated_desc', label: 'Recently updated' },
  { value: 'updated_asc', label: 'Least recently updated' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'criticality_desc', label: 'Highest priority' },
  { value: 'criticality_asc', label: 'Lowest priority' },
  { value: 'status_asc', label: 'Status' },
]

/**
 * @typedef {Object} FormFieldSpec
 * @property {string} key
 * @property {string} label
 * @property {string} placeholder
 * @property {string} [type]
 * @property {boolean} [secret]
 * @property {boolean} [required]
 */

/**
 * @typedef {Object} DashboardFormSchema
 * @property {FormFieldSpec[]} profile_fields
 * @property {FormFieldSpec[]} env_fields
 * @property {FormFieldSpec[]} [custom_fields]
 * @property {string} [updated_at]
 * @property {string} [updated_by]
 */

export async function loadDashboardFormSchema() {
  try {
    return await api.get('/api/dashboards/form-schema')
  } catch (err) {
    console.error('Failed to load dashboard form schema:', err)
    return null
  }
}

/** @param {DashboardFormSchema} schema */
export async function saveDashboardFormSchema(schema) {
  return await api.put('/api/dashboards/form-schema', schema)
}

export async function resetDashboardFormSchema() {
  return await api.post('/api/dashboards/form-schema/reset')
}

/**
 * @param {string} dashboardId
 * @param {{ name: string, description?: string }} payload
 */
export async function createDashboardModule(dashboardId, payload) {
  const created = await api.post(`/api/dashboards/${dashboardId}/modules`, payload)
  const item = getDashboard(dashboardId)
  if (item) {
    item.modules = [...(item.modules || []), created]
    registryStore.items = [...registryStore.items]
  }
  return created
}

/**
 * @param {string} dashboardId
 * @param {string} moduleId
 * @param {{ name: string, description?: string }} payload
 */
export async function updateDashboardModule(dashboardId, moduleId, payload) {
  const updated = await api.put(`/api/dashboards/${dashboardId}/modules/${moduleId}`, payload)
  const item = getDashboard(dashboardId)
  if (item && item.modules) {
    item.modules = item.modules.map((m) => (m.id === moduleId ? updated : m))
    registryStore.items = [...registryStore.items]
  }
  return updated
}

/**
 * @param {string} dashboardId
 * @param {string} moduleId
 */
export async function deleteDashboardModule(dashboardId, moduleId) {
  await api.delete(`/api/dashboards/${dashboardId}/modules/${moduleId}`)
  const item = getDashboard(dashboardId)
  if (item && item.modules) {
    item.modules = item.modules.filter((m) => m.id !== moduleId)
    registryStore.items = [...registryStore.items]
  }
  return true
}

/**
 * @param {string} dashboardId
 * @param {{ description?: string, category?: string }} patch
 */
export async function updateDashboardGeneralKnowledge(dashboardId, patch) {
  const ok = await updateDashboard(dashboardId, patch)
  return ok
}

