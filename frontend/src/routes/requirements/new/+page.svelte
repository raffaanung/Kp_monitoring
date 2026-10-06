<script>
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  onMount(() => {
    goto('/requirements/list')
  })
</script>

<section class="page">
  <p>Mengalihkan ke Daftar Requirementâ€¦</p>
</section>

<style>
  .page {
    padding: 1.5rem;
    color: #64748b;
  }
</style>

