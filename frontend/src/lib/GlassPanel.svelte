<script>
  /**
   * Kartu satu layer untuk isi halaman submenu.
   * @type {{ children?: import('svelte').Snippet, class?: string }}
   */
  let { children, class: className = '' } = $props()
</script>

<div class="panel-glow {className}">
  <article class="panel">
    {#if children}
      {@render children()}
    {/if}
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
    padding: 18px 20px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow:
      0 4px 18px rgba(0, 0, 0, 0.04),
      0 1px 3px rgba(0, 0, 0, 0.03);
    color: #1a1a1a;
  }
</style>
