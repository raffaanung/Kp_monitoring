const API_BASE = '/edm-task-monitoring/backend'

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`)
  const payload = await res.json().catch(() => ({}))

  if (!res.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${res.status})`)
  }

  return payload.data
}

export function fetchDashboard() {
  return request('/api/dashboard')
}

export function fetchTasks({ status = '', q = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (q) params.set('q', q)
  const query = params.toString()
  return request(`/api/tasks${query ? `?${query}` : ''}`)
}

export function fetchTask(id) {
  return request(`/api/tasks/${id}`)
}

export function statusLabel(status) {
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
