<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class FixTaskApproval extends BaseCommand
{
    protected $group       = 'Custom';
    protected $name        = 'app:fix-task-approval';
    protected $description = 'Fix pending tasks created by PIC/users and clean task creation approval notifs';

    public function run(array $params)
    {
        $db = \Config\Database::connect();

        $updated = $db->table('tasks')
            ->where('approval_state', 'pending')
            ->update(['approval_state' => 'approved']);
        CLI::write("Updated pending tasks to approved: {$updated}", 'green');

        $deletedComments = $db->table('comments')
            ->where('body', 'tes')
            ->delete();
        CLI::write("Deleted test comments: {$deletedComments}", 'green');

        $deletedNotifs = $db->table('notifications')
            ->where('type', 'comment')
            ->like('body', 'berkomentar di "buatkan ui lagi"')
            ->delete();
        CLI::write("Deleted test comment notifications: {$deletedNotifs}", 'green');

        CLI::write("Done fixing task approval state.", 'yellow');
    }
}
