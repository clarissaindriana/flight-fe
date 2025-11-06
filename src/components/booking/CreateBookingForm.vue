<template>
  <div class="create-booking-form" :class="lockedPassengers ? 'variant-return' : 'variant-departure'">
    <h2>{{ lockedPassengers ? 'Create Return Flight Booking' : 'Create Departure Flight Booking' }}</h2>
    <div class="step-banner" :class="lockedPassengers ? 'return' : 'departure'">
      {{ lockedPassengers ? 'Step 2/2 • Return Flight' : 'Step 1/2 • Departure Flight' }}
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
          label="Phone"
          type="tel"
          placeholder="Enter contact phone"
          required
          :error="errors.contactPhone"
        />
      </div>

      <!-- Passengers -->
      <div class="form-section">
        <h3>Passengers</h3>
        <VInput
          v-model.number="formData.passengerCount"
          label="Number of Passengers"
          type="number"
          :min="1"
          :max="10"
          required
          :error="errors.passengerCount"
        />

        <div v-for="(passenger, index) in formData.passengers" :key="index" class="passenger-card">
          <h4>Passenger {{ index + 1 }}</h4>
          <VSelect
            v-model="passenger.passengerId"
            label="Select Passenger"
            placeholder="Choose from existing passengers"
            :options="passengerOptions"
            required
            :disabled="lockedPassengers"
            :error="errors.passengers?.[index]?.passengerId"
          />
          <VSelect
            v-model="passenger.seatId"
            label="Seat"
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
import { usePassengerStore } from '@/stores/passenger/passenger'
import { useAirlineStore } from '@/stores/airline/airline'
import { useAirportStore } from '@/stores/airport/airport'
import type { AddBookingRequest } from '@/interfaces/booking.interface'
import type { AddPassengerRequest } from '@/interfaces/passenger.interface'

interface Props {
  flightId?: string
  classFlightId?: number
  prefillPassengers?: string[]
  prefillContact?: { contactEmail?: string; contactPhone?: string }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [bookingData: AddBookingRequest, selectedPassengerIds: string[]]
  cancel: []
}>()

const flightStore = useFlightStore()
const classFlightStore = useClassFlightStore()
const seatStore = useSeatStore()
const passengerStore = usePassengerStore()
const airlineStore = useAirlineStore()
const airportStore = useAirportStore()

const loading = ref(false)
const errors = ref<Record<string, any>>({})

const formData = ref({
  flightId: props.flightId || '',
  classFlightId: props.classFlightId || 0,
  contactEmail: '',
  contactPhone: '',
  passengerCount: 1,
  passengers: [{
    passengerId: '',
    seatId: undefined
  }]
} as any)

const genderOptions = [
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' },
  { value: 3, label: 'Other' }
]

const passengerOptions = computed(() =>
  passengerStore.passengers.map(passenger => ({
    value: passenger.id,
    label: `${passenger.fullName} (${passenger.idPassport})`
  }))
)

const flightOptions = computed(() =>
  flightStore.flights
    .filter(flight => flight.status === 1) // Only scheduled flights
    .map(flight => ({
      value: flight.id,
      label: `${flight.id} - ${flight.originAirportCode} to ${flight.destinationAirportCode}`
    }))
)

// Lock flight selection when navigated from Flight view
const lockedFlight = computed(() => !!props.flightId)
// When prefilledPassengers is provided (round-trip step 2), lock passenger selection
const lockedPassengers = computed(() => Array.isArray(props.prefillPassengers) && props.prefillPassengers.length > 0)

const fmtDT = (iso?: string) => {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString() } catch { return String(iso) }
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
  return classFlights
    .map(cf => ({
      value: cf.id,
      label: `${cf.classType}`
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
      .map((p: any, idx: number) => (idx === rowIndex ? undefined : p.seatId))
      .filter((id: any) => id !== undefined)
      .map((id: any) => Number(id))
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
      label: seat.seatCode
    }))
}

const isFormValid = computed(() => {
  const baseOk =
    !!formData.value.flightId &&
    !!formData.value.classFlightId &&
    !!formData.value.contactEmail &&
    !!formData.value.contactPhone &&
    formData.value.passengers.length === formData.value.passengerCount &&
    formData.value.passengers.every((p: any) => !!p.passengerId)

  if (!baseOk) return false

  // Seats optional. But if any is chosen:
  const seatIds = formData.value.passengers
    .map((p: any) => p.seatId)
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
watch(() => formData.value.passengerCount, (val) => {
  let count = Number(val) || 1
  if (count < 1) count = 1
  if (count > 10) count = 10
  if (count !== formData.value.passengerCount) {
    formData.value.passengerCount = count
  }
  while (formData.value.passengers.length < count) {
    formData.value.passengers.push({ passengerId: '', seatId: undefined })
  }
  if (formData.value.passengers.length > count) {
    formData.value.passengers.splice(count)
  }
})

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

  // Validate passenger selections
  formData.value.passengers.forEach((passenger: any, index: number) => {
    if (!passenger.passengerId) {
      if (!errors.value.passengers) errors.value.passengers = []
      errors.value.passengers[index] = { ...(errors.value.passengers[index] || {}), passengerId: 'Passenger selection is required' }
    }
  })

  // If any seat is selected, require seat for all selected passengers
  const anySeatSelected = formData.value.passengers.some((p: any) => p.seatId !== undefined)
  if (anySeatSelected) {
    formData.value.passengers.forEach((p: any, index: number) => {
      if (p.seatId === undefined) {
        if (!errors.value.passengers) errors.value.passengers = []
        errors.value.passengers[index] = { ...(errors.value.passengers[index] || {}), seatId: 'Seat is required when any seats are selected' }
      }
    })
  }

  // Enforce unique seat selection across all passengers
  const seatIds: number[] = formData.value.passengers
    .map((p: any) => p.seatId)
    .filter((id: any) => id !== undefined)
    .map((id: any) => Number(id))

  const seen = new Map<number, number[]>()
  seatIds.forEach((id, idx) => {
    const arr = seen.get(id) ?? []
    arr.push(idx)
    seen.set(id, arr)
  })
  // Mark duplicates with errors
  for (const [id, idxs] of seen.entries()) {
    if (idxs.length > 1) {
      if (!errors.value.passengers) errors.value.passengers = []
      idxs.forEach(i => {
        errors.value.passengers[i] = { ...(errors.value.passengers[i] || {}), seatId: 'Duplicate seat selected' }
      })
    }
  }

  const hasPassengerErrors = !!(errors.value.passengers && errors.value.passengers.some((e: any) => e && (e.passengerId || e.seatId)))
  return Object.keys(errors.value).length === 0 && !hasPassengerErrors
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  try {
    const seatIds = (formData.value.passengers
      .map((p: any) => p.seatId)
      .filter((id: any) => id !== undefined)
      .map((id: any) => Number(id))) as number[]

    if (seatIds.length > 0 && seatIds.length !== formData.value.passengerCount) {
      // enforce all-or-none seat selection
      errors.value.passengers = errors.value.passengers || []
      formData.value.passengers.forEach((p: any, index: number) => {
        if (p.seatId === undefined) {
          errors.value.passengers[index] = { ...(errors.value.passengers[index] || {}), seatId: 'Seat is required when any seats are selected' }
        }
      })
      return
    }

    // Build passengers payload from selected passenger IDs
    const passengersPayload: AddPassengerRequest[] = formData.value.passengers.map((p: any) => {
      const rec = passengerStore.passengers.find(x => x.id === p.passengerId)
      if (!rec) {
        throw new Error('Selected passenger not found')
      }
      return {
        fullName: rec.fullName,
        birthDate: rec.birthDate,
        gender: rec.gender,
        idPassport: rec.idPassport
      }
    })

    const bookingData: AddBookingRequest = {
      flightId: formData.value.flightId,
      classFlightId: formData.value.classFlightId,
      contactEmail: formData.value.contactEmail,
      contactPhone: formData.value.contactPhone,
      passengerCount: formData.value.passengerCount,
      passengers: passengersPayload,
      seatIds: seatIds.length > 0 ? seatIds : undefined
    }

    const selectedPassengerIds: string[] = formData.value.passengers.map((p: any) => p.passengerId)

    emit('submit', bookingData, selectedPassengerIds)
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
    passengerStore.fetchPassengers()
  ])
  if (formData.value.flightId) {
    // Ensure detailed flight data and class list are present when flight is locked
    await flightStore.fetchFlightDetail(formData.value.flightId)
    await classFlightStore.fetchByFlight(formData.value.flightId)
  }

  // Apply prefill for round-trip step 2 (same passengers and contact)
  if (props.prefillPassengers && props.prefillPassengers.length > 0) {
    formData.value.passengerCount = props.prefillPassengers.length
    formData.value.passengers = props.prefillPassengers.map(id => ({
      passengerId: id,
      seatId: undefined
    }))
  }
  if (props.prefillContact) {
    if (props.prefillContact.contactEmail) formData.value.contactEmail = props.prefillContact.contactEmail
    if (props.prefillContact.contactPhone) formData.value.contactPhone = props.prefillContact.contactPhone
  }
})

watch(() => formData.value.flightId, async () => {
  if (formData.value.flightId) {
    await classFlightStore.fetchByFlight(formData.value.flightId)
  }
})

watch(() => formData.value.classFlightId, async () => {
  if (formData.value.classFlightId) {
    // Clear selected seats when class changes to avoid cross-class invalid selections
    formData.value.passengers = (formData.value.passengers || []).map((p: any) => ({ ...p, seatId: undefined }))
    await seatStore.fetchByClassFlight(formData.value.classFlightId)
  }
})
</script>

<style scoped>
.create-booking-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.booking-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: var(--color-white);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-gray-200);
}

.form-section h3 {
  margin: 0 0 1rem 0;
  color: var(--color-gray-800);
  font-size: 1.25rem;
  font-weight: 600;
}

.passenger-card {
  background: var(--color-gray-50);
  padding: 1rem;
  border-radius: var(--radius-md);
  margin-top: 1rem;
  border: 1px solid var(--color-gray-200);
}

.passenger-card h4 {
  margin: 0 0 1rem 0;
  color: var(--color-gray-700);
  font-size: 1rem;
  font-weight: 600;
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
  margin: 0.5rem 0 1rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-weight: 800;
}
.step-banner.departure {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid rgba(29,78,216,.2);
}
.step-banner.return {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid rgba(180,83,9,.2);
}
.variant-return .form-section h3 {
  color: #b45309;
}
</style>