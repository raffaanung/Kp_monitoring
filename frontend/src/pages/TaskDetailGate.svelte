<script>
  import { push } from 'svelte-spa-router'

  $effect(() => {
    push('/tasks/list')
  })
</script>

<section class="page" aria-busy="true"></section>

<style>
  .page {
    flex: 1;
    min-height: 0;
  }
</style>
