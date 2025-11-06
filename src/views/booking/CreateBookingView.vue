<template>
  <div class="create-booking-view">
    <CreateBookingForm
      v-if="!isRoundTrip || step === 1"
      :flightId="initialFlightId"
      @submit="handleSubmitDeparture"
      @cancel="handleCancel"
    />
    <CreateBookingForm
      v-else
      :flightId="String(returnFlightId)"
      :prefillPassengers="selectedPassengerIds"
      :prefillContact="prefillContact"
      @submit="handleSubmitReturn"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CreateBookingForm from '@/components/booking/CreateBookingForm.vue'
import { useBookingStore } from '@/stores/booking/booking'
import type { AddBookingRequest } from '@/interfaces/booking.interface'

const router = useRouter()
const route = useRoute()
const bookingStore = useBookingStore()

const departureFlightId = route.query.departureFlightId as string | undefined
const returnFlightId = route.query.returnFlightId as string | undefined
const singleFlightId = route.query.flightId as string | undefined

const initialFlightId = singleFlightId || departureFlightId
const isRoundTrip = !!returnFlightId

// Round-trip stepper state
const step = ref(1)
const selectedPassengerIds = ref<string[]>([])
const prefillContact = ref<{ contactEmail?: string; contactPhone?: string }>({})
const createdOutboundId = ref<string | null>(null)

const handleSubmitDeparture = async (bookingData: AddBookingRequest, ids?: string[]) => {
  try {
    if (!isRoundTrip) {
      const created = await bookingStore.createBooking(bookingData)
      router.push(`/bookings/${created.id}`)
      return
    }

    // Round-trip: create departure only, then proceed to step 2 with prefilled passengers/contact
    const created = await bookingStore.createBooking(bookingData)
    createdOutboundId.value = created.id
    selectedPassengerIds.value = ids ?? []
    prefillContact.value = {
      contactEmail: bookingData.contactEmail,
      contactPhone: bookingData.contactPhone,
    }
    step.value = 2
  } catch (error) {
    console.error('Failed to create departure booking:', error)
  }
}

const handleSubmitReturn = async (bookingData: AddBookingRequest, _ids?: string[]) => {
  try {
    // Ensure we are targeting the selected return flight
    const payload: AddBookingRequest = {
      ...bookingData,
      flightId: String(returnFlightId),
    }
    await bookingStore.createBooking(payload)

    // Redirect to outbound booking detail after both created
    const target = createdOutboundId.value ?? ''
    router.push(`/bookings/${target}`)
  } catch (error) {
    console.error('Failed to create return booking:', error)
  }
}

const handleCancel = () => {
  router.push('/bookings')
}

onMounted(() => {
  // Pre-populate logging for visibility
  if (initialFlightId) {
    console.log('Pre-populating booking form with flightId:', initialFlightId)
  }
})
</script>

<style scoped>
.create-booking-view {
  min-height: 100vh;
  background: var(--color-gray-50);
  padding: 2rem 0;
}
</style>