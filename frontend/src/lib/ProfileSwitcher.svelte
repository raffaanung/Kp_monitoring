<script>
  import { goto } from '$app/navigation'
  import { portal } from './portal.js'
  import { sessionPersonas, setSessionPersona } from './taskModuleStore.svelte.js'

  /** @type {{ name: string, label: string, avatar: string, currentId: string }} */
  let { name, label, avatar, currentId } = $props()

  let open = $state(false)
  /** @type {HTMLButtonElement | null} */
  let anchor = $state(null)
  let menuStyle = $state('')

  function placeMenu() {
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const right = Math.max(12, window.innerWidth - rect.right)
    menuStyle = `top:${Math.round(rect.bottom + 8)}px;right:${Math.round(right)}px;`
  }

  function toggle() {
    open = !open
    if (open) queueMicrotask(placeMenu)
  }

  function close() {
    open = false
  }

  /** @param {string} id */
  function pick(id) {
    setSessionPersona(id)
    open = false
  }
</script>

<div class="switcher">
  <button
    bind:this={anchor}
    type="button"
    class="profile-chip"
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label={`Ganti profil, sekarang ${name}`}
    onclick={toggle}
  >
    <img class="avatar" src={avatar} alt="" />
    <span class="profile-meta">
      <strong>{name}</strong>
      <small>{label}</small>
    </span>
  </button>
</div>

{#if open}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="scrim" use:portal role="presentation" onclick={close} onkeydown={(e) => e.key === 'Escape' && close()}></div>
  <div class="menu" use:portal style={menuStyle} role="listbox" aria-label="Pilih profil dummy">
    <p class="menu-title">Ganti profil</p>
    {#each sessionPersonas as persona (persona.id)}
      <button
        type="button"
        class="option"
        class:on={persona.id === currentId}
        role="option"
        aria-selected={persona.id === currentId}
        onclick={() => pick(persona.id)}
      >
        <strong>{persona.name}</strong>
        <small>{persona.label}</small>
      </button>
    {/each}
    <a class="profile-link" href="/access/profile" onclick={close}>Buka halaman profil</a>
  </div>
{/if}

<style>
  .switcher {
    position: relative;
    flex-shrink: 0;
  }

  .profile-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 3px 12px 3px 3px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    color: inherit;
    font: inherit;
  }

  .profile-chip:hover {
    background: #fff;
  }

  .avatar {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    object-fit: cover;
  }

  .profile-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.15;
    text-align: left;
  }

  .profile-meta strong {
    font-size: 0.72rem;
    font-weight: 700;
    color: #1a1a1a;
    white-space: nowrap;
  }

  .profile-meta small {
    font-size: 0.6rem;
    font-weight: 550;
    color: #8e8e93;
  }

  .scrim {
    position: fixed;
    inset: 0;
    z-index: 1200;
    background: transparent;
    border: 0;
  }

  .menu {
    position: fixed;
    z-index: 1201;
    width: 240px;
    max-height: min(420px, calc(100vh - 80px));
    overflow: auto;
    padding: 8px;
    border-radius: 16px;
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16);
  }

  .menu-title {
    margin: 2px 8px 6px;
    font-size: 0.62rem;
    font-weight: 750;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #8e8e93;
  }

  .option {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    padding: 8px 10px;
    cursor: pointer;
    font: inherit;
    text-align: left;
  }

  .option strong {
    font-size: 0.75rem;
    font-weight: 680;
    color: #1a1a1a;
  }

  .option small {
    font-size: 0.62rem;
    font-weight: 650;
    color: #8e8e93;
  }

  .option:hover {
    background: #f3f4f6;
  }

  .option.on {
    background: #f3f4f6;
  }

  .option.on small {
    color: #1a1a1a;
  }

  .profile-link {
    display: block;
    margin-top: 4px;
    padding: 8px 10px 6px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    font-size: 0.7rem;
    font-weight: 650;
    color: #3a3f46;
    text-decoration: none;
  }

  .profile-link:hover {
    color: #1a1a1a;
  }
</style>
