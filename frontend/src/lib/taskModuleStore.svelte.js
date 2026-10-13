import { api } from './api.js'
import { registryStore } from './registryStore.svelte.js'
import { accessStore } from './accessStore.svelte.js'

/** @typedef {'backlog' | 'development' | 'testing' | 'uat' | 'to_production' | 'selesai'} TaskWorkflow */
/** @typedef {'pending' | 'revision' | 'approved'} ApprovalState */
/** @typedef {'manager' | 'pm' | 'teknis' | 'viewer'} UserRole */
/** @typedef {'approval_request' | 'approved' | 'revision' | 'comment' | 'move_request' | 'move_approved' | 'move_rejected'} NotifType */

/**
 * @typedef {Object} EvidenceFile
 * @property {File} file
 * @property {string} name
 * @property {string} mime
 * @property {number} size
 * @property {string} previewUrl Local blob: URL for previewing before upload (revoke when done).
 */

/**
 * @typedef {Object} TaskEvidence
 * @property {number} id
 * @property {string} at
 * @property {string} actor
 * @property {'move_request' | 'pm_approve' | 'pm_return' | 'comment'} kind
 * @property {string} name
 * @property {string} mime
 * @property {number} size
 * @property {string} file_url
 * @property {string} note
 */

/**
 * @typedef {Object} StatusMoveRequest
 * @property {TaskWorkflow} from
 * @property {TaskWorkflow} to
 * @property {string} requested_by
 * @property {string} [note]
 * @property {string} at
 * @property {number | null} [evidence_id]
 */

/**
 * @typedef {Object} TaskActivity
 * @property {number} id
 * @property {string} at
 * @property {string} actor
 * @property {string} action
 * @property {number | null} [evidence_id]
 */

/**
 * @typedef {Object} TaskComment
 * @property {number} id
 * @property {string} at
 * @property {string} actor
 * @property {string} body
 * @property {number | null} [evidence_id]
 */

/**
 * @typedef {Object} ModuleTask
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} dashboard
 * @property {number | null} requirement_id
 * @property {TaskWorkflow} status
 * @property {ApprovalState} approval_state
 * @property {string} pic
 * @property {string} assignee
 * @property {string} created_by
 * @property {string} deadline
 * @property {string} created_at
 * @property {string} updated_at
 * @property {StatusMoveRequest | null} status_move
 * @property {TaskComment[]} comments
 * @property {TaskActivity[]} activity
 * @property {TaskEvidence[]} evidences
 */

/**
 * @typedef {Object} AppNotification
 * @property {number} id
 * @property {string} at
 * @property {NotifType} type
 * @property {string} title
 * @property {string} body
 * @property {number | null} taskId
 * @property {string} dashboard
 * @property {boolean} read
 */

/**
 * @typedef {Object} SessionUser
 * @property {string} id
 * @property {string} name
 * @property {UserRole} role
 * @property {string} label
 */

/** Placeholder until the real session resolves via syncSessionFromAuth(). @type {SessionUser} */
const EMPTY_SESSION = { id: '', name: '', role: 'viewer', label: '', permissions: [] }

export const defaultDashboards = [
  'GBO Dashboard',
  'FinSight',
  'CX Dashboard',
  'TRAXIS',
  'GARD',
  'EDM Core Monitor',
]

function loadBoardDashboard() {
  if (typeof localStorage === 'undefined') return ''
  try {
    return localStorage.getItem('edm-fe-task-board-dashboard') || ''
  } catch {
    return ''
  }
}

export const taskModuleStore = $state({
  /** @type {ModuleTask[]} */
  items: [],
  /** @type {AppNotification[]} */
  notifications: [],
  /** @type {SessionUser} */
  session: EMPTY_SESSION,
  lastDetailId: /** @type {string | null} */ (null),
  boardDashboard: loadBoardDashboard(),
  /** @type {'kanban' | 'inbox'} */
  boardTab: 'kanban',
  loading: false,
  /** @type {string | null} */
  error: null,
})

export async function loadModuleTasksFromApi() {
  taskModuleStore.loading = true
  taskModuleStore.error = null
  try {
    taskModuleStore.items = await api.get('/api/module-tasks')
  } catch (e) {
    taskModuleStore.error = e instanceof Error ? e.message : String(e)
  } finally {
    taskModuleStore.loading = false
  }
}

/**
 * Ganti/sisipkan satu task di state lokal, dipakai setelah aksi (create/update/
 * move/approve/comment/...) supaya tidak perlu reload seluruh board dari API.
 * @param {ModuleTask | null | undefined} task
 */
function applyTaskUpdate(task) {
  if (!task) return
  const idx = taskModuleStore.items.findIndex((t) => t.id === task.id)
  if (idx >= 0) {
    const next = [...taskModuleStore.items]
    next[idx] = task
    taskModuleStore.items = next
  } else {
    taskModuleStore.items = [...taskModuleStore.items, task]
  }
}

/**
 * List endpoint ringan tidak bawa activity/comments/evidences (baseShape saja).
 * Dipanggil dari halaman detail supaya Journey task/Riwayat benar-benar terisi.
 * @param {number} id
 */
export async function loadModuleTaskDetail(id) {
  try {
    const detail = await api.get(`/api/module-tasks/${id}`)
    applyTaskUpdate(detail)
    return detail
  } catch {
    return null
  }
}

export async function loadNotificationsFromApi() {
  try {
    const data = await api.get('/api/notifications')
    taskModuleStore.notifications = data.items
  } catch {
    /* non-fatal */
  }
}

function persistBoardDashboard(name) {
  if (taskModuleStore.boardDashboard === name) return
  taskModuleStore.boardDashboard = name
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem('edm-fe-task-board-dashboard', name)
  } catch {
    /* ignore */
  }
}

export function currentUserName() {
  return taskModuleStore.session.name
}

export function currentUserRole() {
  return taskModuleStore.session.role
}

/**
 * Keeps taskModuleStore.session in sync with the real logged-in user from
 * authStore.svelte.js (called from there on login/logout/boot), so every
 * existing consumer of taskModuleStore.session keeps working unchanged.
 * @param {import('./authStore.svelte.js').AuthUser | null} authUser
 */
export function syncSessionFromAuth(authUser) {
  taskModuleStore.session = authUser
    ? {
        id: String(authUser.id),
        name: authUser.name,
        role: authUser.functional_role,
        label: authUser.role_name,
        permissions: authUser.permissions || [],
      }
    : EMPTY_SESSION
}

/** @param {string} dashboard */
export function pmOfDashboard(dashboard) {
  return registryStore.items.find((d) => d.name === dashboard)?.pm || ''
}

/** @deprecated use pmOfDashboard */
export const dashboardPicMap = undefined

/** @param {string} dashboard */
export function isCurrentUserPmOf(dashboard) {
  const session = taskModuleStore.session
  return session.role === 'pm' && pmOfDashboard(dashboard) === session.name
}

/** @deprecated use isCurrentUserPmOf */
export function isCurrentUserPicOf(dashboard) {
  return isCurrentUserPmOf(dashboard)
}

/** Buat, ubah, hapus, dan ganti status dashboard mengikuti permission "manage_registry". */
export function canCreateDashboard() {
  return (taskModuleStore.session.permissions || []).includes('manage_registry')
}

/** Tombol Tambah Field di Registry mengikuti permission "add_field" dari role. */
export function canAddField() {
  return (taskModuleStore.session.permissions || []).includes('add_field')
}

/** Tombol Edit pada field mengikuti permission "edit_field". */
export function canEditField() {
  return (taskModuleStore.session.permissions || []).includes('edit_field')
}

/** Tombol Hapus pada field mengikuti permission "delete_field". */
export function canDeleteField() {
  return (taskModuleStore.session.permissions || []).includes('delete_field')
}

/** @param {string} [dashboard] */
export function canManageRequirements(dashboard = '') {
  const role = currentUserRole()
  if (role !== 'pm') return false
  if (!dashboard) return true
  return isCurrentUserPmOf(dashboard)
}

/** Tambah requirement baru (termasuk tambah versi) mengikuti permission "create_requirement". */
export function canCreateRequirement() {
  return (taskModuleStore.session.permissions || []).includes('create_requirement')
}

/** Tambah assignee ke requirement yang sudah ada mengikuti permission "add_assignee". */
export function canAddAssignee() {
  return (taskModuleStore.session.permissions || []).includes('add_assignee')
}

/** Tombol Tambah Task dan izin buat task mengikuti permission "create_task" dari role. */
export function canCreateTask() {
  return (taskModuleStore.session.permissions || []).includes('create_task')
}

/** Board interaction: PM full move, teknis request only */
export function canUpdateBoard() {
  const role = currentUserRole()
  return role === 'pm' || role === 'teknis'
}

export function canCommentOnTask() {
  const role = currentUserRole()
  return role === 'pm' || role === 'teknis'
}

/** @param {string} id */
export function getModuleTask(id) {
  return taskModuleStore.items.find((t) => String(t.id) === String(id)) || null
}

/**
 * @param {{
 *   dashboard?: string,
 *   status?: string,
 *   pic?: string,
 *   overdue?: string,
 *   aktif?: string,
 *   q?: string,
 *   approval?: string,
 *   requirement_id?: number | string,
 * }} [filters]
 */
export function listModuleTasks({
  dashboard = '',
  status = '',
  pic = '',
  overdue = '',
  aktif = '',
  q = '',
  approval = '',
  requirement_id = '',
} = {}) {
  let items = [...taskModuleStore.items]
  const today = new Date().toISOString().slice(0, 10)

  if (dashboard) items = items.filter((t) => t.dashboard === dashboard)
  if (status) items = items.filter((t) => t.status === status)
  if (approval) items = items.filter((t) => t.approval_state === approval)
  if (requirement_id !== '' && requirement_id != null) {
    items = items.filter((t) => t.requirement_id === requirement_id)
  }
  if (aktif === 'yes') items = items.filter((t) => t.status !== 'selesai')
  if (pic) items = items.filter((t) => t.assignee === pic || t.pic === pic)
  if (overdue === 'yes') {
    items = items.filter((t) => t.status !== 'selesai' && t.deadline < today)
  } else if (overdue === 'no') {
    items = items.filter((t) => t.status === 'selesai' || t.deadline >= today)
  }
  if (q) {
    const needle = q.toLowerCase()
    items = items.filter((t) =>
      `${t.title} ${t.description} ${t.dashboard} ${t.assignee} ${t.pic}`.toLowerCase().includes(needle),
    )
  }

  return items.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

/** @param {TaskWorkflow | string} status */
export function workflowProgressSolid(status) {
  switch (status) {
    case 'backlog':
      return 0.22
    case 'development':
      return 0.4
    case 'testing':
      return 0.55
    case 'uat':
      return 0.7
    case 'to_production':
      return 0.85
    case 'selesai':
      return 1
    default:
      return 0.35
  }
}

/** Pipeline columns — task yang masih menunggu approval owner requirement (pending/revision) belum masuk board */
/** @param {TaskWorkflow} status @param {string} [dashboard] */
export function tasksByColumn(status, dashboard = '') {
  return taskModuleStore.items
    .filter(
      (t) =>
        t.approval_state === 'approved' &&
        t.status === status &&
        (!dashboard || t.dashboard === dashboard),
    )
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

/** Inbox: pending status-move requests (dan legacy create pending jika ada) */
/** @param {string} [dashboard] */
export function listInboxTasks(dashboard = '') {
  return taskModuleStore.items
    .filter((t) => {
      const hasMove = Boolean(t.status_move)
      const legacyPending = t.approval_state === 'pending' || t.approval_state === 'revision'
      if (!hasMove && !legacyPending) return false
      if (dashboard && t.dashboard !== dashboard) return false
      return true
    })
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

/** @param {string} [dashboard] */
export function inboxNeedsMyAction(dashboard = '') {
  return listInboxTasks(dashboard).filter((t) => {
    if (t.status_move) return isCurrentUserPmOf(t.dashboard)
    if (t.approval_state === 'pending') return t.requirement_owner === currentUserName()
    return false
  })
}

/** @param {string} name */
export function setBoardDashboard(name) {
  persistBoardDashboard(name)
}

/** @param {'kanban' | 'inbox'} tab */
export function setBoardTab(tab) {
  taskModuleStore.boardTab = tab
}

export function openBoardInbox() {
  taskModuleStore.boardTab = 'inbox'
}

export function resolveBoardDashboard() {
  const options = boardDashboardOptions()
  if (!options.length) return ''
  if (taskModuleStore.boardDashboard && options.includes(taskModuleStore.boardDashboard)) {
    return taskModuleStore.boardDashboard
  }
  return options[0]
}

const EVIDENCE_MAX_BYTES = 10 * 1024 * 1024

/**
 * Validates a file picked for evidence/attachment before upload.
 * The actual upload happens lazily when the surrounding action (move/approve/
 * reject/comment) is submitted — see uploadEvidenceIfPresent().
 * @param {File} file @returns {Promise<EvidenceFile>}
 */
export function readEvidenceFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('File is missing'))
      return
    }
    if (file.size > EVIDENCE_MAX_BYTES) {
      reject(new Error('File maksimal 10MB'))
      return
    }
    resolve({
      file,
      name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      previewUrl: URL.createObjectURL(file),
    })
  })
}

/** @param {number} taskId @param {EvidenceFile | null | undefined} evidence @param {string} [note] */
async function uploadEvidenceIfPresent(taskId, evidence, note = '') {
  if (!evidence?.file) return null
  const form = new FormData()
  form.append('task_id', String(taskId))
  form.append('note', note || '')
  form.append('file', evidence.file)
  const result = await api.postForm('/api/evidences', form)
  return result.id
}

/**
 * PM creates task under a requirement → langsung Backlog (approved).
 * Satu task sekarang bisa punya banyak assignee sekaligus (lewat `assignees`),
 * bukan satu task terpisah per orang lagi.
 * @param {{
 *   title: string,
 *   description?: string,
 *   dashboard: string,
 *   requirement_id: number,
 *   status?: TaskWorkflow,
 *   pic?: string,
 *   assignee?: string,
 *   assignees?: string[],
 *   deadline: string,
 * }} payload
 */
export async function createModuleTask(payload) {
  const title = (payload.title || '').trim()
  if (!title) return null
  const dashboard = (payload.dashboard || '').trim() || 'General'
  if (!canCreateTask()) {
    throw new Error('Anda tidak memiliki permission untuk membuat task (create_task)')
  }

  const assignees = Array.isArray(payload.assignees) && payload.assignees.length
    ? payload.assignees.filter(Boolean)
    : [(payload.assignee || payload.pic || '').trim()].filter(Boolean)

  const created = await api.post('/api/module-tasks', {
    title,
    description: (payload.description || '').trim(),
    dashboard,
    requirement_id: payload.requirement_id,
    assignees,
    deadline: payload.deadline || '',
    status: payload.status || 'backlog',
  })
  applyTaskUpdate(created)
  return created
}

/**
 * @param {number} id
 * @param {Partial<Pick<ModuleTask, 'title' | 'description' | 'deadline' | 'requirement_id'>> & { pic?: string, assignee?: string }} patch
 */
export async function updateModuleTask(id, patch) {
  try {
    const updated = await api.put(`/api/module-tasks/${id}`, {
      ...patch,
      assignee: patch.assignee ?? patch.pic,
    })
    applyTaskUpdate(updated)
    return true
  } catch {
    return false
  }
}

/**
 * PM: langsung pindah. Teknis: buat status_move request.
 * @param {number} id
 * @param {TaskWorkflow} status
 * @param {{ note?: string, evidence?: EvidenceFile | null }} [opts]
 * @returns {Promise<'moved' | 'requested' | false>}
 */
export async function moveModuleTask(id, status, opts = {}) {
  try {
    const evidenceId = await uploadEvidenceIfPresent(id, opts.evidence, opts.note)
    const result = await api.post(`/api/module-tasks/${id}/move`, {
      status, note: opts.note || '', evidence_id: evidenceId,
    })
    applyTaskUpdate(result.task)
    await loadNotificationsFromApi()
    return result.result
  } catch {
    return false
  }
}

/** @param {number} id @param {string} note @param {EvidenceFile | null} [evidence] */
export async function approveStatusMove(id, note, evidence) {
  try {
    const evidenceId = await uploadEvidenceIfPresent(id, evidence, note)
    const updated = await api.post(`/api/module-tasks/${id}/approve-move`, { note: note || '', evidence_id: evidenceId })
    applyTaskUpdate(updated)
    await loadNotificationsFromApi()
    return true
  } catch {
    return false
  }
}

/** @param {number} id @param {string} note @param {EvidenceFile | null} [evidence] */
export async function rejectStatusMove(id, note, evidence) {
  try {
    const evidenceId = await uploadEvidenceIfPresent(id, evidence, note)
    const updated = await api.post(`/api/module-tasks/${id}/reject-move`, { note: note || '', evidence_id: evidenceId })
    applyTaskUpdate(updated)
    await loadNotificationsFromApi()
    return true
  } catch {
    return false
  }
}

/**
 * Task creation approval flow: task yang dibuat bukan oleh owner requirement
 * (misal assignee) menunggu approval owner dulu sebelum masuk Backlog/board.
 * @param {number} id @param {string} [note] @param {EvidenceFile | null} [evidence]
 */
export async function approveModuleTask(id, note, evidence) {
  try {
    const evidenceId = await uploadEvidenceIfPresent(id, evidence, note)
    const result = await api.post(`/api/module-tasks/${id}/approve`, { note: note || '', evidence_id: evidenceId })
    applyTaskUpdate(result.task)
    await loadNotificationsFromApi()
    return true
  } catch {
    return false
  }
}

/** Owner requirement minta revisi task yang baru dibuat, belum masuk Backlog. @param {number} id @param {string} [note] @param {EvidenceFile | null} [evidence] */
export async function requestRevisionModuleTask(id, note, evidence) {
  try {
    const evidenceId = await uploadEvidenceIfPresent(id, evidence, note)
    const result = await api.post(`/api/module-tasks/${id}/request-revision`, { note: note || '', evidence_id: evidenceId })
    applyTaskUpdate(result.task)
    await loadNotificationsFromApi()
    return true
  } catch {
    return false
  }
}

/** Pembuat (atau owner requirement) mengajukan ulang task yang diminta revisi. @param {number} id */
export async function resubmitModuleTask(id) {
  try {
    const result = await api.post(`/api/module-tasks/${id}/resubmit`, {})
    applyTaskUpdate(result.task)
    await loadNotificationsFromApi()
    return true
  } catch {
    return false
  }
}

/** @param {number} id @param {string} body @param {EvidenceFile | null} [evidence] */
export async function addTaskComment(id, body, evidence) {
  const clean = (body || '').trim()
  if (!clean && !evidence?.file) return false
  try {
    const evidenceId = await uploadEvidenceIfPresent(id, evidence)
    const updated = await api.post(`/api/module-tasks/${id}/comments`, { body: clean, evidence_id: evidenceId })
    applyTaskUpdate(updated)
    return true
  } catch {
    return false
  }
}

/**
 * Upload beberapa evidence/screenshot sekaligus (bukan cuma 1 file per aksi).
 * Tiap file dikirim lewat addTaskComment() satu-satu (backend hanya punya 1 slot evidence per komentar);
 * catatan hanya ditempel di file pertama supaya tidak ada baris komentar duplikat di panel Comments.
 * @param {number} id @param {EvidenceFile[]} files @param {string} [note]
 */
export async function addTaskEvidenceFiles(id, files, note = '') {
  if (!files?.length) return false
  let ok = true
  let first = true
  for (const file of files) {
    const result = await addTaskComment(id, first ? note : '', file)
    if (!result) ok = false
    first = false
  }
  return ok
}

/** @param {ModuleTask} task */
export function latestComment(task) {
  if (!task?.comments?.length) return null
  return task.comments[0]
}

/** @param {number} id */
export async function deleteModuleTask(id) {
  try {
    await api.del(`/api/module-tasks/${id}`)
    taskModuleStore.items = taskModuleStore.items.filter((t) => t.id !== id)
    return true
  } catch {
    return false
  }
}

/** @param {number} id */
export function rememberDetailId(id) {
  taskModuleStore.lastDetailId = id
}

export function myNotifications() {
  return taskModuleStore.notifications
}

export function unreadNotificationCount() {
  return taskModuleStore.notifications.filter((n) => !n.read).length
}

/** @param {number} id */
export async function markNotificationRead(id) {
  const row = taskModuleStore.notifications.find((n) => n.id === id)
  if (!row || row.read) return
  row.read = true
  taskModuleStore.notifications = [...taskModuleStore.notifications]
  try {
    await api.post(`/api/notifications/${id}/read`, {})
  } catch {
    /* non-fatal */
  }
}

export async function markAllNotificationsRead() {
  for (const n of taskModuleStore.notifications) n.read = true
  taskModuleStore.notifications = [...taskModuleStore.notifications]
  try {
    await api.post('/api/notifications/read-all', {})
  } catch {
    /* non-fatal */
  }
}

/**
 * Handle notif click: mark read, set dashboard/tab, return path
 * @param {AppNotification} notif
 */
export function openNotification(notif) {
  markNotificationRead(notif.id)
  if (notif.dashboard) setBoardDashboard(notif.dashboard)
  if (
    notif.type === 'approval_request' ||
    notif.type === 'revision' ||
    notif.type === 'move_request' ||
    notif.type === 'move_rejected'
  ) {
    setBoardTab('inbox')
    return '/tasks/board'
  }
  setBoardTab('kanban')
  return '/tasks/board'
}

export const workflowColumns = [
  { key: /** @type {TaskWorkflow} */ ('backlog'), label: 'Backlog' },
  { key: /** @type {TaskWorkflow} */ ('development'), label: 'Development' },
  { key: /** @type {TaskWorkflow} */ ('testing'), label: 'Testing' },
  { key: /** @type {TaskWorkflow} */ ('uat'), label: 'UAT' },
  { key: /** @type {TaskWorkflow} */ ('to_production'), label: 'to Production' },
  { key: /** @type {TaskWorkflow} */ ('selesai'), label: 'Done' },
]

export const workflowStatusColors = {
  backlog: '#94a3b8',
  development: '#065fc6',
  testing: '#7c6bc4',
  uat: '#e0a45a',
  to_production: '#e11d48',
  selesai: '#2f7a52',
}

/** @param {TaskWorkflow | string} status */
export function workflowStatusColor(status) {
  return workflowStatusColors[/** @type {keyof typeof workflowStatusColors} */ (status)] || '#94a3b8'
}

/** @param {TaskWorkflow | string} status */
export function workflowLabel(status) {
  const found = workflowColumns.find((c) => c.key === status)
  return found ? found.label : status
}

/** Posisi status di alur kanban, 0-100% — cermin dari percentForStatus() di backend. @param {TaskWorkflow | string} status */
export function progressForStatus(status) {
  const idx = workflowColumns.findIndex((c) => c.key === status)
  if (idx < 0 || workflowColumns.length < 2) return 0
  return Math.round((idx / (workflowColumns.length - 1)) * 100)
}

/** Kebalikan progressForStatus(): persentase slider → kolom kanban terdekat. @param {number} pct */
export function statusForProgress(pct) {
  const n = workflowColumns.length
  const idx = Math.round((pct / 100) * (n - 1))
  return workflowColumns[Math.max(0, Math.min(n - 1, idx))].key
}

/** @param {ApprovalState | string} state */
export function approvalLabel(state) {
  switch (state) {
    case 'pending':
      return 'Menunggu approval'
    case 'revision':
      return 'Needs revision'
    case 'approved':
      return 'Approved'
    default:
      return state
  }
}

export function dashboardOptions() {
  return [...new Set([...registryStore.items.map((d) => d.name), ...taskModuleStore.items.map((t) => t.dashboard)])].sort()
}

export function boardDashboardOptions() {
  return [
    ...new Set([...defaultDashboards, ...registryStore.items.map((d) => d.name), ...taskModuleStore.items.map((t) => t.dashboard)]),
  ].sort()
}

/** Real Teknis-role user names from accessStore (was a hardcoded demo list). */
export function teknisAssignees() {
  const teknisRole = accessStore.roles.find((r) => r.name === 'Teknis')
  if (!teknisRole) return []
  return accessStore.users.filter((u) => u.role_id === teknisRole.id).map((u) => u.name)
}

export function picOptions() {
  return [...new Set([...accessStore.users.map((u) => u.name), ...taskModuleStore.items.map((t) => t.assignee || t.pic)])].sort()
}

export function assigneeOptions() {
  return picOptions()
}

/** Real PM-role users from accessStore, plus any dashboard's resolved PM. */
export function pmOptions() {
  const pmRole = accessStore.roles.find((r) => r.name === 'PM')
  const pmUsers = pmRole ? accessStore.users.filter((u) => u.role_id === pmRole.id).map((u) => u.name) : []

  return [...new Set([...registryStore.items.map((d) => d.pm).filter(Boolean), ...pmUsers])].sort()
}

/** @param {ModuleTask} task */
export function isOverdue(task) {
  return task.status !== 'selesai' && task.deadline < new Date().toISOString().slice(0, 10)
}

/** @param {number | null | undefined} requirementId */
export function tasksForRequirement(requirementId) {
  if (!requirementId) return []
  return taskModuleStore.items.filter((t) => t.requirement_id === requirementId)
}
