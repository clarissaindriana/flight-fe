<template>
  <div class="create-booking-form" :class="lockedPassengers ? 'variant-return' : 'variant-departure'">
    <div class="form-header">
      <div class="title-group">
        <h2 class="title">
          {{ lockedPassengers ? 'Create Return Booking' : 'Create Booking' }}
        </h2>
        <p class="subtitle">
          {{ lockedPassengers ? 'Same passengers, different flight' : 'Enter passenger and contact details for this flight' }}
        </p>
      </div>
      <div class="step-banner" :class="lockedPassengers ? 'return' : 'departure'">
        {{ lockedPassengers ? 'Step 2 of 2 • Return Flight' : 'Step 1 of 2 • Departure Flight' }}
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="booking-form">
      <!-- Flight Selection -->
      <div class="form-section">
        <h3>Flight Information</h3>
        <div v-if="!lockedFlight">
          <VSelect
            v-model="formData.flightId"
            label="Flight"
            placeholder="Select a flight"
            :options="flightOptions"
            required
            :error="errors.flightId"
          />
        </div>
        <div v-else class="flight-summary">
          <div class="summary-row">
            <span class="k">Flight</span>
            <span class="v">{{ flightSummary }}</span>
          </div>
          <div class="summary-row">
            <span class="k">Route</span>
            <span class="v">{{ routeSummary }}</span>
          </div>
          <div class="summary-row">
            <span class="k">Schedule</span>
            <span class="v">{{ scheduleSummary }}</span>
          </div>
        </div>
        <VSelect
          v-model="formData.classFlightId"
          label="Class"
          placeholder="Select class"
          :options="classFlightOptions"
          required
          :error="errors.classFlightId"
        />
      </div>

      <!-- Contact Information -->
      <div class="form-section">
        <h3>Contact Information</h3>
        <VInput
          v-model="formData.contactEmail"
          label="Email"
          type="email"
          placeholder="Enter contact email"
          required
          :error="errors.contactEmail"
        />
        <VInput
          v-model="formData.contactPhone"
          label="Phone Number"
          type="tel"
          placeholder="Enter contact phone"
          required
          :error="errors.contactPhone"
        />
      </div>

      <!-- Passengers -->
      <div class="form-section">
        <div class="section-header">
          <h3>Passenger Details</h3>
          <p class="section-subtitle">
            Each passenger will be created with the details you provide here.
          </p>
        </div>

        <VInput
          v-model.number="formData.passengerCount"
          label="Number of Passengers"
          type="number"
          :min="1"
          :max="10"
          required
          :error="errors.passengerCount"
        />

        <div
          v-for="(passenger, index) in formData.passengers"
          :key="index"
          class="passenger-card"
        >
          <div class="passenger-header">
            <h4>Passenger {{ index + 1 }}</h4>
            <span v-if="lockedPassengers" class="badge-locked">Locked from previous step</span>
          </div>

          <div class="passenger-grid">
            <VInput
              v-model="passenger.fullName"
              label="Full Name"
              placeholder="Enter full name"
              :disabled="lockedPassengers"
              :error="errors.passengers?.[index]?.fullName"
            />
            <VInput
              v-model="passenger.birthDate"
              label="Birth Date"
              type="date"
              :disabled="lockedPassengers"
              :error="errors.passengers?.[index]?.birthDate"
            />
          </div>

          <div class="passenger-grid">
            <VSelect
              v-model="passenger.gender"
              label="Gender"
              placeholder="Select gender"
              :options="genderOptions"
              :disabled="lockedPassengers"
              :error="errors.passengers?.[index]?.gender"
            />
            <VInput
              v-model="passenger.idPassport"
              label="ID / Passport Number"
              placeholder="Enter ID or passport number"
              :disabled="lockedPassengers"
              :error="errors.passengers?.[index]?.idPassport"
            />
          </div>

          <VSelect
            v-model="passenger.seatId"
            label="Seat (optional)"
            placeholder="Select seat"
            :options="seatOptionsFor(index)"
            :error="errors.passengers?.[index]?.seatId"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <VButton type="button" variant="secondary" @click="$emit('cancel')">
          Cancel
        </VButton>
        <VButton type="submit" :loading="loading" :disabled="!isFormValid">
          Create Booking
        </VButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import VInput from '@/components/common/VInput.vue'
import VSelect from '@/components/common/VSelect.vue'
import VButton from '@/components/common/VButton.vue'
import { useFlightStore } from '@/stores/flight/flight'
import { useClassFlightStore } from '@/stores/classFlight/classflight'
import { useSeatStore } from '@/stores/seat/seat'
import { useAirlineStore } from '@/stores/airline/airline'
import { useAirportStore } from '@/stores/airport/airport'
import type { AddBookingRequest } from '@/interfaces/booking.interface'
import type { AddPassengerRequest } from '@/interfaces/passenger.interface'

interface Props {
  flightId?: string
  classFlightId?: number
  prefillPassengersData?: AddPassengerRequest[]
  prefillContact?: { contactEmail?: string; contactPhone?: string }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [bookingData: AddBookingRequest, passengersSnapshot: AddPassengerRequest[]]
  cancel: []
}>()

const flightStore = useFlightStore()
const classFlightStore = useClassFlightStore()
const seatStore = useSeatStore()
const airlineStore = useAirlineStore()
const airportStore = useAirportStore()

const loading = ref(false)
const errors = ref<Record<string, any>>({})

type PassengerForm = {
  fullName: string
  birthDate: string
  gender: number | null
  idPassport: string
  seatId?: number | undefined
}

const makeEmptyPassenger = (): PassengerForm => ({
  fullName: '',
  birthDate: '',
  gender: null,
  idPassport: '',
  seatId: undefined,
})

const formData = ref({
  flightId: props.flightId || '',
  classFlightId: props.classFlightId || 0,
  contactEmail: '',
  contactPhone: '',
  passengerCount: 1,
  passengers: [makeEmptyPassenger()],
} as any)

const genderOptions = [
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' },
  { value: 3, label: 'Other' },
]

const flightOptions = computed(() =>
  flightStore.flights
    .filter(flight => flight.status === 1) // Only scheduled flights
    .map(flight => ({
      value: flight.id,
      label: `${flight.id} - ${flight.originAirportCode} to ${flight.destinationAirportCode}`,
    })),
)

const lockedFlight = computed(() => !!props.flightId)
const lockedPassengers = computed(() =>
  Array.isArray(props.prefillPassengersData) && props.prefillPassengersData.length > 0,
)

const fmtDT = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return String(iso)
  }
}

const selectedFlight = computed(() => {
  const id = formData.value.flightId
  if (!id) return null
  if (flightStore.selectedFlight && flightStore.selectedFlight.id === id) return flightStore.selectedFlight
  return flightStore.flights.find(f => f.id === id) || null
})

const flightSummary = computed(() => {
  const f = selectedFlight.value as any
  if (!f) return '-'
  const airline = airlineStore.getAirlineName ? airlineStore.getAirlineName(f.airlineId) : f.airlineId
  return `${f.id} • ${airline}`
})

const routeSummary = computed(() => {
  const f = selectedFlight.value as any
  if (!f) return '-'
  const from = airportStore.getAirportLabel ? airportStore.getAirportLabel(f.originAirportCode) : f.originAirportCode
  const to = airportStore.getAirportLabel ? airportStore.getAirportLabel(f.destinationAirportCode) : f.destinationAirportCode
  return `${from} → ${to}`
})

const scheduleSummary = computed(() => {
  const f = selectedFlight.value as any
  if (!f) return '-'
  return `${fmtDT(f.departureTime)} → ${fmtDT(f.arrivalTime)}`
})

const classFlightOptions = computed(() => {
  if (!formData.value.flightId) return []
  const classFlights = classFlightStore.byFlight[formData.value.flightId] || []
  return classFlights.map(cf => ({
    value: cf.id,
    label: `${cf.classType}`,
  }))
})

/**
 * Generate seat options per passenger row.
 * Keeps the current row's chosen seat in the list while excluding seats picked by other rows.
 */
const seatOptionsFor = (rowIndex: number) => {
  if (!formData.value.classFlightId) return []
  const cid = Number(formData.value.classFlightId)
  const seats = seatStore.byClassFlight[cid] || []

  const selectedByOthers = new Set(
    (formData.value.passengers || [])
      .map((p: PassengerForm, idx: number) => (idx === rowIndex ? undefined : p.seatId))
      .filter((id: any) => id !== undefined)
      .map((id: any) => Number(id)),
  )

  const currentSeatId = Number((formData.value.passengers?.[rowIndex]?.seatId) ?? NaN)

  return seats
    .filter(seat => {
      const sid = Number(seat.id)
      if (seat.isBooked) return false
      if (!isNaN(currentSeatId) && sid === currentSeatId) return true
      return !selectedByOthers.has(sid)
    })
    .map(seat => ({
      value: seat.id,
      label: seat.seatCode,
    }))
}

const isFormValid = computed(() => {
  const baseOk =
    !!formData.value.flightId &&
    !!formData.value.classFlightId &&
    !!formData.value.contactEmail &&
    !!formData.value.contactPhone &&
    formData.value.passengers.length === formData.value.passengerCount &&
    formData.value.passengers.every((p: PassengerForm) => !!p.fullName && !!p.birthDate && p.gender != null && !!p.idPassport)

  if (!baseOk) return false

  // Seats optional. But if any is chosen:
  const seatIds = formData.value.passengers
    .map((p: PassengerForm) => p.seatId)
    .filter((id: any) => id !== undefined)
    .map((id: any) => Number(id))

  if (seatIds.length === 0) return true

  // Require all seats chosen
  if (seatIds.length !== formData.value.passengerCount) return false

  // Require uniqueness
  const uniq = new Set(seatIds)
  return uniq.size === seatIds.length
})

/**
 * deprecated: syncing is handled by the passengerCount watcher
 * This no-op prevents double-append issues when users jump values (e.g., 1 -> 10)
 */
const updatePassengerCount = () => {}

// Keep passengers array strictly in sync with passengerCount to avoid overshoot (e.g., duplicate input events)
watch(
  () => formData.value.passengerCount,
  (val) => {
    let count = Number(val) || 1
    if (count < 1) count = 1
    if (count > 10) count = 10
    if (count !== formData.value.passengerCount) {
      formData.value.passengerCount = count
    }
    while (formData.value.passengers.length < count) {
      formData.value.passengers.push(makeEmptyPassenger())
    }
    if (formData.value.passengers.length > count) {
      formData.value.passengers.splice(count)
    }
  },
)

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.flightId) {
    errors.value.flightId = 'Flight is required'
  }

  if (!formData.value.classFlightId) {
    errors.value.classFlightId = 'Class is required'
  }

  if (!formData.value.contactEmail) {
    errors.value.contactEmail = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(formData.value.contactEmail)) {
    errors.value.contactEmail = 'Email is invalid'
  }

  if (!formData.value.contactPhone) {
    errors.value.contactPhone = 'Phone is required'
  }

  if (formData.value.passengerCount < 1 || formData.value.passengerCount > 10) {
    errors.value.passengerCount = 'Passenger count must be between 1 and 10'
  }

  // Validate passenger fields
  formData.value.passengers.forEach((p: PassengerForm, index: number) => {
    const perr: any = {}
    if (!p.fullName) perr.fullName = 'Full name is required'
    if (!p.birthDate) perr.birthDate = 'Birth date is required'
    if (p.gender == null) perr.gender = 'Gender is required'
    if (!p.idPassport) perr.idPassport = 'ID/Passport is required'
    if (Object.keys(perr).length > 0) {
      if (!errors.value.passengers) errors.value.passengers = []
      errors.value.passengers[index] = { ...(errors.value.passengers[index] || {}), ...perr }
    }
  })

  // If any seat is selected, require seat for all selected passengers
  const anySeatSelected = formData.value.passengers.some((p: PassengerForm) => p.seatId !== undefined)
  if (anySeatSelected) {
    formData.value.passengers.forEach((p: PassengerForm, index: number) => {
      if (p.seatId === undefined) {
        if (!errors.value.passengers) errors.value.passengers = []
        errors.value.passengers[index] = {
          ...(errors.value.passengers[index] || {}),
          seatId: 'Seat is required when any seats are selected',
        }
      }
    })
  }

  // Enforce unique seat selection across all passengers
  const seatIds: number[] = formData.value.passengers
    .map((p: PassengerForm) => p.seatId)
    .filter((id: any) => id !== undefined)
    .map((id: any) => Number(id))

  const seen = new Map<number, number[]>()
  seatIds.forEach((id, idx) => {
    const arr = seen.get(id) ?? []
    arr.push(idx)
    seen.set(id, arr)
  })
  // Mark duplicates with errors
  for (const [, idxs] of seen.entries()) {
    if (idxs.length > 1) {
      if (!errors.value.passengers) errors.value.passengers = []
      idxs.forEach(i => {
        errors.value.passengers[i] = {
          ...(errors.value.passengers[i] || {}),
          seatId: 'Duplicate seat selected',
        }
      })
    }
  }

  const hasPassengerErrors = !!(
    errors.value.passengers &&
    errors.value.passengers.some((e: any) => e && (e.fullName || e.birthDate || e.gender || e.idPassport || e.seatId))
  )
  return Object.keys(errors.value).length === 0 && !hasPassengerErrors
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  try {
    const seatIds = (formData.value.passengers
      .map((p: PassengerForm) => p.seatId)
      .filter((id: any) => id !== undefined)
      .map((id: any) => Number(id))) as number[]

    if (seatIds.length > 0 && seatIds.length !== formData.value.passengerCount) {
      // enforce all-or-none seat selection
      errors.value.passengers = errors.value.passengers || []
      formData.value.passengers.forEach((p: PassengerForm, index: number) => {
        if (p.seatId === undefined) {
          errors.value.passengers[index] = {
            ...(errors.value.passengers[index] || {}),
            seatId: 'Seat is required when any seats are selected',
          }
        }
      })
      return
    }

    // Build passengers payload directly from manual input
    const passengersPayload: AddPassengerRequest[] = formData.value.passengers.map((p: PassengerForm) => ({
      fullName: p.fullName,
      birthDate: p.birthDate as any,
      gender: Number(p.gender),
      idPassport: p.idPassport,
    }))

    const bookingData: AddBookingRequest = {
      flightId: formData.value.flightId,
      classFlightId: formData.value.classFlightId,
      contactEmail: formData.value.contactEmail,
      contactPhone: formData.value.contactPhone,
      passengerCount: formData.value.passengerCount,
      passengers: passengersPayload,
      seatIds: seatIds.length > 0 ? seatIds : undefined,
    }

    emit('submit', bookingData, passengersPayload)
  } catch (error) {
    console.error('Form submission error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    airlineStore.fetchAirlines(),
    airportStore.fetchAirports(),
    flightStore.fetchFlights(),
  ])

  if (formData.value.flightId) {
    // Ensure detailed flight data and class list are present when flight is locked
    await flightStore.fetchFlightDetail(formData.value.flightId)
    await classFlightStore.fetchByFlight(formData.value.flightId)
  }

  // Apply prefill for round-trip step 2 (same passengers and contact)
  if (props.prefillPassengersData && props.prefillPassengersData.length > 0) {
    formData.value.passengerCount = props.prefillPassengersData.length
    formData.value.passengers = props.prefillPassengersData.map(p => ({
      fullName: p.fullName,
      birthDate: p.birthDate as any,
      gender: p.gender as any,
      idPassport: p.idPassport,
      seatId: undefined,
    }))
  }

  if (props.prefillContact) {
    if (props.prefillContact.contactEmail) formData.value.contactEmail = props.prefillContact.contactEmail
    if (props.prefillContact.contactPhone) formData.value.contactPhone = props.prefillContact.contactPhone
  }

  // If class is already chosen (e.g., future prefill), ensure seats are loaded
  if (formData.value.classFlightId) {
    const cid = Number(formData.value.classFlightId)
    if (!Number.isNaN(cid) && cid > 0) {
      formData.value.classFlightId = cid
      await seatStore.fetchByClassFlight(cid)
    }
  }
})

watch(
  () => formData.value.flightId,
  async () => {
    if (formData.value.flightId) {
      await classFlightStore.fetchByFlight(formData.value.flightId)
    }
  },
)

watch(
  () => formData.value.classFlightId,
  async (val) => {
    const cid = Number(val)
    if (!cid || Number.isNaN(cid)) return

    // Normalize to number so downstream logic is consistent
    if (formData.value.classFlightId !== cid) {
      formData.value.classFlightId = cid
    }

    // Clear selected seats when class changes to avoid cross-class invalid selections
    formData.value.passengers = (formData.value.passengers || []).map((p: PassengerForm) => ({
      ...p,
      seatId: undefined,
    }))

    await seatStore.fetchByClassFlight(cid)
  },
)
</script>

<style scoped>
.create-booking-form {
  max-width: 900px;
  margin: -3rem auto 2.5rem;
  padding: 2rem 2.25rem 2.25rem;
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-gray-100);
  position: relative;
  z-index: 1;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.title-group .title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--color-gray-900);
}

.title-group .subtitle {
  margin: 0.35rem 0 0;
  color: var(--color-gray-600);
  font-size: 0.95rem;
}

.booking-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: var(--color-gray-50);
  padding: 1.5rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-gray-200);
}

.form-section h3 {
  margin: 0 0 0.75rem 0;
  color: var(--color-gray-800);
  font-size: 1.2rem;
  font-weight: 700;
}

.section-header {
  margin-bottom: 0.75rem;
}

.section-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-gray-600);
}

.passenger-card {
  background: var(--color-white);
  padding: 1.1rem 1.25rem;
  border-radius: var(--radius-lg);
  margin-top: 1rem;
  border: 1px solid var(--color-gray-200);
  box-shadow: var(--shadow-sm);
}

.passenger-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.passenger-header h4 {
  margin: 0;
  color: var(--color-gray-800);
  font-size: 1rem;
  font-weight: 700;
}

.badge-locked {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-full);
  background: rgba(249, 205, 213, 0.2);
  color: var(--color-secondary-strong);
}

.passenger-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.9rem;
  margin-bottom: 0.75rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-200);
}

/* Step banner and variant accents */
.step-banner {
  padding: 0.55rem 0.9rem;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.step-banner.departure {
  background: rgba(249, 205, 213, 0.16);
  color: var(--color-secondary-strong);
  border: 1px solid rgba(249, 205, 213, 0.5);
}

.step-banner.return {
  background: rgba(122, 132, 80, 0.12);
  color: var(--color-secondary-strong);
  border: 1px solid rgba(122, 132, 80, 0.4);
}

.flight-summary {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: var(--radius-md);
  background: rgba(249, 205, 213, 0.08);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.9rem;
}

.summary-row .k {
  font-weight: 600;
  color: var(--color-gray-600);
}

.summary-row .v {
  font-weight: 600;
  color: var(--color-gray-900);
  text-align: right;
}

@media (max-width: 768px) {
  .create-booking-form {
    margin: -2.5rem 1rem 2rem;
    padding: 1.5rem 1.5rem 1.75rem;
  }

  .form-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>