<?php

namespace App\Models;

use CodeIgniter\Model;

class ModuleTableFieldModel extends Model
{
    protected $table            = 'module_table_fields';
    protected $primaryKey       = 'id';
    protected $returnType       = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields    = ['id', 'module_table_id', 'display_label', 'field_name', 'field_type', 'sort_order'];

    /** @return list<array<string, mixed>> */
    public function forTables(array $moduleTableIds): array
    {
        if ($moduleTableIds === []) {
            return [];
        }

        return $this->whereIn('module_table_id', $moduleTableIds)
            ->orderBy('sort_order', 'ASC')
            ->orderBy('created_at', 'ASC')
            ->findAll();
    }
}
