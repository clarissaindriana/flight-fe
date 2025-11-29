import { getCurrentUser } from './auth';

export type Role = 'Customer' | 'Flight Airline' | 'Superadmin';

export const hasRole = (requiredRoles: Role[]): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  return requiredRoles.includes(user.role as Role);
};

export const canAccess = (endpoint: string): boolean => {
  const user = getCurrentUser();
  if (!user) return false;

  const role = user.role as Role;

  // Define role-based access control rules based on the backend criteria
  const rules: Record<string, Role[]> = {
    // Airlines
    'airlines': ['Superadmin', 'Flight Airline'],
    'airlines/create': ['Superadmin', 'Flight Airline'],
    'airlines/update': ['Superadmin', 'Flight Airline'],
    'airlines/delete': ['Superadmin', 'Flight Airline'],

    // Airplanes
    'airplanes': ['Superadmin', 'Flight Airline'],
    'airplanes/create': ['Superadmin', 'Flight Airline'],
    'airplanes/update': ['Superadmin', 'Flight Airline'],
    'airplanes/delete': ['Superadmin', 'Flight Airline'],

    // Flights
    'flights': ['Customer', 'Superadmin', 'Flight Airline'],
    'flights/create': ['Superadmin', 'Flight Airline'],
    'flights/update': ['Superadmin', 'Flight Airline'],
    'flights/delete': ['Superadmin', 'Flight Airline'],
    'flights/reminder': ['Customer', 'Superadmin', 'Flight Airline'],

    // Bookings
    'bookings': ['Customer', 'Superadmin', 'Flight Airline'],
    'bookings/create': ['Customer', 'Superadmin'],
    'bookings/update': ['Customer', 'Superadmin'],
    'bookings/cancel': ['Customer', 'Superadmin'],
    // Aggregated statistics & charts on the dashboard
    'bookings/statistics': ['Superadmin', 'Flight Airline'],
    // Ability to see inactive (isDeleted = TRUE) bookings in lists
    'bookings/inactive': ['Superadmin', 'Flight Airline'],

    // Users (admin only)
    'users': ['Superadmin'],
    'users/customers': ['Superadmin'],
  };

  const requiredRoles = rules[endpoint];
  if (!requiredRoles) return true; // If no specific rule, allow access

  return requiredRoles.includes(role);
};

export const getUserRole = (): Role | null => {
  const user = getCurrentUser();
  return user ? (user.role as Role) : null;
};