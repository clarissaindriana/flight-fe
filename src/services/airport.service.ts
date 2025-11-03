import api from './api'
import type { Airport, AddAirportRequest, UpdateAirportRequest } from '@/interfaces/airport.interface'

export const airportService = {
  async getAllAirports(search?: string): Promise<Airport[]> {
    const params = new URLSearchParams()
    if (search && search.trim()) params.append('search', search.trim())
    const url = `/airport/all${params.toString() ? `?${params.toString()}` : ''}`
    const res = await api.get(url)
    return res.data.data
  },

  async getAirportByCode(iataCode: string): Promise<Airport> {
    const res = await api.get(`/airport/${encodeURIComponent(iataCode)}`)
    return res.data.data
  },

  async createAirport(payload: AddAirportRequest): Promise<Airport> {
    const res = await api.post('/airport/create', payload)
    return res.data.data
  },

  async updateAirport(payload: UpdateAirportRequest): Promise<Airport> {
    const res = await api.put('/airport/update', payload)
    return res.data.data
  },

  async deleteAirport(iataCode: string): Promise<Airport> {
    const res = await api.delete(`/airport/delete/${encodeURIComponent(iataCode)}`)
    return res.data.data
  },
}