<script>
  /**
   * Kartu dua lapis: bingkai luar dan panel putih di dalamnya.
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
    padding: 6px;
    border-radius: 26px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.72) 100%);
    border: 1px solid rgba(255, 255, 255, 0.95);
    box-shadow:
      0 10px 28px rgba(15, 27, 46, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  .panel-glow.fill {
    flex: 1;
  }

  .panel-glow.fill .panel {
    overflow: hidden;
  }

  .panel {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 18px 20px;
    border-radius: 20px;
    background: #fff;
    border: 1px solid rgba(15, 27, 46, 0.04);
    box-shadow: 0 1px 2px rgba(15, 27, 46, 0.04);
    color: #1a1a1a;
  }
</style>
