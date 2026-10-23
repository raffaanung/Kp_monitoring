<?php

namespace App\Controllers;

use App\Libraries\TaskPolicy;
use App\Models\ActivityLogModel;
use App\Models\DashboardModel;
use App\Models\ModuleModel;
use App\Models\NotificationModel;
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
            return $this->jsonError('You do not have permission to manage the dashboard registry', 403);
        }

        $name        = trim((string) $this->request->getJsonVar('name'));
        $description = trim((string) ($this->request->getJsonVar('description') ?? ''));
        $pmName      = trim((string) ($this->request->getJsonVar('pm') ?? ''));
        $ownerName   = trim((string) ($this->request->getJsonVar('owner') ?? ''));
        $url         = trim((string) ($this->request->getJsonVar('url') ?? ''));
        $platform    = trim((string) ($this->request->getJsonVar('platform') ?? '')) ?: 'Custom';
        $category    = trim((string) ($this->request->getJsonVar('category') ?? ''));
        $criticality = trim((string) ($this->request->getJsonVar('criticality') ?? $this->request->getJsonVar('priority') ?? 'medium'));
        if (! in_array($criticality, ['low', 'medium', 'high'], true)) {
            $criticality = 'medium';
        }
        $metadata    = $this->request->getJsonVar('metadata', true);
        $metadata    = is_array($metadata) ? $metadata : [];

        if ($name === '') {
            return $this->jsonError('Dashboard name is required', 422);
        }

        $model = new DashboardModel();
        if ($model->where('name', $name)->first() !== null) {
            return $this->jsonError('A dashboard with that name already exists.', 422);
        }

        $pmId = $model->findUserIdByName($pmName);
        $id = $model->createDashboard([
            'name'        => $name,
            'code'        => $model->generateCode($name),
            'description' => $description,
            'status'      => 'active',
            'criticality' => $criticality,
            'owner_id'    => $model->findUserIdByName($ownerName),
            'pm_id'       => $pmId,
            'platform'    => $platform,
            'category'    => $category,
            'url'         => $url,
            'version'     => '1.0',
        ]);
        foreach ($metadata as $key => $value) {
            $value = trim((string) $value);
            $strKey = (string) $key;
            if ($value === '' || ! DashboardModel::isValidCustomKey($strKey)) {
                continue;
            }
            $model->setField($id, $strKey, $value);
        }

        $row = $this->shapeRow($model->findWithDetails($id));
        $this->logActivity($user, $id, $name, 'create', 'Dashboard created', $this->diffDashboard([], $row));

        if ($pmId && $pmId !== $user['id']) {
            try {
                (new NotificationModel())->notify(
                    'dashboard_assigned',
                    'Dashboard ditugaskan',
                    "{$user['name']} menugaskan Anda sebagai PM untuk dashboard \"{$name}\"",
                    $pmId,
                    null,
                    $id
                );
            } catch (\Throwable $e) {
                log_message('error', 'Failed to send dashboard assignment notification: ' . $e->getMessage());
            }
        }

        return $this->jsonOk($row);
    }

    public function update(string $id = '0'): ResponseInterface
    {
        $user        = $this->authUser();
        $dashboardId = $id;
        $model       = new DashboardModel();
        $dashboard   = $model->find($dashboardId);
        if ($dashboard === null) {
            return $this->jsonError('Dashboard not found', 404);
        }

        $canManage = TaskPolicy::canManageRegistry($user)
            || TaskPolicy::isPmOfDashboard($user, $dashboard)
            || TaskPolicy::canEditField($user);

        if (! $canManage) {
            return $this->jsonError('You do not have permission to manage the dashboard registry', 403);
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
            return $this->jsonError('Name cannot be empty', 422);
        }
        if (($patch['code'] ?? null) === '') {
            return $this->jsonError('Code cannot be empty', 422);
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
                return $this->jsonError("{$label} not found", 422);
            }
            $userColumns[$column] = $userId;
            $requested[$input]    = [(string) ($before[$input] ?? ''), $name];
        }

        $metadata = $this->request->getJsonVar('metadata', true);
        $metadata = is_array($metadata) ? $metadata : [];
        foreach ($metadata as $key => $value) {
            $strKey = (string) $key;
            if (! DashboardModel::isValidCustomKey($strKey)) {
                continue;
            }
            $requested['meta_' . $strKey] = [(string) ($beforeMeta[$strKey] ?? ''), trim((string) $value)];
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
            return $this->jsonError('You do not have permission to edit a field', 403);
        }
        if ($clears && ! TaskPolicy::canDeleteField($user)) {
            return $this->jsonError('You do not have permission to delete a field', 403);
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
            $strKey = (string) $key;
            if (! DashboardModel::isValidCustomKey($strKey)) {
                continue;
            }
            $model->setField($dashboardId, $strKey, (string) $value);
        }
        $model->touch($dashboardId);

        $after   = $this->shapeRow($model->findWithDetails($dashboardId));
        $changes = $this->diffDashboard($before, $after);
        if ($changes !== []) {
            $this->logActivity($user, $dashboardId, $after['name'], 'update', 'Dashboard updated', $changes);
        }

        if (array_key_exists('pm_id', $userColumns)) {
            $newPmId = $userColumns['pm_id'];
            $oldPmId = $model->findUserIdByName((string) ($before['pm'] ?? ''));
            if ($newPmId && $newPmId !== $oldPmId && $newPmId !== $user['id']) {
                try {
                    (new NotificationModel())->notify(
                        'dashboard_assigned',
                        'Dashboard ditugaskan',
                        "{$user['name']} menugaskan Anda sebagai PM untuk dashboard \"{$after['name']}\"",
                        $newPmId,
                        null,
                        $dashboardId
                    );
                } catch (\Throwable $e) {
                    log_message('error', 'Failed to send dashboard assignment notification: ' . $e->getMessage());
                }
            }
        }

        return $this->jsonOk($after);
    }

    public function delete(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canManageRegistry($user)) {
            return $this->jsonError('You do not have permission to manage the dashboard registry', 403);
        }

        $dashboardId = $id;
        $model       = new DashboardModel();
        $dashboard   = $model->find($dashboardId);
        if ($dashboard === null) {
            return $this->jsonError('Dashboard not found', 404);
        }

        $model->delete($dashboardId);
        $this->logActivity($user, $dashboardId, $dashboard['name'], 'delete', 'Dashboard deleted');

        return $this->jsonOk(['deleted' => true]);
    }

    public function changeStatus(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canManageRegistry($user)) {
            return $this->jsonError('You do not have permission to manage the dashboard registry', 403);
        }

        $dashboardId = $id;
        $status      = (string) $this->request->getJsonVar('status');
        if (! in_array($status, ['active', 'idle'], true)) {
            return $this->jsonError('That status is not valid', 422);
        }

        $model = new DashboardModel();
        if ($model->find($dashboardId) === null) {
            return $this->jsonError('Dashboard not found', 404);
        }
        $before = $this->shapeRow($model->findWithDetails($dashboardId));

        $model->setStatus($dashboardId, $status);

        $after   = $this->shapeRow($model->findWithDetails($dashboardId));
        $changes = $this->diffDashboard($before, $after);
        if ($changes !== []) {
            $this->logActivity($user, $dashboardId, $after['name'], 'status_change', 'Status changed', $changes);
        }

        return $this->jsonOk($after);
    }

    /** Ganti Work Priority (criticality) — endpoint sendiri (bukan lewat update() yang butuh "manage_registry" penuh), supaya PIC dashboard ini juga boleh switch tanpa dikasih akses edit field lain. */
    public function changeCriticality(string $id = '0'): ResponseInterface
    {
        $user      = $this->authUser();
        $model     = new DashboardModel();
        $dashboard = $model->find($id);
        if ($dashboard === null) {
            return $this->jsonError('Dashboard not found', 404);
        }
        if (! TaskPolicy::canManageRegistry($user) && ! TaskPolicy::isPmOfDashboard($user, $dashboard)) {
            return $this->jsonError("Only an Admin or this dashboard's PIC can change the work priority", 403);
        }

        $dashboardId = $id;
        $criticality = (string) $this->request->getJsonVar('criticality');
        if (! in_array($criticality, ['low', 'medium', 'high'], true)) {
            return $this->jsonError('That priority is not valid', 422);
        }

        $before = $this->shapeRow($model->findWithDetails($dashboardId));
        $model->setCriticality($dashboardId, $criticality);

        $after   = $this->shapeRow($model->findWithDetails($dashboardId));
        $changes = $this->diffDashboard($before, $after);
        if ($changes !== []) {
            $this->logActivity($user, $dashboardId, $after['name'], 'update', 'Work priority changed', $changes);
        }

        return $this->jsonOk($after);
    }

    public function setField(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canEditField($user)) {
            return $this->jsonError('You do not have permission to edit a field', 403);
        }

        $dashboardId = $id;
        $key         = (string) $this->request->getJsonVar('key');
        $value       = (string) ($this->request->getJsonVar('value') ?? '');

        $model = new DashboardModel();
        if ($model->find($dashboardId) === null) {
            return $this->jsonError('Dashboard not found', 404);
        }
        $before = $this->shapeRow($model->findWithDetails($dashboardId));

        if (! $model->setField($dashboardId, $key, $value)) {
            return $this->jsonError('This field is not part of the standard format', 422);
        }

        return $this->jsonOk($this->logFieldChange($user, $model, $dashboardId, $before));
    }

    public function renameField(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canEditField($user)) {
            return $this->jsonError('You do not have permission to edit a field', 403);
        }

        $dashboardId = $id;
        $oldKey      = (string) $this->request->getJsonVar('old_key');
        $newKey      = (string) $this->request->getJsonVar('new_key');
        $value       = (string) ($this->request->getJsonVar('value') ?? '');

        $model = new DashboardModel();
        if ($model->find($dashboardId) === null) {
            return $this->jsonError('Dashboard not found', 404);
        }
        $before = $this->shapeRow($model->findWithDetails($dashboardId));

        if (! $model->renameField($dashboardId, $oldKey, $newKey, $value)) {
            return $this->jsonError('Standard field names cannot be changed', 422);
        }

        return $this->jsonOk($this->logFieldChange($user, $model, $dashboardId, $before));
    }

    public function removeField(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canDeleteField($user)) {
            return $this->jsonError('You do not have permission to delete a field', 403);
        }

        $dashboardId = $id;
        $key         = (string) $this->request->getJsonVar('key');

        $model = new DashboardModel();
        if ($model->find($dashboardId) === null) {
            return $this->jsonError('Dashboard not found', 404);
        }
        return $this->jsonError('Standard fields cannot be deleted', 422);
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
            $this->logActivity($user, $dashboardId, $after['name'], 'update', 'Custom field updated', $changes);
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
            'category'    => 'Unit',
            'url'         => 'URL',
            'version'     => 'Version',
            'criticality' => 'Kritikalitas',
            'status'      => 'Status',
        ];
        $changes = (new ActivityLogModel())->diffFields($before, $after, $labels);

        $beforeMeta = $before['metadata'] ?? [];
        $afterMeta  = $after['metadata'] ?? [];
        $metaLabels = [
            'development_db'       => 'Development Database Engine',
            'development_ip'       => 'Development IP Address',
            'development_db_name'  => 'Development Database Name',
            'development_db_user'  => 'Development Database Username',
            'development_db_pass'  => 'Development Password',
            'production_db'        => 'Production Database Engine',
            'production_ip'        => 'Production IP Address',
            'production_db_name'   => 'Production Database Name',
            'production_db_user'   => 'Production Database Username',
            'production_db_pass'   => 'Production Password',
            'development_link'     => 'Development link',
            'production_link'      => 'Production link',
            'source_system'        => 'Source system',
            'deploy'               => 'Deploy',
            'framework'            => 'Framework',
            'framework_version'    => 'Framework Version',
            'backend'              => 'Backend',
            'backend_version'      => 'Backend Version',
            'frontend'             => 'Front End',
        ];
        foreach (array_unique([...array_keys($beforeMeta), ...array_keys($afterMeta)]) as $key) {
            $b = $beforeMeta[$key] ?? null;
            $a = $afterMeta[$key] ?? null;
            if ((string) $b === (string) $a) {
                continue;
            }
            $secret = str_ends_with((string) $key, '_pass');
            $changes[] = [
                'field'  => 'meta_' . $key,
                'label'  => $metaLabels[$key] ?? str_replace('_', ' ', (string) $key),
                'before' => $b === null || $b === '' ? null : ($secret ? '••••••' : (string) $b),
                'after'  => $a === null || $a === '' ? null : ($secret ? '••••••' : (string) $a),
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
            'modules'     => $row['modules'] ?? [],
            'tasks'       => [],
            'history'     => [],
        ];
    }

    public static function defaultFormSchema(): array
    {
        return [
            'profile_fields' => [
                ['key' => 'framework', 'label' => 'Framework', 'placeholder' => 'Contoh: SvelteKit', 'type' => 'text', 'required' => false],
                ['key' => 'framework_version', 'label' => 'Framework Version', 'placeholder' => 'Contoh: 2.5', 'type' => 'text', 'required' => false],
                ['key' => 'backend', 'label' => 'Backend', 'placeholder' => 'Contoh: CodeIgniter', 'type' => 'text', 'required' => false],
                ['key' => 'backend_version', 'label' => 'Backend Version', 'placeholder' => 'Contoh: 4.5', 'type' => 'text', 'required' => false],
                ['key' => 'frontend', 'label' => 'Front End', 'placeholder' => 'Contoh: Svelte', 'type' => 'text', 'required' => false],
            ],
            'env_fields' => [
                ['key' => 'db', 'label' => 'Database Engine', 'placeholder' => 'Contoh: PostgreSQL', 'type' => 'text', 'required' => false],
                ['key' => 'ip', 'label' => 'IP Address', 'placeholder' => 'Contoh: 10.0.0.12', 'type' => 'text', 'required' => false],
                ['key' => 'db_name', 'label' => 'Database Name', 'placeholder' => 'Database name', 'type' => 'text', 'required' => false],
                ['key' => 'db_user', 'label' => 'Database Username', 'placeholder' => 'Database username', 'type' => 'text', 'required' => false],
                ['key' => 'db_pass', 'label' => 'Password', 'placeholder' => 'Database password', 'type' => 'password', 'secret' => true, 'required' => false],
            ],
            'custom_fields' => [],
        ];
    }

    public function getFormSchema(): ResponseInterface
    {
        $schemaPath = WRITEPATH . 'dashboard_form_schema.json';
        if (file_exists($schemaPath)) {
            $content = file_get_contents($schemaPath);
            $data = json_decode((string) $content, true);
            if (is_array($data) && isset($data['profile_fields'], $data['env_fields'])) {
                return $this->jsonOk($data);
            }
        }

        return $this->jsonOk(self::defaultFormSchema());
    }

    public function saveFormSchema(): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canEditDashboardForm($user)) {
            return $this->jsonError('You do not have permission to edit the dashboard form schema', 403);
        }

        $profileFields = $this->request->getJsonVar('profile_fields', true);
        $envFields     = $this->request->getJsonVar('env_fields', true);
        $customFields  = $this->request->getJsonVar('custom_fields', true);

        if (! is_array($profileFields) || ! is_array($envFields)) {
            return $this->jsonError('Invalid form schema payload', 422);
        }

        $sanitize = static function (array $list): array {
            $cleaned = [];
            foreach ($list as $item) {
                if (! is_array($item)) continue;
                $key = trim((string) ($item['key'] ?? ''));
                $label = trim((string) ($item['label'] ?? ''));
                if ($key === '' || $label === '') continue;
                $key = preg_replace('/[^a-zA-Z0-9_\-]/', '_', strtolower($key));
                $cleaned[] = [
                    'key'         => $key,
                    'label'       => $label,
                    'placeholder' => trim((string) ($item['placeholder'] ?? '')),
                    'type'        => in_array($item['type'] ?? '', ['text', 'textarea', 'password', 'select'], true) ? $item['type'] : 'text',
                    'secret'      => ! empty($item['secret']),
                    'required'    => ! empty($item['required']),
                ];
            }
            return $cleaned;
        };

        $schema = [
            'profile_fields' => $sanitize($profileFields),
            'env_fields'     => $sanitize($envFields),
            'custom_fields'  => is_array($customFields) ? $sanitize($customFields) : [],
            'updated_at'     => date('Y-m-d H:i:s'),
            'updated_by'     => $user['name'] ?? 'System',
        ];

        $schemaPath = WRITEPATH . 'dashboard_form_schema.json';
        file_put_contents($schemaPath, json_encode($schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        return $this->jsonOk($schema);
    }

    public function resetFormSchema(): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canEditDashboardForm($user)) {
            return $this->jsonError('You do not have permission to reset the dashboard form schema', 403);
        }

        $schemaPath = WRITEPATH . 'dashboard_form_schema.json';
        if (file_exists($schemaPath)) {
            @unlink($schemaPath);
        }

        return $this->jsonOk(self::defaultFormSchema());
    }

    /**
     * List all modules for a dashboard
     */
    public function listModules(string $id = '0'): ResponseInterface
    {
        $dashboard = (new DashboardModel())->find($id);
        if ($dashboard === null) {
            return $this->jsonError('Dashboard not found', 404);
        }

        $modules = (new ModuleModel())->listByDashboard($id);

        return $this->jsonOk($modules);
    }

    /**
     * Create a new module for a dashboard
     */
    public function createModule(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canManageRegistry($user)) {
            return $this->jsonError('You do not have permission to manage modules', 403);
        }

        $dashboard = (new DashboardModel())->find($id);
        if ($dashboard === null) {
            return $this->jsonError('Dashboard not found', 404);
        }

        $name        = trim((string) $this->request->getJsonVar('name'));
        $description = trim((string) ($this->request->getJsonVar('description') ?? ''));
        $parentId    = trim((string) ($this->request->getJsonVar('parent_id') ?? '')) ?: null;

        if ($name === '') {
            return $this->jsonError('Module name is required', 422);
        }

        $model = new ModuleModel();
        $moduleId = $model->createModule([
            'dashboard_id' => $id,
            'name'         => $name,
            'description'  => $description,
            'parent_id'    => $parentId,
        ]);

        $created = $model->find($moduleId);

        $this->logActivity(
            $user,
            $id,
            $dashboard['name'],
            'module_create',
            "Module \"{$name}\" added",
            [['field' => 'module', 'label' => 'Modul', 'before' => null, 'after' => $name]]
        );

        return $this->jsonOk($created);
    }

    /**
     * Update an existing module
     */
    public function updateModule(string $id = '0', string $moduleId = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canManageRegistry($user)) {
            return $this->jsonError('You do not have permission to manage modules', 403);
        }

        $dashboard = (new DashboardModel())->find($id);
        if ($dashboard === null) {
            return $this->jsonError('Dashboard not found', 404);
        }

        $model  = new ModuleModel();
        $module = $model->where('id', $moduleId)->where('dashboard_id', $id)->first();
        if ($module === null) {
            return $this->jsonError('Module not found', 404);
        }

        $name        = trim((string) ($this->request->getJsonVar('name') ?? $module['name']));
        $description = trim((string) ($this->request->getJsonVar('description') ?? $module['description']));

        if ($name === '') {
            return $this->jsonError('Module name cannot be empty', 422);
        }

        $beforeName = $module['name'];
        $model->update($moduleId, [
            'name'        => $name,
            'description' => $description,
        ]);

        $updated = $model->find($moduleId);

        $this->logActivity(
            $user,
            $id,
            $dashboard['name'],
            'module_update',
            "Module \"{$name}\" updated",
            [['field' => 'module', 'label' => 'Modul', 'before' => $beforeName, 'after' => $name]]
        );

        return $this->jsonOk($updated);
    }

    /**
     * Delete a module
     */
    public function deleteModule(string $id = '0', string $moduleId = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canManageRegistry($user)) {
            return $this->jsonError('You do not have permission to manage modules', 403);
        }

        $dashboard = (new DashboardModel())->find($id);
        if ($dashboard === null) {
            return $this->jsonError('Dashboard not found', 404);
        }

        $model  = new ModuleModel();
        $module = $model->where('id', $moduleId)->where('dashboard_id', $id)->first();
        if ($module === null) {
            return $this->jsonError('Module not found', 404);
        }

        $moduleName = $module['name'];
        $model->deleteModule($moduleId);

        $this->logActivity(
            $user,
            $id,
            $dashboard['name'],
            'module_delete',
            "Module \"{$moduleName}\" deleted",
            [['field' => 'module', 'label' => 'Modul', 'before' => $moduleName, 'after' => null]]
        );

        return $this->jsonOk(['ok' => true]);
    }
}
