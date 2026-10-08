<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$uuid = '([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})';

$routes->post('api/auth/login', 'Auth::login');

$routes->group('api', ['filter' => 'auth'], static function ($routes) use ($uuid) {
    $routes->post('auth/logout', 'Auth::logout');
    $routes->get('auth/me', 'Auth::me');
    $routes->put('auth/me', 'Auth::updateMe');
    $routes->post('auth/me/password', 'Auth::changePassword');
    $routes->post('auth/me/avatar', 'Auth::uploadAvatar');
    $routes->delete('auth/me/avatar', 'Auth::clearAvatar');
    $routes->get("avatar/{$uuid}/file", 'Auth::avatarFile/$1');

    $routes->get('dashboard', 'Api::dashboard');
    $routes->get('tasks', 'Api::tasks');
    $routes->get("tasks/{$uuid}", 'Api::task/$1');

    $routes->get('users', 'Users::index');
    $routes->post('users', 'Users::create');
    $routes->put("users/{$uuid}", 'Users::update/$1');

    $routes->get('roles', 'Roles::index');
    $routes->get('permissions', 'Roles::permissions');
    $routes->post('roles', 'Roles::create');
    $routes->put("roles/{$uuid}", 'Roles::update/$1');
    $routes->delete("roles/{$uuid}", 'Roles::delete/$1');
    $routes->put("roles/{$uuid}/permissions", 'Roles::setPermission/$1');

    $routes->get('teams', 'Teams::index');
    $routes->post('teams', 'Teams::create');

    $routes->get('dashboards', 'Dashboards::index');
    $routes->post('dashboards', 'Dashboards::create');
    $routes->put("dashboards/{$uuid}", 'Dashboards::update/$1');
    $routes->delete("dashboards/{$uuid}", 'Dashboards::delete/$1');
    $routes->put("dashboards/{$uuid}/status", 'Dashboards::changeStatus/$1');
    $routes->post("dashboards/{$uuid}/fields", 'Dashboards::setField/$1');
    $routes->put("dashboards/{$uuid}/fields", 'Dashboards::renameField/$1');
    $routes->delete("dashboards/{$uuid}/fields", 'Dashboards::removeField/$1');

    $routes->get('requirements', 'Requirements::index');
    $routes->post('requirements', 'Requirements::create');
    $routes->put("requirements/{$uuid}", 'Requirements::update/$1');
    $routes->delete("requirements/{$uuid}", 'Requirements::delete/$1');
    $routes->post("requirements/{$uuid}/versions", 'Requirements::createVersion/$1');

    $routes->get('module-tasks', 'ModuleTasks::index');
    $routes->get("module-tasks/{$uuid}", 'ModuleTasks::show/$1');
    $routes->post('module-tasks', 'ModuleTasks::create');
    $routes->put("module-tasks/{$uuid}", 'ModuleTasks::update/$1');
    $routes->delete("module-tasks/{$uuid}", 'ModuleTasks::delete/$1');
    $routes->post("module-tasks/{$uuid}/move", 'ModuleTasks::move/$1');
    $routes->post("module-tasks/{$uuid}/approve-move", 'ModuleTasks::approveMove/$1');
    $routes->post("module-tasks/{$uuid}/reject-move", 'ModuleTasks::rejectMove/$1');
    $routes->post("module-tasks/{$uuid}/approve", 'ModuleTasks::approve/$1');
    $routes->post("module-tasks/{$uuid}/request-revision", 'ModuleTasks::requestRevision/$1');
    $routes->post("module-tasks/{$uuid}/resubmit", 'ModuleTasks::resubmit/$1');
    $routes->post("module-tasks/{$uuid}/comments", 'ModuleTasks::addComment/$1');

    $routes->post('evidences', 'Evidences::upload');
    $routes->get("evidences/{$uuid}/file", 'Evidences::file/$1');

    $routes->get('notifications', 'Notifications::index');
    $routes->post("notifications/{$uuid}/read", 'Notifications::markRead/$1');
    $routes->post('notifications/read-all', 'Notifications::markAllRead');

    $routes->get('activity-logs', 'ActivityLogs::index');
    $routes->get("activity-logs/{$uuid}", 'ActivityLogs::show/$1');

    $routes->get('attachments', 'Attachments::index');
    $routes->post('attachments', 'Attachments::upload');
    $routes->delete("attachments/{$uuid}", 'Attachments::delete/$1');
    $routes->get("attachments/{$uuid}/file", 'Attachments::file/$1');
});

$routes->get('/', 'Spa::index');
$routes->set404Override('\App\Controllers\Spa::index');
