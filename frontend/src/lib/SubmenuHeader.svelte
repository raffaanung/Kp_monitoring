<script>
  /**
   * Standard header for non-home submenus (Task, Registry, …).
   * @type {{
   *   eyebrow?: string,
   *   title: string,
   *   sub?: string,
   *   meta?: string,
   *   actions?: import('svelte').Snippet,
   * }}
   */
  let { eyebrow = '', title, sub = '', meta = '', actions } = $props()
</script>

<div class="submenu-head">
  <div class="left">
    {#if eyebrow}
      <span class="eyebrow">{eyebrow}</span>
    {/if}
    <div class="title-row">
      <h2>{title}</h2>
      {#if meta}
        <span class="meta">{meta}</span>
      {/if}
    </div>
    {#if sub}
      <p class="sub">{sub}</p>
    {/if}
  </div>

  {#if actions}
    <div class="actions">
      {@render actions()}
    </div>
  {/if}
</div>

<style>
  .submenu-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px 20px;
    flex-wrap: wrap;
    min-height: 38px;
  }

  .left {
    min-width: 0;
    display: grid;
    gap: 4px;
  }

  .eyebrow {
    font-size: 0.54rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8e8e93;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  h2 {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 750;
    letter-spacing: -0.02em;
    line-height: 1.2;
    color: #1a1a1a;
  }

  .meta {
    display: inline-flex;
    align-items: center;
    height: 1.55rem;
    padding: 0 0.65rem;
    border-radius: 999px;
    font-size: 0.56rem;
    font-weight: 750;
    background: rgba(26, 26, 26, 0.08);
    color: #1a1a1a;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sub {
    margin: 0;
    font-size: 0.61rem;
    font-weight: 500;
    color: #8a8a90;
    line-height: 1.35;
    max-width: 48ch;
  }

  .actions {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    flex-wrap: wrap;
    margin-left: auto;
  }

  /* Shared control look for consumers */
  :global(.submenu-head .actions .ctrl) {
    display: grid;
    gap: 4px;
    align-content: end;
  }

  :global(.submenu-head .actions .ctrl > span) {
    font-size: 0.52rem;
    font-weight: 650;
    color: #8a8a90;
    line-height: 1;
    min-height: 0.85rem;
  }

  :global(.submenu-head .actions select.ctrl-input),
  :global(.submenu-head .actions .ctrl-input) {
    height: 34px;
    min-width: 152px;
    box-sizing: border-box;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 999px;
    padding: 0 0.85rem;
    background: rgba(255, 255, 255, 0.82);
    font: inherit;
    font-size: 0.65rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  :global(.submenu-head .actions .btn-primary) {
    height: 34px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 999px;
    padding: 0 1rem;
    background: #1a1a1a;
    color: #fff;
    font: inherit;
    font-size: 0.65rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    text-decoration: none;
  }

  :global(.submenu-head .actions .btn-primary:hover) {
    background: #2a2a2a;
  }

  :global(.submenu-head .actions .btn-ghost) {
    height: 34px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 999px;
    padding: 0 0.9rem;
    background: rgba(255, 255, 255, 0.75);
    color: #3a3a40;
    font: inherit;
    font-size: 0.65rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    text-decoration: none;
  }

  :global(.submenu-head .actions .btn-ghost:hover) {
    border-color: rgba(0, 0, 0, 0.18);
  }
</style>
