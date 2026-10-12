<?php

namespace App\Controllers;

use App\Libraries\Id;
use App\Models\AttachmentModel;
use CodeIgniter\HTTP\ResponseInterface;

class Attachments extends BaseController
{
    private const MAX_BYTES = 20 * 1024 * 1024;

    public function index(): ResponseInterface
    {
        $ownerType = (string) $this->request->getGet('owner_type');
        $ownerId   = $this->uuidOrNull($this->request->getGet('owner_id'));
        if ($ownerType === '' || $ownerId === null) {
            return $this->jsonError('owner_type and owner_id are required', 422);
        }

        $rows = (new AttachmentModel())->forOwner($ownerType, $ownerId);

        return $this->jsonOk(array_map([$this, 'shape'], $rows));
    }

    public function upload(): ResponseInterface
    {
        $ownerType = (string) $this->request->getPost('owner_type');
        $ownerId   = $this->uuidOrNull($this->request->getPost('owner_id'));
        $file      = $this->request->getFile('file');

        if (! in_array($ownerType, ['requirement', 'dashboard'], true) || $ownerId === null) {
            return $this->jsonError('owner_type and owner_id are required', 422);
        }
        if ($file === null || ! $file->isValid()) {
            return $this->jsonError('That file is not valid', 422);
        }
        if ($file->getSize() > self::MAX_BYTES) {
            return $this->jsonError('File is larger than 20 MB', 422);
        }
        if (! $file->getSize()) {
            return $this->jsonError('The file is empty', 422);
        }

        $user = $this->authUser();
        $dir  = WRITEPATH . 'uploads/attachments';
        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $clientName = $file->getClientName();
        $newName    = $file->getRandomName();
        $file->move($dir, $newName);

        $model = new AttachmentModel();
        $id    = Id::new();
        $model->insert([
            'id'          => $id,
            'owner_type'  => $ownerType,
            'owner_id'    => $ownerId,
            'file_name'   => $clientName,
            'mime_type'   => $file->getClientMimeType(),
            'file_size'   => $file->getSize(),
            'file_kind'   => AttachmentModel::kindFor($clientName),
            'file_path'   => 'attachments/' . $newName,
            'uploaded_by' => $user['id'],
        ], false);

        $row = $model->select('attachments.*, users.name AS uploaded_by_name')
            ->join('users', 'users.id = attachments.uploaded_by', 'left')
            ->find($id);

        return $this->jsonOk($this->shape($row));
    }

    public function delete(string $id = '0'): ResponseInterface
    {
        $model = new AttachmentModel();
        $row   = $model->find($id);
        if ($row === null) {
            return $this->jsonError('File not found', 404);
        }
        $path = WRITEPATH . 'uploads/' . $row['file_path'];
        if (is_file($path)) {
            unlink($path);
        }
        $model->delete($id);

        return $this->jsonOk(['deleted' => true]);
    }

    public function file(string $id = '0'): ResponseInterface
    {
        $row = (new AttachmentModel())->find($id);
        if ($row === null) {
            return $this->jsonError('File not found', 404);
        }
        $path = WRITEPATH . 'uploads/' . $row['file_path'];
        if (! is_file($path)) {
            return $this->jsonError('File not found', 404);
        }

        $isPdf       = $row['file_kind'] === 'pdf';
        $disposition = $isPdf ? 'inline' : 'attachment';

        return $this->response
            ->setHeader('Content-Type', $row['mime_type'] ?: 'application/octet-stream')
            ->setHeader('Content-Disposition', $disposition . '; filename="' . $row['file_name'] . '"')
            ->setBody(file_get_contents($path));
    }

    /** @param array<string, mixed> $row */
    private function shape(array $row): array
    {
        return [
            'id'         => $row['id'],
            'ownerType'  => $row['owner_type'],
            'ownerId'    => (string) $row['owner_id'],
            'name'       => $row['file_name'],
            'mime'       => $row['mime_type'],
            'size'       => (int) $row['file_size'],
            'kind'       => $row['file_kind'],
            'uploadedAt' => $row['created_at'],
            'uploadedBy' => $row['uploaded_by_name'] ?? '',
            'file_url'   => "/api/attachments/{$row['id']}/file",
        ];
    }
}
