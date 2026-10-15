<script>
  import { fade, fly } from 'svelte/transition'
  import { goto } from '$app/navigation'
  import logoFull from '$lib/assets/edm-logo.png'
  import logoLight from '$lib/assets/edm-logo-white.png'
  import { login } from '$lib/authStore.svelte.js'
  import { loadAppData, startAutoRefresh } from '$lib/loadAppData.js'

  const FEATURES = [
    { label: 'Real-time', color: '#7c8cf8' },
    { label: 'Analytics', color: '#34d399' },
    { label: 'Integrated', color: '#f59e0b' },
  ]

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

<div class="login-page" in:fade={{ duration: 320 }}>
  <div class="login-frame" in:fly={{ y: 18, duration: 420 }}>
    <!-- ── Left brand panel ── -->
    <aside class="brand-panel" aria-label="EDM Task Monitoring">
      <div class="brand-glow" aria-hidden="true"></div>
      <div class="brand-glow-2" aria-hidden="true"></div>
      <div class="brand-glow-3" aria-hidden="true"></div>
      <div class="brand-edge-line" aria-hidden="true"></div>
      <div class="brand-watermark" aria-hidden="true">
        <img src={logoLight} alt="" />
      </div>
      <div class="brand-ring" aria-hidden="true"></div>
      <div class="brand-diamond" aria-hidden="true"></div>

      <div class="brand-top"></div>

      <div class="brand-copy">
        <span class="live-badge">
          <span class="live-dot" aria-hidden="true"></span>
          Operation Monitoring <span class="dot-sep">•</span> Live
        </span>
        <h1 class="brand-title">Manage Tasks,<br />Raise Productivity</h1>
        <p class="brand-sub">
          Track, manage, and hit your team targets on one integrated
          platform, in real time.
        </p>

        <div class="brand-tags" role="list">
          {#each FEATURES as f}
            <span class="feature-pill" role="listitem">
              <span class="feature-dot" style="background:{f.color}" aria-hidden="true"></span>
              {f.label}
            </span>
          {/each}
        </div>
      </div>

      <footer class="brand-foot">
        <span class="foot-icon">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="9" cy="8.5" r="2.6" stroke="currentColor" stroke-width="1.6" />
            <path
              d="M4.5 18c.6-2.6 2.3-4 4.5-4s3.9 1.4 4.5 4M15 9.2c1.5.2 2.6 1.1 3 3.3"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span class="foot-icon">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 12h3.5l2-5 4 10 2-7 1.5 2H21"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="foot-text">COPYRIGHT EDM TASK MONITOR &ndash; {new Date().getFullYear()}</span>
        <span class="foot-line" aria-hidden="true"></span>
      </footer>
    </aside>

    <!-- ── Right form panel ── -->
    <section class="form-panel">
      <div class="form-inner">
        <header class="form-head">
          <img src={logoFull} alt="EDM Task Monitoring" class="form-logo" />
          <h2 class="form-title">Selamat datang kembali</h2>
          <p class="form-sub">Sign in to your EDM Task Monitoring account</p>
        </header>

        <span class="dash-tag">
          <span class="dash-dot" aria-hidden="true"></span>
          Task Monitoring Dashboard
        </span>

        <form class="form" onsubmit={handleLogin} novalidate>
          <div class="field" class:on={focused === 'username'}>
            <label for="username">Username</label>
            <div class="input-shell">
              <span class="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8.5" r="3.2" stroke="currentColor" stroke-width="1.7" />
                  <path
                    d="M6.5 19.5c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              <input
                id="username"
                type="text"
                inputmode="numeric"
                pattern={'[0-9]{8}'}
                maxlength="8"
                placeholder="10000001"
                autocomplete="username"
                bind:value={username}
                onfocus={() => {
                  focused = 'username'
                }}
                onblur={() => {
                  focused = null
                }}
              />
            </div>
          </div>

          <div class="field" class:on={focused === 'password'}>
            <label for="password">Password</label>
            <div class="input-shell">
              <span class="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2.2" stroke="currentColor" stroke-width="1.7" />
                  <path
                    d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autocomplete="current-password"
                bind:value={password}
                onfocus={() => {
                  focused = 'password'
                }}
                onblur={() => {
                  focused = null
                }}
              />
              <button
                type="button"
                class="eye"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onclick={() => {
                  showPassword = !showPassword
                }}
                tabindex="-1"
              >
                {#if showPassword}
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 12s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6Z"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linejoin="round"
                    />
                    <circle cx="12" cy="12" r="2.2" stroke="currentColor" stroke-width="1.7" />
                  </svg>
                {:else}
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5.4 0-9-6-9-6a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c5.4 0 9 6 9 6a18.5 18.5 0 0 1-2.16 3.19M3 3l18 18"
                      stroke="currentColor"
                      stroke-width="1.7"
                      stroke-linecap="round"
                    />
                  </svg>
                {/if}
              </button>
            </div>
          </div>

          <div class="form-row">
            <label class="check">
              <input type="checkbox" bind:checked={remember} />
              <span>Remember me</span>
            </label>
            <button type="button" class="link-quiet">Forgot password?</button>
          </div>

          {#if error}
            <p class="form-error" role="alert">{error}</p>
          {/if}

          <button type="submit" class="btn-primary" disabled={submitting}>
            {submitting ? 'Checking…' : 'Sign in'}
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </form>

        <div class="divider"><span>EDM</span></div>

        <p class="form-foot">
          Task Monitoring System <br />Hubungi admin untuk bantuan akses.
        </p>
      </div>
    </section>
  </div>
</div>

<style>
  .login-page {
    min-height: 100vh;
    display: grid;
    box-sizing: border-box;
    font-family: 'Plus Jakarta Sans', ui-sans-serif, sans-serif;
    color: #1a1a1a;
  }

  .login-frame {
    display: grid;
    grid-template-columns: 1.05fr 1fr;
    width: 100%;
    min-height: 100vh;
    overflow: hidden;
    background: #fff;
  }

  /* ── Brand panel ── */
  .brand-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 28px;
    padding: 32px 30px 28px;
    overflow: hidden;
    color: #fff;
    background:
      radial-gradient(ellipse 70% 60% at 12% 90%, rgba(88, 40, 160, 0.28), transparent 55%),
      linear-gradient(160deg, #12142a 0%, #0b0d1e 55%, #05060f 100%);
  }

  .brand-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 58%;
    aspect-ratio: 1.03;
    transform: translate(-50%, -50%);
    overflow: hidden;
    opacity: 0.05;
    pointer-events: none;
    z-index: 0;
    -webkit-mask-image: radial-gradient(ellipse 75% 75% at 40% 45%, #000 55%, transparent 90%);
    mask-image: radial-gradient(ellipse 75% 75% at 40% 45%, #000 55%, transparent 90%);
  }

  .brand-watermark img {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: auto;
    max-width: none;
  }

  .brand-glow {
    position: absolute;
    width: 280px;
    height: 280px;
    top: -60px;
    right: -40px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(124, 58, 237, 0.18), transparent 68%);
    pointer-events: none;
    animation: drift 16s ease-in-out infinite alternate;
  }

  .brand-glow-2 {
    position: absolute;
    width: 220px;
    height: 220px;
    bottom: 10%;
    left: -50px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 70%);
    pointer-events: none;
    animation: drift 20s ease-in-out infinite alternate-reverse;
  }

  .brand-glow-3 {
    position: absolute;
    width: 240px;
    height: 340px;
    right: -90px;
    top: 26%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(217, 70, 239, 0.4), transparent 72%);
    filter: blur(6px);
    pointer-events: none;
  }

  .brand-edge-line {
    position: absolute;
    right: 0;
    top: 14%;
    bottom: 30%;
    width: 1px;
    background: linear-gradient(180deg, transparent, rgba(217, 70, 239, 0.55), rgba(129, 140, 248, 0.35), transparent);
    pointer-events: none;
  }

  @keyframes drift {
    from {
      transform: translate(0, 0);
    }
    to {
      transform: translate(18px, 12px);
    }
  }

  .brand-ring {
    position: absolute;
    width: 460px;
    height: 460px;
    right: -160px;
    bottom: -170px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.06);
    pointer-events: none;
  }

  .brand-diamond {
    position: absolute;
    width: 320px;
    height: 320px;
    right: -80px;
    bottom: -120px;
    border-radius: 64px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    transform: rotate(20deg);
    pointer-events: none;
  }

  .brand-top,
  .brand-copy,
  .brand-foot {
    position: relative;
    z-index: 1;
  }

  .live-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 650;
    letter-spacing: 0.01em;
    color: rgba(255, 255, 255, 0.95);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(8px);
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #34d399;
    box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.25);
    animation: pulse 1.8s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  .dot-sep {
    color: rgba(255, 255, 255, 0.4);
  }

  .brand-copy {
    display: flex;
    flex-direction: column;
    gap: 22px;
    max-width: 560px;
    margin-left: clamp(20px, 9vw, 100px);
  }

  .brand-copy .live-badge {
    margin-bottom: -8px;
  }

  .brand-title {
    margin: 0;
    font-size: clamp(2.4rem, 4.4vw, 3.6rem);
    font-weight: 780;
    letter-spacing: -0.04em;
    line-height: 1.1;
  }

  .brand-sub {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 500;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.66);
    max-width: 500px;
  }

  .brand-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .feature-pill {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 0.74rem;
    font-weight: 650;
    color: rgba(255, 255, 255, 0.85);
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .feature-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .brand-foot {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .foot-icon {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.75);
    flex-shrink: 0;
  }

  .foot-icon svg {
    width: 13px;
    height: 13px;
  }

  .foot-text {
    font-size: 0.68rem;
    font-weight: 650;
    letter-spacing: 0.03em;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
  }

  .foot-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.18), transparent);
  }

  /* ── Form panel ── */
  .form-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 36px 40px;
    background: #f4f5f7;
  }

  .form-inner {
    width: 100%;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-head {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }

  .form-logo {
    height: 36px;
    width: auto;
    object-fit: contain;
    margin-bottom: 6px;
  }

  .form-title {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 760;
    letter-spacing: -0.03em;
    color: #1a1a1a;
  }

  .form-sub {
    margin: 0;
    font-size: 0.84rem;
    font-weight: 500;
    color: #8e8e93;
    line-height: 1.4;
  }

  .dash-tag {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    width: fit-content;
    margin: 2px auto 0;
    font-size: 0.68rem;
    font-weight: 750;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #4a4a4e;
  }

  .dash-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #1a1a1a;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field label {
    font-size: 0.76rem;
    font-weight: 700;
    color: #5a5a5e;
  }

  .field.on label {
    color: #1a1a1a;
  }

  .input-shell {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 13px;
    width: 16px;
    height: 16px;
    color: #aeaeb2;
    pointer-events: none;
    display: grid;
    place-items: center;
    z-index: 1;
  }

  .input-icon svg {
    width: 15px;
    height: 15px;
  }

  .field.on .input-icon {
    color: #5a5a5e;
  }

  .input-shell input {
    width: 100%;
    height: 48px;
    padding: 0 42px 0 40px;
    border: 1px solid #ececef;
    border-radius: 12px;
    background: #fff;
    color: #1a1a1a;
    font-size: 0.9rem;
    font-weight: 500;
    outline: none;
    font-family: inherit;
    transition:
      background 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .input-shell input::placeholder {
    color: #b0b0b5;
    font-weight: 450;
  }

  .field.on .input-shell input {
    background: #fff;
    border-color: rgba(26, 26, 26, 0.18);
    box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.06);
  }

  .eye {
    position: absolute;
    right: 8px;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #aeaeb2;
    cursor: pointer;
    padding: 0;
  }

  .eye:hover {
    color: #3a3a3a;
    background: rgba(0, 0, 0, 0.05);
  }

  .eye svg {
    width: 16px;
    height: 16px;
  }

  .form-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: -2px;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #5a5a5e;
    cursor: pointer;
    user-select: none;
  }

  .check input {
    width: 15px;
    height: 15px;
    accent-color: #1a1a1a;
    cursor: pointer;
  }

  .link-quiet {
    border: none;
    background: none;
    padding: 0;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 650;
    color: #6b6b6b;
    cursor: pointer;
  }

  .link-quiet:hover:not(:disabled) {
    color: #1a1a1a;
  }

  .link-quiet:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .form-error {
    margin: -4px 0 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #b91c1c;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .btn-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 48px;
    margin-top: 2px;
    border: none;
    border-radius: 12px;
    background: #1a1a1a;
    color: #fff;
    font-size: 0.92rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
    transition:
      background 0.2s ease,
      transform 0.15s ease,
      box-shadow 0.2s ease,
      opacity 0.2s ease;
  }

  .btn-primary svg {
    width: 17px;
    height: 17px;
  }

  .btn-primary:not(:disabled):hover {
    background: #2c2c2c;
    transform: translateY(-1px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
  }

  .btn-primary:not(:disabled):active {
    transform: translateY(0);
  }

  .btn-primary:disabled {
    opacity: 0.42;
    cursor: not-allowed;
    box-shadow: none;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #aeaeb2;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e2e6;
  }

  .form-foot {
    margin: 0;
    text-align: center;
    font-size: 0.7rem;
    font-weight: 500;
    line-height: 1.5;
    color: #a8a8ad;
  }

  /* ── Responsive ── */
  @media (max-width: 860px) {
    .login-frame {
      grid-template-columns: 1fr;
      min-height: 100vh;
    }

    .brand-panel {
      min-height: 280px;
      padding: 24px 22px 20px;
      gap: 20px;
    }

    .brand-copy {
      margin-left: 0;
      max-width: none;
    }

    .brand-title {
      font-size: 2.2rem;
    }

    .brand-sub {
      font-size: 1rem;
    }

    .brand-tags {
      display: none;
    }

    .form-panel {
      padding: 28px 22px 24px;
    }
  }
</style>
