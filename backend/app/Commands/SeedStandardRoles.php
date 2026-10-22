<?php

namespace App\Commands;

use App\Libraries\Id;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class SeedStandardRoles extends BaseCommand
{
    protected $group       = 'Custom';
    protected $name        = 'app:seed-standard-roles';
    protected $description = 'Seed canonical roles (Admin, Developer, Viewer) with permissions';

    public function run(array $params)
    {
        $db = \Config\Database::connect();

        $allPerms = $db->table('permissions')->get()->getResultArray();
        $permMap = [];
        foreach ($allPerms as $p) {
            $permMap[$p['perm_key']] = $p['id'];
        }

        $rolesConfig = [
            'Admin' => [
                'scope'       => 'global',
                'description' => 'Akses penuh ke konfigurasi sistem, registry dashboard, user, role, requirement, dan task.',
                'perms'       => array_keys($permMap),
            ],
            'Developer' => [
                'scope'       => 'global',
                'description' => 'Mengembangkan fitur, mengelola task & requirement, serta mengunggah evidence progres.',
                'perms'       => [
                    'create_requirement',
                    'add_assignee',
                    'create_task',
                    'manage_tasks',
                    'add_field',
                    'edit_field',
                    'view_monitoring',
                ],
            ],
            'Viewer' => [
                'scope'       => 'global',
                'description' => 'Melihat dan memantau status dashboard operasional, workspaces, task, dan journey (read-only).',
                'perms'       => [
                    'view_monitoring',
                ],
            ],
        ];

        foreach ($rolesConfig as $roleName => $cfg) {
            $existing = $db->table('roles')->where('name', $roleName)->get()->getRowArray();
            if ($existing === null) {
                $roleId = Id::new();
                $db->table('roles')->insert([
                    'id'          => $roleId,
                    'name'        => $roleName,
                    'scope'       => $cfg['scope'],
                    'description' => $cfg['description'],
                    'created_at'  => date('Y-m-d H:i:s'),
                    'updated_at'  => date('Y-m-d H:i:s'),
                ]);
                CLI::write("Created role '{$roleName}' with ID: {$roleId}", 'green');
            } else {
                $roleId = $existing['id'];
                $db->table('roles')->where('id', $roleId)->update([
                    'description' => $cfg['description'],
                    'updated_at'  => date('Y-m-d H:i:s'),
                ]);
                CLI::write("Role '{$roleName}' already exists with ID: {$roleId}", 'yellow');
            }

            // Sync permissions
            foreach ($cfg['perms'] as $permKey) {
                if (! isset($permMap[$permKey])) {
                    continue;
                }
                $permId = $permMap[$permKey];
                $hasPerm = $db->table('role_permissions')
                    ->where('role_id', $roleId)
                    ->where('permission_id', $permId)
                    ->get()
                    ->getRowArray();

                if ($hasPerm === null) {
                    $db->table('role_permissions')->insert([
                        'role_id'       => $roleId,
                        'permission_id' => $permId,
                    ]);
                    CLI::write("  Granted '{$permKey}' to '{$roleName}'", 'green');
                }
            }
        }

        CLI::write("Standard roles seeding complete!", 'green');
    }
}
