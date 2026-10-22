<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class SetPassword extends BaseCommand
{
    protected $group       = 'Custom';
    protected $name        = 'app:set-password';
    protected $description = 'Set password for a specific username or all users';
    protected $usage       = 'app:set-password <username|all> <password>';

    public function run(array $params)
    {
        $target = $params[0] ?? null;
        $pwd    = $params[1] ?? null;

        if (! $target || ! $pwd) {
            CLI::error("Usage: php spark app:set-password <username|all> <password>");
            return;
        }

        $db = \Config\Database::connect();
        $hash = password_hash($pwd, PASSWORD_DEFAULT);

        if ($target === 'all') {
            $db->table('users')->update([
                'password_hash' => $hash,
                'updated_at'    => date('Y-m-d H:i:s'),
            ]);
            CLI::write("Successfully updated password for ALL users to: '{$pwd}'", 'green');
        } else {
            $user = $db->table('users')->where('username', $target)->get()->getRowArray();
            if (! $user) {
                CLI::error("User with username '{$target}' not found!");
                return;
            }

            $db->table('users')->where('id', $user['id'])->update([
                'password_hash' => $hash,
                'updated_at'    => date('Y-m-d H:i:s'),
            ]);
            CLI::write("Successfully updated password for '{$user['name']}' ({$target}) to: '{$pwd}'", 'green');
        }
    }
}
