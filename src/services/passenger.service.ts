import api from './api'
import type { CommonResponseInterface } from '@/interfaces/common.response.interface'
import type { Passenger, AddPassengerRequest, UpdatePassengerRequest } from '@/interfaces/passenger.interface'

export const passengerService = {
  async getAllPassengers(): Promise<CommonResponseInterface<Passenger[]>> {
    const response = await api.get('/passenger')
    return response.data
  },

  async getPassenger(id: string): Promise<CommonResponseInterface<Passenger>> {
    const response = await api.get(`/passenger/${id}`)
    return response.data
  },

  async createPassenger(passengerData: AddPassengerRequest): Promise<CommonResponseInterface<Passenger>> {
    const response = await api.post('/passenger/create', passengerData)
    return response.data
  },

  async updatePassenger(passengerData: UpdatePassengerRequest): Promise<CommonResponseInterface<Passenger>> {
    const response = await api.put('/passenger/update', passengerData)
    return response.data
  },

  async deletePassenger(id: string): Promise<CommonResponseInterface<Passenger>> {
    const response = await api.post(`/passenger/delete/${id}`)
    return response.data
  }
}