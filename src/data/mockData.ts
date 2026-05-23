import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "../lib/firebase";
import { Shuttle } from "../types";

export interface SemarangCampus {
  id: string;
  name: string;
  fullName: string;
  mainArea: string;
  availableDrivers: number;
}

export const SEMARANG_CAMPUSES: SemarangCampus[] = [
  {
    id: "undip",
    name: "UNDIP",
    fullName: "Universitas Diponegoro",
    mainArea: "Tembalang / Pleburan",
    availableDrivers: 14,
  },
  {
    id: "unnes",
    name: "UNNES",
    fullName: "Universitas Negeri Semarang",
    mainArea: "Sekaran, Gunungpati",
    availableDrivers: 9,
  },
  {
    id: "udinus",
    name: "UDINUS",
    fullName: "Universitas Dian Nuswantoro",
    mainArea: "Pendrikan Kidul, Pleburan",
    availableDrivers: 8,
  },
  {
    id: "unissula",
    name: "UNISSULA",
    fullName: "Universitas Islam Sultan Agung",
    mainArea: "Kaligawe, Genuk",
    availableDrivers: 6,
  },
  {
    id: "unimus",
    name: "UNIMUS",
    fullName: "Universitas Muhammadiyah Semarang",
    mainArea: "Kedungmundu",
    availableDrivers: 5,
  },
  {
    id: "unika",
    name: "UNIKA",
    fullName: "Universitas Katolik Soegijapranata",
    mainArea: "Bendan Dhuwur / BSB City",
    availableDrivers: 4,
  },
  {
    id: "uin",
    name: "UIN Walisongo",
    fullName: "Universitas Islam Negeri Walisongo",
    mainArea: "Ngaliyan",
    availableDrivers: 7,
  }
];

export const SHUTTLE_SEEDS: Omit<Shuttle, "id">[] = [
  {
    driverName: "Mas Aris Tembalang",
    driverPhoto: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    vehicleType: "Motorcycle",
    plateNumber: "H 3105 AWG",
    whatsapp: "628123456789",
    coverageAreas: ["Tembalang", "Banyumanik", "Ngesrep", "Pleburan"],
    targetCampuses: ["UNDIP", "UDINUS", "UNIMUS"],
    basePrice: 10000,
    status: "Available",
    rating: 4.9,
    totalTrips: 184,
  },
  {
    driverName: "Kang Danu Gunungpati",
    driverPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    vehicleType: "Motorcycle",
    plateNumber: "H 5214 AP",
    whatsapp: "628234567890",
    coverageAreas: ["Sekaran", "Gunungpati", "Sampangan", "Kalisegoro"],
    targetCampuses: ["UNNES", "UNIKA"],
    basePrice: 9000,
    status: "Available",
    rating: 4.8,
    totalTrips: 242,
  },
  {
    driverName: "Pak Eko Siliwangi (Mobil)",
    driverPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    vehicleType: "Car",
    plateNumber: "H 9128 BYS",
    whatsapp: "628345678901",
    coverageAreas: ["Pendrikan", "Pleburan", "Simpang Lima", "Tugumuda"],
    targetCampuses: ["UDINUS", "UNDIP Bawah", "UNIKA"],
    basePrice: 20000,
    status: "Available",
    rating: 5.0,
    totalTrips: 98,
  },
  {
    driverName: "Mbak Rita Kaligawe",
    driverPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    vehicleType: "Motorcycle",
    plateNumber: "H 4118 CH",
    whatsapp: "628456789012",
    coverageAreas: ["Kaligawe", "Genuk", "Pedurungan", "Gayamsari"],
    targetCampuses: ["UNISSULA", "UNIMUS"],
    basePrice: 11000,
    status: "Available",
    rating: 4.7,
    totalTrips: 156,
  }
];

export async function bootstrapSeedDrivers() {
  const path = "shuttles";
  try {
    const querySnapshot = await getDocs(collection(db, path));
    if (querySnapshot.empty) {
      console.log("No seed drivers found in Firestore, seeding default drivers...");
      // Seed our beautiful default drivers
      for (let i = 0; i < SHUTTLE_SEEDS.length; i++) {
        const seed = SHUTTLE_SEEDS[i];
        const driverId = `seed_driver_${i + 1}`;
        await setDoc(doc(db, path, driverId), {
          ...seed,
          id: driverId,
        });
      }
      console.log("Default drivers seeded successfully!");
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
