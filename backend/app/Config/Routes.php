<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('api/dashboard', 'Api::dashboard');
$routes->get('api/tasks', 'Api::tasks');
$routes->get('api/tasks/(:num)', 'Api::task/$1');
$routes->get('/', 'Spa::index');
$routes->set404Override('\App\Controllers\Spa::index');
