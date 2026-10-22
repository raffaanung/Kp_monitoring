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
            'ADMIN', 'MANAGER', 'SUPERADMIN'          => 'admin',
            'DEVELOPER', 'DEV', 'PM', 'PIC', 'TEKNIS' => 'developer',
            default                                   => 'viewer',
        };
    }

    /** Admin = override tertinggi. @param array<string, mixed> $user */
    public static function isAdmin(array $user): bool
    {
        $role = self::functionalRole($user['role_name'] ?? null);
        return $role === 'admin' || $role === 'manager';
    }

    /** Developer & Admin memiliki hak modifikasi task & requirement. @param array<string, mixed> $user */
    public static function isDeveloper(array $user): bool
    {
        $role = self::functionalRole($user['role_name'] ?? null);
        return $role === 'developer' || $role === 'admin' || $role === 'manager';
    }

    /** @param array<string, mixed> $user @param array<string, mixed> $dashboard */
    public static function isPmOfDashboard(array $user, array $dashboard): bool
    {
        return self::isDeveloper($user);
    }

    /** @param array<string, mixed> $user @param array<string, mixed> $requirement */
    public static function isRequirementOwner(array $user, array $requirement): bool
    {
        return self::isDeveloper($user);
    }

    /** @param array<string, mixed> $user */
    public static function canCreateDashboard(array $user): bool
    {
        return self::canManageRegistry($user);
    }

    /** Kelola Dashboard Registry: buat, ubah, hapus, dan ganti status dashboard. Developer & Admin sama-sama berhak. @param array<string, mixed> $user */
    public static function canManageRegistry(array $user): bool
    {
        return self::isDeveloper($user);
    }

    /** Kelola Role & Permission: khusus hanya bisa diubah/dikelola oleh Admin. @param array<string, mixed> $user */
    public static function canManageRoles(array $user): bool
    {
        return self::isAdmin($user);
    }

    /** Kelola User: khusus hanya bisa dibuat/dikelola oleh Admin. @param array<string, mixed> $user */
    public static function canManageUsers(array $user): bool
    {
        return self::isAdmin($user);
    }

    /** @param array<string, mixed> $user */
    public static function canEditField(array $user): bool
    {
        return self::isDeveloper($user);
    }

    /** @param array<string, mixed> $user */
    public static function canDeleteField(array $user): bool
    {
        return self::isDeveloper($user);
    }

    /** Edit form add dashboard: sesuaikan field form registrasi dashboard. @param array<string, mixed> $user */
    public static function canEditDashboardForm(array $user): bool
    {
        return self::isDeveloper($user);
    }

    /** @param array<string, mixed> $user @param array<string, mixed>|null $dashboard */
    public static function canManageRequirements(array $user, ?array $dashboard = null): bool
    {
        return self::isDeveloper($user);
    }

    /** Tambah assignee ke requirement yang sudah ada. @param array<string, mixed> $user */
    public static function canAddAssignee(array $user): bool
    {
        return self::isDeveloper($user) || in_array('add_assignee', $user['permission_keys'] ?? [], true);
    }

    /** Tambah requirement baru (termasuk tambah versi). @param array<string, mixed> $user */
    public static function canCreateRequirement(array $user): bool
    {
        return self::isDeveloper($user) || in_array('create_requirement', $user['permission_keys'] ?? [], true);
    }

    /** @param array<string, mixed> $user */
    public static function canCreateTask(array $user): bool
    {
        return self::isDeveloper($user) || in_array('create_task', $user['permission_keys'] ?? [], true);
    }

    /** @param array<string, mixed> $user */
    public static function canAddField(array $user): bool
    {
        return self::isDeveloper($user) || in_array('add_field', $user['permission_keys'] ?? [], true);
    }

    /** @param array<string, mixed> $user */
    public static function canEditTask(array $user): bool
    {
        return self::isDeveloper($user);
    }

    /** @param array<string, mixed> $user */
    public static function canUpdateBoard(array $user): bool
    {
        return self::isDeveloper($user);
    }

    /** @param array<string, mixed> $user */
    public static function canCommentOnTask(array $user): bool
    {
        return self::isDeveloper($user);
    }

    /** @param array<string, mixed> $user @param array<string, mixed> $dashboard */
    public static function canDeleteTask(array $user, array $dashboard): bool
    {
        return self::isDeveloper($user);
    }

    /** Admin, Developer, dan Viewer dapat melihat task. @param array<string, mixed> $user */
    public static function seesAllTasks(array $user): bool
    {
        return true;
    }

    /**
     * Semua task dapat dilihat oleh pengguna yang terautentikasi.
     * @param array<string, mixed> $user @param array<string, mixed> $task @param list<string> $assigneeIds
     */
    public static function canViewTask(array $user, array $task, array $assigneeIds = []): bool
    {
        return true;
    }

    /**
     * Menentukan apakah user berhak mengubah/mengupdate progress atau status sebuah task.
     * - Admin & Developer: selalu berhak (direct update, tanpa approval staging).
     * - Viewer: read-only.
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
        return self::isDeveloper($user);
    }
}

