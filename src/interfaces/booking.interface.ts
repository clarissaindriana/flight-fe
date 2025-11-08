import type { Passenger, AddPassengerRequest, UpdatePassengerRequest } from '@/interfaces/passenger.interface'

export interface PassengerSeatAssignment {
  passengerId: string
  seatId: number
  seatCode: string
}

export interface Booking {
  id: string
  flightId: string
  classFlightId: number
  // Human-readable class type from backend (e.g., "Economy", "Business", "First")
  classType?: string
  contactEmail: string
  contactPhone: string
  passengerCount: number
  status: number
  totalPrice: number
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  passengers: Passenger[]
  // Seat mapping per passenger for detail display
  seatAssignments?: PassengerSeatAssignment[]
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
  // Existing passengers to update/keep (by id)
  passengers?: UpdatePassengerRequest[]
  // New passengers to add into this booking
  newPassengers?: AddPassengerRequest[]
  // Optional: specific seat assignments (must match final passenger count if provided)
  seatIds?: number[]
}

export interface BookingStatistics {
  flightId: string
  totalBookings: number
  totalRevenue: number
  period: string
}