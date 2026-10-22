<?php

namespace App\Commands;

use App\Libraries\Id;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class MinimizeUsers extends BaseCommand
{
    protected $group       = 'Custom';
    protected $name        = 'app:minimize-users';
    protected $description = 'Minimize users to only 3 (Admin, Developer, Viewer)';

    public function run(array $params)
    {
        $db = \Config\Database::connect();

        $adminRole = $db->table('roles')->where('name', 'Admin')->get()->getRowArray();
        $devRole   = $db->table('roles')->where('name', 'Developer')->get()->getRowArray();
        $viewRole  = $db->table('roles')->where('name', 'Viewer')->get()->getRowArray();

        if (! $adminRole || ! $devRole || ! $viewRole) {
            CLI::error("One or more standard roles not found in database. Run app:seed-standard-roles first.");
            return;
        }

        $defaultHash = password_hash('@Telkom135', PASSWORD_DEFAULT);

        // 1. Target Admin: Farras Al-Risyad (10000001)
        $adminUser = $db->table('users')->where('username', '10000001')->get()->getRowArray();
        if ($adminUser) {
            $adminId = $adminUser['id'];
            $db->table('users')->where('id', $adminId)->update([
                'name'          => 'Farras Al-Risyad',
                'role_id'       => $adminRole['id'],
                'password_hash' => $defaultHash,
                'status'        => 'active',
                'updated_at'    => date('Y-m-d H:i:s'),
            ]);
            CLI::write("Updated Admin user (10000001): Farras Al-Risyad [{$adminId}]", 'green');
        } else {
            $adminId = Id::new();
            $db->table('users')->insert([
                'id'            => $adminId,
                'name'          => 'Farras Al-Risyad',
                'username'      => '10000001',
                'password_hash' => $defaultHash,
                'role_id'       => $adminRole['id'],
                'status'        => 'active',
                'language'      => 'id',
                'created_at'    => date('Y-m-d H:i:s'),
                'updated_at'    => date('Y-m-d H:i:s'),
            ]);
            CLI::write("Created Admin user (10000001): Farras Al-Risyad [{$adminId}]", 'green');
        }

        // 2. Target Developer: Developer (10000002)
        $devUser = $db->table('users')->where('username', '10000002')->get()->getRowArray();
        if ($devUser) {
            $devId = $devUser['id'];
            $db->table('users')->where('id', $devId)->update([
                'name'          => 'Developer',
                'role_id'       => $devRole['id'],
                'password_hash' => $defaultHash,
                'status'        => 'active',
                'updated_at'    => date('Y-m-d H:i:s'),
            ]);
            CLI::write("Updated Developer user (10000002): Developer [{$devId}]", 'green');
        } else {
            $devId = Id::new();
            $db->table('users')->insert([
                'id'            => $devId,
                'name'          => 'Developer',
                'username'      => '10000002',
                'password_hash' => $defaultHash,
                'role_id'       => $devRole['id'],
                'status'        => 'active',
                'language'      => 'id',
                'created_at'    => date('Y-m-d H:i:s'),
                'updated_at'    => date('Y-m-d H:i:s'),
            ]);
            CLI::write("Created Developer user (10000002): Developer [{$devId}]", 'green');
        }

        // 3. Target Viewer: Viewer (10000003)
        $viewUser = $db->table('users')->where('username', '10000003')->get()->getRowArray();
        if ($viewUser) {
            $viewId = $viewUser['id'];
            $db->table('users')->where('id', $viewId)->update([
                'name'          => 'Viewer',
                'role_id'       => $viewRole['id'],
                'password_hash' => $defaultHash,
                'status'        => 'active',
                'updated_at'    => date('Y-m-d H:i:s'),
            ]);
            CLI::write("Updated Viewer user (10000003): Viewer [{$viewId}]", 'green');
        } else {
            $viewId = Id::new();
            $db->table('users')->insert([
                'id'            => $viewId,
                'name'          => 'Viewer',
                'username'      => '10000003',
                'password_hash' => $defaultHash,
                'role_id'       => $viewRole['id'],
                'status'        => 'active',
                'language'      => 'id',
                'created_at'    => date('Y-m-d H:i:s'),
                'updated_at'    => date('Y-m-d H:i:s'),
            ]);
            CLI::write("Created Viewer user (10000003): Viewer [{$viewId}]", 'green');
        }

        $keptIds = [$adminId, $devId, $viewId];

        // Clean up join tables first
        $db->table('team_members')->whereNotIn('user_id', $keptIds)->delete();
        $db->table('task_assignees')->whereNotIn('user_id', $keptIds)->delete();
        $db->table('dashboard_members')->whereNotIn('user_id', $keptIds)->delete();
        $db->table('requirement_team_members')->whereNotIn('user_id', $keptIds)->delete();

        // Find all foreign keys pointing to users(id) in PostgreSQL
        $fkQuery = $db->query("
            SELECT
                tc.table_name,
                kcu.column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND ccu.table_name = 'users'
              AND ccu.column_name = 'id'
        ");

        $fks = $fkQuery->getResultArray();
        CLI::write("Reassigning remaining foreign key references to Admin / Developer:", 'yellow');

        $joinTables = ['team_members', 'task_assignees', 'dashboard_members', 'requirement_team_members'];

        foreach ($fks as $fk) {
            $tbl = $fk['table_name'];
            $col = $fk['column_name'];
            if (in_array($tbl, $joinTables, true)) {
                continue;
            }

            CLI::write("  - {$tbl}.{$col}", 'cyan');
            try {
                $db->table($tbl)->whereNotIn($col, $keptIds)->update([$col => $adminId]);
            } catch (\Throwable $e) {
                CLI::write("    Notice on {$tbl}.{$col}: " . $e->getMessage(), 'yellow');
            }
        }

        // Delete all users except keptIds
        $db->table('users')->whereNotIn('id', $keptIds)->delete();
        CLI::write("Successfully removed other users from database.", 'green');

        // Display remaining users
        $remaining = $db->table('users')
            ->select('users.id, users.name, users.username, roles.name as role_name, users.status')
            ->join('roles', 'roles.id = users.role_id', 'left')
            ->orderBy('users.username', 'ASC')
            ->get()
            ->getResultArray();

        CLI::write("\nRemaining active users in database (" . count($remaining) . "):", 'green');
        foreach ($remaining as $u) {
            CLI::write(" - [{$u['username']}] {$u['name']} (Role: {$u['role_name']}, Status: {$u['status']})");
        }
    }
}
