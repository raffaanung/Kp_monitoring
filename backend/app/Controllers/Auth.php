<?php

namespace App\Controllers;

use App\Libraries\Id;
use App\Libraries\TaskPolicy;
use App\Models\UserModel;
use CodeIgniter\HTTP\ResponseInterface;

class Auth extends BaseController
{
    public function login(): ResponseInterface
    {
        $username = trim((string) $this->request->getJsonVar('username'));
        $password = (string) $this->request->getJsonVar('password');

        if ($username === '' || $password === '') {
            return $this->jsonError('Username and password are required', 422);
        }

        $userModel = new UserModel();
        $user      = $userModel->findByUsername($username);

        if ($user === null || $user['password_hash'] === null || ! password_verify($password, $user['password_hash'])) {
            return $this->jsonError('Incorrect username or password', 401);
        }

        if ($user['status'] !== 'active') {
            return $this->jsonError('This account is inactive', 403);
        }

        session()->regenerate();
        session()->set('user_id', $user['id']);

        return $this->jsonOk($this->currentUserPayload($user['id']));
    }

    public function updateMe(): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null) {
            return $this->jsonError('Not signed in', 401);
        }

        $name     = trim((string) $this->request->getJsonVar('name'));
        $username = trim((string) $this->request->getJsonVar('username'));

        if ($name === '') {
            return $this->jsonError('Display name is required', 422);
        }
        if (! preg_match('/^\d{8}$/', $username)) {
            return $this->jsonError('Username must be 8 digits', 422);
        }

        $userModel = new UserModel();
        $dup       = $userModel->where('username', $username)->where('id !=', $user['id'])->first();
        if ($dup !== null) {
            return $this->jsonError('That username is already in use', 422);
        }

        $userModel->update($user['id'], ['name' => $name, 'username' => $username]);

        return $this->jsonOk($this->currentUserPayload($user['id']));
    }

    public function changePassword(): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null) {
            return $this->jsonError('Not signed in', 401);
        }

        $current = (string) $this->request->getJsonVar('current_password');
        $new     = (string) $this->request->getJsonVar('new_password');

        if ($user['password_hash'] === null || ! password_verify($current, $user['password_hash'])) {
            return $this->jsonError('Current password is incorrect', 401);
        }
        if (strlen($new) < 6) {
            return $this->jsonError('New password must be at least 6 characters', 422);
        }

        (new UserModel())->update($user['id'], ['password_hash' => password_hash($new, PASSWORD_DEFAULT)]);

        return $this->jsonOk(['ok' => true]);
    }

    public function uploadAvatar(): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null) {
            return $this->jsonError('Not signed in', 401);
        }

        $file = $this->request->getFile('avatar');
        if ($file === null || ! $file->isValid() || ! $file->getClientMimeType() || ! str_starts_with($file->getClientMimeType(), 'image/')) {
            return $this->jsonError('The file must be an image', 422);
        }
        if ($file->getSize() > 1_500_000) {
            return $this->jsonError('Maximum size is 1.5 MB', 422);
        }

        $dir = WRITEPATH . 'uploads/avatars';
        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $newName = $file->getRandomName();
        $file->move($dir, $newName);

        (new UserModel())->update($user['id'], ['avatar_path' => 'avatars/' . $newName]);

        return $this->jsonOk($this->currentUserPayload($user['id']));
    }

    public function clearAvatar(): ResponseInterface
    {
        $user = $this->authUser();
        if ($user === null) {
            return $this->jsonError('Not signed in', 401);
        }
        (new UserModel())->update($user['id'], ['avatar_path' => null]);

        return $this->jsonOk($this->currentUserPayload($user['id']));
    }

    public function logout(): ResponseInterface
    {
        session()->destroy();

        return $this->jsonOk(['loggedOut' => true]);
    }

    public function avatarFile(string $id = '0'): ResponseInterface
    {
        $user = (new UserModel())->find($id);
        if ($user === null || ! $user['avatar_path']) {
            return $this->jsonError('Avatar not found', 404);
        }
        $path = WRITEPATH . 'uploads/' . $user['avatar_path'];
        if (! is_file($path)) {
            return $this->jsonError('Avatar not found', 404);
        }

        return $this->response
            ->setHeader('Content-Type', mime_content_type($path) ?: 'image/jpeg')
            ->setHeader('Content-Disposition', 'inline')
            ->setBody(file_get_contents($path));
    }

    public function me(): ResponseInterface
    {
        $userId = session()->get('user_id');
        if (! Id::isValid($userId)) {
            return $this->jsonError('Not signed in', 401);
        }

        $payload = $this->currentUserPayload($userId);
        if ($payload === null) {
            session()->destroy();

            return $this->jsonError('Not signed in', 401);
        }

        return $this->jsonOk($payload);
    }

    /** @return array<string, mixed>|null */
    private function currentUserPayload(string $userId): ?array
    {
        $user = (new UserModel())->withRole($userId);
        if ($user === null) {
            return null;
        }

        return [
            'id'            => $user['id'],
            'name'          => $user['name'],
            'username'      => $user['username'],
            'avatar_url'    => $user['avatar_path'] ? "/api/avatar/{$user['id']}/file" : null,
            'role_id'       => $user['role_id'],
            'role_name'     => $user['role_name'],
            'functional_role' => TaskPolicy::functionalRole($user['role_name']),
            'division_name' => $user['division_name'],
            'permissions'   => (new \App\Models\RoleModel())->permissionKeysFor($user['role_id']),
        ];
    }
}

