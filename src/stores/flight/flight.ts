import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { flightService } from '@/services/flight.service'
import type { Flight, AddFlightRequest, UpdateFlightRequest, FlightListParams, FlightStatus } from '@/interfaces/flight.interface'

export const useFlightStore = defineStore('flight', () => {
  // State
  const flights = ref<Flight[]>([])
  const selectedFlight = ref<Flight | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filters and UI state
  const filters = ref<FlightListParams>({
    includeDeleted: false, // default hide inactive as required
  })
  const oneWayMode = ref(true) // default one-way
  const selectedDepartureFlightId = ref<string | null>(null)
  const selectedReturnFlightId = ref<string | null>(null)

  // Computed
  const activeFlights = computed(() => flights.value.filter(f => !f.isDeleted))
  const statusText = (status: number | FlightStatus): string => {
    switch (Number(status)) {
      case 1: return 'Scheduled'
      case 2: return 'In Flight'
      case 3: return 'Finished'
      case 4: return 'Delayed'
      case 5: return 'Cancelled'
      default: return 'Unknown'
    }
  }

  const statusBadgeClass = (status: number | FlightStatus): string => {
    switch (Number(status)) {
      case 1: return 'badge-scheduled'
      case 2: return 'badge-inflight'
      case 3: return 'badge-finished'
      case 4: return 'badge-delayed'
      case 5: return 'badge-cancelled'
      default: return 'badge-unknown'
    }
  }

  // Actions
  const fetchFlights = async (params?: FlightListParams) => {
    loading.value = true
    error.value = null
    try {
      // Merge provided params with current filters; params takes priority
      const finalParams: FlightListParams = {
        ...filters.value,
        ...(params ?? {}),
      }
      flights.value = await flightService.getAllFlights(finalParams)
      return flights.value
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to fetch flights')
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchFlightDetail = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      selectedFlight.value = await flightService.getFlightById(id)
      return selectedFlight.value
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to fetch flight detail')
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createFlight = async (payload: AddFlightRequest) => {
    loading.value = true
    error.value = null
    try {
      const created = await flightService.createFlight(payload)
      flights.value.push(created)
      return created
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to create flight')
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateFlight = async (payload: UpdateFlightRequest) => {
    loading.value = true
    error.value = null
    try {
      const updated = await flightService.updateFlight(payload)
      const idx = flights.value.findIndex(f => f.id === updated.id)
      if (idx !== -1) flights.value[idx] = updated
      if (selectedFlight.value?.id === updated.id) selectedFlight.value = updated
      return updated
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to update flight')
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteFlight = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      const deleted = await flightService.deleteFlight(id)
      const idx = flights.value.findIndex(f => f.id === id)
      if (idx !== -1) flights.value[idx] = deleted // soft-deleted; keep in list
      if (selectedFlight.value?.id === id) selectedFlight.value = deleted
      return deleted
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to delete flight')
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Filters helpers
  const setFilters = (next: Partial<FlightListParams>) => {
    filters.value = { ...filters.value, ...next }
  }

  const resetFilters = () => {
    filters.value = { includeDeleted: false }
  }

  // Round trip helpers
  const setOneWay = (v: boolean) => {
    oneWayMode.value = v
    if (v) {
      selectedReturnFlightId.value = null
    }
  }

  const selectDeparture = (id: string) => {
    selectedDepartureFlightId.value = id
  }

  const selectReturn = (id: string) => {
    selectedReturnFlightId.value = id
  }

  return {
    // state
    flights,
    selectedFlight,
    loading,
    error,
    filters,
    oneWayMode,
    selectedDepartureFlightId,
    selectedReturnFlightId,

    // computed/helpers
    activeFlights,
    statusText,
    statusBadgeClass,

    // actions
    fetchFlights,
    fetchFlightDetail,
    createFlight,
    updateFlight,
    deleteFlight,

    // filters
    setFilters,
    resetFilters,

    // round-trip selections
    setOneWay,
    selectDeparture,
    selectReturn,
  }
})