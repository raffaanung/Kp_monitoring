<?php

namespace App\Models;

use App\Libraries\Id;
use CodeIgniter\Model;

class ActivityLogModel extends Model
{
    protected $table         = 'activity_logs';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields = [
        'id', 'actor_id', 'actor_name', 'action', 'action_type', 'object_type', 'object_id',
        'object_label', 'dashboard_id', 'evidence_id', 'reason',
    ];

    /** @return list<array<string, mixed>> */
    public function forObject(string $objectType, string $objectId): array
    {
        return $this->where('object_type', $objectType)
            ->where('object_id', $objectId)
            ->orderBy('created_at', 'DESC')
            ->findAll();
    }

    /**
     * Log untuk banyak object sekaligus (object_type sama), 1 query (hindari N+1 saat render list).
     * @param list<string> $objectIds
     * @return array<string, list<array<string, mixed>>> map object_id => log-nya, urut terbaru-lama
     */
    public function forObjects(string $objectType, array $objectIds): array
    {
        if ($objectIds === []) {
            return [];
        }

        $rows = $this->where('object_type', $objectType)
            ->whereIn('object_id', $objectIds)
            ->orderBy('created_at', 'DESC')
            ->findAll();

        $map = [];
        foreach ($rows as $row) {
            $map[$row['object_id']][] = $row;
        }

        return $map;
    }

    /** @return list<array<string, mixed>> */
    public function listAll(array $filters = []): array
    {
        $builder = $this->select('activity_logs.*, dashboards.name AS dashboard_name')
            ->join('dashboards', 'dashboards.id = activity_logs.dashboard_id', 'left');

        if (! empty($filters['object_type'])) {
            $builder->where('activity_logs.object_type', $filters['object_type']);
        }
        if (! empty($filters['dashboard_id'])) {
            $builder->where('activity_logs.dashboard_id', $filters['dashboard_id']);
        }
        if (! empty($filters['from'])) {
            $builder->where('activity_logs.created_at >=', $filters['from']);
        }
        if (! empty($filters['to'])) {
            $builder->where('activity_logs.created_at <=', $filters['to'] . ' 23:59:59');
        }

        return $builder->orderBy('activity_logs.created_at', 'DESC')->findAll();
    }

    /** @param array<string, mixed> $data */
    public function log(array $data): string
    {
        $data['id'] = Id::new();
        $this->insert($data, false);

        return $data['id'];
    }

    /**
     * Bandingkan dua snapshot dan kembalikan hanya field yang berubah.
     *
     * @param array<string, mixed> $before
     * @param array<string, mixed> $after
     * @param array<string, string> $labels field => label yang ditampilkan
     * @return list<array{field: string, label: string, before: ?string, after: ?string}>
     */
    public function diffFields(array $before, array $after, array $labels): array
    {
        $changes = [];
        foreach ($labels as $field => $label) {
            $b = $before[$field] ?? null;
            $a = $after[$field] ?? null;
            if ((string) $b === (string) $a) {
                continue;
            }
            $changes[] = [
                'field'  => $field,
                'label'  => $label,
                'before' => $b === null ? null : (string) $b,
                'after'  => $a === null ? null : (string) $a,
            ];
        }

        return $changes;
    }

    /**
     * Simpan satu entri log beserta detail perubahan field-nya.
     *
     * @param array<string, mixed> $data
     * @param list<array{field: string, label: string, before: ?string, after: ?string}> $changes
     */
    public function logWithChanges(array $data, array $changes = []): string
    {
        $id = $this->log($data);
        if ($changes !== []) {
            $rows = array_map(static fn (array $c) => [
                'activity_log_id' => $id,
                'field'           => $c['field'],
                'label'           => $c['label'],
                'before_value'    => $c['before'],
                'after_value'     => $c['after'],
            ], $changes);
            db_connect()->table('activity_log_changes')->insertBatch($rows);
        }

        return $id;
    }
}
