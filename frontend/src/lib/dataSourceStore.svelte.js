import { api } from './api.js'

/**
 * @typedef {Object} DataSourceRow
 * @property {string} id
 * @property {string} display_label
 * @property {string} table_name
 * @property {string} field_name
 * @property {string} field_type
 */

/**
 * @typedef {Object} DataSourceNode
 * @property {string} id
 * @property {string|null} parent_id
 * @property {string} name
 * @property {string} description
 * @property {string|null} db_name
 * @property {string|null} db_engine
 * @property {string[]} tables
 * @property {DataSourceRow[]} rows
 * @property {DataSourceNode[]} children
 */

export const dataSourceStore = $state({
  /** @type {DataSourceNode[]} */
  tree: [],
  loading: false,
  /** @type {string | null} */
  error: null,
})

/** @param {string} dashboardId */
export async function loadDataSourceTree(dashboardId) {
  dataSourceStore.loading = true
  dataSourceStore.error = null
  try {
    dataSourceStore.tree = await api.get(`/api/dashboards/${dashboardId}/modules`)
  } catch (e) {
    dataSourceStore.error = e instanceof Error ? e.message : String(e)
  } finally {
    dataSourceStore.loading = false
  }
}

/**
 * @param {string} dashboardId
 * @param {{ name: string, description?: string, parent_id?: string, db_name?: string, db_engine?: string }} payload
 */
export async function createModule(dashboardId, payload) {
  await api.post(`/api/dashboards/${dashboardId}/modules`, payload)
  await loadDataSourceTree(dashboardId)
}

/**
 * @param {string} dashboardId
 * @param {string} moduleId
 * @param {{ display_label: string, table_name: string, field_name: string, field_type: string }} payload
 */
export async function addDataSourceField(dashboardId, moduleId, payload) {
  await api.post(`/api/modules/${moduleId}/fields`, payload)
  await loadDataSourceTree(dashboardId)
}

/**
 * @param {string} dashboardId
 * @param {string} fieldId
 * @param {{ display_label: string, table_name: string, field_name: string, field_type: string }} payload
 */
export async function updateDataSourceField(dashboardId, fieldId, payload) {
  await api.put(`/api/module-fields/${fieldId}`, payload)
  await loadDataSourceTree(dashboardId)
}

/** Daftar semua node flat (modul + submodul), buat dropdown pilih parent. @param {DataSourceNode[]} tree */
export function flattenModules(tree) {
  /** @type {DataSourceNode[]} */
  const out = []
  /** @param {DataSourceNode[]} nodes */
  function walk(nodes) {
    for (const n of nodes) {
      out.push(n)
      walk(n.children)
    }
  }
  walk(tree)
  return out
}
