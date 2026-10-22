<?php

namespace App\Models;

use CodeIgniter\Model;

class ModuleModel extends Model
{
    protected $table            = 'modules';
    protected $primaryKey       = 'id';
    protected $returnType       = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields    = ['id', 'dashboard_id', 'parent_id', 'name', 'description', 'sort_order'];

    /** @return list<array<string, mixed>> Semua modul & submodul (halaman) milik 1 dashboard, flat. */
    public function forDashboard(string $dashboardId): array
    {
        return $this->where('dashboard_id', $dashboardId)
            ->orderBy('sort_order', 'ASC')
            ->orderBy('created_at', 'ASC')
            ->findAll();
    }
}
