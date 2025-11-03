import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { airportService } from '@/services/airport.service'
import type { Airport } from '@/interfaces/airport.interface'

export const useAirportStore = defineStore('airport', () => {
  const airports = ref<Airport[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastQuery = ref('')

  const fetchAirports = async (search?: string) => {
    loading.value = true
    error.value = null
    try {
      lastQuery.value = search?.trim() ?? ''
      airports.value = await airportService.getAllAirports(lastQuery.value)
    } catch (err: any) {
      // Prefer backend message if provided
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to fetch airports')
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const getAirportLabel = (code: string): string => {
    const a = airports.value.find(x => x.iataCode === code)
    if (!a) return code
    const parts: string[] = []
    if (a.name) parts.push(a.name)
    const loc = [a.city, a.country].filter(Boolean).join(', ')
    const main = parts.join(' - ')
    return `${a.iataCode}${main ? ' - ' + main : ''}${loc ? ' (' + loc + ')' : ''}`
  }

  const airportOptions = computed(() =>
    airports.value.map(a => ({
      value: a.iataCode,
      label: `${a.iataCode} - ${a.name}${a.city ? ' (' + a.city + (a.country ? ', ' + a.country : '') + ')' : ''}`,
    }))
  )

  return {
    airports,
    loading,
    error,
    lastQuery,
    fetchAirports,
    getAirportLabel,
    airportOptions,
  }
})