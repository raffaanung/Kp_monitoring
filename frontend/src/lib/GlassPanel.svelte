<script>
  /**
   * Kartu kaca untuk isi halaman submenu.
   * @type {{ children?: import('svelte').Snippet, class?: string }}
   */
  let { children, class: className = '' } = $props()
</script>

<div class="panel-glow {className}">
  <article class="panel liquidGlass-wrapper">
    <div class="liquidGlass-effect"></div>
    <div class="liquidGlass-tint"></div>
    <div class="liquidGlass-shine"></div>
    <div class="panel-card">
      {#if children}
        {@render children()}
      {/if}
    </div>
  </article>
</div>

<style>
  .panel-glow {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .panel-glow.fill {
    flex: 1;
  }

  .panel {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 10px;
    border-radius: 32px;
    overflow: hidden;
    isolation: isolate;
    color: #1a1a1a;
    background: transparent;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
  }

  .liquidGlass-effect {
    position: absolute;
    z-index: 0;
    inset: 0;
    border-radius: inherit;
    backdrop-filter: blur(10px) saturate(1.05);
    -webkit-backdrop-filter: blur(10px) saturate(1.05);
    background: rgba(255, 255, 255, 0.28);
    overflow: hidden;
    pointer-events: none;
  }

  .liquidGlass-tint {
    z-index: 1;
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(255, 255, 255, 0.28);
    pointer-events: none;
  }

  .liquidGlass-shine {
    position: absolute;
    inset: 0;
    z-index: 2;
    border-radius: inherit;
    overflow: hidden;
    pointer-events: none;
    box-shadow:
      inset 1px 1px 0 rgba(255, 255, 255, 0.55),
      inset -1px -1px 0 rgba(255, 255, 255, 0.28);
  }

  .panel-card {
    position: relative;
    z-index: 3;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.78);
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow:
      inset 2px 2px 1px 0 rgba(255, 255, 255, 0.45),
      inset -1px -1px 1px 1px rgba(255, 255, 255, 0.3);
    padding: 14px 16px;
  }
</style>
