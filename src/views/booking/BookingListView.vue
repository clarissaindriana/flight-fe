<template>
  <div class="booking-list-view">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <h1>All Bookings</h1>
        <p>Review, manage, and update customer bookings in one place.</p>
      </div>
    </section>

    <!-- Filters - aligned with Flight List design -->
    <section class="filters-card">
      <div class="filters-grid">
        <div class="search-field">
          <label class="field-label">Search</label>
          <input
            class="search-input"
            v-model="searchText"
            type="text"
            placeholder="Booking Code or Flight Number..."
          />
        </div>

        <div class="email-field">
          <label class="field-label">Contact Email</label>
          <input
            class="text-input"
            v-model="contactEmail"
            type="email"
            placeholder="Exact contact email"
          />
        </div>

        <div class="status-field">
          <label class="field-label">Status</label>
          <select class="select-input" v-model="status">
            <option value="">All Statuses</option>
            <option value="1">Unpaid</option>
            <option value="2">Paid</option>
            <option value="3">Cancelled</option>
            <option value="4">Rescheduled</option>
          </select>
        </div>

        <div class="toggle-field" v-if="canViewInactive">
          <label class="toggle-label">Show Archived</label>
          <label class="switch">
            <input type="checkbox" v-model="includeArchived" />
            <span class="slider"></span>
          </label>
          <span class="toggle-hint">
            {{ includeArchived ? 'Including cancelled bookings' : 'Active only' }}
          </span>
        </div>
      </div>

      <div class="filter-actions">
        <button
          class="btn btn-secondary"
          type="button"
          @click="resetFilters"
        >
          ⟳ Reset
        </button>
        <button
          class="btn btn-primary"
          type="button"
          @click="applyFilters"
        >
          Apply Filters
        </button>
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
const searchText = ref('')
const contactEmail = ref('')
const status = ref<string | number>('')


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
    includeDeleted: canViewInactive && includeArchived.value ? true : false,
    search: searchText.value || undefined,
    contactEmail: contactEmail.value || undefined,
    status: status.value ? Number(status.value) : undefined,
  })
}


const applyFilters = async () => {
  await reload()
}

const resetFilters = async () => {
  searchText.value = ''
  contactEmail.value = ''
  status.value = ''
  includeArchived.value = false
  await reload()
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

/* Filters card - mirror Flight List design */
.filters-card {
  background: #fff;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  margin: 1.5rem 2rem 1rem;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  align-items: end;
}

.field-label {
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.9rem;
  margin-bottom: 0.35rem;
  display: block;
}

.search-field,
.email-field,
.status-field {
  display: grid;
  gap: 0.35rem;
}

.search-input,
.text-input,
.select-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: #fff;
}

.search-input:focus,
.text-input:focus,
.select-input:focus {
  outline: none;
  border-color: #F9CDD5;
  box-shadow: 0 0 0 3px rgba(249, 205, 213, 0.1);
}

.toggle-field {
  display: grid;
  gap: 0.4rem;
  align-content: end;
}

.toggle-label {
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.9rem;
}

.toggle-hint {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

/* Switch (same style as flight filters) */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--color-gray-200);
  transition: .3s;
  border-radius: 26px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background: white;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.switch input:checked + .slider {
  background: #7A8450;
}
.switch input:checked + .slider:before {
  transform: translateX(22px);
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.25rem;
}

/* Content */
.content {
  max-width: 1400px;
  margin: 0 auto 2rem;
}
</style>