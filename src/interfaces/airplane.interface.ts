export interface Airplane {
  id: string
  airlineId: string
  model: string
  seatCapacity: number
  manufactureYear: number
  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

export interface CreateAirplaneRequest {
  airlineId: string
  model: string
  seatCapacity: number
  manufactureYear: number
}

export interface UpdateAirplaneRequest {
  id: string
  model: string
  seatCapacity: number
  manufactureYear: number
}