<script>
  import Beranda from '$lib/pages/Beranda.svelte'
</script>

<div class="home">
  <Beranda />
</div>

<style>
  .home {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .home :global(.beranda) {
    flex: 1;
    min-height: 0;
  }
</style>
