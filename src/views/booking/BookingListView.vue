<template>
  <div class="booking-list-view">
    <BookingList
      @create="handleCreate"
      @view="handleView"
      @update="handleUpdate"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BookingList from '@/components/booking/BookingList.vue'
import { useBookingStore } from '@/stores/booking/booking'

const router = useRouter()
const bookingStore = useBookingStore()

const handleCreate = () => {
  router.push('/bookings/create')
}

const handleView = (bookingId: string) => {
  router.push(`/bookings/${bookingId}`)
}

const handleUpdate = (bookingId: string) => {
  router.push(`/bookings/${bookingId}/update`)
}

const handleCancel = (bookingId: string) => {
  router.push(`/bookings/${bookingId}/cancel`)
}

onMounted(async () => {
  await bookingStore.fetchBookings()
})
</script>

<style scoped>
.booking-list-view {
  min-height: 100vh;
  background: var(--color-gray-50);
}
</style>