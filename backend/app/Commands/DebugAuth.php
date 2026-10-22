<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class DebugAuth extends BaseCommand
{
    protected $group       = 'Custom';
    protected $name        = 'app:debug-auth';
    protected $description = 'Debug user auth and passwords in database';

    public function run(array $params)
    {
        $db = \Config\Database::connect();
        $users = $db->table('users')->select('id, name, username, password_hash, status')->get()->getResultArray();

        CLI::write("=== CURRENT USERS IN DB ===", 'yellow');
        foreach ($users as $u) {
            CLI::write("ID: {$u['id']} | Username: '{$u['username']}' | Name: '{$u['name']}' | Status: '{$u['status']}'");
            CLI::write("Hash: {$u['password_hash']}");
        }
    }
}
