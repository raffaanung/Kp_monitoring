import { goto } from '$app/navigation'
import { setBoardDashboard } from './taskModuleStore.svelte.js'

/**
 * @param {{
 *   dashboard?: string,
 *   status?: string,
 *   overdue?: string,
 *   aktif?: string,
 *   q?: string,
 *   taskId?: string | number,
 * }} [filters]
 * @param {'list' | 'board'} [view]
 */
export function pushTaskFilters(filters = {}, view = 'list') {
  if (filters.taskId) {
    goto(`/registry/list?focusTask=${filters.taskId}`)
    return
  }

  if (filters.dashboard) {
    setBoardDashboard(filters.dashboard)
    goto(`/registry/list?dashboard=${encodeURIComponent(filters.dashboard)}`)
    return
  }

  goto('/registry/list')
}

/** Parse filters from spa-router hash */
export function readHashTaskFilters() {
  const hash = typeof window !== 'undefined' ? window.location.hash : ''
  const qIndex = hash.indexOf('?')
  if (qIndex < 0) return {}
  return Object.fromEntries(new URLSearchParams(hash.slice(qIndex + 1)))
}
