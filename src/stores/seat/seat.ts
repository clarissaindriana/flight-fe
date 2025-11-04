import { defineStore } from 'pinia'
import { ref } from 'vue'
import { seatService } from '@/services/seat.service'
import type { Seat } from '@/interfaces/seat.interface'

export const useSeatStore = defineStore('seat', () => {
  // Indexes for fast access
  const items = ref<Record<number, Seat>>({})
  const byClassFlight = ref<Record<number, Seat[]>>({})
  const byFlight = ref<Record<string, Seat[]>>({})

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetchers
  const fetchByClassFlight = async (classFlightId: number): Promise<Seat[]> => {
    loading.value = true
    error.value = null
    try {
      const list = await seatService.getSeatsByClassFlight(classFlightId)
      byClassFlight.value[classFlightId] = list
      for (const s of list) items.value[s.id] = s
      return list
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to fetch seats by class flight')
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchByFlight = async (flightId: string): Promise<Seat[]> => {
    loading.value = true
    error.value = null
    try {
      const list = await seatService.getSeatsByFlight(flightId)
      byFlight.value[flightId] = list
      for (const s of list) items.value[s.id] = s
      return list
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to fetch seats by flight')
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchById = async (id: number): Promise<Seat> => {
    loading.value = true
    error.value = null
    try {
      const seat = await seatService.getSeatById(id)
      items.value[id] = seat
      return seat
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to fetch seat')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Mutations
  const create = async (payload: { classFlightId: number; seatCode: string }): Promise<Seat> => {
    loading.value = true
    error.value = null
    try {
      const seat = await seatService.createSeat(payload)
      items.value[seat.id] = seat
      const list = byClassFlight.value[payload.classFlightId] ?? []
      byClassFlight.value[payload.classFlightId] = [...list, seat]
      return seat
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to create seat')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Book/unbook via passengerId assignment
  const update = async (payload: { id: number; passengerId: string | null }): Promise<Seat> => {
    loading.value = true
    error.value = null
    try {
      const seat = await seatService.updateSeat(payload)
      items.value[seat.id] = seat
      // update in any classFlight list containing it
      Object.keys(byClassFlight.value).forEach(k => {
        const cid = Number(k)
        const list = byClassFlight.value[cid] ?? []
        const idx = list.findIndex(s => s.id === seat.id)
        if (idx !== -1) {
          const next = list.slice()
          next[idx] = seat
          byClassFlight.value[cid] = next
        }
      })
      // update in any flight list containing it
      Object.keys(byFlight.value).forEach(fid => {
        const list = byFlight.value[fid] ?? []
        const idx = list.findIndex(s => s.id === seat.id)
        if (idx !== -1) {
          const next = list.slice()
          next[idx] = seat
          byFlight.value[fid] = next
        }
      })
      return seat
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to update seat')
      throw err
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: number): Promise<Seat> => {
    loading.value = true
    error.value = null
    try {
      const deleted = await seatService.deleteSeat(id)
      delete items.value[id]
      // remove from indexes
      Object.keys(byClassFlight.value).forEach(k => {
        const cid = Number(k)
        const list = byClassFlight.value[cid] ?? []
        byClassFlight.value[cid] = list.filter(s => s.id !== id)
      })
      Object.keys(byFlight.value).forEach(fid => {
        const list = byFlight.value[fid] ?? []
        byFlight.value[fid] = list.filter(s => s.id !== id)
      })
      return deleted
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to delete seat')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // state
    items,
    byClassFlight,
    byFlight,
    loading,
    error,
    // actions
    fetchByClassFlight,
    fetchByFlight,
    fetchById,
    create,
    update,
    remove,
  }
})