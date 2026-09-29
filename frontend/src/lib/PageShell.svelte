<script>
  import { router } from 'svelte-spa-router'

  /**
   * Shell animasi antar page (svelte-spa-router).
   * @type {{
   *   Page: import('svelte').Component<any>,
   *   params?: Record<string, string>,
   *   [key: string]: unknown,
   * }}
   */
  let { Page, params = {}, ...rest } = $props()

  /** router.loc reactive; router.location sering tidak. */
  const animKey = $derived(
    `${router.loc?.location ?? '/'}::${params?.id ?? params?.first ?? ''}`,
  )
</script>

{#key animKey}
  <div class="page-shell">
    <Page {params} {...rest} />
  </div>
{/key}

<style>
  .page-shell {
    flex: 1;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    animation: page-enter 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes page-enter {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .page-shell {
      animation: none;
    }
  }
</style>
