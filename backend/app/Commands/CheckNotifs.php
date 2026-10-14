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

        CLI::write("\n=== ACTIVITY LOGS FOR TSK-045 ===", 'yellow');
        $logs = $db->table('activity_logs')->where('object_id', 'c715d91d-f81c-4dd4-81bc-52da58b7ef2e')->orderBy('created_at', 'DESC')->get()->getResultArray();
        foreach ($logs as $l) {
            CLI::write("Log [{$l['id']}] at {$l['created_at']} by {$l['actor_name']} ({$l['action_type']}): {$l['action']} | reason: {$l['reason']}");
        }

        CLI::write("\n=== RECENT NOTIFICATIONS ===", 'yellow');
        $notifs = $db->table('notifications')->orderBy('created_at', 'DESC')->limit(10)->get()->getResultArray();
        foreach ($notifs as $n) {
            CLI::write("ID: {$n['id']} | To: {$n['to_user_id']} | Type: {$n['type']} | Title: {$n['title']} | Read: {$n['is_read']}");
            CLI::write("   Body: {$n['body']}");
        }

        CLI::write("\n=== USERS ===", 'yellow');
        $users = $db->table('users')->join('roles', 'roles.id = users.role_id', 'left')->select('users.id, users.name, users.username, roles.name as role_name')->get()->getResultArray();
        foreach ($users as $u) {
            CLI::write("User [{$u['id']}]: {$u['name']} (@{$u['username']}) - Role: {$u['role_name']}");
        }
    }
}
