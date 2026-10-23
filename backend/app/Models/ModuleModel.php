<?php

namespace App\Models;

use App\Libraries\Id;
use CodeIgniter\Model;

class ModuleModel extends Model
{
    protected $table            = 'modules';
    protected $primaryKey       = 'id';
    protected $returnType       = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields    = [
        'id', 'dashboard_id', 'name', 'description', 'parent_id', 'sort_order', 'created_at',
    ];

    /**
     * @return list<array<string, mixed>>
     */
    public function listByDashboard(string $dashboardId): array
    {
        return $this->where('dashboard_id', $dashboardId)
            ->orderBy('sort_order', 'ASC')
            ->orderBy('created_at', 'ASC')
            ->orderBy('name', 'ASC')
            ->findAll();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function forDashboard(string $dashboardId): array
    {
        return $this->listByDashboard($dashboardId);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createModule(array $data): string
    {
        if (empty($data['id'])) {
            $data['id'] = Id::new();
        }
        if (empty($data['created_at'])) {
            $data['created_at'] = date('Y-m-d H:i:s');
        }
        if (! isset($data['sort_order'])) {
            $maxSort = $this->where('dashboard_id', $data['dashboard_id'])
                ->selectMax('sort_order')
                ->first();
            $data['sort_order'] = ((int) ($maxSort['sort_order'] ?? 0)) + 1;
        }

        $this->insert($data, false);

        return $data['id'];
    }

    /**
     * Delete a module and cascade any child modules or related data
     */
    public function deleteModule(string $moduleId): bool
    {
        $db = db_connect();

        // Also clean up sub-modules if any
        $children = $this->where('parent_id', $moduleId)->findAll();
        foreach ($children as $child) {
            $this->deleteModule($child['id']);
        }

        // Find module_databases for this module
        $modDbs = $db->table('module_databases')->select('id')->where('module_id', $moduleId)->get()->getResultArray();
        $dbIds = array_column($modDbs, 'id');
        if (! empty($dbIds)) {
            $db->table('module_tables')->whereIn('module_database_id', $dbIds)->delete();
            $db->table('module_databases')->whereIn('id', $dbIds)->delete();
        }
        try {
            $db->table('module_queries')->where('module_id', $moduleId)->delete();
        } catch (\Throwable $e) {
            // ignore if table does not exist or column differs
        }

        return $this->delete($moduleId);
    }
}
