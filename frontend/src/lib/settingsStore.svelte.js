import { authStore, updateProfile as apiUpdateProfile, uploadAvatar as apiUploadAvatar, clearAvatar as apiClearAvatar } from './authStore.svelte.js'

/**
 * Thin wrapper over authStore — profile is the real logged-in user now,
 * not a per-persona localStorage blob. Kept as its own module so
 * SettingsProfile.svelte / Layout.svelte don't need to import authStore directly.
 */

/** Display name for chrome (falls back to session name if somehow empty). */
export function displayName() {
  return authStore.user?.name || ''
}

/** Avatar URL for chrome (empty = use default asset). */
export function avatarUrl() {
  return authStore.user?.avatar_url || ''
}

/** @returns {{ displayName: string, username: string, unit: string }} */
export function currentProfile() {
  return {
    displayName: authStore.user?.name || '',
    username: authStore.user?.username || '',
    unit: authStore.user?.division_name || '',
  }
}

/**
 * @param {{ displayName: string, username: string }} patch
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function updateProfile(patch) {
  try {
    await apiUpdateProfile(patch.displayName, patch.username)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * @param {File} file
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function updateAvatar(file) {
  try {
    await apiUploadAvatar(file)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function clearAvatar() {
  try {
    await apiClearAvatar()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
