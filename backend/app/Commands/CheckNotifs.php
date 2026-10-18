<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class CheckNotifs extends BaseCommand
{
    protected $group       = 'Custom';
    protected $name        = 'app:check-notifs';
    protected $description = 'Check notifications and tasks in database';

    public function run(array $params)
    {
        $db = \Config\Database::connect();
        CLI::write("=== TASKS ===", 'yellow');
        $tasks = $db->table('tasks')->select('id, code, title, status, approval_state, created_by')->get()->getResultArray();
        foreach ($tasks as $t) {
            $assignees = $db->table('task_assignees')->join('users', 'users.id = task_assignees.user_id')->where('task_assignees.task_id', $t['id'])->select('users.name, users.id')->get()->getResultArray();
            $aNames = array_column($assignees, 'name');
            CLI::write("Task #{$t['id']} [{$t['code']}] - {$t['title']} | status: {$t['status']} | approval_state: {$t['approval_state']} | created_by: {$t['created_by']} | assignees: " . implode(', ', $aNames));
        }

        CLI::write("\n=== RECENT NOTIFICATIONS ===", 'yellow');
        $notifs = $db->table('notifications')->orderBy('created_at', 'DESC')->limit(10)->get()->getResultArray();
        foreach ($notifs as $n) {
            CLI::write("ID: {$n['id']} | To: {$n['to_user_id']} | Type: {$n['type']} | Title: {$n['title']} | Read: {$n['is_read']}");
            CLI::write("   Body: {$n['body']}");
        }



        CLI::write("\n=== ROLE PERMISSIONS ===", 'yellow');
        $rolePerms = $db->table('role_permissions')
            ->join('roles', 'roles.id = role_permissions.role_id')
            ->join('permissions', 'permissions.id = role_permissions.permission_id')
            ->select('roles.name as role_name, permissions.perm_key as perm_key')
            ->orderBy('roles.name, permissions.perm_key')
            ->get()->getResultArray();
        $byRole = [];
        foreach ($rolePerms as $rp) {
            $byRole[$rp['role_name']][] = $rp['perm_key'];
        }
        foreach ($byRole as $rName => $keys) {
            CLI::write("Role {$rName}: " . implode(', ', $keys));
        }
    }
}
