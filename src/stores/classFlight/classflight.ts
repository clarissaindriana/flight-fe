import { defineStore } from 'pinia'
import { ref } from 'vue'
import { classFlightService } from '@/services/classflight.service'
import type { ClassFlight } from '@/interfaces/classflight.interface'

export const useClassFlightStore = defineStore('classFlight', () => {
  // Cache class flights per flightId
  const byFlight = ref<Record<string, ClassFlight[]>>({})
  const items = ref<Record<number, ClassFlight>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch list by flightId
  const fetchByFlight = async (flightId: string): Promise<ClassFlight[]> => {
    loading.value = true
    error.value = null
    try {
      const list = await classFlightService.getAllClassFlights(flightId)
      byFlight.value[flightId] = list
      // index items
      for (const c of list) {
        items.value[c.id] = c
      }
      return list
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to fetch class flights')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch single by id
  const fetchById = async (id: number): Promise<ClassFlight> => {
    loading.value = true
    error.value = null
    try {
      const c = await classFlightService.getClassFlightById(id)
      items.value[id] = c
      // also add into byFlight index if possible
      if (c.flightId) {
        const existing = byFlight.value[c.flightId] ?? []
        const idx = existing.findIndex(x => x.id === c.id)
        if (idx === -1) existing.push(c)
        else existing[idx] = c
        byFlight.value[c.flightId] = [...existing]
      }
      return c
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to fetch class flight')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Create
  const create = async (payload: { flightId: string } & Pick<ClassFlight, 'classType' | 'seatCapacity' | 'price'>): Promise<ClassFlight> => {
    loading.value = true
    error.value = null
    try {
      const created = await classFlightService.createClassFlight(payload)
      // index
      items.value[created.id] = created
      const list = byFlight.value[payload.flightId] ?? []
      byFlight.value[payload.flightId] = [...list, created]
      return created
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to create class flight')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update
  const update = async (payload: { id: number; seatCapacity: number; price: number }): Promise<ClassFlight> => {
    loading.value = true
    error.value = null
    try {
      const updated = await classFlightService.updateClassFlight(payload)
      items.value[updated.id] = updated
      // update in byFlight indices
      const flightId = updated.flightId
      if (flightId && byFlight.value[flightId]) {
        const list = byFlight.value[flightId].slice()
        const idx = list.findIndex(x => x.id === updated.id)
        if (idx !== -1) list[idx] = updated
        byFlight.value[flightId] = list
      }
      return updated
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to update class flight')
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete
  const remove = async (id: number): Promise<ClassFlight> => {
    loading.value = true
    error.value = null
    try {
      const deleted = await classFlightService.deleteClassFlight(id)
      delete items.value[id]
      // remove from any byFlight list that contains it
      Object.keys(byFlight.value).forEach(fid => {
        const list = byFlight.value[fid] ?? []
        const next = list.filter(x => x.id !== id)
        byFlight.value[fid] = next
      })
      return deleted
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to delete class flight')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    byFlight,
    items,
    loading,
    error,
    fetchByFlight,
    fetchById,
    create,
    update,
    remove,
  }
})