<?php

namespace App\Models;

use CodeIgniter\Model;

class DivisionModel extends Model
{
    protected $table      = 'divisions';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    public function findByName(string $name): ?array
    {
        return $this->where('name', $name)->first();
    }

    public function idForName(string $name): ?string
    {
        $row = $this->findByName($name);

        return $row === null ? null : $row['id'];
    }
}
