<?php

namespace App\Controllers;

use App\Libraries\Id;
use App\Libraries\TaskPolicy;
use App\Models\RequirementModel;
use App\Models\UserModel;
use CodeIgniter\HTTP\ResponseInterface;

class Requirements extends BaseController
{
    public function index(): ResponseInterface
    {
        return $this->jsonOk(array_map([$this, 'shapeRow'], (new RequirementModel())->listWithDetails()));
    }

    public function create(): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canCreateRequirement($user)) {
            return $this->jsonError('You do not have permission to add a requirement', 403);
        }

        $dashboardName = trim((string) $this->request->getJsonVar('dashboard'));
        $title         = trim((string) $this->request->getJsonVar('title'));
        $description   = trim((string) ($this->request->getJsonVar('description') ?? ''));
        $dueDate       = (string) ($this->request->getJsonVar('due_date') ?? '') ?: date('Y-m-d');
        $team          = $this->request->getJsonVar('team') ?? [];
        $createdByName = trim((string) ($this->request->getJsonVar('created_by') ?? ''));

        if ($title === '' || $dashboardName === '') {
            return $this->jsonError('Title and dashboard are required', 422);
        }

        $model       = new RequirementModel();
        $dashboardId = $model->dashboardIdForName($dashboardName);
        if ($dashboardId === null) {
            return $this->jsonError('Dashboard not found', 422);
        }

        $creator     = $createdByName !== '' ? (new UserModel())->where('name', $createdByName)->first() : null;
        $createdById = $creator['id'] ?? $user['id'] ?? null;

        $id = Id::new();
        $model->insert([
            'id'           => $id,
            'code'         => $model->nextCode(),
            'dashboard_id' => $dashboardId,
            'title'        => $title,
            'description'  => $description,
            'status'       => 'open',
            'health'       => 'on_track',
            'due_date'     => $dueDate,
            'created_by'   => $createdById,
        ], false);

        if (is_array($team) && $team !== []) {
            $ids = $this->userIdsForNames($team);
            if ($ids !== []) {
                $model->syncTeam($id, $ids);
            }
        }

        return $this->jsonOk($this->shapeRow($model->findWithDetails($id)));
    }

    public function update(string $id = '0'): ResponseInterface
    {
        $user  = $this->authUser();
        $reqId = $id;
        $model = new RequirementModel();
        if ($model->find($reqId) === null) {
            return $this->jsonError('Requirement not found', 404);
        }

        $patch = [];
        foreach (['title', 'description', 'status', 'health'] as $field) {
            $value = $this->request->getJsonVar($field);
            if ($value !== null) {
                $patch[$field] = is_string($value) ? trim($value) : $value;
            }
        }
        $dueDate = $this->request->getJsonVar('due_date');
        if ($dueDate !== null) {
            $patch['due_date'] = $dueDate ?: null;
        }
        if ($patch !== []) {
            $model->update($reqId, $patch);
        }

        $team = $this->request->getJsonVar('team');
        if (is_array($team)) {
            if (! TaskPolicy::canAddAssignee($user)) {
                return $this->jsonError('You do not have permission to add an assignee', 403);
            }
            $model->syncTeam($reqId, $this->userIdsForNames($team));
        }

        return $this->jsonOk($this->shapeRow($model->findWithDetails($reqId)));
    }

    public function delete(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canCreateRequirement($user)) {
            return $this->jsonError('You do not have permission to delete this version', 403);
        }

        $reqId = $id;
        $model = new RequirementModel();
        if ($model->find($reqId) === null) {
            return $this->jsonError('Requirement not found', 404);
        }

        $model->delete($reqId);

        return $this->jsonOk(['id' => $reqId]);
    }

    /**
     * Buat versi baru (V2, V3, dst) dari requirement yang sudah ada. Judul, deskripsi, dan tim
     * bisa diisi dari request; kalau kosong, disalin dari versi sumber. Status dan health di-reset,
     * dan task-nya mulai kosong (task adalah milik satu versi, bukan grup).
     */
    public function createVersion(string $id = '0'): ResponseInterface
    {
        $sourceId = $id;
        $model    = new RequirementModel();
        $source   = $model->find($sourceId);
        if ($source === null) {
            return $this->jsonError('Requirement not found', 404);
        }

        $user = $this->authUser();
        if (! TaskPolicy::canCreateRequirement($user)) {
            return $this->jsonError('You do not have permission to add a requirement', 403);
        }

        $rootId  = $source['version_root_id'] ?: $source['id'];
        $nextNo  = $model->nextVersionNo($rootId);

        $titleIn       = $this->request->getJsonVar('title');
        $descriptionIn = $this->request->getJsonVar('description');
        $teamIn        = $this->request->getJsonVar('team');

        $title       = $titleIn !== null && trim((string) $titleIn) !== '' ? trim((string) $titleIn) : $source['title'];
        $description = $descriptionIn !== null ? trim((string) $descriptionIn) : $source['description'];

        $newId = Id::new();
        $model->insert([
            'id'              => $newId,
            'code'            => $source['code'],
            'dashboard_id'    => $source['dashboard_id'],
            'title'           => $title,
            'description'     => $description,
            'status'          => 'open',
            'health'          => 'on_track',
            'due_date'        => $source['due_date'],
            'created_by'      => $user['id'] ?? $source['created_by'],
            'version_no'      => $nextNo,
            'version_root_id' => $rootId,
        ], false);

        if (is_array($teamIn)) {
            $ids = $this->userIdsForNames($teamIn);
            if ($ids !== []) {
                $model->syncTeam($newId, $ids);
            }
        } else {
            $teamRows = db_connect()->table('requirement_team_members')
                ->select('user_id')
                ->where('requirement_id', $sourceId)
                ->get()->getResultArray();
            $teamIds = array_column($teamRows, 'user_id');
            if ($teamIds !== []) {
                $model->syncTeam($newId, $teamIds);
            }
        }

        return $this->jsonOk($this->shapeRow($model->findWithDetails($newId)));
    }

    /** @param array<int, mixed> $names @return list<string> */
    private function userIdsForNames(array $names): array
    {
        $userModel = new UserModel();
        $ids       = [];
        foreach ($names as $name) {
            $row = $userModel->where('name', trim((string) $name))->first();
            if ($row !== null) {
                $ids[] = $row['id'];
            }
        }

        return $ids;
    }

    /** @param array<string, mixed>|null $row */
    private function shapeRow(?array $row): ?array
    {
        if ($row === null) {
            return null;
        }

        return [
            'id'              => $row['id'],
            'code'            => $row['code'] ?? '',
            'dashboard'       => $row['dashboard_name'] ?? '',
            'title'           => $row['title'],
            'description'     => $row['description'],
            'status'          => $row['status'],
            'health'          => $row['health'],
            'due_date'        => $row['due_date'],
            'team'            => $row['team'],
            'created_by'      => $row['created_by_name'] ?? '',
            'created_at'      => $row['created_at'],
            'updated_at'      => $row['updated_at'],
            'version_no'      => (int) ($row['version_no'] ?? 1),
            'version_root_id' => $row['version_root_id'] ?? null,
        ];
    }
}
