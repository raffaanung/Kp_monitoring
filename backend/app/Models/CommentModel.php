<?php

namespace App\Models;

use CodeIgniter\Model;

class CommentModel extends Model
{
    protected $table         = 'comments';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields = ['id', 'commentable_type', 'commentable_id', 'user_id', 'body', 'evidence_id'];

    /** @return list<array<string, mixed>> */
    public function forTask(string $taskId): array
    {
        return $this->select('comments.*, users.name AS actor_name')
            ->join('users', 'users.id = comments.user_id', 'left')
            ->where('commentable_type', 'task')
            ->where('commentable_id', $taskId)
            ->orderBy('created_at', 'DESC')
            ->findAll();
    }
}
