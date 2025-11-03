export interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddAirportRequest {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
}

export interface UpdateAirportRequest {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
}

export interface AirportOption {
  value: string;
  label: string;
  disabled?: boolean;
}