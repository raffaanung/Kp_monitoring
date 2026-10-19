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
            return $this->jsonError('Not signed in', 401);
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
        $taskModel = new TaskModel();
        $rows      = $taskModel->listRich(array_filter($filters));
        $taskIds   = array_column($rows, 'id');

        // 1 query per jenis data buat semua task sekaligus, bukan per task (hindari N+1).
        $moveMap      = (new TaskStatusMoveModel())->pendingForTasks($taskIds);
        $assigneesMap = $taskModel->assigneesForTasks($taskIds);
        $evidencesMap = (new TaskEvidenceModel())->forTasks($taskIds);
        $activityMap  = (new ActivityLogModel())->forObjects('task', $taskIds);
        $movesMap     = (new TaskStatusMoveModel())->allForTasks($taskIds);

        return $this->jsonOk(array_map(
            fn ($r) => $this->shapeListRow(
                $r,
                $moveMap[$r['id']] ?? null,
                $assigneesMap[$r['id']] ?? [],
                $evidencesMap[$r['id']] ?? [],
                $activityMap[$r['id']] ?? [],
                $movesMap[$r['id']] ?? [],
            ),
            $rows,
        ));
    }

    public function show(string $id = '0'): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null) {
            return $this->jsonError('Not signed in', 401);
        }

        $taskModel = new TaskModel();
        $row       = $taskModel->findRichById($id);
        if ($row === null) {
            return $this->jsonError('Task not found', 404);
        }
        if (! TaskPolicy::canViewTask($user, $row, $taskModel->assigneeIdsFor($id))) {
            return $this->jsonError('You are not allowed to view this task', 403);
        }

        return $this->jsonOk($this->shapeDetailRow($row));
    }

    public function create(): ResponseInterface
    {
        $user = $this->authUser();
        if (! TaskPolicy::canCreateTask($user)) {
            return $this->jsonError('You do not have permission to add a task', 403);
        }

        $title         = trim((string) $this->request->getJsonVar('title'));
        $description   = trim((string) ($this->request->getJsonVar('description') ?? ''));
        $dashboardName = trim((string) $this->request->getJsonVar('dashboard'));
        $requirementId = $this->uuidOrNull($this->request->getJsonVar('requirement_id'));
        $deadline      = (string) $this->request->getJsonVar('deadline');
        $status        = (string) ($this->request->getJsonVar('status') ?: 'backlog');

        // Terima banyak assignee sekaligus (satu task, banyak orang) — tetap
        // terima 'assignee' tunggal (lama) buat backward-compat.
        $assigneeNames = $this->request->getJsonVar('assignees');
        if (! is_array($assigneeNames) || $assigneeNames === []) {
            $single        = trim((string) $this->request->getJsonVar('assignee'));
            $assigneeNames = $single !== '' ? [$single] : [];
        }

        if ($title === '' || $requirementId === null) {
            return $this->jsonError('Title and requirement are required', 422);
        }

        $dashboardModel = new DashboardModel();
        $dashboard      = $dashboardModel->where('name', $dashboardName)->first();
        if ($dashboard === null) {
            return $this->jsonError('Dashboard not found', 422);
        }

        $userModel   = new UserModel();
        $assigneeIds = [];
        foreach (array_unique(array_filter(array_map('trim', $assigneeNames))) as $name) {
            $row = $userModel->where('name', $name)->first();
            if ($row !== null) {
                $assigneeIds[] = $row['id'];
            }
        }
        $primaryAssigneeId = $assigneeIds[0] ?? null;

        $requirement = (new RequirementModel())->find($requirementId);
        if ($requirement === null) {
            return $this->jsonError('Requirement not found', 422);
        }
        // PIC sudah di-assign oleh manajer dan berhak mengatur task & tim teknis.
        // Task yang dibuat langsung berstatus approved (aktif di Backlog).
        $approvalState = 'approved';

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
            'pic_id'           => $primaryAssigneeId,
            'assignee_id'      => $primaryAssigneeId,
            'created_by'       => $user['id'],
            'deadline'         => $deadline ?: null,
        ], false);
        $taskModel->syncAssignees($taskId, $assigneeIds);
        if ($requirementId) {
            (new RequirementModel())->syncStatusFromTasks($requirementId);
        }

        (new ActivityLogModel())->log([
            'actor_id'     => $user['id'],
            'actor_name'   => $user['name'],
            'action'       => 'Task dibuat dari requirement · Backlog',
            'action_type'  => 'create',
            'object_type'  => 'task',
            'object_id'    => $taskId,
            'object_label' => $title,
            'dashboard_id' => $dashboard['id'],
        ]);

        foreach ($assigneeIds as $assigneeId) {
            if ($assigneeId !== $user['id']) {
                (new NotificationModel())->notify(
                    'approved',
                    'Task baru',
                    "{$user['name']} menugaskan \"{$title}\" kepada Anda",
                    $assigneeId,
                    $taskId,
                    $dashboard['id'],
                );
            }
        }

        return $this->jsonOk($this->shapeDetailRow((new TaskModel())->findRichById($taskId)));
    }

    /** Menyetujui task / pengajuan status move oleh PIC atau Admin/Manager. */
    public function approve(string $id = '0'): ResponseInterface
    {
        $taskId    = $id;
        $user      = $this->authUser();
        $taskModel = new TaskModel();
        $task      = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task not found', 404);
        }
        $isAdmin = TaskPolicy::isAdmin($user);
        if (! $isAdmin) {
            $dashboard   = $task['dashboard_id'] ? (new DashboardModel())->find($task['dashboard_id']) : null;
            $requirement = $task['requirement_id'] ? (new RequirementModel())->find($task['requirement_id']) : null;
            $isPm        = $dashboard !== null && TaskPolicy::isPmOfDashboard($user, $dashboard);
            $isOwner     = $requirement !== null && TaskPolicy::isRequirementOwner($user, $requirement);
            if (! $isPm && ! $isOwner) {
                return $this->jsonError('Only the PIC (PM) or Admin/Manager can approve this task', 403);
            }
        }

        // Jika ada status_move yang pending, approve sekalian status_move-nya
        $moveModel = new TaskStatusMoveModel();
        $move      = $moveModel->pendingForTask($taskId);
        if ($move !== null) {
            return $this->resolveMove($taskId, true);
        }

        $note       = trim((string) ($this->request->getJsonVar('note') ?? ''));
        $evidenceId = $this->uuidOrNull($this->request->getJsonVar('evidence_id'));

        $taskModel->update($taskId, ['approval_state' => 'approved']);
        if ($evidenceId) {
            (new TaskEvidenceModel())->update($evidenceId, ['kind' => 'pm_approve']);
        }
        (new ActivityLogModel())->log([
            'actor_id' => $user['id'], 'actor_name' => $user['name'],
            'action' => trim("Task disetujui oleh PIC/Admin. {$note}"), 'action_type' => 'approval',
            'object_type' => 'task', 'object_id' => $taskId, 'object_label' => $task['title'],
            'dashboard_id' => $task['dashboard_id'], 'evidence_id' => $evidenceId,
        ]);
        $assigneeRows = $taskModel->assigneesForTasks([$taskId])[$taskId] ?? [];
        $targetRecipients = array_values(array_filter(
            array_column($assigneeRows, 'id'),
            fn ($uid) => $uid !== $user['id']
        ));
        if ($targetRecipients !== []) {
            (new NotificationModel())->notifyMany(
                'approved', 'Task disetujui', "\"{$task['title']}\" disetujui oleh PIC",
                $targetRecipients, $taskId, $task['dashboard_id'],
            );
        }

        return $this->jsonOk(['result' => 'approved', 'task' => $this->shapeDetailRow($taskModel->findRichById($taskId), $assigneeRows, true, null)]);
    }

    /** PIC atau Admin/Manager mengembalikan (return) task ke tim teknis untuk revisi. */
    public function requestRevision(string $id = '0'): ResponseInterface
    {
        $taskId    = $id;
        $user      = $this->authUser();
        $taskModel = new TaskModel();
        $task      = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task not found', 404);
        }
        $dashboard   = $task['dashboard_id'] ? (new DashboardModel())->find($task['dashboard_id']) : null;
        $requirement = $task['requirement_id'] ? (new RequirementModel())->find($task['requirement_id']) : null;
        $isPm        = $dashboard !== null && TaskPolicy::isPmOfDashboard($user, $dashboard);
        $isOwner     = $requirement !== null && TaskPolicy::isRequirementOwner($user, $requirement);
        if (! $isPm && ! $isOwner && ! TaskPolicy::isAdmin($user)) {
            return $this->jsonError('Only the PIC (PM) or Admin/Manager can return this task', 403);
        }

        // Jika ada status_move yang pending, return status move-nya
        $moveModel = new TaskStatusMoveModel();
        $move      = $moveModel->pendingForTask($taskId);
        if ($move !== null) {
            return $this->resolveMove($taskId, false);
        }

        $note       = trim((string) ($this->request->getJsonVar('note') ?? '')) ?: 'Perlu revisi.';
        $evidenceId = $this->uuidOrNull($this->request->getJsonVar('evidence_id'));

        $taskModel->update($taskId, ['approval_state' => 'revision']);
        if ($evidenceId) {
            (new TaskEvidenceModel())->update($evidenceId, ['kind' => 'pm_revision']);
        }
        (new ActivityLogModel())->log([
            'actor_id' => $user['id'], 'actor_name' => $user['name'],
            'action' => "Task dikembalikan oleh PIC. {$note}", 'action_type' => 'approval',
            'object_type' => 'task', 'object_id' => $taskId, 'object_label' => $task['title'],
            'dashboard_id' => $task['dashboard_id'], 'evidence_id' => $evidenceId, 'reason' => $note,
        ]);
        $assigneeRows = (new TaskModel())->assigneesForTasks([$taskId])[$taskId] ?? [];
        $assigneeUserIds = array_column($assigneeRows, 'id');
        $targetRecipients = array_unique(array_filter(array_merge([$task['created_by']], $assigneeUserIds)));
        foreach ($targetRecipients as $recipientId) {
            if ($recipientId !== $user['id']) {
                (new NotificationModel())->notify(
                    'revision', 'Task dikembalikan (Return)', "\"{$task['title']}\": {$note}",
                    $recipientId, $taskId, $task['dashboard_id'],
                );
            }
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
            return $this->jsonError('Task not found', 404);
        }
        $dashboard   = $task['dashboard_id'] ? (new DashboardModel())->find($task['dashboard_id']) : null;
        $requirement = $task['requirement_id'] ? (new RequirementModel())->find($task['requirement_id']) : null;
        $isCreator   = (string) ($task['created_by'] ?? '') === (string) $user['id'];
        $isOwner     = $requirement !== null && TaskPolicy::isRequirementOwner($user, $requirement);
        $isPm        = $dashboard !== null && TaskPolicy::isPmOfDashboard($user, $dashboard);
        $isAssignee  = in_array((string) $user['id'], $taskModel->assigneeIdsFor($taskId), true);
        if (! $isCreator && ! $isOwner && ! $isPm && ! $isAssignee && ! TaskPolicy::isAdmin($user)) {
            return $this->jsonError('Only the creator, the requirement owner, the PIC, or the assignee can resubmit this task', 403);
        }
        if ($task['approval_state'] !== 'revision') {
            return $this->jsonError('This task is not in revision', 422);
        }

        $taskModel->update($taskId, ['approval_state' => 'pending']);
        (new ActivityLogModel())->log([
            'actor_id' => $user['id'], 'actor_name' => $user['name'],
            'action' => 'Task diajukan ulang, menunggu approval owner', 'action_type' => 'status_change',
            'object_type' => 'task', 'object_id' => $taskId, 'object_label' => $task['title'],
            'dashboard_id' => $task['dashboard_id'],
        ]);
        // Baris move baru (status 'pending') supaya riwayat return yang lama tetap kelihatan
        // (gak ketimpa), dan resubmit-nya sendiri tampil sebagai step kuning tersendiri di Journey.
        (new TaskStatusMoveModel())->insert([
            'id'                  => Id::new(),
            'task_id'             => $taskId,
            'from_status'         => $task['status'],
            'to_status'           => $task['status'],
            'to_progress_percent' => $task['progress_percent'],
            'requested_by'        => $user['id'],
            'note'                => 'Diajukan ulang untuk ditinjau kembali.',
            'status'              => 'pending',
        ], false);
        $notified = [];
        if ($requirement !== null && $requirement['created_by'] && $requirement['created_by'] !== $user['id']) {
            (new NotificationModel())->notify(
                'approval_request', 'Task diajukan ulang', "\"{$task['title']}\" diajukan ulang dan menunggu persetujuan Anda",
                $requirement['created_by'], $taskId, $task['dashboard_id'],
            );
            $notified[] = $requirement['created_by'];
        }
        // PIC dashboard juga perlu tahu — biasanya dialah yang minta revisi duluan, bukan cuma pemilik requirement.
        if ($dashboard !== null && $dashboard['pm_id'] && $dashboard['pm_id'] !== $user['id'] && ! in_array($dashboard['pm_id'], $notified, true)) {
            (new NotificationModel())->notify(
                'approval_request', 'Task diajukan ulang', "\"{$task['title']}\" diajukan ulang dan menunggu persetujuan Anda",
                $dashboard['pm_id'], $taskId, $task['dashboard_id'],
            );
        }

        return $this->jsonOk(['result' => 'pending', 'task' => $this->shapeDetailRow($taskModel->findRichById($taskId))]);
    }

    public function update(string $id = '0'): ResponseInterface
    {
        $taskId = $id;
        $user   = $this->authUser();
        $role   = TaskPolicy::functionalRole($user['role_name'] ?? null);
        if ($role !== 'pm' && ! TaskPolicy::isAdmin($user)) {
            return $this->jsonError('Only a PM can edit task details', 403);
        }

        $taskModel = new TaskModel();
        $task      = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task not found', 404);
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
        $progress = $this->request->getJsonVar('progress_percent');
        if ($progress !== null) {
            $patch['progress_percent'] = max(0, min(100, (int) $progress));
        }
        $assigneeNames = $this->request->getJsonVar('assignees');
        $syncedIds     = null;
        if (is_array($assigneeNames)) {
            $userModel = new UserModel();
            $ids       = [];
            foreach (array_unique(array_filter(array_map('trim', $assigneeNames))) as $name) {
                $row = $userModel->where('name', $name)->first();
                if ($row !== null) {
                    $ids[] = $row['id'];
                }
            }
            $syncedIds            = $ids;
            $patch['assignee_id'] = $ids[0] ?? null;
            $patch['pic_id']      = $ids[0] ?? null;
        } else {
            $assigneeName = $this->request->getJsonVar('assignee');
            if ($assigneeName !== null) {
                $row = (new UserModel())->where('name', trim((string) $assigneeName))->first();
                if ($row !== null) {
                    $patch['assignee_id'] = $row['id'];
                    $patch['pic_id']      = $row['id'];
                    $syncedIds            = [$row['id']];
                }
            }
        }

        if ($patch !== []) {
            $taskModel->update($taskId, $patch);
            if (!empty($task['requirement_id'])) {
                (new RequirementModel())->syncStatusFromTasks($task['requirement_id']);
            }
        }
        if ($syncedIds !== null) {
            $taskModel->syncAssignees($taskId, $syncedIds);
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
            return $this->jsonError('Task not found', 404);
        }
        $dashboard = $task['dashboard_id'] ? (new DashboardModel())->find($task['dashboard_id']) : null;
        if ($dashboard === null || ! TaskPolicy::canDeleteTask($user, $dashboard)) {
            return $this->jsonError("Only this dashboard's PM can delete the task", 403);
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

        // Progress_percent opsional — bisa dibawa bareng perpindahan status, atau sendirian
        // (progress-only request, status tetap) — dua-duanya lewat alur approval yang sama.
        $progressRaw     = $this->request->getJsonVar('progress_percent');
        $progressPercent = $progressRaw !== null ? max(0, min(100, (int) $progressRaw)) : null;

        $user        = $this->authUser();
        $role        = TaskPolicy::functionalRole($user['role_name'] ?? null);
        $taskModel   = new TaskModel();
        $task        = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task not found', 404);
        }
        $requirement = $task['requirement_id'] ? (new RequirementModel())->find($task['requirement_id']) : null;
        $dashboard   = $task['dashboard_id'] ? (new DashboardModel())->find($task['dashboard_id']) : null;
        $assigneeIds = $taskModel->assigneeIdsFor($taskId);

        if (! TaskPolicy::canUpdateTaskProgress($user, $task, $assigneeIds, $dashboard, $requirement)) {
            return $this->jsonError('Anda hanya dapat mengubah progress/status task yang ditugaskan kepada Anda', 403);
        }

        // Owner requirement boleh geser langsung, apa pun role-nya (termasuk Admin) — sama seperti PM.
        $isOwner = $requirement !== null && TaskPolicy::isRequirementOwner($user, $requirement);

        $statusChanged   = $task['status'] !== $status;
        $progressChanged = $progressPercent !== null && $progressPercent !== (int) ($task['progress_percent'] ?? 0);
        if (! $statusChanged && ! $progressChanged) {
            return $this->jsonOk(['result' => 'moved', 'task' => $this->shapeDetailRow($taskModel->findRichById($taskId))]);
        }

        $moveModel = new TaskStatusMoveModel();
        if ($moveModel->pendingForTask($taskId) !== null) {
            return $this->jsonError('A move request is still waiting', 422);
        }

        $dashboard = $task['dashboard_id'] ? (new DashboardModel())->find($task['dashboard_id']) : null;

        // Verb + deskripsi dipisah supaya nggak dobel kata ("Pindah pindah ke X") — deskripsi cuma
        // bagian tujuannya aja, verb-nya ("pindah"/"update progress") ditentukan oleh pemanggil.
        $verb       = $statusChanged ? 'pindah' : 'update progress';
        $describeChange = function () use ($statusChanged, $progressChanged, $status, $progressPercent): string {
            if ($statusChanged && $progressChanged) {
                return "ke {$status} dengan progress {$progressPercent}%";
            }
            if ($statusChanged) {
                return "ke {$status}";
            }

            return "ke {$progressPercent}%";
        };

        if ($isOwner || ($role === 'pm' && $dashboard !== null && TaskPolicy::isPmOfDashboard($user, $dashboard))) {
            $patch = ['status' => $status];
            if ($progressChanged) {
                $patch['progress_percent'] = $progressPercent;
            }
            $taskModel->update($taskId, $patch);
            if (!empty($task['requirement_id'])) {
                (new RequirementModel())->syncStatusFromTasks($task['requirement_id']);
            }
            if ($evidenceId) {
                (new TaskEvidenceModel())->update($evidenceId, ['kind' => 'pm_approve']);
            }
            (new ActivityLogModel())->log([
                'actor_id' => $user['id'], 'actor_name' => $user['name'],
                'action' => ucfirst("{$verb} " . $describeChange()) . ". {$note}", 'action_type' => 'status_change',
                'object_type' => 'task', 'object_id' => $taskId, 'object_label' => $task['title'],
                'dashboard_id' => $task['dashboard_id'], 'evidence_id' => $evidenceId,
            ]);

            return $this->jsonOk(['result' => 'moved', 'task' => $this->shapeDetailRow($taskModel->findRichById($taskId))]);
        }

        if ($role === 'teknis') {
            $moveId = Id::new();
            $moveModel->insert([
                'id' => $moveId, 'task_id' => $taskId, 'from_status' => $task['status'], 'to_status' => $status,
                'to_progress_percent' => $progressChanged ? $progressPercent : null,
                'requested_by' => $user['id'], 'note' => $note, 'evidence_id' => $evidenceId,
                'status' => 'pending',
            ], false);
            if ($evidenceId) {
                (new TaskEvidenceModel())->update($evidenceId, ['kind' => 'move_request']);
            }
            (new ActivityLogModel())->log([
                'actor_id' => $user['id'], 'actor_name' => $user['name'],
                'action' => "Ajukan {$verb} " . $describeChange() . ". {$note}", 'action_type' => 'status_change',
                'object_type' => 'task', 'object_id' => $taskId, 'object_label' => $task['title'],
                'dashboard_id' => $task['dashboard_id'], 'evidence_id' => $evidenceId,
            ]);
            if ($dashboard !== null && $dashboard['pm_id']) {
                (new NotificationModel())->notify(
                    'move_request', 'Request pindah status',
                    "{$user['name']} minta {$verb} " . $describeChange() . " untuk \"{$task['title']}\"",
                    $dashboard['pm_id'], $taskId, $task['dashboard_id'],
                );
            }

            return $this->jsonOk(['result' => 'requested', 'move_id' => $moveId, 'task' => $this->shapeDetailRow($taskModel->findRichById($taskId))]);
        }

        return $this->jsonError('You are not allowed to move this task', 403);
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
            return $this->jsonError('Task not found', 404);
        }
        $isAdmin = TaskPolicy::isAdmin($user);
        if (! $isAdmin) {
            $dashboard   = $task['dashboard_id'] ? (new DashboardModel())->find($task['dashboard_id']) : null;
            $requirement = $task['requirement_id'] ? (new RequirementModel())->find($task['requirement_id']) : null;
            $isPm        = $dashboard !== null && TaskPolicy::isPmOfDashboard($user, $dashboard);
            $isOwner     = $requirement !== null && TaskPolicy::isRequirementOwner($user, $requirement);
            if (! $isPm && ! $isOwner) {
                return $this->jsonError("Only this dashboard's PM or the requirement owner can decide", 403);
            }
        }

        $moveModel = new TaskStatusMoveModel();
        $move      = $moveModel->pendingForTask($taskId);
        if ($move === null) {
            return $this->jsonError('There is no waiting request', 422);
        }

        $moveModel->update($move['id'], ['status' => $approve ? 'approved' : 'rejected']);
        if ($evidenceId) {
            (new TaskEvidenceModel())->update($evidenceId, ['kind' => $approve ? 'pm_approve' : 'pm_return']);
        }

        if ($approve) {
            $moveStatusChanged = $move['from_status'] !== $move['to_status'];
            $moveProgressGiven = $move['to_progress_percent'] !== null;

            $patch = ['status' => $move['to_status'], 'approval_state' => 'approved'];
            if ($moveProgressGiven) {
                $patch['progress_percent'] = (int) $move['to_progress_percent'];
            }
            $taskModel->update($taskId, $patch);
            if (!empty($task['requirement_id'])) {
                (new RequirementModel())->syncStatusFromTasks($task['requirement_id']);
            }

            $verb = $moveStatusChanged ? 'pindah' : 'update progress';
            if ($moveStatusChanged && $moveProgressGiven) {
                $changeDesc = "ke {$move['to_status']} dengan progress {$move['to_progress_percent']}%";
            } elseif ($moveStatusChanged) {
                $changeDesc = "ke {$move['to_status']}";
            } else {
                $changeDesc = "ke {$move['to_progress_percent']}%";
            }
            $actionText  = "Setujui {$verb} {$changeDesc}. {$note}";
            $notifType   = 'move_approved';
            $notifTitle  = 'Request disetujui';
            $notifBody   = ucfirst("{$verb} {$changeDesc}") . " untuk \"{$task['title']}\" disetujui";
        } else {
            $taskModel->update($taskId, ['approval_state' => 'revision']);
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

        $assigneeRows = (new TaskModel())->assigneesForTasks([$taskId])[$taskId] ?? [];
        $assigneeUserIds = array_column($assigneeRows, 'id');
        $targetRecipients = array_values(array_filter(
            array_unique(array_filter(array_merge([$move['requested_by'] ?? null, $task['created_by']], $assigneeUserIds))),
            fn ($uid) => $uid !== $user['id']
        ));
        if ($targetRecipients !== []) {
            (new NotificationModel())->notifyMany($notifType, $notifTitle, "\"{$task['title']}\": {$notifBody}", $targetRecipients, $taskId, $task['dashboard_id']);
        }

        return $this->jsonOk($this->shapeDetailRow($taskModel->findRichById($taskId), $assigneeRows, true, null));
    }

    public function addComment(string $id = '0'): ResponseInterface
    {
        $taskId     = $id;
        $body       = trim((string) ($this->request->getJsonVar('body') ?? ''));
        $evidenceId = $this->uuidOrNull($this->request->getJsonVar('evidence_id'));

        $user = $this->authUser();
        if (! TaskPolicy::canCommentOnTask($user)) {
            return $this->jsonError('You are not allowed to comment', 403);
        }
        if ($body === '' && ! $evidenceId) {
            return $this->jsonError('A comment or attachment is required', 422);
        }

        $taskModel = new TaskModel();
        $task      = $taskModel->find($taskId);
        if ($task === null) {
            return $this->jsonError('Task not found', 404);
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

        $dashboard  = $task['dashboard_id'] ? (new DashboardModel())->find($task['dashboard_id']) : null;
        $recipients = array_unique(array_filter([
            $task['created_by'],
            $task['assignee_id'],
            ...$taskModel->assigneeIdsFor($taskId),
            $dashboard['pm_id'] ?? null,
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

    /** @param array<string, mixed> $row @param array<string, mixed>|null $move @param list<array{id:string,name:string}> $assignees @param list<array<string, mixed>> $evidences */
    /**
     * @param list<array<string, mixed>> $activity
     * @param list<array<string, mixed>> $moves
     */
    private function shapeListRow(array $row, ?array $move = null, array $assignees = [], array $evidences = [], array $activity = [], array $moves = []): array
    {
        $shaped = $this->baseShape($row, $assignees);
        $shaped['status_move'] = $this->shapeMove($move);
        $shaped['evidences']   = $evidences;
        // Journey & riwayat return di accordion Dashboard Detail butuh dua ini — tanpanya
        // getTaskJourney() di frontend selalu jatuh ke ringkasan sederhana (seolah gak ada riwayat).
        $shaped['activity'] = array_map(fn ($a) => [
            'id'          => $a['id'],
            'at'          => $a['created_at'],
            'actor'       => $a['actor_name'],
            'action'      => $a['action'],
            'action_type' => $a['action_type'] ?? null,
            'evidence_id' => $a['evidence_id'] ?: null,
            'reason'      => $a['reason'] ?? null,
        ], $activity);
        $shaped['status_moves'] = array_map(fn ($m) => [
            'id'                  => $m['id'],
            'from'                => $m['from_status'],
            'to'                  => $m['to_status'],
            'to_progress_percent' => $m['to_progress_percent'] !== null ? (int) $m['to_progress_percent'] : null,
            'requested_by'        => $m['requested_by_name'] ?? '',
            'note'                => $m['note'] ?? '',
            'status'              => $m['status'],
            'at'                  => $m['created_at'],
            'evidence_id'         => $m['evidence_id'] ?: null,
        ], $moves);

        return $shaped;
    }

    /**
     * @param array<string, mixed>|null $row
     * @param list<array{id:string,name:string}>|null $preloadedAssignees
     * @param bool $hasPreloadedMove
     * @param array<string, mixed>|null $preloadedMove
     */
    private function shapeDetailRow(?array $row, ?array $preloadedAssignees = null, bool $hasPreloadedMove = false, ?array $preloadedMove = null): ?array
    {
        if ($row === null) {
            return null;
        }
        $taskId    = $row['id'];
        $assignees = $preloadedAssignees ?? ((new TaskModel())->assigneesForTasks([$taskId])[$taskId] ?? []);
        $shaped    = $this->baseShape($row, $assignees);
        $shaped['status_move'] = $hasPreloadedMove ? $this->shapeMove($preloadedMove) : $this->shapeMove((new TaskStatusMoveModel())->pendingForTask($taskId));
        $shaped['comments']    = array_map(fn ($c) => [
            'id' => $c['id'], 'at' => $c['created_at'], 'actor' => $c['actor_name'] ?? '',
            'body' => $c['body'], 'evidence_id' => $c['evidence_id'] ?: null,
        ], (new CommentModel())->forTask($taskId));
        $shaped['activity'] = array_map(fn ($a) => [
            'id'          => $a['id'],
            'at'          => $a['created_at'],
            'actor'       => $a['actor_name'],
            'action'      => $a['action'],
            'action_type' => $a['action_type'] ?? null,
            'evidence_id' => $a['evidence_id'] ?: null,
            'reason'      => $a['reason'] ?? null,
        ], (new ActivityLogModel())->forObject('task', $taskId));
        $shaped['evidences'] = array_map(fn ($e) => [
            'id'               => $e['id'],
            'at'               => $e['created_at'],
            'actor'            => $e['actor_name'] ?? '',
            'kind'             => $e['kind'],
            'name'             => $e['file_name'],
            'mime'             => $e['file_mime'],
            'size'             => (int) $e['file_size'],
            'file_url'         => "/api/evidences/{$e['id']}/file",
            'note'             => $e['note'] ?? '',
            'progress_percent' => $e['progress_percent'] !== null ? (int) $e['progress_percent'] : null,
        ], (new TaskEvidenceModel())->forTask($taskId));
        $shaped['status_moves'] = array_map(fn ($m) => [
            'id'                  => $m['id'],
            'from'                => $m['from_status'],
            'to'                  => $m['to_status'],
            'to_progress_percent' => $m['to_progress_percent'] !== null ? (int) $m['to_progress_percent'] : null,
            'requested_by'        => $m['requested_by_name'] ?? '',
            'note'                => $m['note'] ?? '',
            'status'              => $m['status'],
            'at'                  => $m['created_at'],
            'evidence_id'         => $m['evidence_id'] ?: null,
        ], (new TaskStatusMoveModel())->allForTask($taskId));

        return $shaped;
    }

    /** @param array<string, mixed> $row @param list<array{id:string,name:string}> $assignees */
    private function baseShape(array $row, array $assignees = []): array
    {
        $names       = $assignees !== [] ? array_column($assignees, 'name') : array_filter([$row['assignee_name'] ?? '']);
        $assigneeStr = implode(', ', $names);

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
            'progress_percent' => (int) ($row['progress_percent'] ?? 0),
            'approval_state'   => $row['approval_state'],
            'assignee'         => $assigneeStr,
            'pic'              => $assigneeStr,
            'assignees'        => $names,
            'assignee_ids'     => array_column($assignees, 'id'),
            'created_by'       => $row['creator_name'] ?? '',
            'requirement_owner' => $row['requirement_owner_name'] ?? '',
            'deadline'         => $row['deadline'],
            'created_at'       => $row['created_at'],
            'updated_at'       => $row['updated_at'],
            'last_return'      => $this->getLastReturnInfo($row['id'], $row['approval_state'] ?? ''),
            // Default kosong supaya frontend tidak crash baca task.comments/evidences
            'evidences'        => [],
            'comments'         => [],
        ];
    }

    /** @param string $taskId @param string $approvalState */
    private function getLastReturnInfo(string $taskId, string $approvalState): ?array
    {
        if ($approvalState !== 'revision') {
            return null;
        }

        $log = (new ActivityLogModel())
            ->where('object_type', 'task')
            ->where('object_id', $taskId)
            ->where('action_type', 'approval')
            ->orderBy('created_at', 'DESC')
            ->first();

        if (! $log) {
            return [
                'actor'       => 'Admin',
                'at'          => null,
                'note'        => 'Task dikembalikan untuk revisi.',
                'action'      => 'Perlu revisi.',
                'evidence_id' => null,
            ];
        }

        $note = $log['reason'] ?? '';
        if ($note === '') {
            $note = preg_replace('/^(Owner minta revisi|Minta revisi|Task dikembalikan)\.\s*/i', '', (string) $log['action']);
        }

        return [
            'actor'       => $log['actor_name'] ?: 'Admin',
            'at'          => $log['created_at'],
            'note'        => $note ?: 'Perlu revisi.',
            'action'      => $log['action'],
            'evidence_id' => $log['evidence_id'] ?: null,
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
            'to_progress_percent' => $move['to_progress_percent'] !== null ? (int) $move['to_progress_percent'] : null,
            'requested_by' => $move['requested_by_name'] ?? '', 'note' => $move['note'],
            'at' => $move['created_at'], 'evidence_id' => $move['evidence_id'] ?: null,
        ];
    }
}
