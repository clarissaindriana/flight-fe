import { defineStore } from 'pinia'
import { ref } from 'vue'
import { airlineService } from '@/services/airline.service'
import type { Airline } from '@/interfaces/airline.interface'

export const useAirlineStore = defineStore('airline', () => {
  const airlines = ref<Airline[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchAirlines = async () => {
    loading.value = true
    error.value = null
    try {
      airlines.value = await airlineService.getAllAirlines()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch airlines'
    } finally {
      loading.value = false
    }
  }

  const getAirlineName = (airlineId: string): string => {
    const airline = airlines.value.find(a => a.id === airlineId)
    return airline ? airline.name : airlineId
  }

  return {
    airlines,
    loading,
    error,
    fetchAirlines,
    getAirlineName,
  }
})