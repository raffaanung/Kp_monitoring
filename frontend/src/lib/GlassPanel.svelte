<script>
  /**
   * Segmented control dengan lensa kaca yang membesarkan opsi aktif.
   * @type {{
   *   options: { id: string, label: string }[],
   *   value: string,
   *   onchange: (id: string) => void,
   *   label?: string,
   *   class?: string,
   * }}
   */
  let { options, value, onchange, label = '', class: className = '' } = $props()

  let root = $state(/** @type {HTMLElement | null} */ (null))
  let lx = $state(0)
  let tx = $state(0)
  let ready = $state(false)
  let pressed = $state(false)

  /** @param {string} name */
  function cssNum(name) {
    return parseFloat(getComputedStyle(/** @type {HTMLElement} */ (root)).getPropertyValue(name))
  }

  function measure() {
    if (!root) return
    const on = /** @type {HTMLElement | null} */ (root.querySelector('.base button.on'))
    if (!on) return
    const pad = cssNum('--pad')
    const lensW = cssNum('--lensW')
    const k = cssNum('--k')
    const cx = pad + on.offsetLeft + on.offsetWidth / 2
    lx = cx - lensW / 2
    tx = k * (pad - cx) + lensW / 2
  }

  $effect(() => {
    void value
    const id = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(id)
  })

  $effect(() => {
    if (!root) return
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    document.fonts?.ready.then(measure)
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      measure()
      raf2 = requestAnimationFrame(() => (ready = true))
    })
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  })

  $effect(() => {
    if (!root) return
    const el = root

    /** @param {number} clientX */
    function indexAt(clientX) {
      const r = el.getBoundingClientRect()
      const i = Math.floor((clientX - r.left - cssNum('--pad')) / cssNum('--itemW'))
      return Math.max(0, Math.min(options.length - 1, i))
    }

    /** @param {number} clientX */
    function select(clientX) {
      const opt = options[indexAt(clientX)]
      if (opt && opt.id !== value) onchange(opt.id)
    }

    // Opsi dipilih saat ditekan/digeser: dengan pointer capture, event click tidak sampai ke tombol.
    /** @param {PointerEvent} e */
    const down = (e) => {
      pressed = true
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* pointer sudah tidak aktif */
      }
      select(e.clientX)
    }
    /** @param {PointerEvent} e */
    const move = (e) => {
      if (pressed) select(e.clientX)
    }
    const up = () => (pressed = false)

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  })
</script>

<div
  class="lb {className}"
  class:ready
  class:pressed
  role="tablist"
  aria-label={label}
  style:--n={options.length}
  bind:this={root}
>
  <div class="track"></div>

  <div class="row-items base">
    {#each options as opt (opt.id)}
      <button
        type="button"
        role="tab"
        class:on={value === opt.id}
        aria-selected={value === opt.id}
        onclick={() => onchange(opt.id)}
      >
        {opt.label}
      </button>
    {/each}
  </div>

  <div class="lens" aria-hidden="true" style:--lx="{lx}px">
    <div class="row-items mag" style:--tx="{tx}px">
      {#each options as opt (opt.id)}
        <span class="item" class:on={value === opt.id}>{opt.label}</span>
      {/each}
    </div>
    <i class="band t"></i>
    <i class="band b"></i>
    <i class="rim"></i>
  </div>
</div>

<style>
  .lb {
    --pad: 4px;
    --itemW: 90px;
    --barH: 40px;
    --lensH: 40px;
    --lensW: 94px;
    --lensR: 20px;
    --k: 1.04;
    --spring: cubic-bezier(0.34, 1.3, 0.5, 1);

    position: relative;
    display: block;
    width: calc(var(--n) * var(--itemW) + 2 * var(--pad));
    height: var(--barH);
    max-width: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -webkit-user-select: none;
    user-select: none;
    touch-action: none;
  }

  @supports (transition-timing-function: linear(0, 1)) {
    .lb {
      --spring: linear(
        0, 0.1356, 0.3947, 0.6431, 0.8284, 0.9443, 1.0046, 1.0281, 1.031, 1.0249, 1.0165, 1.0092,
        1.0041, 1.001, 0.9995, 0.999, 0.9991, 0.9993, 0.9996, 0.9998, 0.9999, 1
      );
    }
  }

  .track {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: rgba(60, 68, 96, 0.03);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    backdrop-filter: blur(20px) saturate(180%);
    box-shadow:
      inset 0 2px 5px rgba(20, 30, 60, 0.03),
      inset 0 0 0 0.5px rgba(20, 30, 60, 0.04),
      0 0 0 0.5px rgba(255, 255, 255, 0.6);
  }

  .row-items {
    position: absolute;
    left: var(--pad);
    top: 0;
    height: var(--barH);
    display: flex;
  }

  .base button {
    width: var(--itemW);
    height: 100%;
    padding: 0;
    border: 0;
    background: none;
    color: #4a4a52;
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: -0.08px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      color 0.2s ease,
      opacity 0.15s ease;
  }

  .base button.on {
    opacity: 0;
    transition: opacity 0.2s ease 0.12s;
  }

  .base button:focus-visible {
    outline: 2px solid rgba(0, 122, 255, 0.65);
    outline-offset: -2px;
    border-radius: 999px;
  }

  .lens {
    position: absolute;
    top: calc((var(--barH) - var(--lensH)) / 2);
    left: 0;
    width: var(--lensW);
    height: var(--lensH);
    border-radius: var(--lensR);
    overflow: hidden;
    pointer-events: none;
    transform: translateX(var(--lx, 0px)) scale(var(--ls, 1));
    will-change: transform;
    -webkit-backdrop-filter: blur(16px) saturate(240%) brightness(1.1) contrast(1.02);
    backdrop-filter: blur(16px) saturate(240%) brightness(1.1) contrast(1.02);
    box-shadow:
      0 1px 1px rgba(255, 255, 255, 0.9),
      0 0 0 1px rgba(20, 30, 60, 0.16),
      0 6px 14px rgba(10, 20, 55, 0.2),
      0 2px 5px rgba(10, 20, 55, 0.16);
  }

  .lens::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    background:
      radial-gradient(140% 140% at 18% -10%, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0) 55%),
      linear-gradient(200deg, rgba(255, 255, 255, 0.72), rgba(233, 238, 255, 0.5) 55%, rgba(210, 220, 255, 0.42));
  }

  .lens::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    opacity: 0.5;
    background: radial-gradient(60% 90% at 108% 50%, rgba(160, 180, 255, 0.4), transparent 60%);
  }

  .lb.ready .lens,
  .lb.ready .mag {
    transition: transform 0.5s var(--spring);
  }

  .lb.pressed .lens {
    --ls: 1.04;
  }

  /* salinan isi bar yang diperbesar, dipotong mengikuti bentuk lensa */
  .mag {
    left: 0;
    top: 50%;
    z-index: 1;
    width: calc(var(--n) * var(--itemW));
    transform-origin: 0 50%;
    transform: translate(var(--tx, 0px), -50%) scale(var(--k));
  }

  .item {
    width: var(--itemW);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4a4a52;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: -0.08px;
  }

  .item.on {
    color: #000;
    font-weight: 600;
  }

  .band {
    position: absolute;
    left: 9%;
    right: 9%;
    height: 21%;
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(var(--bd), rgba(190, 205, 235, 0.35), rgba(190, 205, 235, 0));
  }

  .band.t {
    top: 2px;
    --bd: 180deg;
    border-radius: 0 0 48% 48% / 0 0 100% 100%;
  }

  .band.b {
    bottom: 2px;
    --bd: 0deg;
    border-radius: 48% 48% 0 0 / 100% 100% 0 0;
  }

  .rim {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    z-index: 3;
    pointer-events: none;
    box-shadow:
      inset 0 1.5px 0 rgba(255, 255, 255, 0.95),
      inset 0 0 0 1px rgba(255, 255, 255, 0.5),
      inset -1px -2px 4px rgba(20, 30, 80, 0.12),
      inset 0 -6px 8px rgba(20, 30, 80, 0.06);
  }

  @media (prefers-reduced-motion: reduce) {
    .lb.ready .lens,
    .lb.ready .mag {
      transition: none;
    }
  }
</style>
