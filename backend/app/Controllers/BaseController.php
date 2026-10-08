<?php

namespace App\Controllers;

use CodeIgniter\Controller;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Psr\Log\LoggerInterface;

/**
 * BaseController provides a convenient place for loading components
 * and performing functions that are needed by all your controllers.
 *
 * Extend this class in any new controllers:
 * ```
 *     class Home extends BaseController
 * ```
 *
 * For security, be sure to declare any new methods as protected or private.
 */
abstract class BaseController extends Controller
{
    /**
     * Be sure to declare properties for any property fetch you initialized.
     * The creation of dynamic property is deprecated in PHP 8.2.
     */

    // protected $session;

    /**
     * @return void
     */
    public function initController(RequestInterface $request, ResponseInterface $response, LoggerInterface $logger)
    {
        // Load here all helpers you want to be available in your controllers that extend BaseController.
        // Caution: Do not put the this below the parent::initController() call below.
        // $this->helpers = ['form', 'url'];

        // Caution: Do not edit this line.
        parent::initController($request, $response, $logger);

        // Preload any models, libraries, etc, here.
        // $this->session = service('session');
    }

    protected function jsonOk(mixed $data): ResponseInterface
    {
        return $this->response->setJSON([
            'success' => true,
            'data'    => $data,
        ]);
    }

    protected function jsonError(string $message, int $status): ResponseInterface
    {
        return $this->response->setStatusCode($status)->setJSON([
            'success' => false,
            'message' => $message,
        ]);
    }

    /** Id dari input user: kembalikan hanya kalau formatnya UUID, selain itu null. */
    protected function uuidOrNull(mixed $value): ?string
    {
        return \App\Libraries\Id::isValid($value) ? $value : null;
    }

    /** The logged-in user's full row (with role_name/division_name), or null. */
    protected function authUser(): ?array
    {
        $userId = session()->get('user_id');
        if (! \App\Libraries\Id::isValid($userId)) {
            return null;
        }

        $user = (new \App\Models\UserModel())->withRole($userId);
        if ($user !== null) {
            $user['permission_keys'] = (new \App\Models\RoleModel())->permissionKeysFor($user['role_id']);
        }

        return $user;
    }
}
