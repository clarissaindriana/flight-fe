<template>
  <div class="create-booking-view">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-content">
          <h1>{{ isRoundTrip ? 'Create Round Trip Booking' : 'Create Booking' }}</h1>
          <p>
            <span v-if="isRoundTrip">
              {{ step === 1 ? 'Step 1 of 2 • Departure flight' : 'Step 2 of 2 • Return flight with the same passengers.' }}
            </span>
            <span v-else>
              Fill in passenger details and contact information to confirm your flight.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Form shell -->
    <section class="form-shell">
      <CreateBookingForm
        v-if="!isRoundTrip || step === 1"
        :flightId="initialFlightId"
        @submit="handleSubmitDeparture"
        @cancel="handleCancel"
      />
      <CreateBookingForm
        v-else
        :flightId="String(returnFlightId)"
        :prefillPassengersData="prefillPassengersData"
        :prefillContact="prefillContact"
        @submit="handleSubmitReturn"
        @cancel="handleCancel"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import CreateBookingForm from '@/components/booking/CreateBookingForm.vue'
import { useBookingStore } from '@/stores/booking/booking'
import type { AddBookingRequest } from '@/interfaces/booking.interface'
import type { AddPassengerRequest } from '@/interfaces/passenger.interface'

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
const prefillPassengersData = ref<AddPassengerRequest[]>([])
const prefillContact = ref<{ contactEmail?: string; contactPhone?: string }>({})
const createdOutboundId = ref<string | null>(null)

const handleSubmitDeparture = async (bookingData: AddBookingRequest, passengersSnapshot: AddPassengerRequest[]) => {
  try {
    if (!isRoundTrip) {
      const created = await bookingStore.createBooking(bookingData)
      router.push(`/bookings/${created.id}`)
      return
    }

    // Round-trip: create departure only, then proceed to step 2 with prefilled passengers/contact
    const created = await bookingStore.createBooking(bookingData)
    createdOutboundId.value = created.id
    prefillPassengersData.value = passengersSnapshot ?? []
    prefillContact.value = {
      contactEmail: bookingData.contactEmail,
      contactPhone: bookingData.contactPhone,
    }
    step.value = 2
  } catch (error) {
    console.error('Failed to create departure booking:', error)
  }
}

const handleSubmitReturn = async (bookingData: AddBookingRequest) => {
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
  if (initialFlightId) {
    // Simple debug log to confirm pre-population from flights page
    console.log('Pre-populating booking form with flightId:', initialFlightId)
  }
})
</script>

<style scoped>
.create-booking-view {
  min-height: 100vh;
  background: #ffffff;
}

/* Hero aligned with Home / Flights but constrained to content width */
.hero {
  padding: 2.5rem 2rem 1.75rem;
  background: #ffffff;
}

.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  background: #F9CDD5;
  color: #ffffff;
  border-radius: var(--radius-2xl);
  padding: 1.75rem 2rem;
}

/* Title / text */
.hero-content h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.hero-content p {
  margin: 0.5rem 0 0;
  font-size: 1rem;
  opacity: 0.96;
}

/* Form container */
.form-shell {
  max-width: 1200px;
  margin: -2.25rem auto 2.5rem;
  padding: 0 2rem 2.5rem;
}
</style>