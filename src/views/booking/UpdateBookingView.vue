<template>
  <div class="update-booking-view">
    <UpdateBookingForm
      :booking-id="bookingId"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
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
  background: var(--color-gray-50);
  padding: 2rem 0;
}
</style>