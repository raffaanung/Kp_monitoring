<script>
  import GlassPanel from '$lib/GlassPanel.svelte'
  import SubmenuHeader from '$lib/SubmenuHeader.svelte'
  import {
    currentProfile,
    updateProfile,
    updateAvatar,
    clearAvatar,
    settingsStore,
  } from '$lib/settingsStore.svelte.js'
  import { taskModuleStore } from '$lib/taskModuleStore.svelte.js'
  import avatarFallback from '$lib/assets/avatar-farras.jpg'

  let photoOpen = $state(false)
  let infoOpen = $state(false)

  let photoPreview = $state('')
  let photoError = $state('')
  let infoError = $state('')
  let infoOk = $state('')

  let displayName = $state('')
  let email = $state('')
  let phone = $state('')
  let unit = $state('')
  let bio = $state('')

  const profile = $derived.by(() => {
    void settingsStore.byPersona
    void taskModuleStore.session
    return currentProfile()
  })

  const session = $derived.by(() => {
    void taskModuleStore.session
    return taskModuleStore.session
  })

  const avatarSrc = $derived(profile.avatarDataUrl || avatarFallback)
  const shownName = $derived(profile.displayName?.trim() || session.name)

  function openPhoto() {
    photoPreview = profile.avatarDataUrl || ''
    photoError = ''
    photoOpen = true
  }

  function closePhoto() {
    photoOpen = false
    photoPreview = ''
    photoError = ''
  }

  function openInfo() {
    displayName = profile.displayName || session.name
    email = profile.email
    phone = profile.phone
    unit = profile.unit
    bio = profile.bio
    infoError = ''
    infoOk = ''
    infoOpen = true
  }

  function closeInfo() {
    infoOpen = false
  }

  function closeAll() {
    closePhoto()
    closeInfo()
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
    const reader = new FileReader()
    reader.onload = () => {
      photoPreview = String(reader.result || '')
    }
    reader.onerror = () => {
      photoError = 'Gagal membaca file'
    }
    reader.readAsDataURL(file)
  }

  /** @param {Event} e */
  function onPhotoSubmit(e) {
    e.preventDefault()
    photoError = ''
    if (!photoPreview) {
      photoError = 'Pilih foto terlebih dahulu'
      return
    }
    const res = updateAvatar(photoPreview)
    if (!res.ok) {
      photoError = res.error
      return
    }
    closePhoto()
  }

  function onClearPhoto() {
    clearAvatar()
    photoPreview = ''
    closePhoto()
  }

  /** @param {Event} e */
  function onInfoSubmit(e) {
    e.preventDefault()
    infoError = ''
    infoOk = ''
    const res = updateProfile({ displayName, email, phone, unit, bio })
    if (!res.ok) {
      infoError = res.error
      return
    }
    infoOk = 'Profil disimpan'
    infoOpen = false
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
          <img class="avatar" src={avatarSrc} alt="" />
          <div class="photo-meta">
            <strong>{shownName}</strong>
            <small>{session.label} Â· {session.role}</small>
          </div>
        </div>
      </article>

      <article class="card">
        <div class="card-top">
          <div>
            <h3>Edit Info</h3>
            <p>Nama tampilan, kontak, dan unit</p>
          </div>
          <button type="button" class="btn" onclick={openInfo}>Edit info</button>
        </div>
        <dl class="info-list">
          <div>
            <dt>Nama tampilan</dt>
            <dd>{shownName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{profile.email || 'â€”'}</dd>
          </div>
          <div>
            <dt>Telepon</dt>
            <dd>{profile.phone || 'â€”'}</dd>
          </div>
          <div>
            <dt>Unit</dt>
            <dd>{profile.unit || 'â€”'}</dd>
          </div>
          <div class="full">
            <dt>Bio</dt>
            <dd>{profile.bio || 'â€”'}</dd>
          </div>
        </dl>
        {#if infoOk}<p class="ok">{infoOk}</p>{/if}
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
          <button type="button" class="close" aria-label="Tutup" onclick={closePhoto}>Ã—</button>
        </div>

        <div class="preview-wrap">
          <img class="preview" src={photoPreview || avatarSrc} alt="" />
        </div>

        <label class="file-label">
          <span>Pilih file</span>
          <input type="file" accept="image/*" onchange={onFileChange} />
        </label>

        {#if photoError}<p class="error">{photoError}</p>{/if}

        <div class="actions">
          {#if profile.avatarDataUrl}
            <button type="button" class="ghost danger" onclick={onClearPhoto}>Hapus foto</button>
          {/if}
          <button type="button" class="ghost" onclick={closePhoto}>Batal</button>
          <button type="submit" class="primary">Simpan foto</button>
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
            <p>Perbarui data profil yang ditampilkan di aplikasi</p>
          </div>
          <button type="button" class="close" aria-label="Tutup" onclick={closeInfo}>Ã—</button>
        </div>

        <label>
          <span>Nama tampilan</span>
          <input bind:value={displayName} placeholder="Nama yang tampil di header" />
        </label>

        <label>
          <span>Email</span>
          <input type="email" bind:value={email} placeholder="nama@edm.local" />
        </label>

        <div class="row">
          <label>
            <span>Telepon</span>
            <input bind:value={phone} placeholder="08â€¦" />
          </label>
          <label>
            <span>Unit</span>
            <input bind:value={unit} placeholder="EDM Core" />
          </label>
        </div>

        <label>
          <span>Bio</span>
          <textarea bind:value={bio} rows="3" placeholder="Singkat tentang peran Andaâ€¦"></textarea>
        </label>

        {#if infoError}<p class="error">{infoError}</p>{/if}

        <div class="actions">
          <button type="button" class="ghost" onclick={closeInfo}>Batal</button>
          <button type="submit" class="primary">Simpan info</button>
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

  .modal-body textarea {
    resize: vertical;
    min-height: 72px;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
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

  @media (max-width: 720px) {
    .info-list {
      grid-template-columns: 1fr;
    }

    .row {
      grid-template-columns: 1fr;
    }

    .card-top {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>

