<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import '../app.css';
  import Layout from '$lib/Layout.svelte';
  import { authStore, initAuth } from '$lib/authStore.svelte.js';
  import { loadAppData, startAutoRefresh, stopAutoRefresh } from '$lib/loadAppData.js';

  let { children } = $props();

  onMount(async () => {
    await initAuth();
    if (authStore.user) {
      loadAppData();
      startAutoRefresh();
    }
    return stopAutoRefresh;
  });

  $effect(() => {
    if (authStore.loading) return;
    const isLoginPage = page.url.pathname === '/login';
    if (!authStore.user && !isLoginPage) {
      stopAutoRefresh();
      goto('/login');
    }
  });
</script>

{#if !authStore.loading}
  <Layout>
    {@render children?.()}
  </Layout>
{/if}
