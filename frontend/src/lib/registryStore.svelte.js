/** @typedef {'active' | 'idle'} RegistryStatus */
/** @typedef {'high' | 'medium' | 'low'} Criticality */
/** @typedef {'open' | 'in_progress' | 'done'} ItemStatus */

/**
 * @typedef {Object} RegistryTask
 * @property {number} id
 * @property {string} title
 * @property {ItemStatus} status
 * @property {string} pic
 * @property {Criticality} [priority]
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
 * @property {RegistryStatus} status
 * @property {Criticality} criticality
 * @property {string} owner
 * @property {string} platform
 * @property {string} category
 * @property {string} url
 * @property {string} version
 * @property {string} created_at
 * @property {string} updated_at
 * @property {Record<string, string>} metadata
 * @property {{ tasks_total: number, tasks_open: number, tasks_done: number, last_change: string }} quick_stats
 * @property {RegistryTask[]} tasks
 * @property {RegistryHistory[]} history
 */

const STORAGE_KEY = 'edm-fe-registry-dashboards-v2'

function nowStamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

function dateOnly(stamp = nowStamp()) {
  return stamp.slice(0, 10)
}

/**
 * Merge former requirements into tasks without duplicate titles.
 * @param {RegistryTask[]} tasks
 * @param {{ id: number, title: string, status: ItemStatus, priority?: Criticality, pic?: string }[]} fromReqs
 * @returns {RegistryTask[]}
 */
function mergeTasks(tasks, fromReqs) {
  const seen = new Set(tasks.map((t) => t.title.toLowerCase()))
  const merged = [...tasks]
  for (const req of fromReqs) {
    if (seen.has(req.title.toLowerCase())) continue
    seen.add(req.title.toLowerCase())
    merged.push({
      id: req.id,
      title: req.title,
      status: req.status,
      pic: req.pic || '',
      priority: req.priority || 'medium',
    })
  }
  return merged
}

/** @returns {RegistryDashboard[]} */
function seedDashboards() {
  return [
    {
      id: 1,
      name: 'GBO Dashboard',
      code: 'GBO',
      description: 'Operational overview for GBO performance, SLA, and throughput.',
      status: 'active',
      criticality: 'high',
      owner: 'Alya Putri',
      platform: 'Power BI',
      category: 'Operations',
      url: 'https://bi.example.com/gbo',
      version: '2.4',
      created_at: '2025-11-12 09:00:00',
      updated_at: '2026-09-10 14:20:00',
      metadata: {
        source_system: 'EDM Core',
        refresh_cadence: 'Hourly',
        data_domain: 'Operations',
        tech_stack: 'Power BI + SQL Server',
        audience: 'Ops Lead, PMO',
      },
      quick_stats: { tasks_total: 7, tasks_open: 6, tasks_done: 1, last_change: '2026-09-10' },
      tasks: mergeTasks(
        [
          { id: 1, title: 'Review EDM batch Q3', status: 'in_progress', pic: 'Alya Putri' },
          { id: 5, title: 'Fix duplicate document IDs', status: 'in_progress', pic: 'Eka Rahma' },
          { id: 8, title: 'Validate SLA escalation rules', status: 'in_progress', pic: 'Hendra Wijaya' },
        ],
        [
          { id: 101, title: 'SLA heatmap per region', priority: 'high', status: 'done' },
          { id: 102, title: 'Throughput vs target chart', priority: 'medium', status: 'in_progress' },
          { id: 103, title: 'Escalation drill-down', priority: 'high', status: 'open' },
          { id: 104, title: 'Export weekly PDF', priority: 'low', status: 'open' },
        ],
      ),
      history: [
        { id: 1, at: '2026-09-10 14:20:00', actor: 'Alya Putri', action: 'Updated metadata refresh cadence to Hourly' },
        { id: 2, at: '2026-09-05 11:00:00', actor: 'Budi Santoso', action: 'Added task: Escalation drill-down' },
        { id: 3, at: '2026-08-20 16:30:00', actor: 'Alya Putri', action: 'Changed status to Active' },
        { id: 4, at: '2025-11-12 09:00:00', actor: 'System', action: 'Dashboard registered' },
      ],
    },
    {
      id: 2,
      name: 'FinSight',
      code: 'FIN',
      description: 'Finance insight board covering invoice aging, cash, and vendor exposure.',
      status: 'active',
      criticality: 'high',
      owner: 'Citra Dewi',
      platform: 'Tableau',
      category: 'Finance',
      url: 'https://bi.example.com/finsight',
      version: '1.8',
      created_at: '2026-01-08 10:15:00',
      updated_at: '2026-09-09 09:40:00',
      metadata: {
        source_system: 'ERP + EDM',
        refresh_cadence: 'Daily',
        data_domain: 'Finance',
        tech_stack: 'Tableau + Snowflake',
        audience: 'Finance Controller',
      },
      quick_stats: { tasks_total: 5, tasks_open: 2, tasks_done: 3, last_change: '2026-09-09' },
      tasks: mergeTasks(
        [
          { id: 3, title: 'Close overdue invoice tasks', status: 'open', pic: 'Citra Dewi' },
          { id: 4, title: 'Generate weekly EDM report', status: 'done', pic: 'Doni Pratama' },
        ],
        [
          { id: 201, title: 'Aging bucket filter', priority: 'high', status: 'done' },
          { id: 202, title: 'Vendor exposure card', priority: 'medium', status: 'done' },
          { id: 203, title: 'FX rate overlay', priority: 'medium', status: 'open' },
        ],
      ),
      history: [
        { id: 1, at: '2026-09-09 09:40:00', actor: 'Citra Dewi', action: 'Linked task: Close overdue invoice tasks' },
        { id: 2, at: '2026-07-01 13:00:00', actor: 'Doni Pratama', action: 'Released version 1.8' },
        { id: 3, at: '2026-01-08 10:15:00', actor: 'System', action: 'Dashboard registered' },
      ],
    },
    {
      id: 3,
      name: 'CX Dashboard',
      code: 'CX',
      description: 'Customer experience metrics, CSAT, and ticket backlog health.',
      status: 'idle',
      criticality: 'medium',
      owner: 'Eka Rahma',
      platform: 'Looker',
      category: 'Customer',
      url: 'https://bi.example.com/cx',
      version: '3.0',
      created_at: '2025-09-01 08:00:00',
      updated_at: '2026-09-08 17:10:00',
      metadata: {
        source_system: 'CRM',
        refresh_cadence: 'Near-realtime',
        data_domain: 'Customer Experience',
        tech_stack: 'Looker + BigQuery',
        audience: 'CX Manager',
      },
      quick_stats: { tasks_total: 3, tasks_open: 2, tasks_done: 1, last_change: '2026-09-08' },
      tasks: mergeTasks(
        [{ id: 2, title: 'Sync vendor master mapping', status: 'open', pic: 'Budi Santoso' }],
        [
          { id: 301, title: 'CSAT trend by channel', priority: 'high', status: 'done' },
          { id: 302, title: 'Backlog aging alert', priority: 'high', status: 'in_progress' },
        ],
      ),
      history: [
        { id: 1, at: '2026-09-08 17:10:00', actor: 'Eka Rahma', action: 'Changed status to Idle' },
        { id: 2, at: '2026-06-15 10:00:00', actor: 'Eka Rahma', action: 'Upgraded to version 3.0' },
        { id: 3, at: '2025-09-01 08:00:00', actor: 'System', action: 'Dashboard registered' },
      ],
    },
    {
      id: 4,
      name: 'TRAXIS',
      code: 'TRX',
      description: 'Tracking and execution intelligence for cross-team delivery.',
      status: 'idle',
      criticality: 'medium',
      owner: 'Gita Lestari',
      platform: 'Power BI',
      category: 'Delivery',
      url: '',
      version: '0.9',
      created_at: '2026-08-18 11:30:00',
      updated_at: '2026-09-07 12:00:00',
      metadata: {
        source_system: 'EDM Task Board',
        refresh_cadence: 'Manual',
        data_domain: 'Delivery',
        tech_stack: 'Power BI (prototype)',
        audience: 'Delivery Manager',
      },
      quick_stats: { tasks_total: 4, tasks_open: 4, tasks_done: 0, last_change: '2026-09-07' },
      tasks: mergeTasks(
        [{ id: 7, title: 'Onboard new PIC checklist', status: 'open', pic: 'Gita Lestari' }],
        [
          { id: 401, title: 'Kanban burn-up widget', priority: 'medium', status: 'open' },
          { id: 402, title: 'Blocker root-cause tags', priority: 'high', status: 'open' },
          { id: 403, title: 'PIC workload strip', priority: 'low', status: 'open' },
        ],
      ),
      history: [
        { id: 1, at: '2026-09-07 12:00:00', actor: 'Gita Lestari', action: 'Added draft tasks pack' },
        { id: 2, at: '2026-08-18 11:30:00', actor: 'System', action: 'Dashboard registered as Idle' },
      ],
    },
    {
      id: 5,
      name: 'GARD',
      code: 'GARD',
      description: 'Governance, audit, risk, and document compliance dashboard.',
      status: 'active',
      criticality: 'low',
      owner: 'Hendra Wijaya',
      platform: 'Metabase',
      category: 'Governance',
      url: 'https://bi.example.com/gard',
      version: '1.2',
      created_at: '2026-03-22 14:00:00',
      updated_at: '2026-09-01 16:00:00',
      metadata: {
        source_system: 'Document Vault',
        refresh_cadence: 'Weekly',
        data_domain: 'Governance',
        tech_stack: 'Metabase + Postgres',
        audience: 'Compliance',
      },
      quick_stats: { tasks_total: 3, tasks_open: 0, tasks_done: 3, last_change: '2026-09-01' },
      tasks: mergeTasks(
        [{ id: 6, title: 'Archive completed August tasks', status: 'done', pic: 'Fajar Nugroho' }],
        [
          { id: 501, title: 'Policy exception log', priority: 'medium', status: 'done' },
          { id: 502, title: 'Audit trail export', priority: 'low', status: 'done' },
        ],
      ),
      history: [
        { id: 1, at: '2026-09-01 16:00:00', actor: 'Hendra Wijaya', action: 'Marked all Q3 tasks done' },
        { id: 2, at: '2026-03-22 14:00:00', actor: 'System', action: 'Dashboard registered' },
      ],
    },
    {
      id: 6,
      name: 'EDM Core Monitor',
      code: 'EDM',
      description: 'Core EDM pipeline health, import failures, and batch latency.',
      status: 'idle',
      criticality: 'low',
      owner: 'Budi Santoso',
      platform: 'Grafana',
      category: 'Operations',
      url: 'https://bi.example.com/edm-core-legacy',
      version: '1.0',
      created_at: '2024-06-01 09:00:00',
      updated_at: '2026-06-30 18:00:00',
      metadata: {
        source_system: 'EDM Legacy',
        refresh_cadence: 'Stopped',
        data_domain: 'Operations',
        tech_stack: 'Grafana (legacy)',
        audience: 'Archived',
      },
      quick_stats: { tasks_total: 1, tasks_open: 0, tasks_done: 1, last_change: '2026-06-30' },
      tasks: mergeTasks(
        [],
        [{ id: 601, title: 'Migrate panels to GBO', priority: 'high', status: 'done' }],
      ),
      history: [
        { id: 1, at: '2026-06-30 18:00:00', actor: 'Budi Santoso', action: 'Changed status to Idle' },
        { id: 2, at: '2024-06-01 09:00:00', actor: 'System', action: 'Dashboard registered' },
      ],
    },
    {
      id: 7,
      name: 'Sales Force',
      code: 'SLS',
      description: 'Sales performance tracking.',
      status: 'active',
      criticality: 'high',
      owner: 'Dimas Aditya',
      platform: 'Tableau',
      category: 'Sales',
      url: 'https://bi.example.com/sls',
      version: '2.1',
      created_at: '2025-05-10 10:00:00',
      updated_at: '2026-09-12 11:00:00',
      metadata: { source_system: 'CRM' },
      quick_stats: { tasks_total: 2, tasks_open: 1, tasks_done: 1, last_change: '2026-09-12' },
      tasks: [],
      history: []
    },
    {
      id: 8,
      name: 'HR Analytics',
      code: 'HRA',
      description: 'Employee retention and performance.',
      status: 'active',
      criticality: 'medium',
      owner: 'Kartika Sari',
      platform: 'Power BI',
      category: 'HR',
      url: 'https://bi.example.com/hra',
      version: '1.5',
      created_at: '2026-01-20 09:00:00',
      updated_at: '2026-08-22 14:00:00',
      metadata: { source_system: 'Workday' },
      quick_stats: { tasks_total: 0, tasks_open: 0, tasks_done: 0, last_change: '2026-08-22' },
      tasks: [],
      history: []
    },
    {
      id: 9,
      name: 'Marketing ROI',
      code: 'MKT',
      description: 'Campaign performance and ROI metrics.',
      status: 'idle',
      criticality: 'medium',
      owner: 'Reza Pahlevi',
      platform: 'Looker',
      category: 'Marketing',
      url: 'https://bi.example.com/mkt',
      version: '0.8',
      created_at: '2026-09-15 08:30:00',
      updated_at: '2026-09-18 16:20:00',
      metadata: { source_system: 'Ads' },
      quick_stats: { tasks_total: 1, tasks_open: 1, tasks_done: 0, last_change: '2026-09-18' },
      tasks: [],
      history: []
    },
    {
      id: 10,
      name: 'IT Infrastructure',
      code: 'ITI',
      description: 'Server uptime and network bandwidth.',
      status: 'active',
      criticality: 'high',
      owner: 'Budi Santoso',
      platform: 'Grafana',
      category: 'IT',
      url: 'https://bi.example.com/iti',
      version: '4.0',
      created_at: '2024-01-10 11:00:00',
      updated_at: '2026-09-19 10:00:00',
      metadata: { source_system: 'AWS' },
      quick_stats: { tasks_total: 5, tasks_open: 2, tasks_done: 3, last_change: '2026-09-19' },
      tasks: [],
      history: []
    },
    {
      id: 11,
      name: 'Compliance Report',
      code: 'CMP',
      description: 'Monthly regulatory compliance status.',
      status: 'idle',
      criticality: 'high',
      owner: 'Hendra Wijaya',
      platform: 'Power BI',
      category: 'Legal',
      url: 'https://bi.example.com/cmp',
      version: '1.1',
      created_at: '2026-05-12 13:00:00',
      updated_at: '2026-09-02 09:30:00',
      metadata: { source_system: 'LegalDB' },
      quick_stats: { tasks_total: 3, tasks_open: 3, tasks_done: 0, last_change: '2026-09-02' },
      tasks: [],
      history: []
    },
    {
      id: 12,
      name: 'Supply Chain Ops',
      code: 'SCO',
      description: 'Logistics and warehouse inventory tracking.',
      status: 'active',
      criticality: 'medium',
      owner: 'Alya Putri',
      platform: 'Tableau',
      category: 'Supply Chain',
      url: 'https://bi.example.com/sco',
      version: '2.5',
      created_at: '2025-08-11 10:10:00',
      updated_at: '2026-09-17 15:45:00',
      metadata: { source_system: 'SAP' },
      quick_stats: { tasks_total: 8, tasks_open: 4, tasks_done: 4, last_change: '2026-09-17' },
      tasks: [],
      history: []
    }
  ]
}

/** @returns {RegistryDashboard[]} */
function loadDashboards() {
  if (typeof localStorage === 'undefined') return seedDashboards()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedDashboards()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return seedDashboards()
    return parsed
  } catch {
    return seedDashboards()
  }
}

export const registryStore = $state({
  /** @type {RegistryDashboard[]} */
  items: loadDashboards(),
  /** @type {number | null} */
  lastDetailId: null,
})

function persist() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registryStore.items))
}

/** @param {RegistryDashboard} item */
function refreshQuickStats(item) {
  item.quick_stats = {
    tasks_total: item.tasks.length,
    tasks_open: item.tasks.filter((t) => t.status !== 'done').length,
    tasks_done: item.tasks.filter((t) => t.status === 'done').length,
    last_change: dateOnly(item.updated_at),
  }
}

/** @param {RegistryDashboard} item @param {string} action @param {string} [actor] */
function pushHistory(item, action, actor = 'You') {
  const nextId = item.history.reduce((max, h) => Math.max(max, h.id), 0) + 1
  item.history = [{ id: nextId, at: nowStamp(), actor, action }, ...item.history]
}

/** @param {number} id */
export function getDashboard(id) {
  return registryStore.items.find((d) => d.id === Number(id)) || null
}

/**
 * @param {{ status?: string, dashboard?: string, criticality?: string, q?: string, sort?: string }} [filters]
 */
export function listDashboards({
  status = '',
  dashboard = '',
  criticality = '',
  q = '',
  sort = 'updated_desc',
} = {}) {
  let items = [...registryStore.items]

  if (status) items = items.filter((d) => d.status === status)
  if (criticality) items = items.filter((d) => d.criticality === criticality)
  if (dashboard) {
    const needle = dashboard.toLowerCase()
    items = items.filter((d) =>
      `${d.name} ${d.code} ${d.category}`.toLowerCase().includes(needle),
    )
  }
  if (q) {
    const needle = q.toLowerCase()
    items = items.filter((d) =>
      `${d.name} ${d.code} ${d.description} ${d.owner} ${d.platform} ${d.category}`
        .toLowerCase()
        .includes(needle),
    )
  }

  const rank = { high: 3, medium: 2, low: 1 }
  items.sort((a, b) => {
    switch (sort) {
      case 'name_asc':
        return a.name.localeCompare(b.name)
      case 'name_desc':
        return b.name.localeCompare(a.name)
      case 'criticality_desc':
        return (rank[b.criticality] || 0) - (rank[a.criticality] || 0)
      case 'criticality_asc':
        return (rank[a.criticality] || 0) - (rank[b.criticality] || 0)
      case 'status_asc':
        return a.status.localeCompare(b.status)
      case 'updated_asc':
        return a.updated_at.localeCompare(b.updated_at)
      case 'updated_desc':
      default:
        return b.updated_at.localeCompare(a.updated_at)
    }
  })

  return items
}

/**
 * @param {number} id
 * @param {Partial<Pick<RegistryDashboard, 'name' | 'code' | 'description' | 'owner' | 'platform' | 'category' | 'url' | 'version' | 'criticality' | 'metadata'>>} patch
 */
export function updateDashboard(id, patch) {
  const item = getDashboard(id)
  if (!item) return false

  const keys = ['name', 'code', 'description', 'owner', 'platform', 'category', 'url', 'version', 'criticality']
  for (const key of keys) {
    if (patch[key] !== undefined) item[key] = patch[key]
  }
  if (patch.metadata) item.metadata = { ...item.metadata, ...patch.metadata }

  item.updated_at = nowStamp()
  refreshQuickStats(item)
  pushHistory(item, 'Edited dashboard details')
  registryStore.items = [...registryStore.items]
  persist()
  return true
}

/** @param {number} id @param {RegistryStatus} status */
export function changeDashboardStatus(id, status) {
  const item = getDashboard(id)
  if (!item) return false
  if (item.status === status) return true

  item.status = status
  item.updated_at = nowStamp()
  refreshQuickStats(item)
  pushHistory(item, `Changed status to ${registryStatusLabel(status)}`)
  registryStore.items = [...registryStore.items]
  persist()
  return true
}

/** @param {number} id */
export function deleteDashboard(id) {
  const before = registryStore.items.length
  registryStore.items = registryStore.items.filter((d) => d.id !== Number(id))
  if (registryStore.items.length === before) return false
  if (registryStore.lastDetailId === Number(id)) registryStore.lastDetailId = null
  persist()
  return true
}

/** @param {number} id */
export function rememberDetailId(id) {
  registryStore.lastDetailId = Number(id)
}

/**
 * @param {number} dashboardId
 * @param {{ title: string, pic?: string, status?: ItemStatus, priority?: Criticality }} payload
 */
export function addRegistryTask(dashboardId, payload) {
  const item = getDashboard(dashboardId)
  if (!item) return null
  const title = (payload.title || '').trim()
  if (!title) return null

  const nextId = item.tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1
  const task = {
    id: nextId,
    title,
    pic: (payload.pic || '').trim(),
    status: payload.status || 'open',
    priority: payload.priority || 'medium',
  }
  item.tasks = [task, ...item.tasks]
  item.updated_at = nowStamp()
  refreshQuickStats(item)
  pushHistory(item, `Added task: ${title}`)
  registryStore.items = [...registryStore.items]
  persist()
  return task
}

/** @param {RegistryStatus | string} status */
export function registryStatusLabel(status) {
  switch (status) {
    case 'active':
      return 'Active'
    case 'idle':
      return 'Idle'
    default:
      return status
  }
}

/** @param {Criticality | string} value */
export function criticalityLabel(value) {
  switch (value) {
    case 'high':
      return 'High'
    case 'medium':
      return 'Medium'
    case 'low':
      return 'Low'
    default:
      return value
  }
}

/** @param {ItemStatus | string} status */
export function itemStatusLabel(status) {
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

export const registryStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'idle', label: 'Idle' },
]

export const criticalityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export const dashboardFilterOptions = [
  { value: 'GBO', label: 'GBO Dashboard' },
  { value: 'FinSight', label: 'FinSight' },
  { value: 'CX', label: 'CX Dashboard' },
  { value: 'TRAXIS', label: 'TRAXIS' },
  { value: 'GARD', label: 'GARD' },
  { value: 'EDM', label: 'EDM Core Monitor' },
]

export const sortOptions = [
  { value: 'updated_desc', label: 'Updated terbaru' },
  { value: 'updated_asc', label: 'Updated terlama' },
  { value: 'name_asc', label: 'Nama A–Z' },
  { value: 'name_desc', label: 'Nama Z–A' },
  { value: 'criticality_desc', label: 'Kritikalitas tinggi' },
  { value: 'criticality_asc', label: 'Kritikalitas rendah' },
  { value: 'status_asc', label: 'Status A–Z' },
]
