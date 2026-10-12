const API_BASE = import.meta.env.VITE_API_BASE ?? '/edm_task/backend'

/** @param {string} path @param {{ method?: string, body?: unknown }} [opts] */
async function request(path, opts = {}) {
  const { method = 'GET', body } = opts
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const payload = await res.json().catch(() => ({}))

  if (!res.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${res.status})`)
  }

  return payload.data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: body ?? {} }),
  put: (path, body) => request(path, { method: 'PUT', body: body ?? {} }),
  del: (path, body) => request(path, { method: 'DELETE', body: body ?? {} }),
  /** @param {string} path @param {FormData} form */
  async postForm(path, form) {
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: form })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok || payload.success === false) {
      throw new Error(payload.message || `Request failed (${res.status})`)
    }
    return payload.data
  },
}

// ---- Auth ----
export function login(username, password) {
  return request('/api/auth/login', { method: 'POST', body: { username, password } })
}

export function logout() {
  return request('/api/auth/logout', { method: 'POST', body: {} })
}

export function fetchMe() {
  return request('/api/auth/me')
}

/** @param {string} name @param {string} username */
export function updateMe(name, username) {
  return request('/api/auth/me', { method: 'PUT', body: { name, username } })
}

/** @param {string} currentPassword @param {string} newPassword */
export function changePassword(currentPassword, newPassword) {
  return request('/api/auth/me/password', {
    method: 'POST',
    body: { current_password: currentPassword, new_password: newPassword },
  })
}

/** @param {File} file */
export async function uploadAvatar(file) {
  const form = new FormData()
  form.append('avatar', file)
  return api.postForm('/api/auth/me/avatar', form)
}

export function clearAvatarApi() {
  return request('/api/auth/me/avatar', { method: 'DELETE', body: {} })
}

// ---- Tasks (legacy simple widget — see taskStore.svelte.js) ----
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
