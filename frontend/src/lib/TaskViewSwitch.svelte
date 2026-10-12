<script>
  import { goto } from '$app/navigation'
  import { setBoardTab } from './taskModuleStore.svelte.js'

  /** @type {{ active: 'kanban' | 'list' | 'inbox', alertCount?: number, inboxCount?: number, embedded?: boolean, onList?: () => void, onBoard?: () => void, children?: import('svelte').Snippet }} */
  let { active, alertCount = 0, inboxCount = 0, embedded = false, onList = () => {}, onBoard = () => {}, children } = $props()

  /** @param {'kanban' | 'list' | 'inbox'} tab */
  function open(tab) {
    if (tab === active) return
    if (tab === 'list') {
      if (embedded) onList()
      else goto('/tasks/list')
      return
    }
    setBoardTab(tab)
    if (!embedded) goto('/tasks/board')
    else if (active === 'list') onBoard()
  }
</script>

<div class="tabs" role="tablist" aria-label="Task view">
  <button type="button" role="tab" class="tab" class:on={active === 'kanban'} aria-selected={active === 'kanban'} onclick={() => open('kanban')}>
    Kanban
  </button>
  <button type="button" role="tab" class="tab" class:on={active === 'inbox'} aria-selected={active === 'inbox'} onclick={() => open('inbox')}>
    Status approval
    {#if alertCount > 0}
      <span class="tab-alert">{alertCount}</span>
    {:else if inboxCount > 0}
      <span class="tab-count">{inboxCount}</span>
    {/if}
  </button>
  {#if children}
    {@render children()}
  {/if}
</div>

<style>
  .tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .tab {
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.7);
    border-radius: 999px;
    padding: 5px 12px;
    font: inherit;
    font-size: 0.61rem;
    font-weight: 650;
    color: #4a6080;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .tab.on {
    background: #0f1b2e;
    border-color: #0f1b2e;
    color: #fff;
  }

  .tab-count {
    font-size: 0.54rem;
    font-weight: 750;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    background: rgba(50, 140, 230, 0.18);
    color: inherit;
  }

  .tab.on .tab-count {
    background: rgba(255, 255, 255, 0.2);
  }

  .tab-alert {
    font-size: 0.52rem;
    font-weight: 750;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: #e11d48;
    color: #fff;
    display: grid;
    place-items: center;
  }

  .tabs :global(.tab-hint) {
    margin: 0 0 0 auto;
    font-size: 0.56rem;
    color: #8a9bb0;
    font-weight: 550;
  }
</style>
