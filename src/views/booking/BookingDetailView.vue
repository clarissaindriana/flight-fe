<template>
  <div class="booking-detail-view">
    <div v-if="showCancelModal" class="modal-container">
      <CancelBooking
        :booking-id="bookingId"
        @confirm="handleCancelConfirm"
        @cancel="showCancelModal = false"
      />
    </div>

    <BookingDetail
      :booking-id="bookingId"
      @update="handleUpdate"
      @cancel="handleCancel"
    />

    <div class="view-actions">
      <VButton variant="secondary" @click="$router.push('/bookings')">
        Back to Bookings
      </VButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BookingDetail from '@/components/booking/BookingDetail.vue'
import CancelBooking from '@/components/booking/CancelBooking.vue'
import VButton from '@/components/common/VButton.vue'
import { useBookingStore } from '@/stores/booking/booking'

const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()

const bookingId = route.params.id as string
const showCancelModal = ref(false)

const handleUpdate = (id: string) => {
  router.push(`/bookings/${id}/update`)
}

const handleCancel = (id: string) => {
  showCancelModal.value = true
}

const handleCancelConfirm = async (id: string) => {
  try {
    await bookingStore.cancelBooking(id)
    showCancelModal.value = false
    // Redirect to bookings list
    router.push('/bookings')
  } catch (error) {
    console.error('Failed to cancel booking:', error)
  }
}

onMounted(async () => {
  await bookingStore.fetchBooking(bookingId)
})
</script>

<style scoped>
.booking-detail-view {
  min-height: 100vh;
  background: var(--color-gray-50);
  position: relative;
}

.modal-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.view-actions {
  padding: 2rem;
  display: flex;
  justify-content: center;
}
</style>