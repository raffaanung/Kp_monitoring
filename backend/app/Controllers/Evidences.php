<?php

namespace App\Controllers;

use App\Libraries\Id;
use App\Models\TaskEvidenceModel;
use CodeIgniter\HTTP\ResponseInterface;

class Evidences extends BaseController
{
    private const MAX_BYTES = 10 * 1024 * 1024;

    public function upload(): ResponseInterface
    {
        $taskId = $this->uuidOrNull($this->request->getPost('task_id'));
        $note   = trim((string) ($this->request->getPost('note') ?? ''));
        $file   = $this->request->getFile('file');

        if ($taskId === null || $file === null || ! $file->isValid()) {
            return $this->jsonError('File dan task_id wajib diisi', 422);
        }
        if ($file->getSize() > self::MAX_BYTES) {
            return $this->jsonError('Ukuran file maksimal 10MB', 422);
        }

        $user = $this->authUser();
        $dir  = WRITEPATH . 'uploads/evidence';
        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $newName = $file->getRandomName();
        $file->move($dir, $newName);

        $model = new TaskEvidenceModel();
        $id    = Id::new();
        $model->insert([
            'id'        => $id,
            'task_id'   => $taskId,
            'kind'      => 'comment',
            'actor_id'  => $user['id'],
            'file_name' => $file->getClientName(),
            'file_mime' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'file_path' => 'evidence/' . $newName,
            'note'      => $note,
        ], false);

        return $this->jsonOk(['id' => $id, 'name' => $file->getClientName()]);
    }

    public function file(string $id = '0'): ResponseInterface
    {
        $row = (new TaskEvidenceModel())->find($id);
        if ($row === null) {
            return $this->jsonError('Evidence tidak ditemukan', 404);
        }
        $path = WRITEPATH . 'uploads/' . $row['file_path'];
        if (! is_file($path)) {
            return $this->jsonError('File tidak ditemukan', 404);
        }

        $isImage     = str_starts_with((string) $row['file_mime'], 'image/');
        $disposition = $isImage ? 'inline' : 'attachment';

        return $this->response
            ->setHeader('Content-Type', $row['file_mime'] ?: 'application/octet-stream')
            ->setHeader('Content-Disposition', $disposition . '; filename="' . $row['file_name'] . '"')
            ->setBody(file_get_contents($path));
    }
}
