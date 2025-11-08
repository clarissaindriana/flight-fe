<template>
  <div class="home-view">
    <section class="stats-cards">
      <div class="card">
        <div class="card-title">Active Flights Today</div>
        <div class="card-value">{{ activeFlightsToday }}</div>
        <div class="card-sub">Status: Scheduled or In Flight</div>
      </div>
      <div class="card">
        <div class="card-title">Bookings Created Today</div>
        <div class="card-value">{{ bookingsToday }}</div>
        <div class="card-sub">All statuses</div>
      </div>
      <div class="card">
        <div class="card-title">Registered Airlines</div>
        <div class="card-value">{{ airlinesCount }}</div>
        <div class="card-sub">Total airlines</div>
      </div>
    </section>

    <section class="chart-section">
      <div class="section-header">
        <h2>Booking Statistics per Period</h2>
        <p>Bar chart shows potential revenue per Flight (Paid + Unpaid)</p>
      </div>

      <div class="filters">
        <label class="filter">
          <span>Start Date</span>
          <input type="date" v-model="startDate" @change="reloadStats" />
        </label>
        <label class="filter">
          <span>End Date</span>
          <input type="date" v-model="endDate" @change="reloadStats" />
        </label>
        <button class="refresh-btn" @click="reloadAll" :disabled="loading">
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <div class="chart-wrapper">
        <canvas ref="chartRef" height="140"></canvas>
      </div>

      <div v-if="error" class="error">
        {{ error }}
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { bookingService } from '@/services/booking.service'
import { flightService } from '@/services/flight.service'
import { airlineService } from '@/services/airline.service'
import type { Booking } from '@/interfaces/booking.interface'
import type { Flight } from '@/interfaces/flight.interface'
import type { Airline } from '@/interfaces/airline.interface'

const loading = ref(false)
const error = ref<string | null>(null)

const activeFlightsToday = ref(0)
const bookingsToday = ref(0)
const airlinesCount = ref(0)

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: any = null

// Default range: last 7 days to today
const toISODate = (d: Date) => d.toISOString().slice(0, 10)
const today = new Date()
const last7 = new Date()
last7.setDate(today.getDate() - 6)
const startDate = ref(toISODate(last7))
const endDate = ref(toISODate(today))

function isSameLocalDate(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

async function ensureChartJs(): Promise<any> {
  const w = window as any
  if (w.Chart) return w.Chart
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Chart.js'))
    document.head.appendChild(s)
  })
  return (window as any).Chart
}

async function loadCounts() {
  // Flights
  const flights: Flight[] = await flightService.getAllFlights({ includeDeleted: false })
  const todayDate = new Date()
  activeFlightsToday.value = flights.filter(f => {
    if (f.isDeleted) return false
    const status = Number(f.status)
    if (!(status === 1 || status === 2)) return false // Scheduled or In Flight
    const dep = new Date(f.departureTime)
    return isSameLocalDate(dep, todayDate)
  }).length

  // Bookings
  const bookingsResp = await bookingService.getAllBookings({ includeDeleted: false })
  const bookings: Booking[] = bookingsResp.data
  bookingsToday.value = bookings.filter(b => {
    const created = new Date(b.createdAt)
    return isSameLocalDate(created, todayDate)
  }).length

  // Airlines
  const airlines: Airline[] = await airlineService.getAllAirlines()
  airlinesCount.value = airlines.length
}

async function loadChart() {
  const Chart = await ensureChartJs()

  const resp = await bookingService.getStatistics(startDate.value, endDate.value)
  const stats = resp.data || []

  const labels = stats.map(s => s.flightId)
  const revenue = stats.map(s => Number(s.totalRevenue ?? 0))
  const bookingsCount = stats.map(s => Number(s.bookingCount ?? 0))

  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  const ctx = chartRef.value?.getContext('2d')
  if (!ctx) return

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Revenue',
          data: revenue,
          backgroundColor: 'rgba(236, 72, 153, 0.6)',
          borderColor: 'rgba(236, 72, 153, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Bookings Count',
          data: bookingsCount,
          backgroundColor: 'rgba(59, 130, 246, 0.4)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index' as const, intersect: false },
      stacked: false,
      plugins: {
        legend: { position: 'top' as const },
        title: { display: true, text: `Period: ${startDate.value} to ${endDate.value}` },
      },
      scales: {
        y: {
          type: 'linear' as const,
          position: 'left' as const,
          title: { display: true, text: 'Revenue' },
          ticks: { callback: (v: any) => `\$${Number(v).toLocaleString()}` },
        },
        y1: {
          type: 'linear' as const,
          position: 'right' as const,
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Bookings' },
        },
      },
    },
  })
}

async function reloadAll() {
  loading.value = true
  error.value = null
  try {
    await Promise.all([loadCounts(), loadChart()])
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load data'
    // eslint-disable-next-line no-console
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function reloadStats() {
  loading.value = true
  error.value = null
  try {
    await loadChart()
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load statistics'
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await reloadAll()
})
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: var(--color-off-white, #fafafa);
  padding: 1.5rem;
}

/* Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.card {
  background: var(--color-white, #fff);
  border: 1px solid var(--color-gray-100, #eee);
  border-radius: var(--radius-xl, 16px);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.05));
}
.card-title {
  color: var(--color-gray-600, #666);
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.card-value {
  font-size: 2rem;
  font-weight: 900;
  color: var(--color-gray-900, #111);
}
.card-sub {
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: var(--color-gray-500, #777);
}

/* Chart section */
.chart-section {
  background: var(--color-white, #fff);
  border: 1px solid var(--color-gray-100, #eee);
  border-radius: var(--radius-xl, 16px);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.05));
}
.section-header h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 800;
}
.section-header p {
  margin: 0 0 1rem 0;
  color: var(--color-gray-600, #666);
}
.filters {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.filter {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 600;
  color: var(--color-gray-700, #555);
}
.filter input[type="date"] {
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--color-gray-200, #e5e7eb);
  border-radius: 10px;
  font-weight: 600;
  background: var(--color-white, #fff);
}
.refresh-btn {
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--color-pink, #ec4899) 0%, var(--color-orange, #f97316) 100%);
  color: white;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(236,72,153,0.25);
}
.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  overflow-x: auto;
}

.error {
  margin-top: 1rem;
  color: var(--color-red, #ef4444);
  font-weight: 700;
}
</style>
