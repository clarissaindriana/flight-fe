<template>
  <div class="booking-list">
    <div class="list-header">
      <h2>Flight Bookings</h2>
      <VButton @click="$emit('create')">Create Booking</VButton>
    </div>

    <div v-if="loading" class="loading">Loading bookings...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="bookings.length === 0" class="empty-state">
      No bookings found.
    </div>

    <div v-else class="bookings-grid">
      <div
        v-for="booking in bookings"
        :key="booking.id"
        class="booking-card"
        @click="$emit('view', booking.id)"
      >
        <div class="booking-header">
          <h3>{{ booking.id }}</h3>
          <span :class="['status-badge', getStatusClass(booking.status)]">
            {{ getStatusText(booking.status) }}
          </span>
        </div>

        <div class="booking-info">
          <p><strong>Flight:</strong> {{ booking.flightId }}</p>
          <p><strong>Class:</strong> {{ booking.classFlightId }}</p>
          <p><strong>Passengers:</strong> {{ booking.passengerCount }}</p>
          <p><strong>Total Price:</strong> ${{ booking.totalPrice }}</p>
          <p><strong>Contact:</strong> {{ booking.contactEmail }}</p>
        </div>

        <div class="booking-actions">
          <VButton size="sm" variant="secondary" @click.stop="$emit('view', booking.id)">
            View Details
          </VButton>
          <VButton
            v-if="booking.status === 1"
            size="sm"
            variant="primary"
            @click.stop="$emit('update', booking.id)"
          >
            Update
          </VButton>
          <VButton
            v-if="booking.status === 1"
            size="sm"
            variant="danger"
            @click.stop="$emit('cancel', booking.id)"
          >
            Cancel
          </VButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VButton from '@/components/common/VButton.vue'
import { useBookingStore } from '@/stores/booking/booking'
import type { Booking } from '@/interfaces/booking.interface'

interface Props {
  flightId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  create: []
  view: [id: string]
  update: [id: string]
  cancel: [id: string]
}>()

const bookingStore = useBookingStore()

const bookings = computed(() =>
  props.flightId
    ? bookingStore.bookings.filter(b => b.flightId === props.flightId)
    : bookingStore.bookings
)

const loading = computed(() => bookingStore.loading)
const error = computed(() => bookingStore.error)

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
</script>

<style scoped>
.booking-list {
  padding: 2rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.list-header h2 {
  margin: 0;
  color: var(--color-gray-800);
}

.bookings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.booking-card {
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.booking-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-pink);
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.booking-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-gray-800);
}

.status-badge {
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

.booking-info p {
  margin: 0.5rem 0;
  color: var(--color-gray-700);
  font-size: 0.9rem;
}

.booking-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-gray-200);
}

.loading, .error, .empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-gray-600);
}

.error {
  color: var(--color-red);
}

.empty-state {
  font-style: italic;
}
</style>