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

  // Booking chart by month/year, backed by /booking/chart
  async getBookingChart(month: number, year: number): Promise<{
    chart: Array<{
      flightId: string
      airlineName: string | null
      origin: string | null
      destination: string | null
      totalBookings: number
      totalRevenue: number
    }>
    summary: {
      totalBookings: number
      totalRevenue: number
      topPerformer: string | null
    }
  }> {
    const res = await api.get('/booking/chart', {
      params: { month, year }
    })

    const raw = res.data?.data

    // When backend returns empty list for no data in period
    if (Array.isArray(raw)) {
      return {
        chart: [],
        summary: {
          totalBookings: 0,
          totalRevenue: 0,
          topPerformer: null,
        },
      }
    }

    const chart = (raw?.chart ?? []) as Array<{
      flightId: string
      airlineName: string | null
      origin: string | null
      destination: string | null
      totalBookings: number
      totalRevenue: number
    }>

    const summaryRaw = raw?.summary ?? {}
    const summary = {
      totalBookings: Number(summaryRaw.totalBookings ?? 0),
      // Backend sends BigDecimal; treat as number for FE formatting
      totalRevenue: Number(summaryRaw.totalRevenue ?? 0),
      topPerformer: (summaryRaw.topPerformer ?? null) as string | null,
    }

    return { chart, summary }
  }
}