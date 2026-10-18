<?php

namespace App\Controllers;

use App\Libraries\Id;
use App\Models\TaskEvidenceModel;
use CodeIgniter\HTTP\ResponseInterface;

class Evidences extends BaseController
{
    private const MAX_BYTES = 20 * 1024 * 1024;

    public function upload(): ResponseInterface
    {
        $rawTaskId = $this->request->getPost('task_id');
        $taskId = $this->uuidOrNull($rawTaskId);
        $note   = trim((string) ($this->request->getPost('note') ?? ''));
        $kind   = trim((string) ($this->request->getPost('kind') ?? '')) ?: 'task_attachment';
        $pctRaw = $this->request->getPost('progress_percent');
        $progressPercent = ($pctRaw !== null && $pctRaw !== '') ? (int) $pctRaw : null;
        $file   = $this->request->getFile('file');

        if ($taskId === null) {
            return $this->jsonError("task_id tidak valid atau kosong ('" . ($rawTaskId ?? 'null') . "')", 422);
        }
        if ($file === null) {
            return $this->jsonError('File evidence tidak terkirim atau request body melebihi batas upload server', 422);
        }
        if (! $file->isValid()) {
            return $this->jsonError('Upload file gagal: ' . $file->getErrorString() . ' (error code ' . $file->getError() . ')', 422);
        }
        if ($file->getSize() > self::MAX_BYTES) {
            return $this->jsonError('Ukuran file melebihi batas maksimal 20 MB', 422);
        }

        $user = $this->authUser();
        if ($user === null) {
            return $this->jsonError('Not signed in', 401);
        }

        $taskModel = new \App\Models\TaskModel();
        $task = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task not found', 404);
        }

        $dashboard = $task['dashboard_id'] ? (new \App\Models\DashboardModel())->find($task['dashboard_id']) : null;
        $requirement = $task['requirement_id'] ? (new \App\Models\RequirementModel())->find($task['requirement_id']) : null;
        $assigneeIds = $taskModel->assigneeIdsFor($taskId);

        if (! \App\Libraries\TaskPolicy::canUpdateTaskProgress($user, $task, $assigneeIds, $dashboard, $requirement)) {
            return $this->jsonError('Anda hanya dapat mengunggah evidence/progress pada task yang ditugaskan kepada Anda', 403);
        }

        $dir  = WRITEPATH . 'uploads/evidence';
        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $fileSize   = $file->getSize();
        $clientName = $file->getClientName();
        $clientMime = $file->getClientMimeType();
        $newName    = $file->getRandomName();
        $file->move($dir, $newName);

        $model = new TaskEvidenceModel();
        $id    = Id::new();
        $model->insert([
            'id'               => $id,
            'task_id'          => $taskId,
            'kind'             => $kind,
            'actor_id'         => $user['id'],
            'file_name'        => $clientName,
            'file_mime'        => $clientMime,
            'file_size'        => $fileSize,
            'file_path'        => 'evidence/' . $newName,
            'note'             => $note,
            'progress_percent' => $progressPercent,
        ], false);

        return $this->jsonOk(['id' => $id, 'name' => $clientName]);
    }

    public function file(string $id = '0'): ResponseInterface
    {
        $row = (new TaskEvidenceModel())->find($id);
        if ($row === null) {
            return $this->jsonError('Evidence not found', 404);
        }
        $path = WRITEPATH . 'uploads/' . $row['file_path'];
        if (! is_file($path)) {
            return $this->jsonError('File not found', 404);
        }

        $isImage     = str_starts_with((string) $row['file_mime'], 'image/');
        $disposition = $isImage ? 'inline' : 'attachment';

        return $this->response
            ->setHeader('Content-Type', $row['file_mime'] ?: 'application/octet-stream')
            ->setHeader('Content-Disposition', $disposition . '; filename="' . $row['file_name'] . '"')
            ->setBody(file_get_contents($path));
    }
}
