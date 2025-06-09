
export interface Location {
  id: string;
  name: string;
}

export interface ShuttleType {
  id: string;
  name: string;
}

export type BookingStep = 'search' | 'confirmation' | 'booked';

export interface SearchParams {
  leavingFrom: string;
  goingTo: string;
  journeyDate: string;
  passengers: number;
  shuttleType: string;
  bookingType: 'shared' | 'reserved';
  returnDate?: string;
}

export interface SearchResult {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  shuttleTypeId: string;
  shuttleTypeName: string;
  journeyDate: string;
  departureTime: string; // e.g., "10:00"
  arrivalTime: string;   // e.g., "14:30"
  price: number;
  passengers: number;
  bookingType: 'shared' | 'reserved';
  returnDate?: string;
}

export interface PassengerDetails {
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface AiTravelSuggestion {
  text: string;
  // Could include more structured data later, e.g., links, images
}