<?php

namespace App\Models;

use CodeIgniter\Model;

class ModuleTableModel extends Model
{
    protected $table            = 'module_tables';
    protected $primaryKey       = 'id';
    protected $returnType       = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields    = ['id', 'module_database_id', 'table_name', 'schema_name', 'description'];

    /** @return list<array<string, mixed>> */
    public function forDatabase(string $moduleDatabaseId): array
    {
        return $this->where('module_database_id', $moduleDatabaseId)->findAll();
    }

    /**
     * Tabel untuk banyak database sekaligus, 1 query (hindari N+1 saat render pohon Data Source).
     * @param list<string> $moduleDatabaseIds
     * @return array<string, list<array<string, mixed>>> map module_database_id => tabel-tabelnya
     */
    public function forDatabases(array $moduleDatabaseIds): array
    {
        if ($moduleDatabaseIds === []) {
            return [];
        }

        $rows = $this->whereIn('module_database_id', $moduleDatabaseIds)->findAll();

        $map = [];
        foreach ($rows as $row) {
            $map[$row['module_database_id']][] = $row;
        }

        return $map;
    }

    public function findOrCreate(string $moduleDatabaseId, string $tableName, string $schemaName = 'public'): array
    {
        $existing = $this->where('module_database_id', $moduleDatabaseId)
            ->where('table_name', $tableName)
            ->where('schema_name', $schemaName)
            ->first();
        if ($existing !== null) {
            return $existing;
        }
        $id = \App\Libraries\Id::new();
        $this->insert([
            'id' => $id, 'module_database_id' => $moduleDatabaseId,
            'table_name' => $tableName, 'schema_name' => $schemaName,
        ], false);

        return $this->find($id);
    }
}
