<script>
  import { goto } from '$app/navigation'

  $effect(() => {
    goto('/tasks/list')
  })
</script>

<section class="page" aria-busy="true"></section>

<style>
  .page {
    flex: 1;
    min-height: 0;
  }
</style>

