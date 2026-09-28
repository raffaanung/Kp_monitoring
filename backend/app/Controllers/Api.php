<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

class Api extends BaseController
{
    public function dashboard(): ResponseInterface
    {
        $tasks  = $this->taskRows();
        $counts = [
            'total'       => count($tasks),
            'open'        => 0,
            'in_progress' => 0,
            'done'        => 0,
        ];

        foreach ($tasks as $task) {
            $status = $task['status'] ?? '';
            if (isset($counts[$status])) {
                $counts[$status]++;
            }
        }

        return $this->jsonOk($counts);
    }

    public function tasks(): ResponseInterface
    {
        $tasks  = $this->taskRows();
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
                        ($task['title'] ?? '') . ' ' . ($task['description'] ?? '') . ' ' . ($task['pic'] ?? ''),
                    );

                    return str_contains($haystack, $needle);
                },
            ));
        }

        return $this->jsonOk($tasks);
    }

    public function task(string $id = '0'): ResponseInterface
    {
        $id = (int) $id;
        if ($id < 1) {
            return $this->jsonError('Invalid task id', 400);
        }

        foreach ($this->taskRows() as $task) {
            if ((int) ($task['id'] ?? 0) === $id) {
                return $this->jsonOk($task);
            }
        }

        return $this->jsonError('Task not found', 404);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function taskRows(): array
    {
        $path = APPPATH . 'Data/tasks.php';
        if (! is_file($path)) {
            return [];
        }

        $data = include $path;

        return is_array($data) ? array_values($data) : [];
    }

    private function jsonOk(mixed $data): ResponseInterface
    {
        return $this->response->setJSON([
            'success' => true,
            'data'    => $data,
        ]);
    }

    private function jsonError(string $message, int $status): ResponseInterface
    {
        return $this->response->setStatusCode($status)->setJSON([
            'success' => false,
            'message' => $message,
        ]);
    }
}
