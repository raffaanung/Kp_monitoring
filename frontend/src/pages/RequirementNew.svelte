<script>
  import { push } from 'svelte-spa-router'
  import { onMount } from 'svelte'

  onMount(() => {
    push('/requirements/list')
  })
</script>

<section class="page">
  <p>Mengalihkan ke Daftar Requirement…</p>
</section>

<style>
  .page {
    padding: 1.5rem;
    color: #64748b;
  }
</style>
