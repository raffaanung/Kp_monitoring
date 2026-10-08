<?php

namespace App\Models;

use App\Libraries\Id;
use CodeIgniter\Model;

class DashboardModel extends Model
{
    protected $table         = 'dashboards';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useAutoIncrement = false;
    protected $useSoftDeletes = true;
    protected $deletedField  = 'deleted_at';
    protected $allowedFields = [
        'id', 'dashboard_type_id', 'name', 'code', 'description', 'status', 'criticality',
        'owner_id', 'pm_id', 'requester_id', 'platform', 'category', 'url', 'version',
    ];

    /** @return list<array<string, mixed>> */
    public function listWithDetails(): array
    {
        $rows = $this->select('dashboards.*, owner.name AS owner_name, pm.name AS pm_name, pm.id AS pm_user_id')
            ->join('users AS owner', 'owner.id = dashboards.owner_id', 'left')
            ->join('users AS pm', 'pm.id = dashboards.pm_id', 'left')
            ->orderBy('dashboards.updated_at', 'DESC')
            ->findAll();

        $db = db_connect();

        $fieldRows = $db->table('dashboard_fields')->select('dashboard_id, field_key, field_value')->get()->getResultArray();
        $fieldsByDashboard = [];
        foreach ($fieldRows as $f) {
            $fieldsByDashboard[$f['dashboard_id']][$f['field_key']] = $f['field_value'];
        }

        $taskStats = $db->table('tasks')
            ->select('dashboard_id, status, COUNT(*) AS c')
            ->where('deleted_at', null)
            ->groupBy('dashboard_id, status')
            ->get()->getResultArray();
        $tasksByDashboard = [];
        foreach ($taskStats as $t) {
            $id = $t['dashboard_id'];
            $tasksByDashboard[$id]['total'] = ($tasksByDashboard[$id]['total'] ?? 0) + (int) $t['c'];
            if ($t['status'] === 'selesai') {
                $tasksByDashboard[$id]['done'] = ($tasksByDashboard[$id]['done'] ?? 0) + (int) $t['c'];
            }
        }

        // Dihitung per requirement (root), bukan per baris — V2 dst bukan requirement terpisah.
        $reqCounts = $db->table('requirements')
            ->select('dashboard_id, COUNT(DISTINCT COALESCE(version_root_id, id)) AS c')
            ->where('deleted_at', null)
            ->groupBy('dashboard_id')
            ->get()->getResultArray();
        $reqByDashboard = [];
        foreach ($reqCounts as $r) {
            $reqByDashboard[$r['dashboard_id']] = (int) $r['c'];
        }

        foreach ($rows as &$row) {
            $id = $row['id'];
            $stats = $tasksByDashboard[$id] ?? ['total' => 0, 'done' => 0];
            $row['metadata'] = $fieldsByDashboard[$id] ?? [];
            $row['quick_stats'] = [
                'tasks_total'        => $stats['total'] ?? 0,
                'tasks_open'         => ($stats['total'] ?? 0) - ($stats['done'] ?? 0),
                'tasks_done'         => $stats['done'] ?? 0,
                'last_change'        => substr((string) $row['updated_at'], 0, 10),
                'requirements_total' => $reqByDashboard[$id] ?? 0,
            ];
        }

        return $rows;
    }

    public function findWithDetails(string $id): ?array
    {
        foreach ($this->listWithDetails() as $row) {
            if ($row['id'] === $id) {
                return $row;
            }
        }

        return null;
    }

    /** @param array<string, mixed> $data */
    public function createDashboard(array $data): string
    {
        $data['id'] = Id::new();
        $this->insert($data, false);

        return $data['id'];
    }

    /** Mirrors registryStore.svelte.js's createDashboard() code generator for parity. */
    public function generateCode(string $name): string
    {
        preg_match_all('/[A-Za-z0-9]+/', $name, $matches);
        $initials = '';
        foreach ($matches[0] as $word) {
            $initials .= strtoupper($word[0]);
        }
        $base = substr($initials, 0, 6) ?: 'DB';

        $code = $base;
        $n    = 2;
        while ($this->where('code', $code)->first() !== null) {
            $code = $base . $n;
            $n++;
        }

        return $code;
    }

    public function findUserIdByName(?string $name): ?string
    {
        if ($name === null || trim($name) === '') {
            return null;
        }
        $row = (new UserModel())->where('name', trim($name))->first();

        return $row === null ? null : $row['id'];
    }

    /** Uses the DB's own NOW() (not PHP's clock) so the stored timestamp matches the database session's timezone. */
    public function touch(string $dashboardId): void
    {
        $this->builder()->where('id', $dashboardId)->set('updated_at', 'NOW()', false)->update();
    }

    public function setStatus(string $dashboardId, string $status): void
    {
        $this->builder()->where('id', $dashboardId)
            ->set('status', $status)
            ->set('updated_at', 'NOW()', false)
            ->update();
    }

    public function setField(string $dashboardId, string $key, string $value): bool
    {
        $key = trim($key);
        if ($key === '') {
            return false;
        }
        $db  = db_connect();
        $row = $db->table('dashboard_fields')->where('dashboard_id', $dashboardId)->where('field_key', $key)->get()->getRowArray();
        if ($row === null) {
            $db->table('dashboard_fields')->insert(['dashboard_id' => $dashboardId, 'field_key' => $key, 'field_value' => $value]);
        } else {
            $db->table('dashboard_fields')->where('id', $row['id'])->update(['field_value' => $value]);
        }
        $this->touch($dashboardId);

        return true;
    }

    public function renameField(string $dashboardId, string $oldKey, string $newKey, string $value): bool
    {
        $newKey = trim($newKey);
        if ($newKey === '') {
            return false;
        }
        $db  = db_connect();
        $row = $db->table('dashboard_fields')->where('dashboard_id', $dashboardId)->where('field_key', $oldKey)->get()->getRowArray();
        if ($row === null) {
            return $this->setField($dashboardId, $newKey, $value);
        }
        $db->table('dashboard_fields')->where('id', $row['id'])->update(['field_key' => $newKey, 'field_value' => $value]);
        $this->touch($dashboardId);

        return true;
    }

    public function removeField(string $dashboardId, string $key): bool
    {
        db_connect()->table('dashboard_fields')->where('dashboard_id', $dashboardId)->where('field_key', $key)->delete();
        $this->touch($dashboardId);

        return true;
    }
}
