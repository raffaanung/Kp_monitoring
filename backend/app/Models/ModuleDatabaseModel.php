<?php

namespace App\Models;

use CodeIgniter\Model;

class ModuleDatabaseModel extends Model
{
    protected $table            = 'module_databases';
    protected $primaryKey       = 'id';
    protected $returnType       = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields    = ['id', 'module_id', 'db_name', 'db_engine'];

    /** Satu modul/halaman cuma punya 1 database yang ditampilkan — ambil yang pertama. */
    public function forModule(string $moduleId): ?array
    {
        return $this->where('module_id', $moduleId)->first();
    }

    /**
     * Database untuk banyak modul sekaligus, 1 query (hindari N+1 saat render pohon Data Source).
     * @param list<string> $moduleIds
     * @return array<string, array<string, mixed>> map module_id => database row-nya
     */
    public function forModules(array $moduleIds): array
    {
        if ($moduleIds === []) {
            return [];
        }

        $rows = $this->whereIn('module_id', $moduleIds)->findAll();

        $map = [];
        foreach ($rows as $row) {
            // Satu modul harusnya cuma 1 database; kalau lebih, pakai yang pertama ketemu.
            if (! isset($map[$row['module_id']])) {
                $map[$row['module_id']] = $row;
            }
        }

        return $map;
    }
}
