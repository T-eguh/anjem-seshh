export type VehicleType = "Motorcycle" | "Car";
export type BookingStatus = "pending" | "accepted" | "completed" | "cancelled";
export type ShuttleStatus = "Available" | "Busy" | "Offline";

export interface Shuttle {
  id: string; // matches driver UID
  driverName: string;
  driverPhoto: string;
  vehicleType: VehicleType;
  plateNumber: string;
  whatsapp: string;
  coverageAreas: string[]; // e.g. ["Tembalang", "Pleburan", "Banyumanik"]
  targetCampuses: string[]; // e.g. ["UNDIP", "UNNES", "UDINUS", "UNISSULA"]
  basePrice: number; // base price in IDR, e.g. 10000
  status: ShuttleStatus;
  rating: number; // e.g. 4.9
  totalTrips: number;
}

export interface Booking {
  id: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  shuttleId: string;
  driverName: string;
  driverWhatsapp?: string;
  pickupLocation: string;
  destination: string;
  campusName: string;
  price: number;
  status: BookingStatus;
  notes?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface Review {
  id: string;
  bookingId: string;
  shuttleId: string;
  studentName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: any; // Firestore Timestamp
}
