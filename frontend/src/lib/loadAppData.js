import { loadTasksFromApi } from './taskStore.svelte.js'
import { loadAccessFromApi } from './accessStore.svelte.js'
import { loadDashboardsFromApi } from './registryStore.svelte.js'
import { loadRequirementsFromApi } from './requirementStore.svelte.js'
import { loadModuleTasksFromApi, loadNotificationsFromApi } from './taskModuleStore.svelte.js'

/** Muat semua data dari API. Dipanggil saat app dibuka (sudah login) dan setelah login berhasil. */
export function loadAppData() {
  loadTasksFromApi()
  loadAccessFromApi()
  loadDashboardsFromApi()
  loadRequirementsFromApi()
  loadModuleTasksFromApi()
  loadNotificationsFromApi()
}
