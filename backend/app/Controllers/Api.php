<?php

namespace App\Controllers;

use App\Models\TaskModel;
use CodeIgniter\HTTP\ResponseInterface;

class Api extends BaseController
{
    public function dashboard(): ResponseInterface
    {
        $tasks  = (new TaskModel())->withPic();
        $counts = ['total' => count($tasks)];

        foreach ($tasks as $task) {
            $status = $task['status'] ?? '';
            $counts[$status] = ($counts[$status] ?? 0) + 1;
        }

        return $this->jsonOk($counts);
    }

    public function tasks(): ResponseInterface
    {
        $tasks  = (new TaskModel())->withPic();
        $status = trim((string) $this->request->getGet('status'));
        $q      = trim((string) $this->request->getGet('q'));

        if ($status !== '') {
            $tasks = array_values(array_filter(
                $tasks,
                static fn (array $task): bool => ($task['status'] ?? '') === $status,
            ));
        }

        if ($q !== '') {
            $needle = strtolower($q);
            $tasks  = array_values(array_filter(
                $tasks,
                static function (array $task) use ($needle): bool {
                    $haystack = strtolower(
                        ($task['title'] ?? '') . ' ' . ($task['description'] ?? '') . ' ' . ($task['pic_name'] ?? ''),
                    );

                    return str_contains($haystack, $needle);
                },
            ));
        }

        return $this->jsonOk($tasks);
    }

    public function task(string $id = '0'): ResponseInterface
    {
        $task = (new TaskModel())->findWithPic($id);

        if ($task === null) {
            return $this->jsonError('Task not found', 404);
        }

        return $this->jsonOk($task);
    }
}
