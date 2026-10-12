<script>
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  onMount(() => {
    goto('/registry/list')
  })
</script>

<section class="page">
  <p>Mengalihkan…</p>
</section>

<style>
  .page {
    padding: 1.5rem;
    color: #64748b;
  }
</style>

