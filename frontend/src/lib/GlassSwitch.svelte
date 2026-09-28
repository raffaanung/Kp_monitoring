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
    const buttons = /** @type {HTMLElement[]} */ ([...root.querySelectorAll('.base button')])
    const on = buttons.find((b) => b.classList.contains('on'))
    if (!on) return
    const pad = cssNum('--pad')
    const k = cssNum('--k') || 1
    const lensW = on.offsetWidth + 6
    root.style.setProperty('--lensW', `${lensW}px`)
    const last = buttons[buttons.length - 1]
    root.style.width = `${pad * 2 + last.offsetLeft + last.offsetWidth}px`
    const items = root.querySelectorAll('.mag .item')
    buttons.forEach((b, i) => {
      const item = /** @type {HTMLElement | undefined} */ (items[i])
      if (item) item.style.width = `${b.offsetWidth}px`
    })
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
      const buttons = /** @type {HTMLElement[]} */ ([...el.querySelectorAll('.base button')])
      if (!buttons.length) return 0
      for (let i = 0; i < buttons.length; i++) {
        const r = buttons[i].getBoundingClientRect()
        if (clientX <= r.right) return i
      }
      return buttons.length - 1
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
    --itemW: auto;
    --barH: 36px;
    --lensH: 46px;
    --lensW: 120px;
    --lensR: 999px;
    --k: 1;
    --spring: cubic-bezier(0.22, 1, 0.36, 1);

    position: relative;
    display: block;
    width: max-content;
    height: var(--barH);
    overflow: visible;
    max-width: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -webkit-user-select: none;
    user-select: none;
    touch-action: none;
  }

  .lb.compact {
    --pad: 3px;
    --barH: 26px;
    --lensH: 32px;
  }

  .lb.compact .base button {
    padding: 0 10px;
    font-size: 0.56rem;
  }

  .lb.compact .item {
    font-size: 0.56rem;
  }

  .track {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background: rgba(232, 233, 238, 0.62);
    -webkit-backdrop-filter: blur(16px) saturate(160%);
    backdrop-filter: blur(16px) saturate(160%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.72),
      inset 0 -1px 2px rgba(20, 30, 60, 0.05);
  }

  .row-items {
    position: absolute;
    left: var(--pad);
    top: 0;
    height: var(--barH);
    display: flex;
  }

  .base button {
    width: auto;
    height: 100%;
    padding: 0 16px;
    border: 0;
    background: none;
    color: #8a8a90;
    font: inherit;
    font-size: 0.68rem;
    font-weight: 600;
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
    background:
      radial-gradient(130% 90% at 18% -8%, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0) 52%),
      linear-gradient(185deg, rgba(255, 255, 255, 0.58), rgba(228, 234, 248, 0.42) 58%, rgba(206, 216, 240, 0.5));
    -webkit-backdrop-filter: blur(18px) saturate(220%) brightness(1.08);
    backdrop-filter: blur(18px) saturate(220%) brightness(1.08);
    box-shadow:
      inset 0 1.5px 0 rgba(255, 255, 255, 0.95),
      inset 0 -8px 12px rgba(40, 60, 120, 0.08),
      0 0 0 0.5px rgba(255, 255, 255, 0.65),
      0 12px 24px rgba(20, 28, 55, 0.16),
      0 2px 6px rgba(20, 28, 55, 0.08);
  }

  .lens::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(90% 70% at 22% 0%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0) 58%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 46%);
  }

  .lens::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: radial-gradient(55% 110% at 108% 50%, rgba(160, 180, 255, 0.38), transparent 62%);
  }

  .lb.ready .lens,
  .lb.ready .mag {
    transition:
      transform 0.38s var(--spring),
      width 0.38s var(--spring);
  }

  .lb.pressed .lens {
    --ls: 1;
  }

  /* salinan isi bar yang diperbesar, dipotong mengikuti bentuk lensa */
  .mag {
    left: 0;
    top: 50%;
    z-index: 1;
    width: max-content;
    transform-origin: 0 50%;
    transform: translate(var(--tx, 0px), -50%) scale(var(--k));
  }

  .item {
    width: auto;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8a8a90;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: -0.08px;
  }

  .item.on {
    color: #111;
    font-weight: 750;
  }

  .band {
    position: absolute;
    left: 12%;
    right: 12%;
    height: 22%;
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(var(--bd), rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0));
  }

  .band.t {
    top: 1px;
    --bd: 180deg;
    border-radius: 0 0 48% 48% / 0 0 100% 100%;
  }

  .band.b {
    display: none;
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
