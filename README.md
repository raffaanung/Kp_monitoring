# EDM Task Monitoring

Aplikasi monitoring task EDM dengan pemisahan jelas:

```
edm-task-monitoring/
├── backend/     # CodeIgniter 3 (API + serve SPA)
├── frontend/    # Svelte + Vite (source UI)
├── .htaccess    # redirect root → backend
└── README.md
```

## Requirements

- XAMPP (Apache + PHP 8.1+)
- Node.js 18+

## Backend (`backend/`)

CodeIgniter 3. Data dummy di `backend/application/data/tasks.php`.

URL:

- App/SPA: http://localhost/edm-task-monitoring/backend/
- API dashboard: http://localhost/edm-task-monitoring/backend/api/dashboard
- API tasks: http://localhost/edm-task-monitoring/backend/api/tasks
- API detail: http://localhost/edm-task-monitoring/backend/api/tasks/1

Root http://localhost/edm-task-monitoring/ diarahkan ke `backend/`.

## Frontend (`frontend/`)

### Development

```bash
cd frontend
npm install
npm run dev
```

Vite mem-proxy `/edm-task-monitoring/backend/api/*` ke Apache.

### Build ke backend

```bash
cd frontend
npm run build
```

Output masuk ke `backend/spa/` dan dilayani oleh CI3.

## Catatan

- Database belum dihubungkan.
- `mod_rewrite` harus aktif di Apache.
