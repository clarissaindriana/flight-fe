<template>
  <div class="flight-detail-view">
    <div class="header">
      <h2>✈️ Flight Detail</h2>
      <router-link class="back-link" to="/flights">← Back to Flights</router-link>
    </div>

    <div v-if="flightStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading flight detail...</p>
    </div>

    <div v-else-if="flightStore.error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Failed to load flight</h3>
      <p>{{ flightStore.error }}</p>
    </div>

    <div v-else-if="!flightStore.selectedFlight" class="empty-state">
      <div class="empty-icon">🛩️</div>
      <h3>No data</h3>
      <p>Flight not found</p>
    </div>

    <div v-else class="detail-card" :class="{ inactive: flightStore.selectedFlight.isDeleted }">
      <div class="summary">
        <div class="line">
          <div class="k">Flight Number</div>
          <div class="v id">{{ flightStore.selectedFlight.id }}</div>
        </div>
        <div class="line">
          <div class="k">Status</div>
          <div class="v">
            <span class="badge" :class="flightStore.statusBadgeClass(flightStore.selectedFlight.status)">
              {{ flightStore.statusText(flightStore.selectedFlight.status) }}
            </span>
          </div>
        </div>
        <div class="line">
          <div class="k">Airline</div>
          <div class="v">{{ airlineStore.getAirlineName(flightStore.selectedFlight.airlineId) }}</div>
        </div>
        <div class="line">
          <div class="k">Airplane</div>
          <div class="v">{{ flightStore.selectedFlight.airplaneId }}</div>
        </div>
        <div class="line">
          <div class="k">Route</div>
          <div class="v">
            {{ airportStore.getAirportLabel(flightStore.selectedFlight.originAirportCode) }}
            →
            {{ airportStore.getAirportLabel(flightStore.selectedFlight.destinationAirportCode) }}
          </div>
        </div>
        <div class="line">
          <div class="k">Schedule</div>
          <div class="v">
            {{ fmtDT(flightStore.selectedFlight.departureTime) }} → {{ fmtDT(flightStore.selectedFlight.arrivalTime) }}
            <span class="muted">({{ durationText(flightStore.selectedFlight.departureTime, flightStore.selectedFlight.arrivalTime) }})</span>
          </div>
        </div>
        <div class="line">
          <div class="k">Terminal / Gate</div>
          <div class="v">{{ flightStore.selectedFlight.terminal }} / {{ flightStore.selectedFlight.gate }}</div>
        </div>
        <div class="line">
          <div class="k">Baggage</div>
          <div class="v">{{ flightStore.selectedFlight.baggageAllowance }} kg</div>
        </div>
        <div class="line" v-if="flightStore.selectedFlight.facilities">
          <div class="k">Facilities</div>
          <div class="v">{{ flightStore.selectedFlight.facilities }}</div>
        </div>
      </div>

      <div class="classes">
        <h3>Classes</h3>
        <ClassFlightList :classes="flightStore.selectedFlight.classes" />
      </div>

      <div class="actions">
        <router-link class="btn update" :to="`/flights/${encodeURIComponent(flightStore.selectedFlight.id)}/update`" :class="{ disabled: Number(flightStore.selectedFlight.status) === 3 }">
          ✏️ Update
        </router-link>
        <button class="btn delete" @click="cancelFlight" :disabled="Number(flightStore.selectedFlight.status) === 2 || Number(flightStore.selectedFlight.status) === 3">
          🗑️ Cancel
        </button>
        <button class="btn book"
          :disabled="Number(flightStore.selectedFlight.status) !== 1 || flightStore.selectedFlight.isDeleted"
          @click="bookFlight">
          🎟️ Book Flight
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFlightStore } from '@/stores/flight/flight'
import { useAirlineStore } from '@/stores/airline/airline'
import { useAirportStore } from '@/stores/airport/airport'
import ClassFlightList from '@/components/classFlight/ClassFlightList.vue'

const route = useRoute()
const router = useRouter()
const flightStore = useFlightStore()
const airlineStore = useAirlineStore()
const airportStore = useAirportStore()

const id = String(route.params.id || '')

onMounted(async () => {
  await Promise.all([
    airlineStore.fetchAirlines(),
    airportStore.fetchAirports(),
  ])
  if (id) {
    await flightStore.fetchFlightDetail(id)
  }
})

function fmtDT(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString()
}

function durationText(dep: string, arr: string) {
  const ms = new Date(arr).getTime() - new Date(dep).getTime()
  if (ms <= 0) return '-'
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

async function cancelFlight() {
  if (!flightStore.selectedFlight) return
  if (!confirm(`Cancel flight ${flightStore.selectedFlight.id}?`)) return
  try {
    await flightStore.deleteFlight(flightStore.selectedFlight.id)
    await flightStore.fetchFlights()
    router.push('/flights')
  } catch {
    // error message surfaced via store
  }
}

function bookFlight() {
  if (!flightStore.selectedFlight) return
  router.push(`/bookings/create?flightId=${encodeURIComponent(flightStore.selectedFlight.id)}`)
}
</script>

<style scoped>
.flight-detail-view { padding: 2rem; max-width: 1100px; margin: 0 auto; }
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.header h2 { font-size: 2rem; font-weight: 800; margin: 0; }
.back-link { text-decoration: none; font-weight: 700; color: var(--color-blue); }

.loading-state, .error-state, .empty-state {
  text-align: center; padding: 3rem 2rem; background: #fff; border-radius: 16px;
  border: 1px solid var(--color-gray-100); margin: 1.5rem 0;
}
.spinner {
  width: 48px; height: 48px; border: 4px solid var(--color-gray-200); border-top-color: var(--color-pink);
  border-radius: 50%; margin: 0 auto 1rem; animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.detail-card {
  background: #fff; border: 1px solid var(--color-gray-100); border-radius: 16px; padding: 1rem; box-shadow: var(--shadow-md);
}
.detail-card.inactive { opacity: 0.9; background: var(--color-gray-50); }

.summary { display: grid; gap: 0.5rem; margin-bottom: 1rem; }
.line { display: grid; grid-template-columns: 200px 1fr; gap: 0.75rem; align-items: center; }
.k { font-weight: 700; color: var(--color-gray-700); }
.v { background: var(--color-gray-50); border: 1px solid var(--color-gray-100); border-radius: 8px; padding: 0.5rem 0.75rem; }
.v.id { font-weight: 800; }
.muted { color: var(--color-gray-600); margin-left: 0.5rem; }

.badge {
  font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 999px; font-weight: 800; border: 1px solid transparent;
}
.badge-scheduled { background: #e0f2fe; color: #0369a1; border-color: rgba(3,105,161,.2); }
.badge-inflight { background: #dcfce7; color: #047857; border-color: rgba(4,120,87,.2); }
.badge-finished { background: #f5f5f5; color: #525252; border-color: rgba(82,82,82,.2); }
.badge-delayed { background: #fee2e2; color: #b91c1c; border-color: rgba(185,28,28,.2); }
.badge-cancelled { background: #ffe4e6; color: #9f1239; border-color: rgba(159,18,57,.2); }

.classes { margin-top: 1rem; }
.class-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; }
.class-card {
  border: 1px solid var(--color-gray-100); border-radius: 12px; padding: 0.75rem; background: #fff;
}
.row { display: grid; grid-template-columns: 140px 1fr; gap: 0.5rem; margin: 0.25rem 0; }
.label { font-weight: 700; color: var(--color-gray-700); }
.value { background: var(--color-gray-50); border: 1px solid var(--color-gray-100); border-radius: 8px; padding: 0.25rem 0.5rem; }
.value.strong { font-weight: 800; }

.seats { margin-top: 0.5rem; }
.seats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; margin-top: 0.5rem; }
.seat-chip {
  display: flex; align-items: center; justify-content: space-between;
  border: 1px solid var(--color-gray-200); border-radius: 8px; padding: 0.25rem 0.5rem;
  background: #fafafa;
}
.seat-chip.booked { background: #fee2e2; border-color: #fecaca; }
.seat-chip .code { font-weight: 800; }
.seat-chip .status { font-size: 0.8rem; color: var(--color-gray-700); }

.actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-top: 1rem; }
.btn { padding: 0.6rem; border: none; border-radius: 10px; cursor: pointer; font-weight: 800; text-align: center; }
.btn.update { background: var(--color-amber); color: #fff; text-decoration: none; display: inline-block; }
.btn.delete { background: var(--color-red); color: #fff; }
.btn.book { background: var(--color-pink); color: #fff; }
.btn.disabled { opacity: 0.7; pointer-events: none; }
</style>