<script>
  import { link, push } from 'svelte-spa-router'
  import GlassPanel from '../lib/GlassPanel.svelte'
  import SubmenuHeader from '../lib/SubmenuHeader.svelte'
  import { getDashboard, registryStore } from '../lib/registryStore.svelte.js'

  const target = $derived.by(() => {
    void registryStore.items
    const id = registryStore.lastDetailId
    if (!id) return null
    return getDashboard(id)
  })

  let redirected = $state(false)

  $effect(() => {
    if (redirected || !target) return
    redirected = true
    push(`/registry/${target.id}`)
  })
</script>

<section class="page">
  <GlassPanel>
    <SubmenuHeader
      eyebrow="Dashboard Registry"
      title="Dashboard Detail"
      sub="Pilih dashboard dari daftar untuk melihat requirements dan activity log"
    />

    {#if !target}
      <div class="empty">
        <p>Belum ada dashboard yang dibuka. Buka salah satu dari Daftar Dashboard terlebih dahulu.</p>
        <a class="btn" href="/registry/list" use:link>Ke Daftar Dashboard</a>
      </div>
    {/if}
  </GlassPanel>
</section>

<style>
  .page {
    min-height: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .empty {
    margin-top: 1rem;
    padding: 1.25rem 1.35rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(0, 0, 0, 0.06);
    display: grid;
    gap: 0.85rem;
    justify-items: start;
  }

  .empty p {
    margin: 0;
    font-size: 0.72rem;
    color: #64748b;
    line-height: 1.45;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    height: 2.35rem;
    padding: 0 1rem;
    border-radius: 999px;
    background: #1a1a1a;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    text-decoration: none;
  }
</style>
