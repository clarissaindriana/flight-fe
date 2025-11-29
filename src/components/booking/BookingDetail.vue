<template>
  <div class="booking-detail">
    <div v-if="loading" class="loading">Loading booking details...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="booking" class="booking-content">
      <div class="detail-header">
        <h2>Booking Details</h2>
        <div class="header-actions">
          <VButton
            v-if="booking && !booking.isDeleted && canUpdateBooking && (booking.status === 1 || booking.status === 2) && (flightStatus === 1 || flightStatus === 4)"
            variant="primary"
            @click="$emit('update', booking.id)"
          >
            Update Booking
          </VButton>
          <VButton
            v-if="booking && !booking.isDeleted && canCancelBooking && (booking.status === 1 || booking.status === 2) && (flightStatus === 1 || flightStatus === 4)"
            variant="danger"
            @click="$emit('cancel', booking.id)"
          >
            Cancel Booking
          </VButton>
        </div>
      </div>

      <!-- Flight status warnings -->
      <div v-if="flightStatus === 5" class="warning-banner cancelled">
        ⚠️ This flight has been cancelled. The booking is displayed in read-only mode for archive purposes.
      </div>
      <div v-else-if="flightStatus === 3" class="warning-banner finished">
        ℹ️ This flight has finished. Seat assignments are shown as historical information.
      </div>

      <div class="detail-grid">
        <!-- Booking Information -->
        <div class="detail-section">
          <h3>Booking Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Booking Code:</label>
              <span>{{ booking.id }}</span>
            </div>
            <div class="info-item">
              <label>Flight ID:</label>
              <span>{{ booking.flightId }}</span>
            </div>
            <div class="info-item">
              <label>Class Flight:</label>
              <span>{{ booking.classType || booking.classFlightId }}</span>
            </div>
            <div class="info-item">
              <label>Status:</label>
              <span :class="['status-badge', getStatusClass(booking.status)]">
                {{ getStatusText(booking.status) }}
              </span>
            </div>
            <div class="info-item">
              <label>Passenger Count:</label>
              <span>{{ booking.passengerCount }}</span>
            </div>
            <div class="info-item">
              <label>Total Price:</label>
              <span>${{ booking.totalPrice }}</span>
            </div>
            <div class="info-item">
              <label>Created At:</label>
              <span>{{ formatDate(booking.createdAt) }}</span>
            </div>
            <div class="info-item">
              <label>Updated At:</label>
              <span>{{ formatDate(booking.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="detail-section">
          <h3>Contact Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Email:</label>
              <span>{{ booking.contactEmail }}</span>
            </div>
            <div class="info-item">
              <label>Phone:</label>
              <span>{{ booking.contactPhone }}</span>
            </div>
          </div>
        </div>

        <!-- Passengers -->
        <div class="detail-section">
          <h3>Passengers</h3>
          <div v-if="booking.passengers && booking.passengers.length > 0" class="passengers-list">
            <div
              v-for="passenger in booking.passengers"
              :key="passenger.id"
              class="passenger-card"
            >
              <div class="passenger-info">
                <h4>{{ passenger.fullName }}</h4>
                <p><strong>Birth Date:</strong> {{ formatDate(passenger.birthDate) }}</p>
                <p><strong>Gender:</strong> {{ getGenderText(passenger.gender) }}</p>
                <p><strong>ID/Passport:</strong> {{ passenger.idPassport }}</p>
                <p><strong>Seat:</strong> {{ getSeatCode(String(passenger.id)) }}</p>
              </div>
            </div>
          </div>
          <div v-else class="no-passengers">
            No passenger information available.
          </div>
        </div>
      </div>
    </div>

    <div v-else class="not-found">
      Booking not found.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import VButton from '@/components/common/VButton.vue'
import { useBookingStore } from '@/stores/booking/booking'
import { usePassengerStore } from '@/stores/passenger/passenger'
import { useFlightStore } from '@/stores/flight/flight'
import type { Booking } from '@/interfaces/booking.interface'
import { canAccess } from '@/lib/rbac'

interface Props {
  bookingId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [id: string]
  cancel: [id: string]
}>()

const bookingStore = useBookingStore()
const passengerStore = usePassengerStore()
const flightStore = useFlightStore()

const canUpdateBooking = canAccess('bookings/update')
const canCancelBooking = canAccess('bookings/cancel')

const booking = computed(() => bookingStore.currentBooking)
const loading = computed(() => bookingStore.loading)
const error = computed(() => bookingStore.error)

// Load related flight detail for warning/context
watch(booking, async (b) => {
  if (b?.flightId) {
    try {
      await flightStore.fetchFlightDetail(b.flightId)
    } catch (e) {
      // ignore
    }
  }
}, { immediate: true })

const flight = computed(() => flightStore.selectedFlight)
const flightStatus = computed(() => flight.value?.status ?? null)

const getStatusText = (status: number): string => {
  return bookingStore.getBookingStatusText(status)
}

const getStatusClass = (status: number): string => {
  switch (status) {
    case 1: return 'status-unpaid'
    case 2: return 'status-paid'
    case 3: return 'status-cancelled'
    case 4: return 'status-rescheduled'
    default: return 'status-unknown'
  }
}

const getGenderText = (gender: number): string => {
  return passengerStore.getGenderText(gender)
}

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  } catch {
    return dateString
  }
}

// Resolve seat code for a passenger from booking.seatAssignments
const getSeatCode = (passengerId: string): string => {
  const sa = booking.value?.seatAssignments?.find(a => a.passengerId === passengerId)
  return sa?.seatCode ?? '—'
}
</script>

<style scoped>
.booking-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.detail-header h2 {
  margin: 0;
  color: var(--color-gray-800);
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.detail-grid {
  display: grid;
  gap: 2rem;
}

.detail-section {
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.detail-section h3 {
  margin: 0 0 1.5rem 0;
  color: var(--color-gray-800);
  font-size: 1.25rem;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.9rem;
}

.info-item span {
  color: var(--color-gray-800);
  font-size: 0.95rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-unpaid {
  background: var(--color-yellow-100);
  color: var(--color-yellow-800);
}

.status-paid {
  background: var(--color-green-100);
  color: var(--color-green-800);
}

.status-cancelled {
  background: var(--color-red-100);
  color: var(--color-red-800);
}

.status-rescheduled {
  background: var(--color-blue-100);
  color: var(--color-blue-800);
}

.status-unknown {
  background: var(--color-gray-100);
  color: var(--color-gray-800);
}

.passengers-list {
  display: grid;
  gap: 1rem;
}

.passenger-card {
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.passenger-card h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-gray-800);
  font-size: 1rem;
}

.passenger-card p {
  margin: 0.25rem 0;
  color: var(--color-gray-700);
  font-size: 0.9rem;
}

.no-passengers {
  text-align: center;
  color: var(--color-gray-500);
  font-style: italic;
  padding: 2rem;
}

/* Flight Warning Banners */
.warning-banner {
  margin-bottom: 1rem;
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  border: 1px solid transparent;
}
.warning-banner.cancelled {
  background: var(--color-red-50);
  color: var(--color-red-800);
  border-color: var(--color-red-200);
}
.warning-banner.finished {
  background: var(--color-blue-50);
  color: var(--color-blue-800);
  border-color: var(--color-blue-200);
}

.loading, .error, .not-found {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-gray-600);
}

.error {
  color: var(--color-red);
}

.not-found {
  font-style: italic;
}
</style>