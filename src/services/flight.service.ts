import api from './api'
import type {
  Flight,
  AddFlightRequest,
  UpdateFlightRequest,
  FlightListParams,
} from '@/interfaces/flight.interface'

export const flightService = {
  async getAllFlights(params?: FlightListParams): Promise<Flight[]> {
    const query = new URLSearchParams()

    if (params?.originAirportCode) query.append('originAirportCode', params.originAirportCode)
    if (params?.destinationAirportCode) query.append('destinationAirportCode', params.destinationAirportCode)
    if (params?.airlineId) query.append('airlineId', params.airlineId)
    if (params?.status !== undefined && params.status !== null) query.append('status', String(params.status))
    if (params?.includeDeleted !== undefined && params.includeDeleted !== null) {
      query.append('includeDeleted', String(params.includeDeleted))
    }

    const url = `/flight/all${query.toString() ? `?${query.toString()}` : ''}`
    const res = await api.get(url)
    return res.data.data
  },

  async getFlightById(id: string): Promise<Flight> {
    const res = await api.get(`/flight/${encodeURIComponent(id)}`)
    return res.data.data
  },

  async createFlight(payload: AddFlightRequest): Promise<Flight> {
    const res = await api.post('/flight/create', payload)
    return res.data.data
  },

  async updateFlight(payload: UpdateFlightRequest): Promise<Flight> {
    const res = await api.put('/flight/update', payload)
    return res.data.data
  },

  async deleteFlight(id: string): Promise<Flight> {
    const res = await api.post(`/flight/delete/${encodeURIComponent(id)}`)
    return res.data.data
  },
}