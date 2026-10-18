<?php

namespace App\Models;

use CodeIgniter\Model;

class TaskEvidenceModel extends Model
{
    protected $table         = 'task_evidences';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields = ['id', 'task_id', 'kind', 'actor_id', 'file_name', 'file_mime', 'file_size', 'file_path', 'note', 'progress_percent'];

    /** @return list<array<string, mixed>> */
    public function forTask(string $taskId): array
    {
        return $this->select('task_evidences.*, actor.name AS actor_name')
            ->join('users AS actor', 'actor.id = task_evidences.actor_id', 'left')
            ->where('task_id', $taskId)
            ->orderBy('created_at', 'DESC')
            ->findAll();
    }

    /**
     * Ambil semua evidence untuk daftar task dalam 1 query (hindari N+1).
     * @param list<string> $taskIds
     * @return array<string, list<array<string, mixed>>>
     */
    public function forTasks(array $taskIds): array
    {
        if ($taskIds === []) {
            return [];
        }

        $rows = $this->select('task_evidences.*, actor.name AS actor_name')
            ->join('users AS actor', 'actor.id = task_evidences.actor_id', 'left')
            ->whereIn('task_id', $taskIds)
            ->orderBy('created_at', 'DESC')
            ->findAll();

        $byTask = [];
        foreach ($rows as $r) {
            $byTask[$r['task_id']][] = [
                'id'               => $r['id'],
                'at'               => $r['created_at'],
                'actor'            => $r['actor_name'] ?? '',
                'kind'             => $r['kind'],
                'name'             => $r['file_name'],
                'mime'             => $r['file_mime'],
                'size'             => (int) $r['file_size'],
                'file_url'         => "/api/evidences/{$r['id']}/file",
                'note'             => $r['note'] ?? '',
                'progress_percent' => $r['progress_percent'] !== null ? (int) $r['progress_percent'] : null,
            ];
        }

        return $byTask;
    }
}
