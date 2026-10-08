<?php

namespace App\Controllers;

use App\Libraries\TaskPolicy;
use App\Models\ActivityLogModel;
use App\Models\DashboardModel;
use CodeIgniter\HTTP\ResponseInterface;

class Dashboards extends BaseController
{
    public function index(): ResponseInterface
    {
        return $this->jsonOk(array_map([$this, 'shapeRow'], (new DashboardModel())->listWithDetails()));
    }

    public function create(): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canManageRegistry($user)) {
            return $this->jsonError('Anda tidak punya izin Kelola Dashboard Registry', 403);
        }

        $name        = trim((string) $this->request->getJsonVar('name'));
        $description = trim((string) ($this->request->getJsonVar('description') ?? ''));
        $pmName      = trim((string) ($this->request->getJsonVar('pm') ?? ''));
        $ownerName   = trim((string) ($this->request->getJsonVar('owner') ?? ''));
        $url         = trim((string) ($this->request->getJsonVar('url') ?? ''));
        $platform    = trim((string) ($this->request->getJsonVar('platform') ?? '')) ?: 'Custom';

        if ($name === '') {
            return $this->jsonError('Nama dashboard wajib diisi', 422);
        }

        $model = new DashboardModel();
        if ($model->where('name', $name)->first() !== null) {
            return $this->jsonError('Dashboard dengan nama itu sudah ada.', 422);
        }

        $id = $model->createDashboard([
            'name'        => $name,
            'code'        => $model->generateCode($name),
            'description' => $description,
            'status'      => 'active',
            'criticality' => 'medium',
            'owner_id'    => $model->findUserIdByName($ownerName),
            'pm_id'       => $model->findUserIdByName($pmName),
            'platform'    => $platform,
            'category'    => 'General',
            'url'         => $url,
            'version'     => '1.0',
        ]);

        $row = $this->shapeRow($model->findWithDetails($id));
        $this->logActivity($user, $id, $name, 'create', 'Dashboard dibuat', $this->diffDashboard([], $row));

        return $this->jsonOk($row);
    }

    public function update(string $id = '0'): ResponseInterface
    {
        $user        = $this->authUser();
        if (! TaskPolicy::canManageRegistry($user)) {
            return $this->jsonError('Anda tidak punya izin Kelola Dashboard Registry', 403);
        }

        $dashboardId = $id;
        $model       = new DashboardModel();
        if ($model->find($dashboardId) === null) {
            return $this->jsonError('Dashboard tidak ditemukan', 404);
        }
        $before    = $this->shapeRow($model->findWithDetails($dashboardId));
        $beforeMeta = $before['metadata'] ?? [];

        /** @var array<string, array{0: string, 1: string}> $requested field => [sebelum, sesudah] */
        $requested = [];

        $patch = [];
        foreach (['name', 'code', 'description', 'platform', 'category', 'url', 'version', 'criticality'] as $field) {
            $value = $this->request->getJsonVar($field);
            if ($value !== null) {
                $patch[$field]     = trim((string) $value);
                $requested[$field] = [(string) ($before[$field] ?? ''), $patch[$field]];
            }
        }
        if (($patch['name'] ?? null) === '') {
            return $this->jsonError('Nama tidak boleh kosong', 422);
        }
        if (($patch['code'] ?? null) === '') {
            return $this->jsonError('Code tidak boleh kosong', 422);
        }

        // Owner dan PIC disimpan sebagai id user, bukan nama. Nama yang tidak ada ditolak sebelum ada yang diubah.
        $userColumns = [];
        foreach (['owner' => ['owner_id', 'Owner'], 'pm' => ['pm_id', 'PIC']] as $input => [$column, $label]) {
            $name = $this->request->getJsonVar($input);
            if ($name === null) {
                continue;
            }
            $name   = trim((string) $name);
            $userId = $model->findUserIdByName($name);
            if ($name !== '' && $userId === null) {
                return $this->jsonError("{$label} tidak ditemukan", 422);
            }
            $userColumns[$column] = $userId;
            $requested[$input]    = [(string) ($before[$input] ?? ''), $name];
        }

        $metadata = $this->request->getJsonVar('metadata', true);
        $metadata = is_array($metadata) ? $metadata : [];
        foreach ($metadata as $key => $value) {
            $requested['meta_' . $key] = [(string) ($beforeMeta[$key] ?? ''), trim((string) $value)];
        }

        $resetCode = (bool) $this->request->getJsonVar('reset_code');

        // Izin dihitung dari perubahan nyata: mengubah isi butuh "Edit Field",
        // mengosongkan nilai yang tadinya terisi (atau kembali ke kode otomatis) butuh "Hapus Field".
        $edits  = $resetCode;
        $clears = $resetCode;
        foreach ($requested as [$from, $to]) {
            if ($from !== $to) {
                $edits = true;
            }
            if ($from !== '' && $to === '') {
                $clears = true;
            }
        }
        if ($edits && ! TaskPolicy::canEditField($user)) {
            return $this->jsonError('Anda tidak punya izin Edit Field', 403);
        }
        if ($clears && ! TaskPolicy::canDeleteField($user)) {
            return $this->jsonError('Anda tidak punya izin Hapus Field', 403);
        }

        // Hapus Code = kembali ke kode otomatis dari nama. Kode lama dikosongkan dulu (sementara unik)
        // supaya generator tidak bentrok dengan kode dashboard ini sendiri.
        if ($resetCode) {
            $current = $model->find($dashboardId);
            $model->update($dashboardId, ['code' => 'TMP' . strtoupper(bin2hex(random_bytes(4)))]);
            $patch['code'] = $model->generateCode($current['name']);
        }

        if ($patch !== []) {
            $model->update($dashboardId, $patch);
        }
        if ($userColumns !== []) {
            $model->update($dashboardId, $userColumns);
        }
        foreach ($metadata as $key => $value) {
            $model->setField($dashboardId, (string) $key, (string) $value);
        }
        $model->touch($dashboardId);

        $after   = $this->shapeRow($model->findWithDetails($dashboardId));
        $changes = $this->diffDashboard($before, $after);
        if ($changes !== []) {
            $this->logActivity($user, $dashboardId, $after['name'], 'update', 'Dashboard diubah', $changes);
        }

        return $this->jsonOk($after);
    }

    public function delete(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canManageRegistry($user)) {
            return $this->jsonError('Anda tidak punya izin Kelola Dashboard Registry', 403);
        }

        $dashboardId = $id;
        $model       = new DashboardModel();
        $dashboard   = $model->find($dashboardId);
        if ($dashboard === null) {
            return $this->jsonError('Dashboard tidak ditemukan', 404);
        }

        $model->delete($dashboardId);
        $this->logActivity($user, $dashboardId, $dashboard['name'], 'delete', 'Dashboard dihapus');

        return $this->jsonOk(['deleted' => true]);
    }

    public function changeStatus(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canManageRegistry($user)) {
            return $this->jsonError('Anda tidak punya izin Kelola Dashboard Registry', 403);
        }

        $dashboardId = $id;
        $status      = (string) $this->request->getJsonVar('status');
        if (! in_array($status, ['active', 'idle'], true)) {
            return $this->jsonError('Status tidak valid', 422);
        }

        $model = new DashboardModel();
        if ($model->find($dashboardId) === null) {
            return $this->jsonError('Dashboard tidak ditemukan', 404);
        }
        $before = $this->shapeRow($model->findWithDetails($dashboardId));

        $model->setStatus($dashboardId, $status);

        $after   = $this->shapeRow($model->findWithDetails($dashboardId));
        $changes = $this->diffDashboard($before, $after);
        if ($changes !== []) {
            $this->logActivity($user, $dashboardId, $after['name'], 'status_change', 'Status diubah', $changes);
        }

        return $this->jsonOk($after);
    }

    public function setField(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canAddField($user)) {
            return $this->jsonError('Anda tidak punya izin Tambah Field', 403);
        }

        $dashboardId = $id;
        $key         = (string) $this->request->getJsonVar('key');
        $value       = (string) ($this->request->getJsonVar('value') ?? '');

        $model = new DashboardModel();
        if ($model->find($dashboardId) === null) {
            return $this->jsonError('Dashboard tidak ditemukan', 404);
        }
        $before = $this->shapeRow($model->findWithDetails($dashboardId));

        if (! $model->setField($dashboardId, $key, $value)) {
            return $this->jsonError('Nama field wajib diisi', 422);
        }

        return $this->jsonOk($this->logFieldChange($user, $model, $dashboardId, $before));
    }

    public function renameField(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canEditField($user)) {
            return $this->jsonError('Anda tidak punya izin Edit Field', 403);
        }

        $dashboardId = $id;
        $oldKey      = (string) $this->request->getJsonVar('old_key');
        $newKey      = (string) $this->request->getJsonVar('new_key');
        $value       = (string) ($this->request->getJsonVar('value') ?? '');

        $model = new DashboardModel();
        if ($model->find($dashboardId) === null) {
            return $this->jsonError('Dashboard tidak ditemukan', 404);
        }
        $before = $this->shapeRow($model->findWithDetails($dashboardId));

        if (! $model->renameField($dashboardId, $oldKey, $newKey, $value)) {
            return $this->jsonError('Nama field wajib diisi', 422);
        }

        return $this->jsonOk($this->logFieldChange($user, $model, $dashboardId, $before));
    }

    public function removeField(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canDeleteField($user)) {
            return $this->jsonError('Anda tidak punya izin Hapus Field', 403);
        }

        $dashboardId = $id;
        $key         = (string) $this->request->getJsonVar('key');

        $model = new DashboardModel();
        if ($model->find($dashboardId) === null) {
            return $this->jsonError('Dashboard tidak ditemukan', 404);
        }
        $before = $this->shapeRow($model->findWithDetails($dashboardId));

        $model->removeField($dashboardId, $key);

        return $this->jsonOk($this->logFieldChange($user, $model, $dashboardId, $before));
    }

    /**
     * Catat perubahan field custom, lalu kembalikan baris dashboard terbaru.
     *
     * @param array<string, mixed>|null $user
     * @param array<string, mixed> $before
     * @return array<string, mixed>|null
     */
    private function logFieldChange(?array $user, DashboardModel $model, string $dashboardId, array $before): ?array
    {
        $after   = $this->shapeRow($model->findWithDetails($dashboardId));
        $changes = $this->diffDashboard($before, $after);
        if ($changes !== []) {
            $this->logActivity($user, $dashboardId, $after['name'], 'update', 'Field custom diubah', $changes);
        }

        return $after;
    }

    /**
     * Bandingkan dua snapshot dashboard. Field custom (metadata) dibandingkan per key.
     *
     * @param array<string, mixed> $before
     * @param array<string, mixed> $after
     * @return list<array{field: string, label: string, before: ?string, after: ?string}>
     */
    private function diffDashboard(array $before, array $after): array
    {
        $labels = [
            'name'        => 'Nama',
            'code'        => 'Code',
            'description' => 'Deskripsi',
            'owner'       => 'Owner',
            'pm'          => 'PM',
            'platform'    => 'Platform',
            'category'    => 'Category',
            'url'         => 'URL',
            'version'     => 'Version',
            'criticality' => 'Kritikalitas',
            'status'      => 'Status',
        ];
        $changes = (new ActivityLogModel())->diffFields($before, $after, $labels);

        $beforeMeta = $before['metadata'] ?? [];
        $afterMeta  = $after['metadata'] ?? [];
        foreach (array_unique([...array_keys($beforeMeta), ...array_keys($afterMeta)]) as $key) {
            $b = $beforeMeta[$key] ?? null;
            $a = $afterMeta[$key] ?? null;
            if ((string) $b === (string) $a) {
                continue;
            }
            $changes[] = [
                'field'  => 'meta_' . $key,
                'label'  => str_replace('_', ' ', (string) $key),
                'before' => $b === null ? null : (string) $b,
                'after'  => $a === null ? null : (string) $a,
            ];
        }

        return $changes;
    }

    /**
     * @param array<string, mixed>|null $user
     * @param list<array{field: string, label: string, before: ?string, after: ?string}> $changes
     */
    private function logActivity(?array $user, string $dashboardId, string $label, string $actionType, string $action, array $changes = []): void
    {
        (new ActivityLogModel())->logWithChanges([
            'actor_id'     => $user['id'] ?? null,
            'actor_name'   => $user['name'] ?? '',
            'action'       => $action,
            'action_type'  => $actionType,
            'object_type'  => 'dashboard',
            'object_id'    => $dashboardId,
            'object_label' => $label,
            'dashboard_id' => $dashboardId,
        ], $changes);
    }

    /** @param array<string, mixed>|null $row */
    private function shapeRow(?array $row): ?array
    {
        if ($row === null) {
            return null;
        }

        return [
            'id'          => $row['id'],
            'name'        => $row['name'],
            'code'        => $row['code'],
            'description' => $row['description'],
            'status'      => $row['status'],
            'criticality' => $row['criticality'],
            'owner'       => $row['owner_name'] ?? '',
            'pm'          => $row['pm_name'] ?? '',
            'pm_id'       => $row['pm_user_id'] ?? null,
            'platform'    => $row['platform'],
            'category'    => $row['category'],
            'url'         => $row['url'],
            'version'     => $row['version'],
            'created_at'  => $row['created_at'],
            'updated_at'  => $row['updated_at'],
            'metadata'    => $row['metadata'],
            'quick_stats' => $row['quick_stats'],
            'tasks'       => [],
            'history'     => [],
        ];
    }
}
