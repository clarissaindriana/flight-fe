import { defineStore } from 'pinia'
import { ref } from 'vue'
import { bookingService } from '@/services/booking.service'
import type { Booking, AddBookingRequest, UpdateBookingRequest } from '@/interfaces/booking.interface'

export const useBookingStore = defineStore('booking', () => {
  const bookings = ref<Booking[]>([])
  const currentBooking = ref<Booking | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchBookings = async (options?: {
    flightId?: string
    includeDeleted?: boolean
    search?: string
    contactEmail?: string
    status?: number
  }) => {
    loading.value = true
    error.value = null
    try {
      const response = await bookingService.getAllBookings(options)
      bookings.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch bookings'
    } finally {
      loading.value = false
    }
  }

  const fetchBooking = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await bookingService.getBooking(id)
      currentBooking.value = response.data
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch booking'
      return null
    } finally {
      loading.value = false
    }
  }

  const createBooking = async (bookingData: AddBookingRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await bookingService.createBooking(bookingData)
      bookings.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create booking'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateBooking = async (bookingData: UpdateBookingRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await bookingService.updateBooking(bookingData)
      const index = bookings.value.findIndex(b => b.id === bookingData.id)
      if (index !== -1) {
        bookings.value[index] = response.data
      }
      if (currentBooking.value?.id === bookingData.id) {
        currentBooking.value = response.data
      }
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update booking'
      throw err
    } finally {
      loading.value = false
    }
  }

  const cancelBooking = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await bookingService.cancelBooking(id)
      const index = bookings.value.findIndex(b => b.id === id)
      if (index !== -1) {
        bookings.value[index] = response.data
      }
      if (currentBooking.value?.id === id) {
        currentBooking.value = response.data
      }
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to cancel booking'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh a specific booking by ID. Useful for updating status after external events (e.g., payment).
   * Silently updates both the global list and currentBooking if it matches.
   */
  const refreshBooking = async (id: string) => {
    try {
      const response = await bookingService.getBooking(id)
      const index = bookings.value.findIndex(b => b.id === id)
      if (index !== -1) {
        bookings.value[index] = response.data
      }
      if (currentBooking.value?.id === id) {
        currentBooking.value = response.data
      }
      return response.data
    } catch (err) {
      // Silently fail for refresh - don't interrupt user flow
      console.warn('Failed to refresh booking:', err)
      return null
    }
  }

  const getBookingStatusText = (status: number): string => {
    switch (status) {
      case 1: return 'Unpaid'
      case 2: return 'Paid'
      case 3: return 'Cancelled'
      case 4: return 'Rescheduled'
      default: return 'Unknown'
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    bookings,
    currentBooking,
    loading,
    error,
    fetchBookings,
    fetchBooking,
    createBooking,
    updateBooking,
    cancelBooking,
    refreshBooking,
    getBookingStatusText,
    clearError,
  }
})