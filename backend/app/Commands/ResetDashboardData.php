<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class ResetDashboardData extends BaseCommand
{
    protected $group       = 'Custom';
    protected $name        = 'app:reset-dashboard-data';
    protected $description = 'Clean all dashboard, requirement, task, and monitoring data for QA';

    public function run(array $params)
    {
        $db = \Config\Database::connect();

        $tablesToClean = [
            'task_evidences',
            'task_status_moves',
            'task_assignees',
            'comments',
            'attachments',
            'tasks',
            'requirement_team_members',
            'requirements',
            'dashboard_fields',
            'team_dashboards',
            'module_table_fields',
            'module_tables',
            'module_databases',
            'modules',
            'dashboards',
            'activity_log_changes',
            'activity_logs',
            'notifications',
        ];

        CLI::write("Starting database cleanup for QA...", 'yellow');

        $driver = $db->DBDriver;
        CLI::write("Database driver: {$driver}", 'cyan');

        try {
            if ($driver === 'Postgre') {
                $db->query("ALTER TABLE notifications ALTER COLUMN type TYPE character varying(64);");
                $db->query("ALTER TABLE task_evidences ALTER COLUMN kind TYPE character varying(64);");
                $db->query("ALTER TABLE attachments ALTER COLUMN file_kind TYPE character varying(32);");
                $db->query("ALTER TABLE task_evidences DROP CONSTRAINT IF EXISTS ck_task_evidences_kind;");
                $db->query("ALTER TABLE task_evidences ADD CONSTRAINT ck_task_evidences_kind CHECK (kind IN ('move_request', 'pm_approve', 'pm_return', 'pm_revision', 'comment', 'task_attachment', 'evidence', 'issue', 'note'));");
                $db->query("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS ck_notifications_type;");
                $db->query("ALTER TABLE notifications ADD CONSTRAINT ck_notifications_type CHECK (type IN ('approval_request', 'approved', 'revision', 'comment', 'move_request', 'move_approved', 'move_rejected', 'dashboard_assigned'));");
                CLI::write("Ensured column sizes and check constraints for notifications, task_evidences, attachments", 'green');
                $tableList = implode(', ', $tablesToClean);
                $sql = "TRUNCATE TABLE {$tableList} RESTART IDENTITY CASCADE;";
                $db->query($sql);
            } else {
                $db->query("SET FOREIGN_KEY_CHECKS = 0;");
                foreach ($tablesToClean as $table) {
                    $db->query("TRUNCATE TABLE {$table};");
                }
                $db->query("SET FOREIGN_KEY_CHECKS = 1;");
            }
            CLI::write("Successfully truncated monitoring tables!", 'green');
        } catch (\Throwable $e) {
            CLI::error("Truncate failed: " . $e->getMessage());
            CLI::write("Falling back to DELETE FROM...", 'yellow');
            foreach ($tablesToClean as $table) {
                try {
                    $db->table($table)->emptyTable();
                    CLI::write(" - Emptied {$table}");
                } catch (\Throwable $ex) {
                    CLI::write(" - Could not empty {$table}: " . $ex->getMessage(), 'red');
                }
            }
        }

        // Clean uploaded files on disk
        $dirsToClean = [
            WRITEPATH . 'uploads/evidence',
            WRITEPATH . 'uploads/attachments',
        ];

        foreach ($dirsToClean as $dir) {
            if (is_dir($dir)) {
                $files = glob($dir . '/*');
                $deletedCount = 0;
                foreach ($files as $file) {
                    if (is_file($file) && basename($file) !== '.gitkeep') {
                        unlink($file);
                        $deletedCount++;
                    }
                }
                CLI::write("Cleaned {$deletedCount} files in {$dir}", 'cyan');
            }
        }

        CLI::write("\n=== VERIFICATION AFTER CLEANUP ===", 'yellow');
        $allTables = $db->listTables();
        foreach ($allTables as $t) {
            $cnt = $db->table($t)->countAllResults();
            $color = ($cnt === 0 && in_array($t, $tablesToClean, true)) ? 'green' : 'white';
            CLI::write(" - {$t}: {$cnt} rows", $color);
        }

        CLI::write("\nDatabase reset complete! All dashboard data is now 0.", 'green');
    }
}
