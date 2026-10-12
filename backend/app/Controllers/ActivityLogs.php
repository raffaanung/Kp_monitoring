<?php

namespace App\Controllers;

use App\Models\ActivityLogModel;
use CodeIgniter\HTTP\ResponseInterface;

class ActivityLogs extends BaseController
{
    public function index(): ResponseInterface
    {
        $filters = array_filter([
            'object_type'  => $this->request->getGet('object_type'),
            'dashboard_id' => $this->uuidOrNull($this->request->getGet('dashboard_id')),
            'from'         => $this->request->getGet('from'),
            'to'           => $this->request->getGet('to'),
        ]);
        $rows = (new ActivityLogModel())->listAll($filters);

        return $this->jsonOk(array_map([$this, 'shape'], $rows));
    }

    public function show(string $id = '0'): ResponseInterface
    {
        $row = (new ActivityLogModel())
            ->select('activity_logs.*, dashboards.name AS dashboard_name')
            ->join('dashboards', 'dashboards.id = activity_logs.dashboard_id', 'left')
            ->where('activity_logs.id', $id)
            ->first();
        if ($row === null) {
            return $this->jsonError('Log not found', 404);
        }
        $changes = db_connect()->table('activity_log_changes')->where('activity_log_id', $id)->get()->getResultArray();
        $shaped  = $this->shape($row);
        $shaped['changes'] = array_map(static fn ($c) => [
            'field' => $c['field'], 'label' => $c['label'], 'before' => $c['before_value'], 'after' => $c['after_value'],
        ], $changes);

        return $this->jsonOk($shaped);
    }

    /** @param array<string, mixed> $row */
    private function shape(array $row): array
    {
        return [
            'id'          => $row['id'],
            'at'          => $row['created_at'],
            'actor'       => $row['actor_name'],
            'action'      => $row['action'],
            'actionType'  => $row['action_type'],
            'objectType'  => $row['object_type'],
            'objectId'    => $row['object_id'],
            'objectLabel' => $row['object_label'],
            'dashboard'   => $row['dashboard_name'] ?? '',
        ];
    }
}
