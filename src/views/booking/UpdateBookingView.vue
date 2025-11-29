<template>
  <div class="update-booking-view">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <h1>Update Booking</h1>
        <p>Adjust contact details and passengers before your trip.</p>
      </div>
    </section>

    <!-- Form card -->
    <section class="form-shell">
      <UpdateBookingForm
        :booking-id="bookingId"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UpdateBookingForm from '@/components/booking/UpdateBookingForm.vue'
import { useBookingStore } from '@/stores/booking/booking'
import type { UpdateBookingRequest } from '@/interfaces/booking.interface'

const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()

const bookingId = route.params.id as string

const handleSubmit = async (bookingData: UpdateBookingRequest) => {
  try {
    await bookingStore.updateBooking(bookingData)
    // Redirect back to booking detail
    router.push(`/bookings/${bookingId}`)
  } catch (error) {
    console.error('Failed to update booking:', error)
    // Error is handled by the store
  }
}

const handleCancel = () => {
  router.push(`/bookings/${bookingId}`)
}

onMounted(async () => {
  // Load booking details for the form
  await bookingStore.fetchBooking(bookingId)
})
</script>

<style scoped>
.update-booking-view {
  min-height: 100vh;
  background: #ffffff;
}

/* Hero similar to Home / Flights */
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

/* Form container */
.form-shell {
  max-width: 1200px;
  margin: 1.5rem auto 2.5rem;
  padding: 0 2rem;
}
</style>