import type { ClassFlight, AddClassFlightForCreate, UpdateClassFlightRequest } from '@/interfaces/classflight.interface'

export enum FlightStatus {
  Scheduled = 1,
  InFlight = 2,
  Finished = 3,
  Delayed = 4,
  Cancelled = 5,
}

export interface Flight {
  id: string
  airlineId: string
  airplaneId: string
  originAirportCode: string
  destinationAirportCode: string
  departureTime: string
  arrivalTime: string
  terminal: string
  gate: string
  baggageAllowance: number
  facilities: string | null
  status: FlightStatus | number
  createdAt: string
  updatedAt: string
  isDeleted: boolean
  classes: ClassFlight[]
}

export interface AddFlightRequest {
  airlineId: string
  airplaneId: string
  originAirportCode: string
  destinationAirportCode: string
  departureTime: string
  arrivalTime: string
  terminal: string
  gate: string
  baggageAllowance: number
  facilities?: string | null
  classes: AddClassFlightForCreate[]
}

export interface UpdateFlightRequest {
  id: string
  departureTime: string
  arrivalTime: string
  terminal: string
  gate: string
  baggageAllowance: number
  facilities?: string | null
  classes?: UpdateClassFlightRequest[]
}

export interface FlightListParams {
  originAirportCode?: string
  destinationAirportCode?: string
  airlineId?: string
  status?: number | FlightStatus
  includeDeleted?: boolean
}