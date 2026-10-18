<?php

namespace App\Commands;

use App\Libraries\Id;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class SeedEditFormPermission extends BaseCommand
{
    protected $group       = 'Custom';
    protected $name        = 'app:seed-edit-form-perm';
    protected $description = 'Seed edit_dashboard_form permission for Admin and Manager roles';

    public function run(array $params)
    {
        $db = \Config\Database::connect();

        $perm = $db->table('permissions')->where('perm_key', 'edit_dashboard_form')->get()->getRowArray();
        if ($perm === null) {
            $permId = Id::new();
            $db->table('permissions')->insert([
                'id'         => $permId,
                'perm_key'   => 'edit_dashboard_form',
                'label'      => 'Edit Form Add Dashboard',
                'group_name' => 'Registry',
            ]);
            CLI::write("Created permission 'edit_dashboard_form' with ID: {$permId}", 'green');
        } else {
            $permId = $perm['id'];
            CLI::write("Permission 'edit_dashboard_form' already exists with ID: {$permId}", 'yellow');
        }

        // Grant to Admin and Manager roles
        $roles = $db->table('roles')->whereIn('name', ['Admin', 'Manager'])->get()->getResultArray();
        foreach ($roles as $role) {
            $exists = $db->table('role_permissions')
                ->where('role_id', $role['id'])
                ->where('permission_id', $permId)
                ->get()
                ->getRowArray();

            if ($exists === null) {
                $db->table('role_permissions')->insert([
                    'role_id'       => $role['id'],
                    'permission_id' => $permId,
                ]);
                CLI::write("Granted 'edit_dashboard_form' to role '{$role['name']}'", 'green');
            } else {
                CLI::write("Role '{$role['name']}' already has 'edit_dashboard_form'", 'yellow');
            }
        }

        CLI::write("Permission seeding complete!", 'green');
    }
}
