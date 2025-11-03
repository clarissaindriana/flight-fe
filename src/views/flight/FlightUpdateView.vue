<template>
  <div class="flight-update-view">
    <div class="header">
      <h2>✏️ Update Flight</h2>
      <router-link class="back-link" :to="`/flights/${encodeURIComponent(String(route.params.id))}`">← Back to Detail</router-link>
    </div>

    <div v-if="loadingPage" class="loading-state">
      <div class="spinner"></div>
      <p>Loading flight...</p>
    </div>

    <div v-else-if="loadError" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Failed to load flight</h3>
      <p>{{ loadError }}</p>
    </div>

    <div v-else-if="!flight" class="empty-state">
      <div class="empty-icon">🛩️</div>
      <h3>No data</h3>
      <p>Flight not found</p>
    </div>

    <div v-else class="card" :class="{ inactive: flight.isDeleted }">
      <div class="info">
        <div class="row"><div class="k">Flight</div><div class="v strong">{{ flight.id }}</div></div>
        <div class="row">
          <div class="k">Status</div>
          <div class="v">
            <span class="badge" :class="statusBadge">
              {{ statusText }}
            </span>
            <span v-if="isNotUpdatable" class="note">Only Scheduled or Delayed flights can be updated.</span>
          </div>
        </div>
        <div class="row"><div class="k">Airline</div><div class="v">{{ airlineStore.getAirlineName(flight.airlineId) }}</div></div>
        <div class="row"><div class="k">Airplane</div><div class="v">{{ flight.airplaneId }} <span v-if="airplaneCapacity">— Capacity {{ airplaneCapacity }} seats</span></div></div>
        <div class="row">
          <div class="k">Route</div>
          <div class="v">
            {{ airportStore.getAirportLabel(flight.originAirportCode) }} →
            {{ airportStore.getAirportLabel(flight.destinationAirportCode) }}
          </div>
        </div>
      </div>

      <form class="form" @submit.prevent="handleSubmit">
        <!-- Schedule -->
        <div class="section">
          <h3>Schedule</h3>
          <div class="grid">
            <div class="field">
              <label class="label">Departure Time <span class="req">*</span></label>
              <input
                class="control"
                type="datetime-local"
                v-model="form.departureTimeInput"
                :min="minDeparture"
                :disabled="isNotUpdatable || submitting"
              />
              <div v-if="errors.departureTime" class="error">{{ errors.departureTime }}</div>
            </div>
            <div class="field">
              <label class="label">Arrival Time <span class="req">*</span></label>
              <input
                class="control"
                type="datetime-local"
                v-model="form.arrivalTimeInput"
                :min="form.departureTimeInput || minDeparture"
                :disabled="isNotUpdatable || submitting"
              />
              <div v-if="errors.arrivalTime" class="error">{{ errors.arrivalTime }}</div>
            </div>
          </div>

          <div v-if="departureMovedLater" class="hint delay">
            Changing departure time to a later time will mark status as Delayed automatically.
          </div>
        </div>

        <!-- Terminal / Gate / Baggage / Facilities -->
        <div class="section">
          <h3>Facilities & Location</h3>
          <div class="grid">
            <VInput
              label="Terminal"
              required
              v-model="form.terminal"
              placeholder="e.g. T3"
              :error="errors.terminal"
              :readonly="isNotUpdatable"
            />
            <VInput
              label="Gate"
              required
              v-model="form.gate"
              placeholder="e.g. A12"
              :error="errors.gate"
              :readonly="isNotUpdatable"
            />
          </div>
          <div class="grid">
            <VInput
              label="Baggage Allowance (kg)"
              type="number"
              required
              :min="0"
              step="1"
              v-model="form.baggageAllowance"
              :error="errors.baggageAllowance"
              :readonly="isNotUpdatable"
            />
            <VInput
              label="Facilities (optional)"
              v-model="form.facilities"
              placeholder="e.g. WiFi, meal, entertainment"
              :readonly="isNotUpdatable"
            />
          </div>
        </div>

        <!-- Classes editor -->
        <div class="section">
          <h3>Classes</h3>
          <div class="note">
            Update per-class seat capacity and price. Reducing seat capacity below booked seats is not allowed.
          </div>

          <div v-for="(c, idx) in form.classes" :key="c.id" class="class-row">
            <div class="row-head">
              <div class="class-title">{{ c.classType }}</div>
              <div class="booked">Booked: {{ classBookedSeats(idx) }}</div>
            </div>
            <div class="row-grid">
              <VInput
                label="Seat Capacity"
                type="number"
                required
                :min="classBookedSeats(idx) || 0"
                step="1"
                v-model="c.seatCapacity"
                :error="classErrors[idx]?.seatCapacity"
                :readonly="isNotUpdatable"
              />
              <VInput
                label="Price"
                type="number"
                required
                :min="1"
                step="1"
                v-model="c.price"
                :error="classErrors[idx]?.price"
                :readonly="isNotUpdatable"
              />
            </div>
          </div>

          <div class="hint">
            Total class seats: <strong>{{ totalClassSeats }}</strong>
            <span v-if="airplaneCapacity">/ Capacity: <strong>{{ airplaneCapacity }}</strong></span>
          </div>

          <div v-if="errors.classes" class="error">{{ errors.classes }}</div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <button type="submit" class="btn primary" :disabled="submitting || isNotUpdatable || !isFormValid">
            {{ submitting ? 'Saving...' : 'Save Changes' }}
          </button>
          <router-link class="btn ghost" :to="`/flights/${encodeURIComponent(flight.id)}`">Cancel</router-link>
        </div>

        <div v-if="submitError" class="error mt">{{ submitError }}</div>
        <div v-if="submitSuccess" class="success mt">Flight updated successfully. Redirecting...</div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VInput from '@/components/common/VInput.vue'
import { useFlightStore } from '@/stores/flight/flight'
import { useAirlineStore } from '@/stores/airline/airline'
import { useAirportStore } from '@/stores/airport/airport'
import { useAirplaneStore } from '@/stores/airplane/airplane'
import { classFlightService } from '@/services/classflight.service'
import type { Flight } from '@/interfaces/flight.interface'
import type { Airplane } from '@/interfaces/airplane.interface'
import type { ClassFlight } from '@/interfaces/classflight.interface'

const route = useRoute()
const router = useRouter()
const flightStore = useFlightStore()
const airlineStore = useAirlineStore()
const airportStore = useAirportStore()
const airplaneStore = useAirplaneStore()

const submitting = ref(false)
const submitError = ref<string | null>(null)
const submitSuccess = ref(false)
const loadingPage = ref(true)
const loadError = ref<string | null>(null)

const id = computed(() => String(route.params.id || ''))

const flight = computed<Flight | null>(() => flightStore.selectedFlight)

const statusText = computed(() => (flight.value ? flightStore.statusText(flight.value.status) : ''))
const statusBadge = computed(() => (flight.value ? flightStore.statusBadgeClass(flight.value.status) : ''))
const isNotUpdatable = computed(() => {
  if (!flight.value) return true
  const s = Number(flight.value.status)
  return !(s === 1 || s === 4)
})

const selectedAirplane = computed<Airplane | undefined>(() =>
  flight.value ? airplaneStore.airplanes.find(a => a.id === flight.value!.airplaneId) : undefined
)
const airplaneCapacity = computed(() => selectedAirplane.value?.seatCapacity ?? null)

type EditableClass = {
  id: number
  classType: string
  seatCapacity: number | string
  price: number | string
  seats?: ClassFlight['seats']
}

const original = reactive({
  departureTime: '' as string,
  classes: [] as EditableClass[],
})

const form = reactive({
  departureTimeInput: '',
  arrivalTimeInput: '',
  terminal: '',
  gate: '',
  baggageAllowance: '' as number | string,
  facilities: '' as string,
  classes: [] as EditableClass[],
})

const errors = reactive<Record<string, string>>({})
const classErrors = reactive<Record<number, { seatCapacity?: string; price?: string }>>({})

const minDeparture = computed(() => {
  // departureTime must be >= now (can't set to past)
  const now = new Date()
  return formatForInput(now)
})

const departureMovedLater = computed(() => {
  if (!original.departureTime || !form.departureTimeInput) return false
  return new Date(form.departureTimeInput).getTime() > new Date(original.departureTime).getTime()
})

const totalClassSeats = computed(() => form.classes.reduce((acc, c) => acc + (toNumber(c.seatCapacity) || 0), 0))

function classBookedSeats(idx: number): number {
  const seats = form.classes[idx]?.seats || []
  return seats.filter(s => s.isBooked).length
}

function toNumber(v: number | string | null | undefined): number {
  if (v === null || v === undefined || v === '') return NaN
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

function formatForInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mi = pad(date.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function fromIsoToInput(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return formatForInput(d)
}

function inputToBackend(input: string): string {
  if (!input) return ''
  return `${input}:00`
}

function cloneEditableClasses(list: ClassFlight[]): EditableClass[] {
  return list.map(c => ({
    id: c.id,
    classType: c.classType,
    seatCapacity: c.seatCapacity,
    price: c.price,
    seats: c.seats,
  }))
}

async function preload() {
  try {
    loadingPage.value = true
    loadError.value = null
    await Promise.all([
      airlineStore.fetchAirlines(),
      airportStore.fetchAirports(),
      airplaneStore.fetchAirplanes({ isDeleted: false }),
    ])
    if (!id.value) {
      loadError.value = 'Missing flight id'
      return
    }
    await flightStore.fetchFlightDetail(id.value)
    if (!flight.value) {
      loadError.value = 'Flight not found'
      return
    }
    // Build form from flight detail
    form.departureTimeInput = fromIsoToInput(flight.value.departureTime)
    form.arrivalTimeInput = fromIsoToInput(flight.value.arrivalTime)
    form.terminal = flight.value.terminal
    form.gate = flight.value.gate
    form.baggageAllowance = flight.value.baggageAllowance
    form.facilities = flight.value.facilities || ''
    form.classes = cloneEditableClasses(flight.value.classes)

    // Keep a snapshot for comparison
    original.departureTime = fromIsoToInput(flight.value.departureTime)
    original.classes = cloneEditableClasses(flight.value.classes)
  } catch (e: any) {
    loadError.value = e?.response?.data?.message || (e instanceof Error ? e.message : 'Failed to load data')
  } finally {
    loadingPage.value = false
  }
}

onMounted(preload)

watch(
  () => [form.departureTimeInput, form.arrivalTimeInput, form.terminal, form.gate, form.baggageAllowance],
  () => validate(),
  { deep: true }
)
watch(
  () => form.classes.map(c => `${c.id}:${c.seatCapacity}:${c.price}`).join('|'),
  () => validate()
)

const isFormValid = computed(() => {
  validate()
  return Object.keys(errors).length === 0 && Object.keys(classErrors).length === 0
})

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  Object.keys(classErrors).forEach(k => delete classErrors[Number(k)])

  if (!form.departureTimeInput) errors.departureTime = 'Departure time is required'
  if (!form.arrivalTimeInput) errors.arrivalTime = 'Arrival time is required'
  if (!form.terminal) errors.terminal = 'Terminal is required'
  if (!form.gate) errors.gate = 'Gate is required'
  if (form.baggageAllowance === '' || isNaN(toNumber(form.baggageAllowance)) || toNumber(form.baggageAllowance) < 0) {
    errors.baggageAllowance = 'Baggage allowance must be ≥ 0'
  }

  if (form.departureTimeInput && form.arrivalTimeInput) {
    const dep = new Date(form.departureTimeInput).getTime()
    const arr = new Date(form.arrivalTimeInput).getTime()
    if (!(arr > dep)) {
      errors.arrivalTime = 'Arrival must be after departure'
    }
    // departure >= now
    const now = Date.now()
    if (dep < now) {
      errors.departureTime = 'Departure cannot be in the past'
    }
  }

  // classes
  if (!form.classes.length) {
    errors.classes = 'There must be at least one class'
  }

  // per class & booking constraints
  form.classes.forEach((c, idx) => {
    const e: { seatCapacity?: string; price?: string } = {}
    const cap = toNumber(c.seatCapacity)
    const booked = classBookedSeats(idx)
    if (!Number.isFinite(cap) || cap <= 0) e.seatCapacity = 'Seat capacity must be a positive number'
    if (Number.isFinite(cap) && cap < booked) e.seatCapacity = `Cannot be less than booked seats (${booked})`
    const price = toNumber(c.price)
    if (!Number.isFinite(price) || price <= 0) e.price = 'Price must be a positive number'
    if (Object.keys(e).length) classErrors[idx] = e
  })

  // total seats vs airplane capacity
  if (airplaneCapacity.value !== null) {
    if (totalClassSeats.value > (airplaneCapacity.value as number)) {
      errors.classes = `Total seats (${totalClassSeats.value}) exceed airplane capacity (${airplaneCapacity.value})`
    }
  }
}

function changedClasses(): { id: number; seatCapacity: number; price: number }[] {
  const result: { id: number; seatCapacity: number; price: number }[] = []
  const byId = new Map(original.classes.map(c => [c.id, c]))
  for (const c of form.classes) {
    const prev = byId.get(c.id)
    const seatCapacity = toNumber(c.seatCapacity)
    const price = toNumber(c.price)
    if (!prev || !Number.isFinite(seatCapacity) || !Number.isFinite(price)) continue
    if (seatCapacity !== prev.seatCapacity || price !== prev.price) {
      result.push({ id: c.id, seatCapacity, price })
    }
  }
  return result
}

async function handleSubmit() {
  validate()
  if (!isFormValid.value || !flight.value) return
  if (isNotUpdatable.value) return

  submitError.value = null
  submitting.value = true
  try {
    // 1) Update flight core fields
    await flightStore.updateFlight({
      id: flight.value.id,
      departureTime: inputToBackend(form.departureTimeInput),
      arrivalTime: inputToBackend(form.arrivalTimeInput),
      terminal: form.terminal,
      gate: form.gate,
      baggageAllowance: toNumber(form.baggageAllowance),
      facilities: form.facilities || '',
      // classes on /flight/update are ignored by backend current impl; do per-class next
    })

    // 2) Update classes individually if changed
    const updates = changedClasses()
    if (updates.length) {
      await Promise.all(updates.map(u => classFlightService.updateClassFlight(u)))
    }

    // 3) Refresh and go to detail
    await flightStore.fetchFlightDetail(flight.value.id)
    submitSuccess.value = true
    setTimeout(() => router.push(`/flights/${encodeURIComponent(flight.value!.id)}`), 600)
  } catch (e: any) {
    submitError.value = e?.response?.data?.message || (e instanceof Error ? e.message : 'Failed to update flight')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.flight-update-view { padding: 2rem; max-width: 1100px; margin: 0 auto; }
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

.card {
  background: #fff; border: 1px solid var(--color-gray-100); border-radius: 16px; padding: 1rem; box-shadow: var(--shadow-md);
}
.card.inactive { opacity: 0.9; background: var(--color-gray-50); }

.info { display: grid; gap: 0.5rem; margin-bottom: 1rem; }
.row { display: grid; grid-template-columns: 200px 1fr; gap: 0.75rem; padding: 0.25rem 0; }
.k { font-weight: 700; color: var(--color-gray-700); }
.v { background: var(--color-gray-50); border: 1px solid var(--color-gray-100); border-radius: 8px; padding: 0.5rem 0.75rem; }
.v.strong { font-weight: 800; }
.note { margin-left: 0.5rem; color: var(--color-gray-600); }

.badge {
  font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 999px; font-weight: 800; border: 1px solid transparent;
}
.badge-scheduled { background: #e0f2fe; color: #0369a1; border-color: rgba(3,105,161,.2); }
.badge-inflight { background: #dcfce7; color: #047857; border-color: rgba(4,120,87,.2); }
.badge-finished { background: #f5f5f5; color: #525252; border-color: rgba(82,82,82,.2); }
.badge-delayed { background: #fee2e2; color: #b91c1c; border-color: rgba(185,28,28,.2); }
.badge-cancelled { background: #ffe4e6; color: #9f1239; border-color: rgba(159,18,57,.2); }

.form .section { margin-top: 1rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem; }
.field { display: flex; flex-direction: column; gap: 0.4rem; }
.label { font-weight: 700; color: var(--color-gray-700); }
.req { color: var(--color-red); }
.control {
  width: 100%; padding: 0.75rem 1rem; border: 2px solid var(--color-gray-200); border-radius: 12px;
  font-size: 1rem; background: #fff;
}
.control:focus { outline: none; border-color: var(--color-pink); box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1); }

.class-row { border: 1px solid var(--color-gray-100); border-radius: 12px; padding: 0.75rem; margin: 0.5rem 0; background: #fff; }
.row-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.class-title { font-weight: 800; }
.booked { color: var(--color-gray-700); }
.row-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.5rem; }

.hint { color: var(--color-gray-700); font-size: 0.95rem; margin-top: 0.25rem; }
.hint.delay { color: #b91c1c; font-weight: 700; }

.error { color: var(--color-red); font-weight: 600; }
.success { color: var(--color-emerald); font-weight: 700; }
.mt { margin-top: 0.75rem; }

.footer { display: flex; gap: 0.5rem; margin-top: 1rem; }
.btn {
  padding: 0.7rem 1.2rem; border-radius: 12px; border: none; cursor: pointer; font-weight: 800;
}
.btn.primary { background: var(--color-pink); color: #fff; }
.btn.ghost { background: var(--color-gray-200); }
.btn:disabled { opacity: 0.7; cursor: not-allowed; }
</style>