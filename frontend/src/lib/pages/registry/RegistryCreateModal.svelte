<script>
  import { portal } from '$lib/portal.js';
  import { createDashboard } from '$lib/registryStore.svelte.js';
  import { currentUserName } from '$lib/taskModuleStore.svelte.js';

  let { 
    createOpen = $bindable(), 
    pmOptions = [], 
    userOptions = [] 
  } = $props();

  let currentStep = $state(1);
  let formName = $state("");
  let formCode = $state("");
  let formPlatform = $state("");
  let formDescription = $state("");
  let formPm = $state("");
  let formUser = $state("");
  let formCategory = $state("");
  let formPriority = $state("medium");
  let formStartDate = $state("");
  let formTargetDate = $state("");
  let formTechStack = $state("");
  let formError = $state("");

  function closeCreate() {
    createOpen = false;
  }

  function nextStep() {
    if (currentStep === 1) {
      formError = "";
      currentStep = 2;
    }
  }

  function prevStep() {
    formError = "";
    if (currentStep > 1) currentStep -= 1;
  }

  function goToStep(step) {
    formError = "";
    currentStep = step;
  }

  function onCreate(event) {
    event.preventDefault();

    const name = formName.trim();
    const pm = formPm.trim();
    if (!name || !pm) {
      formError = "Nama aplikasi dan PM wajib diisi sebelum menyimpan.";
      if (!name) currentStep = 1;
      else if (!pm) currentStep = 2;
      return;
    }
    const deploy = formPlatform.trim();
    const userName = formUser.trim();
    const created = createDashboard({
      name,
      code: formCode.trim(),
      description: formDescription.trim(),
      pm,
      owner: userName || currentUserName(),
      url: deploy,
      platform: deploy || "Custom",
      actor: currentUserName(),
      category: formCategory,
      criticality: formPriority,
      start_date: formStartDate,
      target_date: formTargetDate,
      tech_stack: formTechStack,
    });
    if (!created) {
      formError = "Gagal menyimpan. Dashboard dengan nama tersebut mungkin sudah ada.";
      return;
    }
    createOpen = false;
  }
</script>

{#if createOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="dash-backdrop"
    use:portal
    role="presentation"
    onclick={closeCreate}
  ></div>
  <form
    class="dash-modal wizard-split"
    use:portal
    role="dialog"
    aria-modal="true"
    aria-labelledby="add-dashboard-title"
    onclick={(e) => e.stopPropagation()}
    onsubmit={onCreate}
  >
    <!-- LEFT SIDEBAR -->
    <div class="wizard-left">
      <div class="left-header">
        <h2 id="add-dashboard-title">Registrasi Proyek</h2>
        <p>
          Ikuti panduan langkah demi langkah untuk mendaftarkan aplikasi baru ke
          dalam registry.
        </p>
      </div>

      <div class="wizard-steps-v">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="step-v"
          class:active={currentStep === 1}
          class:done={currentStep > 1}
          onclick={() => goToStep(1)}
        >
          <div class="v-circle">
            {#if currentStep > 1}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"><polyline points="20 6 9 17 4 12" /></svg
              >
            {:else}
              1
            {/if}
          </div>
          <div class="v-info">
            <span class="v-title">Identitas</span>
            <span class="v-desc">Nama & informasi dasar</span>
          </div>
        </div>

        <div class="v-line" class:active={currentStep > 1}></div>

        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="step-v"
          class:active={currentStep === 2}
          onclick={() => goToStep(2)}
        >
          <div class="v-circle">2</div>
          <div class="v-info">
            <span class="v-title">Teknis & Timeline</span>
            <span class="v-desc">PM, target, tech stack</span>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT PANEL -->
    <div class="wizard-right">
      <header class="wizard-right-head">
        <button
          type="button"
          class="dash-close"
          aria-label="Tutup"
          onclick={closeCreate}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M7 7l10 10M17 7 7 17"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </header>

      <div class="wizard-body-scroll">
        {#if currentStep === 1}
          <div class="wizard-pane">
            <div class="pane-title-wrap">
              <h4 class="pane-title">Identitas & Stakeholder</h4>
              <p class="pane-sub">
                Lengkapi informasi dasar mengenai aplikasi/dashboard.
              </p>
            </div>

            <label>
              <span>Nama Aplikasi / Dashboard <span class="req">*</span></span>
              <input
                bind:value={formName}
                maxlength="80"
                placeholder="Contoh: Operation Dashboard"
                required
              />
            </label>
            <label>
              Kode Aplikasi (Opsional)
              <input
                bind:value={formCode}
                maxlength="6"
                placeholder="Contoh: EDM, OPR"
              />
              <span class="input-hint"
                >Singkatan unik, maksimal 6 karakter.</span
              >
            </label>
            <label>
              Deskripsi Scope Aplikasi
              <textarea
                rows="3"
                maxlength="600"
                bind:value={formDescription}
                placeholder="Deskripsikan fungsi dan tujuan aplikasi ini..."
              ></textarea>
            </label>

            <div class="grid-2">
              <label>
                Kategori / Departemen
                <select bind:value={formCategory}>
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
              </label>
              <label>
                Pemohon (Business Owner)
                <input
                  bind:value={formUser}
                  maxlength="80"
                  placeholder="Masukkan nama pemohon..."
                />
              </label>
            </div>
          </div>
        {:else}
          <div class="wizard-pane">
            <div class="pane-title-wrap">
              <h4 class="pane-title">Detail Teknis & Timeline</h4>
              <p class="pane-sub">
                Spesifikasi teknis, tenggat waktu, dan penanggung jawab.
              </p>
            </div>

            <div class="grid-2">
              <label>
                <span>PM (Project Manager) <span class="req">*</span></span>
                <select bind:value={formPm} required>
                  <option value="">Pilih PM...</option>
                  {#each pmOptions as user (user.id)}
                    <option value={user.name}>{user.name}</option>
                  {/each}
                </select>
              </label>
              <label>
                Prioritas Pengerjaan
                <select bind:value={formPriority}>
                  <option value="high">Tinggi (High)</option>
                  <option value="medium">Sedang (Medium)</option>
                  <option value="low">Rendah (Low)</option>
                </select>
              </label>
            </div>

            <div class="grid-2">
              <label>
                Tanggal Mulai
                <input type="date" bind:value={formStartDate} />
              </label>
              <label>
                Target Selesai
                <input type="date" bind:value={formTargetDate} />
              </label>
            </div>

            <label>
              Platform / Tujuan Deploy
              <input
                bind:value={formPlatform}
                maxlength="200"
                placeholder="Contoh: Web, Mobile, https://app..."
              />
            </label>
            <label>
              Tech Stack
              <input
                bind:value={formTechStack}
                maxlength="150"
                placeholder="Contoh: Svelte, Laravel, PostgreSQL"
              />
              <span class="input-hint"
                >Pisahkan dengan koma jika lebih dari satu.</span
              >
            </label>
          </div>
        {/if}
      </div>

      {#if formError}
        <div class="dash-modal-body-error">
          <p class="dash-error">{formError}</p>
        </div>
      {/if}

      <footer class="wizard-foot">
        {#if currentStep === 1}
          <button type="button" class="dash-cancel" onclick={closeCreate}
            >Batal</button
          >
          <button type="button" class="dash-save wizard-btn" onclick={nextStep}>
            Selanjutnya
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg
            >
          </button>
        {:else}
          <button type="button" class="dash-cancel" onclick={prevStep}
            >Kembali</button
          >
          <button type="submit" class="dash-save wizard-btn finish">
            Simpan Proyek
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"><path d="M20 6L9 17l-5-5" /></svg
            >
          </button>
        {/if}
      </footer>
    </div>
  </form>
{/if}
