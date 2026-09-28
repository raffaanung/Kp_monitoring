<script>
  import { onMount, onDestroy } from 'svelte'
  import ApexCharts from 'apexcharts'

  /** @type {{ selesai?: number[], masuk?: number[], months?: string[] }} */
  let {
    selesai = [12, 18, 15, 22, 28, 24, 30, 26, 34, 31, 36, 40],
    masuk = [16, 14, 20, 18, 22, 19, 25, 23, 28, 27, 30, 32],
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  } = $props()

  /** @type {HTMLDivElement | undefined} */
  let el
  /** @type {ApexCharts | undefined} */
  let chart

  onMount(() => {
    if (!el) return

    chart = new ApexCharts(el, {
      chart: {
        type: 'area',
        height: '100%',
        width: '100%',
        fontFamily: 'Plus Jakarta Sans, ui-sans-serif, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: {
          enabled: true,
          speed: 650,
        },
      },
      series: [
        { name: 'Selesai', data: selesai },
        { name: 'Masuk', data: masuk },
      ],
      colors: ['#1a1a1a', '#9a9aa0'],
      stroke: {
        curve: 'smooth',
        width: [3, 2.5],
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.22,
          opacityTo: 0.02,
          stops: [0, 90, 100],
        },
      },
      dataLabels: { enabled: false },
      markers: {
        size: 0,
        hover: { size: 5 },
      },
      grid: {
        borderColor: 'rgba(0,0,0,0.08)',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 8, right: 8, top: 8, bottom: 0 },
      },
      xaxis: {
        categories: months,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: '#9a9aa0',
            fontSize: '11px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 500,
          },
        },
        tooltip: { enabled: false },
      },
      yaxis: {
        min: 0,
        max: 50,
        tickAmount: 5,
        labels: {
          style: {
            colors: '#9a9aa0',
            fontSize: '11px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          },
        },
      },
      legend: { show: false },
      tooltip: {
        shared: true,
        intersect: false,
        style: {
          fontSize: '12px',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        },
        y: {
          formatter: (val) => `${val} task`,
        },
      },
    })

    chart.render()
  })

  onDestroy(() => {
    chart?.destroy()
  })
</script>

<div class="apex-wrap" bind:this={el}></div>

<style>
  .apex-wrap {
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .apex-wrap :global(.apexcharts-tooltip) {
    border-radius: 12px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
    border: 1px solid rgba(0, 0, 0, 0.06) !important;
  }

  .apex-wrap :global(.apexcharts-canvas) {
    margin: 0 auto;
  }
</style>
