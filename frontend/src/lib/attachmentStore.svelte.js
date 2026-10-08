import { api } from './api.js'

/** @typedef {'requirement' | 'dashboard'} AttachmentOwner */
/** @typedef {'pdf' | 'ppt' | 'xls' | 'file'} AttachmentKind */

/**
 * @typedef {Object} AttachmentMeta
 * @property {number} id
 * @property {AttachmentOwner} ownerType
 * @property {string} ownerId
 * @property {string} name
 * @property {string} mime
 * @property {number} size
 * @property {AttachmentKind} kind
 * @property {string} uploadedAt
 * @property {string} uploadedBy
 * @property {string} file_url
 */

const MAX_BYTES = 20 * 1024 * 1024

export const attachmentStore = $state({
  /** @type {AttachmentMeta[]} */
  items: [],
})

/** @param {AttachmentOwner} ownerType @param {string | number} ownerId */
export async function loadAttachmentsFromApi(ownerType, ownerId) {
  try {
    const rows = await api.get(`/api/attachments?owner_type=${ownerType}&owner_id=${ownerId}`)
    const others = attachmentStore.items.filter((i) => !(i.ownerType === ownerType && i.ownerId === String(ownerId)))
    attachmentStore.items = [...others, ...rows]
  } catch {
    /* non-fatal */
  }
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
 */
export async function addAttachments(ownerType, ownerId, files) {
  /** @type {AttachmentMeta[]} */
  const added = []
  /** @type {{ name: string, reason: string }[]} */
  const rejected = []

  for (const file of Array.from(files || [])) {
    if (file.size > MAX_BYTES) {
      rejected.push({ name: file.name, reason: 'lebih dari 20 MB' })
      continue
    }
    if (!file.size) {
      rejected.push({ name: file.name, reason: 'file kosong' })
      continue
    }
    try {
      const form = new FormData()
      form.append('owner_type', ownerType)
      form.append('owner_id', String(ownerId))
      form.append('file', file)
      const meta = await api.postForm('/api/attachments', form)
      added.push(meta)
    } catch (e) {
      rejected.push({ name: file.name, reason: e instanceof Error ? e.message : 'gagal diunggah' })
    }
  }

  if (added.length) {
    attachmentStore.items = [...added, ...attachmentStore.items]
  }

  return { added, rejected }
}

/** @param {number} id */
export async function removeAttachment(id) {
  attachmentStore.items = attachmentStore.items.filter((item) => item.id !== id)
  try {
    await api.del(`/api/attachments/${id}`)
  } catch {
    /* metadata is already gone client-side */
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

/** @param {number} id @param {'open' | 'download'} mode */
export async function useAttachment(id, mode) {
  const meta = attachmentStore.items.find((item) => item.id === id)
  if (!meta) return false
  if (mode === 'download' || meta.kind !== 'pdf') {
    triggerDownload(meta.file_url, meta.name)
  } else {
    window.open(meta.file_url, '_blank', 'noopener')
  }
  return true
}
