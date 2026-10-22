import { api } from './api.js'
import { refreshCurrentUser } from './authStore.svelte.js'
import { listDashboards } from './registryStore.svelte.js'

/** @typedef {'active' | 'inactive'} UserStatus */

/**
 * @typedef {Object} AccessUser
 * @property {string} id
 * @property {string} name
 * @property {string} username
 * @property {string} role_id
 * @property {string} unit
 * @property {string[]} team_ids
 * @property {UserStatus} status
 * @property {string} created_at
 */

/**
 * @typedef {Object} AccessPermission
 * @property {string} key
 * @property {string} label
 * @property {string} group
 */

/**
 * @typedef {Object} AccessRole
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {Record<string, boolean>} permissions
 */

/**
 * @typedef {Object} AccessTeam
 * @property {number} id
 * @property {string} name
 * @property {string} unit
 * @property {string} description
 * @property {number} lead_id
 * @property {number[]} member_ids
 * @property {string[]} dashboards
 * @property {string} created_at
 */

/** Matches the `divisions` table 1:1 — small and fixed enough to keep static client-side. */
export const unitOptions = ['GBO', 'Finance', 'CX & Experience', 'Technology', 'EDM Core']

export const accessStore = $state({
  /** @type {AccessUser[]} */
  users: [],
  /** @type {AccessRole[]} */
  roles: [],
  /** @type {AccessTeam[]} */
  teams: [],
  /** @type {AccessPermission[]} */
  permissions: [],
  loading: false,
  /** @type {string | null} */
  error: null,
})

/** Call on app boot (or after any page that needs fresh data mounts). */
export async function loadAccessFromApi() {
  accessStore.loading = true
  accessStore.error = null
  try {
    const [users, roles, teams, permissions] = await Promise.all([
      api.get('/api/users'),
      api.get('/api/roles'),
      api.get('/api/teams'),
      api.get('/api/permissions'),
    ])
    accessStore.users = users
    accessStore.roles = roles
    accessStore.teams = teams
    accessStore.permissions = permissions
    // Role atau permission yang berubah juga berlaku untuk akun yang sedang login.
    await refreshCurrentUser()
  } catch (e) {
    accessStore.error = e instanceof Error ? e.message : String(e)
  } finally {
    accessStore.loading = false
  }
}

/** @param {string} id */
export function getUser(id) {
  return accessStore.users.find((u) => u.id === id) || null
}

/** @param {string} id */
export function getRole(id) {
  return accessStore.roles.find((r) => r.id === id) || null
}

/** @param {string} id */
export function getTeam(id) {
  return accessStore.teams.find((t) => t.id === id) || null
}

/** @param {string} roleId */
export function roleLabel(roleId) {
  return getRole(roleId)?.name || '—'
}

/** @param {string} userId */
export function userLabel(userId) {
  return getUser(userId)?.name || '—'
}

/** @param {string[]} teamIds */
/** Nama dashboard yang ditangani tim-tim user ini (lihat dashboardTeamOptions — "Tim" dilabeli per dashboard). */
export function teamLabels(teamIds) {
  const names = new Set()
  for (const id of teamIds) {
    const team = getTeam(id)
    if (team) team.dashboards.forEach((name) => names.add(name))
  }
  return [...names]
}

export function roleOptions() {
  const canonical = ['Admin', 'Developer', 'Viewer']
  const matched = accessStore.roles
    .filter((r) => canonical.includes(r.name))
    .sort((a, b) => canonical.indexOf(a.name) - canonical.indexOf(b.name))

  if (matched.length > 0) {
    return matched.map((r) => ({ value: r.id, label: r.name }))
  }
  return accessStore.roles.map((r) => ({ value: r.id, label: r.name }))
}

export function teamOptions() {
  return accessStore.teams.map((t) => ({ value: t.id, label: t.name, unit: t.unit }))
}

/**
 * Pilihan "Tim" dilabeli dari Dashboard Registry, bukan dari nama tim mentah — satu tim bisa
 * menangani beberapa dashboard sekaligus, jadi mencentang salah satu dashboard yang ditangani
 * tim yang sama akan ikut mencentang dashboard lain yang ditangani tim itu juga.
 * @returns {{ value: string, label: string }[]}
 */
export function dashboardTeamOptions() {
  return listDashboards({ sort: 'name_asc' })
    .map((d) => {
      const team = accessStore.teams.find((t) => t.dashboards.includes(d.name))
      return team ? { value: team.id, label: d.name } : null
    })
    .filter((opt) => opt !== null)
}

export function userOptions() {
  return accessStore.users.map((u) => ({ value: u.id, label: u.name }))
}

/**
 * @param {{
 *   role?: string | number,
 *   unit?: string,
 *   team?: string | number,
 *   status?: string,
 *   q?: string,
 * }} filters
 */
export function listUsers(filters = {}) {
  const role = filters.role ? String(filters.role) : ''
  const team = filters.team ? String(filters.team) : ''
  const unit = (filters.unit || '').trim()
  const status = (filters.status || '').trim()
  const q = (filters.q || '').trim().toLowerCase()

  return accessStore.users.filter((u) => {
    if (role && u.role_id !== role) return false
    if (unit && u.unit !== unit) return false
    if (team && !u.team_ids.includes(team)) return false
    if (status && u.status !== status) return false
    if (q) {
      const hay = `${u.name} ${u.username} ${roleLabel(u.role_id)} ${u.unit} ${teamLabels(u.team_ids).join(' ')}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

/**
 * @param {string} userId
 * @param {{ name: string, username: string, role_id: string, unit?: string, team_ids?: string[], status?: UserStatus }} payload
 * @returns {Promise<{ ok: true } | { ok: false, reason: string }>}
 */
export async function updateUser(userId, payload) {
  try {
    await api.put(`/api/users/${userId}`, payload)
    await loadAccessFromApi()
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * @param {{
 *   unit?: string,
 *   q?: string,
 * }} filters
 */
export function listTeams(filters = {}) {
  const unit = (filters.unit || '').trim()
  const q = (filters.q || '').trim().toLowerCase()

  return accessStore.teams.filter((t) => {
    if (unit && t.unit !== unit) return false
    if (q) {
      const hay = `${t.name} ${t.description} ${t.unit} ${t.dashboards.join(' ')}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

/**
 * @param {{
 *   name: string,
 *   username: string,
 *   role_id: string,
 *   unit: string,
 *   team_ids: string[],
 *   status?: UserStatus,
 * }} payload
 */
export async function createUser(payload) {
  const user = await api.post('/api/users', payload)
  await loadAccessFromApi()
  return user
}

/**
 * @param {{
 *   name: string,
 *   unit: string,
 *   description?: string,
 *   lead_id: number,
 *   member_ids: number[],
 *   dashboards: string[],
 * }} payload
 */
export async function createTeam(payload) {
  const team = await api.post('/api/teams', payload)
  await loadAccessFromApi()
  return team
}

/**
 * @param {{
 *   name: string,
 *   description?: string,
 *   permissions?: Record<string, boolean>,
 * }} payload
 */
export async function createRole(payload) {
  const role = await api.post('/api/roles', payload)
  await loadAccessFromApi()
  return role
}

/**
 * @param {number} roleId
 * @param {{ name: string, description?: string, permissions?: Record<string, boolean> }} payload
 * @returns {Promise<{ ok: true } | { ok: false, reason: string }>}
 */
export async function updateRole(roleId, payload) {
  try {
    await api.put(`/api/roles/${roleId}`, payload)
    await loadAccessFromApi()
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}

/** @param {number} roleId @param {string} permKey @param {boolean} value */
export async function setRolePermission(roleId, permKey, value) {
  try {
    await api.put(`/api/roles/${roleId}/permissions`, { perm_key: permKey, value })
    await loadAccessFromApi()
    return true
  } catch {
    return false
  }
}

/**
 * @param {number} roleId
 * @returns {Promise<{ ok: true } | { ok: false, reason: string }>}
 */
export async function deleteRole(roleId) {
  try {
    await api.del(`/api/roles/${roleId}`)
    await loadAccessFromApi()
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}

/** @param {number} roleId */
export function countUsersInRole(roleId) {
  return accessStore.users.filter((u) => u.role_id === roleId).length
}

/** @param {number} teamId */
export function countMembersInTeam(teamId) {
  return accessStore.teams.find((t) => t.id === teamId)?.member_ids.length || 0
}

/** @param {UserStatus} status */
export function statusLabel(status) {
  return status === 'active' ? 'Aktif' : 'Nonaktif'
}
