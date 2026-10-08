<?php

namespace App\Models;

use CodeIgniter\Model;

class RoleModel extends Model
{
    protected $table         = 'roles';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields = ['id', 'name', 'description', 'scope'];

    /** @return list<array<string, mixed>> */
    public function listWithPermissions(): array
    {
        $roles = $this->where('scope', 'global')->orderBy('created_at', 'ASC')->orderBy('name', 'ASC')->findAll();

        $permissions = (new PermissionModel())->listCatalog();
        $db          = db_connect();

        $permRows = $db->table('permissions')->select('id, perm_key')->get()->getResultArray();
        $idToKey  = [];
        foreach ($permRows as $p) {
            $idToKey[$p['id']] = $p['perm_key'];
        }

        $rolePerms = $db->table('role_permissions')->select('role_id, permission_id')->get()->getResultArray();
        $grantedByRole = [];
        foreach ($rolePerms as $row) {
            $grantedByRole[$row['role_id']][] = $idToKey[$row['permission_id']] ?? null;
        }

        foreach ($roles as &$role) {
            $granted    = $grantedByRole[$role['id']] ?? [];
            $perms   = [];
            foreach ($permissions as $p) {
                $perms[$p['key']] = in_array($p['key'], $granted, true);
            }
            $role['permissions'] = $perms;
        }

        return $roles;
    }

    /** @return list<string> perm_key yang dicentang untuk role ini */
    public function permissionKeysFor(string $roleId): array
    {
        $rows = db_connect()->table('role_permissions rp')
            ->select('p.perm_key')
            ->join('permissions p', 'p.id = rp.permission_id')
            ->where('rp.role_id', $roleId)
            ->get()
            ->getResultArray();

        return array_column($rows, 'perm_key');
    }

    public function countUsers(string $roleId): int
    {
        return (new UserModel())->where('role_id', $roleId)->countAllResults();
    }

    /** @param array<string, bool> $permissions */
    public function syncPermissions(string $roleId, array $permissions): void
    {
        $db = db_connect();
        $db->table('role_permissions')->where('role_id', $roleId)->delete();

        $permRows = $db->table('permissions')->select('id, perm_key')->get()->getResultArray();
        $keyToId  = [];
        foreach ($permRows as $p) {
            $keyToId[$p['perm_key']] = $p['id'];
        }

        $insert = [];
        foreach ($permissions as $key => $granted) {
            if ($granted && isset($keyToId[$key])) {
                $insert[] = ['role_id' => $roleId, 'permission_id' => $keyToId[$key]];
            }
        }

        if ($insert !== []) {
            $db->table('role_permissions')->insertBatch($insert);
        }
    }

    public function setPermission(string $roleId, string $permKey, bool $value): bool
    {
        $db       = db_connect();
        $permRow  = $db->table('permissions')->select('id')->where('perm_key', $permKey)->get()->getRowArray();
        if ($permRow === null) {
            return false;
        }
        $permissionId = $permRow['id'];

        if ($value) {
            $exists = $db->table('role_permissions')
                ->where('role_id', $roleId)->where('permission_id', $permissionId)
                ->countAllResults();
            if ($exists === 0) {
                $db->table('role_permissions')->insert(['role_id' => $roleId, 'permission_id' => $permissionId]);
            }
        } else {
            $db->table('role_permissions')->where('role_id', $roleId)->where('permission_id', $permissionId)->delete();
        }

        return true;
    }
}
