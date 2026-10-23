<?php

namespace App\Controllers;

use App\Libraries\Id;
use App\Libraries\TaskPolicy;
use App\Models\ModuleDatabaseModel;
use App\Models\ModuleModel;
use App\Models\ModuleTableFieldModel;
use App\Models\ModuleTableModel;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Tab "Data Source" di Dashboard Detail: dokumentasi modul/halaman dan field mana
 * yang diambil dari tabel database mana. Hierarki: Modul -> Submodul (Halaman) ->
 * Database -> Tabel -> Field.
 */
class DataSources extends BaseController
{
    /**
     * Pohon modul (modul + submodul-nya) untuk 1 dashboard, lengkap sampai field.
     * 4 query total terlepas dari berapa banyak modul/database/tabel-nya (hindari N+1):
     * modul -> database -> tabel -> field, masing-masing 1x whereIn().
     */
    public function index(string $dashboardId = '0'): ResponseInterface
    {
        $modules = (new ModuleModel())->forDashboard($dashboardId);
        if ($modules === []) {
            return $this->jsonOk([]);
        }

        $moduleIds = array_column($modules, 'id');
        $dbModel     = new ModuleDatabaseModel();
        $tableModel  = new ModuleTableModel();
        $fieldModel  = new ModuleTableFieldModel();

        $databasesByModule = $dbModel->forModules($moduleIds);

        $databaseIds = array_column($databasesByModule, 'id');
        $tablesByDatabase = $tableModel->forDatabases($databaseIds);

        $allTableIds = [];
        foreach ($tablesByDatabase as $tables) {
            foreach ($tables as $t) {
                $allTableIds[] = $t['id'];
            }
        }
        $fieldsByTable = [];
        foreach ($fieldModel->forTables($allTableIds) as $f) {
            $fieldsByTable[$f['module_table_id']][] = $f;
        }

        $shaped = [];
        foreach ($modules as $m) {
            $rows      = [];
            $tableTags = [];
            $db        = $databasesByModule[$m['id']] ?? null;
            if ($db !== null) {
                foreach ($tablesByDatabase[$db['id']] ?? [] as $t) {
                    $schemaName = $t['schema_name'] ?: 'public';
                    $tableTags[$schemaName . '.' . $t['table_name']] = [
                        'table_name'  => $t['table_name'],
                        'schema_name' => $schemaName,
                    ];
                    foreach ($fieldsByTable[$t['id']] ?? [] as $f) {
                        $rows[] = [
                            'id'           => $f['id'],
                            'display_label'=> $f['display_label'],
                            'table_name'   => $t['table_name'],
                            'schema_name'  => $schemaName,
                            'field_name'   => $f['field_name'],
                            'field_type'   => $f['field_type'],
                        ];
                    }
                }
            }

            $shaped[$m['id']] = [
                'id'          => $m['id'],
                'parent_id'   => $m['parent_id'],
                'name'        => $m['name'],
                'description' => $m['description'],
                'db_name'     => $db['db_name'] ?? null,
                'db_engine'   => $db['db_engine'] ?? null,
                'tables'      => array_values($tableTags),
                'rows'        => $rows,
                'children'    => [],
            ];
        }

        $tree = [];
        foreach ($shaped as $id => $node) {
            if ($node['parent_id'] !== null && isset($shaped[$node['parent_id']])) {
                $shaped[$node['parent_id']]['children'][] = &$shaped[$id];
            } else {
                $tree[] = &$shaped[$id];
            }
        }

        return $this->jsonOk(array_values($tree));
    }

    /** Tambah Modul (parent_id kosong) atau Submodul/Halaman (parent_id diisi). */
    public function create(string $dashboardId = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null || ! TaskPolicy::canManageRegistry($user)) {
            return $this->jsonError('You are not allowed to manage the data source documentation', 403);
        }

        $name       = trim((string) $this->request->getJsonVar('name'));
        $description= trim((string) ($this->request->getJsonVar('description') ?? ''));
        $parentId   = $this->uuidOrNull($this->request->getJsonVar('parent_id'));
        $dbName     = trim((string) ($this->request->getJsonVar('db_name') ?? ''));
        $dbEngine   = trim((string) ($this->request->getJsonVar('db_engine') ?? ''));

        if ($name === '') {
            return $this->jsonError('Name is required', 422);
        }

        $moduleModel = new ModuleModel();
        if ($parentId !== null && $moduleModel->find($parentId) === null) {
            return $this->jsonError('Parent module not found', 404);
        }

        $id = Id::new();
        $moduleModel->insert([
            'id' => $id, 'dashboard_id' => $dashboardId, 'parent_id' => $parentId,
            'name' => $name, 'description' => $description,
        ], false);

        if ($parentId !== null && ($dbName !== '' || $dbEngine !== '')) {
            (new ModuleDatabaseModel())->insert([
                'id' => Id::new(), 'module_id' => $id, 'db_name' => $dbName ?: '-', 'db_engine' => $dbEngine ?: null,
            ], false);
        }

        return $this->jsonOk([
            'id'           => $id,
            'dashboard_id' => $dashboardId,
            'name'         => $name,
            'description'  => $description,
            'parent_id'    => $parentId,
        ]);
    }

    /** Tambah 1 baris field-mapping ("yang tampil di halaman") ke 1 submodul/halaman. */
    public function addField(string $moduleId = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null || ! TaskPolicy::canManageRegistry($user)) {
            return $this->jsonError('You are not allowed to manage the data source documentation', 403);
        }

        $moduleModel = new ModuleModel();
        $module = $moduleModel->find($moduleId);
        if ($module === null) {
            return $this->jsonError('Module not found', 404);
        }

        $displayLabel = trim((string) $this->request->getJsonVar('display_label'));
        $tableName    = trim((string) $this->request->getJsonVar('table_name'));
        $schemaName   = trim((string) ($this->request->getJsonVar('schema_name') ?? '')) ?: 'public';
        $fieldName    = trim((string) $this->request->getJsonVar('field_name'));
        $fieldType    = trim((string) $this->request->getJsonVar('field_type'));
        if ($displayLabel === '' || $tableName === '' || $fieldName === '' || $fieldType === '') {
            return $this->jsonError('Semua field wajib diisi', 422);
        }

        $dbId = $this->resolveModuleDatabaseId($moduleId);
        $table = (new ModuleTableModel())->findOrCreate($dbId, $tableName, $schemaName);

        $fieldId = Id::new();
        (new ModuleTableFieldModel())->insert([
            'id' => $fieldId, 'module_table_id' => $table['id'], 'display_label' => $displayLabel,
            'field_name' => $fieldName, 'field_type' => $fieldType,
        ], false);

        return $this->jsonOk(['id' => $fieldId]);
    }

    /** Tambah 1 tabel kosong (dokumentasi) ke 1 submodul/halaman, sebelum field-nya diisi satu-satu. */
    public function addTable(string $moduleId = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null || ! TaskPolicy::canManageRegistry($user)) {
            return $this->jsonError('You are not allowed to manage the data source documentation', 403);
        }

        $moduleModel = new ModuleModel();
        $module = $moduleModel->find($moduleId);
        if ($module === null) {
            return $this->jsonError('Module not found', 404);
        }

        $tableName  = trim((string) $this->request->getJsonVar('table_name'));
        $schemaName = trim((string) ($this->request->getJsonVar('schema_name') ?? '')) ?: 'public';
        if ($tableName === '') {
            return $this->jsonError('Nama tabel wajib diisi', 422);
        }

        $dbId = $this->resolveModuleDatabaseId($moduleId);
        $table = (new ModuleTableModel())->findOrCreate($dbId, $tableName, $schemaName);

        return $this->jsonOk(['id' => $table['id'], 'table_name' => $table['table_name'], 'schema_name' => $table['schema_name']]);
    }

    /** Database dokumentasi punya 1 submodul/halaman; buat baris "-"-nya kalau belum ada. */
    private function resolveModuleDatabaseId(string $moduleId): string
    {
        $dbModel = new ModuleDatabaseModel();
        $db = $dbModel->forModule($moduleId);
        if ($db !== null) {
            return $db['id'];
        }

        $dbId = Id::new();
        $dbModel->insert(['id' => $dbId, 'module_id' => $moduleId, 'db_name' => '-', 'db_engine' => null], false);

        return $dbId;
    }

    /** Edit 1 baris field-mapping yang sudah ada (ubah label/tabel/field/tipe-nya). */
    public function updateField(string $fieldId = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null || ! TaskPolicy::canManageRegistry($user)) {
            return $this->jsonError('You are not allowed to manage the data source documentation', 403);
        }

        $fieldModel = new ModuleTableFieldModel();
        $field = $fieldModel->find($fieldId);
        if ($field === null) {
            return $this->jsonError('Field not found', 404);
        }

        $displayLabel = trim((string) $this->request->getJsonVar('display_label'));
        $tableName    = trim((string) $this->request->getJsonVar('table_name'));
        $schemaName   = trim((string) ($this->request->getJsonVar('schema_name') ?? '')) ?: 'public';
        $fieldName    = trim((string) $this->request->getJsonVar('field_name'));
        $fieldType    = trim((string) $this->request->getJsonVar('field_type'));
        if ($displayLabel === '' || $tableName === '' || $fieldName === '' || $fieldType === '') {
            return $this->jsonError('Semua field wajib diisi', 422);
        }

        $tableModel = new ModuleTableModel();
        $currentTable = $tableModel->find($field['module_table_id']);
        if ($currentTable === null) {
            return $this->jsonError('Table not found', 404);
        }

        $patch = ['display_label' => $displayLabel, 'field_name' => $fieldName, 'field_type' => $fieldType];
        $currentSchema = $currentTable['schema_name'] ?: 'public';
        if ($tableName !== $currentTable['table_name'] || $schemaName !== $currentSchema) {
            $newTable = $tableModel->findOrCreate($currentTable['module_database_id'], $tableName, $schemaName);
            $patch['module_table_id'] = $newTable['id'];
            $fieldModel->update($fieldId, $patch);
            // Tabel lama udah gak punya field lagi? Buang biar gak nyangkut jadi badge "tabel" kosong.
            if ($fieldModel->where('module_table_id', $currentTable['id'])->countAllResults() === 0) {
                $tableModel->delete($currentTable['id']);
            }
        } else {
            $fieldModel->update($fieldId, $patch);
        }

        return $this->jsonOk(['id' => $fieldId]);
    }
}
