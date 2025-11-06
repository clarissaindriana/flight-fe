<template>
  <div class="flight-page">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-icon">🛫</div>
      <div class="hero-copy">
        <h1>All Flights</h1>
        <p>Browse, filter, and manage flights. Switch to Round Trip to select departure and return.</p>
      </div>
      <router-link to="/flights/create" class="btn hero-btn">＋ Create Flight</router-link>
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
    <section v-if="!flightStore.oneWayMode && (flightStore.selectedDepartureFlightId || flightStore.selectedReturnFlightId)" class="selection-banner">
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
          <button class="btn btn-warn" @click="goUpdate(f.id)" :disabled="Number(f.status) === 3">Update</button>
          <button
            class="btn btn-danger"
            @click="softDelete(f)"
            :disabled="Number(f.status) === 2 || Number(f.status) === 3"
          >
            Cancel
          </button>

          <button
            v-if="flightStore.oneWayMode"
            class="btn btn-primary"
            :disabled="Number(f.status) !== 1 || f.isDeleted"
            @click="selectOneWay(f)"
          >
            Book Flight
          </button>

          <template v-else>
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

const router = useRouter()
const flightStore = useFlightStore()
const airlineStore = useAirlineStore()
const airportStore = useAirportStore()

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

// Display list with round-trip logic
const displayFlights = computed(() => {
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

// Apply local search over displayFlights
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
    return `Rp ${n.toLocaleString('id-ID')}`
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
  padding: 2rem;
  max-width: 1280px;
  margin: 0 auto;
  background:
    radial-gradient(1200px 600px at -10% -20%, rgba(236,72,153,0.12), transparent 40%),
    radial-gradient(1200px 800px at 110% 0%, rgba(59,130,246,0.12), transparent 40%);
}

/* Hero */
.hero {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-blue) 100%);
  color: #fff;
  padding: 1rem 1.25rem;
  border-radius: 18px;
  box-shadow: 0 12px 24px rgba(0,0,0,0.12);
  margin-bottom: 1.25rem;
}
.hero-icon { font-size: 2rem; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3)); }
.hero-copy h1 { margin: 0; font-size: 1.9rem; font-weight: 900; }
.hero-copy p { margin: 0.25rem 0 0; opacity: 0.95; }
.hero-btn { background: rgba(255,255,255,0.18); color: #fff; border: none; border-radius: 12px; padding: 0.7rem 1rem; font-weight: 800; text-decoration: none; }

/* Filters */
.filters-card {
  background: #fff;
  border: 1px solid var(--color-gray-100);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: var(--shadow-md);
  margin-bottom: 1rem;
}
.mode-row { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
.chip {
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: var(--color-gray-100);
  border: 2px solid var(--color-gray-200);
  font-weight: 800;
  color: var(--color-gray-800);
}
.chip-active {
  border-color: var(--color-pink);
  color: var(--color-pink);
  background: #fff;
}
.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 0.75rem;
  align-items: end;
}
.toggle-field { display: grid; gap: 0.25rem; align-content: end; }
.toggle-label { font-weight: 700; color: var(--color-gray-700); }
.toggle-hint { font-size: 0.85rem; color: var(--color-gray-600); }
.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: var(--color-gray-300); transition: .2s; border-radius: 24px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; transition: .2s; border-radius: 50%; }
.switch input:checked + .slider { background: var(--color-emerald); }
.switch input:checked + .slider:before { transform: translateX(20px); }
.search-field { display: grid; gap: 0.25rem; }
.search-label { font-weight: 700; color: var(--color-gray-700); }
.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-gray-200);
  border-radius: 12px;
  font-weight: 600;
}
.filter-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.75rem; }

/* Round-trip selection banner */
.selection-banner {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.75rem;
  background: #fff;
  border: 1px solid var(--color-gray-100);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 1rem;
}
.selection-pill {
  font-weight: 800;
  color: var(--color-gray-800);
}
.proceed-btn {
  background: var(--color-emerald);
  color: #fff;
}

/* State cards */
.state-card {
  text-align: center;
  padding: 2rem;
  background: #fff;
  border: 1px solid var(--color-gray-100);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  margin: 1rem 0;
}
.state-card.error { border-color: rgba(239,68,68,0.2); }
.spinner {
  width: 48px; height: 48px;
  border: 4px solid var(--color-gray-200);
  border-top-color: var(--color-pink);
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Flight list */
.flight-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
.flight-card {
  background: #fff;
  border: 1px solid var(--color-gray-100);
  border-radius: 16px;
  padding: 1rem;
  box-shadow: var(--shadow-md);
}
.flight-card.inactive { opacity: 0.9; background: var(--color-gray-50); }
.card-head {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;
}
.id { font-weight: 900; display: flex; align-items: center; gap: 0.5rem; }
.plane-icon { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }
.badge {
  padding: 0.25rem 0.5rem; border-radius: 999px; font-weight: 800; font-size: 0.8rem; border: 1px solid transparent;
}

.route-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.port.big { text-align: center; }
.port .iata { font-size: 2rem; font-weight: 900; letter-spacing: 1px; }
.port .label {
  color: var(--color-gray-600);
  font-weight: 600;
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-100);
  border-radius: 10px;
  padding: 0.25rem 0.5rem;
  display: inline-block;
  margin-top: 0.25rem;
}
.duration-pill {
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  background: var(--color-gray-100);
  color: var(--color-gray-800);
  font-weight: 800;
  border: 2px solid var(--color-gray-200);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.info-item {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-100);
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
}
.info-title { font-weight: 800; color: var(--color-gray-700); margin-bottom: 0.25rem; }
.info-value { font-weight: 700; color: var(--color-gray-800); }

.classes-card {
  background: #fff;
  border: 1px dashed var(--color-gray-200);
  border-radius: 12px;
  padding: 0.75rem;
  margin-top: 0.25rem;
}
.classes-title { font-weight: 900; color: var(--color-gray-800); margin-bottom: 0.5rem; }
.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.5rem;
}
.class-box {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-100);
  border-radius: 12px;
  padding: 0.6rem 0.75rem;
}
.class-type { font-weight: 900; }
.class-seats { color: var(--color-gray-700); font-weight: 700; }
.class-price { font-weight: 900; color: var(--color-emerald); }

.card-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
}

/* Buttons */
.btn { padding: 0.6rem 0.9rem; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; }
.btn:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-primary { background: var(--color-pink); color: #fff; }
.btn-secondary { background: var(--color-gray-200); color: var(--color-gray-900); }
.btn-info { background: var(--color-blue); color: #fff; }
.btn-warn { background: var(--color-amber); color: #fff; }
.btn-danger { background: var(--color-red); color: #fff; }

@media (min-width: 1024px) {
  .card-actions { grid-template-columns: repeat(4, 1fr); }
}
</style>