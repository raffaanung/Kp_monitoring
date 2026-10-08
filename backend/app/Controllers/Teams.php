<?php

namespace App\Controllers;

use App\Libraries\Id;
use App\Models\DivisionModel;
use App\Models\TeamModel;
use CodeIgniter\HTTP\ResponseInterface;

class Teams extends BaseController
{
    public function index(): ResponseInterface
    {
        $rows = (new TeamModel())->listWithDetails();

        return $this->jsonOk(array_map([$this, 'shapeRow'], $rows));
    }

    public function create(): ResponseInterface
    {
        $name        = trim((string) $this->request->getJsonVar('name'));
        $unit        = trim((string) $this->request->getJsonVar('unit'));
        $description = trim((string) ($this->request->getJsonVar('description') ?? ''));
        $leadId      = $this->uuidOrNull($this->request->getJsonVar('lead_id'));
        $memberIds   = $this->request->getJsonVar('member_ids') ?? [];
        $dashboards  = $this->request->getJsonVar('dashboards') ?? [];

        if ($name === '' || $leadId === null) {
            return $this->jsonError('Nama tim dan team lead wajib diisi', 422);
        }

        $divisionId = $unit !== '' ? (new DivisionModel())->idForName($unit) : null;

        $model = new TeamModel();
        $id    = $model->createTeam([
            'name'        => $name,
            'division_id' => $divisionId,
            'description' => $description,
            'lead_id'     => $leadId,
        ]);

        if (is_array($memberIds) && $memberIds !== []) {
            $model->syncMembers($id, array_filter($memberIds, [Id::class, 'isValid']));
        }
        if (is_array($dashboards) && $dashboards !== []) {
            $model->syncDashboards($id, $dashboards);
        }

        foreach ($model->listWithDetails() as $row) {
            if ($row['id'] === $id) {
                return $this->jsonOk($this->shapeRow($row));
            }
        }

        return $this->jsonError('Gagal membuat tim', 500);
    }

    /** @param array<string, mixed> $row */
    private function shapeRow(array $row): array
    {
        return [
            'id'          => $row['id'],
            'name'        => $row['name'],
            'unit'        => $row['unit'],
            'description' => $row['description'],
            'lead_id'     => $row['lead_id'] ?? null,
            'member_ids'  => $row['member_ids'],
            'dashboards'  => $row['dashboards'],
            'created_at'  => $row['created_at'],
        ];
    }
}
