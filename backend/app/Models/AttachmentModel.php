<?php

namespace App\Models;

use CodeIgniter\Model;

class AttachmentModel extends Model
{
    protected $table         = 'attachments';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields = ['id', 'owner_type', 'owner_id', 'file_name', 'mime_type', 'file_size', 'file_kind', 'file_path', 'uploaded_by'];

    /** @return list<array<string, mixed>> */
    public function forOwner(string $ownerType, string $ownerId): array
    {
        return $this->select('attachments.*, users.name AS uploaded_by_name')
            ->join('users', 'users.id = attachments.uploaded_by', 'left')
            ->where('owner_type', $ownerType)
            ->where('owner_id', $ownerId)
            ->orderBy('created_at', 'DESC')
            ->findAll();
    }

    public static function kindFor(string $filename): string
    {
        $ext = strtolower((string) pathinfo($filename, PATHINFO_EXTENSION));
        return match ($ext) {
            'pdf' => 'pdf',
            'ppt', 'pptx' => 'ppt',
            'xls', 'xlsx' => 'xls',
            default => 'file',
        };
    }
}
