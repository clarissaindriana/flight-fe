import api from './api'
import type { Airline } from '@/interfaces/airline.interface'

export const airlineService = {
  async getAllAirlines(): Promise<Airline[]> {
    const response = await api.get('/airline/all')
    return response.data.data
  },
}