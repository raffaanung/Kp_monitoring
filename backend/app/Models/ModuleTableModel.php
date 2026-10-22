<?php

namespace App\Models;

use CodeIgniter\Model;

class ModuleTableModel extends Model
{
    protected $table            = 'module_tables';
    protected $primaryKey       = 'id';
    protected $returnType       = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields    = ['id', 'module_database_id', 'table_name', 'description'];

    /** @return list<array<string, mixed>> */
    public function forDatabase(string $moduleDatabaseId): array
    {
        return $this->where('module_database_id', $moduleDatabaseId)->findAll();
    }

    public function findOrCreate(string $moduleDatabaseId, string $tableName): array
    {
        $existing = $this->where('module_database_id', $moduleDatabaseId)->where('table_name', $tableName)->first();
        if ($existing !== null) {
            return $existing;
        }
        $id = \App\Libraries\Id::new();
        $this->insert(['id' => $id, 'module_database_id' => $moduleDatabaseId, 'table_name' => $tableName], false);

        return $this->find($id);
    }
}
