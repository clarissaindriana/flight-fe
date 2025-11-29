<template>
  <div class="flight-create-view">
    <!-- Hero -->
    <div class="hero">
      <div class="hero-icon">🛫</div>
      <div class="hero-text">
        <h1>Create Flight</h1>
        <p>Configure schedule, route, and classes. Airline is auto-filled from the airplane.</p>
      </div>
      <router-link class="btn ghost" to="/flights">← Back to Flights</router-link>
    </div>

    <form class="card" @submit.prevent="handleSubmit">
      <!-- Row 1: Airplane + Derived Airline -->
      <div class="grid">
        <VSelect
          label="Airplane"
          required
          :options="airplaneOptions"
          v-model="form.airplaneId"
          placeholder="Select airplane"
          :error="errors.airplaneId"
        />
        <div class="field">
          <label class="label">Airline</label>
          <div class="pill" :class="{ muted: !selectedAirlineName }">
            {{ selectedAirlineName || 'Select airplane to autofill airline' }}
          </div>
        </div>
      </div>

      <!-- Capacity hint -->
      <div v-if="selectedAirplane" class="hint">
        Airplane <strong>{{ selectedAirplane.id }}</strong> — Model <strong>{{ selectedAirplane.model }}</strong>,
        Capacity <strong>{{ selectedAirplane.seatCapacity }}</strong> seats.
        Current classes total: <strong>{{ totalClassSeats }}</strong>.
      </div>

      <!-- Row 2: Airports -->
      <div class="section">
        <h3>Route</h3>
        <div class="grid">
          <VSelect
            label="Origin Airport"
            required
            :options="airportOptions"
            v-model="form.originAirportCode"
            placeholder="Select origin"
            :error="errors.originAirportCode"
          />
          <VSelect
            label="Destination Airport"
            required
            :options="airportOptions"
            v-model="form.destinationAirportCode"
            placeholder="Select destination"
            :error="errors.destinationAirportCode"
          />
        </div>
        <div v-if="errors.route" class="error">{{ errors.route }}</div>
      </div>

      <!-- Row 3: Date times -->
      <div class="section">
        <h3>Schedule</h3>
        <div class="grid">
          <div class="field">
            <label class="label">Departure Time <span class="req">*</span></label>
            <input
              class="control"
              type="datetime-local"
              v-model="form.departureTimeInput"
              :min="minDateTimeForCreate"
            />
            <div v-if="errors.departureTime" class="error">{{ errors.departureTime }}</div>
          </div>
          <div class="field">
            <label class="label">Arrival Time <span class="req">*</span></label>
            <input
              class="control"
              type="datetime-local"
              v-model="form.arrivalTimeInput"
              :min="form.departureTimeInput || minDateTimeForCreate"
            />
            <div v-if="errors.arrivalTime" class="error">{{ errors.arrivalTime }}</div>
          </div>
        </div>
      </div>

      <!-- Row 4: Terminal/Gate -->
      <div class="section">
        <h3>Location & Facilities</h3>
        <div class="grid">
          <VInput
            label="Terminal"
            required
            v-model="form.terminal"
            placeholder="e.g. T3"
            :error="errors.terminal"
          />
          <VInput
            label="Gate"
            required
            v-model="form.gate"
            placeholder="e.g. A12"
            :error="errors.gate"
          />
        </div>

        <!-- Row 5: Baggage / Facilities -->
        <div class="grid">
          <VInput
            label="Baggage Allowance (kg)"
            type="number"
            required
            :min="0"
            step="1"
            v-model="form.baggageAllowance"
            :error="errors.baggageAllowance"
          />
          <VInput
            label="Facilities (optional)"
            v-model="form.facilities"
            placeholder="e.g. WiFi, meal, entertainment"
          />
        </div>
      </div>

      <!-- Classes editor -->
      <div class="section classes">
        <div class="classes-header">
          <h3>Class Configuration</h3>
          <div class="classes-actions">
            <button type="button" class="btn add" @click="addClassRow" :disabled="availableClassTypes.length === 0">
              ＋ Add Class
            </button>
          </div>
        </div>

        <div v-if="errors.classes" class="error mb">{{ errors.classes }}</div>

        <div v-for="(c, idx) in form.classes" :key="idx" class="class-row">
          <div class="row-grid">
            <VSelect
              label="Class Type"
              required
              :options="classTypeOptionsForRow(idx)"
              v-model="c.classType"
              placeholder="Select type"
              :error="classErrors[idx]?.classType"
            />
            <VInput
              label="Seat Capacity"
              type="number"
              required
              :min="1"
              step="1"
              v-model="c.seatCapacity"
              :error="classErrors[idx]?.seatCapacity"
            />
            <VInput
              label="Price"
              type="number"
              required
              :min="1"
              step="1"
              v-model="c.price"
              :error="classErrors[idx]?.price"
            />
          </div>

          <div class="class-row-actions">
            <button type="button" class="btn remove" @click="removeClassRow(idx)" :disabled="form.classes.length <= 1">
              🗑 Remove
            </button>
          </div>
        </div>

        <div class="hint">
          Total class seats: <strong>{{ totalClassSeats }}</strong>
          <span v-if="selectedAirplane">/ Capacity: <strong>{{ selectedAirplane.seatCapacity }}</strong></span>
        </div>
      </div>

      <!-- Form footer -->
      <div class="footer">
        <button type="submit" class="btn primary" :disabled="submitting || !isFormValid">
          {{ submitting ? 'Creating...' : 'Create Flight' }}
        </button>
        <button type="button" class="btn ghost" @click="resetForm" :disabled="submitting">Reset</button>
      </div>

      <!-- Global error -->
      <div v-if="submitError" class="error mt">{{ submitError }}</div>
      <div v-if="submitSuccess" class="success mt">Flight created successfully. Redirecting...</div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VInput from '@/components/common/VInput.vue'
import VSelect from '@/components/common/VSelect.vue'
import { useAirlineStore } from '@/stores/airline/airline'
import { useAirplaneStore } from '@/stores/airplane/airplane'
import { useAirportStore } from '@/stores/airport/airport'
import { useFlightStore } from '@/stores/flight/flight'
import type { AddFlightRequest } from '@/interfaces/flight.interface'
import type { Airplane } from '@/interfaces/airplane.interface'

const router = useRouter()
const airlineStore = useAirlineStore()
const airplaneStore = useAirplaneStore()
const airportStore = useAirportStore()
const flightStore = useFlightStore()

const submitting = ref(false)
const submitError = ref<string | null>(null)
const submitSuccess = ref(false)

const CLASS_TYPES = ['Economy', 'Business', 'First'] as const

type ClassRow = {
  classType: string
  seatCapacity: number | string
  price: number | string
}

const form = reactive({
  airlineId: '',            // auto-filled from selected airplane
  airplaneId: '',
  originAirportCode: '',
  destinationAirportCode: '',
  departureTimeInput: '',   // 'YYYY-MM-DDTHH:mm'
  arrivalTimeInput: '',
  terminal: '',
  gate: '',
  baggageAllowance: '' as number | string,
  facilities: '' as string,
  classes: [] as ClassRow[],
})

const errors = reactive<Record<string, string>>({})
const classErrors = reactive<Record<number, { classType?: string; seatCapacity?: string; price?: string }>>({})

const now = new Date()
const minDateTimeForCreate = computed(() => formatForInput(new Date(now.getTime())))

const selectedAirplane = computed<Airplane | undefined>(() =>
  airplaneStore.airplanes.find(a => a.id === form.airplaneId)
)

const selectedAirlineName = computed(() =>
  form.airlineId ? airlineStore.getAirlineName(form.airlineId) : ''
)

// Auto-fill airlineId when airplane changes
watch(
  () => form.airplaneId,
  () => {
    const ap = selectedAirplane.value
    form.airlineId = ap?.airlineId || ''
    // Re-validate when airplane changes
    validate()
  }
)

const airplaneOptions = computed(() =>
  [{ value: '', label: 'Select airplane' }].concat(
    airplaneStore.airplanes
      .filter(a => !a.isDeleted)
      .map(a => ({
        value: a.id,
        label: `${a.id} — ${a.model} (${a.seatCapacity} seats)`,
      }))
  )
)

const airportOptions = computed(() =>
  [{ value: '', label: 'Select airport' }].concat(airportStore.airportOptions)
)

const usedClassTypes = computed(() => form.classes.map(c => c.classType).filter(Boolean))
const availableClassTypes = computed(() => CLASS_TYPES.filter(ct => !usedClassTypes.value.includes(ct)))
const totalClassSeats = computed(() =>
  form.classes.reduce((acc, c) => acc + (toNumber(c.seatCapacity) || 0), 0)
)

function classTypeOptionsForRow(idx: number) {
  const current = form.classes[idx]?.classType
  const options = CLASS_TYPES.map(ct => ({
    value: ct,
    label: ct,
    disabled: usedClassTypes.value.includes(ct) && ct !== current,
  }))
  return [{ value: '', label: 'Select type', disabled: true }].concat(options)
}

function addClassRow() {
  const nextType = availableClassTypes.value[0] || ''
  form.classes.push({
    classType: nextType,
    seatCapacity: '',
    price: '',
  })
}

function removeClassRow(index: number) {
  form.classes.splice(index, 1)
}

function resetForm() {
  form.airlineId = ''
  form.airplaneId = ''
  form.originAirportCode = ''
  form.destinationAirportCode = ''
  form.departureTimeInput = ''
  form.arrivalTimeInput = ''
  form.terminal = ''
  form.gate = ''
  form.baggageAllowance = ''
  form.facilities = ''
  form.classes = [{
    classType: availableClassTypes.value[0] || 'Economy',
    seatCapacity: '',
    price: '',
  }]
  submitError.value = null
  submitSuccess.value = false
  Object.keys(errors).forEach(k => delete errors[k])
  Object.keys(classErrors).forEach(k => delete classErrors[Number(k)])
}

function toNumber(v: number | string | null | undefined): number {
  if (v === null || v === undefined || v === '') return NaN
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

function formatForInput(date: Date): string {
  // Returns 'YYYY-MM-DDTHH:mm' in local time
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mi = pad(date.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function toBackendDateTime(input: string): string {
  // Ensure seconds for backend LocalDateTime parsing
  if (!input) return ''
  return `${input}:00`
}

const isFormValid = computed(() => {
  validate()
  return Object.keys(errors).length === 0 && Object.keys(classErrors).length === 0
})

watch(
  () => [form.airplaneId, form.classes.map(c => c.seatCapacity).join(','), form.classes.map(c => c.classType).join(',')],
  () => validate(),
  { deep: true }
)

watch(
  () => [form.departureTimeInput, form.arrivalTimeInput, form.originAirportCode, form.destinationAirportCode, form.baggageAllowance, form.terminal, form.gate],
  () => validate(),
  { deep: true }
)

function validate() {
  // clear errors
  Object.keys(errors).forEach(k => delete errors[k])
  Object.keys(classErrors).forEach(k => delete classErrors[Number(k)])

  // airplane required
  if (!form.airplaneId) errors.airplaneId = 'Airplane is required'

  // route required and distinct
  if (!form.originAirportCode) errors.originAirportCode = 'Origin is required'
  if (!form.destinationAirportCode) errors.destinationAirportCode = 'Destination is required'
  if (form.originAirportCode && form.destinationAirportCode && form.originAirportCode === form.destinationAirportCode) {
    errors.route = 'Origin and destination cannot be the same'
  }

  // schedule
  if (!form.departureTimeInput) errors.departureTime = 'Departure time is required'
  if (!form.arrivalTimeInput) errors.arrivalTime = 'Arrival time is required'
  if (form.departureTimeInput && form.arrivalTimeInput) {
    const dep = new Date(form.departureTimeInput)
    const arr = new Date(form.arrivalTimeInput)
    if (!(arr.getTime() > dep.getTime())) {
      errors.arrivalTime = 'Arrival must be after departure'
    }
    // departure >= now
    const now = Date.now()
    if (dep.getTime() < now) {
      errors.departureTime = 'Departure cannot be in the past'
    }
  }

  // terminal/gate/baggage
  if (!form.terminal) errors.terminal = 'Terminal is required'
  if (!form.gate) errors.gate = 'Gate is required'
  if (form.baggageAllowance === '' || isNaN(toNumber(form.baggageAllowance)) || toNumber(form.baggageAllowance) < 0) {
    errors.baggageAllowance = 'Baggage allowance must be ≥ 0'
  }

  // classes
  if (!form.classes.length) {
    errors.classes = 'At least one class is required'
  }

  const typeSet = new Set<string>()
  form.classes.forEach((c, idx) => {
    const e: { classType?: string; seatCapacity?: string; price?: string } = {}
    if (!c.classType) e.classType = 'Class type is required'
    if (c.classType) {
      if (typeSet.has(c.classType)) {
        e.classType = 'Duplicate class type'
      } else {
        typeSet.add(c.classType)
      }
    }
    const cap = toNumber(c.seatCapacity)
    if (!Number.isFinite(cap) || cap <= 0) e.seatCapacity = 'Seat capacity must be a positive number'
    const price = toNumber(c.price)
    if (!Number.isFinite(price) || price <= 0) e.price = 'Price must be a positive number'
    if (Object.keys(e).length) classErrors[idx] = e
  })

  // total seats <= airplane capacity
  if (selectedAirplane.value) {
    if (totalClassSeats.value > selectedAirplane.value.seatCapacity) {
      errors.classes = `Total seats (${totalClassSeats.value}) exceed airplane capacity (${selectedAirplane.value.seatCapacity})`
    }
  }
}

async function handleSubmit() {
  validate()
  if (!isFormValid.value) return

  // Build payload (airlineId auto-filled from airplane)
  const payload: AddFlightRequest = {
    airlineId: form.airlineId,
    airplaneId: form.airplaneId,
    originAirportCode: form.originAirportCode,
    destinationAirportCode: form.destinationAirportCode,
    departureTime: toBackendDateTime(form.departureTimeInput),
    arrivalTime: toBackendDateTime(form.arrivalTimeInput),
    terminal: form.terminal,
    gate: form.gate,
    baggageAllowance: toNumber(form.baggageAllowance),
    facilities: form.facilities || null,
    classes: form.classes.map(c => ({
      classType: c.classType,
      seatCapacity: toNumber(c.seatCapacity),
      price: toNumber(c.price),
    })),
  }

  // Basic guard: ensure airlineId exists after airplane selection
  if (!payload.airlineId) {
    submitError.value = 'Selected airplane has no airline. Please choose another airplane.'
    return
  }

  submitError.value = null
  submitting.value = true
  try {
    const created = await flightStore.createFlight(payload)
    submitSuccess.value = true
    setTimeout(() => {
      router.push(`/flights/${encodeURIComponent(created.id)}`)
    }, 600)
  } catch (err: any) {
    submitError.value =
      err?.response?.data?.message ||
      (err instanceof Error ? err.message : 'Failed to create flight')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    airlineStore.fetchAirlines(),
    airplaneStore.fetchAirplanes({ isDeleted: false }),
    airportStore.fetchAirports(),
  ])
  if (form.classes.length === 0) {
    addClassRow()
  }
})
</script>

<style scoped>
.flight-create-view {
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
  padding: 2.5rem 2rem;
  background: #F9CDD5;
  color: #fff;
  margin-bottom: 0;
}
.hero-icon { font-size: 2.5rem; }
.hero-text h1 { margin: 0; font-size: 2rem; font-weight: 800; letter-spacing: -0.01em; }
.hero-text p { margin: 0.5rem 0 0; opacity: 0.95; font-size: 1rem; }
.btn.ghost {
  background: rgba(255,255,255,0.2);
  color: #fff;
  padding: 0.75rem 1.25rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: var(--radius-md);
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}
.btn.ghost:hover {
  background: rgba(255,255,255,0.3);
  border-color: rgba(255,255,255,0.5);
}

/* Card */
.card {
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

.section { margin-top: 1.5rem; }
.section h3 { margin: 0 0 1rem; font-size: 1.1rem; font-weight: 700; color: var(--color-gray-900); }

.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
.field { display: flex; flex-direction: column; gap: 0.5rem; }
.label { font-weight: 600; color: var(--color-gray-700); font-size: 0.9rem; }
.req { color: var(--color-error); }
.control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  background: #fff;
  transition: all 0.2s ease;
  font-weight: 500;
}
.control:focus {
  outline: none;
  border-color: #F9CDD5;
  box-shadow: 0 0 0 3px rgba(249, 205, 213, 0.1);
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  background: var(--color-gray-50);
  border: 1.5px solid var(--color-gray-200);
  font-weight: 600;
  color: var(--color-gray-800);
}
.pill.muted { color: var(--color-gray-500); font-weight: 500; }

.hint { color: var(--color-gray-600); font-size: 0.9rem; margin: 0.5rem 0 1rem; }

.error { color: var(--color-error); font-weight: 600; font-size: 0.875rem; }
.success { color: var(--color-success); font-weight: 700; }
.mb { margin-bottom: 0.75rem; }
.mt { margin-top: 1rem; }

/* Classes */
.classes { border-top: 1px solid var(--color-gray-200); padding-top: 1.5rem; margin-top: 1.5rem; }
.classes-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.classes-actions { display: flex; gap: 0.75rem; }

.class-row {
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 1rem;
  margin-bottom: 1rem;
  background: #fff;
}
.row-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; }
.class-row-actions { display: flex; justify-content: flex-end; margin-top: 0.75rem; }

.footer { display: flex; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--color-gray-200); }
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn.primary { background: #7A8450; color: #fff; box-shadow: 0 2px 8px rgba(122, 132, 80, 0.35); }
.btn.primary:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(122, 132, 80, 0.45); }
.btn.ghost { background: #ffffff; color: var(--color-gray-700); border: 1.5px solid var(--color-gray-200); }
.btn.ghost:hover:not(:disabled) { background: var(--color-gray-50); }
.btn.add { background: var(--color-success); color: #fff; }
.btn.remove { background: var(--color-error); color: #fff; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>