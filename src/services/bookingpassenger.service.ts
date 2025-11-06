import api from './api'
import type { CommonResponseInterface } from '@/interfaces/common.response.interface'
import type { BookingPassenger, AddBookingPassengerRequest, UpdateBookingPassengerRequest } from '@/interfaces/bookingpassenger.interface'

export const bookingPassengerService = {
  async getAllBookingPassengers(): Promise<CommonResponseInterface<BookingPassenger[]>> {
    const response = await api.get('/booking-passenger')
    return response.data
  },

  async getBookingPassenger(bookingId: string, passengerId: string): Promise<CommonResponseInterface<BookingPassenger>> {
    const response = await api.get(`/booking-passenger/${bookingId}/${passengerId}`)
    return response.data
  },

  async createBookingPassenger(bookingPassengerData: AddBookingPassengerRequest): Promise<CommonResponseInterface<BookingPassenger>> {
    const response = await api.post('/booking-passenger/create', bookingPassengerData)
    return response.data
  },

  async updateBookingPassenger(bookingPassengerData: UpdateBookingPassengerRequest): Promise<CommonResponseInterface<BookingPassenger>> {
    const response = await api.put('/booking-passenger/update', bookingPassengerData)
    return response.data
  },

  async deleteBookingPassenger(bookingId: string, passengerId: string): Promise<CommonResponseInterface<BookingPassenger>> {
    const response = await api.post(`/booking-passenger/delete/${bookingId}/${passengerId}`)
    return response.data
  }
}