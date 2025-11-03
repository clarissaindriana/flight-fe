export interface Seat {
  id: number;
  classFlightId: number;
  passengerId: string | null;
  seatCode: string;
  isBooked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddSeatRequest {
  classFlightId: number;
  seatCode: string;
}

export interface UpdateSeatRequest {
  id: number;
  passengerId: string | null;
}