<?php

namespace App\Models;

use CodeIgniter\Model;

class TaskEvidenceModel extends Model
{
    protected $table         = 'task_evidences';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields = ['id', 'task_id', 'kind', 'actor_id', 'file_name', 'file_mime', 'file_size', 'file_path', 'note'];

    /** @return list<array<string, mixed>> */
    public function forTask(string $taskId): array
    {
        return $this->select('task_evidences.*, actor.name AS actor_name')
            ->join('users AS actor', 'actor.id = task_evidences.actor_id', 'left')
            ->where('task_id', $taskId)
            ->orderBy('created_at', 'DESC')
            ->findAll();
    }
}
