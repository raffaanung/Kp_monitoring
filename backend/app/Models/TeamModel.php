<?php

namespace App\Models;

use App\Libraries\Id;
use CodeIgniter\Model;

class TeamModel extends Model
{
    protected $table         = 'teams';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useAutoIncrement = false;
    protected $allowedFields = ['id', 'name', 'division_id', 'description', 'lead_id'];

    /** @return list<array<string, mixed>> */
    public function listWithDetails(): array
    {
        $teams = $this->select('teams.*, divisions.name AS unit')
            ->join('divisions', 'divisions.id = teams.division_id', 'left')
            ->orderBy('teams.name', 'ASC')
            ->findAll();

        $db = db_connect();

        $memberRows = $db->table('team_members')->get()->getResultArray();
        $membersByTeam = [];
        foreach ($memberRows as $row) {
            $membersByTeam[$row['team_id']][] = $row['user_id'];
        }

        $dashRows = $db->table('team_dashboards')
            ->select('team_dashboards.team_id, dashboards.name')
            ->join('dashboards', 'dashboards.id = team_dashboards.dashboard_id')
            ->get()->getResultArray();
        $dashByTeam = [];
        foreach ($dashRows as $row) {
            $dashByTeam[$row['team_id']][] = $row['name'];
        }

        foreach ($teams as &$team) {
            $team['member_ids'] = $membersByTeam[$team['id']] ?? [];
            $team['dashboards'] = $dashByTeam[$team['id']] ?? [];
        }

        return $teams;
    }

    /** Buat tim baru dan kembalikan id-nya. */
    public function createTeam(array $data): string
    {
        $data['id'] = Id::new();
        $this->insert($data, false);

        return $data['id'];
    }

    /** @param list<string> $memberIds */
    public function syncMembers(string $teamId, array $memberIds): void
    {
        $db = db_connect();
        $db->table('team_members')->where('team_id', $teamId)->delete();
        $insert = [];
        foreach (array_unique($memberIds) as $userId) {
            $insert[] = ['team_id' => $teamId, 'user_id' => $userId];
        }
        if ($insert !== []) {
            $db->table('team_members')->insertBatch($insert);
        }
    }

    /** @param list<string> $dashboardNames */
    public function syncDashboards(string $teamId, array $dashboardNames): void
    {
        $db = db_connect();
        $db->table('team_dashboards')->where('team_id', $teamId)->delete();
        if ($dashboardNames === []) {
            return;
        }

        $rows = $db->table('dashboards')->select('id, name')->whereIn('name', $dashboardNames)->get()->getResultArray();
        $insert = [];
        foreach ($rows as $row) {
            $insert[] = ['team_id' => $teamId, 'dashboard_id' => $row['id']];
        }
        if ($insert !== []) {
            $db->table('team_dashboards')->insertBatch($insert);
        }
    }
}
