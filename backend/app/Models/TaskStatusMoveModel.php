<?php

namespace App\Models;

use CodeIgniter\Model;

class TaskStatusMoveModel extends Model
{
    protected $table         = 'task_status_moves';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields = ['id', 'task_id', 'from_status', 'to_status', 'requested_by', 'note', 'evidence_id', 'status'];

    public function pendingForTask(string $taskId): ?array
    {
        return $this->select('task_status_moves.*, requester.name AS requested_by_name')
            ->join('users AS requester', 'requester.id = task_status_moves.requested_by', 'left')
            ->where('task_status_moves.task_id', $taskId)
            ->where('task_status_moves.status', 'pending')
            ->orderBy('task_status_moves.created_at', 'DESC')
            ->first();
    }

    /**
     * Pending move untuk banyak task sekaligus, 1 query (hindari N+1 saat render list task).
     * @param list<string> $taskIds
     * @return array<string, array<string, mixed>> map task_id => move row terbaru yang pending
     */
    public function pendingForTasks(array $taskIds): array
    {
        if ($taskIds === []) {
            return [];
        }

        $rows = $this->select('task_status_moves.*, requester.name AS requested_by_name')
            ->join('users AS requester', 'requester.id = task_status_moves.requested_by', 'left')
            ->whereIn('task_status_moves.task_id', $taskIds)
            ->where('task_status_moves.status', 'pending')
            ->orderBy('task_status_moves.created_at', 'DESC')
            ->findAll();

        $map = [];
        foreach ($rows as $row) {
            // Satu task maksimal 1 pending move (dijaga di level aplikasi); kalau lebih, pakai yang terbaru.
            if (! isset($map[$row['task_id']])) {
                $map[$row['task_id']] = $row;
            }
        }

        return $map;
    }
}
