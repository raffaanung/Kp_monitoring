<?php

namespace App\Models;

use App\Libraries\Id;
use CodeIgniter\Model;

class NotificationModel extends Model
{
    protected $table         = 'notifications';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields = ['id', 'type', 'title', 'body', 'task_id', 'dashboard_id', 'to_user_id', 'channel', 'is_read'];

    /** @return list<array<string, mixed>> */
    public function forUser(string $userId): array
    {
        return $this->select('notifications.*, dashboards.name AS dashboard_name')
            ->join('dashboards', 'dashboards.id = notifications.dashboard_id', 'left')
            ->where('to_user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->limit(50)
            ->findAll();
    }

    public function unreadCount(string $userId): int
    {
        return $this->where('to_user_id', $userId)->where('is_read', 0)->countAllResults();
    }

    public function markAllRead(string $userId): void
    {
        $this->where('to_user_id', $userId)->where('is_read', 0)->set(['is_read' => 1])->update();
    }

    public function notify(string $type, string $title, string $body, string $toUserId, ?string $taskId = null, ?string $dashboardId = null): void
    {
        $this->insert([
            'id'           => Id::new(),
            'type'         => $type,
            'title'        => $title,
            'body'         => $body,
            'task_id'      => $taskId,
            'dashboard_id' => $dashboardId,
            'to_user_id'   => $toUserId,
            'channel'      => 'in_app',
            'is_read'      => 0,
        ], false);
    }
}
