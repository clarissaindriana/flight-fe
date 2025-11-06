<template>
  <div class="cancel-booking-modal">
    <div class="modal-overlay" @click="$emit('cancel')"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>Cancel Booking</h2>
        <button class="close-button" @click="$emit('cancel')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="booking" class="booking-summary">
          <div class="warning-message">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
            <p>Are you sure you want to cancel this booking? This action cannot be undone.</p>
          </div>

          <div class="booking-details">
            <h3>Booking Details</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Booking Code:</label>
                <span>{{ booking.id }}</span>
              </div>
              <div class="detail-item">
                <label>Flight:</label>
                <span>{{ booking.flightId }}</span>
              </div>
              <div class="detail-item">
                <label>Class:</label>
                <span>{{ booking.classFlightId }}</span>
              </div>
              <div class="detail-item">
                <label>Passengers:</label>
                <span>{{ booking.passengerCount }}</span>
              </div>
              <div class="detail-item">
                <label>Total Price:</label>
                <span>${{ booking.totalPrice }}</span>
              </div>
              <div class="detail-item">
                <label>Contact:</label>
                <span>{{ booking.contactEmail }}</span>
              </div>
            </div>
          </div>

          <div class="refund-info">
            <h4>Refund Information</h4>
            <p v-if="booking.status === 1" class="refund-note">
              Since this booking is unpaid, no refund will be processed.
            </p>
            <p v-else-if="booking.status === 2" class="refund-note">
              A refund will be processed according to our refund policy.
            </p>
          </div>
        </div>

        <div v-else class="loading">Loading booking details...</div>
      </div>

      <div class="modal-footer">
        <VButton variant="secondary" @click="$emit('cancel')" :disabled="loading">
          Keep Booking
        </VButton>
        <VButton variant="danger" @click="handleConfirm" :loading="loading">
          Cancel Booking
        </VButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import VButton from '@/components/common/VButton.vue'
import { useBookingStore } from '@/stores/booking/booking'

interface Props {
  bookingId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  confirm: [bookingId: string]
  cancel: []
}>()

const bookingStore = useBookingStore()
const loading = ref(false)

const booking = computed(() => bookingStore.currentBooking)

const handleConfirm = async () => {
  loading.value = true
  try {
    emit('confirm', props.bookingId)
  } catch (error) {
    console.error('Cancel booking error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.cancel-booking-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
}

.modal-header h2 {
  margin: 0;
  color: var(--color-gray-800);
  font-size: 1.5rem;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-gray-500);
  padding: 0.25rem;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.close-button:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

.modal-body {
  padding: 1.5rem;
}

.warning-message {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: var(--color-red-50);
  border: 1px solid var(--color-red-200);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.warning-message svg {
  color: var(--color-red);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.warning-message p {
  margin: 0;
  color: var(--color-red-800);
  font-weight: 500;
}

.booking-details {
  margin-bottom: 1.5rem;
}

.booking-details h3 {
  margin: 0 0 1rem 0;
  color: var(--color-gray-800);
  font-size: 1.25rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item label {
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.9rem;
}

.detail-item span {
  color: var(--color-gray-800);
  font-size: 0.95rem;
}

.refund-info {
  background: var(--color-blue-50);
  border: 1px solid var(--color-blue-200);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.refund-info h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-blue-800);
  font-size: 1rem;
}

.refund-note {
  margin: 0;
  color: var(--color-blue-700);
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--color-gray-200);
}

.loading {
  text-align: center;
  color: var(--color-gray-600);
  padding: 2rem;
}
</style>