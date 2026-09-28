<?php

namespace App\Controllers;

use CodeIgniter\HTTP\ResponseInterface;

/**
 * Serves the Svelte SPA (built files in /spa).
 */
class Spa extends BaseController
{
    public function index(): ResponseInterface
    {
        $index = FCPATH . 'spa/index.html';

        if (! is_file($index)) {
            return $this->response
                ->setStatusCode(503)
                ->setContentType('text/html', 'utf-8')
                ->setBody(
                    '<h1>Frontend not built</h1><p>Svelte build not found. Run: cd frontend && npm install && npm run build</p>',
                );
        }

        return $this->response
            ->setContentType('text/html', 'utf-8')
            ->setBody((string) file_get_contents($index));
    }
}
