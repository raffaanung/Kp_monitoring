import { taskModuleStore } from './taskModuleStore.svelte.js'

/** @typedef {'id' | 'en'} AppLanguage */

/**
 * @typedef {Object} ProfileSettings
 * @property {string} displayName
 * @property {string} email
 * @property {string} phone
 * @property {string} unit
 * @property {string} bio
 * @property {string} avatarDataUrl
 */

/**
 * @typedef {Object} NotificationPrefs
 * @property {boolean} inApp
 * @property {boolean} email
 * @property {boolean} taskUpdates
 * @property {boolean} approvals
 * @property {boolean} comments
 */

/**
 * @typedef {Object} PreferencesSettings
 * @property {AppLanguage} language
 * @property {NotificationPrefs} notifications
 */

/**
 * @typedef {Object} PersonaSettings
 * @property {ProfileSettings} profile
 * @property {PreferencesSettings} preferences
 */

const STORAGE_KEY = 'edm-fe-settings-v1'

export const languageOptions = [
  { value: /** @type {AppLanguage} */ ('id'), label: 'Bahasa Indonesia' },
  { value: /** @type {AppLanguage} */ ('en'), label: 'English' },
]

export const notificationCatalog = [
  { key: 'inApp', label: 'Notifikasi in-app', hint: 'Bell & inbox di header aplikasi' },
  { key: 'email', label: 'Notifikasi email', hint: 'Ringkasan ke email (demo, tidak dikirim)' },
  { key: 'taskUpdates', label: 'Update task', hint: 'Perubahan status / assignee task' },
  { key: 'approvals', label: 'Persetujuan', hint: 'Request approve & hasil review' },
  { key: 'comments', label: 'Komentar', hint: 'Balasan & mention pada task' },
]

/** @returns {ProfileSettings} */
function defaultProfile(personaId = '', name = '') {
  const slug = (name || personaId || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
  return {
    displayName: name || '',
    email: slug ? `${slug}@edm.local` : 'user@edm.local',
    phone: '',
    unit: 'EDM Core',
    bio: '',
    avatarDataUrl: '',
  }
}

/** @returns {PreferencesSettings} */
function defaultPreferences() {
  return {
    language: 'id',
    notifications: {
      inApp: true,
      email: false,
      taskUpdates: true,
      approvals: true,
      comments: true,
    },
  }
}

/** @param {string} personaId @param {string} [name] @returns {PersonaSettings} */
function defaultPersonaSettings(personaId, name = '') {
  return {
    profile: defaultProfile(personaId, name),
    preferences: defaultPreferences(),
  }
}

/** @returns {Record<string, PersonaSettings>} */
function loadAll() {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}

    // Migrate renamed demo persona display name
    for (const key of Object.keys(parsed)) {
      const row = parsed[key]
      const dn = row?.profile?.displayName
      if (dn === 'Raka Wibowo' || dn === 'FARRAS AL RISYAD') {
        row.profile.displayName = 'Farras Al-Risyad'
      }
      if (
        row?.profile?.email === 'raka.wibowo@edm.local' ||
        row?.profile?.email === 'farras.al.risyad@edm.local'
      ) {
        row.profile.email = 'farras.al-risyad@edm.local'
      }
    }
    return parsed
  } catch {
    return {}
  }
}

function persist() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsStore.byPersona))
  } catch {
    /* ignore */
  }
}

export const settingsStore = $state({
  /** @type {Record<string, PersonaSettings>} */
  byPersona: loadAll(),
})

/** @param {string} personaId @param {string} [name] */
function ensurePersona(personaId, name = '') {
  if (!personaId) return defaultPersonaSettings('', name)
  const existing = settingsStore.byPersona[personaId]
  if (existing) return existing
  return defaultPersonaSettings(personaId, name)
}

function activePersonaId() {
  void taskModuleStore.session
  return taskModuleStore.session?.id || ''
}

function activePersonaName() {
  void taskModuleStore.session
  return taskModuleStore.session?.name || ''
}

/** @returns {PersonaSettings} */
export function currentSettings() {
  return ensurePersona(activePersonaId(), activePersonaName())
}

/** @returns {ProfileSettings} */
export function currentProfile() {
  const s = currentSettings()
  void settingsStore.byPersona
  return s.profile
}

/** @returns {PreferencesSettings} */
export function currentPreferences() {
  const s = currentSettings()
  void settingsStore.byPersona
  return s.preferences
}

/** Display name for chrome (falls back to session name). */
export function displayName() {
  const profile = currentProfile()
  const sessionName = activePersonaName()
  return profile.displayName?.trim() || sessionName
}

/** Avatar URL for chrome (empty = use default asset). */
export function avatarUrl() {
  return currentProfile().avatarDataUrl || ''
}

/** Whether in-app notification UI should surface alerts. */
export function inAppNotificationsEnabled() {
  return !!currentPreferences().notifications.inApp
}

/**
 * @param {Partial<ProfileSettings>} patch
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function updateProfile(patch) {
  const personaId = activePersonaId()
  if (!personaId) return { ok: false, error: 'Sesi tidak ditemukan' }

  const s = ensurePersona(personaId, activePersonaName())
  const next = {
    ...s.profile,
    ...patch,
    displayName: patch.displayName !== undefined ? String(patch.displayName).trim() : s.profile.displayName,
    email: patch.email !== undefined ? String(patch.email).trim() : s.profile.email,
    phone: patch.phone !== undefined ? String(patch.phone).trim() : s.profile.phone,
    unit: patch.unit !== undefined ? String(patch.unit).trim() : s.profile.unit,
    bio: patch.bio !== undefined ? String(patch.bio) : s.profile.bio,
  }

  if (!next.displayName) return { ok: false, error: 'Nama tampilan wajib diisi' }
  if (!next.email || !next.email.includes('@')) return { ok: false, error: 'Email tidak valid' }

  settingsStore.byPersona = {
    ...settingsStore.byPersona,
    [personaId]: { ...s, profile: next },
  }
  persist()
  return { ok: true }
}

/**
 * @param {string} dataUrl
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function updateAvatar(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { ok: false, error: 'File foto tidak valid' }
  }
  if (!dataUrl.startsWith('data:image/')) {
    return { ok: false, error: 'Format harus gambar (JPG/PNG/WebP)' }
  }
  return updateProfile({ avatarDataUrl: dataUrl })
}

export function clearAvatar() {
  return updateProfile({ avatarDataUrl: '' })
}

/**
 * @param {Partial<NotificationPrefs>} patch
 */
export function updateNotificationPrefs(patch) {
  const personaId = activePersonaId()
  if (!personaId) return
  const s = ensurePersona(personaId, activePersonaName())
  settingsStore.byPersona = {
    ...settingsStore.byPersona,
    [personaId]: {
      ...s,
      preferences: {
        ...s.preferences,
        notifications: { ...s.preferences.notifications, ...patch },
      },
    },
  }
  persist()
}

/** @param {AppLanguage} language */
export function setLanguage(language) {
  const personaId = activePersonaId()
  if (!personaId) return
  if (language !== 'id' && language !== 'en') return
  const s = ensurePersona(personaId, activePersonaName())
  settingsStore.byPersona = {
    ...settingsStore.byPersona,
    [personaId]: {
      ...s,
      preferences: { ...s.preferences, language },
    },
  }
  persist()
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }
}

/** Apply document lang from current prefs (call on boot / persona switch). */
export function syncDocumentLanguage() {
  const lang = currentPreferences().language
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang
  }
}
