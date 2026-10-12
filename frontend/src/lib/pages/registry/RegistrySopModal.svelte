<script>
  let { selectedSopItem = $bindable() } = $props();

  function downloadSopPdf() {
    if (!selectedSopItem) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>SOP - ${selectedSopItem.name}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
            h3 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            h4 { color: #0f172a; margin-top: 20px; }
            .meta { margin-bottom: 20px; }
            .meta p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h3>SOP - ${selectedSopItem.name}</h3>
          <div class="meta">
            <p><strong>Platform:</strong> ${selectedSopItem.platform}</p>
            <p><strong>Kategori:</strong> ${selectedSopItem.category}</p>
            <p><strong>Owner (PIC):</strong> ${selectedSopItem.owner}</p>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
</script>

{#if selectedSopItem}
  <div class="sop-modal-backdrop" onclick={() => (selectedSopItem = null)}>
    <div class="sop-modal-content" onclick={(e) => e.stopPropagation()}>
      <div class="sop-modal-header">
        <h3>SOP - {selectedSopItem.name}</h3>
        <button class="close-btn" onclick={() => (selectedSopItem = null)}>×</button>
      </div>
      <div class="sop-modal-body">
        <p><strong>Platform:</strong> {selectedSopItem.platform}</p>
        <p><strong>Kategori:</strong> {selectedSopItem.category}</p>
        <p><strong>Owner (PIC):</strong> {selectedSopItem.owner}</p>
      </div>
      <div class="sop-modal-footer" style="gap: 10px;">
        <button class="sop-btn download-btn" onclick={downloadSopPdf}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Download PDF
        </button>
        <button class="sop-btn" onclick={() => (selectedSopItem = null)}>Close SOP</button>
      </div>
    </div>
  </div>
{/if}
