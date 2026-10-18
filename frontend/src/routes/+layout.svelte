<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page, navigating } from '$app/state';
  import '../app.css';
  import Layout from '$lib/Layout.svelte';
  import LoadingScreen from '$lib/LoadingScreen.svelte';
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

{#if navigating.current}
  <div class="top-loader" aria-hidden="true">
    <div class="top-loader-bar"></div>
  </div>
{/if}

{#if authStore.loading}
  <LoadingScreen />
{:else}
  <Layout>
    {@render children?.()}
  </Layout>
{/if}

<style>
  .top-loader {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    z-index: 99999;
    background: transparent;
    pointer-events: none;
  }

  .top-loader-bar {
    height: 100%;
    background: linear-gradient(90deg, #2563eb, #38bdf8);
    box-shadow: 0 0 10px rgba(37, 99, 235, 0.7);
    animation: top-bar-anim 1.2s ease-in-out infinite;
  }

  @keyframes top-bar-anim {
    0% {
      width: 0%;
      margin-left: 0%;
    }
    50% {
      width: 70%;
      margin-left: 15%;
    }
    100% {
      width: 100%;
      margin-left: 100%;
    }
  }
</style>
