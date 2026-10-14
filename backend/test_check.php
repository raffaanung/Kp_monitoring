<?php
define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR);
chdir(FCPATH);
require FCPATH . '../app/Config/Paths.php';
$paths = new Config\Paths();
require $paths->systemDirectory . '/Boot.php';
\CodeIgniter\Boot::bootTest($paths);

$db = \Config\Database::connect();
echo "=== TASKS ===\n";
$tasks = $db->table('tasks')->select('id, code, title, status, approval_state, created_by, assignee_id')->get()->getResultArray();
print_r($tasks);

echo "\n=== NOTIFICATIONS ===\n";
$notifs = $db->table('notifications')->select('id, user_id, type, title, body, is_read, created_at')->orderBy('created_at', 'DESC')->limit(10)->get()->getResultArray();
print_r($notifs);

echo "\n=== USERS ===\n";
$users = $db->table('users')->select('id, name, username, role_id')->get()->getResultArray();
print_r($users);
