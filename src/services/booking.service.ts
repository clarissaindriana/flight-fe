import api from './api'
import type { CommonResponseInterface } from '@/interfaces/common.response.interface'
import type { Booking, AddBookingRequest, UpdateBookingRequest } from '@/interfaces/booking.interface'

export const bookingService = {
  async getAllBookings(flightId?: string): Promise<CommonResponseInterface<Booking[]>> {
    const params = flightId ? { flightId } : {}
    const response = await api.get('/booking', { params })
    return response.data
  },

  async getBooking(id: string): Promise<CommonResponseInterface<Booking>> {
    const response = await api.get(`/booking/${id}`)
    return response.data
  },

  async createBooking(bookingData: AddBookingRequest): Promise<CommonResponseInterface<Booking>> {
    const response = await api.post('/booking/create', bookingData)
    return response.data
  },

  async updateBooking(bookingData: UpdateBookingRequest): Promise<CommonResponseInterface<Booking>> {
    const response = await api.put('/booking/update', bookingData)
    return response.data
  },

  async cancelBooking(id: string): Promise<CommonResponseInterface<Booking>> {
    const response = await api.post(`/booking/delete/${id}`)
    return response.data
  }
}