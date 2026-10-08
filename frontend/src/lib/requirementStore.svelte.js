import { api } from './api.js'
import { accessStore } from './accessStore.svelte.js'

/** @typedef {'open' | 'in_progress' | 'done'} RequirementStatus */
/** @typedef {'on_track' | 'at_risk' | 'blocked'} RequirementHealth */

/**
 * @typedef {Object} Requirement
 * @property {string} id
 * @property {string} code
 * @property {string} dashboard
 * @property {string} title
 * @property {string} description
 * @property {RequirementStatus} status
 * @property {RequirementHealth} health
 * @property {string} due_date
 * @property {string[]} team
 * @property {string} created_by
 * @property {string} created_at
 * @property {string} updated_at
 * @property {number} version_no
 * @property {string | null} version_root_id
 */

export const requirementStore = $state({
  /** @type {Requirement[]} */
  items: [],
  /** @type {string | null} */
  lastDetailId: null,
  loading: false,
  /** @type {string | null} */
  error: null,
})

export async function loadRequirementsFromApi() {
  requirementStore.loading = true
  requirementStore.error = null
  try {
    requirementStore.items = await api.get('/api/requirements')
  } catch (e) {
    requirementStore.error = e instanceof Error ? e.message : String(e)
  } finally {
    requirementStore.loading = false
  }
}

/** @param {string} id */
export function reqCode(id) {
  return requirementStore.items.find((r) => r.id === id)?.code || ''
}

/** Id yang dipakai sebagai identitas tetap requirement ini, sama untuk semua versinya (V1, V2, ...). */
/** @param {Pick<Requirement, 'id' | 'version_root_id'>} item */
export function versionRootId(item) {
  return item.version_root_id || item.id
}

/** " · V2" kalau versinya bukan V1, kosong kalau V1 (supaya requirement yang belum punya versi lain tampil sama seperti sebelumnya). */
/** @param {Pick<Requirement, 'version_no'>} item */
export function reqVersionSuffix(item) {
  return item.version_no > 1 ? ` · V${item.version_no}` : ''
}

/** Semua versi (V1, V2, ...) dari requirement yang satu grup dengan id ini, urut dari yang paling lama. */
/** @param {number} id */
export function requirementVersions(id) {
  const item = getRequirement(id)
  if (!item) return []
  const rootId = versionRootId(item)
  return requirementStore.items
    .filter((r) => versionRootId(r) === rootId)
    .sort((a, b) => a.version_no - b.version_no)
}

/**
 * Kelompokkan daftar requirement per grup versi, untuk ditampilkan sebagai satu baris.
 * @param {Requirement[]} items
 * @returns {{ root: Requirement, latest: Requirement, versions: Requirement[] }[]}
 */
export function groupByVersionRoot(items) {
  /** @type {Map<number, Requirement[]>} */
  const groups = new Map()
  for (const r of items) {
    const rootId = versionRootId(r)
    const bucket = groups.get(rootId)
    if (bucket) bucket.push(r)
    else groups.set(rootId, [r])
  }
  return [...groups.values()].map((versions) => {
    const sorted = [...versions].sort((a, b) => a.version_no - b.version_no)
    return { root: sorted[0], latest: sorted[sorted.length - 1], versions: sorted }
  })
}

/**
 * Buat versi baru dari requirement ini. Tanpa payload, judul/deskripsi/tim disalin dari
 * versi sumber sebagai awalan; task tidak ikut disalin karena task adalah milik satu versi.
 * @param {number} id
 * @param {{ title?: string, description?: string, team?: string[] }} [payload]
 */
export async function createRequirementVersion(id, payload = {}) {
  try {
    const body = {}
    if (payload.title !== undefined) body.title = payload.title.trim()
    if (payload.description !== undefined) body.description = payload.description.trim()
    if (payload.team !== undefined) body.team = payload.team.filter(Boolean)
    const created = await api.post(`/api/requirements/${id}/versions`, body)
    await loadRequirementsFromApi()
    return created
  } catch {
    return null
  }
}

/** Hapus satu versi requirement. Task yang pernah terhubung ke versi ini tidak ikut terhapus — hanya tautannya dilepas. @param {number} id */
export async function deleteRequirementVersion(id) {
  return deleteRequirement(id)
}

/** @param {string} id */
export function rememberDetailId(id) {
  requirementStore.lastDetailId = id || null
}

/** @param {string} id */
export function getRequirement(id) {
  return requirementStore.items.find((r) => r.id === id) || null
}

/**
 * @param {{
 *   dashboard?: string,
 *   status?: string,
 *   q?: string,
 *   sort?: string,
 * }} [filters]
 */
export function listRequirements({ dashboard = '', status = '', q = '', sort = 'updated_desc' } = {}) {
  let items = [...requirementStore.items]
  if (dashboard) items = items.filter((r) => r.dashboard === dashboard)
  if (status) items = items.filter((r) => r.status === status)
  if (q) {
    const needle = q.toLowerCase()
    items = items.filter((r) =>
      `${reqCode(versionRootId(r))} ${r.title} ${r.description} ${r.dashboard} ${r.created_by} ${r.team.join(' ')}`
        .toLowerCase()
        .includes(needle),
    )
  }

  const statusRank = { open: 0, in_progress: 1, done: 2 }
  items.sort((a, b) => {
    switch (sort) {
      case 'updated_asc':
        return a.updated_at.localeCompare(b.updated_at)
      case 'due_asc':
        return (a.due_date || '9999').localeCompare(b.due_date || '9999')
      case 'title_asc':
        return a.title.localeCompare(b.title)
      case 'title_desc':
        return b.title.localeCompare(a.title)
      case 'dashboard_asc':
        return a.dashboard.localeCompare(b.dashboard) || a.title.localeCompare(b.title)
      case 'status_asc':
        return (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9)
      case 'updated_desc':
      default:
        return b.updated_at.localeCompare(a.updated_at)
    }
  })
  return items
}

/** Dashboard names available for filter / form select */
export function requirementDashboardOptions() {
  return [...new Set(requirementStore.items.map((r) => r.dashboard).filter(Boolean))].sort()
}

export const requirementSortOptions = [
  { value: 'updated_desc', label: 'Updated terbaru' },
  { value: 'updated_asc', label: 'Updated terlama' },
  { value: 'due_asc', label: 'Due date terdekat' },
  { value: 'title_asc', label: 'Judul A–Z' },
  { value: 'title_desc', label: 'Judul Z–A' },
  { value: 'dashboard_asc', label: 'Dashboard A–Z' },
  { value: 'status_asc', label: 'Status' },
]

/** @param {string} dashboard */
export function countRequirements(dashboard = '') {
  if (!dashboard) return requirementStore.items.length
  return requirementStore.items.filter((r) => r.dashboard === dashboard).length
}

/**
 * @param {{
 *   dashboard: string,
 *   title: string,
 *   description?: string,
 *   status?: RequirementStatus,
 *   health?: RequirementHealth,
 *   due_date?: string,
 *   team?: string[],
 *   created_by?: string,
 * }} payload
 */
export async function createRequirement(payload) {
  const title = (payload.title || '').trim()
  const dashboard = (payload.dashboard || '').trim()
  if (!title || !dashboard) return null

  try {
    const created = await api.post('/api/requirements', {
      dashboard,
      title,
      description: (payload.description || '').trim(),
      due_date: (payload.due_date || '').trim(),
      team: Array.isArray(payload.team) ? payload.team.filter(Boolean) : [],
      created_by: (payload.created_by || '').trim(),
    })
    await loadRequirementsFromApi()
    return created
  } catch {
    return null
  }
}

/**
 * @param {number} id
 * @param {Partial<Pick<Requirement, 'title' | 'description' | 'status' | 'health' | 'due_date' | 'team'>>} patch
 */
export async function updateRequirement(id, patch) {
  try {
    await api.put(`/api/requirements/${id}`, patch)
    await loadRequirementsFromApi()
    return true
  } catch {
    return false
  }
}

/** No delete UI exists anywhere in the app; kept only for API symmetry. */
export async function deleteRequirement(id) {
  try {
    await api.del(`/api/requirements/${id}`)
    await loadRequirementsFromApi()
    return true
  } catch {
    return false
  }
}

/** @param {RequirementStatus | string} status */
export function requirementStatusLabel(status) {
  switch (status) {
    case 'open':
      return 'Open'
    case 'in_progress':
      return 'In Progress'
    case 'done':
      return 'Done'
    default:
      return status
  }
}

/** @param {RequirementHealth | string} health */
export function requirementHealthLabel(health) {
  switch (health) {
    case 'on_track':
      return 'On Track'
    case 'at_risk':
      return 'At Risk'
    case 'blocked':
      return 'Blocked'
    default:
      return health
  }
}

export const requirementStatusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

/** Standarisasi status requirement + arti bisnis */
export const requirementStatusCatalog = [
  {
    value: 'open',
    label: 'Open',
    summary: 'Requirement baru / belum dikerjakan. Belum ada progress task yang aktif.',
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    summary: 'Sedang dikerjakan. Ada task yang sudah dipecah dan berjalan di backlog/board.',
  },
  {
    value: 'done',
    label: 'Done',
    summary: 'Requirement selesai. Seluruh scope dianggap complete / diterima.',
  },
]

export const requirementHealthOptions = [
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'blocked', label: 'Blocked' },
]

/** Standarisasi health requirement + arti bisnis */
export const requirementHealthCatalog = [
  {
    value: 'on_track',
    label: 'On Track',
    summary: 'Jalur sehat. Progress & deadline masih terkendali.',
  },
  {
    value: 'at_risk',
    label: 'At Risk',
    summary: 'Berisiko telat / scope bergeser. Perlu perhatian PM.',
  },
  {
    value: 'blocked',
    label: 'Blocked',
    summary: 'Terhambat dependency / approval. Tidak bisa lanjut tanpa keputusan.',
  },
]

/**
 * Ringkasan jumlah per status (opsional filter dashboard).
 * @param {string} [dashboard]
 */
export function requirementStatusSummary(dashboard = '') {
  const base = dashboard
    ? requirementStore.items.filter((r) => r.dashboard === dashboard)
    : requirementStore.items
  return requirementStatusCatalog.map((row) => ({
    ...row,
    count: base.filter((r) => r.status === row.value).length,
  }))
}

/**
 * Ringkasan jumlah per health (opsional filter dashboard).
 * @param {string} [dashboard]
 */
export function requirementHealthSummary(dashboard = '') {
  const base = dashboard
    ? requirementStore.items.filter((r) => r.dashboard === dashboard)
    : requirementStore.items
  return requirementHealthCatalog.map((row) => ({
    ...row,
    count: base.filter((r) => r.health === row.value).length,
  }))
}

/** Real Teknis-role users from accessStore, in the same shape the team picker used to get from a hardcoded roster. */
export function requirementTeamRoster() {
  const teknisRole = accessStore.roles.find((r) => r.name === 'Teknis')
  if (!teknisRole) return []
  return accessStore.users
    .filter((u) => u.role_id === teknisRole.id && u.status === 'active')
    .map((u) => ({ name: u.name, role: 'Teknis', presence: 'online' }))
}
