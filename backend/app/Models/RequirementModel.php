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

    /** @return list<array<string, mixed>> */
    public function listWithDetails(): array
    {
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
