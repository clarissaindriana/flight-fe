import { defineStore } from 'pinia'
import { ref } from 'vue'
import { passengerService } from '@/services/passenger.service'
import type { Passenger, AddPassengerRequest, UpdatePassengerRequest } from '@/interfaces/passenger.interface'

export const usePassengerStore = defineStore('passenger', () => {
  const passengers = ref<Passenger[]>([])
  const currentPassenger = ref<Passenger | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchPassengers = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await passengerService.getAllPassengers()
      passengers.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch passengers'
    } finally {
      loading.value = false
    }
  }

  const fetchPassenger = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await passengerService.getPassenger(id)
      currentPassenger.value = response.data
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch passenger'
      return null
    } finally {
      loading.value = false
    }
  }

  const createPassenger = async (passengerData: AddPassengerRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await passengerService.createPassenger(passengerData)
      passengers.value.push(response.data)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create passenger'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePassenger = async (passengerData: UpdatePassengerRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await passengerService.updatePassenger(passengerData)
      const index = passengers.value.findIndex(p => p.id === passengerData.id)
      if (index !== -1) {
        passengers.value[index] = response.data
      }
      if (currentPassenger.value?.id === passengerData.id) {
        currentPassenger.value = response.data
      }
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update passenger'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deletePassenger = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await passengerService.deletePassenger(id)
      const index = passengers.value.findIndex(p => p.id === id)
      if (index !== -1) {
        passengers.value.splice(index, 1)
      }
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete passenger'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getPassengerName = (passengerId: string): string => {
    const passenger = passengers.value.find(p => p.id === passengerId)
    return passenger ? passenger.fullName : passengerId
  }

  const getGenderText = (gender: number): string => {
    switch (gender) {
      case 1: return 'Male'
      case 2: return 'Female'
      case 3: return 'Other'
      default: return 'Unknown'
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    passengers,
    currentPassenger,
    loading,
    error,
    fetchPassengers,
    fetchPassenger,
    createPassenger,
    updatePassenger,
    deletePassenger,
    getPassengerName,
    getGenderText,
    clearError,
  }
})