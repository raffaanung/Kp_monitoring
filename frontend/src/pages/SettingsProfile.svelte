<script>
  import GlassPanel from '../lib/GlassPanel.svelte'
  import SubmenuHeader from '../lib/SubmenuHeader.svelte'
  import {
    currentProfile,
    updateProfile,
    updateAvatar,
    clearAvatar,
  } from '../lib/settingsStore.svelte.js'
  import { authStore, changePassword } from '../lib/authStore.svelte.js'

  let photoOpen = $state(false)
  let infoOpen = $state(false)
  let passwordOpen = $state(false)

  /** @type {File | null} */
  let photoFile = $state(null)
  let photoPreview = $state('')
  let photoError = $state('')
  let infoError = $state('')
  let infoOk = $state('')
  let busy = $state(false)

  let displayName = $state('')
  let username = $state('')

  let currentPassword = $state('')
  let newPassword = $state('')
  let confirmPassword = $state('')
  let passwordError = $state('')
  let passwordOk = $state('')

  const profile = $derived.by(() => {
    void authStore.user
    return currentProfile()
  })

  const session = $derived.by(() => authStore.user)

  const avatarSrc = $derived(session?.avatar_url || '')
  const shownName = $derived(profile.displayName || session?.name || '')

  /** @param {string} n */
  function initials(n) {
    return (n || '')
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  }

  /** @param {string} n */
  function faceTone(n) {
    const tones = ['rose', 'sky', 'soft', 'mint', 'sand']
    let h = 0
    for (let i = 0; i < n.length; i++) h = (h + n.charCodeAt(i)) % tones.length
    return tones[h]
  }

  function openPhoto() {
    photoFile = null
    photoPreview = ''
    photoError = ''
    photoOpen = true
  }

  function closePhoto() {
    photoOpen = false
    photoFile = null
    photoPreview = ''
    photoError = ''
  }

  function openInfo() {
    displayName = profile.displayName
    username = profile.username
    infoError = ''
    infoOk = ''
    infoOpen = true
  }

  function closeInfo() {
    infoOpen = false
  }

  function openPassword() {
    currentPassword = ''
    newPassword = ''
    confirmPassword = ''
    passwordError = ''
    passwordOpen = true
  }

  function closePassword() {
    passwordOpen = false
  }

  function closeAll() {
    closePhoto()
    closeInfo()
    closePassword()
  }

  /** @param {Event} e */
  function onFileChange(e) {
    photoError = ''
    const input = /** @type {HTMLInputElement} */ (e.currentTarget)
    const file = input.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      photoError = 'Pilih file gambar'
      return
    }
    if (file.size > 1.5 * 1024 * 1024) {
      photoError = 'Ukuran maksimal 1.5 MB'
      return
    }
    photoFile = file
    photoPreview = URL.createObjectURL(file)
  }

  /** @param {Event} e */
  async function onPhotoSubmit(e) {
    e.preventDefault()
    photoError = ''
    if (!photoFile) {
      photoError = 'Pilih foto terlebih dahulu'
      return
    }
    busy = true
    const res = await updateAvatar(photoFile)
    busy = false
    if (!res.ok) {
      photoError = res.error
      return
    }
    closePhoto()
  }

  async function onClearPhoto() {
    busy = true
    await clearAvatar()
    busy = false
    closePhoto()
  }

  /** @param {Event} e */
  async function onInfoSubmit(e) {
    e.preventDefault()
    infoError = ''
    infoOk = ''
    busy = true
    const res = await updateProfile({ displayName, username })
    busy = false
    if (!res.ok) {
      infoError = res.error
      return
    }
    infoOk = 'Profil disimpan'
    infoOpen = false
  }

  /** @param {Event} e */
  async function onPasswordSubmit(e) {
    e.preventDefault()
    passwordError = ''
    if (newPassword.length < 6) {
      passwordError = 'Password baru minimal 6 karakter'
      return
    }
    if (newPassword !== confirmPassword) {
      passwordError = 'Konfirmasi password tidak cocok'
      return
    }
    busy = true
    const res = await changePassword(currentPassword, newPassword)
    busy = false
    if (!res.ok) {
      passwordError = res.error
      return
    }
    passwordOk = 'Password berhasil diganti'
    passwordOpen = false
  }

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    if (e.key === 'Escape') closeAll()
  }
</script>

<section class="page">
  <GlassPanel>
    <SubmenuHeader
      eyebrow="User Access"
      title="Profile"
      sub="Kelola foto dan info akun"
      meta={shownName}
    />
  </GlassPanel>

  <GlassPanel class="fill">
    <div class="grid">
      <article class="card">
        <div class="card-top">
          <div>
            <h3>Edit Foto</h3>
            <p>Foto profil yang tampil di header aplikasi</p>
          </div>
          <button type="button" class="btn" onclick={openPhoto}>Ubah foto</button>
        </div>
        <div class="photo-row">
          {#if avatarSrc}
            <img class="avatar" src={avatarSrc} alt="" />
          {:else}
            <i class="avatar face {faceTone(shownName)}">{initials(shownName)}</i>
          {/if}
          <div class="photo-meta">
            <strong>{shownName}</strong>
            <small>{session?.role_name} · {session?.functional_role}</small>
          </div>
        </div>
      </article>

      <article class="card">
        <div class="card-top">
          <div>
            <h3>Edit Info</h3>
            <p>Nama tampilan dan username akun</p>
          </div>
          <button type="button" class="btn" onclick={openInfo}>Edit info</button>
        </div>
        <dl class="info-list">
          <div>
            <dt>Nama tampilan</dt>
            <dd>{shownName}</dd>
          </div>
          <div>
            <dt>Username</dt>
            <dd>{profile.username || '—'}</dd>
          </div>
          <div>
            <dt>Unit</dt>
            <dd>{profile.unit || '—'}</dd>
          </div>
        </dl>
        {#if infoOk}<p class="ok">{infoOk}</p>{/if}
      </article>

      <article class="card">
        <div class="card-top">
          <div>
            <h3>Keamanan</h3>
            <p>Ganti password akun</p>
          </div>
          <button type="button" class="btn" onclick={openPassword}>Ganti password</button>
        </div>
        {#if passwordOk}<p class="ok">{passwordOk}</p>{/if}
      </article>
    </div>
  </GlassPanel>
</section>

{#if photoOpen}
  <div class="backdrop" role="presentation" onclick={closePhoto} onkeydown={onKeydown}>
    <div
      class="modal liquidGlass-wrapper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-photo-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      <div class="liquidGlass-effect"></div>
      <div class="liquidGlass-tint"></div>
      <div class="liquidGlass-shine"></div>
      <form class="modal-body" onsubmit={onPhotoSubmit}>
        <div class="modal-head">
          <div>
            <h2 id="edit-photo-title">Edit Foto</h2>
            <p>Unggah JPG, PNG, atau WebP (maks. 1.5 MB)</p>
          </div>
          <button type="button" class="close" aria-label="Tutup" onclick={closePhoto}>×</button>
        </div>

        <div class="preview-wrap">
          {#if photoPreview || avatarSrc}
            <img class="preview" src={photoPreview || avatarSrc} alt="" />
          {:else}
            <i class="preview face {faceTone(shownName)}">{initials(shownName)}</i>
          {/if}
        </div>

        <label class="file-label">
          <span>Pilih file</span>
          <input type="file" accept="image/*" onchange={onFileChange} />
        </label>

        {#if photoError}<p class="error">{photoError}</p>{/if}

        <div class="actions">
          {#if session?.avatar_url}
            <button type="button" class="ghost danger" onclick={onClearPhoto} disabled={busy}>Hapus foto</button>
          {/if}
          <button type="button" class="ghost" onclick={closePhoto}>Batal</button>
          <button type="submit" class="primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan foto'}</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if infoOpen}
  <div class="backdrop" role="presentation" onclick={closeInfo} onkeydown={onKeydown}>
    <div
      class="modal liquidGlass-wrapper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-info-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      <div class="liquidGlass-effect"></div>
      <div class="liquidGlass-tint"></div>
      <div class="liquidGlass-shine"></div>
      <form class="modal-body" onsubmit={onInfoSubmit}>
        <div class="modal-head">
          <div>
            <h2 id="edit-info-title">Edit Info</h2>
            <p>Perbarui nama dan username akun</p>
          </div>
          <button type="button" class="close" aria-label="Tutup" onclick={closeInfo}>×</button>
        </div>

        <label>
          <span>Nama tampilan</span>
          <input bind:value={displayName} placeholder="Nama yang tampil di header" />
        </label>

        <label>
          <span>Username</span>
          <input type="text" inputmode="numeric" pattern={'[0-9]{8}'} maxlength="8" bind:value={username} placeholder="10000001" />
        </label>

        {#if infoError}<p class="error">{infoError}</p>{/if}

        <div class="actions">
          <button type="button" class="ghost" onclick={closeInfo}>Batal</button>
          <button type="submit" class="primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan info'}</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if passwordOpen}
  <div class="backdrop" role="presentation" onclick={closePassword} onkeydown={onKeydown}>
    <div
      class="modal liquidGlass-wrapper"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={onKeydown}
    >
      <div class="liquidGlass-effect"></div>
      <div class="liquidGlass-tint"></div>
      <div class="liquidGlass-shine"></div>
      <form class="modal-body" onsubmit={onPasswordSubmit}>
        <div class="modal-head">
          <div>
            <h2 id="change-password-title">Ganti Password</h2>
            <p>Masukkan password saat ini, lalu password baru</p>
          </div>
          <button type="button" class="close" aria-label="Tutup" onclick={closePassword}>×</button>
        </div>

        <label>
          <span>Password saat ini</span>
          <input type="password" bind:value={currentPassword} placeholder="Password saat ini" />
        </label>

        <label>
          <span>Password baru</span>
          <input type="password" bind:value={newPassword} placeholder="Minimal 6 karakter" />
        </label>

        <label>
          <span>Konfirmasi password baru</span>
          <input type="password" bind:value={confirmPassword} placeholder="Ulangi password baru" />
        </label>

        {#if passwordError}<p class="error">{passwordError}</p>{/if}

        <div class="actions">
          <button type="button" class="ghost" onclick={closePassword}>Batal</button>
          <button type="submit" class="primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan password'}</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .page {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  :global(.page > .panel-glow.fill) {
    flex: 1;
    min-height: 0;
  }

  .grid {
    display: grid;
    gap: 12px;
    align-content: start;
    overflow: auto;
    min-height: 0;
    padding-right: 2px;
  }

  .card {
    padding: 16px 18px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.45);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  h3 {
    margin: 0;
    font-size: 0.76rem;
    font-weight: 750;
    color: #1a1a1a;
  }

  .card-top p {
    margin: 4px 0 0;
    font-size: 0.61rem;
    color: #8a8a90;
    line-height: 1.4;
  }

  .btn {
    height: 36px;
    padding: 0 0.95rem;
    border: none;
    border-radius: 999px;
    background: #1a1a1a;
    color: #fff;
    font: inherit;
    font-size: 0.61rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .btn:hover {
    background: #2a2a2a;
  }

  .photo-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .avatar {
    width: 72px;
    height: 72px;
    border-radius: 999px;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.85);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  }

  .face {
    display: inline-grid;
    place-items: center;
    font-weight: 700;
    font-style: normal;
  }

  .avatar.face { font-size: 1.1rem; }

  .face.rose { background: #f3d5da; color: #8a2f45; }
  .face.sky { background: #d5e8f8; color: #2f5f8a; }
  .face.soft { background: #ebe7f6; color: #4a3d8f; }
  .face.mint { background: #d8f0e4; color: #2f7a52; }
  .face.sand { background: #f3e6d4; color: #8a5a2f; }

  .photo-meta strong {
    display: block;
    font-size: 0.76rem;
    font-weight: 750;
  }

  .photo-meta small {
    display: block;
    margin-top: 2px;
    font-size: 0.61rem;
    color: #8a8a90;
    font-weight: 550;
  }

  .info-list {
    margin: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 16px;
  }

  .info-list .full {
    grid-column: 1 / -1;
  }

  .info-list dt {
    font-size: 0.54rem;
    font-weight: 650;
    color: #8a8a90;
    margin-bottom: 3px;
  }

  .info-list dd {
    margin: 0;
    font-size: 0.68rem;
    font-weight: 600;
    color: #1a1a1a;
    word-break: break-word;
  }

  .ok {
    margin: 12px 0 0;
    font-size: 0.61rem;
    font-weight: 650;
    color: #2f6b4a;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(20, 20, 22, 0.35);
    backdrop-filter: blur(6px);
  }

  .modal {
    width: min(480px, 100%);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  }

  .liquidGlass-wrapper {
    position: relative;
    display: flex;
    overflow: hidden;
    isolation: isolate;
  }

  .liquidGlass-effect {
    position: absolute;
    z-index: 0;
    inset: 0;
    background: rgba(255, 255, 255, 0.42);
    pointer-events: none;
  }

  .liquidGlass-tint {
    z-index: 1;
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.28);
    pointer-events: none;
  }

  .liquidGlass-shine {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    box-shadow:
      inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5),
      inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5);
  }

  .modal-body {
    position: relative;
    z-index: 3;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.55);
  }

  .modal-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .modal-head h2 {
    margin: 0;
    font-size: 0.86rem;
    font-weight: 750;
  }

  .modal-head p {
    margin: 4px 0 0;
    font-size: 0.61rem;
    color: #6b6b6b;
  }

  .close {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.06);
    color: #1a1a1a;
    font-size: 0.95rem;
    line-height: 1;
    cursor: pointer;
  }

  .modal-body label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .modal-body label span {
    font-size: 0.56rem;
    font-weight: 600;
    color: #6b6b6b;
  }

  .modal-body input,
  .modal-body textarea,
  .modal-body select {
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.8);
    border-radius: 12px;
    padding: 10px 12px;
    font: inherit;
    font-size: 0.68rem;
  }

  .preview-wrap {
    display: grid;
    place-items: center;
    padding: 8px 0;
  }

  .preview {
    width: 112px;
    height: 112px;
    border-radius: 999px;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .preview.face { font-size: 1.6rem; }

  .file-label input {
    padding: 8px;
  }

  .error {
    margin: 0;
    font-size: 0.59rem;
    color: #b42318;
    font-weight: 600;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }

  .ghost,
  .primary {
    border: none;
    border-radius: 999px;
    padding: 10px 16px;
    font: inherit;
    font-size: 0.65rem;
    font-weight: 650;
    cursor: pointer;
  }

  .ghost {
    background: transparent;
    color: #5a5a5a;
  }

  .ghost.danger {
    color: #b42318;
    margin-right: auto;
  }

  .primary {
    background: #1a1a1a;
    color: #fff;
  }

  .primary:disabled,
  .ghost:disabled {
    opacity: 0.6;
    cursor: default;
  }

  @media (max-width: 720px) {
    .info-list {
      grid-template-columns: 1fr;
    }

    .card-top {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
