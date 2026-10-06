<script>
  import { portal } from '$lib/portal.js';
  import { listUsers } from '$lib/accessStore.svelte.js';

  let { inviteOpen = $bindable(false), dashboard = $bindable(null) } = $props();

  const userOptions = $derived(listUsers({ status: "active" }));

  let formUser = $state("");
  let formRole = $state("Developer");
  let formPerm = $state("Read, Write");

  $effect(() => {
    if (inviteOpen) {
      formUser = "";
      formRole = "Developer";
      formPerm = "Read, Write";
    }
  });

  function closeInvite() {
    inviteOpen = false;
  }

  function onInvite(event) {
    event.preventDefault();
    if (!dashboard) return;

    // Simulate saving team member (since no backend is attached yet)
    alert(`Anggota ${formUser} berhasil diundang sebagai ${formRole}!`);
    inviteOpen = false;
  }
</script>

{#if inviteOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="dash-backdrop" use:portal role="presentation" onclick={closeInvite}></div>
  
  <form class="dash-modal" use:portal role="dialog" aria-modal="true" onclick={(e) => e.stopPropagation()} onsubmit={onInvite} style="max-width: 480px; flex-direction: column;">
    <header class="wizard-right-head" style="padding: 16px 24px; border-bottom: 1px solid rgba(0,0,0,0.06); display: flex; align-items: center; justify-content: space-between;">
      <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700;">Undang Anggota Tim</h3>
      <button type="button" class="dash-close" onclick={closeInvite} aria-label="Tutup">
        <svg viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </header>
    
    <div class="wizard-body-scroll" style="padding: 24px;">
      <label>
        <span>Pilih Pengguna <span class="req">*</span></span>
        <select bind:value={formUser} required>
          <option value="">-- Pilih --</option>
          {#each userOptions as user}
            <option value={user.name}>{user.name}</option>
          {/each}
        </select>
      </label>
      
      <label>
        Project Role
        <select bind:value={formRole}>
          <option value="Developer">Developer</option>
          <option value="QA">QA / Tester</option>
          <option value="Reviewer">Reviewer</option>
          <option value="Business Owner">Business Owner</option>
        </select>
      </label>
      
      <label>
        Izin Akses Khusus
        <input bind:value={formPerm} placeholder="Contoh: Read, Write, Deploy" />
      </label>
    </div>
    
    <footer class="wizard-foot" style="border-top: 1px solid rgba(0,0,0,0.06); padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px;">
      <button type="button" class="dash-cancel" onclick={closeInvite}>Batal</button>
      <button type="submit" class="dash-save wizard-btn finish" style="width: auto; padding: 0 20px;">Undang</button>
    </footer>
  </form>
{/if}
