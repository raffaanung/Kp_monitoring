<?php

namespace App\Models;

use CodeIgniter\Model;

class TaskModel extends Model
{
    protected $table         = 'tasks';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useAutoIncrement = false;
    protected $useSoftDeletes = true;
    protected $deletedField  = 'deleted_at';
    protected $allowedFields = [
        'id', 'code', 'title', 'description', 'dashboard_id', 'requirement_id', 'status',
        'priority', 'progress_percent', 'approval_state', 'pic_id',
        'assignee_id', 'created_by', 'deadline',
    ];

    /**
     * @return list<array<string, mixed>>
     */
    public function withPic(): array
    {
        return $this->select('tasks.*, pic.name AS pic_name, dashboards.name AS dashboard_name')
            ->join('users AS pic', 'pic.id = tasks.pic_id', 'left')
            ->join('dashboards', 'dashboards.id = tasks.dashboard_id', 'left')
            ->orderBy('tasks.updated_at', 'DESC')
            ->findAll();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findWithPic(string $id): ?array
    {
        return $this->select('tasks.*, pic.name AS pic_name, dashboards.name AS dashboard_name')
            ->join('users AS pic', 'pic.id = tasks.pic_id', 'left')
            ->join('dashboards', 'dashboards.id = tasks.dashboard_id', 'left')
            ->where('tasks.id', $id)
            ->first();
    }

    private function richSelect()
    {
        return $this->select(
            'tasks.*, assignee.name AS assignee_name, creator.name AS creator_name, '
            . 'dashboards.name AS dashboard_name, requirements.title AS requirement_title, '
            . 'requirements.created_by AS requirement_owner_id, reqOwner.name AS requirement_owner_name, '
            . 'requirements.code AS requirement_code'
        )
            ->join('users AS assignee', 'assignee.id = tasks.assignee_id', 'left')
            ->join('users AS creator', 'creator.id = tasks.created_by', 'left')
            ->join('dashboards', 'dashboards.id = tasks.dashboard_id', 'left')
            ->join('requirements', 'requirements.id = tasks.requirement_id', 'left')
            ->join('users AS reqOwner', 'reqOwner.id = requirements.created_by', 'left');
    }

    /** @param array<string, mixed> $filters @return list<array<string, mixed>> */
    public function listRich(array $filters = []): array
    {
        $builder = $this->richSelect();

        if (! empty($filters['dashboard_id'])) {
            $builder->where('tasks.dashboard_id', $filters['dashboard_id']);
        }
        if (! empty($filters['requirement_id'])) {
            $builder->where('tasks.requirement_id', $filters['requirement_id']);
        }
        if (! empty($filters['status'])) {
            $builder->where('tasks.status', $filters['status']);
        }
        if (! empty($filters['assignee_id'])) {
            $builder->where('tasks.assignee_id', $filters['assignee_id']);
        }
        if (! empty($filters['visible_to'])) {
            $uid = $filters['visible_to'];
            $escaped = db_connect()->escape($uid);
            $builder->groupStart()
                ->where('tasks.created_by', $uid)
                ->orWhere('tasks.assignee_id', $uid)
                ->orWhere('requirements.created_by', $uid)
                ->orWhere("tasks.id IN (SELECT task_id FROM task_assignees WHERE user_id = {$escaped})", null, false)
                ->groupEnd();
        }
        if (! empty($filters['q'])) {
            $pattern = db_connect()->escape('%' . strtolower($filters['q']) . '%');
            $builder->groupStart()
                ->where('LOWER(tasks.title) LIKE ' . $pattern, null, false)
                ->orWhere('LOWER(tasks.description) LIKE ' . $pattern, null, false)
                ->groupEnd();
        }

        return $builder->orderBy('tasks.updated_at', 'DESC')->findAll();
    }

    public function findRichById(string $id): ?array
    {
        return $this->richSelect()->where('tasks.id', $id)->first();
    }

    /**
     * Ganti seluruh assignee sebuah task (hapus yang lama, insert yang baru).
     * @param list<string> $userIds
     */
    public function syncAssignees(string $taskId, array $userIds): void
    {
        $db = db_connect();
        $db->table('task_assignees')->where('task_id', $taskId)->delete();
        $insert = [];
        foreach (array_unique(array_filter($userIds)) as $userId) {
            $insert[] = ['task_id' => $taskId, 'user_id' => $userId];
        }
        if ($insert !== []) {
            $db->table('task_assignees')->insertBatch($insert);
        }
    }

    /** @return list<string> */
    public function assigneeIdsFor(string $taskId): array
    {
        $rows = db_connect()->table('task_assignees')
            ->select('user_id')
            ->where('task_id', $taskId)
            ->get()->getResultArray();

        return array_column($rows, 'user_id');
    }

    /**
     * Semua assignee buat banyak task sekaligus, 1 query (hindari N+1 di list).
     * @param list<string> $taskIds
     * @return array<string, list<array{id: string, name: string}>>
     */
    public function assigneesForTasks(array $taskIds): array
    {
        if ($taskIds === []) {
            return [];
        }
        $rows = db_connect()->table('task_assignees ta')
            ->select('ta.task_id, u.id AS user_id, u.name')
            ->join('users u', 'u.id = ta.user_id')
            ->whereIn('ta.task_id', $taskIds)
            ->orderBy('u.name', 'ASC')
            ->get()->getResultArray();

        $map = [];
        foreach ($rows as $row) {
            $map[$row['task_id']][] = ['id' => $row['user_id'], 'name' => $row['name']];
        }

        return $map;
    }

    /** Kode task berikutnya (TSK-001, TSK-002, ...). */
    public function nextCode(): string
    {
        $row = db_connect()->query(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1 AS n FROM tasks "
            . "WHERE code ~ '^TSK-[0-9]+$'"
        )->getRowArray();

        return sprintf('TSK-%03d', (int) $row['n']);
    }
}
