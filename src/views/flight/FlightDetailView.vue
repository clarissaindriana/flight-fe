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

      <!-- Seats overview (staff only: superadmin / flight airline) -->
      <div v-if="isStaff" class="seats">
        <h3>Seats</h3>
        <div v-if="seatStore.loading" class="seats-state">
          <div class="spinner small"></div>
          <span>Loading seats...</span>
        </div>
        <div v-else-if="seatStore.error" class="seats-state error">
          <span>Failed to load seats: {{ seatStore.error }}</span>
        </div>
        <div v-else class="seats-table-wrapper">
          <table class="seats-table">
            <thead>
              <tr>
                <th>Seat Code</th>
                <th>Class</th>
                <th>Status</th>
                <th>Passenger Name</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in seatsForFlight" :key="s.id">
                <td>{{ s.seatCode }}</td>
                <td>{{ s.classType ?? '-' }}</td>
                <td>
                  <span
                    class="seat-badge"
                    :class="s.passengerName ? 'occupied' : 'available'"
                  >
                    {{ s.passengerName ? 'Booked' : 'Available' }}
                  </span>
                </td>
                <td>{{ s.passengerName || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="actions">
        <router-link
          v-if="canUpdateFlight"
          class="btn update"
          :to="`/flights/${encodeURIComponent(flightStore.selectedFlight.id)}/update`"
          :class="{
            disabled: !(
              Number(flightStore.selectedFlight.status) === 1 ||
              Number(flightStore.selectedFlight.status) === 4
            )
          }"
        >
          ✏️ Update
        </router-link>

        <button
          v-if="canCancelFlight"
          class="btn delete"
          @click="cancelFlight"
          :disabled="
            Number(flightStore.selectedFlight.status) === 2 ||
            Number(flightStore.selectedFlight.status) === 3 ||
            Number(flightStore.selectedFlight.status) === 5
          "
        >
          🗑️ Cancel
        </button>

        <button
          v-if="canCreateBooking"
          class="btn book"
          :disabled="!(
              Number(flightStore.selectedFlight.status) === 1 ||
              Number(flightStore.selectedFlight.status) === 4
            ) || flightStore.selectedFlight.isDeleted"
          @click="bookFlight"
        >
          🎟️ Book Flight
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFlightStore } from '@/stores/flight/flight'
import { useAirlineStore } from '@/stores/airline/airline'
import { useAirportStore } from '@/stores/airport/airport'
import { useSeatStore } from '@/stores/seat/seat'
import ClassFlightList from '@/components/classFlight/ClassFlightList.vue'
import { canAccess } from '@/lib/rbac'
import type { Seat } from '@/interfaces/seat.interface'

type SeatWithMeta = Seat & {
  classType?: string | null
  passengerName?: string | null
}

const route = useRoute()
const router = useRouter()
const flightStore = useFlightStore()
const airlineStore = useAirlineStore()
const airportStore = useAirportStore()
const seatStore = useSeatStore()

// RBAC-based capabilities: hide admin-only actions for customers
const canUpdateFlight = canAccess('flights/update')
const canCancelFlight = canAccess('flights/delete')
const canCreateBooking = canAccess('bookings/create')

// Treat roles that can manage flights as staff (superadmin / flight airline)
const isStaff = canUpdateFlight || canCancelFlight

const id = String(route.params.id || '')

const seatsForFlight = computed<SeatWithMeta[]>(() => {
  if (!id) return []
  return (seatStore.byFlight[id] || []) as SeatWithMeta[]
})

onMounted(async () => {
  await Promise.all([
    airlineStore.fetchAirlines(),
    airportStore.fetchAirports(),
  ])
  if (id) {
    await flightStore.fetchFlightDetail(id)
    // Only staff (superadmin / flight airline) see seat details
    if (isStaff) {
      await seatStore.fetchByFlight(id)
    }
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
.flight-detail-view {
  padding: 0;
  max-width: 100%;
  margin: 0 auto;
  background: #ffffff;
  min-height: 100vh;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}
.header h2 { font-size: 1.75rem; font-weight: 800; margin: 0; color: var(--color-gray-900); }
.back-link {
  text-decoration: none;
  font-weight: 600;
  color: var(--color-gray-700);
  padding: 0.5rem 1rem;
  border: 1.5px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}
.back-link:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: #fff;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-gray-200);
  margin: 2rem;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
}
.spinner {
  width: 48px; height: 48px; border: 4px solid var(--color-gray-200); border-top-color: #F9CDD5;
  border-radius: 50%; margin: 0 auto 1rem; animation: spin 1s linear infinite;
}
.spinner.small {
  width: 1.5rem;
  height: 1.5rem;
  margin: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon, .error-icon { font-size: 3rem; margin-bottom: 1rem; }

.detail-card {
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-xl);
  padding: 2rem;
  box-shadow: var(--shadow-sm);
  max-width: 1100px;
  margin: 2rem auto;
  margin-left: 2rem;
  margin-right: 2rem;
}
.detail-card.inactive { opacity: 0.7; background: var(--color-gray-50); }

.summary { display: grid; gap: 0.75rem; margin-bottom: 1.5rem; }
.line { display: grid; grid-template-columns: 200px 1fr; gap: 1rem; align-items: center; }
.k { font-weight: 600; color: var(--color-gray-600); font-size: 0.9rem; }
.v {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  padding: 0.65rem 0.875rem;
  font-weight: 500;
}
.v.id { font-weight: 800; color: var(--color-gray-900); }
.muted { color: var(--color-gray-500); margin-left: 0.5rem; font-size: 0.875rem; }

.badge {
  font-size: 0.75rem; padding: 0.4rem 0.75rem; border-radius: var(--radius-full); font-weight: 700; border: none;
}
.badge-scheduled { background: #dbeafe; color: #1e40af; }
.badge-inflight { background: #d1fae5; color: #065f46; }
.badge-finished { background: #f3f4f6; color: #374151; }
.badge-delayed { background: #fee2e2; color: #991b1b; }
.badge-cancelled { background: #fce7f3; color: #9f1239; }

.classes { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--color-gray-200); }

.seats {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-gray-200);
}

.seats-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-gray-600);
  margin-top: 0.75rem;
}

.seats-state.error {
  color: var(--color-red);
}

.seats-table-wrapper {
  margin-top: 0.75rem;
  overflow-x: auto;
}

.seats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.seats-table th,
.seats-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-gray-200);
  text-align: left;
}

.seats-table th {
  font-weight: 700;
  color: var(--color-gray-700);
  background: var(--color-gray-50);
}

.seat-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.seat-badge.available {
  background: rgba(16, 185, 129, 0.1);
  color: #047857;
}

.seat-badge.occupied {
  background: rgba(249, 115, 22, 0.12);
  color: #c2410c;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-gray-200);
  flex-wrap: wrap;
}
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 700;
  text-align: center;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 140px;
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn.update { background: #f59e0b; color: #fff; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
.btn.delete { background: #ef4444; color: #fff; }
.btn.book { background: #7A8450; color: #fff; box-shadow: 0 2px 8px rgba(122, 132, 80, 0.35); }
.btn.book:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(122, 132, 80, 0.45); }
.btn.disabled { opacity: 0.6; pointer-events: none; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>