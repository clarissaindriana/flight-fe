<template>
  <div class="booking-list">
    <div class="list-header">
      <h2>Flight Bookings</h2>
      <VButton
        v-if="canCreateBooking"
        @click="$emit('create')"
      >
        Create Booking
      </VButton>
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
          <span :class="['status-badge', getStatusClass(getAdjustedStatus(booking))]">
            {{ getStatusText(getAdjustedStatus(booking)) }}
          </span>
        </div>

        <div class="booking-info">
          <p>
            <strong>Flight:</strong> {{ booking.flightId }}
            <span
              v-if="getFlightStatus(booking) !== null && showFlightStatus(getFlightStatus(booking))"
              :class="['flight-status-badge', flightStatusClass(getFlightStatus(booking))]"
            >
              {{ flightStore.statusText(getFlightStatus(booking)!) }}
            </span>
          </p>
          <p><strong>Class:</strong> {{ booking.classType || booking.classFlightId }}</p>
          <p><strong>Passengers:</strong> {{ booking.passengerCount }}</p>
          <p><strong>Total Price:</strong> ${{ booking.totalPrice }}</p>
          <p><strong>Contact:</strong> {{ booking.contactEmail }}</p>
          <p v-if="booking.isDeleted" style="margin-top:0.25rem;color:#b91c1c;font-weight:600;">
            Archived
          </p>
        </div>

        <div class="booking-actions">
          <VButton size="sm" variant="secondary" @click.stop="$emit('view', booking.id)">
            View Details
          </VButton>
          <VButton
            v-if="canUpdateBooking && canUpdate(booking)"
            size="sm"
            variant="primary"
            @click.stop="$emit('update', booking.id)"
          >
            Update
          </VButton>
          <VButton
            v-if="canCancelBooking && canCancel(booking)"
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
import { useFlightStore } from '@/stores/flight/flight'
import { useBillStore } from '@/stores/bill/bill'
import type { Booking } from '@/interfaces/booking.interface'
import { canAccess } from '@/lib/rbac'

interface Props {
  flightId?: string
  includeArchived?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  create: []
  view: [id: string]
  update: [id: string]
  cancel: [id: string]
}>()

const bookingStore = useBookingStore()
const flightStore = useFlightStore()
const billStore = useBillStore()

const canCreateBooking = canAccess('bookings/create')
const canUpdateBooking = canAccess('bookings/update')
const canCancelBooking = canAccess('bookings/cancel')

const bookings = computed(() => {
  // Base list (optionally filtered by flight)
  let list = props.flightId
    ? bookingStore.bookings.filter(b => b.flightId === props.flightId)
    : bookingStore.bookings

  // Hide archived (isDeleted) when includeArchived is false/undefined
  if (!props.includeArchived) {
    list = list.filter(b => !b.isDeleted)
  }
  return list
})

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

// Helpers based on related flight status
const getFlightStatus = (booking: Booking): number | null => {
  const f = flightStore.flights.find(f => f.id === booking.flightId)
  return f ? Number(f.status) : null
}

// Show flight status only when In Flight (2), Finished (3), or Cancelled (5)
const showFlightStatus = (status: number | null): boolean => {
  if (status === null) return false
  return [2, 3, 5].includes(Number(status))
}

const flightStatusClass = (status: number | null): string => {
  switch (Number(status)) {
    case 2: return 'flight-inflight'
    case 3: return 'flight-finished'
    case 5: return 'flight-cancelled'
    default: return 'flight-unknown'
  }
}

// Action gating: Unpaid/Paid bookings AND flight Scheduled/Delayed
const canMutateByFlight = (status: number | null): boolean => {
  if (status === null) return false
  return status === 1 || status === 4
}

const canUpdate = (booking: Booking): boolean => {
  const bs = Number(getAdjustedStatus(booking))
  const fs = getFlightStatus(booking)
  return !booking.isDeleted && (bs === 1 || bs === 2) && canMutateByFlight(fs)
}

const canCancel = (booking: Booking): boolean => {
  const bs = Number(getAdjustedStatus(booking))
  const fs = getFlightStatus(booking)
  return !booking.isDeleted && bs === 1 && canMutateByFlight(fs)
}

// Get adjusted status based on bill payment status
const getAdjustedStatus = (booking: Booking): number => {
  // Check if there's a paid bill for this booking
  const allBills = [...billStore.customerBills, ...billStore.serviceBills, ...billStore.allBills]
  const bill = allBills.find(b => b.serviceReferenceId === booking.id && b.status === 'PAID')
  return bill ? 2 : booking.status
}
</script>

<style scoped>
.booking-list {
  padding: 2rem 0 2.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 2rem;
}
.list-header h2 {
  margin: 0;
  color: var(--color-gray-900);
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}


.bookings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
  padding: 0 2rem;
}

.booking-card {
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-2xl);
  padding: 1.5rem 1.75rem;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}
.booking-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border-top: 4px solid #F9CDD5;
  pointer-events: none;
}

.booking-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: #F9CDD5;
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.booking-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #7A8450;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  background: var(--color-gray-100);
  color: var(--color-gray-800);
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
  margin: 0.35rem 0;
  color: var(--color-gray-700);
  font-size: 0.9rem;
}
.booking-info p strong {
  color: var(--color-gray-800);
}

.booking-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.25rem;
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
.flight-status-badge {
  margin-left: 0.5rem;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 700;
}

.flight-inflight {
  background: var(--color-blue-100);
  color: var(--color-blue-800);
}

.flight-finished {
  background: var(--color-gray-100);
  color: var(--color-gray-800);
}

.flight-cancelled {
  background: var(--color-red-100);
  color: var(--color-red-800);
}

.flight-unknown {
  background: var(--color-gray-100);
  color: var(--color-gray-600);
}
</style>