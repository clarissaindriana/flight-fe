import api from './api'
import type { CommonResponseInterface } from '@/interfaces/common.response.interface'
import type { Booking, AddBookingRequest, UpdateBookingRequest } from '@/interfaces/booking.interface'

export const bookingService = {
  async getAllBookings(options?: {
    flightId?: string
    includeDeleted?: boolean
    search?: string
    contactEmail?: string
    status?: number
  }): Promise<CommonResponseInterface<Booking[]>> {
    const params: Record<string, any> = {}
    if (options?.flightId) params.flightId = options.flightId
    if (options?.includeDeleted !== undefined) params.includeDeleted = options.includeDeleted
    if (options?.search) params.search = options.search
    if (options?.contactEmail) params.contactEmail = options.contactEmail
    if (options?.status !== undefined) params.status = options.status
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
  },

  // GET /booking/statistics?start=YYYY-MM-DD&end=YYYY-MM-DD
  async getStatistics(start: string, end: string): Promise<CommonResponseInterface<Array<{ flightId: string; bookingCount: number; totalRevenue: number }>>> {
    const response = await api.get('/booking/statistics', {
      params: { start, end }
    })
    return response.data
  }
}