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
}
