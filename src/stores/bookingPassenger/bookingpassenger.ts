import { defineStore } from 'pinia'
import { ref } from 'vue'
import { bookingPassengerService } from '@/services/bookingpassenger.service'
import type { BookingPassenger, AddBookingPassengerRequest, UpdateBookingPassengerRequest } from '@/interfaces/bookingpassenger.interface'

export const useBookingPassengerStore = defineStore('bookingPassenger', () => {
  const bookingPassengers = ref<BookingPassenger[]>([])
  const currentBookingPassenger = ref<BookingPassenger | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchBookingPassengers = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await bookingPassengerService.getAllBookingPassengers()
      bookingPassengers.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch booking passengers'
    } finally {
      loading.value = false
    }
  }

  const fetchBookingPassenger = async (bookingId: string, passengerId: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await bookingPassengerService.getBookingPassenger(bookingId, passengerId)
      currentBookingPassenger.value = response.data
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch booking passenger'
      return null
    } finally {
      loading.value = false
    }
  }

  const createBookingPassenger = async (bookingPassengerData: AddBookingPassengerRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await bookingPassengerService.createBookingPassenger(bookingPassengerData)
      bookingPassengers.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create booking passenger'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateBookingPassenger = async (bookingPassengerData: UpdateBookingPassengerRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await bookingPassengerService.updateBookingPassenger(bookingPassengerData)
      const index = bookingPassengers.value.findIndex(bp =>
        bp.bookingId === bookingPassengerData.bookingId && bp.passengerId === bookingPassengerData.passengerId
      )
      if (index !== -1) {
        bookingPassengers.value[index] = response.data
      }
      if (currentBookingPassenger.value?.bookingId === bookingPassengerData.bookingId &&
          currentBookingPassenger.value?.passengerId === bookingPassengerData.passengerId) {
        currentBookingPassenger.value = response.data
      }
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update booking passenger'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteBookingPassenger = async (bookingId: string, passengerId: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await bookingPassengerService.deleteBookingPassenger(bookingId, passengerId)
      const index = bookingPassengers.value.findIndex(bp =>
        bp.bookingId === bookingId && bp.passengerId === passengerId
      )
      if (index !== -1) {
        bookingPassengers.value.splice(index, 1)
      }
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete booking passenger'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getBookingPassengersByBooking = (bookingId: string): BookingPassenger[] => {
    return bookingPassengers.value.filter(bp => bp.bookingId === bookingId)
  }

  const getBookingPassengersByPassenger = (passengerId: string): BookingPassenger[] => {
    return bookingPassengers.value.filter(bp => bp.passengerId === passengerId)
  }

  const clearError = () => {
    error.value = null
  }

  return {
    bookingPassengers,
    currentBookingPassenger,
    loading,
    error,
    fetchBookingPassengers,
    fetchBookingPassenger,
    createBookingPassenger,
    updateBookingPassenger,
    deleteBookingPassenger,
    getBookingPassengersByBooking,
    getBookingPassengersByPassenger,
    clearError,
  }
})