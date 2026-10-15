import { loadTasksFromApi } from './taskStore.svelte.js'
import { loadAccessFromApi } from './accessStore.svelte.js'
import { loadDashboardsFromApi } from './registryStore.svelte.js'
import { loadRequirementsFromApi } from './requirementStore.svelte.js'
import { loadModuleTasksFromApi, loadNotificationsFromApi } from './taskModuleStore.svelte.js'
import { loadActivityLogsFromApi } from './activityLogStore.svelte.js'

let appDataLoading = false

/**
 * Muat semua data dari API. Dipanggil saat app dibuka (sudah login), setelah login berhasil,
 * dan berkala oleh auto-refresh (lihat startAutoRefresh()). Ada guard appDataLoading supaya
 * polling tidak numpuk request kalau load sebelumnya belum selesai — backend-nya php -S
 * (single-threaded) + DB remote, jadi 1 putaran load ini sendiri bisa makan beberapa detik.
 */
export async function loadAppData() {
  if (appDataLoading) return
  appDataLoading = true
  try {
    await Promise.all([
      loadTasksFromApi(),
      loadAccessFromApi(),
      loadDashboardsFromApi(),
      loadRequirementsFromApi(),
      loadModuleTasksFromApi(),
      loadNotificationsFromApi(),
      loadActivityLogsFromApi(),
    ])
  } finally {
    appDataLoading = false
  }
}

/** @type {ReturnType<typeof setInterval> | null} */
let autoRefreshTimer = null

/**
 * Auto-refresh berkala supaya stats bar/task list tetap kelihatan fresh tanpa reload manual.
 * Interval sengaja agak panjang (default 30 detik) karena server dev ini single-threaded —
 * polling yang kelewat sering bakal antre dan malah bikin aksi manual user kerasa lebih lambat.
 * @param {number} [intervalMs]
 */
export function startAutoRefresh(intervalMs = 30000) {
  stopAutoRefresh()
  autoRefreshTimer = setInterval(() => {
    loadAppData()
  }, intervalMs)
}

export function stopAutoRefresh() {
  if (autoRefreshTimer !== null) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
}
