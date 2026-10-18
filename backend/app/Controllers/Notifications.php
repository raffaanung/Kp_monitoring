<?php

namespace App\Controllers;

use App\Models\NotificationModel;
use CodeIgniter\HTTP\ResponseInterface;

class Notifications extends BaseController
{
    public function index(): ResponseInterface
    {
        $user  = $this->authUser();
        $model = new NotificationModel();

        return $this->jsonOk([
            'items'  => array_map([$this, 'shape'], $model->forUser($user['id'])),
            'unread' => $model->unreadCount($user['id']),
        ]);
    }

    public function markRead(string $id = '0'): ResponseInterface
    {
        (new NotificationModel())->update($id, ['is_read' => 1]);

        return $this->jsonOk(['ok' => true]);
    }

    public function markAllRead(): ResponseInterface
    {
        $user = $this->authUser();
        (new NotificationModel())->markAllRead($user['id']);

        return $this->jsonOk(['ok' => true]);
    }

    /** @param array<string, mixed> $row */
    private function shape(array $row): array
    {
        return [
            'id'        => $row['id'],
            'at'        => $row['created_at'],
            'type'      => $row['type'],
            'title'     => $row['title'],
            'body'      => $row['body'],
            'taskId'    => $row['task_id'] ?? null,
            'taskCode'  => $row['task_code'] ?? null,
            'taskTitle' => $row['task_title'] ?? null,
            'dashboard' => $row['dashboard_name'] ?? '',
            'dashboardCode' => $row['dashboard_code'] ?? null,
            'read'      => (bool) $row['is_read'],
            'channel'   => $row['channel'] ?? 'in_app',
        ];
    }
}
