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

      <!-- Seat Selection (Optional) -->
      <div class="form-section">
        <h3>Seat Selection (Optional)</h3>
        <p class="form-note">Leave empty to keep current seat assignments</p>
        <div v-if="availableSeats.length > 0" class="seats-grid">
          <div
            v-for="seat in availableSeats"
            :key="seat.id"
            :class="['seat-option', { selected: selectedSeats.includes(seat.id) }]"
            @click="toggleSeat(seat.id)"
          >
            {{ seat.seatCode }}
          </div>
        </div>
        <div v-else class="no-seats">
          No additional seats available for this class.
        </div>
      </div>

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
import VButton from '@/components/common/VButton.vue'
import { useBookingStore } from '@/stores/booking/booking'
import { useSeatStore } from '@/stores/seat/seat'
import type { UpdateBookingRequest } from '@/interfaces/booking.interface'

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

const booking = computed(() => bookingStore.currentBooking)

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

const isFormValid = computed(() => {
  return formData.value.contactEmail &&
         formData.value.contactPhone &&
         /\S+@\S+\.\S+/.test(formData.value.contactEmail)
})

const toggleSeat = (seatId: number) => {
  const index = selectedSeats.value.indexOf(seatId)
  if (index > -1) {
    selectedSeats.value.splice(index, 1)
  } else {
    selectedSeats.value.push(seatId)
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
    const bookingData: UpdateBookingRequest = {
      ...formData.value,
      seatIds: selectedSeats.value.length > 0 ? selectedSeats.value : undefined
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

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-200);
}
</style>