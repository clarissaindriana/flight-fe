import type { Passenger, AddPassengerRequest, UpdatePassengerRequest } from '@/interfaces/passenger.interface'

export interface Booking {
  id: string
  flightId: string
  classFlightId: number
  contactEmail: string
  contactPhone: string
  passengerCount: number
  status: number
  totalPrice: number
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  passengers: Passenger[]
}

export interface AddBookingRequest {
  flightId: string
  classFlightId: number
  contactEmail: string
  contactPhone: string
  passengerCount: number
  passengers: AddPassengerRequest[]
  seatIds?: number[]
}


export interface UpdateBookingRequest {
  id: string
  contactEmail: string
  contactPhone: string
  passengers?: UpdatePassengerRequest[]
  seatIds?: number[]
}

export interface BookingStatistics {
  flightId: string
  totalBookings: number
  totalRevenue: number
  period: string
}