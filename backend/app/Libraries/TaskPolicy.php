<?php

namespace App\Libraries;

/**
 * Mirrors the role rules enforced client-side in
 * frontend/src/lib/taskModuleStore.svelte.js (manager/pm/teknis/viewer),
 * so the backend enforces the same rules instead of trusting the client.
 */
class TaskPolicy
{
    public static function functionalRole(?string $roleName): string
    {
        $normalized = strtoupper(trim((string) $roleName));
        return match ($normalized) {
            'ADMIN', 'MANAGER' => 'manager',
            'PM', 'PIC'        => 'pm',
            'TEKNIS'           => 'teknis',
            default            => 'viewer',
        };
    }

    /** Admin/Manager = override tertinggi, bisa approve/reject apa pun terlepas dari PM dashboard atau owner requirement-nya. @param array<string, mixed> $user */
    public static function isAdmin(array $user): bool
    {
        return self::functionalRole($user['role_name'] ?? null) === 'manager';
    }

    /** @param array<string, mixed> $user @param array<string, mixed> $dashboard */
    public static function isPmOfDashboard(array $user, array $dashboard): bool
    {
        $isPmRole     = self::functionalRole($user['role_name'] ?? null) === 'pm';
        $isAssignedPm = (string) ($dashboard['pm_id'] ?? '') === (string) $user['id'];

        return ($isPmRole && $isAssignedPm) || $isAssignedPm;
    }


    /** Siapa pun pembuat requirement-nya, bukan hanya role PM. @param array<string, mixed> $user @param array<string, mixed> $requirement */
    public static function isRequirementOwner(array $user, array $requirement): bool
    {
        return (string) ($requirement['created_by'] ?? '') === (string) $user['id'];
    }

    /** @param array<string, mixed> $user */
    public static function canCreateDashboard(array $user): bool
    {
        return self::canManageRegistry($user);
    }

    /** Kelola Dashboard Registry: buat, ubah, hapus, dan ganti status dashboard. @param array<string, mixed> $user */
    public static function canManageRegistry(array $user): bool
    {
        return in_array('manage_registry', $user['permission_keys'] ?? [], true);
    }

    /** @param array<string, mixed> $user */
    public static function canEditField(array $user): bool
    {
        return in_array('edit_field', $user['permission_keys'] ?? [], true);
    }

    /** @param array<string, mixed> $user */
    public static function canDeleteField(array $user): bool
    {
        return in_array('delete_field', $user['permission_keys'] ?? [], true);
    }

    /** Edit form add dashboard: sesuaikan field form registrasi dashboard. @param array<string, mixed> $user */
    public static function canEditDashboardForm(array $user): bool
    {
        return self::isAdmin($user) || in_array('edit_dashboard_form', $user['permission_keys'] ?? [], true);
    }

    /** @param array<string, mixed> $user @param array<string, mixed>|null $dashboard */
    public static function canManageRequirements(array $user, ?array $dashboard = null): bool
    {
        if (self::isAdmin($user)) {
            return true;
        }

        if (self::functionalRole($user['role_name'] ?? null) !== 'pm') {
            return false;
        }

        return $dashboard === null || self::isPmOfDashboard($user, $dashboard);
    }

    /** Tambah assignee ke requirement yang sudah ada. @param array<string, mixed> $user */
    public static function canAddAssignee(array $user): bool
    {
        return self::isAdmin($user) || in_array('add_assignee', $user['permission_keys'] ?? [], true);
    }

    /** Tambah requirement baru (termasuk tambah versi). @param array<string, mixed> $user */
    public static function canCreateRequirement(array $user): bool
    {
        return self::isAdmin($user) || in_array('create_requirement', $user['permission_keys'] ?? [], true);
    }

    /** @param array<string, mixed> $user */
    public static function canCreateTask(array $user): bool
    {
        return in_array('create_task', $user['permission_keys'] ?? [], true);
    }

    /** @param array<string, mixed> $user */
    public static function canAddField(array $user): bool
    {
        return in_array('add_field', $user['permission_keys'] ?? [], true);
    }

    /** @param array<string, mixed> $user */
    public static function canEditTask(array $user): bool
    {
        return self::functionalRole($user['role_name'] ?? null) === 'pm';
    }

    /** @param array<string, mixed> $user */
    public static function canUpdateBoard(array $user): bool
    {
        $role = self::functionalRole($user['role_name'] ?? null);

        return $role === 'pm' || $role === 'teknis';
    }

    /** @param array<string, mixed> $user */
    public static function canCommentOnTask(array $user): bool
    {
        return self::canUpdateBoard($user);
    }

    /** @param array<string, mixed> $user @param array<string, mixed> $dashboard */
    public static function canDeleteTask(array $user, array $dashboard): bool
    {
        return self::isPmOfDashboard($user, $dashboard);
    }

    /** Admin/Manager/PM melihat semua task. Role lain (Teknis/viewer) dibatasi per-task lewat canViewTask(). */
    public static function seesAllTasks(array $user): bool
    {
        $role = self::functionalRole($user['role_name'] ?? null);

        return $role === 'manager' || $role === 'pm';
    }

    /**
     * Admin/Manager/PM melihat semua task. Role lain hanya task yang relevan
     * untuknya: dia yang buat, dia salah satu assignee-nya, atau dia owner requirement-nya.
     * @param array<string, mixed> $user @param array<string, mixed> $task @param list<string> $assigneeIds
     */
    public static function canViewTask(array $user, array $task, array $assigneeIds = []): bool
    {
        if (self::seesAllTasks($user)) {
            return true;
        }
        $uid = (string) $user['id'];

        if ((string) ($task['created_by'] ?? '') === $uid
            || (string) ($task['assignee_id'] ?? '') === $uid
            || in_array($uid, $assigneeIds, true)
            || (string) ($task['requirement_owner_id'] ?? '') === $uid
        ) {
            return true;
        }

        // Tim teknis atau user yang dilibatkan dalam requirement terkait dapat melihat task rekan teknisnya
        if (! empty($task['requirement_id'])) {
            return db_connect()->table('requirement_team_members')
                ->where('requirement_id', $task['requirement_id'])
                ->where('user_id', $uid)
                ->countAllResults() > 0;
        }

        return false;
    }

    /**
     * Menentukan apakah user berhak mengubah/mengupdate progress atau status sebuah task.
     * - Admin/Manager: selalu berhak (full override).
     * - PM Dashboard terkait: berhak.
     * - Owner requirement terkait: berhak.
     * - Teknis: HANYA berhak jika task ditugaskan kepadanya (assignee_id / assigneeIds) atau dia pembuat task tersebut.
     * - Role lainnya / viewer: tidak berhak.
     *
     * @param array<string, mixed> $user
     * @param array<string, mixed> $task
     * @param list<string> $assigneeIds
     * @param array<string, mixed>|null $dashboard
     * @param array<string, mixed>|null $requirement
     */
    public static function canUpdateTaskProgress(
        array $user,
        array $task,
        array $assigneeIds = [],
        ?array $dashboard = null,
        ?array $requirement = null
    ): bool {
        if (self::isAdmin($user)) {
            return true;
        }

        $role = self::functionalRole($user['role_name'] ?? null);

        // Jika user adalah PM dari dashboard task ini
        if ($role === 'pm' && $dashboard !== null && self::isPmOfDashboard($user, $dashboard)) {
            return true;
        }

        // Jika user adalah owner dari requirement task ini
        if ($requirement !== null && self::isRequirementOwner($user, $requirement)) {
            return true;
        }

        // Untuk tim teknis, hanya boleh update jika task tersebut di-assign kepadanya atau dia pembuatnya
        $uid = (string) $user['id'];
        $isAssigned = (string) ($task['assignee_id'] ?? '') === $uid
            || (string) ($task['pic_id'] ?? '') === $uid
            || in_array($uid, $assigneeIds, true)
            || (string) ($task['created_by'] ?? '') === $uid;

        if ($role === 'teknis') {
            return $isAssigned;
        }

        return false;
    }
}

