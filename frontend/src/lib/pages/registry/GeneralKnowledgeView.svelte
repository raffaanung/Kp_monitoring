<script>
  import { portal } from '$lib/portal.js';
  import { authStore } from '$lib/authStore.svelte.js';
  import { canCreateDashboard, canEditField } from '$lib/taskModuleStore.svelte.js';
  import {
    getDashboard,
    createDashboardModule,
    updateDashboardModule,
    deleteDashboardModule,
    updateDashboardGeneralKnowledge,
    criticalityLabel,
    registryStatusLabel,
  } from '$lib/registryStore.svelte.js';

  /**
   * @type {{
   *   dashboard: any,
   *   onOpenDetailInfo?: () => void
   * }}
   */
  let { dashboard, onOpenDetailInfo } = $props();

  const currentDashboard = $derived(getDashboard(dashboard?.id) || dashboard);

  const isAdminOrDev = $derived.by(() => {
    const role = authStore.user?.role_name?.toLowerCase() || '';
    const funcRole = authStore.user?.functional_role || '';
    return role === 'admin' || role === 'developer' || funcRole === 'admin' || funcRole === 'manager' || canCreateDashboard() || canEditField();
  });

  // Modules & Search
  let moduleSearch = $state('');
  const modules = $derived(currentDashboard?.modules || []);
  const filteredModules = $derived.by(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q)
    );
  });

  // Bispro Edit Modal State
  let editBisproOpen = $state(false);
  let editBisproSummary = $state('');
  let editCategory = $state('');
  let bisproSubmitting = $state(false);
  let bisproError = $state('');

  function openEditBispro() {
    editBisproSummary = currentDashboard?.description || '';
    editCategory = currentDashboard?.category || '';
    bisproError = '';
    editBisproOpen = true;
  }

  function closeEditBispro() {
    editBisproOpen = false;
  }

  async function saveBispro() {
    bisproSubmitting = true;
    bisproError = '';
    try {
      const ok = await updateDashboardGeneralKnowledge(currentDashboard?.id, {
        description: editBisproSummary,
        category: editCategory,
      });
      if (ok) {
        editBisproOpen = false;
      } else {
        bisproError = 'Gagal menyimpan ringkasan proses bisnis.';
      }
    } catch (e) {
      bisproError = e instanceof Error ? e.message : String(e);
    } finally {
      bisproSubmitting = false;
    }
  }

  // Module Modal State (Add / Edit)
  let moduleModalOpen = $state(false);
  let isEditingModule = $state(false);
  let editingModuleId = $state('');
  let moduleName = $state('');
  let moduleDesc = $state('');
  let moduleSubmitting = $state(false);
  let moduleError = $state('');

  function openAddModule() {
    isEditingModule = false;
    editingModuleId = '';
    moduleName = '';
    moduleDesc = '';
    moduleError = '';
    moduleModalOpen = true;
  }

  /** @param {any} m */
  function openEditModule(m) {
    isEditingModule = true;
    editingModuleId = m.id;
    moduleName = m.name || '';
    moduleDesc = m.description || '';
    moduleError = '';
    moduleModalOpen = true;
  }

  function closeModuleModal() {
    moduleModalOpen = false;
  }

  async function submitModule() {
    if (!moduleName.trim()) {
      moduleError = 'Nama modul wajib diisi.';
      return;
    }
    moduleSubmitting = true;
    moduleError = '';
    try {
      if (isEditingModule) {
        await updateDashboardModule(currentDashboard?.id, editingModuleId, {
          name: moduleName.trim(),
          description: moduleDesc.trim(),
        });
      } else {
        await createDashboardModule(currentDashboard?.id, {
          name: moduleName.trim(),
          description: moduleDesc.trim(),
        });
      }
      moduleModalOpen = false;
    } catch (e) {
      moduleError = e instanceof Error ? e.message : String(e);
    } finally {
      moduleSubmitting = false;
    }
  }

  // Delete Module Modal State
  let deleteModalOpen = $state(false);
  let deletingModule = $state(/** @type {any} */ (null));
  let deleteSubmitting = $state(false);
  let deleteError = $state('');

  /** @param {any} m */
  function confirmDeleteModule(m) {
    deletingModule = m;
    deleteError = '';
    deleteModalOpen = true;
  }

  function closeDeleteModal() {
    deleteModalOpen = false;
    deletingModule = null;
  }

  async function executeDeleteModule() {
    if (!deletingModule) return;
    deleteSubmitting = true;
    deleteError = '';
    try {
      await deleteDashboardModule(currentDashboard?.id, deletingModule.id);
      deleteModalOpen = false;
      deletingModule = null;
    } catch (e) {
      deleteError = e instanceof Error ? e.message : String(e);
    } finally {
      deleteSubmitting = false;
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      closeEditBispro();
      closeModuleModal();
      closeDeleteModal();
    }
  }
</script>

<div class="gk-container">
  <!-- General Knowledge Overview Card -->
  <div class="gk-hero-card">
    <div class="gk-hero-main">
      <div class="gk-badge-row">
        <span class="gk-code-badge">{currentDashboard?.code || 'APP'}</span>
        {#if currentDashboard?.category}
          <span class="gk-category-badge">{currentDashboard.category}</span>
        {/if}
        <span class="gk-status-chip st-{currentDashboard?.status || 'active'}">
          {registryStatusLabel(currentDashboard?.status || 'active')}
        </span>
        <span class="gk-crit-chip cr-{currentDashboard?.criticality || 'medium'}">
          {criticalityLabel(currentDashboard?.criticality || 'medium')} Priority
        </span>
      </div>
      <h2 class="gk-title">{currentDashboard?.name || 'Dashboard'}</h2>
      <p class="gk-subtitle">
        General Knowledge & Business Process Architecture
      </p>
    </div>

    <div class="gk-meta-grid">
      <div class="gk-meta-item">
        <span class="gk-meta-label">Business Owner</span>
        <strong class="gk-meta-val">{currentDashboard?.owner || '—'}</strong>
      </div>
      <div class="gk-meta-item">
        <span class="gk-meta-label">Project Manager / PIC</span>
        <strong class="gk-meta-val">{currentDashboard?.pm || '—'}</strong>
      </div>
      <div class="gk-meta-item">
        <span class="gk-meta-label">Platform</span>
        <strong class="gk-meta-val">{currentDashboard?.platform || 'Custom'}</strong>
      </div>
      <div class="gk-meta-item">
        <span class="gk-meta-label">Version</span>
        <strong class="gk-meta-val">v{currentDashboard?.version || '1.0'}</strong>
      </div>
    </div>
  </div>

  <!-- SECTION 1: Ringkasan Proses Bisnis (Bispro) & Scope -->
  <div class="gk-section-card">
    <div class="gk-section-head">
      <div class="gk-section-icon bispro-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" stroke="currentColor" stroke-width="1.8" />
          <path d="M8 7h8M8 11h8M8 15h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </div>
      <div class="gk-section-title-wrap">
        <div class="gk-tag-title">
          <span class="gk-eyebrow">ARSITEKTUR FUNGSIONAL</span>
          <h3>Ringkasan Proses Bisnis (Bispro) & Kategori</h3>
        </div>
        <p class="gk-section-desc">
          Penjelasan proses kerja aplikasi secara menyeluruh dan kategori operasional sistem.
        </p>
      </div>
      {#if isAdminOrDev}
        <button type="button" class="gk-btn-secondary" onclick={openEditBispro}>
          <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Edit Bispro</span>
        </button>
      {/if}
    </div>

    <div class="gk-bispro-body">
      <div class="gk-category-bar">
        <span class="gk-cat-pill-label">Kategori Aplikasi:</span>
        <span class="gk-cat-pill-val">{currentDashboard?.category || 'Belum dikategorikan'}</span>
      </div>

      <div class="gk-bispro-content">
        {#if currentDashboard?.description && currentDashboard.description.trim()}
          <div class="gk-text-block">
            {currentDashboard.description}
          </div>
        {:else}
          <div class="gk-empty-bispro">
            <p>Belum ada ringkasan proses bisnis (Bispro) untuk aplikasi ini.</p>
            {#if isAdminOrDev}
              <button type="button" class="gk-btn-link" onclick={openEditBispro}>
                + Tulis ringkasan proses bisnis sekarang
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- SECTION 2: Modul Aplikasi & Meaning per Modul -->
  <div class="gk-section-card">
    <div class="gk-section-head">
      <div class="gk-section-icon module-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.8"/>
        </svg>
      </div>
      <div class="gk-section-title-wrap">
        <div class="gk-tag-title">
          <span class="gk-eyebrow">STRUKTUR MODUL</span>
          <h3>Daftar Seluruh Modul Aplikasi & Meaning</h3>
        </div>
        <p class="gk-section-desc">
          Rincian modul-modul fungsional yang membentuk aplikasi serta penjelasan fungsi spesifik per modul.
        </p>
      </div>
      <div class="gk-module-actions">
        {#if isAdminOrDev}
          <button type="button" class="gk-btn-primary" onclick={openAddModule}>
            <svg viewBox="0 0 24 24" fill="none" width="11" height="11">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>Tambah Modul</span>
          </button>
        {/if}
      </div>
    </div>

    <!-- Filter and count toolbar -->
    <div class="gk-module-toolbar">
      <div class="gk-search-box">
        <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/>
          <path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <input
          type="search"
          placeholder="Cari modul atau fungsi..."
          bind:value={moduleSearch}
        />
        {#if moduleSearch}
          <button type="button" class="gk-search-clear" onclick={() => (moduleSearch = '')}>✕</button>
        {/if}
      </div>
      <span class="gk-module-counter">
        <strong>{filteredModules.length}</strong> dari {modules.length} modul
      </span>
    </div>

    <!-- Modules Grid List -->
    <div class="gk-modules-grid">
      {#if filteredModules.length === 0}
        <div class="gk-empty-modules">
          {#if moduleSearch.trim()}
            <p>Tidak ada modul yang cocok dengan pencarian "<strong>{moduleSearch}</strong>".</p>
            <button type="button" class="gk-btn-secondary" onclick={() => (moduleSearch = '')}>Reset Pencarian</button>
          {:else}
            <div class="gk-empty-illus">
              <svg viewBox="0 0 24 24" fill="none" width="36" height="36" stroke="#94a3b8" stroke-width="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            </div>
            <p class="gk-empty-main">Belum ada modul yang terdaftar untuk aplikasi ini.</p>
            <p class="gk-empty-sub">Tambahkan daftar modul dan penjelasan fungsinya agar tim memiliki pemahaman arsitektur yang sama.</p>
            {#if isAdminOrDev}
              <button type="button" class="gk-btn-primary" onclick={openAddModule}>
                + Tambah Modul Pertama
              </button>
            {/if}
          {/if}
        </div>
      {:else}
        {#each filteredModules as m, idx (m.id)}
          <div class="gk-module-card">
            <div class="gk-module-top">
              <div class="gk-module-title-box">
                <span class="gk-module-num">#{idx + 1}</span>
                <h4 class="gk-module-name">{m.name}</h4>
              </div>
              {#if isAdminOrDev}
                <div class="gk-module-ctrls">
                  <button
                    type="button"
                    class="gk-icon-btn edit"
                    title="Edit Modul"
                    aria-label="Edit Modul"
                    onclick={() => openEditModule(m)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="gk-icon-btn delete"
                    title="Hapus Modul"
                    aria-label="Hapus Modul"
                    onclick={() => confirmDeleteModule(m)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              {/if}
            </div>

            <div class="gk-module-desc-wrap">
              <span class="gk-meaning-label">Meaning & Fungsi Modul:</span>
              {#if m.description && m.description.trim()}
                <p class="gk-module-desc">{m.description}</p>
              {:else}
                <p class="gk-module-desc-empty">
                  <em>Belum ada penjelasan fungsi untuk modul ini.</em>
                  {#if isAdminOrDev}
                    <button type="button" class="gk-inline-add" onclick={() => openEditModule(m)}>+ Tambah deskripsi</button>
                  {/if}
                </p>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <!-- SECTION 3: Gateway Footer Banner to Technical Details -->
  <div class="gk-footer-gate">
    <div class="gk-gate-text">
      <h4>Kelola Kebutuhan & Task Teknis</h4>
      <p>Buka <strong>Detail Information</strong> untuk melihat requirement, status board kanban, upload evidence, dan riwayat timeline operasional.</p>
    </div>
    {#if onOpenDetailInfo}
      <button type="button" class="gk-gate-btn" onclick={onOpenDetailInfo}>
        <span>Buka Detail Information</span>
        <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    {/if}
  </div>
</div>

<!-- MODAL: Edit Bispro & Kategori -->
{#if editBisproOpen}
  <div class="gk-modal-backdrop" use:portal role="presentation" onclick={closeEditBispro} onkeydown={onKeydown}>
    <div
      class="gk-modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-bispro-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      <div class="gk-modal-head">
        <h3 id="edit-bispro-title">Edit Ringkasan Bispro & Kategori</h3>
        <button type="button" class="gk-modal-close" onclick={closeEditBispro} aria-label="Tutup">✕</button>
      </div>

      <form class="gk-modal-form" onsubmit={(e) => { e.preventDefault(); saveBispro(); }}>
        {#if bisproError}
          <div class="gk-modal-error">{bisproError}</div>
        {/if}

        <label class="gk-form-field">
          <span>Kategori Aplikasi</span>
          <input
            type="text"
            placeholder="Contoh: Financial Operations, ITD, Core ERP, Analytics"
            bind:value={editCategory}
          />
        </label>

        <label class="gk-form-field">
          <span>Ringkasan Proses Bisnis (Bispro Summary)</span>
          <textarea
            rows="6"
            placeholder="Jelaskan alur bisnis aplikasi, siapa pengguna utamanya, data apa yang diolah, dan hasil akhirnya..."
            bind:value={editBisproSummary}
          ></textarea>
        </label>

        <div class="gk-modal-foot">
          <button type="button" class="gk-btn-secondary" onclick={closeEditBispro} disabled={bisproSubmitting}>Batal</button>
          <button type="submit" class="gk-btn-primary" disabled={bisproSubmitting}>
            {bisproSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- MODAL: Tambah / Edit Modul -->
{#if moduleModalOpen}
  <div class="gk-modal-backdrop" use:portal role="presentation" onclick={closeModuleModal} onkeydown={onKeydown}>
    <div
      class="gk-modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="module-modal-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      <div class="gk-modal-head">
        <h3 id="module-modal-title">{isEditingModule ? 'Edit Modul Aplikasi' : 'Tambah Modul Baru'}</h3>
        <button type="button" class="gk-modal-close" onclick={closeModuleModal} aria-label="Tutup">✕</button>
      </div>

      <form class="gk-modal-form" onsubmit={(e) => { e.preventDefault(); submitModule(); }}>
        {#if moduleError}
          <div class="gk-modal-error">{moduleError}</div>
        {/if}

        <label class="gk-form-field">
          <span>Nama Modul <span class="req">*</span></span>
          <input
            type="text"
            placeholder="Contoh: Modul Billing & Invoicing, Modul Rekonsiliasi, dll."
            bind:value={moduleName}
            required
          />
        </label>

        <label class="gk-form-field">
          <span>Meaning / Deskripsi Fungsi Modul</span>
          <textarea
            rows="4"
            placeholder="Jelaskan apa fungsi modul ini dan bagaimana peranannya dalam alur proses bisnis aplikasi..."
            bind:value={moduleDesc}
          ></textarea>
        </label>

        <div class="gk-modal-foot">
          <button type="button" class="gk-btn-secondary" onclick={closeModuleModal} disabled={moduleSubmitting}>Batal</button>
          <button type="submit" class="gk-btn-primary" disabled={moduleSubmitting}>
            {moduleSubmitting ? 'Menyimpan...' : (isEditingModule ? 'Simpan Perubahan' : 'Tambah Modul')}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- MODAL: Konfirmasi Hapus Modul -->
{#if deleteModalOpen}
  <div class="gk-modal-backdrop" use:portal role="presentation" onclick={closeDeleteModal} onkeydown={onKeydown}>
    <div
      class="gk-modal-card danger"
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-modal-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      <div class="gk-modal-head">
        <h3 id="del-modal-title">Hapus Modul</h3>
        <button type="button" class="gk-modal-close" onclick={closeDeleteModal} aria-label="Tutup">✕</button>
      </div>

      <div class="gk-modal-body">
        {#if deleteError}
          <div class="gk-modal-error">{deleteError}</div>
        {/if}
        <p>Apakah Anda yakin ingin menghapus modul <strong>"{deletingModule?.name}"</strong>?</p>
        <p class="gk-del-sub">Modul ini akan dihapus dari daftar informasi General Knowledge aplikasi.</p>
      </div>

      <div class="gk-modal-foot">
        <button type="button" class="gk-btn-secondary" onclick={closeDeleteModal} disabled={deleteSubmitting}>Batal</button>
        <button type="button" class="gk-btn-danger" onclick={executeDeleteModule} disabled={deleteSubmitting}>
          {deleteSubmitting ? 'Menghapus...' : 'Ya, Hapus Modul'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .gk-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 2px 0 20px 0;
    width: 100%;
    color: #1e293b;
  }

  /* Hero Card */
  .gk-hero-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.92));
    backdrop-filter: blur(12px);
    border: 1px solid #e6ebf2;
    border-radius: 12px;
    padding: 12px 14px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .gk-badge-row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 2px;
  }

  .gk-code-badge {
    font-size: 0.54rem;
    font-weight: 800;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: 0.05em;
    background: #0f172a;
    color: #f8fafc;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .gk-category-badge {
    font-size: 0.56rem;
    font-weight: 700;
    color: #1e40af;
    background: #dbeafe;
    padding: 2px 8px;
    border-radius: 999px;
  }

  .gk-status-chip {
    font-size: 0.56rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
  }

  .gk-status-chip.st-active {
    background: #dcfce7;
    color: #15803d;
  }

  .gk-status-chip.st-idle {
    background: #f1f5f9;
    color: #64748b;
  }

  .gk-crit-chip {
    font-size: 0.56rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
  }

  .gk-crit-chip.cr-high {
    background: #fee2e2;
    color: #b91c1c;
  }

  .gk-crit-chip.cr-medium {
    background: #fef3c7;
    color: #b45309;
  }

  .gk-crit-chip.cr-low {
    background: #e0f2fe;
    color: #0369a1;
  }

  .gk-title {
    margin: 0;
    font-size: 0.92rem;
    font-weight: 750;
    letter-spacing: -0.01em;
    color: #0f172a;
    line-height: 1.25;
  }

  .gk-subtitle {
    margin: 2px 0 0 0;
    font-size: 0.65rem;
    font-weight: 500;
    color: #64748b;
    line-height: 1.3;
  }

  .gk-meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 8px 14px;
    padding-top: 8px;
    border-top: 1px solid #edf2f7;
  }

  .gk-meta-item {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .gk-meta-label {
    font-size: 0.52rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #94a3b8;
    line-height: 1.2;
  }

  .gk-meta-val {
    font-size: 0.70rem;
    font-weight: 700;
    color: #0f172a;
    word-break: break-word;
    line-height: 1.3;
  }

  /* Section Cards */
  .gk-section-card {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid #e6ebf2;
    border-radius: 12px;
    padding: 12px 14px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
  }

  .gk-section-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .gk-section-icon {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .gk-section-icon.bispro-icon {
    background: #eff6ff;
    color: #2563eb;
  }

  .gk-section-icon.module-icon {
    background: #fdf4ff;
    color: #a855f7;
  }

  .gk-section-icon svg {
    width: 14px;
    height: 14px;
  }

  .gk-section-title-wrap {
    flex: 1;
    min-width: 0;
  }

  .gk-eyebrow {
    font-size: 0.50rem;
    font-weight: 750;
    letter-spacing: 0.05em;
    color: #2563eb;
    text-transform: uppercase;
    display: block;
    margin-bottom: 1px;
    line-height: 1.2;
  }

  .gk-section-title-wrap h3 {
    margin: 0;
    font-size: 0.80rem;
    font-weight: 750;
    letter-spacing: -0.01em;
    color: #0f172a;
    line-height: 1.25;
  }

  .gk-section-desc {
    margin: 2px 0 0 0;
    font-size: 0.62rem;
    color: #64748b;
    line-height: 1.35;
  }

  /* Bispro Body */
  .gk-bispro-body {
    background: #f8fafc;
    border: 1px solid #edf2f7;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .gk-category-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.60rem;
  }

  .gk-cat-pill-label {
    font-size: 0.54rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .gk-cat-pill-val {
    background: #e2e8f0;
    color: #0f172a;
    font-weight: 700;
    padding: 1.5px 7px;
    border-radius: 4px;
    font-size: 0.58rem;
  }

  .gk-text-block {
    font-size: 0.68rem;
    line-height: 1.5;
    color: #334155;
    white-space: pre-line;
  }

  .gk-empty-bispro {
    padding: 12px;
    text-align: center;
    color: #64748b;
    font-size: 0.65rem;
  }

  .gk-btn-link {
    background: none;
    border: none;
    color: #2563eb;
    font-weight: 700;
    font-size: 0.62rem;
    cursor: pointer;
    margin-top: 4px;
    text-decoration: underline;
  }

  /* Modules Toolbar */
  .gk-module-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .gk-search-box {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    max-width: 280px;
  }

  .gk-search-box svg {
    position: absolute;
    left: 8px;
    width: 12px;
    height: 12px;
    color: #94a3b8;
    pointer-events: none;
  }

  .gk-search-box input {
    width: 100%;
    height: 26px;
    padding: 0 24px 0 26px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background: #fff;
    font-size: 0.64rem;
    color: #1e293b;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .gk-search-box input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }

  .gk-search-clear {
    position: absolute;
    right: 6px;
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 0.65rem;
  }

  .gk-module-counter {
    font-size: 0.58rem;
    color: #64748b;
  }

  /* Modules Grid */
  .gk-modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 8px;
  }

  .gk-module-card {
    background: #ffffff;
    border: 1px solid #e6ebf2;
    border-radius: 9px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }

  .gk-module-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.05);
    border-color: #cbd5e1;
  }

  .gk-module-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px;
  }

  .gk-module-title-box {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
  }

  .gk-module-num {
    font-size: 0.52rem;
    font-weight: 800;
    color: #64748b;
    background: #f1f5f9;
    padding: 1.5px 5px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .gk-module-name {
    margin: 0;
    font-size: 0.68rem;
    font-weight: 750;
    color: #0f172a;
    line-height: 1.3;
    word-break: break-word;
  }

  .gk-module-ctrls {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
  }

  .gk-icon-btn {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    border: 1px solid #e2e8f0;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: all 0.15s ease;
  }

  .gk-icon-btn.edit:hover {
    color: #2563eb;
    border-color: #93c5fd;
    background: #eff6ff;
  }

  .gk-icon-btn.delete:hover {
    color: #dc2626;
    border-color: #fca5a5;
    background: #fef2f2;
  }

  .gk-icon-btn svg {
    width: 10px;
    height: 10px;
  }

  .gk-module-desc-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: #f8fafc;
    border-radius: 6px;
    padding: 6px 8px;
    border: 1px solid #f1f5f9;
  }

  .gk-meaning-label {
    font-size: 0.48rem;
    font-weight: 750;
    letter-spacing: 0.03em;
    color: #64748b;
    text-transform: uppercase;
  }

  .gk-module-desc {
    margin: 0;
    font-size: 0.62rem;
    line-height: 1.4;
    color: #334155;
    word-break: break-word;
  }

  .gk-module-desc-empty {
    margin: 0;
    font-size: 0.60rem;
    color: #94a3b8;
  }

  .gk-inline-add {
    display: inline-block;
    background: none;
    border: none;
    color: #2563eb;
    font-size: 0.58rem;
    font-weight: 700;
    cursor: pointer;
    margin-left: 3px;
    padding: 0;
  }

  /* Empty Modules State */
  .gk-empty-modules {
    grid-column: 1 / -1;
    background: #f8fafc;
    border: 1.5px dashed #cbd5e1;
    border-radius: 10px;
    padding: 24px 16px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .gk-empty-main {
    margin: 0;
    font-size: 0.72rem;
    font-weight: 750;
    color: #334155;
  }

  .gk-empty-sub {
    margin: 0;
    font-size: 0.62rem;
    color: #64748b;
    max-width: 400px;
    line-height: 1.35;
  }

  /* Buttons */
  .gk-btn-primary {
    height: 26px;
    padding: 0 11px;
    background: #0f172a;
    color: #ffffff;
    border: none;
    border-radius: 999px;
    font-size: 0.60rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .gk-btn-primary:hover:not(:disabled) {
    background: #334155;
  }

  .gk-btn-secondary {
    height: 26px;
    padding: 0 10px;
    background: #ffffff;
    color: #334155;
    border: 1px solid rgba(203, 213, 225, 0.9);
    border-radius: 999px;
    font-size: 0.60rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .gk-btn-secondary:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #94a3b8;
  }

  .gk-btn-danger {
    height: 26px;
    padding: 0 11px;
    background: #dc2626;
    color: #ffffff;
    border: none;
    border-radius: 999px;
    font-size: 0.60rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .gk-btn-danger:hover:not(:disabled) {
    background: #b91c1c;
  }

  /* Gateway Footer */
  .gk-footer-gate {
    background: linear-gradient(135deg, #1e293b, #0f172a);
    color: #ffffff;
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.12);
  }

  .gk-gate-text h4 {
    margin: 0;
    font-size: 0.74rem;
    font-weight: 750;
    color: #f8fafc;
  }

  .gk-gate-text p {
    margin: 2px 0 0 0;
    font-size: 0.60rem;
    color: #94a3b8;
    line-height: 1.35;
  }

  .gk-gate-btn {
    height: 26px;
    padding: 0 11px;
    background: #3b82f6;
    color: #ffffff;
    border: none;
    border-radius: 999px;
    font-size: 0.60rem;
    font-weight: 750;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease;
  }

  .gk-gate-btn:hover {
    background: #2563eb;
    transform: translateX(2px);
  }

  /* Modals */
  .gk-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .gk-modal-card {
    background: #ffffff;
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 12px;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 16px 36px -6px rgba(15, 23, 42, 0.22);
    overflow: hidden;
    animation: gk-modal-pop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .gk-modal-card.danger {
    max-width: 380px;
  }

  @keyframes gk-modal-pop {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(6px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .gk-modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .gk-modal-head h3 {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 750;
    color: #0f172a;
  }

  .gk-modal-close {
    background: none;
    border: none;
    color: #64748b;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 2px;
  }

  .gk-modal-form,
  .gk-modal-body {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .gk-modal-error {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #dc2626;
    font-size: 0.62rem;
    padding: 6px 10px;
    border-radius: 5px;
  }

  .gk-form-field {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .gk-form-field span {
    font-size: 0.58rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .gk-form-field .req {
    color: #dc2626;
  }

  .gk-form-field input,
  .gk-form-field textarea {
    padding: 6px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.68rem;
    color: #1e293b;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .gk-form-field input:focus,
  .gk-form-field textarea:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }

  .gk-field-hint {
    font-size: 0.54rem;
    color: #64748b;
  }

  .gk-modal-foot {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    margin-top: 4px;
  }

  .gk-btn-sub {
    height: 26px;
    padding: 0 12px;
    background: #0f172a;
    color: #ffffff;
    border: none;
    border-radius: 999px;
    font-size: 0.60rem;
    font-weight: 700;
    cursor: pointer;
  }

  .gk-btn-del {
    height: 26px;
    padding: 0 12px;
    background: #dc2626;
    color: #ffffff;
    border: none;
    border-radius: 999px;
    font-size: 0.60rem;
    font-weight: 700;
    cursor: pointer;
  }

  .gk-btn-cancel {
    height: 26px;
    padding: 0 10px;
    background: #ffffff;
    color: #64748b;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    font-size: 0.60rem;
    font-weight: 650;
    cursor: pointer;
  }

  .gk-del-sub {
    margin: 2px 0 0 0;
    font-size: 0.62rem;
    color: #64748b;
    line-height: 1.35;
  }
</style>
