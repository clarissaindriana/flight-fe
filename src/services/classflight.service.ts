import api from './api'
import type { ClassFlight, AddClassFlightForCreate, UpdateClassFlightRequest } from '@/interfaces/classflight.interface'

export const classFlightService = {
  async getAllClassFlights(flightId?: string): Promise<ClassFlight[]> {
    const params = new URLSearchParams()
    if (flightId) params.append('flightId', flightId)
    const url = `/classFlight${params.toString() ? `?${params.toString()}` : ''}`
    const res = await api.get(url)
    return res.data.data
  },

  async getClassFlightById(id: number): Promise<ClassFlight> {
    const res = await api.get(`/classFlight/${id}`)
    return res.data.data
  },

  async createClassFlight(payload: { flightId: string } & AddClassFlightForCreate): Promise<ClassFlight> {
    const res = await api.post('/classFlight/create', payload)
    return res.data.data
  },

  async updateClassFlight(payload: UpdateClassFlightRequest): Promise<ClassFlight> {
    const res = await api.put('/classFlight/update', payload)
    return res.data.data
  },

  async deleteClassFlight(id: number): Promise<ClassFlight> {
    const res = await api.post(`/classFlight/delete/${id}`)
    return res.data.data
  },
}