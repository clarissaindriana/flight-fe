<template>
  <div class="update-booking-form">
    <h2>Update Flight Booking</h2>

    <form @submit.prevent="handleSubmit" class="booking-form">
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

      <!-- Passengers Management -->
      <div class="form-section">
        <h3>Passengers</h3>

        <div class="existing-passengers">
          <div v-for="(p, idx) in existingPassengers" :key="p.id" class="passenger-row">
            <div class="row-header">
              <h4>Passenger {{ idx + 1 }}</h4>
              <label class="remove-toggle">
                <input type="checkbox" v-model="p.removed" />
                Remove
              </label>
            </div>
            <div class="grid-2">
              <VInput v-model="p.fullName" label="Full Name" required />
              <VInput v-model="p.idPassport" label="ID/Passport" required />
              <VInput v-model="p.birthDate" type="text" label="Birth Date" required />
              <VSelect
                v-model="p.gender"
                label="Gender"
                :options="genderOptions"
                required
              />
            </div>
            <div class="grid-2">
              <VSelect
                :model-value="p.seatId ?? ''"
                @update:modelValue="(v: string | number) => { p.seatId = (v === '' ? null : Number(v)) }"
                label="Seat"
                :options="seatOptionsForExisting(p.id, p.seatId)"
                :disabled="availableUnbookedCount === 0 && !p.seatId"
                placeholder="Select a seat"
              />
            </div>
          </div>
        </div>

        <div class="new-passengers">
          <h4>Add New Passengers</h4>
          <div
            v-for="(n, nidx) in newPassengers"
            :key="'new-'+nidx"
            class="passenger-row"
          >
            <div class="row-header">
              <h4>New Passenger {{ nidx + 1 }}</h4>
              <VButton type="button" variant="secondary" @click="removeNewPassenger(nidx)">Remove</VButton>
            </div>
            <div class="grid-2">
              <VInput v-model="n.fullName" label="Full Name" required />
              <VInput v-model="n.idPassport" label="ID/Passport" required />
              <VInput v-model="n.birthDate" type="text" label="Birth Date" required />
              <VSelect
                v-model="n.gender"
                label="Gender"
                :options="genderOptions"
                required
              />
            </div>
            <div class="grid-2">
              <VSelect
                :model-value="n.seatId ?? ''"
                @update:modelValue="(v: string | number) => { n.seatId = (v === '' ? null : Number(v)) }"
                label="Seat"
                :options="seatOptionsForNew(nidx, n.seatId)"
                :disabled="availableUnbookedExcludingSelections === 0"
                placeholder="Select a seat"
              />
            </div>
          </div>
          <VButton type="button" variant="primary" @click="addNewPassenger" :disabled="availableCapacityForNew <= 0">+ Add Passenger</VButton>
        </div>
      </div>

      <!-- Seat selection is handled per-passenger above -->

      <!-- Actions -->
      <div class="form-actions">
        <VButton type="button" variant="secondary" @click="$emit('cancel')">
          Cancel
        </VButton>
        <VButton type="submit" :loading="loading" :disabled="!isFormValid">
          Update Booking
        </VButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VInput from '@/components/common/VInput.vue'
import VSelect from '@/components/common/VSelect.vue'
import VButton from '@/components/common/VButton.vue'
import { useBookingStore } from '@/stores/booking/booking'
import { useSeatStore } from '@/stores/seat/seat'
import type { UpdateBookingRequest } from '@/interfaces/booking.interface'
import type { AddPassengerRequest, UpdatePassengerRequest } from '@/interfaces/passenger.interface'

interface Props {
  bookingId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [bookingData: UpdateBookingRequest]
  cancel: []
}>()

const bookingStore = useBookingStore()
const seatStore = useSeatStore()

const loading = ref(false)
const errors = ref<Record<string, string>>({})
const selectedSeats = ref<number[]>([])

// Passengers management state
const existingPassengers = ref<{ id: string; fullName: string; birthDate: string; gender: number; idPassport: string; removed?: boolean; seatId?: number | null }[]>([])
const newPassengers = ref<{ fullName: string; birthDate: string; gender: number; idPassport: string; seatId?: number | null }[]>([])

// Gender options
const genderOptions = [
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' },
  { value: 3, label: 'Other' }
]

const booking = computed(() => bookingStore.currentBooking)
const futureCount = computed(() => {
  return existingPassengers.value.filter(p => !p.removed).length + newPassengers.value.length
})

const formData = ref<UpdateBookingRequest>({
  id: props.bookingId,
  contactEmail: '',
  contactPhone: '',
})

const availableSeats = computed(() => {
  if (!booking.value?.classFlightId) return []
  const seats = seatStore.byClassFlight[booking.value.classFlightId] || []
  return seats.filter(seat => !seat.isBooked)
})

// All seats in class (booked/unbooked)
const allSeatsInClass = computed(() => {
  if (!booking.value?.classFlightId) return []
  return seatStore.byClassFlight[booking.value.classFlightId] || []
})

// Current assignments map (passengerId -> seatId)
const currentAssignmentsMap = computed(() => {
  const m = new Map<string, number>()
  booking.value?.seatAssignments?.forEach(sa => {
    m.set(String(sa.passengerId), sa.seatId)
  })
  return m
})

// Selected seat ids across form (existing not removed + new)
const selectedSeatIds = computed(() => {
  const s = new Set<number>()
  existingPassengers.value.forEach(p => {
    if (!p.removed && p.seatId) s.add(p.seatId)
  })
  newPassengers.value.forEach(n => {
    if (n.seatId) s.add(n.seatId)
  })
  return s
})

const availableUnbookedCount = computed(() => {
  return allSeatsInClass.value.filter(seat => !seat.isBooked).length
})

const availableUnbookedExcludingSelections = computed(() => {
  return allSeatsInClass.value.filter(seat => !seat.isBooked && !selectedSeatIds.value.has(seat.id)).length
})

// Seats currently booked by passengers in this booking (to allow swaps)
const seatsBookedByThisBooking = computed(() => {
  const bookedSet = bookedByThisBookingSet.value
  return allSeatsInClass.value.filter(s => s.isBooked && s.passengerId && bookedSet.has(String(s.passengerId)))
})

// Passengers in this booking (ids) to recognize seats booked by self
const bookedByThisBookingSet = computed(() => {
  const s = new Set<string>()
  booking.value?.passengers?.forEach(p => s.add(String(p.id)))
  return s
})

// Seats freed by removals (only those that had seats)
const freedSeatsFromRemovals = computed(() => {
  let cnt = 0
  const map = currentAssignmentsMap.value
  existingPassengers.value.forEach(p => {
    if (p.removed && map.has(p.id)) cnt += 1
  })
  return cnt
})

// Capacity available to add new passengers (unbooked + freed by removals)
const availableCapacityForNew = computed(() => {
  return availableUnbookedCount.value + freedSeatsFromRemovals.value
})

// Options helpers
const seatOptionsForExisting = (_passengerId: string, currentSeatId?: number | null) => {
  const optsMap = new Map<number, { value: number; label: string }>()
  // Add current seat as first option (even if booked)
  if (currentSeatId) {
    const cs = allSeatsInClass.value.find(s => s.id === currentSeatId)
    if (cs) optsMap.set(cs.id, { value: cs.id, label: `${cs.seatCode} (current)` })
  }

  // Exclude seats already selected by other rows (allow keeping current)
  const othersSelected = new Set(selectedSeatIds.value)
  if (currentSeatId) othersSelected.delete(currentSeatId)

  // Allow swapping with seats booked by this booking (become available to others immediately)
  seatsBookedByThisBooking.value
    .filter(s => !othersSelected.has(s.id))
    .forEach(s => {
      if (!optsMap.has(s.id)) {
        optsMap.set(s.id, { value: s.id, label: `${s.seatCode}` })
      }
    })

  // Add all unbooked seats not chosen by others
  allSeatsInClass.value
    .filter(s => !s.isBooked && !othersSelected.has(s.id))
    .slice()
    .sort((a, b) => a.seatCode.localeCompare(b.seatCode))
    .forEach(s => {
      if (!optsMap.has(s.id)) {
        optsMap.set(s.id, { value: s.id, label: s.seatCode })
      }
    })

  return Array.from(optsMap.values()).sort((a, b) => a.label.localeCompare(b.label))
}

const seatOptionsForNew = (_index: number, _currentSeatId?: number | null) => {
  const optsMap = new Map<number, { value: number; label: string }>()

  // Seats booked by this booking (allow swap)
  seatsBookedByThisBooking.value
    .filter(s => !selectedSeatIds.value.has(s.id))
    .forEach(s => {
      if (!optsMap.has(s.id)) {
        optsMap.set(s.id, { value: s.id, label: s.seatCode })
      }
    })

  // Unbooked seats not chosen by others
  allSeatsInClass.value
    .filter(s => !s.isBooked && !selectedSeatIds.value.has(s.id))
    .slice()
    .sort((a, b) => a.seatCode.localeCompare(b.seatCode))
    .forEach(s => {
      if (!optsMap.has(s.id)) {
        optsMap.set(s.id, { value: s.id, label: s.seatCode })
      }
    })

  return Array.from(optsMap.values()).sort((a, b) => a.label.localeCompare(b.label))
}

const isFormValid = computed(() => {
  return formData.value.contactEmail &&
         formData.value.contactPhone &&
         /\S+@\S+\.\S+/.test(formData.value.contactEmail)
})

const toggleSeat = (_seatId: number) => {
  // deprecated: per-passenger seat selection is used now
}

// Passengers management handlers
const addNewPassenger = () => {
  if (availableCapacityForNew.value <= 0) return
  newPassengers.value.push({
    fullName: '',
    birthDate: '',
    gender: 1,
    idPassport: '',
    seatId: null
  })
}

const removeNewPassenger = (idx: number) => {
  if (idx >= 0 && idx < newPassengers.value.length) {
    newPassengers.value.splice(idx, 1)
  }
}

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.contactEmail) {
    errors.value.contactEmail = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(formData.value.contactEmail)) {
    errors.value.contactEmail = 'Email is invalid'
  }

  if (!formData.value.contactPhone) {
    errors.value.contactPhone = 'Phone is required'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  try {
    const keptPassengers = existingPassengers.value
      .filter(p => !p.removed)
      .map<UpdatePassengerRequest>(p => ({
        id: p.id,
        fullName: p.fullName,
        birthDate: p.birthDate as any,
        gender: p.gender,
        idPassport: p.idPassport
      }))

    const additions = newPassengers.value.map<AddPassengerRequest>(n => ({
      fullName: n.fullName,
      birthDate: n.birthDate as any,
      gender: n.gender,
      idPassport: n.idPassport
    }))

    const targetCount = keptPassengers.length + additions.length

    // Capacity guard: cannot add beyond available capacity (unbooked + freed by removals)
    if (newPassengers.value.length > 0 && newPassengers.value.length > availableCapacityForNew.value) {
      errors.value.passengers = 'Not enough available seats to add new passengers'
      loading.value = false
      return
    }

    // Build seatIds array in the order: kept existing (as shown) then new passengers
    const seatIdsOrdered: number[] = []
    // Map existing id -> seatId
    const existingSeatById = new Map<string, number>()
    existingPassengers.value.forEach(p => {
      if (!p.removed && p.seatId) existingSeatById.set(p.id, p.seatId)
    })
    keptPassengers.forEach(p => {
      const sid = existingSeatById.get(p.id as unknown as string)
      if (sid) seatIdsOrdered.push(sid)
    })
    newPassengers.value.forEach(n => {
      if (n.seatId) seatIdsOrdered.push(n.seatId)
    })

    const bookingData: UpdateBookingRequest = {
      id: formData.value.id,
      contactEmail: formData.value.contactEmail,
      contactPhone: formData.value.contactPhone,
      passengers: keptPassengers.length > 0 ? keptPassengers : undefined,
      newPassengers: additions.length > 0 ? additions : undefined,
      // Include seatIds only when all passengers have explicit selections; otherwise let BE auto-assign remaining
      seatIds: (seatIdsOrdered.length === targetCount) ? seatIdsOrdered : undefined
    }

    emit('submit', bookingData)
  } catch (error) {
    console.error('Form submission error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (booking.value) {
    formData.value.contactEmail = booking.value.contactEmail
    formData.value.contactPhone = booking.value.contactPhone

    // Initialize existing passengers from booking detail
    if (Array.isArray(booking.value.passengers)) {
      // Build current assignments for quick lookup
      const assignMap = new Map<string, number>()
      booking.value.seatAssignments?.forEach(sa => {
        assignMap.set(String(sa.passengerId), sa.seatId)
      })
      existingPassengers.value = booking.value.passengers.map(p => ({
        id: String(p.id),
        fullName: p.fullName,
        birthDate: p.birthDate as any,
        gender: p.gender,
        idPassport: p.idPassport,
        removed: false,
        seatId: assignMap.get(String(p.id)) ?? null
      }))
    }

    // Load available seats for this class
    if (booking.value.classFlightId) {
      await seatStore.fetchByClassFlight(booking.value.classFlightId)
    }
  }
})
</script>

<style scoped>
.update-booking-form {
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

.form-note {
  color: var(--color-gray-600);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  font-style: italic;
}

.seats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.seat-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  background: var(--color-white);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  color: var(--color-gray-700);
}

.seat-option:hover {
  border-color: var(--color-pink);
  background: var(--color-pink-50);
}

.seat-option.selected {
  border-color: var(--color-pink);
  background: var(--color-pink);
  color: white;
}

.no-seats {
  text-align: center;
  color: var(--color-gray-500);
  font-style: italic;
  padding: 2rem;
}

/* Passengers management */
.passenger-row {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-top: 1rem;
}

.row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem 1rem;
}

.remove-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--color-red);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-200);
}
</style>