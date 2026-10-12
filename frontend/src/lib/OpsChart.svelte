<script>
  import { fly } from 'svelte/transition'
  import ApexCharts from 'apexcharts'

  /** @type {{ type?: 'donut' | 'bar', labels?: string[], series?: number[], colors?: string[], horizontal?: boolean, unit?: string }} */
  let {
    type = 'donut',
    labels = [],
    series = [],
    colors = ['#1a1a1a', '#6b6b73', '#b8b8bf', '#d9c8f2', '#8bbfa0'],
    horizontal = false,
    unit = 'task',
  } = $props()

  /** @type {HTMLDivElement | undefined} */
  let el = $state()
  /** @type {HTMLDivElement | undefined} */
  let wrap = $state()
  /** @type {ApexCharts | undefined} */
  let chart
  /** Square side for donut so it stays centered in wide panels */
  let donutSize = $state(0)

  const total = $derived(series.reduce((a, b) => a + b, 0))

  const chartKey = $derived(
    `${type}|${horizontal ? 'h' : 'v'}|${unit}|${series.join(',')}|${labels.join(',')}|${colors.join(',')}`,
  )

  /** @param {'donut' | 'bar'} chartType */
  function buildOptions(chartType) {
    const size = chartType === 'donut' && donutSize > 0 ? donutSize : '100%'

    const base = {
      chart: {
        type: chartType,
        height: size,
        width: size,
        fontFamily: 'Plus Jakarta Sans, ui-sans-serif, sans-serif',
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 900,
          animateGradually: {
            enabled: true,
            delay: 120,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 800,
          },
        },
        parentHeightOffset: 0,
        redrawOnParentResize: chartType !== 'donut',
        redrawOnWindowResize: chartType !== 'donut',
      },
      colors: [...colors],
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: {
        enabled: true,
        fillSeriesColor: false,
        theme: 'light',
        style: {
          fontSize: '12px',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        },
        y: {
          formatter: (val) => `${val} ${unit}`,
        },
      },
    }

    if (chartType === 'donut') {
      return {
        ...base,
        series: [...series],
        labels: [...labels],
        plotOptions: {
          pie: {
            expandOnClick: false,
            startAngle: -120,
            endAngle: 240,
            donut: {
              size: '74%',
              labels: { show: false },
            },
          },
        },
        stroke: { width: 2, colors: ['rgba(255,255,255,0.7)'] },
        states: {
          hover: {
            filter: { type: 'lighten', value: 0.08 },
          },
          active: {
            allowMultipleDataPointsSelection: false,
            filter: { type: 'none', value: 0 },
          },
        },
      }
    }

    return {
      ...base,
      chart: {
        ...base.chart,
        height: '100%',
        width: '100%',
      },
      series: [{ name: unit === 'req' ? 'Requirement' : 'Task', data: [...series] }],
      dataLabels: {
        enabled: true,
        offsetY: -2,
        style: {
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          colors: ['#0f1b2e'],
        },
        formatter: (val) => `${val}`,
      },
      plotOptions: {
        bar: {
          horizontal,
          borderRadius: 6,
          columnWidth: labels.length > 5 ? '42%' : '48%',
          barHeight: '58%',
          distributed: true,
          dataLabels: {
            position: 'top',
          },
        },
      },
      xaxis: horizontal
        ? {
            categories: [...labels],
            min: 0,
            tickAmount: Math.min(4, Math.max(1, ...series.map((n) => Number(n) || 0))),
            decimalsInFloat: 0,
            labels: {
              formatter: (val) => {
                const n = Number(val)
                if (!Number.isFinite(n) || Math.abs(n - Math.round(n)) > 0.001) return ''
                return `${Math.round(n)}`
              },
              style: {
                colors: '#9a9aa0',
                fontSize: '11px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
          }
        : {
            categories: [...labels],
            labels: {
              style: {
                colors: '#9a9aa0',
                fontSize: '10px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 500,
              },
              rotate: labels.length > 4 ? -28 : 0,
              rotateAlways: labels.length > 4,
              hideOverlappingLabels: false,
              trim: false,
              maxHeight: 72,
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
          },
      yaxis: horizontal
        ? {
            labels: {
              maxWidth: 148,
              style: {
                colors: '#5c6570',
                fontSize: '11px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 600,
              },
            },
          }
        : {
            min: 0,
            forceNiceScale: true,
            decimalsInFloat: 0,
            labels: {
              formatter: (val) => `${Math.round(Number(val) || 0)}`,
              style: {
                colors: '#9a9aa0',
                fontSize: '11px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              },
            },
          },
      grid: {
        borderColor: 'rgba(0,0,0,0.07)',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        padding: { left: 4, right: 8, top: 18, bottom: 0 },
      },
    }
  }

  function measureDonut() {
    if (!wrap) return
    const { width, height } = wrap.getBoundingClientRect()
    if (width < 8 || height < 8) return
    // leave a little padding so stroke/shadow isn't clipped
    const next = Math.floor(Math.min(width, height) * 0.96)
    if (Math.abs(next - donutSize) >= 2) donutSize = next
  }

  function resizeBar() {
    const instance = chart
    if (!instance || type === 'donut') return
    try {
      instance.resize()
    } catch {
      /* ignore mid-destroy */
    }
  }

  $effect(() => {
    const node = el
    const key = chartKey
    const size = donutSize
    if (!node) return
    if (type === 'donut' && size <= 0) return
    void key

    const instance = new ApexCharts(node, buildOptions(type))
    chart = instance
    instance.render().then(() => {
      const canvases = node.querySelectorAll('.apexcharts-canvas')
      canvases.forEach((canvas, index) => {
        if (index < canvases.length - 1) canvas.remove()
      })
    })

    return () => {
      instance.destroy()
      if (chart === instance) chart = undefined
      node.innerHTML = ''
    }
  })

  $effect(() => {
    const host = wrap
    if (!host || typeof ResizeObserver === 'undefined') return

    measureDonut()

    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (type === 'donut') measureDonut()
        else resizeBar()
      })
    })
    ro.observe(host)

    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  })
</script>

<div class="ops-chart-wrap" class:donut={type === 'donut'} bind:this={wrap}>
  {#key chartKey}
    <div
      class="ops-chart"
      class:square={type === 'donut'}
      style={type === 'donut' && donutSize ? `width:${donutSize}px;height:${donutSize}px` : undefined}
      bind:this={el}
    ></div>
  {/key}
  {#if type === 'donut'}
    <div
      class="donut-center"
      style={donutSize ? `width:${donutSize}px;height:${donutSize}px` : undefined}
      aria-hidden="true"
    >
      {#key total}
        <strong in:fly={{ y: 8, duration: 320 }}>{total}</strong>
      {/key}
      <span>Total</span>
    </div>
  {/if}
</div>

<style>
  .ops-chart-wrap {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    display: grid;
    place-items: center;
  }

  .ops-chart {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  .ops-chart.square {
    flex-shrink: 0;
  }

  .ops-chart-wrap.donut {
    overflow: hidden;
  }

  .ops-chart-wrap.donut .ops-chart {
    animation: donut-spin-in 0.85s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @keyframes donut-spin-in {
    0% {
      opacity: 0;
      transform: rotate(-140deg) scale(0.72);
    }
    55% {
      opacity: 1;
      transform: rotate(8deg) scale(1.03);
    }
    100% {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }
  }

  .donut-center {
    position: absolute;
    inset: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    pointer-events: none;
    z-index: 1;
  }

  .donut-center strong {
    display: block;
    font-size: 1.65rem;
    font-weight: 750;
    letter-spacing: -0.04em;
    line-height: 0.95;
    color: #0b1524;
  }

  .donut-center span {
    font-size: 0.56rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    line-height: 1;
    color: #7a8699;
  }

  .ops-chart :global(.apexcharts-tooltip) {
    border-radius: 12px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
    border: 1px solid rgba(0, 0, 0, 0.06) !important;
  }

  .ops-chart :global(.apexcharts-canvas),
  .ops-chart :global(svg) {
    max-width: 100% !important;
    max-height: 100% !important;
  }
</style>
