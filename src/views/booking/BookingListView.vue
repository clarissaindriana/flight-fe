<template>
  <div class="booking-list-view">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <h1>All Bookings</h1>
        <p>Review, manage, and update customer bookings in one place.</p>
      </div>
    </section>

    <!-- Filters (archived toggle) -->
    <section class="filters-bar" v-if="canViewInactive">
      <div class="filters">
        <label class="toggle">
          <input type="checkbox" v-model="includeArchived" @change="reload" />
          <span>Show Archived (Cancelled)</span>
        </label>
      </div>
    </section>

    <!-- Content -->
    <section class="content">
      <BookingList
        :include-archived="includeArchived"
        @create="handleCreate"
        @view="handleView"
        @update="handleUpdate"
        @cancel="handleCancel"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BookingList from '@/components/booking/BookingList.vue'
import { useBookingStore } from '@/stores/booking/booking'
import { useFlightStore } from '@/stores/flight/flight'
import { canAccess } from '@/lib/rbac'

const router = useRouter()
const bookingStore = useBookingStore()
const flightStore = useFlightStore()

// RBAC: only Superadmin & Flight Airline can view inactive bookings
const canViewInactive = canAccess('bookings/inactive')

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
  await bookingStore.fetchBookings({
    includeDeleted: canViewInactive && includeArchived.value,
  })
}

onMounted(async () => {
  await reload()
})
</script>

<style scoped>
.booking-list-view {
  min-height: 100vh;
  background: #ffffff;
}

/* Hero */
.hero {
  padding: 2.5rem 2rem;
  background: #F9CDD5;
  color: #ffffff;
}
.hero-content h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.hero-content p {
  margin: 0.5rem 0 0;
  font-size: 1rem;
  opacity: 0.95;
}

/* Filters bar */
.filters-bar {
  max-width: 1400px;
  margin: 1.5rem auto 0.5rem;
  padding: 0 2rem;
}
.filters {
  display: flex;
  justify-content: flex-end;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--color-gray-700);
  background: #ffffff;
  border-radius: var(--radius-full);
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--color-gray-200);
}
.toggle input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: #7A8450;
}

/* Content */
.content {
  max-width: 1400px;
  margin: 0 auto 2rem;
}
</style>