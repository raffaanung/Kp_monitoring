<script>
  import { push } from 'svelte-spa-router'

  // Legacy route: submenu Requirement Detail dihapus — arahkan ke daftar.
  $effect(() => {
    push('/requirements/list')
  })
</script>

<section class="page" aria-busy="true"></section>

<style>
  .page {
    flex: 1;
    min-height: 0;
  }
</style>
