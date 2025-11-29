<template>
  <div class="home-view">
    <!-- Welcome Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="header-title">Dashboard Overview</h1>
        <p class="header-subtitle">Welcome back! Here's what's happening today</p>
      </div>
      <div class="refresh-actions">
        <button class="refresh-btn-header" @click="reloadAll" :disabled="loading">
          <svg v-if="!loading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          <span v-if="loading" class="spinner-small"></span>
          <span>{{ loading ? 'Refreshing...' : 'Refresh' }}</span>
        </button>
      </div>
    </header>

    <!-- Stats Cards -->
    <section class="stats-cards">
      <div class="stat-card card-flights">
        <div class="stat-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Active Flights</div>
          <div class="stat-value">{{ activeFlightsToday }}</div>
          <div class="stat-description">Scheduled or In Flight today</div>
        </div>
        <div class="stat-badge badge-primary">Today</div>
      </div>

      <div class="stat-card card-bookings" v-if="canSeeBookingStatistics">
        <div class="stat-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Bookings Created</div>
          <div class="stat-value">{{ bookingsToday }}</div>
          <div class="stat-description">All statuses included</div>
        </div>
        <div class="stat-badge badge-secondary">Today</div>
      </div>

      <div class="stat-card card-airlines" v-if="canSeeAirlineStats">
        <div class="stat-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
            <path d="M2 12h20"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Airlines</div>
          <div class="stat-value">{{ airlinesCount }}</div>
          <div class="stat-description">Total registered airlines</div>
        </div>
        <div class="stat-badge badge-accent">Active</div>
      </div>
    </section>

    <!-- Upcoming Flights Reminders (Customer & Staff) -->
    <section class="reminder-section">
      <div class="reminder-header">
        <div>
          <h2 class="reminder-title">Upcoming Flights</h2>
          <p class="reminder-subtitle">
            Smart reminders for your next departures — personalized for your role
          </p>
        </div>
        <div class="reminder-controls">
          <label class="reminder-interval-label">
            Interval (hours)
            <input
              type="number"
              min="1"
              max="24"
              v-model.number="reminderInterval"
              @change="loadReminders"
            />
          </label>
        </div>
      </div>

      <div v-if="remindersLoading" class="reminder-state loading">
        <div class="spinner"></div>
        <p>Loading upcoming flights...</p>
      </div>

      <div v-else-if="remindersError" class="reminder-state error">
        <p>{{ remindersError }}</p>
      </div>

      <div v-else-if="!reminders.length" class="reminder-state empty">
        <p>No upcoming flights in the next {{ reminderInterval }} hours.</p>
      </div>

      <div v-else class="reminder-list">
        <article
          v-for="r in reminders"
          :key="r.flightNumber + r.departureTime"
          class="reminder-card"
        >
          <header class="reminder-card-header">
            <div class="reminder-flight-id">
              <span class="plane-icon">✈️</span>
              <span class="flight-number">{{ r.flightNumber }}</span>
            </div>
            <span
              class="reminder-status-pill"
              :class="`status-${String(r.status)}`"
            >
              {{ formatFlightStatus(r.status) }}
            </span>
          </header>

          <div class="reminder-airline">
            {{ r.airline || 'Unnamed Airline' }}
          </div>

          <div class="reminder-route">
            <div class="airport">
              <div class="code">{{ r.origin || '—' }}</div>
              <div class="label">Origin</div>
            </div>
            <div class="arrow">→</div>
            <div class="airport">
              <div class="code">{{ r.destination || '—' }}</div>
              <div class="label">Destination</div>
            </div>
          </div>

          <div class="reminder-times">
            <div class="time-item">
              <div class="time-label">Departure</div>
              <div class="time-value">
                {{ formatDateTime(r.departureTime) }}
              </div>
            </div>
            <div class="time-item">
              <div class="time-label">Time Remaining</div>
              <div class="time-value highlight">
                {{ formatRemaining(r.remainingTimeMinutes) }}
              </div>
            </div>
          </div>

          <div class="reminder-badges">
            <span class="badge-pill badge-paid">
              Paid: {{ r.totalPaidBookings }}
            </span>
            <span class="badge-pill badge-unpaid">
              Unpaid: {{ r.totalUnpaidBookings }}
            </span>
          </div>

          <footer class="reminder-actions">
            <button
              type="button"
              class="btn btn-secondary btn-ghost"
              @click="goToFlightDetail(r.flightNumber)"
            >
              View Flight Detail
            </button>
          </footer>
        </article>
      </div>
    </section>

    <!-- Chart Section / Booking Statistics -->
    <section
      id="booking-statistics"
      class="chart-section"
      v-if="canSeeBookingStatistics"
      ref="statsSectionRef"
    >
      <div class="chart-header">
        <div class="chart-title-group">
          <h2 class="chart-title">Booking Statistics</h2>
          <p class="chart-subtitle">
            Revenue analysis and booking performance per flight
          </p>
        </div>
        
        <div class="chart-filters">
          <div class="filter-group">
            <label class="filter-label">Month</label>
            <select
              class="filter-input"
              v-model.number="selectedMonth"
              @change="reloadStats"
            >
              <option
                v-for="m in monthOptions"
                :key="m.value"
                :value="m.value"
              >
                {{ m.label }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Year</label>
            <select
              class="filter-input"
              v-model.number="selectedYear"
              @change="reloadStats"
            >
              <option
                v-for="y in yearOptions"
                :key="y"
                :value="y"
              >
                {{ y }}
              </option>
            </select>
          </div>

          <div class="filter-group chart-type-toggle">
            <button
              type="button"
              :class="chartType === 'bar' ? 'active' : ''"
              @click="chartType = 'bar'; reloadStats()"
            >
              Bar
            </button>
            <button
              type="button"
              :class="chartType === 'line' ? 'active' : ''"
              @click="chartType = 'line'; reloadStats()"
            >
              Line
            </button>
          </div>
        </div>
      </div>
 
      <div class="chart-container">
        <div v-if="loading" class="chart-loading">
          <div class="spinner"></div>
          <p>Loading analytics...</p>
        </div>

        <!-- Summary cards -->
        <div class="chart-summary-cards">
          <div class="chart-summary-card">
            <div class="chart-summary-label">Total Bookings</div>
            <div class="chart-summary-value">
              {{ chartSummary.totalBookings.toLocaleString('id-ID') }}
            </div>
          </div>
          <div class="chart-summary-card">
            <div class="chart-summary-label">Total Revenue</div>
            <div class="chart-summary-value">
              {{ formatRupiah(chartSummary.totalRevenue) }}
            </div>
          </div>
          <div class="chart-summary-card">
            <div class="chart-summary-label">Top Performance Flight</div>
            <div class="chart-summary-value">
              {{ chartSummary.topPerformer || '—' }}
            </div>
            <div
              v-if="chartSummary.topPerformer"
              class="chart-summary-sub"
            >
              Best by booking volume this period
            </div>
          </div>
        </div>

        <!-- Chart -->
        <canvas
          v-if="hasChartData"
          ref="chartRef"
          height="140"
        ></canvas>

        <!-- No data state -->
        <div v-else class="chart-no-data">
          No booking data available for this period.
        </div>

        <!-- Period label -->
        <div class="chart-period-label">
          {{ periodLabel }}
        </div>
      </div>

      <!-- Detailed Statistics Table -->
      <div
        v-if="hasChartData"
        class="chart-table-wrapper"
      >
        <table class="chart-table">
          <thead>
            <tr>
              <th>Flight ID</th>
              <th>Airline</th>
              <th>Route</th>
              <th>Bookings</th>
              <th>Total Revenue</th>
              <th>Avg per Booking</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in chartData" :key="row.flightId">
              <td>{{ row.flightId }}</td>
              <td>{{ row.airlineName || '—' }}</td>
              <td>
                <span v-if="row.origin && row.destination">
                  {{ row.origin }} → {{ row.destination }}
                </span>
                <span v-else>—</span>
              </td>
              <td>{{ row.totalBookings.toLocaleString('id-ID') }}</td>
              <td>{{ formatRupiah(row.totalRevenue) }}</td>
              <td>
                {{
                  formatRupiah(
                    row.totalBookings
                      ? row.totalRevenue / row.totalBookings
                      : 0
                  )
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="error" class="error-message">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ error }}</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bookingService } from '@/services/booking.service'
import { flightService } from '@/services/flight.service'
import { airlineService } from '@/services/airline.service'
import type { Booking } from '@/interfaces/booking.interface'
import type { Flight } from '@/interfaces/flight.interface'
import type { Airline } from '@/interfaces/airline.interface'
import { canAccess } from '@/lib/rbac'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref<string | null>(null)

const canSeeBookingStatistics = canAccess('bookings/statistics')
const canSeeAirlineStats = canAccess('airlines')

const activeFlightsToday = ref(0)
const bookingsToday = ref(0)
const airlinesCount = ref(0)

const chartRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: any = null

// Booking statistics period (month/year) and chart data
const today = new Date()
const currentMonth = today.getMonth() + 1
const currentYear = today.getFullYear()

const selectedMonth = ref<number>(currentMonth)
const selectedYear = ref<number>(currentYear)
const chartType = ref<'bar' | 'line'>('bar')

type BookingChartPoint = {
  flightId: string
  airlineName: string | null
  origin: string | null
  destination: string | null
  totalBookings: number
  totalRevenue: number
}

type BookingChartSummary = {
  totalBookings: number
  totalRevenue: number
  topPerformer: string | null
}

const chartData = ref<BookingChartPoint[]>([])
const chartSummary = ref<BookingChartSummary>({
  totalBookings: 0,
  totalRevenue: 0,
  topPerformer: null,
})

const monthOptions = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const yearOptions = computed(() => {
  const years: number[] = []
  for (let y = currentYear - 2; y <= currentYear + 2; y++) years.push(y)
  return years
})

const selectedMonthLabel = computed(() => {
  const m = monthOptions.find(x => x.value === selectedMonth.value)
  return m ? m.label : 'Unknown'
})

const periodLabel = computed(
  () => `Showing data for ${selectedMonthLabel.value} ${selectedYear.value}`,
)

const hasChartData = computed(() => chartData.value.length > 0)

// Flight reminders (Home view - both staff & customer, backend handles role logic)
type FlightReminder = {
  flightNumber: string
  airline: string | null
  origin: string | null
  destination: string | null
  departureTime: string
  remainingTimeMinutes: number
  status: number
  totalPaidBookings: number
  totalUnpaidBookings: number
}

const reminderInterval = ref(3)
const reminders = ref<FlightReminder[]>([])
const remindersLoading = ref(false)
const remindersError = ref<string | null>(null)

// Ref for scrolling to statistics section
const statsSectionRef = ref<HTMLElement | null>(null)


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

function formatRupiah(value: number): string {
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
  }
}

function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRemaining(minutesRaw: number | null | undefined): string {
  const minutes = Number(minutesRaw ?? 0)
  if (minutes <= 0) return 'Departing soon'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

function formatFlightStatus(status: number | null | undefined): string {
  const s = Number(status ?? 0)
  if (s === 1) return 'Scheduled'
  if (s === 2) return 'In Flight'
  if (s === 3) return 'Finished'
  if (s === 4) return 'Delayed'
  if (s === 5) return 'Cancelled'
  return 'Unknown'
}

function isSameLocalDate(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
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

  // Bookings (allowed for Customer, Superadmin, and Flight Airline)
  const bookingsResp = await bookingService.getAllBookings({ includeDeleted: false })
  const bookings: Booking[] = bookingsResp.data
  bookingsToday.value = bookings.filter(b => {
    const created = new Date(b.createdAt)
    return isSameLocalDate(created, todayDate)
  }).length

  // Airlines (only call API for roles that can manage airlines)
  if (canSeeAirlineStats) {
    const airlines: Airline[] = await airlineService.getAllAirlines()
    airlinesCount.value = airlines.length
  } else {
    airlinesCount.value = 0
  }
}

async function loadChart() {
  if (!canSeeBookingStatistics) return

  const Chart = await ensureChartJs()

  // Fetch chart + summary from backend
  const { chart, summary } = await bookingService.getBookingChart(
    selectedMonth.value,
    selectedYear.value,
  )

  chartData.value = chart || []
  chartSummary.value = summary || {
    totalBookings: 0,
    totalRevenue: 0,
    topPerformer: null,
  }

  // Destroy previous chart if any
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  if (!chartData.value.length) {
    // No data for this period: nothing to render, message handled in template
    return
  }

  const labels = chartData.value.map(s => s.flightId)
  const revenue = chartData.value.map(s => Number(s.totalRevenue ?? 0))

  const ctx = chartRef.value?.getContext('2d')
  if (!ctx) return

  chartInstance = new Chart(ctx, {
    type: chartType.value,
    data: {
      labels,
      datasets: [
        {
          label: 'Total Revenue (Rp)',
          data: revenue,
          backgroundColor:
            chartType.value === 'bar'
              ? 'rgba(249, 205, 213, 0.7)'
              : 'rgba(249, 205, 213, 0.2)',
          borderColor: 'rgba(245, 179, 193, 1)',
          borderWidth: 2,
          borderRadius: chartType.value === 'bar' ? 8 : 0,
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 13,
              weight: '600',
              family: 'Inter, sans-serif',
            },
          },
        },
        title: {
          display: true,
          text: periodLabel.value,
          font: {
            size: 15,
            weight: '700',
            family: 'Inter, sans-serif',
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#18181b',
          bodyColor: '#52525b',
          borderColor: '#e4e4e7',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: (ctx: any) =>
              ` ${formatRupiah(Number(ctx.parsed.y ?? 0))}`,
          },
          titleFont: {
            size: 14,
            weight: '700',
          },
          bodyFont: {
            size: 13,
            weight: '600',
          },
        },
      },
      scales: {
        y: {
          type: 'linear' as const,
          position: 'left' as const,
          title: {
            display: true,
            text: 'Revenue (Rp)',
            font: {
              size: 13,
              weight: '700',
              family: 'Inter, sans-serif',
            },
          },
          ticks: {
            callback: (v: any) => formatRupiah(Number(v)),
            font: {
              size: 12,
              weight: '600',
            },
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false,
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 12,
              weight: '600',
            },
          },
        },
      },
    },
  })
}

async function loadReminders() {
  remindersLoading.value = true
  remindersError.value = null
  try {
    const data = await flightService.getFlightReminders(reminderInterval.value)
    reminders.value = (data as any[]) || []
  } catch (e: any) {
    remindersError.value =
      e?.response?.data?.message ??
      e?.message ??
      'Failed to load flight reminders'
  } finally {
    remindersLoading.value = false
  }
}

async function reloadAll() {
  loading.value = true
  error.value = null
  try {
    await Promise.all([loadCounts(), loadChart(), loadReminders()])
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

function scrollToStats() {
  const el = statsSectionRef.value || document.getElementById('booking-statistics')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function goToFlightDetail(flightNumber: string) {
  router.push(`/flights/${encodeURIComponent(flightNumber)}`)
}

onMounted(async () => {
  await reloadAll()
  if (route.hash === '#booking-statistics') {
    setTimeout(() => scrollToStats(), 400)
  }
})
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  padding: 0;
  max-width: 100%;
  margin: 0 auto;
  animation: fadeIn 0.6s ease-out;
  background: #ffffff;
}

/* Dashboard Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3rem 2rem;
  background: #F9CDD5;
  margin-bottom: 0;
}

.header-content {
  flex: 1;
}

.header-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.1rem;
  font-weight: 500;
}

.refresh-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
}

.refresh-btn-header {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-lg);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all var(--transition-base);
  backdrop-filter: blur(10px);
}

.view-stats-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  text-decoration: underline;
}

.refresh-btn-header:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.refresh-btn-header:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.refresh-btn-header svg {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

/* Stats Cards */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto 2rem;
}

/* Upcoming Flights Reminder Section */
.reminder-section {
  max-width: 1400px;
  margin: 0 auto 2rem;
  margin-left: 2rem;
  margin-right: 2rem;
  background: linear-gradient(
    135deg,
    rgba(249, 205, 213, 0.22),
    rgba(255, 255, 255, 0.98)
  );
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-gray-100);
  box-shadow: var(--shadow-md);
  padding: 1.75rem 1.75rem 1.5rem;
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.reminder-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-gray-900);
  letter-spacing: -0.01em;
}

.reminder-subtitle {
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: var(--color-gray-600);
  font-weight: 500;
}

.reminder-controls {
  display: flex;
  align-items: flex-end;
}

.reminder-interval-label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-700);
}

.reminder-interval-label input {
  width: 120px;
  padding: 0.55rem 0.85rem;
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-gray-200);
  font-weight: 600;
  font-size: 0.9rem;
  transition: all var(--transition-base);
  background: #fff;
}

.reminder-interval-label input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(249, 205, 213, 0.15);
}

.reminder-state {
  padding: 1.25rem 1rem;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.reminder-state.empty {
  background: rgba(255, 255, 255, 0.8);
  color: var(--color-gray-600);
}

.reminder-state.error {
  background: rgba(239, 68, 68, 0.04);
  color: #ef4444;
}

.reminder-list {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin: 0.25rem -0.5rem 0;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.reminder-card {
  min-width: 260px;
  max-width: 320px;
  background: #ffffff;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-gray-100);
  box-shadow: var(--shadow-sm);
  padding: 1.1rem 1.1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.reminder-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.reminder-flight-id {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--color-gray-900);
}

.reminder-flight-id .plane-icon {
  font-size: 1rem;
}

.reminder-status-pill {
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border: 1px solid transparent;
}

.reminder-status-pill.status-1,
.reminder-status-pill.status-4 {
  background: rgba(122, 132, 80, 0.1);
  color: #7a8450;
  border-color: rgba(122, 132, 80, 0.25);
}

.reminder-status-pill.status-2 {
  background: rgba(96, 165, 250, 0.12);
  color: #2563eb;
  border-color: rgba(96, 165, 250, 0.35);
}

.reminder-status-pill.status-3 {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
  border-color: rgba(16, 185, 129, 0.25);
}

.reminder-status-pill.status-5 {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.25);
}

.reminder-airline {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-700);
}

.reminder-route {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.5rem;
  align-items: center;
  padding: 0.65rem 0.75rem;
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
}

.reminder-route .airport {
  text-align: center;
}

.reminder-route .code {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--color-gray-900);
}

.reminder-route .label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-gray-500);
  font-weight: 600;
}

.reminder-route .arrow {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-gray-600);
}

.reminder-times {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
  margin-top: 0.4rem;
}

.time-item {
  padding: 0.55rem 0.65rem;
  border-radius: var(--radius-md);
  background: #ffffff;
  border: 1px solid var(--color-gray-100);
}

.time-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-gray-500);
  font-weight: 600;
  margin-bottom: 0.1rem;
}

.time-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-800);
}

.time-value.highlight {
  color: #7a8450;
}

.reminder-badges {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.3rem;
  flex-wrap: wrap;
}

.badge-pill {
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 600;
}

.badge-paid {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
}

.badge-unpaid {
  background: rgba(245, 158, 11, 0.08);
  color: #d97706;
}

.reminder-actions {
  margin-top: 0.4rem;
  display: flex;
  justify-content: flex-end;
}

.btn-ghost {
  background: transparent;
  border: 1px dashed var(--color-gray-300);
  color: var(--color-gray-700);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--color-gray-50);
  border-style: solid;
}

.stat-card {
  position: relative;
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  padding: 2rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-gray-100);
  transition: all var(--transition-base);
  overflow: hidden;
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-primary);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.card-flights .stat-icon {
  background: linear-gradient(135deg, rgba(249, 205, 213, 0.2) 0%, rgba(249, 205, 213, 0.05) 100%);
  color: var(--color-primary-strong);
}

.card-bookings .stat-icon {
  background: linear-gradient(135deg, rgba(122, 132, 80, 0.2) 0%, rgba(122, 132, 80, 0.05) 100%);
  color: var(--color-secondary-strong);
}

.card-airlines .stat-icon {
  background: rgba(122, 132, 80, 0.12);
  color: var(--color-secondary);
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--color-gray-900);
  line-height: 1;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.stat-description {
  font-size: 0.9rem;
  color: var(--color-gray-500);
  font-weight: 500;
}

.stat-badge {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-primary {
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
}

.badge-secondary {
  background: var(--color-secondary-soft);
  color: var(--color-secondary-strong);
}

.badge-accent {
  background: var(--color-secondary-soft);
  color: var(--color-secondary-strong);
}

/* Chart Section */
.chart-section {
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  padding: 2rem;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-gray-100);
  transition: all var(--transition-base);
  max-width: 1400px;
  margin: 0 auto 2rem;
  margin-left: 2rem;
  margin-right: 2rem;
}

.chart-section:hover {
  box-shadow: var(--shadow-lg);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 2rem;
  flex-wrap: wrap;
}

.chart-title-group {
  flex: 1;
  min-width: 250px;
}

.chart-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;
}

.chart-subtitle {
  color: var(--color-gray-600);
  font-size: 0.95rem;
  font-weight: 500;
}

.chart-filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chart-type-toggle {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.chart-type-toggle button {
  padding: 0.35rem 0.9rem;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  color: var(--color-gray-800);
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-type-toggle button.active {
  background: #7A8450;
  color: #fff;
  border-color: #7A8450;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-700);
}

.filter-label svg {
  color: var(--color-primary);
}

.filter-input {
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  font-size: 0.95rem;
  font-weight: 600;
  background: var(--color-white);
  color: var(--color-gray-800);
  transition: all var(--transition-base);
  min-width: 160px;
}

.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(249, 205, 213, 0.15);
}

.chart-container {
  position: relative;
  width: 100%;
  min-height: 320px;
  padding: 1rem;
  background: var(--color-gray-50);
  border-radius: var(--radius-xl);
}

.chart-summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.chart-summary-card {
  background: #ffffff;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-100);
  padding: 0.85rem 1rem;
}

.chart-summary-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  color: var(--color-gray-500);
  margin-bottom: 0.25rem;
}

.chart-summary-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-gray-900);
}

.chart-summary-sub {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-gray-600);
}

.chart-period-label {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: var(--color-gray-600);
  font-weight: 500;
}

.chart-no-data {
  margin-top: 1rem;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-lg);
  background: var(--color-gray-50);
  color: var(--color-gray-600);
  font-weight: 500;
}

.chart-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  z-index: 10;
}

.chart-loading p {
  color: var(--color-gray-600);
  font-weight: 600;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid var(--color-gray-200);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding: 1rem 1.25rem;
  background: var(--color-error-light);
  border-left: 4px solid var(--color-error);
  border-radius: var(--radius-lg);
  color: var(--color-error);
  font-weight: 600;
}

.error-message svg {
  flex-shrink: 0;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .dashboard-header {
    padding: 2rem 1.5rem;
  }

  .header-title {
    font-size: 2rem;
  }

  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    padding: 1.5rem;
  }

  .stat-card {
    padding: 1.5rem;
  }

  .stat-value {
    font-size: 2rem;
  }

  .reminder-section {
    margin-left: 1.5rem;
    margin-right: 1.5rem;
  }

  .chart-section {
    margin-left: 1.5rem;
    margin-right: 1.5rem;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 2rem 1rem;
  }

  .header-title {
    font-size: 1.75rem;
  }

  .header-subtitle {
    font-size: 1rem;
  }

  .refresh-actions {
    width: 100%;
    align-items: stretch;
  }

  .refresh-btn-header {
    width: 100%;
    justify-content: center;
  }

  .stats-cards {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
  }

  .stat-badge {
    position: static;
    display: inline-block;
    margin-top: 1rem;
  }

  .chart-section {
    margin-left: 1rem;
    margin-right: 1rem;
  }

  .chart-header {
    flex-direction: column;
  }

  .chart-filters {
    width: 100%;
  }

  .filter-group {
    flex: 1;
    min-width: 0;
  }

  .filter-input {
    width: 100%;
  }

  .chart-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .stat-icon {
    width: 56px;
    height: 56px;
  }

  .stat-icon svg {
    width: 28px;
    height: 28px;
  }

  .stat-value {
    font-size: 1.75rem;
  }
}
</style>
