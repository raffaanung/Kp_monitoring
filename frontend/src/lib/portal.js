/**
 * Pindahkan node ke document.body agar position:fixed menutupi viewport penuh
 * (tidak terpengaruh transform/overflow ancestor seperti PageShell).
 * @param {HTMLElement} node
 */
export function portal(node) {
  if (typeof document === 'undefined') return {}
  document.body.appendChild(node)
  return {
    destroy() {
      if (node.parentNode) node.parentNode.removeChild(node)
    },
  }
}
