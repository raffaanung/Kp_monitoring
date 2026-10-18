<script>
  import { fade } from "svelte/transition";

  /**
   * @type {{
   *   message?: string,
   *   submessage?: string,
   *   fullscreen?: boolean
   * }}
   */
  let {
    message = "Memuat sistem…",
    submessage = "EDM Task Monitoring",
    fullscreen = true,
  } = $props();
</script>

<div
  class="loader-container"
  class:fullscreen
  in:fade={{ duration: 160 }}
  out:fade={{ duration: 220 }}
  role="status"
  aria-live="polite"
  aria-label={message}
>
  <div class="loader-content">
    <!-- Ambient Blue Glow -->
    <div class="loader-glow" aria-hidden="true"></div>

    <!-- Modern Minimalist Circular Spinner -->
    <div class="spinner-wrapper" aria-hidden="true">
      <svg class="circular-spinner" viewBox="0 0 50 50">
        <!-- Faint Track -->
        <circle
          class="spinner-track"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke-width="3.5"
        />
        <!-- Animated Blue Arc -->
        <circle
          class="spinner-arc"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke-width="3.5"
          stroke-linecap="round"
        />
      </svg>
      <!-- Center Pulsing Dot -->
      <div class="center-dot"></div>
    </div>

    <!-- Text & Minimal Progress Track -->
    <div class="loader-info">
      {#if submessage}
        <span class="brand-caption">{submessage}</span>
      {/if}
      <span class="status-text">{message}</span>
      <div class="linear-track" aria-hidden="true">
        <div class="linear-indicator"></div>
      </div>
    </div>
  </div>
</div>

<style>
  .loader-container {
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 24px;
    z-index: 9999;
  }

  .loader-container.fullscreen {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(
      circle at 50% 45%,
      #ffffff 0%,
      #f8fafc 70%,
      #f1f5f9 100%
    );
    backdrop-filter: blur(8px);
  }

  .loader-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 32px 42px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(226, 232, 240, 0.9);
    box-shadow:
      0 20px 45px -15px rgba(37, 99, 235, 0.12),
      0 0 1px 1px rgba(226, 232, 240, 0.6);
  }

  /* Ambient Glow */
  .loader-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 200px;
    background: radial-gradient(
      circle,
      rgba(37, 99, 235, 0.16) 0%,
      rgba(56, 189, 248, 0.08) 50%,
      transparent 70%
    );
    filter: blur(28px);
    pointer-events: none;
    z-index: 0;
    animation: glow-pulse 2.4s ease-in-out infinite alternate;
  }

  @keyframes glow-pulse {
    0% {
      opacity: 0.6;
      transform: translate(-50%, -50%) scale(0.9);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.15);
    }
  }

  /* Spinner Wrapper */
  .spinner-wrapper {
    position: relative;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .circular-spinner {
    width: 100%;
    height: 100%;
    animation: rotate-spinner 1.8s linear infinite;
    transform-origin: center center;
  }

  .spinner-track {
    stroke: rgba(37, 99, 235, 0.1);
  }

  .spinner-arc {
    stroke: #041f5a;
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
    animation: dash-arc 1.5s ease-in-out infinite;
    filter: drop-shadow(0 2px 6px rgba(37, 99, 235, 0.4));
  }

  .center-dot {
    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #2563eb;
    box-shadow: 0 0 10px rgba(37, 99, 235, 0.85);
    animation: dot-pulse 1.5s ease-in-out infinite alternate;
  }

  @keyframes rotate-spinner {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash-arc {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }

  @keyframes dot-pulse {
    0% {
      transform: scale(0.85);
      opacity: 0.7;
    }
    100% {
      transform: scale(1.2);
      opacity: 1;
    }
  }

  /* Text & Linear Indicator */
  .loader-info {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
  }

  .brand-caption {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #2563eb;
  }

  .status-text {
    font-size: 0.88rem;
    font-weight: 550;
    color: #334155;
    letter-spacing: -0.01em;
  }

  .linear-track {
    width: 130px;
    height: 3px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
    position: relative;
    margin-top: 4px;
  }

  .linear-indicator {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    background: linear-gradient(90deg, #2563eb 0%, #38bdf8 100%);
    border-radius: 999px;
    box-shadow: 0 0 8px rgba(37, 99, 235, 0.5);
    animation: linear-slide 1.4s ease-in-out infinite;
  }

  @keyframes linear-slide {
    0% {
      left: -40%;
      width: 40%;
    }
    50% {
      left: 30%;
      width: 60%;
    }
    100% {
      left: 100%;
      width: 40%;
    }
  }
</style>
