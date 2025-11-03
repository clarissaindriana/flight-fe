import type { Seat } from '@/interfaces/seat.interface'

export interface ClassFlight {
  id: number
  flightId: string
  classType: 'Economy' | 'Business' | 'First' | string
  seatCapacity: number
  availableSeats: number
  price: number
  seats?: Seat[] // present on detail responses
}

export interface AddClassFlightForCreate {
  classType: string
  seatCapacity: number
  price: number
}

export interface UpdateClassFlightRequest {
  id: number
  seatCapacity: number
  price: number
}