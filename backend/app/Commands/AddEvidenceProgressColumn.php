<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class AddEvidenceProgressColumn extends BaseCommand
{
    protected $group       = 'Custom';
    protected $name        = 'app:add-evidence-progress-col';
    protected $description = 'Add progress_percent column to task_evidences table';

    public function run(array $params)
    {
        $db = \Config\Database::connect();
        $db->query("ALTER TABLE task_evidences ADD COLUMN IF NOT EXISTS progress_percent INTEGER");
        CLI::write("Successfully checked/added progress_percent column in task_evidences.", 'green');
    }
}
