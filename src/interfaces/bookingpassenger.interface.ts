export interface BookingPassenger {
  bookingId: string
  passengerId: string
  createdAt: string
}

export interface AddBookingPassengerRequest {
  bookingId: string
  passengerId: string
}

export interface UpdateBookingPassengerRequest {
  bookingId: string
  passengerId: string
}