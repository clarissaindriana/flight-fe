<template>
  <div class="flight-page">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-icon">🛫</div>
      <div class="hero-copy">
        <h1>All Flights</h1>
        <p>Browse, filter, and manage flights. Switch to Round Trip to select departure and return.</p>
      </div>
      <router-link
        v-if="canCreateFlight"
        to="/flights/create"
        class="btn hero-btn"
      >
        ＋ Create Flight
      </router-link>
    </section>

    <!-- Mode + Filters -->
    <section class="filters-card">
      <!-- Top row: one-way / round-trip chips -->
      <div class="mode-row">
        <button
          :class="['chip', flightStore.oneWayMode ? 'chip-active' : '']"
          @click="flightStore.setOneWay(true)"
          type="button"
        >
          → One-Way
        </button>
        <button
          :class="['chip', !flightStore.oneWayMode ? 'chip-active' : '']"
          @click="flightStore.setOneWay(false)"
          type="button"
        >
          ⇄ Round Trip
        </button>
      </div>

      <!-- Filter grid -->
      <div class="filter-grid">
        <VSelect
          :options="airportOptions"
          v-model="filters.originAirportCode"
          placeholder="Airport code (e.g., CGK)"
          label="Origin"
        />
        <VSelect
          :options="airportOptions"
          v-model="filters.destinationAirportCode"
          placeholder="Airport code (e.g., SIN)"
          label="Destination"
        />
        <VSelect
          :options="airlineOptions"
          v-model="filters.airlineId"
          placeholder="Search airline..."
          label="Airline"
        />
        <VSelect
          :options="statusOptions"
          v-model="filters.status"
          placeholder="All Statuses"
          label="Status"
        />

        <div class="toggle-field">
          <label class="toggle-label">Show Inactive</label>
          <label class="switch">
            <input type="checkbox" v-model="showInactive" />
            <span class="slider"></span>
          </label>
          <span class="toggle-hint">{{ showInactive ? 'Including inactive' : 'Active Only' }}</span>
        </div>

        <div class="search-field">
          <label class="search-label">Search</label>
          <input
            class="search-input"
            v-model="searchText"
            placeholder="Flight number or airline..."
            type="text"
          />
        </div>
      </div>

      <div class="filter-actions">
        <button class="btn btn-secondary" type="button" @click="resetFilters" :disabled="flightStore.loading">
          ⟳ Reset
        </button>
        <button class="btn btn-primary" type="button" @click="applyFilters" :disabled="flightStore.loading">
          Apply Filters
        </button>
      </div>
    </section>

    <!-- Round trip selection banner -->
    <section
      v-if="!flightStore.oneWayMode && canCreateBooking && (flightStore.selectedDepartureFlightId || flightStore.selectedReturnFlightId)"
      class="selection-banner"
    >
      <div class="selection-pill">
        <span v-if="flightStore.selectedDepartureFlightId">🛫 Departure: {{ flightStore.selectedDepartureFlightId }}</span>
        <span v-if="flightStore.selectedDepartureFlightId && flightStore.selectedReturnFlightId"> → </span>
        <span v-if="flightStore.selectedReturnFlightId">🛬 Return: {{ flightStore.selectedReturnFlightId }}</span>
      </div>
      <div style="display:flex; gap:.5rem;">
        <button
          class="btn proceed-btn"
          type="button"
          :disabled="!canProceedRoundTrip"
          @click="proceedRoundTrip"
        >
          ✓ Proceed to Booking
        </button>
        <button
          class="btn btn-secondary"
          type="button"
          @click="undoRoundTrip"
        >
          ↺ Undo Selection
        </button>
      </div>
    </section>

    <!-- Loading / Error / Empty -->
    <div v-if="flightStore.loading" class="state-card">
      <div class="spinner"></div>
      <p>Loading flights...</p>
    </div>

    <div v-else-if="flightStore.error" class="state-card error">
      <div class="error-icon">⚠️</div>
      <h3>Failed to load flights</h3>
      <p>{{ flightStore.error }}</p>
      <button class="btn btn-primary" @click="applyFilters">Retry</button>
    </div>

    <div v-else-if="filteredDisplayFlights.length === 0" class="state-card">
      <div class="empty-icon">🛩️</div>
      <template v-if="!flightStore.oneWayMode && flightStore.selectedDepartureFlightId && !flightStore.selectedReturnFlightId">
        <h3>No return flights found</h3>
        <p>There are no available return flights for the selected departure. Undo to pick a different departure.</p>
        <button class="btn btn-secondary" type="button" @click="undoRoundTrip">↺ Undo Selection</button>
      </template>
      <template v-else>
        <h3>No flights found</h3>
        <p>Try adjusting your filters or search term.</p>
      </template>
    </div>

    <!-- Flights -->
    <div class="flight-list">
      <article
        v-for="f in filteredDisplayFlights"
        :key="f.id"
        class="flight-card"
        :class="{ inactive: f.isDeleted }"
      >
        <header class="card-head">
          <div class="id">
            <span class="plane-icon">✈️</span>
            <span class="text">{{ f.id }}</span>
          </div>
          <span class="badge" :class="flightStore.statusBadgeClass(f.status)">
            {{ flightStore.statusText(f.status) }}
          </span>
        </header>

        <!-- Route strip -->
        <div class="route-row">
          <div class="port big">
            <div class="iata">{{ f.originAirportCode }}</div>
            <div class="label">{{ airportStore.getAirportLabel(f.originAirportCode) }}</div>
          </div>

          <div class="duration-pill">{{ durationText(f.departureTime, f.arrivalTime) }}</div>

          <div class="port big">
            <div class="iata">{{ f.destinationAirportCode }}</div>
            <div class="label">{{ airportStore.getAirportLabel(f.destinationAirportCode) }}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-title">Departure</div>
            <div class="info-value">🕘 {{ formatDT(f.departureTime) }}</div>
          </div>
          <div class="info-item">
            <div class="info-title">Arrival</div>
            <div class="info-value">🕘 {{ formatDT(f.arrivalTime) }}</div>
          </div>
          <div class="info-item">
            <div class="info-title">Airline</div>
            <div class="info-value">🏢 {{ airlineStore.getAirlineName(f.airlineId) }}</div>
          </div>
          <div class="info-item">
            <div class="info-title">Terminal/Gate</div>
            <div class="info-value">🛗 {{ f.terminal }} / {{ f.gate }}</div>
          </div>
          <div class="info-item">
            <div class="info-title">Baggage</div>
            <div class="info-value">💼 {{ f.baggageAllowance }} kg</div>
          </div>
        </div>

        <!-- Available classes -->
        <div class="classes-card">
          <div class="classes-title">Available Classes</div>
          <div class="classes-grid">
            <div v-for="c in f.classes" :key="c.id" class="class-box">
              <div class="class-type">{{ c.classType }}</div>
              <div class="class-seats">
                <span class="seat-count">{{ c.availableSeats }}</span>/<span class="seat-total">{{ c.seatCapacity }}</span> seats
              </div>
              <div class="class-price">{{ formatPrice(c.price) }}</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <footer class="card-actions">
          <button class="btn btn-info" @click="goDetail(f.id)">Detail</button>
          <button
            v-if="canUpdateFlight"
            class="btn btn-warn"
            @click="goUpdate(f.id)"
            :disabled="!(Number(f.status) === 1 || Number(f.status) === 4)"
          >
            Update
          </button>
          <button
            v-if="canCancelFlight"
            class="btn btn-danger"
            @click="softDelete(f)"
            :disabled="Number(f.status) === 2 || Number(f.status) === 3 || Number(f.status) === 5 || f.isDeleted"
          >
            Cancel
          </button>

          <button
            v-if="flightStore.oneWayMode && canCreateBooking"
            class="btn btn-primary"
            :disabled="Number(f.status) !== 1 || f.isDeleted"
            @click="selectOneWay(f)"
          >
            Book Flight
          </button>

          <template v-else-if="canCreateBooking">
            <button
              v-if="!flightStore.selectedDepartureFlightId"
              class="btn btn-primary"
              :disabled="Number(f.status) !== 1 || f.isDeleted"
              @click="selectDeparture(f)"
            >
              Select Departure
            </button>
            <button
              v-else
              class="btn btn-primary"
              :disabled="!isValidReturnOption(f)"
              @click="selectReturn(f)"
            >
              Select Return
            </button>
          </template>
        </footer>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useFlightStore } from '@/stores/flight/flight'
import { useAirlineStore } from '@/stores/airline/airline'
import { useAirportStore } from '@/stores/airport/airport'
import VSelect from '@/components/common/VSelect.vue'
import { canAccess } from '@/lib/rbac'

const router = useRouter()
const flightStore = useFlightStore()
const airlineStore = useAirlineStore()
const airportStore = useAirportStore()

// RBAC-driven capabilities
const canCreateFlight = canAccess('flights/create')
const canUpdateFlight = canAccess('flights/update')
const canCancelFlight = canAccess('flights/delete')
const canCreateBooking = canAccess('bookings/create')

// Treat anyone who can manage flights as "staff" (superadmin / flight airline)
const isStaff = canCreateFlight || canUpdateFlight || canCancelFlight

// Filters (local UI state)
const filters = ref({
  airlineId: '',
  originAirportCode: '',
  destinationAirportCode: '',
  status: '' as string | number,
})
const showInactive = ref(false)
const searchText = ref('')

const statusOptions = [
  { value: 1, label: 'Scheduled' },
  { value: 2, label: 'In Flight' },
  { value: 3, label: 'Finished' },
  { value: 4, label: 'Delayed' },
  { value: 5, label: 'Cancelled' },
]

const airlineOptions = computed(() =>
  [{ value: '', label: 'All Airlines' }].concat(
    airlineStore.airlines.map(a => ({ value: a.id, label: a.name }))
  )
)

const airportOptions = computed(() =>
  [{ value: '', label: 'All Airports' }].concat(airportStore.airportOptions)
)

/**
 * Base list with round-trip logic (no role/status filtering yet).
 */
const baseRoundTripList = computed(() => {
  const list = flightStore.flights
  if (flightStore.oneWayMode || !flightStore.selectedDepartureFlightId) {
    return list
  }
  const outbound = list.find(x => x.id === flightStore.selectedDepartureFlightId)
  if (!outbound) return list
  // Return flights must be reverse route and depart after outbound arrives
  return list.filter(x =>
    x.originAirportCode.toUpperCase() === outbound.destinationAirportCode.toUpperCase() &&
    x.destinationAirportCode.toUpperCase() === outbound.originAirportCode.toUpperCase() &&
    new Date(x.departureTime).getTime() >= new Date(outbound.arrivalTime).getTime()
  )
})

/**
 * Apply role-based visibility + default status filtering + default sorting.
 * - Staff (superadmin/flight airline): by default see Scheduled, Delayed, In Flight
 *   but can explicitly filter Finished/Cancelled via the Status dropdown.
 * - Customers: by default (and when no explicit Status filter) only see
 *   Scheduled and Delayed, and never deleted flights.
 * - Sorting: Scheduled and Delayed first (by departureTime asc),
 *   then In Flight (by departureTime asc), then others.
 */
const displayFlights = computed(() => {
  let list = baseRoundTripList.value.slice()

  const statusFilter = filters.value.status ? Number(filters.value.status) : null

  list = list.filter((f: any) => {
    const s = Number(f.status)

    // Explicit status filter from UI always wins
    if (statusFilter !== null && !Number.isNaN(statusFilter)) {
      return s === statusFilter
    }

    // Customer POV: only Scheduled + Delayed, not deleted
    if (!isStaff) {
      return (s === 1 || s === 4) && !f.isDeleted
    }

    // Staff default: Scheduled, Delayed, In Flight
    return s === 1 || s === 4 || s === 2
  })

  const statusRank = (s: number) => {
    if (s === 1) return 1 // Scheduled
    if (s === 4) return 2 // Delayed
    if (s === 2) return 3 // In Flight
    if (s === 3) return 4 // Finished
    if (s === 5) return 5 // Cancelled
    return 6
  }

  return list.sort((a: any, b: any) => {
    const ra = statusRank(Number(a.status))
    const rb = statusRank(Number(b.status))
    if (ra !== rb) return ra - rb

    const da = new Date(a.departureTime).getTime()
    const db = new Date(b.departureTime).getTime()
    return da - db
  })
})

/**
 * Apply local search over the already filtered + sorted list.
 */
const filteredDisplayFlights = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return displayFlights.value
  return displayFlights.value.filter(f =>
    f.id.toLowerCase().includes(q) ||
    airlineStore.getAirlineName(f.airlineId).toLowerCase().includes(q)
  )
})

// Helpers
const canProceedRoundTrip = computed(() =>
  !flightStore.oneWayMode &&
  !!flightStore.selectedDepartureFlightId &&
  !!flightStore.selectedReturnFlightId
)

// Actions
function applyFilters() {
  // map UI controls to store filters; showInactive => includeDeleted true
  flightStore.setFilters({
    airlineId: filters.value.airlineId || undefined,
    originAirportCode: filters.value.originAirportCode || undefined,
    destinationAirportCode: filters.value.destinationAirportCode || undefined,
    status: filters.value.status ? Number(filters.value.status) : undefined,
    includeDeleted: showInactive.value || undefined,
  })
  flightStore.fetchFlights()
}

function resetFilters() {
  filters.value = {
    airlineId: '',
    originAirportCode: '',
    destinationAirportCode: '',
    status: '',
  }
  showInactive.value = false
  searchText.value = ''
  flightStore.resetFilters()
  flightStore.fetchFlights()
}

function formatDT(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString()
}

function durationText(dep: string, arr: string) {
  const ms = new Date(arr).getTime() - new Date(dep).getTime()
  if (ms <= 0) return '—'
  const mins = Math.floor(ms / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

function formatPrice(n: number) {
  try {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
  } catch {
    return `$ ${n.toLocaleString('id-ID')}`
  }
}

function goDetail(id: string) {
  router.push(`/flights/${encodeURIComponent(id)}`)
}
function goUpdate(id: string) {
  router.push(`/flights/${encodeURIComponent(id)}/update`)
}
async function softDelete(f: any) {
  if (!confirm(`Cancel flight ${f.id}?`)) return
  try {
    await flightStore.deleteFlight(f.id)
    await flightStore.fetchFlights()
  } catch {
    // surfaced via store
  }
}

function selectOneWay(f: any) {
  router.push(`/bookings/create?flightId=${encodeURIComponent(f.id)}`)
}

function selectDeparture(f: any) {
  flightStore.selectDeparture(f.id)
}
function selectReturn(f: any) {
  flightStore.selectReturn(f.id)
  if (canProceedRoundTrip.value) proceedRoundTrip()
}
function proceedRoundTrip() {
  if (!flightStore.selectedDepartureFlightId || !flightStore.selectedReturnFlightId) return
  router.push(`/bookings/create?departureFlightId=${encodeURIComponent(flightStore.selectedDepartureFlightId)}&returnFlightId=${encodeURIComponent(flightStore.selectedReturnFlightId)}`)
}

function undoRoundTrip() {
  flightStore.clearRoundTripSelection()
}

function isValidReturnOption(f: any) {
  const out = flightStore.flights.find(x => x.id === flightStore.selectedDepartureFlightId)
  if (!out) return false
  const cond =
    f.originAirportCode.toUpperCase() === out.destinationAirportCode.toUpperCase() &&
    f.destinationAirportCode.toUpperCase() === out.originAirportCode.toUpperCase() &&
    new Date(f.departureTime).getTime() >= new Date(out.arrivalTime).getTime() &&
    Number(f.status) === 1 && !f.isDeleted
  return cond
}

onMounted(async () => {
  await Promise.all([
    airlineStore.fetchAirlines(),
    airportStore.fetchAirports(),
  ])
  await flightStore.fetchFlights()
})
</script>

<style scoped>
.flight-page {
  padding: 0;
  max-width: 100%;
  margin: 0 auto;
  background: #ffffff;
  min-height: 100vh;
}

/* Hero */
.hero {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  background: #F9CDD5;
  color: #fff;
  padding: 2.5rem 2rem;
  margin-bottom: 0;
}
.hero-icon { font-size: 2.5rem; }
.hero-copy h1 { margin: 0; font-size: 2rem; font-weight: 800; letter-spacing: -0.01em; }
.hero-copy p { margin: 0.5rem 0 0; opacity: 0.95; font-size: 1rem; }
.hero-btn {
  background: rgba(255,255,255,0.2);
  color: #fff;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: var(--radius-md);
  padding: 0.75rem 1.25rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}
.hero-btn:hover {
  background: rgba(255,255,255,0.3);
  border-color: rgba(255,255,255,0.5);
}

/* Filters */
.filters-card {
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  margin: 2rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}
.mode-row { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; }
.chip {
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-md);
  background: #ffffff;
  border: 1.5px solid var(--color-gray-200);
  font-weight: 600;
  color: var(--color-gray-700);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}
.chip:hover {
  border-color: var(--color-gray-300);
  background: var(--color-gray-50);
}
.chip-active {
  border-color: #F9CDD5;
  background: #F9CDD5;
  color: #7A8450;
  font-weight: 700;
}
.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}
.toggle-field { display: grid; gap: 0.4rem; align-content: end; }
.toggle-label { font-weight: 600; color: var(--color-gray-700); font-size: 0.9rem; }
.toggle-hint { font-size: 0.8rem; color: var(--color-gray-500); }
.switch { position: relative; display: inline-block; width: 48px; height: 26px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background: var(--color-gray-200);
  transition: .3s;
  border-radius: 26px;
}
.slider:before {
  position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px;
  background: white;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.switch input:checked + .slider { background: #7A8450; }
.switch input:checked + .slider:before { transform: translateX(22px); }
.search-field { display: grid; gap: 0.4rem; }
.search-label { font-weight: 600; color: var(--color-gray-700); font-size: 0.9rem; }
.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}
.search-input:focus {
  outline: none;
  border-color: #F9CDD5;
  box-shadow: 0 0 0 3px rgba(249, 205, 213, 0.1);
}
.filter-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1.25rem; }

/* Round-trip selection banner */
.selection-banner {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 1rem;
  background: rgba(249, 205, 213, 0.12);
  border: 1.5px solid #7A8450;
  border-radius: var(--radius-xl);
  padding: 1rem 1.5rem;
  margin: 1.5rem 2rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}
.selection-pill {
  font-weight: 700;
  color: var(--color-gray-800);
  font-size: 0.95rem;
}
.proceed-btn {
  background: #7A8450;
  color: #fff;
  font-weight: 700;
}

/* State cards */
.state-card {
  text-align: center;
  padding: 3rem 2rem;
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  margin: 2rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}
.state-card.error { border-color: var(--color-error-light); background: rgba(239,68,68,0.02); }
.spinner {
  width: 48px; height: 48px;
  border: 4px solid var(--color-gray-200);
  border-top-color: #F9CDD5;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon, .error-icon { font-size: 3rem; margin-bottom: 1rem; }

/* Flight list */
.flight-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}
.flight-card {
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}
.flight-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.flight-card.inactive { opacity: 0.7; background: var(--color-gray-50); }
.card-head {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;
}
.id { font-weight: 800; display: flex; align-items: center; gap: 0.6rem; font-size: 1.1rem; }
.plane-icon { font-size: 1.25rem; }
.badge {
  padding: 0.4rem 0.75rem; border-radius: var(--radius-full); font-weight: 700; font-size: 0.75rem; border: none;
}

.route-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding: 1rem;
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
}
.port.big { text-align: center; }
.port .iata { font-size: 1.75rem; font-weight: 900; letter-spacing: 0.5px; color: var(--color-gray-900); }
.port .label {
  color: var(--color-gray-600);
  font-weight: 500;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}
.duration-pill {
  padding: 0.5rem 0.875rem;
  border-radius: var(--radius-md);
  background: #ffffff;
  color: var(--color-gray-700);
  font-weight: 700;
  border: 1.5px solid var(--color-gray-200);
  font-size: 0.85rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.info-item {
  background: #ffffff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
}
.info-title { font-weight: 600; color: var(--color-gray-600); margin-bottom: 0.35rem; font-size: 0.85rem; }
.info-value { font-weight: 600; color: var(--color-gray-900); font-size: 0.95rem; }

.classes-card {
  background: rgba(249, 205, 213, 0.06);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 1rem;
  margin-top: 0.75rem;
}
.classes-title { font-weight: 700; color: var(--color-gray-800); margin-bottom: 0.75rem; font-size: 0.9rem; }
.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}
.class-box {
  background: #ffffff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  padding: 0.75rem;
}
.class-type { font-weight: 700; margin-bottom: 0.35rem; font-size: 0.95rem; }
.class-seats { color: var(--color-gray-600); font-weight: 500; font-size: 0.85rem; margin-bottom: 0.25rem; }
.class-price { font-weight: 700; color: #7A8450; font-size: 1rem; }

.card-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-md);
  border: none;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn-primary { background: #7A8450; color: #fff; box-shadow: 0 2px 8px rgba(122, 132, 80, 0.35); }
.btn-primary:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(122, 132, 80, 0.45); }
.btn-secondary { background: #ffffff; color: var(--color-gray-700); border: 1.5px solid var(--color-gray-200); }
.btn-secondary:hover:not(:disabled) { background: var(--color-gray-50); border-color: var(--color-gray-300); }
.btn-info { background: #6366f1; color: #fff; }
.btn-warn { background: #f59e0b; color: #fff; }
.btn-danger { background: #ef4444; color: #fff; }
</style>