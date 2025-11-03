import api from './api'
import type { Seat, AddSeatRequest, UpdateSeatRequest } from '@/interfaces/seat.interface'

export const seatService = {
  async getAllSeats(params?: { classFlightId?: number; flightId?: string }): Promise<Seat[]> {
    const query = new URLSearchParams()
    if (params?.classFlightId !== undefined) query.append('classFlightId', String(params.classFlightId))
    if (params?.flightId) query.append('flightId', params.flightId)

    const url = `/seat${query.toString() ? `?${query.toString()}` : ''}`
    const res = await api.get(url)
    return res.data.data
  },

  async getSeatsByClassFlight(classFlightId: number): Promise<Seat[]> {
    const res = await api.get(`/seat?classFlightId=${classFlightId}`)
    return res.data.data
  },

  async getSeatsByFlight(flightId: string): Promise<Seat[]> {
    const res = await api.get(`/seat?flightId=${encodeURIComponent(flightId)}`)
    return res.data.data
  },

  async getSeatById(id: number): Promise<Seat> {
    const res = await api.get(`/seat/${id}`)
    return res.data.data
  },

  async createSeat(payload: AddSeatRequest): Promise<Seat> {
    const res = await api.post('/seat/create', payload)
    return res.data.data
  },

  async updateSeat(payload: UpdateSeatRequest): Promise<Seat> {
    const res = await api.put('/seat/update', payload)
    return res.data.data
  },

  async deleteSeat(id: number): Promise<Seat> {
    const res = await api.post(`/seat/delete/${id}`)
    return res.data.data
  },
}