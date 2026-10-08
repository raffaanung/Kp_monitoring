<?php

namespace App\Controllers;

use App\Libraries\Id;
use App\Libraries\TaskPolicy;
use App\Models\ActivityLogModel;
use App\Models\CommentModel;
use App\Models\DashboardModel;
use App\Models\NotificationModel;
use App\Models\RequirementModel;
use App\Models\TaskEvidenceModel;
use App\Models\TaskModel;
use App\Models\TaskStatusMoveModel;
use App\Models\UserModel;
use CodeIgniter\HTTP\ResponseInterface;

class ModuleTasks extends BaseController
{
    public function index(): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null) {
            return $this->jsonError('Belum login', 401);
        }

        $filters = [
            'dashboard_id'    => $this->uuidOrNull($this->request->getGet('dashboard_id')),
            'requirement_id'  => $this->uuidOrNull($this->request->getGet('requirement_id')),
            'status'          => $this->request->getGet('status'),
            'q'               => $this->request->getGet('q'),
        ];
        // Admin/Manager/PM melihat semua task. Role lain (Teknis/viewer) hanya
        // melihat task yang relevan untuk mereka: dibuat olehnya, ditugaskan ke
        // dia, atau requirement-nya dia yang punya (owner).
        if (! TaskPolicy::seesAllTasks($user)) {
            $filters['visible_to'] = $user['id'];
        }
        $rows = (new TaskModel())->listRich(array_filter($filters));

        // 1 query buat semua pending move, bukan 1 query per task (hindari N+1).
        $moveMap = (new TaskStatusMoveModel())->pendingForTasks(array_column($rows, 'id'));

        return $this->jsonOk(array_map(fn ($r) => $this->shapeListRow($r, $moveMap[$r['id']] ?? null), $rows));
    }

    public function show(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null) {
            return $this->jsonError('Belum login', 401);
        }

        $row = (new TaskModel())->findRichById($id);
        if ($row === null) {
            return $this->jsonError('Task tidak ditemukan', 404);
        }
        if (! TaskPolicy::canViewTask($user, $row)) {
            return $this->jsonError('Anda tidak berhak melihat task ini', 403);
        }

        return $this->jsonOk($this->shapeDetailRow($row));
    }

    public function create(): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canCreateTask($user)) {
            return $this->jsonError('Anda tidak punya izin Tambah Task', 403);
        }

        $title         = trim((string) $this->request->getJsonVar('title'));
        $description   = trim((string) ($this->request->getJsonVar('description') ?? ''));
        $dashboardName = trim((string) $this->request->getJsonVar('dashboard'));
        $requirementId = $this->uuidOrNull($this->request->getJsonVar('requirement_id'));
        $assigneeName  = trim((string) $this->request->getJsonVar('assignee'));
        $deadline      = (string) $this->request->getJsonVar('deadline');
        $status        = (string) ($this->request->getJsonVar('status') ?: 'backlog');

        if ($title === '' || $requirementId === null) {
            return $this->jsonError('Judul dan requirement wajib diisi', 422);
        }

        $dashboardModel = new DashboardModel();
        $dashboard      = $dashboardModel->where('name', $dashboardName)->first();
        if ($dashboard === null) {
            return $this->jsonError('Dashboard tidak ditemukan', 422);
        }
        $assignee   = $assigneeName !== '' ? (new UserModel())->where('name', $assigneeName)->first() : null;
        $assigneeId = $assignee['id'] ?? null;

        $requirement = (new RequirementModel())->find($requirementId);
        if ($requirement === null) {
            return $this->jsonError('Requirement tidak ditemukan', 422);
        }
        // Owner requirement = task langsung approved. Selain owner (misal assignee) = menunggu approval owner dulu.
        $isOwner       = TaskPolicy::isRequirementOwner($user, $requirement);
        $approvalState = $isOwner ? 'approved' : 'pending';

        $taskModel = new TaskModel();
        $taskId    = Id::new();
        $taskModel->insert([
            'id'               => $taskId,
            'code'             => $taskModel->nextCode(),
            'title'            => $title,
            'description'      => $description,
            'dashboard_id'     => $dashboard['id'],
            'requirement_id'   => $requirementId,
            'status'           => $status,
            'priority'         => 'medium',
            'progress_percent' => 0,
            'approval_state'   => $approvalState,
            'pic_id'           => $assigneeId,
            'assignee_id'      => $assigneeId,
            'created_by'       => $user['id'],
            'deadline'         => $deadline ?: null,
        ], false);

        (new ActivityLogModel())->log([
            'actor_id'     => $user['id'],
            'actor_name'   => $user['name'],
            'action'       => $isOwner
                ? 'Task dibuat dari requirement · Backlog'
                : 'Task dibuat, menunggu approval owner requirement',
            'action_type'  => 'create',
            'object_type'  => 'task',
            'object_id'    => $taskId,
            'object_label' => $title,
            'dashboard_id' => $dashboard['id'],
        ]);

        if ($assigneeId !== null && $assigneeId !== $user['id']) {
            (new NotificationModel())->notify(
                'approved',
                'Task baru',
                "{$user['name']} menugaskan \"{$title}\" kepada Anda",
                $assigneeId,
                $taskId,
                $dashboard['id'],
            );
        }

        if (! $isOwner && $requirement['created_by'] && $requirement['created_by'] !== $user['id']) {
            (new NotificationModel())->notify(
                'approval_request',
                'Task menunggu approval',
                "{$user['name']} membuat task \"{$title}\" dan menunggu persetujuan Anda",
                $requirement['created_by'],
                $taskId,
                $dashboard['id'],
            );
        }

        return $this->jsonOk($this->shapeDetailRow((new TaskModel())->findRichById($taskId)));
    }

    /** Owner requirement menyetujui task yang baru dibuat assignee, masuk Backlog. */
    public function approve(string $id = '0'): ResponseInterface
    {
        $taskId    = $id;
        $user      = $this->authUser();
        $taskModel = new TaskModel();
        $task      = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task tidak ditemukan', 404);
        }
        $requirement = $task['requirement_id'] ? (new RequirementModel())->find($task['requirement_id']) : null;
        if ($requirement === null || ! TaskPolicy::isRequirementOwner($user, $requirement)) {
            return $this->jsonError('Hanya owner requirement yang dapat menyetujui task ini', 403);
        }
        if ($task['approval_state'] !== 'pending') {
            return $this->jsonError('Task tidak sedang menunggu approval', 422);
        }

        $note       = trim((string) ($this->request->getJsonVar('note') ?? ''));
        $evidenceId = $this->uuidOrNull($this->request->getJsonVar('evidence_id'));

        $taskModel->update($taskId, ['approval_state' => 'approved']);
        if ($evidenceId) {
            (new TaskEvidenceModel())->update($evidenceId, ['kind' => 'pm_approve']);
        }
        (new ActivityLogModel())->log([
            'actor_id' => $user['id'], 'actor_name' => $user['name'],
            'action' => "Task disetujui masuk Backlog. {$note}", 'action_type' => 'approval',
            'object_type' => 'task', 'object_id' => $taskId, 'object_label' => $task['title'],
            'dashboard_id' => $task['dashboard_id'], 'evidence_id' => $evidenceId,
        ]);
        if ($task['created_by'] && $task['created_by'] !== $user['id']) {
            (new NotificationModel())->notify(
                'approved', 'Task disetujui', "\"{$task['title']}\" disetujui masuk Backlog",
                $task['created_by'], $taskId, $task['dashboard_id'],
            );
        }

        return $this->jsonOk(['result' => 'approved', 'task' => $this->shapeDetailRow($taskModel->findRichById($taskId))]);
    }

    /** Owner requirement minta revisi task yang baru dibuat assignee, belum masuk Backlog. */
    public function requestRevision(string $id = '0'): ResponseInterface
    {
        $taskId    = $id;
        $user      = $this->authUser();
        $taskModel = new TaskModel();
        $task      = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task tidak ditemukan', 404);
        }
        $requirement = $task['requirement_id'] ? (new RequirementModel())->find($task['requirement_id']) : null;
        if ($requirement === null || ! TaskPolicy::isRequirementOwner($user, $requirement)) {
            return $this->jsonError('Hanya owner requirement yang dapat meminta revisi task ini', 403);
        }
        if ($task['approval_state'] !== 'pending') {
            return $this->jsonError('Task tidak sedang menunggu approval', 422);
        }

        $note       = trim((string) ($this->request->getJsonVar('note') ?? '')) ?: 'Perlu revisi.';
        $evidenceId = $this->uuidOrNull($this->request->getJsonVar('evidence_id'));

        $taskModel->update($taskId, ['approval_state' => 'revision']);
        if ($evidenceId) {
            (new TaskEvidenceModel())->update($evidenceId, ['kind' => 'pm_revision']);
        }
        (new ActivityLogModel())->log([
            'actor_id' => $user['id'], 'actor_name' => $user['name'],
            'action' => "Owner minta revisi. {$note}", 'action_type' => 'approval',
            'object_type' => 'task', 'object_id' => $taskId, 'object_label' => $task['title'],
            'dashboard_id' => $task['dashboard_id'], 'evidence_id' => $evidenceId,
        ]);
        if ($task['created_by'] && $task['created_by'] !== $user['id']) {
            (new NotificationModel())->notify(
                'revision', 'Task perlu revisi', "\"{$task['title']}\": {$note}",
                $task['created_by'], $taskId, $task['dashboard_id'],
            );
        }

        return $this->jsonOk(['result' => 'revision', 'task' => $this->shapeDetailRow($taskModel->findRichById($taskId))]);
    }

    /** Pembuat task (atau owner requirement) mengajukan ulang task yang diminta revisi. */
    public function resubmit(string $id = '0'): ResponseInterface
    {
        $taskId    = $id;
        $user      = $this->authUser();
        $taskModel = new TaskModel();
        $task      = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task tidak ditemukan', 404);
        }
        $requirement = $task['requirement_id'] ? (new RequirementModel())->find($task['requirement_id']) : null;
        $isCreator   = (string) ($task['created_by'] ?? '') === (string) $user['id'];
        $isOwner     = $requirement !== null && TaskPolicy::isRequirementOwner($user, $requirement);
        if (! $isCreator && ! $isOwner) {
            return $this->jsonError('Hanya pembuat atau owner requirement yang dapat mengajukan ulang task ini', 403);
        }
        if ($task['approval_state'] !== 'revision') {
            return $this->jsonError('Task tidak sedang dalam status revisi', 422);
        }

        $taskModel->update($taskId, ['approval_state' => 'pending']);
        (new ActivityLogModel())->log([
            'actor_id' => $user['id'], 'actor_name' => $user['name'],
            'action' => 'Task diajukan ulang, menunggu approval owner', 'action_type' => 'approval',
            'object_type' => 'task', 'object_id' => $taskId, 'object_label' => $task['title'],
            'dashboard_id' => $task['dashboard_id'],
        ]);
        if ($requirement !== null && $requirement['created_by'] && $requirement['created_by'] !== $user['id']) {
            (new NotificationModel())->notify(
                'approval_request', 'Task diajukan ulang', "\"{$task['title']}\" diajukan ulang dan menunggu persetujuan Anda",
                $requirement['created_by'], $taskId, $task['dashboard_id'],
            );
        }

        return $this->jsonOk(['result' => 'pending', 'task' => $this->shapeDetailRow($taskModel->findRichById($taskId))]);
    }

    public function update(string $id = '0'): ResponseInterface
    {
        $taskId = $id;
        $user   = $this->authUser();
        $role   = TaskPolicy::functionalRole($user['role_name'] ?? null);
        if ($role !== 'pm') {
            return $this->jsonError('Hanya PM yang dapat mengubah detail task', 403);
        }

        $taskModel = new TaskModel();
        $task      = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task tidak ditemukan', 404);
        }

        $before = $this->baseShape($taskModel->findRichById($taskId));

        $patch = [];
        foreach (['title', 'description', 'deadline'] as $field) {
            $value = $this->request->getJsonVar($field);
            if ($value !== null) {
                $patch[$field] = is_string($value) ? trim($value) : $value;
            }
        }
        $requirementId = $this->uuidOrNull($this->request->getJsonVar('requirement_id'));
        if ($requirementId !== null) {
            $patch['requirement_id'] = $requirementId;
        }
        $assigneeName = $this->request->getJsonVar('assignee');
        if ($assigneeName !== null) {
            $row = (new UserModel())->where('name', trim((string) $assigneeName))->first();
            if ($row !== null) {
                $patch['assignee_id'] = $row['id'];
                $patch['pic_id']      = $row['id'];
            }
        }

        if ($patch !== []) {
            $taskModel->update($taskId, $patch);
        }

        $after   = $this->baseShape($taskModel->findRichById($taskId));
        $changes = (new ActivityLogModel())->diffFields($before, $after, [
            'title'          => 'Judul',
            'description'    => 'Deskripsi',
            'deadline'       => 'Deadline',
            'requirement_id' => 'Requirement',
            'assignee'       => 'PIC',
        ]);
        if ($changes !== []) {
            (new ActivityLogModel())->logWithChanges([
                'actor_id'     => $user['id'],
                'actor_name'   => $user['name'],
                'action'       => 'Updated task details',
                'action_type'  => 'update',
                'object_type'  => 'task',
                'object_id'    => $taskId,
                'object_label' => $after['title'],
                'dashboard_id' => $task['dashboard_id'],
            ], $changes);
        }

        return $this->jsonOk($this->shapeDetailRow($taskModel->findRichById($taskId)));
    }

    public function delete(string $id = '0'): ResponseInterface
    {
        $taskId    = $id;
        $user      = $this->authUser();
        $taskModel = new TaskModel();
        $task      = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task tidak ditemukan', 404);
        }
        $dashboard = $task['dashboard_id'] ? (new DashboardModel())->find($task['dashboard_id']) : null;
        if ($dashboard === null || ! TaskPolicy::canDeleteTask($user, $dashboard)) {
            return $this->jsonError('Hanya PM dashboard ini yang dapat menghapus task', 403);
        }

        $taskModel->delete($taskId);

        (new ActivityLogModel())->log([
            'actor_id'     => $user['id'],
            'actor_name'   => $user['name'],
            'action'       => 'Task dihapus',
            'action_type'  => 'delete',
            'object_type'  => 'task',
            'object_id'    => $taskId,
            'object_label' => $task['title'],
            'dashboard_id' => $task['dashboard_id'],
        ]);

        return $this->jsonOk(['deleted' => true]);
    }

    public function move(string $id = '0'): ResponseInterface
    {
        $taskId     = $id;
        $status     = (string) $this->request->getJsonVar('status');
        $note       = trim((string) ($this->request->getJsonVar('note') ?? ''));
        $evidenceId = $this->uuidOrNull($this->request->getJsonVar('evidence_id'));

        $user        = $this->authUser();
        $role        = TaskPolicy::functionalRole($user['role_name'] ?? null);
        $taskModel   = new TaskModel();
        $task        = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task tidak ditemukan', 404);
        }
        $requirement = $task['requirement_id'] ? (new RequirementModel())->find($task['requirement_id']) : null;
        // Owner requirement boleh geser langsung, apa pun role-nya (termasuk Admin) — sama seperti PM.
        $isOwner = $requirement !== null && TaskPolicy::isRequirementOwner($user, $requirement);
        if (! TaskPolicy::canUpdateBoard($user) && ! $isOwner) {
            return $this->jsonError('Tidak berhak mengubah status task', 403);
        }
        if ($task['status'] === $status) {
            return $this->jsonOk(['result' => 'moved', 'task' => $this->shapeDetailRow($taskModel->findRichById($taskId))]);
        }

        $moveModel = new TaskStatusMoveModel();
        if ($moveModel->pendingForTask($taskId) !== null) {
            return $this->jsonError('Masih ada request pindah yang menunggu', 422);
        }

        $dashboard = $task['dashboard_id'] ? (new DashboardModel())->find($task['dashboard_id']) : null;

        if ($isOwner || ($role === 'pm' && $dashboard !== null && TaskPolicy::isPmOfDashboard($user, $dashboard))) {
            $taskModel->update($taskId, ['status' => $status]);
            if ($evidenceId) {
                (new TaskEvidenceModel())->update($evidenceId, ['kind' => 'pm_approve']);
            }
            (new ActivityLogModel())->log([
                'actor_id' => $user['id'], 'actor_name' => $user['name'],
                'action' => "Pindah ke {$status}. {$note}", 'action_type' => 'status_change',
                'object_type' => 'task', 'object_id' => $taskId, 'object_label' => $task['title'],
                'dashboard_id' => $task['dashboard_id'], 'evidence_id' => $evidenceId,
            ]);

            return $this->jsonOk(['result' => 'moved', 'task' => $this->shapeDetailRow($taskModel->findRichById($taskId))]);
        }

        if ($role === 'teknis') {
            $moveId = Id::new();
            $moveModel->insert([
                'id' => $moveId, 'task_id' => $taskId, 'from_status' => $task['status'], 'to_status' => $status,
                'requested_by' => $user['id'], 'note' => $note, 'evidence_id' => $evidenceId,
                'status' => 'pending',
            ], false);
            if ($evidenceId) {
                (new TaskEvidenceModel())->update($evidenceId, ['kind' => 'move_request']);
            }
            (new ActivityLogModel())->log([
                'actor_id' => $user['id'], 'actor_name' => $user['name'],
                'action' => "Ajukan pindah {$task['status']} → {$status}. {$note}", 'action_type' => 'status_change',
                'object_type' => 'task', 'object_id' => $taskId, 'object_label' => $task['title'],
                'dashboard_id' => $task['dashboard_id'], 'evidence_id' => $evidenceId,
            ]);
            if ($dashboard !== null && $dashboard['pm_id']) {
                (new NotificationModel())->notify(
                    'move_request', 'Request pindah status',
                    "{$user['name']} minta pindah \"{$task['title']}\" ke {$status}",
                    $dashboard['pm_id'], $taskId, $task['dashboard_id'],
                );
            }

            return $this->jsonOk(['result' => 'requested', 'move_id' => $moveId, 'task' => $this->shapeDetailRow($taskModel->findRichById($taskId))]);
        }

        return $this->jsonError('Tidak berhak memindahkan task ini', 403);
    }

    public function approveMove(string $id = '0'): ResponseInterface
    {
        return $this->resolveMove($id, true);
    }

    public function rejectMove(string $id = '0'): ResponseInterface
    {
        return $this->resolveMove($id, false);
    }

    private function resolveMove(string $id, bool $approve): ResponseInterface
    {
        $taskId     = $id;
        $note       = trim((string) ($this->request->getJsonVar('note') ?? ''));
        $evidenceId = $this->uuidOrNull($this->request->getJsonVar('evidence_id'));

        $user      = $this->authUser();
        $taskModel = new TaskModel();
        $task      = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task tidak ditemukan', 404);
        }
        $dashboard   = $task['dashboard_id'] ? (new DashboardModel())->find($task['dashboard_id']) : null;
        $requirement = $task['requirement_id'] ? (new RequirementModel())->find($task['requirement_id']) : null;
        $isPm        = $dashboard !== null && TaskPolicy::isPmOfDashboard($user, $dashboard);
        $isOwner     = $requirement !== null && TaskPolicy::isRequirementOwner($user, $requirement);
        if (! $isPm && ! $isOwner) {
            return $this->jsonError('Hanya PM dashboard ini atau owner requirement yang dapat memutuskan', 403);
        }

        $moveModel = new TaskStatusMoveModel();
        $move      = $moveModel->pendingForTask($taskId);
        if ($move === null) {
            return $this->jsonError('Tidak ada request yang menunggu', 422);
        }

        $moveModel->update($move['id'], ['status' => $approve ? 'approved' : 'rejected']);
        if ($evidenceId) {
            (new TaskEvidenceModel())->update($evidenceId, ['kind' => $approve ? 'pm_approve' : 'pm_return']);
        }

        if ($approve) {
            $taskModel->update($taskId, ['status' => $move['to_status']]);
            $actionText  = "Setujui pindah ke {$move['to_status']}. {$note}";
            $notifType   = 'move_approved';
            $notifTitle  = 'Request disetujui';
            $notifBody   = "Pindah \"{$task['title']}\" ke {$move['to_status']} disetujui";
        } else {
            $actionText  = "Minta revisi. {$note}";
            $notifType   = 'move_rejected';
            $notifTitle  = 'Perlu revisi';
            $notifBody   = $note !== '' ? $note : 'Request pindah ditolak / perlu revisi.';
        }

        (new ActivityLogModel())->log([
            'actor_id' => $user['id'], 'actor_name' => $user['name'],
            'action' => $actionText, 'action_type' => 'approval',
            'object_type' => 'task', 'object_id' => $taskId, 'object_label' => $task['title'],
            'dashboard_id' => $task['dashboard_id'], 'evidence_id' => $evidenceId, 'reason' => $note ?: null,
        ]);

        if ($move['requested_by']) {
            (new NotificationModel())->notify($notifType, $notifTitle, $notifBody, $move['requested_by'], $taskId, $task['dashboard_id']);
        }

        return $this->jsonOk($this->shapeDetailRow($taskModel->findRichById($taskId)));
    }

    public function addComment(string $id = '0'): ResponseInterface
    {
        $taskId     = $id;
        $body       = trim((string) ($this->request->getJsonVar('body') ?? ''));
        $evidenceId = $this->uuidOrNull($this->request->getJsonVar('evidence_id'));

        $user = $this->authUser();
        if (! TaskPolicy::canCommentOnTask($user)) {
            return $this->jsonError('Tidak berhak berkomentar', 403);
        }
        if ($body === '' && ! $evidenceId) {
            return $this->jsonError('Komentar atau lampiran wajib diisi', 422);
        }

        $taskModel = new TaskModel();
        $task      = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task tidak ditemukan', 404);
        }

        (new CommentModel())->insert([
            'id'               => Id::new(),
            'commentable_type' => 'task',
            'commentable_id'   => $taskId,
            'user_id'          => $user['id'],
            'body'             => $body,
            'evidence_id'      => $evidenceId,
        ], false);
        if ($evidenceId) {
            (new TaskEvidenceModel())->update($evidenceId, ['kind' => 'comment']);
        }
        $taskModel->update($taskId, []);

        $dashboard = $task['dashboard_id'] ? (new DashboardModel())->find($task['dashboard_id']) : null;
        $recipients = array_unique(array_filter([
            $task['created_by'], $task['assignee_id'], $dashboard['pm_id'] ?? null,
        ]));
        foreach ($recipients as $recipientId) {
            if ($recipientId === $user['id']) {
                continue;
            }
            (new NotificationModel())->notify(
                'comment', 'Komentar baru', "{$user['name']} berkomentar di \"{$task['title']}\"",
                $recipientId, $taskId, $task['dashboard_id'],
            );
        }

        return $this->jsonOk($this->shapeDetailRow($taskModel->findRichById($taskId)));
    }

    /** @param array<string, mixed> $row @param array<string, mixed>|null $move */
    private function shapeListRow(array $row, ?array $move = null): array
    {
        $shaped = $this->baseShape($row);
        $shaped['status_move'] = $this->shapeMove($move);

        return $shaped;
    }

    /** @param array<string, mixed>|null $row */
    private function shapeDetailRow(?array $row): ?array
    {
        if ($row === null) {
            return null;
        }
        $taskId = $row['id'];
        $shaped = $this->baseShape($row);
        $shaped['status_move'] = $this->shapeMove((new TaskStatusMoveModel())->pendingForTask($taskId));
        $shaped['comments']    = array_map(fn ($c) => [
            'id' => $c['id'], 'at' => $c['created_at'], 'actor' => $c['actor_name'] ?? '',
            'body' => $c['body'], 'evidence_id' => $c['evidence_id'] ?: null,
        ], (new CommentModel())->forTask($taskId));
        $shaped['activity'] = array_map(fn ($a) => [
            'id' => $a['id'], 'at' => $a['created_at'], 'actor' => $a['actor_name'],
            'action' => $a['action'], 'evidence_id' => $a['evidence_id'] ?: null,
        ], (new ActivityLogModel())->forObject('task', $taskId));
        $shaped['evidences'] = array_map(fn ($e) => [
            'id' => $e['id'], 'at' => $e['created_at'], 'actor' => $e['actor_name'] ?? '',
            'kind' => $e['kind'], 'name' => $e['file_name'], 'mime' => $e['file_mime'],
            'size' => (int) $e['file_size'], 'file_url' => "/api/evidences/{$e['id']}/file", 'note' => $e['note'],
        ], (new TaskEvidenceModel())->forTask($taskId));

        return $shaped;
    }

    /** @param array<string, mixed> $row */
    private function baseShape(array $row): array
    {
        return [
            'id'               => $row['id'],
            'code'             => $row['code'] ?? '',
            'title'            => $row['title'],
            'description'      => $row['description'],
            'dashboard'        => $row['dashboard_name'] ?? '',
            'dashboard_id'     => $row['dashboard_id'],
            'requirement_id'   => $row['requirement_id'],
            'requirement_code' => $row['requirement_code'] ?? '',
            'status'           => $row['status'],
            'priority'         => $row['priority'] ?? 'medium',
            'approval_state'   => $row['approval_state'],
            'assignee'         => $row['assignee_name'] ?? '',
            'pic'              => $row['assignee_name'] ?? '',
            'created_by'       => $row['creator_name'] ?? '',
            'requirement_owner' => $row['requirement_owner_name'] ?? '',
            'deadline'         => $row['deadline'],
            'created_at'       => $row['created_at'],
            'updated_at'       => $row['updated_at'],
            // List/board tidak ikut query comments (biar ringan). Default kosong supaya
            // frontend tidak crash baca task.comments.length; shapeDetailRow() menimpa ini
            // dengan comments sungguhan untuk halaman detail.
            'comments'         => [],
        ];
    }

    /** @param array<string, mixed>|null $move */
    private function shapeMove(?array $move): ?array
    {
        if ($move === null) {
            return null;
        }

        return [
            'from' => $move['from_status'], 'to' => $move['to_status'],
            'requested_by' => $move['requested_by_name'] ?? '', 'note' => $move['note'],
            'at' => $move['created_at'], 'evidence_id' => $move['evidence_id'] ?: null,
        ];
    }
}
