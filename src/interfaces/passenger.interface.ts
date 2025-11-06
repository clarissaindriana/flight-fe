export interface Passenger {
  id: string
  fullName: string
  birthDate: string
  gender: number
  idPassport: string
  createdAt: string
  updatedAt: string
}

export interface AddPassengerRequest {
  fullName: string
  birthDate: string
  gender: number
  idPassport: string
  seatId?: number
}

export interface UpdatePassengerRequest {
  id: string
  fullName: string
  birthDate: string
  gender: number
  idPassport: string
}