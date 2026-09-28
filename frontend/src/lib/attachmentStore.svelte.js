/** @typedef {'requirement' | 'dashboard'} AttachmentOwner */
/** @typedef {'pdf' | 'ppt' | 'xls' | 'file'} AttachmentKind */

/**
 * @typedef {Object} AttachmentMeta
 * @property {string} id
 * @property {AttachmentOwner} ownerType
 * @property {string} ownerId
 * @property {string} name
 * @property {string} mime
 * @property {number} size
 * @property {AttachmentKind} kind
 * @property {string} uploadedAt
 * @property {string} uploadedBy
 */

const META_KEY = 'edm-fe-attachments-v1'
const DB_NAME = 'edm-fe-attachments'
const DB_STORE = 'files'
const MAX_BYTES = 20 * 1024 * 1024

/** @returns {AttachmentMeta[]} */
function loadMeta() {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(META_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const attachmentStore = $state({
  /** @type {AttachmentMeta[]} */
  items: loadMeta(),
})

function persist() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(META_KEY, JSON.stringify(attachmentStore.items))
}

function nowStamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

/** @param {string} name */
export function attachmentKind(name) {
  const ext = (name.split('.').pop() || '').toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (ext === 'ppt' || ext === 'pptx') return 'ppt'
  if (ext === 'xls' || ext === 'xlsx') return 'xls'
  return 'file'
}

/** @param {AttachmentKind | string} kind @param {string} [name] */
export function attachmentKindLabel(kind, name = '') {
  if (kind === 'ppt') return 'PPT'
  if (kind === 'xls') return 'XLS'
  if (kind === 'pdf') return 'PDF'
  const ext = (name.split('.').pop() || 'file').slice(0, 4).toUpperCase()
  return ext
}

/** @param {number} bytes */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${bytes || 0} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** @returns {Promise<IDBDatabase>} */
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** @param {string} id @param {Blob} blob */
async function putBlob(id, blob) {
  const db = await openDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite')
    tx.objectStore(DB_STORE).put(blob, id)
    tx.oncomplete = () => resolve(undefined)
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

/** @param {string} id */
async function getBlob(id) {
  const db = await openDb()
  const blob = await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly')
    const req = tx.objectStore(DB_STORE).get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return /** @type {Blob | null} */ (blob)
}

/** @param {string} id */
async function deleteBlob(id) {
  const db = await openDb()
  await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite')
    tx.objectStore(DB_STORE).delete(id)
    tx.oncomplete = () => resolve(undefined)
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

/**
 * @param {AttachmentOwner} ownerType
 * @param {string | number} ownerId
 */
export function listAttachments(ownerType, ownerId) {
  const id = String(ownerId)
  return attachmentStore.items
    .filter((item) => item.ownerType === ownerType && item.ownerId === id)
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
}

/**
 * @param {AttachmentOwner} ownerType
 * @param {string | number} ownerId
 * @param {FileList | File[]} files
 * @param {string} [uploadedBy]
 */
export async function addAttachments(ownerType, ownerId, files, uploadedBy = 'Anda') {
  /** @type {AttachmentMeta[]} */
  const added = []
  /** @type {{ name: string, reason: string }[]} */
  const rejected = []
  const owner = String(ownerId)

  for (const file of Array.from(files || [])) {
    if (file.size > MAX_BYTES) {
      rejected.push({ name: file.name, reason: 'lebih dari 20 MB' })
      continue
    }
    if (!file.size) {
      rejected.push({ name: file.name, reason: 'file kosong' })
      continue
    }
    const kind = attachmentKind(file.name)
    const meta = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ownerType,
      ownerId: owner,
      name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      kind,
      uploadedAt: nowStamp(),
      uploadedBy,
    }
    await putBlob(meta.id, file)
    added.push(meta)
  }

  if (added.length) {
    attachmentStore.items = [...added, ...attachmentStore.items]
    persist()
  }

  return { added, rejected }
}

/** @param {string} id */
export async function removeAttachment(id) {
  attachmentStore.items = attachmentStore.items.filter((item) => item.id !== id)
  persist()
  try {
    await deleteBlob(id)
  } catch {
    /* metadata is already gone */
  }
}

/** @param {string} url @param {string} name */
function triggerDownload(url, name) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** @param {string} id @param {'open' | 'download'} mode */
export async function useAttachment(id, mode) {
  const meta = attachmentStore.items.find((item) => item.id === id)
  const blob = await getBlob(id)
  if (!meta || !blob) return false
  const url = URL.createObjectURL(blob)
  if (mode === 'download' || meta.kind !== 'pdf') {
    triggerDownload(url, meta.name)
  } else {
    window.open(url, '_blank', 'noopener')
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return true
}
