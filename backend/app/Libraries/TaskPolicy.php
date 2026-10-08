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
        return match ($roleName) {
            'Admin', 'Manager' => 'manager',
            'PM' => 'pm',
            'Teknis' => 'teknis',
            default => 'viewer',
        };
    }

    /** @param array<string, mixed> $user @param array<string, mixed> $dashboard */
    public static function isPmOfDashboard(array $user, array $dashboard): bool
    {
        return self::functionalRole($user['role_name'] ?? null) === 'pm'
            && (string) ($dashboard['pm_id'] ?? '') === (string) $user['id'];
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

    /** @param array<string, mixed> $user @param array<string, mixed>|null $dashboard */
    public static function canManageRequirements(array $user, ?array $dashboard = null): bool
    {
        if (self::functionalRole($user['role_name'] ?? null) !== 'pm') {
            return false;
        }

        return $dashboard === null || self::isPmOfDashboard($user, $dashboard);
    }

    /** Tambah assignee ke requirement yang sudah ada. @param array<string, mixed> $user */
    public static function canAddAssignee(array $user): bool
    {
        return in_array('add_assignee', $user['permission_keys'] ?? [], true);
    }

    /** Tambah requirement baru (termasuk tambah versi). @param array<string, mixed> $user */
    public static function canCreateRequirement(array $user): bool
    {
        return in_array('create_requirement', $user['permission_keys'] ?? [], true);
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
     * untuknya: dia yang buat, dia assignee-nya, atau dia owner requirement-nya.
     * @param array<string, mixed> $user @param array<string, mixed> $task
     */
    public static function canViewTask(array $user, array $task): bool
    {
        if (self::seesAllTasks($user)) {
            return true;
        }
        $uid = (string) $user['id'];

        return (string) ($task['created_by'] ?? '') === $uid
            || (string) ($task['assignee_id'] ?? '') === $uid
            || (string) ($task['requirement_owner_id'] ?? '') === $uid;
    }
}
