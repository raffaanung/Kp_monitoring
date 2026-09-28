/** @typedef {'active' | 'inactive'} UserStatus */

/**
 * @typedef {Object} AccessUser
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {number} role_id
 * @property {string} unit
 * @property {number[]} team_ids
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

const STORAGE_KEY = 'edm-fe-access-v4'

/** @type {AccessPermission[]} */
const defaultPermissions = [
  { key: 'view_monitoring', label: 'Lihat Operation Monitoring', group: 'Monitoring' },
  { key: 'manage_tasks', label: 'Kelola Tasks', group: 'Tasks' },
  { key: 'manage_registry', label: 'Kelola Dashboard Registry', group: 'Registry' },
  { key: 'view_activity_log', label: 'Lihat Activity Log', group: 'Audit' },
  { key: 'manage_users', label: 'Kelola User', group: 'Access' },
  { key: 'manage_roles', label: 'Kelola Role & Permission', group: 'Access' },
  { key: 'manage_teams', label: 'Kelola Tim', group: 'Access' },
  { key: 'export_data', label: 'Export Data', group: 'Data' },
]

export const permissionCatalog = defaultPermissions

export const unitOptions = ['GBO', 'Finance', 'CX & Experience', 'Technology', 'EDM Core']

function nowStamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

/** @param {AccessPermission[]} list @param {Record<string, boolean>} overrides */
function allPermissions(list, overrides = {}) {
  /** @type {Record<string, boolean>} */
  const base = {}
  for (const p of list) base[p.key] = false
  return { ...base, ...overrides }
}

/** @returns {{ users: AccessUser[], roles: AccessRole[], teams: AccessTeam[], permissions: AccessPermission[] }} */
function seedAccess() {
  const permissions = defaultPermissions.map((p) => ({ ...p }))
  const roles = [
    {
      id: 1,
      name: 'Admin',
      description: 'Akses penuh ke seluruh modul dan konfigurasi sistem.',
      permissions: allPermissions(permissions, Object.fromEntries(permissions.map((p) => [p.key, true]))),
    },
    {
      id: 2,
      name: 'Manager',
      description: 'Mengawasi operasional dan registry.',
      permissions: allPermissions(permissions, {
        view_monitoring: true,
        manage_tasks: true,
        manage_registry: true,
        view_activity_log: true,
        manage_teams: true,
        export_data: true,
      }),
    },
    {
      id: 3,
      name: 'PM',
      description: 'Project manager untuk task dan dashboard.',
      permissions: allPermissions(permissions, {
        view_monitoring: true,
        manage_tasks: true,
        view_activity_log: true,
      }),
    },
    {
      id: 4,
      name: 'Teknis',
      description: 'Mengerjakan task dan memperbarui status.',
      permissions: allPermissions(permissions, {
        view_monitoring: true,
        manage_tasks: true,
        view_activity_log: true,
      }),
    },
  ]

  const teams = [
    {
      id: 1,
      name: 'GBO Analytics',
      unit: 'GBO',
      description: 'Tim analitik untuk dashboard GBO dan SLA regional.',
      lead_id: 2,
      member_ids: [1, 2, 4, 5, 8, 10],
      dashboards: ['GBO Dashboard', 'CX Dashboard'],
      created_at: '2026-06-10 09:00:00',
    },
    {
      id: 2,
      name: 'FinSight Ops',
      unit: 'Finance',
      description: 'Operasional FinSight dan laporan keuangan.',
      lead_id: 3,
      member_ids: [3, 5, 6, 11],
      dashboards: ['FinSight'],
      created_at: '2026-06-12 11:30:00',
    },
    {
      id: 3,
      name: 'Platform EDM',
      unit: 'EDM Core',
      description: 'Tim inti monitoring, TRAXIS, dan GARD.',
      lead_id: 1,
      member_ids: [1, 7, 8, 9],
      dashboards: ['TRAXIS', 'GARD', 'EDM Core Monitor'],
      created_at: '2026-08-01 10:00:00',
    },
  ]

  const users = [
    {
      id: 1,
      name: 'Farras',
      email: 'farras@edm.local',
      role_id: 1,
      unit: 'EDM Core',
      team_ids: [1, 3],
      status: 'active',
      created_at: '2026-05-01 08:00:00',
    },
    {
      id: 2,
      name: 'Adhi Prasetio',
      email: 'adhi.prasetio@edm.local',
      role_id: 2,
      unit: 'GBO',
      team_ids: [1],
      status: 'active',
      created_at: '2026-05-12 09:30:00',
    },
    {
      id: 3,
      name: 'Atha Dwira',
      email: 'atha.dwira@edm.local',
      role_id: 2,
      unit: 'Finance',
      team_ids: [2],
      status: 'active',
      created_at: '2026-05-20 10:00:00',
    },
    {
      id: 4,
      name: 'Asep Wahyudi',
      email: 'asep.wahyudi@edm.local',
      role_id: 4,
      unit: 'GBO',
      team_ids: [1],
      status: 'active',
      created_at: '2026-06-02 11:15:00',
    },
    {
      id: 5,
      name: 'Alamsyah Putra',
      email: 'alamsyah.putra@edm.local',
      role_id: 3,
      unit: 'GBO',
      team_ids: [1, 2],
      status: 'active',
      created_at: '2026-06-08 13:40:00',
    },
    {
      id: 6,
      name: 'Panji Pujianto',
      email: 'panji.pujianto@edm.local',
      role_id: 4,
      unit: 'Finance',
      team_ids: [2],
      status: 'active',
      created_at: '2026-06-18 15:00:00',
    },
    {
      id: 7,
      name: 'Maggie Arsyad',
      email: 'maggie.arsyad@edm.local',
      role_id: 4,
      unit: 'Technology',
      team_ids: [3],
      status: 'active',
      created_at: '2026-07-01 09:00:00',
    },
    {
      id: 8,
      name: 'Farras Al-Risyad',
      email: 'farras.al-risyad@edm.local',
      role_id: 4,
      unit: 'EDM Core',
      team_ids: [1, 3],
      status: 'active',
      created_at: '2026-07-10 10:30:00',
    },
    {
      id: 9,
      name: 'Lifi',
      email: 'lifi@edm.local',
      role_id: 4,
      unit: 'Technology',
      team_ids: [3],
      status: 'active',
      created_at: '2026-08-04 09:20:00',
    },
    {
      id: 10,
      name: 'Mahdi',
      email: 'mahdi@edm.local',
      role_id: 4,
      unit: 'GBO',
      team_ids: [1],
      status: 'active',
      created_at: '2026-08-11 10:00:00',
    },
    {
      id: 11,
      name: 'Alfiv',
      email: 'alfiv@edm.local',
      role_id: 4,
      unit: 'Finance',
      team_ids: [2],
      status: 'active',
      created_at: '2026-08-18 11:10:00',
    },
  ]

  return { users, roles, teams, permissions }
}

function loadAccess() {
  if (typeof localStorage === 'undefined') return seedAccess()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedAccess()
    const parsed = JSON.parse(raw)
    if (!parsed?.users?.length || !parsed?.roles?.length || !parsed?.teams?.length) return seedAccess()
    if (!Array.isArray(parsed.permissions)) parsed.permissions = defaultPermissions.map((p) => ({ ...p }))
    return parsed
  } catch {
    return seedAccess()
  }
}

const initial = loadAccess()

export const accessStore = $state({
  /** @type {AccessUser[]} */
  users: initial.users,
  /** @type {AccessRole[]} */
  roles: initial.roles,
  /** @type {AccessTeam[]} */
  teams: initial.teams,
  /** @type {AccessPermission[]} */
  permissions: initial.permissions,
})

function persist() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      users: accessStore.users,
      roles: accessStore.roles,
      teams: accessStore.teams,
      permissions: accessStore.permissions,
    }),
  )
}

/** @param {number} id */
export function getUser(id) {
  return accessStore.users.find((u) => u.id === Number(id)) || null
}

/** @param {number} id */
export function getRole(id) {
  return accessStore.roles.find((r) => r.id === Number(id)) || null
}

/** @param {number} id */
export function getTeam(id) {
  return accessStore.teams.find((t) => t.id === Number(id)) || null
}

/** @param {number} roleId */
export function roleLabel(roleId) {
  return getRole(roleId)?.name || '—'
}

/** @param {number} userId */
export function userLabel(userId) {
  return getUser(userId)?.name || '—'
}

/** @param {number[]} teamIds */
export function teamLabels(teamIds) {
  return teamIds.map((id) => getTeam(id)?.name).filter(Boolean)
}

export function roleOptions() {
  return accessStore.roles.map((r) => ({ value: r.id, label: r.name }))
}

export function teamOptions() {
  return accessStore.teams.map((t) => ({ value: t.id, label: t.name, unit: t.unit }))
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
  const role = filters.role ? Number(filters.role) : 0
  const team = filters.team ? Number(filters.team) : 0
  const unit = (filters.unit || '').trim()
  const status = (filters.status || '').trim()
  const q = (filters.q || '').trim().toLowerCase()

  return accessStore.users.filter((u) => {
    if (role && u.role_id !== role) return false
    if (unit && u.unit !== unit) return false
    if (team && !u.team_ids.includes(team)) return false
    if (status && u.status !== status) return false
    if (q) {
      const hay = `${u.name} ${u.email} ${roleLabel(u.role_id)} ${u.unit} ${teamLabels(u.team_ids).join(' ')}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
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
 *   email: string,
 *   role_id: number,
 *   unit: string,
 *   team_ids: number[],
 *   status?: UserStatus,
 * }} payload
 */
export function createUser(payload) {
  const nextId = accessStore.users.reduce((max, u) => Math.max(max, u.id), 0) + 1
  const user = {
    id: nextId,
    name: payload.name.trim(),
    email: payload.email.trim(),
    role_id: payload.role_id,
    unit: payload.unit,
    team_ids: payload.team_ids,
    status: payload.status || 'active',
    created_at: nowStamp(),
  }
  accessStore.users = [...accessStore.users, user]
  persist()
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
export function createTeam(payload) {
  const nextId = accessStore.teams.reduce((max, t) => Math.max(max, t.id), 0) + 1
  const team = {
    id: nextId,
    name: payload.name.trim(),
    unit: payload.unit,
    description: (payload.description || '').trim(),
    lead_id: payload.lead_id,
    member_ids: payload.member_ids,
    dashboards: payload.dashboards,
    created_at: nowStamp(),
  }
  accessStore.teams = [...accessStore.teams, team]
  persist()
  return team
}

/**
 * @param {{
 *   name: string,
 *   description?: string,
 *   permissions?: Record<string, boolean>,
 * }} payload
 */
export function createRole(payload) {
  const nextId = accessStore.roles.reduce((max, r) => Math.max(max, r.id), 0) + 1
  const role = {
    id: nextId,
    name: payload.name.trim(),
    description: (payload.description || '').trim(),
    permissions: allPermissions(accessStore.permissions, payload.permissions || {}),
  }
  accessStore.roles = [...accessStore.roles, role]
  persist()
  return role
}

/**
 * @param {number} roleId
 * @param {{ name: string, description?: string, permissions?: Record<string, boolean> }} payload
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function updateRole(roleId, payload) {
  const role = getRole(roleId)
  if (!role) return { ok: false, reason: 'Role tidak ditemukan' }
  const name = payload.name.trim()
  if (!name) return { ok: false, reason: 'Nama role wajib diisi' }
  if (accessStore.roles.some((r) => r.id !== roleId && r.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, reason: 'Nama role sudah dipakai' }
  }
  accessStore.roles = accessStore.roles.map((r) =>
    r.id === roleId
      ? {
          ...r,
          name,
          description: (payload.description || '').trim(),
          permissions: payload.permissions
            ? allPermissions(accessStore.permissions, payload.permissions)
            : r.permissions,
        }
      : r,
  )
  persist()
  return { ok: true }
}

/** @param {number} roleId @param {string} permKey @param {boolean} value */
export function setRolePermission(roleId, permKey, value) {
  const role = getRole(roleId)
  if (!role) return false
  role.permissions = { ...role.permissions, [permKey]: value }
  accessStore.roles = [...accessStore.roles]
  persist()
  return true
}

/**
 * @param {number} roleId
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function deleteRole(roleId) {
  const role = getRole(roleId)
  if (!role) return { ok: false, reason: 'Role tidak ditemukan' }
  const used = countUsersInRole(roleId)
  if (used > 0) {
    return { ok: false, reason: `Role masih dipakai ${used} user. Pindahkan user ke role lain dulu.` }
  }
  if (accessStore.roles.length <= 1) return { ok: false, reason: 'Minimal harus ada satu role' }
  accessStore.roles = accessStore.roles.filter((r) => r.id !== roleId)
  persist()
  return { ok: true }
}

/** @param {string} label */
function slugKey(label) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * @param {{ label: string, group?: string }} payload
 * @returns {{ ok: true, permission: AccessPermission } | { ok: false, reason: string }}
 */
export function createPermission(payload) {
  const label = payload.label.trim()
  if (!label) return { ok: false, reason: 'Nama permission wajib diisi' }
  if (accessStore.permissions.some((p) => p.label.toLowerCase() === label.toLowerCase())) {
    return { ok: false, reason: 'Nama permission sudah dipakai' }
  }
  const base = slugKey(label) || 'permission'
  let key = base
  for (let n = 2; accessStore.permissions.some((p) => p.key === key); n++) key = `${base}_${n}`
  const permission = { key, label, group: (payload.group || '').trim() || 'Lainnya' }
  accessStore.permissions = [...accessStore.permissions, permission]
  accessStore.roles = accessStore.roles.map((r) => ({ ...r, permissions: { ...r.permissions, [key]: false } }))
  persist()
  return { ok: true, permission }
}

/** @param {string} key */
export function deletePermission(key) {
  if (!accessStore.permissions.some((p) => p.key === key)) return false
  accessStore.permissions = accessStore.permissions.filter((p) => p.key !== key)
  accessStore.roles = accessStore.roles.map((r) => {
    const { [key]: _removed, ...rest } = r.permissions
    return { ...r, permissions: rest }
  })
  persist()
  return true
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
