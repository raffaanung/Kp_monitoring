<script>
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  onMount(() => {
    goto('/access/users', { replaceState: true })
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
