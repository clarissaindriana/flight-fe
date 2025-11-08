<template>
  <div class="booking-list-view">
    <div class="filters">
      <label class="toggle">
        <input type="checkbox" v-model="includeArchived" @change="reload" />
        <span>Show Archived (Cancelled)</span>
      </label>
    </div>

    <BookingList
      :include-archived="includeArchived"
      @create="handleCreate"
      @view="handleView"
      @update="handleUpdate"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BookingList from '@/components/booking/BookingList.vue'
import { useBookingStore } from '@/stores/booking/booking'
import { useFlightStore } from '@/stores/flight/flight'

const router = useRouter()
const bookingStore = useBookingStore()
const flightStore = useFlightStore()

const includeArchived = ref(false)

const handleCreate = () => {
  router.push('/bookings/create')
}

const handleView = (bookingId: string) => {
  router.push(`/bookings/${bookingId}`)
}

const handleUpdate = (bookingId: string) => {
  router.push(`/bookings/${bookingId}/update`)
}

const handleCancel = async (bookingId: string) => {
  const confirmed = confirm('Are you sure you want to cancel this booking?')
  if (!confirmed) return
  try {
    await bookingStore.cancelBooking(bookingId)
    // Refresh list to exclude the cancelled booking from active view
    await reload()
  } catch (err) {
    console.error('Failed to cancel booking:', err)
    alert((err as any)?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to cancel booking'))
  }
}

const reload = async () => {
  // Ensure flight list is loaded so booking actions can be validated against flight status
  await flightStore.fetchFlights()
  await bookingStore.fetchBookings({ includeDeleted: includeArchived.value })
}

onMounted(async () => {
  await reload()
})
</script>

<style scoped>
.booking-list-view {
  min-height: 100vh;
  background: var(--color-gray-50);
  padding-top: 0.5rem;
}

.filters {
  display: flex;
  justify-content: flex-end;
  padding: 0 1.5rem;
  margin-bottom: 0.5rem;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--color-gray-700);
}

.toggle input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-pink);
}
</style>