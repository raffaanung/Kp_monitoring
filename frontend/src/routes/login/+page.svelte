<script>
  import { fade } from 'svelte/transition'
  import { goto } from '$app/navigation'
  import logoWhite from '$lib/assets/edm-logo-white.png'
  import { login } from '$lib/authStore.svelte.js'
  import { loadAppData, startAutoRefresh } from '$lib/loadAppData.js'

  let username = $state('')
  let password = $state('')
  let remember = $state(true)
  let showPassword = $state(false)
  let focused = $state(/** @type {string|null} */ (null))
  let error = $state('')
  let submitting = $state(false)

  async function handleLogin(e) {
    e.preventDefault()
    error = ''
    submitting = true
    try {
      await login(username.trim(), password)
      loadAppData()
      startAutoRefresh()
      goto('/')
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    } finally {
      submitting = false
    }
  }
</script>

<div class="login-wrapper" in:fade={{ duration: 250 }}>
  <!-- ── Left Brand Card ── -->
  <aside class="brand-card" aria-label="EDM Task Monitoring">
    <div class="glow-bg" aria-hidden="true"></div>
    <div class="glow-spot-1" aria-hidden="true"></div>
    <div class="glow-spot-2" aria-hidden="true"></div>

    <!-- Header: Logo + System Online -->
    <div class="brand-top">
      <div class="brand-logo">
        <img src={logoWhite} alt="EDM Task Monitoring" class="brand-logo-img" />
      </div>

      <div class="system-status">
        <span class="status-dot" aria-hidden="true"></span>
        <span class="status-label">System online</span>
      </div>
    </div>

    <!-- Center: Main Hero Slogan -->
    <div class="brand-hero">
      <h1 class="hero-title">
        <span class="hero-line">Manage tasks.</span>
        <span class="gradient-text">Boost productivity.</span>
      </h1>
      <p class="hero-desc">
        Track, manage, and achieve your team's goals in one integrated, real-time platform.
      </p>
    </div>

    <!-- Footer: Copyright & Features -->
    <div class="brand-footer">
      <span class="copyright">© {new Date().getFullYear()} EDM Task Monitor</span>
      <div class="footer-tags">
        <span>Real-time</span>
        <span>Analytics</span>
        <span>Integrated</span>
      </div>
    </div>
  </aside>

  <!-- ── Right Form Area ── -->
  <main class="form-area">
    <div class="form-box">
      <header class="form-header">
        <span class="tagline">TASK MONITORING DASHBOARD</span>
        <h2 class="welcome-heading">Welcome back</h2>
        <p class="welcome-sub">Sign in to your EDM Task Monitoring account to continue.</p>
      </header>

      <form class="auth-form" onsubmit={handleLogin} novalidate>
        <!-- Username Field -->
        <div class="input-group" class:is-focused={focused === 'username'}>
          <label for="username">Username</label>
          <div class="input-container">
            <span class="field-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              </svg>
            </span>
            <input
              id="username"
              type="text"
              placeholder="10000001"
              autocomplete="username"
              bind:value={username}
              onfocus={() => (focused = 'username')}
              onblur={() => (focused = null)}
            />
          </div>
        </div>

        <!-- Password Field -->
        <div class="input-group" class:is-focused={focused === 'password'}>
          <div class="label-row">
            <label for="password">Password</label>
            <button type="button" class="forgot-btn" onclick={() => alert('Silakan hubungi administrator untuk mereset password.')}>
              Forgot password?
            </button>
          </div>
          <div class="input-container">
            <span class="field-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autocomplete="current-password"
              bind:value={password}
              onfocus={() => (focused = 'password')}
              onblur={() => (focused = null)}
            />
            <button
              type="button"
              class="toggle-eye"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onclick={() => (showPassword = !showPassword)}
              tabindex="-1"
            >
              {#if showPassword}
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              {:else}
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              {/if}
            </button>
          </div>
        </div>

        <!-- Remember me -->
        <div class="checkbox-row">
          <label class="remember-label">
            <input type="checkbox" bind:checked={remember} class="checkbox-input" />
            <span>Remember me</span>
          </label>
        </div>

        {#if error}
          <div class="alert-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        {/if}

        <!-- Submit Button -->
        <button type="submit" class="submit-btn" disabled={submitting}>
          {#if submitting}
            <span class="btn-spinner" aria-hidden="true"></span>
            <span>Signing in…</span>
          {:else}
            <span>Sign in</span>
          {/if}
        </button>
      </form>

      <!-- Admin Help Box -->
      <div class="support-card">
        <span class="info-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </span>
        <p class="support-text">
          Don't have access? Contact your system administrator for account assistance.
        </p>
      </div>
    </div>
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #ffffff;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .login-wrapper {
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    min-height: 100vh;
    box-sizing: border-box;
    padding: 16px;
    background: #ffffff;
    gap: 16px;
  }

  /* ── Left Dark Card ── */
  .brand-card {
    position: relative;
    border-radius: 28px;
    padding: 40px 48px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    color: #ffffff;
    box-sizing: border-box;
    background: #090a14;
    min-height: calc(100vh - 32px);
  }

  .glow-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 65% 55% at 95% 45%, rgba(139, 92, 246, 0.22), transparent 70%),
      radial-gradient(ellipse 60% 60% at 10% 90%, rgba(59, 130, 246, 0.12), transparent 70%),
      linear-gradient(150deg, #080911 0%, #0c0e1b 45%, #141026 80%, #1a102f 100%);
    pointer-events: none;
    z-index: 0;
  }

  .glow-spot-1 {
    position: absolute;
    top: 25%;
    right: -60px;
    width: 280px;
    height: 380px;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.18), transparent 70%);
    pointer-events: none;
    z-index: 0;
    filter: blur(20px);
  }

  .glow-spot-2 {
    position: absolute;
    bottom: -40px;
    left: 20%;
    width: 300px;
    height: 200px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.08), transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .brand-top,
  .brand-hero,
  .brand-footer {
    position: relative;
    z-index: 1;
  }

  /* Logo */
  .brand-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .brand-logo {
    display: flex;
    align-items: center;
  }

  .brand-logo-img {
    display: block;
    height: 38px;
    width: auto;
    max-width: 170px;
    object-fit: contain;
    image-rendering: -webkit-optimize-contrast;
  }

  /* System Online Badge */
  .system-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(10px);
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
  }

  .status-label {
    font-size: 0.74rem;
    font-weight: 500;
    color: #cbd5e1;
    letter-spacing: 0.01em;
  }

  /* Hero Content */
  .brand-hero {
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: none;
    width: 100%;
    margin: 40px 0;
  }

  .hero-title {
    margin: 0;
    font-size: clamp(2.4rem, 4.4vw, 3.6rem);
    font-weight: 800;
    line-height: 1.12;
    letter-spacing: -0.04em;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .hero-line {
    white-space: nowrap;
  }

  .gradient-text {
    white-space: nowrap;
    background: linear-gradient(90deg, #38bdf8 0%, #60a5fa 32%, #a855f7 72%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero-desc {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 450;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.62);
    max-width: 460px;
  }

  /* Brand Footer */
  .brand-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.42);
    padding-top: 10px;
  }

  .copyright {
    letter-spacing: 0.01em;
  }

  .footer-tags {
    display: flex;
    align-items: center;
    gap: 20px;
    font-weight: 450;
  }

  /* ── Right Form Area ── */
  .form-area {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 48px;
    background: #ffffff;
    box-sizing: border-box;
  }

  .form-box {
    width: 100%;
    max-width: 410px;
    display: flex;
    flex-direction: column;
  }

  .form-header {
    margin-bottom: 26px;
  }

  .tagline {
    display: block;
    color: #2563eb;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .welcome-heading {
    margin: 0 0 8px 0;
    font-size: 2.15rem;
    font-weight: 780;
    letter-spacing: -0.035em;
    color: #0f172a;
    line-height: 1.15;
  }

  .welcome-sub {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 450;
    color: #64748b;
    line-height: 1.45;
  }

  /* Auth Form */
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .input-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #1e293b;
  }

  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .forgot-btn {
    border: none;
    background: none;
    padding: 0;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    color: #2563eb;
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .forgot-btn:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }

  .input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .field-icon {
    position: absolute;
    left: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    pointer-events: none;
    transition: color 0.15s ease;
  }

  .input-container input {
    width: 100%;
    height: 48px;
    padding: 0 42px 0 42px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    background: #ffffff;
    color: #0f172a;
    font-family: inherit;
    font-size: 0.92rem;
    font-weight: 450;
    outline: none;
    box-sizing: border-box;
    transition: all 0.2s ease;
  }

  .input-container input::placeholder {
    color: #94a3b8;
    font-weight: 400;
  }

  .input-group.is-focused .input-container input {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }

  .input-group.is-focused .field-icon {
    color: #2563eb;
  }

  .toggle-eye {
    position: absolute;
    right: 10px;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease;
  }

  .toggle-eye:hover {
    color: #475569;
    background: #f1f5f9;
  }

  /* Checkbox */
  .checkbox-row {
    display: flex;
    align-items: center;
    margin-top: -2px;
  }

  .remember-label {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    font-size: 0.86rem;
    font-weight: 500;
    color: #334155;
    cursor: pointer;
    user-select: none;
  }

  .checkbox-input {
    width: 17px;
    height: 17px;
    border-radius: 4px;
    accent-color: #2563eb;
    cursor: pointer;
  }

  /* Alert Error */
  .alert-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 10px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    font-size: 0.82rem;
    font-weight: 550;
  }

  .alert-error svg {
    flex-shrink: 0;
  }

  /* Submit button */
  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 48px;
    border: none;
    border-radius: 12px;
    background: #1d4ed8;
    color: #ffffff;
    font-family: inherit;
    font-size: 0.94rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 18px -2px rgba(29, 78, 216, 0.38);
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: btn-spin 0.6s linear infinite;
    display: inline-block;
    flex-shrink: 0;
  }

  @keyframes btn-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .submit-btn:hover:not(:disabled) {
    background: #1e40af;
    transform: translateY(-1px);
    box-shadow: 0 10px 22px -3px rgba(29, 78, 216, 0.44);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }

  /* Support Card */
  .support-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 24px;
    padding: 14px 18px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    box-sizing: border-box;
  }

  .info-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .support-text {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 450;
    line-height: 1.45;
    color: #64748b;
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .login-wrapper {
      grid-template-columns: 1fr;
      padding: 12px;
    }

    .brand-card {
      min-height: auto;
      padding: 32px 24px;
    }

    .brand-hero {
      margin: 32px 0;
    }

    .hero-title {
      font-size: 2.3rem;
    }

    .form-area {
      padding: 24px 16px;
    }
  }
</style>
