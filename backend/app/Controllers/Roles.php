<?php

namespace App\Controllers;

use App\Libraries\Id;
use App\Libraries\TaskPolicy;
use App\Models\PermissionModel;
use App\Models\RoleModel;
use CodeIgniter\HTTP\ResponseInterface;

class Roles extends BaseController
{
    public function index(): ResponseInterface
    {
        return $this->jsonOk((new RoleModel())->listWithPermissions());
    }

    public function permissions(): ResponseInterface
    {
        return $this->jsonOk((new PermissionModel())->listCatalog());
    }

    public function create(): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null || ! TaskPolicy::canManageRoles($user)) {
            return $this->jsonError('You are not allowed to manage roles', 403);
        }

        $name        = trim((string) $this->request->getJsonVar('name'));
        $description = trim((string) ($this->request->getJsonVar('description') ?? ''));
        $permissions = $this->request->getJsonVar('permissions', true) ?? [];

        if ($name === '') {
            return $this->jsonError('Role name is required', 422);
        }

        $model = new RoleModel();
        if ($model->where('scope', 'global')->where('name', $name)->first() !== null) {
            return $this->jsonError('That role name is already in use', 422);
        }

        $id = Id::new();
        $model->insert(['id' => $id, 'name' => $name, 'description' => $description, 'scope' => 'global'], false);
        if (is_array($permissions) && $permissions !== []) {
            $model->syncPermissions($id, $permissions);
        }

        return $this->jsonOk($this->findShaped($id));
    }

    public function update(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null || ! TaskPolicy::canManageRoles($user)) {
            return $this->jsonError('You are not allowed to manage roles', 403);
        }

        $roleId = $id;
        $model  = new RoleModel();
        $role   = $model->find($roleId);
        if ($role === null) {
            return $this->jsonError('Role not found', 404);
        }

        $name        = trim((string) $this->request->getJsonVar('name'));
        $description = trim((string) ($this->request->getJsonVar('description') ?? ''));
        $permissions = $this->request->getJsonVar('permissions', true);

        if ($name === '') {
            return $this->jsonError('Role name is required', 422);
        }
        $dup = $model->where('scope', 'global')->where('name', $name)->where('id !=', $roleId)->first();
        if ($dup !== null) {
            return $this->jsonError('That role name is already in use', 422);
        }

        $model->update($roleId, ['name' => $name, 'description' => $description]);
        if (is_array($permissions)) {
            $model->syncPermissions($roleId, $permissions);
        }

        return $this->jsonOk($this->findShaped($roleId));
    }

    public function delete(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null || ! TaskPolicy::canManageRoles($user)) {
            return $this->jsonError('You are not allowed to manage roles', 403);
        }

        $roleId = $id;
        $model  = new RoleModel();
        $role   = $model->find($roleId);
        if ($role === null) {
            return $this->jsonError('Role not found', 404);
        }

        $used = $model->countUsers($roleId);
        if ($used > 0) {
            return $this->jsonError("Role is still assigned to {$used} user. Move those users to another role first.", 422);
        }
        if ($model->where('scope', 'global')->countAllResults() <= 1) {
            return $this->jsonError('At least one role is required', 422);
        }

        $model->delete($roleId);

        return $this->jsonOk(['deleted' => true]);
    }

    public function setPermission(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null || ! TaskPolicy::canManageRoles($user)) {
            return $this->jsonError('You are not allowed to manage roles', 403);
        }

        $roleId  = $id;
        $permKey = (string) $this->request->getJsonVar('perm_key');
        $value   = (bool) $this->request->getJsonVar('value');

        $model = new RoleModel();
        if ($model->find($roleId) === null) {
            return $this->jsonError('Role not found', 404);
        }

        $ok = $model->setPermission($roleId, $permKey, $value);
        if (! $ok) {
            return $this->jsonError('Permission not found', 404);
        }

        return $this->jsonOk($this->findShaped($roleId));
    }

    private function findShaped(string $roleId): ?array
    {
        foreach ((new RoleModel())->listWithPermissions() as $role) {
            if ($role['id'] === $roleId) {
                return $role;
            }
        }

        return null;
    }
}
