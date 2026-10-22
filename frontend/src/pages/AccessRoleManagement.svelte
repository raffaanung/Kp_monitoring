<script>
  import { onMount } from 'svelte'
  import { replace } from 'svelte-spa-router'

  onMount(() => {
    replace('/access/users')
  })
</script>

<div class="redirect-wrap">
  <p>Redirecting to User List…</p>
</div>

<style>
  .redirect-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: #64748b;
    font-size: 0.85rem;
  }
</style>
