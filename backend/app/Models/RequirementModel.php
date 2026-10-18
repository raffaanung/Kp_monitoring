<?php

namespace App\Models;

use CodeIgniter\Model;

class RequirementModel extends Model
{
    protected $table         = 'requirements';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useAutoIncrement = false;
    protected $useSoftDeletes = true;
    protected $deletedField  = 'deleted_at';
    protected $allowedFields = [
        'id', 'code', 'dashboard_id', 'title', 'description', 'status', 'health', 'due_date', 'created_by',
        'version_no', 'version_root_id',
    ];

    /**
     * Sinkronisasi status requirement berdasarkan progress task di dalamnya:
     * - Belum ada task atau semua task masih backlog -> 'open'
     * - Minimal 1 task sudah aktif/dikerjakan (development, testing, uat, to_production, selesai) tapi belum semua selesai -> 'in_progress'
     * - Semua task sudah berstatus 'selesai' (dan minimal ada 1 task) -> 'done'
     */
    public function syncStatusFromTasks(?string $requirementId = null): void
    {
        $db = db_connect();
        $builder = $db->table('tasks')
            ->select('requirement_id, status')
            ->where('deleted_at', null)
            ->where('requirement_id IS NOT NULL');

        if ($requirementId !== null) {
            $builder->where('requirement_id', $requirementId);
        }

        $tasks = $builder->get()->getResultArray();
        $byReq = [];
        foreach ($tasks as $t) {
            $rId = $t['requirement_id'];
            if ($rId) {
                $byReq[$rId][] = $t['status'];
            }
        }

        $reqBuilder = $this->select('id, status');
        if ($requirementId !== null) {
            $reqBuilder->where('id', $requirementId);
        }
        $reqs = $reqBuilder->findAll();

        foreach ($reqs as $r) {
            $id = $r['id'];
            $taskStatuses = $byReq[$id] ?? [];
            $total = count($taskStatuses);
            $doneCount = 0;
            $activeCount = 0;

            foreach ($taskStatuses as $st) {
                if ($st === 'selesai') {
                    $doneCount++;
                    $activeCount++;
                } elseif ($st !== 'backlog') {
                    $activeCount++;
                }
            }

            $computedStatus = 'open';
            if ($total > 0 && $doneCount === $total) {
                $computedStatus = 'done';
            } elseif ($activeCount > 0) {
                $computedStatus = 'in_progress';
            }

            if ($r['status'] !== $computedStatus) {
                $this->update($id, ['status' => $computedStatus]);
            }
        }
    }

    /** @return list<array<string, mixed>> */
    public function listWithDetails(): array
    {
        $this->syncStatusFromTasks();

        $rows = $this->select('requirements.*, dashboards.name AS dashboard_name, creator.name AS created_by_name')
            ->join('dashboards', 'dashboards.id = requirements.dashboard_id', 'left')
            ->join('users AS creator', 'creator.id = requirements.created_by', 'left')
            ->orderBy('requirements.updated_at', 'DESC')
            ->findAll();

        $db = db_connect();
        $teamRows = $db->table('requirement_team_members')
            ->select('requirement_team_members.requirement_id, users.name')
            ->join('users', 'users.id = requirement_team_members.user_id')
            ->get()->getResultArray();
        $teamByReq = [];
        foreach ($teamRows as $t) {
            $teamByReq[$t['requirement_id']][] = $t['name'];
        }

        foreach ($rows as &$row) {
            $row['team'] = $teamByReq[$row['id']] ?? [];
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

    /** @param list<string> $userIds */
    public function syncTeam(string $requirementId, array $userIds): void
    {
        $db = db_connect();
        $db->table('requirement_team_members')->where('requirement_id', $requirementId)->delete();
        $insert = [];
        foreach (array_unique($userIds) as $userId) {
            $insert[] = ['requirement_id' => $requirementId, 'user_id' => $userId];
        }
        if ($insert !== []) {
            $db->table('requirement_team_members')->insertBatch($insert);
        }
    }

    /** Nomor versi berikutnya untuk sebuah grup requirement (root id-nya $rootId). */
    public function nextVersionNo(string $rootId): int
    {
        $max = $this->select('MAX(version_no) AS max_no')
            ->groupStart()
                ->where('id', $rootId)
                ->orWhere('version_root_id', $rootId)
            ->groupEnd()
            ->first();

        return ((int) ($max['max_no'] ?? 1)) + 1;
    }

    /** Kode requirement berikutnya (REQ-001, REQ-002, ...). Versi tidak punya kode sendiri, ikut root-nya. */
    public function nextCode(): string
    {
        $row = db_connect()->query(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1 AS n FROM requirements "
            . "WHERE version_root_id IS NULL AND code ~ '^REQ-[0-9]+$'"
        )->getRowArray();

        return sprintf('REQ-%03d', (int) $row['n']);
    }

    public function dashboardIdForName(string $name): ?string
    {
        $row = (new DashboardModel())->where('name', $name)->first();

        return $row === null ? null : $row['id'];
    }

    public function countForDashboardName(string $name): int
    {
        $dashboardId = $this->dashboardIdForName($name);
        if ($dashboardId === null) {
            return 0;
        }

        return $this->where('dashboard_id', $dashboardId)->countAllResults();
    }
}
