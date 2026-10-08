<?php

namespace App\Models;

use CodeIgniter\Model;

class PermissionModel extends Model
{
    protected $table      = 'permissions';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    /** @return list<array{key: string, label: string, group: string}> */
    public function listCatalog(): array
    {
        $rows = $this->select('perm_key AS key, label, group_name AS "group"')
            ->orderBy('group_name', 'ASC')
            ->orderBy('label', 'ASC')
            ->findAll();

        return $rows;
    }
}
