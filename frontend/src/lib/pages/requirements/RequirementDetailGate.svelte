<script>
  import { goto } from '$app/navigation'

  // Legacy route: submenu Requirement Detail dihapus â€” arahkan ke daftar.
  $effect(() => {
    goto('/registry/list')
  })
</script>

<section class="page" aria-busy="true"></section>

<style>
  .page {
    flex: 1;
    min-height: 0;
  }
</style>

