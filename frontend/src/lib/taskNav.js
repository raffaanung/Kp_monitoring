import { push } from 'svelte-spa-router'
import { setBoardDashboard } from './taskModuleStore.svelte.js'

/**
 * @param {{
 *   dashboard?: string,
 *   status?: string,
 *   overdue?: string,
 *   aktif?: string,
 *   q?: string,
 * }} [filters]
 * @param {'list' | 'board'} [view]
 */
export function pushTaskFilters(filters = {}, view = 'list') {
  if (view === 'board') {
    if (filters.dashboard) setBoardDashboard(filters.dashboard)
    push('/tasks/board')
    return
  }

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value != null && String(value).trim() !== '') params.set(key, String(value))
  }
  const query = params.toString()
  push(query ? `/tasks/list?${query}` : '/tasks/list')
}

/** Parse filters from spa-router hash: `#/tasks/list?status=backlog` */
export function readHashTaskFilters() {
  const hash = typeof window !== 'undefined' ? window.location.hash : ''
  const qIndex = hash.indexOf('?')
  if (qIndex < 0) return {}
  return Object.fromEntries(new URLSearchParams(hash.slice(qIndex + 1)))
}
