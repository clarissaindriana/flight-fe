import { defineStore } from 'pinia'
import { ref } from 'vue'
import { airplaneService } from '@/services/airplane.service'
import type { Airplane, CreateAirplaneRequest, UpdateAirplaneRequest } from '@/interfaces/airplane.interface'

export const useAirplaneStore = defineStore('airplane', () => {
  const airplanes = ref<Airplane[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchAirplanes = async (params?: {
    isDeleted?: boolean | null
    search?: string
    airlineId?: string
    model?: string
    manufactureYear?: number
  }) => {
    loading.value = true
    error.value = null
    try {
      airplanes.value = await airplaneService.getAllAirplanes(params)
    } catch (err) {
      error.value = 'Failed to fetch airplanes'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const createAirplane = async (data: CreateAirplaneRequest) => {
    loading.value = true
    error.value = null
    try {
      const newAirplane = await airplaneService.createAirplane(data)
      airplanes.value.push(newAirplane)
      return newAirplane
    } catch (err) {
      error.value = 'Failed to create airplane'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateAirplane = async (data: UpdateAirplaneRequest) => {
    loading.value = true
    error.value = null
    try {
      const updatedAirplane = await airplaneService.updateAirplane(data)
      const index = airplanes.value.findIndex(a => a.id === data.id)
      if (index !== -1) {
        airplanes.value[index] = updatedAirplane
      }
      return updatedAirplane
    } catch (err) {
      error.value = 'Failed to update airplane'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteAirplane = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const deletedAirplane = await airplaneService.deleteAirplane(id)
      const index = airplanes.value.findIndex(a => a.id === id)
      if (index !== -1) {
        airplanes.value[index] = deletedAirplane
      }
      return deletedAirplane
    } catch (err) {
      error.value = 'Failed to delete airplane'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const activateAirplane = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const activatedAirplane = await airplaneService.activateAirplane(id)
      const index = airplanes.value.findIndex(a => a.id === id)
      if (index !== -1) {
        airplanes.value[index] = activatedAirplane
      }
      return activatedAirplane
    } catch (err) {
      error.value = 'Failed to activate airplane'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    airplanes,
    loading,
    error,
    fetchAirplanes,
    createAirplane,
    updateAirplane,
    deleteAirplane,
    activateAirplane,
  }
})