import {
  login as apiLogin,
  logout as apiLogout,
  fetchMe,
  updateMe,
  changePassword as apiChangePassword,
  uploadAvatar as apiUploadAvatarFile,
  clearAvatarApi,
} from './api.js'
import { syncSessionFromAuth } from './taskModuleStore.svelte.js'

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} name
 * @property {string} username
 * @property {string|null} avatar_url
 * @property {string} role_id
 * @property {string} role_name
 * @property {'manager'|'pm'|'teknis'|'viewer'} functional_role
 * @property {string|null} division_name
 */

export const authStore = $state({
  /** @type {AuthUser|null} */
  user: null,
  /** True until the initial /api/auth/me check resolves. */
  loading: true,
})

/** Call once on app boot to restore an existing session. */
export async function initAuth() {
  try {
    authStore.user = await fetchMe()
  } catch {
    authStore.user = null
  } finally {
    authStore.loading = false
    syncSessionFromAuth(authStore.user)
  }
}

/** @param {string} username @param {string} password */
export async function login(username, password) {
  authStore.user = await apiLogin(username, password)
  syncSessionFromAuth(authStore.user)
  return authStore.user
}

export async function logout() {
  try {
    await apiLogout()
  } finally {
    authStore.user = null
    syncSessionFromAuth(null)
  }
}

/** @param {string} name @param {string} username */
export async function updateProfile(name, username) {
  authStore.user = await updateMe(name, username)
  syncSessionFromAuth(authStore.user)
  return authStore.user
}

/**
 * @param {string} currentPassword @param {string} newPassword
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function changePassword(currentPassword, newPassword) {
  try {
    await apiChangePassword(currentPassword, newPassword)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** @param {File} file */
export async function uploadAvatar(file) {
  authStore.user = await apiUploadAvatarFile(file)
  return authStore.user
}

/**
 * Ambil ulang akun yang sedang login, termasuk permission-nya, lalu perbarui sesi.
 * Dipanggil setelah data akses berubah supaya perubahan izin langsung berlaku tanpa refresh.
 */
export async function refreshCurrentUser() {
  try {
    authStore.user = await fetchMe()
    syncSessionFromAuth(authStore.user)
  } catch {
    /* sesi tetap seperti sebelumnya kalau gagal */
  }
}

export async function clearAvatar() {
  authStore.user = await clearAvatarApi()
  return authStore.user
}
