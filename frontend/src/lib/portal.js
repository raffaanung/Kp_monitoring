/**
 * Pindahkan node ke document.body agar position:fixed menutupi viewport penuh
 * (tidak terpengaruh transform/overflow ancestor seperti PageShell atau Layout stage).
 * Menggunakan queueMicrotask & requestAnimationFrame agar pemindahan terjadi
 * setelah Svelte 5 selesai menyisipkan node ke anchor asalnya di DOM.
 * @param {HTMLElement} node
 */
export function portal(node) {
  if (typeof document === 'undefined') return {}

  let active = true

  const moveToBody = () => {
    if (active && node && document.body && node.parentNode !== document.body) {
      document.body.appendChild(node)
    }
  }

  queueMicrotask(moveToBody)

  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(moveToBody)
  }

  return {
    destroy() {
      active = false
      if (node && node.parentNode) {
        node.parentNode.removeChild(node)
      }
    },
  }
}
