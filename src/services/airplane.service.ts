import api from './api'
import type { Airplane, CreateAirplaneRequest, UpdateAirplaneRequest } from '@/interfaces/airplane.interface'

export const airplaneService = {
  async getAllAirplanes(params?: {
    isDeleted?: boolean | null
    search?: string
    airlineId?: string
    model?: string
    manufactureYear?: number
  }): Promise<Airplane[]> {
    const queryParams = new URLSearchParams()

    if (params?.isDeleted !== undefined && params.isDeleted !== null) {
      queryParams.append('isDeleted', params.isDeleted.toString())
    }
    if (params?.search) {
      queryParams.append('search', params.search)
    }
    if (params?.airlineId) {
      queryParams.append('airlineId', params.airlineId)
    }
    if (params?.model) {
      queryParams.append('model', params.model)
    }
    if (params?.manufactureYear) {
      queryParams.append('manufactureYear', params.manufactureYear.toString())
    }

    const url = `/airplanes/all${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await api.get(url)
    return response.data.data
  },

  async createAirplane(data: CreateAirplaneRequest): Promise<Airplane> {
    const response = await api.post('/airplane/create', data)
    return response.data.data
  },

  async updateAirplane(data: UpdateAirplaneRequest): Promise<Airplane> {
    const response = await api.put('/airplane/update', data)
    return response.data.data
  },

  async deleteAirplane(id: string): Promise<Airplane> {
    const response = await api.post(`/airplane/${id}/delete`)
    return response.data.data
  },

  async activateAirplane(id: string): Promise<Airplane> {
    const response = await api.post(`/airplane/${id}/activate`)
    return response.data.data
  },
}