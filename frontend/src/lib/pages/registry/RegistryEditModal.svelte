<script>
  import { portal } from '$lib/portal.js';
  import { updateDashboard } from '$lib/registryStore.svelte.js';
  import { listUsers } from '$lib/accessStore.svelte.js';

  let { editOpen = $bindable(false), dashboard = $bindable(null) } = $props();

  const pmOptions = $derived(listUsers({ role: 3, status: "active" }));
  const userOptions = $derived(listUsers({ status: "active" }));

  let formName = $state("");
  let formCode = $state("");
  let formPlatform = $state("");
  let formDescription = $state("");
  let formPm = $state("");
  let formUser = $state("");
  let formCategory = $state("");
  let formPriority = $state("medium");
  let formUrl = $state("");

  $effect(() => {
    if (editOpen && dashboard) {
      formName = dashboard.name || "";
      formCode = dashboard.code || "";
      formPlatform = dashboard.platform || "";
      formDescription = dashboard.description || "";
      formPm = dashboard.pm || "";
      formUser = dashboard.owner || "";
      formCategory = dashboard.category || "";
      formPriority = dashboard.criticality || "medium";
      formUrl = dashboard.url || "";
    }
  });

  function closeEdit() {
    editOpen = false;
  }

  function onSave(event) {
    event.preventDefault();
    if (!dashboard) return;

    const patch = {
      name: formName.trim(),
      code: formCode.trim(),
      platform: formPlatform.trim(),
      description: formDescription.trim(),
      pm: formPm.trim(),
      owner: formUser.trim(),
      category: formCategory,
      criticality: formPriority,
      url: formUrl.trim(),
    };

    updateDashboard(dashboard.id, patch);
    
    // Update local state directly so it reflects on UI immediately
    Object.assign(dashboard, patch);

    editOpen = false;
  }
</script>

{#if editOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="dash-backdrop" use:portal role="presentation" onclick={closeEdit}></div>
  
  <form class="dash-modal edit-modal-premium" use:portal role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()} onsubmit={onSave}>
    
    <header class="edit-header">
      <div class="header-content">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </div>
        <div class="header-text">
          <h3>Ubah Informasi Umum</h3>
          <p>Perbarui identitas dan detail utama aplikasi ini.</p>
        </div>
      </div>
      <button type="button" class="dash-close close-btn-premium" onclick={closeEdit} aria-label="Tutup">
        <svg viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </header>
    
    <div class="wizard-body-scroll edit-body">
      <div class="form-group-premium">
        <label>
          <span>Nama Aplikasi / Dashboard <span class="req">*</span></span>
          <input class="input-premium" bind:value={formName} required maxlength="80" placeholder="Contoh: Operation Dashboard" />
        </label>
      </div>
      
      <div class="grid-2">
        <div class="form-group-premium">
          <label>
            <span>Kode Aplikasi</span>
            <input class="input-premium" bind:value={formCode} maxlength="6" placeholder="Misal: EDM" />
          </label>
        </div>
        <div class="form-group-premium">
          <label>
            <span>Platform</span>
            <input class="input-premium" bind:value={formPlatform} maxlength="80" placeholder="Contoh: Web, Android" />
          </label>
        </div>
      </div>
      
      <div class="form-group-premium">
        <label>
          <span>Deskripsi Scope Aplikasi</span>
          <textarea class="input-premium textarea-premium" rows="3" bind:value={formDescription} maxlength="600" placeholder="Jelaskan fungsi aplikasi secara singkat..."></textarea>
        </label>
      </div>
      
      <div class="grid-2">
        <div class="form-group-premium">
          <label>
            <span>Kategori</span>
            <div class="select-wrapper">
              <select class="input-premium" bind:value={formCategory}>
                <option value="">Pilih Kategori...</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="IT">IT</option>
                <option value="Legal">Legal</option>
                <option value="General">Lainnya / General</option>
              </select>
            </div>
          </label>
        </div>
        <div class="form-group-premium">
          <label>
            <span>Prioritas Pengerjaan</span>
            <div class="select-wrapper">
              <select class="input-premium" bind:value={formPriority}>
                <option value="high">Tinggi (High)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="low">Rendah (Low)</option>
              </select>
            </div>
          </label>
        </div>
      </div>
      
      <div class="grid-2">
        <div class="form-group-premium">
          <label>
            <span>PIC / Pemohon</span>
            <input class="input-premium" bind:value={formUser} list="edit-user-options" placeholder="Pilih atau ketik PIC..." />
            <datalist id="edit-user-options">
              {#each userOptions as user}
                <option value={user.name}></option>
              {/each}
            </datalist>
          </label>
        </div>
        <div class="form-group-premium">
          <label>
            <span>URL / Tautan</span>
            <input class="input-premium" bind:value={formUrl} placeholder="https://..." />
          </label>
        </div>
      </div>
    </div>
    
    <footer class="edit-footer">
      <button type="button" class="btn-cancel-premium" onclick={closeEdit}>Batal</button>
      <button type="submit" class="btn-save-premium">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        Simpan Perubahan
      </button>
    </footer>
  </form>
{/if}

<style>
  /* Premium Edit Modal Styles */
  .edit-modal-premium {
    max-width: 650px !important;
    flex-direction: column !important;
    border-radius: 16px !important;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05) !important;
    background: #fff !important;
    overflow: hidden !important;
  }

  .edit-header {
    background: linear-gradient(to right, #f8fafc, #f1f5f9);
    padding: 20px 28px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-icon {
    width: 42px;
    height: 42px;
    background: #e0f2fe;
    color: #0284c7;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(2, 132, 199, 0.15);
  }

  .header-icon svg {
    width: 22px;
    height: 22px;
  }

  .header-text h3 {
    margin: 0 0 4px 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.01em;
  }

  .header-text p {
    margin: 0;
    font-size: 0.8rem;
    color: #64748b;
  }

  .close-btn-premium {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .close-btn-premium:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  .close-btn-premium svg {
    width: 20px;
    height: 20px;
  }

  .edit-body {
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-group-premium label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0; /* Reset global label margin */
  }

  .form-group-premium label span {
    font-size: 0.82rem;
    font-weight: 600;
    color: #334155;
  }

  .req {
    color: #ef4444;
  }

  .input-premium {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #0f172a;
    background: #fff;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    height: auto; /* Reset global height if any */
  }

  .input-premium:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }

  .input-premium::placeholder {
    color: #94a3b8;
  }

  .textarea-premium {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }

  .select-wrapper {
    position: relative;
  }

  .select-wrapper::after {
    content: "";
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    pointer-events: none;
  }
  
  .select-wrapper select {
    appearance: none;
    -webkit-appearance: none;
    padding-right: 32px;
  }

  .edit-footer {
    padding: 20px 28px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn-cancel-premium {
    padding: 10px 20px;
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    height: auto;
  }

  .btn-cancel-premium:hover {
    background: #f1f5f9;
    color: #0f172a;
    border-color: #94a3b8;
  }

  .btn-save-premium {
    padding: 10px 20px;
    background: #0f172a;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
    height: auto;
  }

  .btn-save-premium:hover {
    background: #1e293b;
    transform: translateY(-1px);
    box-shadow: 0 6px 14px rgba(15, 23, 42, 0.25);
  }

  .btn-save-premium:active {
    transform: translateY(0);
  }
</style>
