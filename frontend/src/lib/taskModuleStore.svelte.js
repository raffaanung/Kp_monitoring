/** @typedef {'backlog' | 'development' | 'testing' | 'uat' | 'to_production' | 'selesai'} TaskWorkflow */
/** @typedef {'pending' | 'revision' | 'approved'} ApprovalState */
/** @typedef {'manager' | 'pm' | 'teknis' | 'viewer'} UserRole */
/** @typedef {'approval_request' | 'approved' | 'revision' | 'comment' | 'move_request' | 'move_approved' | 'move_rejected'} NotifType */

/**
 * @typedef {Object} EvidenceFile
 * @property {string} name
 * @property {string} mime
 * @property {number} size
 * @property {string} data_url
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
 * @property {string} data_url
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
 * @property {string} [approval_note]
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
 * @property {string} toUser
 * @property {boolean} read
 */

/**
 * @typedef {Object} SessionUser
 * @property {string} id
 * @property {string} name
 * @property {UserRole} role
 * @property {string} label
 */

const STORAGE_KEY = 'edm-fe-module-tasks-v6'
const NOTIF_KEY = 'edm-fe-module-notifs-v3'
const SESSION_KEY = 'edm-fe-session-persona-v3'
const PM_MAP_KEY = 'edm-fe-dashboard-pm-v2'

/** PM resmi per dashboard (selaras Registry.pm) */
export let dashboardPmMap = {
  'GBO Dashboard': 'Alamsyah Putra',
  FinSight: 'Alamsyah Putra',
  'CX Dashboard': 'Alamsyah Putra',
  TRAXIS: 'Alamsyah Putra',
  GARD: 'Alamsyah Putra',
  'EDM Core Monitor': 'Alamsyah Putra',
}

/** @deprecated use dashboardPmMap */
export const dashboardPicMap = dashboardPmMap

/** Demo teknis assignees */
export const teknisAssignees = [
  'Asep Wahyudi',
  'Panji Pujianto',
  'Maggie Arsyad',
  'Farras Al-Risyad',
  'Lifi',
  'Mahdi',
  'Alfiv',
]

/** Demo personas — switch di chrome untuk presentasi */
export const sessionPersonas = [
  {
    id: 'admin-farras',
    name: 'Farras',
    role: /** @type {UserRole} */ ('manager'),
    label: 'Admin',
  },
  {
    id: 'manager-adhi',
    name: 'Adhi Prasetio',
    role: /** @type {UserRole} */ ('manager'),
    label: 'Manager',
  },
  {
    id: 'manager-atha',
    name: 'Atha Dwira',
    role: /** @type {UserRole} */ ('manager'),
    label: 'Manager',
  },
  {
    id: 'pm-alamsyah',
    name: 'Alamsyah Putra',
    role: /** @type {UserRole} */ ('pm'),
    label: 'PM',
  },
  {
    id: 'teknis-asep',
    name: 'Asep Wahyudi',
    role: /** @type {UserRole} */ ('teknis'),
    label: 'Teknis',
  },
  {
    id: 'teknis-panji',
    name: 'Panji Pujianto',
    role: /** @type {UserRole} */ ('teknis'),
    label: 'Teknis',
  },
  {
    id: 'teknis-maggie',
    name: 'Maggie Arsyad',
    role: /** @type {UserRole} */ ('teknis'),
    label: 'Teknis',
  },
  {
    id: 'teknis',
    name: 'Farras Al-Risyad',
    role: /** @type {UserRole} */ ('teknis'),
    label: 'Teknis',
  },
  {
    id: 'teknis-lifi',
    name: 'Lifi',
    role: /** @type {UserRole} */ ('teknis'),
    label: 'Teknis',
  },
  {
    id: 'teknis-mahdi',
    name: 'Mahdi',
    role: /** @type {UserRole} */ ('teknis'),
    label: 'Teknis',
  },
  {
    id: 'teknis-alfiv',
    name: 'Alfiv',
    role: /** @type {UserRole} */ ('teknis'),
    label: 'Teknis',
  },
]

export const defaultDashboards = [
  'GBO Dashboard',
  'FinSight',
  'CX Dashboard',
  'TRAXIS',
  'GARD',
  'EDM Core Monitor',
]

function nowStamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

function dateOnly(stamp = nowStamp()) {
  return stamp.slice(0, 10)
}

function loadPmMap() {
  if (typeof localStorage === 'undefined') return { ...dashboardPmMap }
  try {
    const raw = localStorage.getItem(PM_MAP_KEY)
    if (!raw) return { ...dashboardPmMap }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { ...dashboardPmMap }
    return { ...dashboardPmMap, ...parsed }
  } catch {
    return { ...dashboardPmMap }
  }
}

dashboardPmMap = loadPmMap()

function persistPmMap() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PM_MAP_KEY, JSON.stringify(dashboardPmMap))
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} dashboard
 * @param {string} pmName
 */
export function setDashboardPm(dashboard, pmName) {
  const name = (dashboard || '').trim()
  const pm = (pmName || '').trim()
  if (!name || !pm) return false
  dashboardPmMap = { ...dashboardPmMap, [name]: pm }
  persistPmMap()
  return true
}

/** @param {Partial<ModuleTask> & { id: number, title: string }} raw */
function normalizeTask(raw) {
  const assignee = raw.assignee || raw.pic || 'You'
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description || '',
    dashboard: raw.dashboard || 'General',
    requirement_id: raw.requirement_id ?? null,
    status: raw.status || 'backlog',
    approval_state: raw.approval_state || 'approved',
    pic: assignee,
    assignee,
    created_by: raw.created_by || assignee || 'System',
    deadline: raw.deadline || dateOnly(),
    created_at: raw.created_at || nowStamp(),
    updated_at: raw.updated_at || raw.created_at || nowStamp(),
    approval_note: raw.approval_note || '',
    status_move: raw.status_move || null,
    comments: Array.isArray(raw.comments) ? raw.comments : [],
    activity: Array.isArray(raw.activity) ? raw.activity : [],
    evidences: Array.isArray(raw.evidences) ? raw.evidences : [],
  }
}

export const EVIDENCE_MAX_BYTES = 900_000

/** @param {File} file @returns {Promise<EvidenceFile>} */
export function readEvidenceFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('File tidak ada'))
      return
    }
    if (file.size > EVIDENCE_MAX_BYTES) {
      reject(new Error('File maksimal 900 KB'))
      return
    }
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        data_url: String(reader.result || ''),
      })
    reader.onerror = () => reject(new Error('Gagal membaca file'))
    reader.readAsDataURL(file)
  })
}

/**
 * @param {ModuleTask} item
 * @param {'move_request' | 'pm_approve' | 'pm_return' | 'comment'} kind
 * @param {EvidenceFile | null | undefined} file
 * @param {string} [note]
 */
function pushEvidence(item, kind, file, note = '') {
  if (!file?.data_url) return null
  if (!Array.isArray(item.evidences)) item.evidences = []
  const nextId = item.evidences.reduce((max, e) => Math.max(max, e.id), 0) + 1
  /** @type {TaskEvidence} */
  const row = {
    id: nextId,
    at: nowStamp(),
    actor: currentUserName(),
    kind,
    name: file.name,
    mime: file.mime,
    size: file.size,
    data_url: file.data_url,
    note: (note || '').trim(),
  }
  item.evidences = [row, ...item.evidences]
  return row
}

/** @returns {ModuleTask[]} */
/**
 * Cuplikan heatmap palsu untuk presentasi. Bukan file asli.
 * @param {{ title: string, note: string, empty?: boolean, mark?: boolean }} spec
 */
function demoHeatmapShot(spec) {
  const cells = [
    ['Jakarta', '#2f7a52'],
    ['Jawa Barat', spec.empty ? '#d5dbe3' : '#e0a45a'],
    ['Jawa Tengah', '#2f7a52'],
    ['Jawa Timur', '#be123c'],
    ['Sumatera', '#e0a45a'],
    ['Kalimantan', '#2f7a52'],
  ]
  const boxes = cells
    .map((cell, i) => {
      const x = 36 + (i % 3) * 190
      const y = 92 + Math.floor(i / 3) * 100
      const label = spec.empty && cell[0] === 'Jawa Barat' ? 'kosong' : 'SLA'
      const ink = spec.empty && cell[0] === 'Jawa Barat' ? '#475569' : '#fff'
      return `<rect x="${x}" y="${y}" width="170" height="78" rx="12" fill="${cell[1]}"/><text x="${x + 16}" y="${y + 34}" font-family="sans-serif" font-size="15" font-weight="700" fill="${ink}">${cell[0]}</text><text x="${x + 16}" y="${y + 56}" font-family="sans-serif" font-size="12" fill="${ink}">${label}</text>`
    })
    .join('')
  const ring = spec.mark
    ? '<ellipse cx="311" cy="131" rx="98" ry="52" fill="none" stroke="#e11d48" stroke-width="4"/><text x="400" y="118" font-family="sans-serif" font-size="13" font-weight="700" fill="#be123c">perlu revisi</text>'
    : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#eef3f8"/><rect x="20" y="16" width="600" height="44" rx="10" fill="#fff"/><text x="36" y="44" font-family="sans-serif" font-size="16" font-weight="700" fill="#0f1b2e">${spec.title}</text><text x="36" y="332" font-family="sans-serif" font-size="13" fill="#5c6770">${spec.note}</text>${boxes}${ring}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** @param {number} id @param {string} at @param {string} actor @param {'move_request' | 'pm_approve' | 'pm_return' | 'comment'} kind @param {string} name @param {string} dataUrl @param {string} note */
function demoFile(id, at, actor, kind, name, dataUrl, note) {
  return {
    id,
    at,
    actor,
    kind,
    name,
    mime: 'image/svg+xml',
    size: dataUrl.length,
    data_url: dataUrl,
    note,
  }
}

function seedTasks() {
  const legendShot = demoHeatmapShot({
    title: 'SLA heatmap · legend sekarang',
    note: 'Legend tidak sama dengan widget SLA lain',
    empty: true,
  })
  const emptyShot = demoHeatmapShot({
    title: 'SLA heatmap · progres teknis',
    note: 'Sel Jawa Barat masih kosong',
    empty: true,
  })
  const revisiShot = demoHeatmapShot({
    title: 'SLA heatmap · catatan PM',
    note: 'Jawa Barat harus kuning, bukan abu-abu',
    empty: true,
    mark: true,
  })
  const fixedShot = demoHeatmapShot({
    title: 'SLA heatmap · setelah revisi',
    note: 'Jawa Barat sudah kuning, legend konsisten',
  })
  const siapShot = demoHeatmapShot({
    title: 'SLA heatmap · siap UAT',
    note: 'Bukti teknis sebelum pindah ke UAT',
  })

  return [
    normalizeTask({
      id: 1,
      title: 'SLA heatmap per region',
      description: 'Build heatmap widget for SLA breach by region on GBO.',
      dashboard: 'GBO Dashboard',
      requirement_id: 1,
      status: 'development',
      approval_state: 'approved',
      assignee: 'Farras Al-Risyad',
      created_by: 'Alamsyah Putra',
      deadline: '2026-09-18',
      created_at: '2026-09-01 09:00:00',
      updated_at: '2026-09-22 14:45:00',
      status_move: {
        from: 'development',
        to: 'uat',
        requested_by: 'Farras Al-Risyad',
        note: 'Revisi Jawa Barat sudah masuk. Legend disamakan dengan widget SLA lain.',
        at: '2026-09-22 14:45:00',
        evidence_id: 5,
      },
      evidences: [
        demoFile(1, '2026-09-12 10:00:00', 'Alamsyah Putra', 'comment', 'legend-tidak-konsisten.svg', legendShot, 'Legend masih beda'),
        demoFile(2, '2026-09-18 15:10:00', 'Farras Al-Risyad', 'comment', 'sel-jawa-barat-kosong.svg', emptyShot, 'Sel masih kosong'),
        demoFile(3, '2026-09-21 09:20:00', 'Alamsyah Putra', 'pm_return', 'revisi-jawa-barat.svg', revisiShot, 'Yang dilingkari masih salah'),
        demoFile(4, '2026-09-22 11:05:00', 'Farras Al-Risyad', 'comment', 'heatmap-setelah-revisi.svg', fixedShot, 'Sudah diperbaiki'),
        demoFile(5, '2026-09-22 14:45:00', 'Farras Al-Risyad', 'move_request', 'heatmap-siap-uat.svg', siapShot, 'Bukti siap UAT'),
      ],
      comments: [
        {
          id: 4,
          at: '2026-09-22 11:05:00',
          actor: 'Farras Al-Risyad',
          body: 'Sudah diperbaiki. Jawa Barat sekarang kuning dan legend mengikuti widget SLA lain.',
          evidence_id: 4,
        },
        {
          id: 3,
          at: '2026-09-21 09:20:00',
          actor: 'Alamsyah Putra',
          body: 'Bagian yang dilingkari masih salah. Sel Jawa Barat harus kuning (SLA perhatian), bukan abu-abu kosong.',
          evidence_id: 3,
        },
        {
          id: 2,
          at: '2026-09-18 15:10:00',
          actor: 'Farras Al-Risyad',
          body: 'Widget sudah dipasang. Legend saya samakan, tapi sel Jawa Barat masih kosong. Mohon cek lampirannya.',
          evidence_id: 2,
        },
        {
          id: 1,
          at: '2026-09-12 10:00:00',
          actor: 'Alamsyah Putra',
          body: 'Pastikan legend warna konsisten dengan widget SLA lain. Saya lampirkan tampilan yang sekarang masih beda.',
          evidence_id: 1,
        },
      ],
      activity: [
        {
          id: 6,
          at: '2026-09-22 14:45:00',
          actor: 'Farras Al-Risyad',
          action: 'Ajukan pindah Development → UAT',
          evidence_id: 5,
        },
        { id: 5, at: '2026-09-21 16:07:00', actor: 'Alamsyah Putra', action: 'Moved to Development' },
        { id: 4, at: '2026-09-19 11:00:00', actor: 'Alamsyah Putra', action: 'Moved to Testing' },
        { id: 3, at: '2026-09-12 11:20:00', actor: 'Alamsyah Putra', action: 'Moved to Development' },
        { id: 2, at: '2026-09-01 09:00:00', actor: 'Alamsyah Putra', action: 'Task dibuat dari requirement · Backlog' },
      ],
    }),
    normalizeTask({
      id: 2,
      title: 'Throughput vs target chart',
      description: 'Line chart comparing daily throughput against monthly target.',
      dashboard: 'GBO Dashboard',
      requirement_id: 1,
      status: 'testing',
      approval_state: 'approved',
      assignee: 'Farras Al-Risyad',
      created_by: 'Alamsyah Putra',
      deadline: '2026-09-16',
      created_at: '2026-08-28 10:00:00',
      updated_at: '2026-09-13 15:00:00',
      status_move: {
        from: 'testing',
        to: 'uat',
        requested_by: 'Farras Al-Risyad',
        note: 'Siap masuk UAT setelah smoke test.',
        at: '2026-09-14 09:30:00',
        evidence_id: 1,
      },
      evidences: [
        demoFile(
          1,
          '2026-09-14 09:30:00',
          'Farras Al-Risyad',
          'move_request',
          'throughput-smoke-test.svg',
          demoHeatmapShot({ title: 'Throughput vs target', note: 'Smoke test harian sudah hijau' }),
          'Smoke test',
        ),
      ],
      comments: [
        {
          id: 1,
          at: '2026-09-13 14:00:00',
          actor: 'Alamsyah Putra',
          body: 'Cek sumbu Y supaya skala target terbaca jelas.',
        },
      ],
      activity: [
        {
          id: 1,
          at: '2026-09-14 09:30:00',
          actor: 'Farras Al-Risyad',
          action: 'Ajukan pindah Testing → UAT',
          evidence_id: 1,
        },
        { id: 2, at: '2026-09-13 15:00:00', actor: 'Farras Al-Risyad', action: 'Moved to Testing' },
        { id: 3, at: '2026-08-28 10:00:00', actor: 'Alamsyah Putra', action: 'Task dibuat dari requirement · Backlog' },
      ],
    }),
    normalizeTask({
      id: 3,
      title: 'Aging bucket filter',
      description: 'Add aging buckets filter for invoice cards on FinSight.',
      dashboard: 'FinSight',
      requirement_id: 3,
      status: 'uat',
      approval_state: 'approved',
      assignee: 'Asep Wahyudi',
      created_by: 'Alamsyah Putra',
      deadline: '2026-09-12',
      created_at: '2026-08-20 08:30:00',
      updated_at: '2026-09-11 09:40:00',
      activity: [
        { id: 1, at: '2026-09-11 09:40:00', actor: 'Alamsyah Putra', action: 'Moved to UAT' },
        { id: 2, at: '2026-08-20 08:30:00', actor: 'Alamsyah Putra', action: 'Task dibuat dari requirement · Backlog' },
      ],
    }),
    normalizeTask({
      id: 4,
      title: 'FX rate overlay',
      description: 'Overlay FX conversion rates on vendor exposure.',
      dashboard: 'FinSight',
      requirement_id: 3,
      status: 'backlog',
      approval_state: 'approved',
      assignee: 'Asep Wahyudi',
      created_by: 'Alamsyah Putra',
      deadline: '2026-09-25',
      created_at: '2026-09-08 13:00:00',
      updated_at: '2026-09-08 13:00:00',
      activity: [
        { id: 1, at: '2026-09-08 13:00:00', actor: 'Alamsyah Putra', action: 'Task dibuat dari requirement · Backlog' },
      ],
    }),
    normalizeTask({
      id: 5,
      title: 'CSAT trend by channel',
      description: 'Trend chart for CSAT across support channels.',
      dashboard: 'CX Dashboard',
      requirement_id: 4,
      status: 'to_production',
      approval_state: 'approved',
      assignee: 'Panji Pujianto',
      created_by: 'Alamsyah Putra',
      deadline: '2026-09-10',
      created_at: '2026-08-10 11:00:00',
      updated_at: '2026-09-10 16:00:00',
      activity: [
        { id: 1, at: '2026-09-10 16:00:00', actor: 'Alamsyah Putra', action: 'Moved to Production' },
        { id: 2, at: '2026-08-10 11:00:00', actor: 'Alamsyah Putra', action: 'Task dibuat dari requirement · Backlog' },
      ],
    }),
    normalizeTask({
      id: 6,
      title: 'Backlog aging alert',
      description: 'Alert rule when ticket backlog ages beyond SLA.',
      dashboard: 'CX Dashboard',
      requirement_id: 4,
      status: 'development',
      approval_state: 'approved',
      assignee: 'Panji Pujianto',
      created_by: 'Alamsyah Putra',
      deadline: '2026-09-20',
      created_at: '2026-09-02 09:15:00',
      updated_at: '2026-09-12 10:00:00',
      activity: [
        { id: 1, at: '2026-09-12 10:00:00', actor: 'Panji Pujianto', action: 'Moved to Development' },
        { id: 2, at: '2026-09-02 09:15:00', actor: 'Alamsyah Putra', action: 'Task dibuat dari requirement · Backlog' },
      ],
    }),
    normalizeTask({
      id: 7,
      title: 'Kanban burn-up widget',
      description: 'Prototype burn-up chart for TRAXIS delivery board.',
      dashboard: 'TRAXIS',
      requirement_id: 5,
      status: 'backlog',
      approval_state: 'approved',
      assignee: 'Maggie Arsyad',
      created_by: 'Alamsyah Putra',
      deadline: '2026-09-30',
      created_at: '2026-09-07 12:00:00',
      updated_at: '2026-09-07 12:00:00',
      activity: [
        { id: 1, at: '2026-09-07 12:00:00', actor: 'Alamsyah Putra', action: 'Task dibuat dari requirement · Backlog' },
      ],
    }),
    normalizeTask({
      id: 8,
      title: 'Policy exception log',
      description: 'Table of policy exceptions with export action.',
      dashboard: 'GARD',
      requirement_id: 6,
      status: 'selesai',
      approval_state: 'approved',
      assignee: 'Asep Wahyudi',
      created_by: 'Alamsyah Putra',
      deadline: '2026-08-31',
      created_at: '2026-08-01 10:00:00',
      updated_at: '2026-08-31 17:00:00',
      activity: [
        { id: 1, at: '2026-08-31 17:00:00', actor: 'Alamsyah Putra', action: 'Moved to Selesai' },
        { id: 2, at: '2026-08-01 10:00:00', actor: 'Alamsyah Putra', action: 'Task dibuat dari requirement · Backlog' },
      ],
    }),
    normalizeTask({
      id: 9,
      title: 'Blocker root-cause tags',
      description: 'Tagging taxonomy for delivery blockers on TRAXIS.',
      dashboard: 'TRAXIS',
      requirement_id: 5,
      status: 'testing',
      approval_state: 'approved',
      assignee: 'Maggie Arsyad',
      created_by: 'Alamsyah Putra',
      deadline: '2026-09-14',
      created_at: '2026-09-03 08:00:00',
      updated_at: '2026-09-13 09:30:00',
      comments: [
        {
          id: 1,
          at: '2026-09-13 08:00:00',
          actor: 'Alamsyah Putra',
          body: 'Tambah tag “dependency vendor” di taxonomy.',
        },
      ],
      activity: [
        { id: 1, at: '2026-09-13 09:30:00', actor: 'Alamsyah Putra', action: 'Moved to Testing' },
        { id: 2, at: '2026-09-03 08:00:00', actor: 'Alamsyah Putra', action: 'Task dibuat dari requirement · Backlog' },
      ],
    }),
    normalizeTask({
      id: 10,
      title: 'Audit trail export',
      description: 'CSV/PDF export for GARD audit trail.',
      dashboard: 'GARD',
      requirement_id: 6,
      status: 'selesai',
      approval_state: 'approved',
      assignee: 'Asep Wahyudi',
      created_by: 'Alamsyah Putra',
      deadline: '2026-09-01',
      created_at: '2026-08-15 14:00:00',
      updated_at: '2026-09-01 16:00:00',
      activity: [
        { id: 1, at: '2026-09-01 16:00:00', actor: 'Alamsyah Putra', action: 'Moved to Selesai' },
        { id: 2, at: '2026-08-15 14:00:00', actor: 'Alamsyah Putra', action: 'Task dibuat dari requirement · Backlog' },
      ],
    }),
  ]
}

/** @returns {AppNotification[]} */
function seedNotifications() {
  return [
    {
      id: 1,
      at: '2026-09-14 09:30:00',
      type: 'move_request',
      title: 'Request pindah status',
      body: 'Farras Al-Risyad mengajukan “Throughput vs target chart” Testing → UAT.',
      taskId: 2,
      dashboard: 'GBO Dashboard',
      toUser: 'Alamsyah Putra',
      read: false,
    },
    {
      id: 2,
      at: '2026-09-12 10:00:00',
      type: 'comment',
      title: 'Komentar baru',
      body: 'Alamsyah Putra: Pastikan legend warna konsisten…',
      taskId: 1,
      dashboard: 'GBO Dashboard',
      toUser: 'Farras Al-Risyad',
      read: true,
    },
  ]
}

/** @returns {ModuleTask[]} */
function loadTasks() {
  if (typeof localStorage === 'undefined') return seedTasks()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedTasks()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return seedTasks()
    return parsed.map((t) => normalizeTask(t))
  } catch {
    return seedTasks()
  }
}

/** @returns {AppNotification[]} */
function loadNotifications() {
  if (typeof localStorage === 'undefined') return seedNotifications()
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    if (!raw) return seedNotifications()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return seedNotifications()
    return parsed
  } catch {
    return seedNotifications()
  }
}

/** @returns {SessionUser} */
function loadSession() {
  const fallback = sessionPersonas.find((p) => p.id === 'teknis') || sessionPersonas[0]
  if (typeof localStorage === 'undefined') return fallback
  try {
    const id = localStorage.getItem(SESSION_KEY)
    return sessionPersonas.find((p) => p.id === id) || fallback
  } catch {
    return fallback
  }
}

function loadBoardDashboard() {
  if (typeof localStorage === 'undefined') return ''
  try {
    return localStorage.getItem('edm-fe-task-board-dashboard') || ''
  } catch {
    return ''
  }
}

function initialBoardDashboard() {
  const options = defaultDashboards
  const saved = loadBoardDashboard()
  if (saved && options.includes(saved)) return saved
  return options[0] || ''
}

export const taskModuleStore = $state({
  /** @type {ModuleTask[]} */
  items: loadTasks(),
  /** @type {AppNotification[]} */
  notifications: loadNotifications(),
  /** @type {SessionUser} */
  session: loadSession(),
  lastDetailId: /** @type {number | null} */ (null),
  boardDashboard: initialBoardDashboard(),
  /** @type {'kanban' | 'inbox'} */
  boardTab: 'kanban',
})

function persist() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(taskModuleStore.items))
}

function persistNotifications() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(NOTIF_KEY, JSON.stringify(taskModuleStore.notifications))
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

/** @param {ModuleTask} item @param {string} action @param {string} [actor] @param {number | null} [evidenceId] */
function pushActivity(item, action, actor = currentUserName(), evidenceId = null) {
  const nextId = item.activity.reduce((max, a) => Math.max(max, a.id), 0) + 1
  item.activity = [{ id: nextId, at: nowStamp(), actor, action, evidence_id: evidenceId }, ...item.activity]
}

/**
 * @param {{
 *   type: NotifType,
 *   title: string,
 *   body: string,
 *   taskId?: number | null,
 *   dashboard?: string,
 *   toUser: string,
 * }} payload
 */
function pushNotification(payload) {
  const nextId = taskModuleStore.notifications.reduce((max, n) => Math.max(max, n.id), 0) + 1
  /** @type {AppNotification} */
  const row = {
    id: nextId,
    at: nowStamp(),
    type: payload.type,
    title: payload.title,
    body: payload.body,
    taskId: payload.taskId ?? null,
    dashboard: payload.dashboard || '',
    toUser: payload.toUser,
    read: false,
  }
  taskModuleStore.notifications = [row, ...taskModuleStore.notifications]
  persistNotifications()
}

export function currentUserName() {
  void taskModuleStore.session
  return taskModuleStore.session.name
}

export function currentUserRole() {
  void taskModuleStore.session
  return taskModuleStore.session.role
}

/** @param {string} personaId */
export function setSessionPersona(personaId) {
  const found = sessionPersonas.find((p) => p.id === personaId)
  if (!found) return
  taskModuleStore.session = found
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(SESSION_KEY, found.id)
    } catch {
      /* ignore */
    }
  }
}

/** @param {string} dashboard */
export function pmOfDashboard(dashboard) {
  return dashboardPmMap[dashboard] || ''
}

/** @deprecated use pmOfDashboard */
export function picOfDashboard(dashboard) {
  return pmOfDashboard(dashboard)
}

/** @param {string} dashboard */
export function isCurrentUserPmOf(dashboard) {
  const session = taskModuleStore.session
  void session
  if (session.role !== 'pm') return false
  return pmOfDashboard(dashboard) === session.name
}

/** @deprecated use isCurrentUserPmOf */
export function isCurrentUserPicOf(dashboard) {
  return isCurrentUserPmOf(dashboard)
}

export function canCreateDashboard() {
  return currentUserRole() === 'manager'
}

/** @param {string} [dashboard] */
export function canManageRequirements(dashboard = '') {
  const role = currentUserRole()
  if (role !== 'pm') return false
  if (!dashboard) return true
  return isCurrentUserPmOf(dashboard)
}

export function canCreateTask() {
  return currentUserRole() === 'pm'
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

/** @param {number} id */
export function getModuleTask(id) {
  return taskModuleStore.items.find((t) => t.id === Number(id)) || null
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
  void taskModuleStore.items
  let items = [...taskModuleStore.items]
  const today = dateOnly()

  if (dashboard) items = items.filter((t) => t.dashboard === dashboard)
  if (status) items = items.filter((t) => t.status === status)
  if (approval) items = items.filter((t) => t.approval_state === approval)
  if (requirement_id !== '' && requirement_id != null) {
    items = items.filter((t) => t.requirement_id === Number(requirement_id))
  }
  if (aktif === 'yes') items = items.filter((t) => t.approval_state === 'approved' && t.status !== 'selesai')
  if (pic) items = items.filter((t) => t.assignee === pic || t.pic === pic)
  if (overdue === 'yes') {
    items = items.filter((t) => t.approval_state === 'approved' && t.status !== 'selesai' && t.deadline < today)
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

/** Pipeline columns — hanya task yang sudah approved */
/** @param {TaskWorkflow} status @param {string} [dashboard] */
export function tasksByColumn(status, dashboard = '') {
  void taskModuleStore.items
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
  void taskModuleStore.items
  void taskModuleStore.session
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
    if (!isCurrentUserPmOf(t.dashboard)) return false
    if (t.status_move) return true
    return t.approval_state === 'pending'
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
  void taskModuleStore.boardDashboard
  void taskModuleStore.items
  const options = boardDashboardOptions()
  if (!options.length) return ''
  if (taskModuleStore.boardDashboard && options.includes(taskModuleStore.boardDashboard)) {
    return taskModuleStore.boardDashboard
  }
  return options[0]
}

/**
 * PM creates task under a requirement → langsung Backlog (approved).
 * @param {{
 *   title: string,
 *   description?: string,
 *   dashboard: string,
 *   requirement_id: number,
 *   status?: TaskWorkflow,
 *   pic?: string,
 *   assignee?: string,
 *   deadline: string,
 * }} payload
 */
export function createModuleTask(payload) {
  if (!canCreateTask()) return null

  const title = (payload.title || '').trim()
  if (!title) return null

  const dashboard = (payload.dashboard || '').trim() || 'General'
  if (!isCurrentUserPmOf(dashboard)) return null

  const requirement_id = Number(payload.requirement_id)
  if (!requirement_id) return null

  const actor = currentUserName()
  const assignee = (payload.assignee || payload.pic || '').trim() || actor

  const nextId = taskModuleStore.items.reduce((max, t) => Math.max(max, t.id), 0) + 1
  const stamp = nowStamp()
  /** @type {ModuleTask} */
  const task = {
    id: nextId,
    title,
    description: (payload.description || '').trim(),
    dashboard,
    requirement_id,
    status: payload.status || 'backlog',
    approval_state: 'approved',
    pic: assignee,
    assignee,
    created_by: actor,
    deadline: payload.deadline || dateOnly(),
    created_at: stamp,
    updated_at: stamp,
    approval_note: '',
    status_move: null,
    comments: [],
    activity: [
      {
        id: 1,
        at: stamp,
        actor,
        action: 'Task dibuat dari requirement · Backlog',
      },
    ],
    evidences: [],
  }

  taskModuleStore.items = [task, ...taskModuleStore.items]
  persist()

  if (assignee !== actor) {
    pushNotification({
      type: 'approved',
      title: 'Task baru di Backlog',
      body: `${actor} menugaskan “${title}” kepada Anda di ${dashboard}.`,
      taskId: task.id,
      dashboard,
      toUser: assignee,
    })
  }

  return task
}

/**
 * @param {number} id
 * @param {Partial<Pick<ModuleTask, 'title' | 'description' | 'dashboard' | 'pic' | 'assignee' | 'deadline' | 'requirement_id'>>} patch
 */
export function updateModuleTask(id, patch) {
  if (!canUpdateBoard()) return false
  const item = getModuleTask(id)
  if (!item) return false
  if (currentUserRole() === 'teknis') return false

  const keys = ['title', 'description', 'dashboard', 'deadline', 'requirement_id']
  for (const key of keys) {
    if (patch[key] !== undefined) item[key] = patch[key]
  }
  if (patch.assignee !== undefined || patch.pic !== undefined) {
    const next = (patch.assignee || patch.pic || '').trim()
    item.assignee = next
    item.pic = next
  }
  item.updated_at = nowStamp()
  pushActivity(item, 'Updated task details')
  taskModuleStore.items = [...taskModuleStore.items]
  persist()
  return true
}

/**
 * PM: langsung pindah. Teknis: buat status_move request.
 * @param {number} id
 * @param {TaskWorkflow} status
 * @param {{ note?: string, evidence?: EvidenceFile | null }} [opts]
 * @returns {'moved' | 'requested' | false}
 */
export function moveModuleTask(id, status, opts = {}) {
  if (!canUpdateBoard()) return false
  const item = getModuleTask(id)
  if (!item) return false
  if (item.approval_state !== 'approved') return false
  if (item.status === status) return 'moved'
  if (item.status_move) return false

  const role = currentUserRole()
  const actor = currentUserName()

  if (role === 'pm' && isCurrentUserPmOf(item.dashboard)) {
    const evidence = pushEvidence(item, 'pm_approve', opts.evidence, opts.note || '')
    const ask = (opts.note || '').trim()
    item.status = status
    item.status_move = null
    item.updated_at = nowStamp()
    pushActivity(
      item,
      `Pindah ke ${workflowLabel(status)}${ask ? `. ${ask}` : ''}`,
      actor,
      evidence?.id ?? null,
    )
    taskModuleStore.items = [...taskModuleStore.items]
    persist()
    return 'moved'
  }

  if (role === 'teknis') {
    const evidence = pushEvidence(item, 'move_request', opts.evidence, opts.note || '')
    item.status_move = {
      from: item.status,
      to: status,
      requested_by: actor,
      note: (opts.note || '').trim(),
      at: nowStamp(),
      evidence_id: evidence?.id ?? null,
    }
    item.updated_at = nowStamp()
    const ask = (opts.note || '').trim()
    pushActivity(
      item,
      `Ajukan pindah ${workflowLabel(item.status_move.from)} → ${workflowLabel(status)}${ask ? `. ${ask}` : ''}`,
      actor,
      evidence?.id ?? null,
    )
    taskModuleStore.items = [...taskModuleStore.items]
    persist()

    const pm = pmOfDashboard(item.dashboard)
    if (pm) {
      pushNotification({
        type: 'move_request',
        title: 'Request pindah status',
        body: `${actor} mengajukan “${item.title}” ${workflowLabel(item.status_move.from)} → ${workflowLabel(status)}.`,
        taskId: item.id,
        dashboard: item.dashboard,
        toUser: pm,
      })
    }
    return 'requested'
  }

  return false
}

/** @param {number} id @param {string} [note] @param {EvidenceFile | null} [evidence] */
export function approveStatusMove(id, note = '', evidence = null) {
  const item = getModuleTask(id)
  if (!item || !item.status_move) return false
  if (!isCurrentUserPmOf(item.dashboard)) return false

  const move = item.status_move
  const file = pushEvidence(item, 'pm_approve', evidence, note)
  item.status = move.to
  item.status_move = null
  item.approval_note = note.trim()
  item.updated_at = nowStamp()
  const noteText = (note || '').trim()
  const action = noteText
    ? `Setujui pindah ke ${workflowLabel(move.to)}. ${noteText}`
    : `Setujui pindah ke ${workflowLabel(move.to)}`
  pushActivity(item, action, currentUserName(), file?.id ?? null)
  taskModuleStore.items = [...taskModuleStore.items]
  persist()

  pushNotification({
    type: 'move_approved',
    title: 'Pindah status disetujui',
    body: `${currentUserName()} menyetujui pindah “${item.title}” ke ${workflowLabel(move.to)}.`,
    taskId: item.id,
    dashboard: item.dashboard,
    toUser: move.requested_by,
  })
  return true
}

/** @param {number} id @param {string} note @param {EvidenceFile | null} [evidence] */
export function rejectStatusMove(id, note = '', evidence = null) {
  const item = getModuleTask(id)
  if (!item || !item.status_move) return false
  if (!isCurrentUserPmOf(item.dashboard)) return false

  const move = item.status_move
  const body = (note || '').trim() || 'Request pindah ditolak / perlu revisi.'
  const file = pushEvidence(item, 'pm_return', evidence, body)
  item.status_move = null
  item.approval_note = body
  item.updated_at = nowStamp()
  pushActivity(item, `Minta revisi. ${body}`, currentUserName(), file?.id ?? null)

  taskModuleStore.items = [...taskModuleStore.items]
  persist()

  pushNotification({
    type: 'move_rejected',
    title: 'Pindah status ditolak',
    body: `${currentUserName()} menolak request pindah “${item.title}”.`,
    taskId: item.id,
    dashboard: item.dashboard,
    toUser: move.requested_by,
  })
  return true
}

/** @deprecated legacy create-approval — redirects to approveStatusMove when applicable */
/** @param {number} id @param {string} [note] @param {EvidenceFile | null} [evidence] */
export function approveModuleTask(id, note = '', evidence = null) {
  const item = getModuleTask(id)
  if (!item) return false
  if (item.status_move) return approveStatusMove(id, note, evidence)
  if (!isCurrentUserPmOf(item.dashboard)) return false
  if (item.approval_state !== 'pending' && item.approval_state !== 'revision') return false

  const file = pushEvidence(item, 'pm_approve', evidence, note)
  item.approval_state = 'approved'
  item.status = 'backlog'
  item.approval_note = note.trim()
  item.updated_at = nowStamp()
  const proof = file ? ` · bukti: ${file.name}` : ''
  pushActivity(item, `Disetujui · masuk Backlog${proof}`, currentUserName(), file?.id ?? null)
  taskModuleStore.items = [...taskModuleStore.items]
  persist()

  pushNotification({
    type: 'approved',
    title: 'Task disetujui',
    body: `${currentUserName()} menyetujui “${item.title}”.`,
    taskId: item.id,
    dashboard: item.dashboard,
    toUser: item.created_by,
  })
  return true
}

/** @param {number} id @param {string} note @param {EvidenceFile | null} [evidence] */
export function requestRevisionModuleTask(id, note, evidence = null) {
  const item = getModuleTask(id)
  if (!item) return false
  if (item.status_move) return rejectStatusMove(id, note, evidence)
  if (!isCurrentUserPmOf(item.dashboard)) return false

  const body = (note || '').trim() || 'Perlu dilengkapi sebelum masuk board.'
  const file = pushEvidence(item, 'pm_return', evidence, body)
  item.approval_state = 'revision'
  item.approval_note = body
  item.updated_at = nowStamp()
  const proof = file ? ` · lampiran: ${file.name}` : ''
  pushActivity(item, `Minta revisi${proof}`, currentUserName(), file?.id ?? null)

  const nextCommentId = item.comments.reduce((max, c) => Math.max(max, c.id), 0) + 1
  item.comments = [{ id: nextCommentId, at: nowStamp(), actor: currentUserName(), body }, ...item.comments]

  taskModuleStore.items = [...taskModuleStore.items]
  persist()

  pushNotification({
    type: 'revision',
    title: 'Perlu revisi',
    body: `${currentUserName()} meminta revisi untuk “${item.title}”.`,
    taskId: item.id,
    dashboard: item.dashboard,
    toUser: item.created_by,
  })
  return true
}

/** @param {number} id */
export function resubmitModuleTask(id) {
  const item = getModuleTask(id)
  if (!item) return false
  if (currentUserRole() === 'viewer' || currentUserRole() === 'manager') return false
  if (item.approval_state !== 'revision') return false
  if (item.created_by !== currentUserName() && !isCurrentUserPmOf(item.dashboard)) return false

  item.approval_state = 'pending'
  item.updated_at = nowStamp()
  pushActivity(item, 'Diajukan ulang untuk approval')
  taskModuleStore.items = [...taskModuleStore.items]
  persist()

  const pm = pmOfDashboard(item.dashboard)
  if (pm) {
    pushNotification({
      type: 'approval_request',
      title: 'Request approval (ulang)',
      body: `${currentUserName()} mengajukan ulang “${item.title}”.`,
      taskId: item.id,
      dashboard: item.dashboard,
      toUser: pm,
    })
  }
  return true
}

/** @param {number} id @param {string} body @param {EvidenceFile | null} [evidence] */
export function addTaskComment(id, body, evidence = null) {
  if (!canCommentOnTask()) return false
  const item = getModuleTask(id)
  if (!item) return false
  const text = (body || '').trim()
  if (!text && !evidence?.data_url) return false

  const file = pushEvidence(item, 'comment', evidence, text)
  const nextId = item.comments.reduce((max, c) => Math.max(max, c.id), 0) + 1
  const actor = currentUserName()
  item.comments = [
    { id: nextId, at: nowStamp(), actor, body: text, evidence_id: file?.id ?? null },
    ...item.comments,
  ]
  item.updated_at = nowStamp()
  taskModuleStore.items = [...taskModuleStore.items]
  persist()

  const recipients = [
    ...new Set([item.created_by, item.assignee, item.pic, pmOfDashboard(item.dashboard)].filter(Boolean)),
  ]
  for (const toUser of recipients) {
    if (toUser === actor) continue
    pushNotification({
      type: 'comment',
      title: 'Catatan baru',
      body: `${actor}: ${(text || file?.name || 'lampiran').slice(0, 80)}`,
      taskId: item.id,
      dashboard: item.dashboard,
      toUser,
    })
  }
  return true
}

/** @param {ModuleTask} task */
export function latestComment(task) {
  if (!task?.comments?.length) return null
  return task.comments[0]
}

/** @param {number} id */
export function deleteModuleTask(id) {
  if (currentUserRole() !== 'pm') return false
  const item = getModuleTask(id)
  if (!item || !isCurrentUserPmOf(item.dashboard)) return false
  const before = taskModuleStore.items.length
  taskModuleStore.items = taskModuleStore.items.filter((t) => t.id !== Number(id))
  if (taskModuleStore.items.length === before) return false
  if (taskModuleStore.lastDetailId === Number(id)) taskModuleStore.lastDetailId = null
  persist()
  return true
}

/** @param {number} id */
export function rememberDetailId(id) {
  taskModuleStore.lastDetailId = Number(id)
}

export function myNotifications() {
  void taskModuleStore.notifications
  void taskModuleStore.session
  const name = currentUserName()
  return taskModuleStore.notifications
    .filter((n) => n.toUser === name)
    .sort((a, b) => b.at.localeCompare(a.at))
}

export function unreadNotificationCount() {
  return myNotifications().filter((n) => !n.read).length
}

/** @param {number} id */
export function markNotificationRead(id) {
  const row = taskModuleStore.notifications.find((n) => n.id === Number(id))
  if (!row || row.read) return
  row.read = true
  taskModuleStore.notifications = [...taskModuleStore.notifications]
  persistNotifications()
}

export function markAllNotificationsRead() {
  let changed = false
  const name = currentUserName()
  for (const n of taskModuleStore.notifications) {
    if (n.toUser === name && !n.read) {
      n.read = true
      changed = true
    }
  }
  if (!changed) return
  taskModuleStore.notifications = [...taskModuleStore.notifications]
  persistNotifications()
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
  { key: /** @type {TaskWorkflow} */ ('selesai'), label: 'Selesai' },
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

/** @param {ApprovalState | string} state */
export function approvalLabel(state) {
  switch (state) {
    case 'pending':
      return 'Menunggu approval'
    case 'revision':
      return 'Perlu revisi'
    case 'approved':
      return 'Approved'
    default:
      return state
  }
}


export function dashboardOptions() {
  void taskModuleStore.items
  return [...new Set([...Object.keys(dashboardPmMap), ...taskModuleStore.items.map((t) => t.dashboard)])].sort()
}

export function boardDashboardOptions() {
  void taskModuleStore.items
  return [
    ...new Set([...defaultDashboards, ...Object.keys(dashboardPmMap), ...taskModuleStore.items.map((t) => t.dashboard)]),
  ].sort()
}

export function picOptions() {
  void taskModuleStore.items
  return [...new Set([...teknisAssignees, ...taskModuleStore.items.map((t) => t.assignee || t.pic)])].sort()
}

export function assigneeOptions() {
  return picOptions()
}

/** Demo PM name list for Manager assign */
export function pmOptions() {
  return [
    ...new Set([
      ...Object.values(dashboardPmMap),
      ...sessionPersonas.filter((p) => p.role === 'pm').map((p) => p.name),
    ]),
  ].sort()
}

/** @param {ModuleTask} task */
export function isOverdue(task) {
  return task.approval_state === 'approved' && task.status !== 'selesai' && task.deadline < dateOnly()
}

/** @param {number | null | undefined} requirementId */
export function tasksForRequirement(requirementId) {
  void taskModuleStore.items
  if (!requirementId) return []
  return taskModuleStore.items.filter((t) => t.requirement_id === Number(requirementId))
}
