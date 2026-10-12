<?php

namespace App\Controllers;

use App\Libraries\Id;
use App\Models\DivisionModel;
use App\Models\UserModel;
use CodeIgniter\HTTP\ResponseInterface;

class Users extends BaseController
{
    public function index(): ResponseInterface
    {
        return $this->jsonOk($this->listShaped());
    }

    public function create(): ResponseInterface
    {
        $name     = trim((string) $this->request->getJsonVar('name'));
        $username = trim((string) $this->request->getJsonVar('username'));
        $password = (string) $this->request->getJsonVar('password');
        $roleId   = $this->uuidOrNull($this->request->getJsonVar('role_id'));
        $unit     = trim((string) $this->request->getJsonVar('unit'));
        $teamIds  = $this->request->getJsonVar('team_ids') ?? [];
        $status   = (string) ($this->request->getJsonVar('status') ?: 'active');

        if ($name === '' || $roleId === null) {
            return $this->jsonError('Name and role are required', 422);
        }
        if (! preg_match('/^\d{8}$/', $username)) {
            return $this->jsonError('Username must be 8 digits', 422);
        }
        if (strlen($password) < 6) {
            return $this->jsonError('Password must be at least 6 characters', 422);
        }

        $userModel = new UserModel();
        if ($userModel->findByUsername($username) !== null) {
            return $this->jsonError('That username is already in use', 422);
        }

        $divisionId = $unit !== '' ? (new DivisionModel())->idForName($unit) : null;

        $id = Id::new();
        $userModel->insert([
            'id'            => $id,
            'name'          => $name,
            'username'      => $username,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'role_id'       => $roleId,
            'division_id'   => $divisionId,
            'status'        => $status === 'inactive' ? 'inactive' : 'active',
        ], false);

        if (is_array($teamIds) && $teamIds !== []) {
            $db = db_connect();
            foreach (array_unique(array_filter($teamIds, [Id::class, 'isValid'])) as $teamId) {
                $db->table('team_members')->insert(['team_id' => $teamId, 'user_id' => $id]);
            }
        }

        return $this->jsonOk($this->shapeOne($id));
    }

    public function update(string $id = '0'): ResponseInterface
    {
        $userModel = new UserModel();
        if ($userModel->find($id) === null) {
            return $this->jsonError('User not found', 404);
        }

        $name     = trim((string) $this->request->getJsonVar('name'));
        $username = trim((string) $this->request->getJsonVar('username'));
        $roleId   = $this->uuidOrNull($this->request->getJsonVar('role_id'));
        $unit     = trim((string) ($this->request->getJsonVar('unit') ?? ''));
        $teamIds  = $this->request->getJsonVar('team_ids') ?? [];
        $status   = (string) ($this->request->getJsonVar('status') ?: 'active');

        if ($name === '' || $roleId === null) {
            return $this->jsonError('Name and role are required', 422);
        }
        if (! preg_match('/^\d{8}$/', $username)) {
            return $this->jsonError('Username must be 8 digits', 422);
        }

        $dup = $userModel->where('username', $username)->where('id !=', $id)->first();
        if ($dup !== null) {
            return $this->jsonError('That username is already in use', 422);
        }

        $divisionId = $unit !== '' ? (new DivisionModel())->idForName($unit) : null;

        $userModel->update($id, [
            'name'        => $name,
            'username'    => $username,
            'role_id'     => $roleId,
            'division_id' => $divisionId,
            'status'      => $status === 'inactive' ? 'inactive' : 'active',
        ]);

        $db = db_connect();
        $db->table('team_members')->where('user_id', $id)->delete();
        if (is_array($teamIds) && $teamIds !== []) {
            foreach (array_unique(array_filter($teamIds, [Id::class, 'isValid'])) as $teamId) {
                $db->table('team_members')->insert(['team_id' => $teamId, 'user_id' => $id]);
            }
        }

        return $this->jsonOk($this->shapeOne($id));
    }

    /** @return list<array<string, mixed>> */
    private function listShaped(): array
    {
        $rows = (new UserModel())->listWithRole();
        $teamIdsByUser = $this->teamIdsByUser();

        return array_map(function (array $row) use ($teamIdsByUser) {
            return $this->shapeRow($row, $teamIdsByUser[$row['id']] ?? []);
        }, $rows);
    }

    private function shapeOne(string $userId): ?array
    {
        $row = (new UserModel())->withRole($userId);
        if ($row === null) {
            return null;
        }

        return $this->shapeRow($row, $this->teamIdsByUser()[$userId] ?? []);
    }

    /** @return array<string, list<string>> */
    private function teamIdsByUser(): array
    {
        $rows = db_connect()->table('team_members')->get()->getResultArray();
        $map  = [];
        foreach ($rows as $row) {
            $map[$row['user_id']][] = $row['team_id'];
        }

        return $map;
    }

    /** @param array<string, mixed> $row @param list<string> $teamIds */
    private function shapeRow(array $row, array $teamIds): array
    {
        return [
            'id'         => $row['id'],
            'name'       => $row['name'],
            'username'   => $row['username'],
            'role_id'    => $row['role_id'],
            'unit'       => $row['division_name'],
            'team_ids'   => $teamIds,
            'status'     => $row['status'],
            'created_at' => $row['created_at'],
        ];
    }
}
