<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table         = 'users';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields = [
        'id', 'name', 'username', 'password_hash', 'role_id', 'division_id',
        'is_external', 'status', 'avatar_path',
    ];

    public function findByUsername(string $username): ?array
    {
        return $this->where('username', $username)->first();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function withRole(string $id): ?array
    {
        return $this->select('users.*, roles.name AS role_name, divisions.name AS division_name')
            ->join('roles', 'roles.id = users.role_id', 'left')
            ->join('divisions', 'divisions.id = users.division_id', 'left')
            ->where('users.id', $id)
            ->first();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listWithRole(): array
    {
        return $this->select('users.*, roles.name AS role_name, divisions.name AS division_name')
            ->join('roles', 'roles.id = users.role_id', 'left')
            ->join('divisions', 'divisions.id = users.division_id', 'left')
            ->orderBy('users.name', 'ASC')
            ->findAll();
    }
}
