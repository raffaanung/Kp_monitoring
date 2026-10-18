<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import GlassPanel from '$lib/GlassPanel.svelte';

  onMount(() => {
    if (
      page.url.pathname.startsWith('/tasks/board') ||
      page.url.pathname.startsWith('/tasks/list') ||
      page.url.pathname === '/tasks'
    ) {
      goto('/registry/list', { replaceState: true });
    }
  });
</script>

<div class="err-page">
  <GlassPanel>
    <div class="err-box">
      <h2>Halaman Tidak Ditemukan</h2>
      <p>Halaman yang Anda tuju telah dipindahkan ke menu Workspaces.</p>
      <a href="/registry/list" class="btn-go">Buka Workspaces</a>
    </div>
  </GlassPanel>
</div>

<style>
  .err-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    padding: 2rem;
  }
  .err-box {
    text-align: center;
    padding: 2.5rem 2rem;
  }
  .err-box h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }
  .err-box p {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 1.5rem;
  }
  .btn-go {
    display: inline-block;
    padding: 8px 18px;
    background: #2563eb;
    color: #fff;
    font-size: 0.82rem;
    font-weight: 600;
    border-radius: 999px;
    text-decoration: none;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  }
</style>
