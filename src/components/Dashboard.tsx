import { useState, useEffect, FormEvent } from "react";
import { User } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  deleteDoc 
} from "firebase/firestore";
import { 
  Plus, 
  MapPin, 
  School, 
  Phone, 
  Bike, 
  Car, 
  ClipboardList, 
  LogOut, 
  CheckCircle, 
  Clock, 
  X, 
  Star, 
  MessageSquare,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Send,
  UserCheck,
  Zap,
  Navigation,
  Compass,
  DollarSign,
  Briefcase,
  Layers,
  Heart
} from "lucide-react";
import { db, OperationType, handleFirestoreError } from "../lib/firebase";
import { Shuttle, Booking, Review, VehicleType } from "../types";
import { SEMARANG_CAMPUSES } from "../data/mockData";
import { motion } from "motion/react";

export const getWhatsAppUrl = (whatsapp: string, driverName: string, bookingId: string, price: number, pickup: string, dropoff: string) => {
  let clean = whatsapp.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  }
  if (!clean.startsWith("62") && clean.length > 5) {
    clean = "62" + clean;
  }
  const text = encodeURIComponent(
    `Halo bro/sist ${driverName}! Saya adalah pemesan layanan ANJEM SESHH Semarang dengan ID Pemesanan ${bookingId}.\n\n*Rincian Perjalanan*:\n- Penjemputan: ${pickup}\n- Tujuan: ${dropoff}\n- Tarif Estimasi: Rp ${price.toLocaleString("id")}\n\nApakah bisa dijemput sekarang? Terima kasih banyak!`
  );
  return `https://wa.me/${clean || "6281390000000"}?text=${text}`;
};

export function LiveGpsTracker({ booking }: { booking: Booking }) {
  const [eta, setEta] = useState(12);
  const [distance, setDistance] = useState(1.8);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (booking.status !== "accepted") return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
      setEta((prev) => {
        if (prev <= 1) return 12;
        return prev - 0.2;
      });
      setDistance((prev) => {
        if (prev <= 0.1) return 1.8;
         return prev - 0.03;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [booking.status]);

  return (
    <div className="bg-slate-950 text-slate-100 rounded-2xl p-4 border border-indigo-500/30 space-y-3 shadow-inner my-3 animate-fade-in">
      <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider font-mono">
        <span className="text-indigo-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          SESHH-NAV GPS LOKATOR
        </span>
        <span className="text-slate-400">STATUS: TERKONEKSI</span>
      </div>

      {/* Grid Canvas Simulated Map */}
      <div className="relative bg-[#070b19] rounded-xl h-24 overflow-hidden border border-slate-800/80 flex items-center justify-center">
        {/* Grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:8px_8px]"></div>
        
        {/* Landmarks */}
        <div className="absolute left-3 top-3 text-[8px] text-slate-405 font-extrabold font-mono text-slate-400 leading-none">KOST ({booking.pickupLocation.substring(0, 14)}...)</div>
        <div className="absolute right-3 bottom-0.5 text-[8px] text-indigo-400 font-extrabold font-mono leading-none">KAMPUS ({booking.campusName})</div>

        {/* Dynamic Route Polyline */}
        <svg className="absolute inset-0 w-full h-full text-slate-800" xmlns="http://www.w3.org/2000/svg">
          <path 
            className="stroke-indigo-950"
            d="M 30,50 Q 150,15 150,55 T 320,55" 
            fill="none" 
            strokeWidth="3" 
            strokeLinecap="round" 
          />
          <path 
            className="stroke-indigo-500/80"
            d="M 30,50 Q 150,15 150,55 T 320,55" 
            fill="none" 
            strokeWidth="3" 
            strokeDasharray="8 4" 
            strokeLinecap="round" 
          />
        </svg>

        {/* Animated Motorcycle Dot */}
        <div 
          style={{
            position: "absolute",
            left: `${10 + (progress / 100) * 80}%`,
            top: `${30 + Math.sin((progress / 100) * Math.PI) * 20}%`
          }}
          className="w-8 h-8 bg-indigo-600 border-2 border-indigo-400 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/50 transition-all duration-350"
        >
          <Bike className="h-4 w-4 text-white animate-bounce" />
        </div>
      </div>

      {/* GPS metadata widgets */}
      <div className="grid grid-cols-3 gap-2 text-center bg-white/5 p-2 rounded-xl text-[10px] font-mono">
        <div>
          <span className="text-slate-500 block text-[8px] uppercase font-bold">Jarak</span>
          <span className="font-extrabold text-white text-xs">{distance.toFixed(2)} km</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[8px] uppercase font-bold">Kecepatan</span>
          <span className="font-extrabold text-indigo-400 text-xs">42 km/h</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[8px] uppercase font-bold">Estimasi ETA</span>
          <span className="font-extrabold text-emerald-400 text-xs">{Math.ceil(eta)} mnt</span>
        </div>
      </div>
    </div>
  );
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  // Real-time states
  const [shuttles, setShuttles] = useState<Shuttle[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loadingShuttles, setLoadingShuttles] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Form states for booking
  const [selectedShuttle, setSelectedShuttle] = useState<Shuttle | null>(null);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("UNDIP");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Review states
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Driver simulation states
  const [driverMode, setDriverMode] = useState(false);
  const [driverShuttle, setDriverShuttle] = useState<Shuttle | null>(null);
  const [driverBookings, setDriverBookings] = useState<Booking[]>([]);
  const [driverReviews, setDriverReviews] = useState<Review[]>([]);

  // Proximity Radar Matcher states (The Closest Driver Search)
  const [radarPickup, setRadarPickup] = useState("Tembalang");
  const [radarCampus, setRadarCampus] = useState("UNDIP");
  const [isScanning, setIsScanning] = useState(false);
  const [matchedDriver, setMatchedDriver] = useState<Shuttle | null>(null);
  const [radarError, setRadarError] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);

  // Custom visual overlay modals/alerts for non-blocking iFrame friendly alerts
  const [modalAlertMessage, setModalAlertMessage] = useState<string | null>(null);
  const [confirmDeleteDriver, setConfirmDeleteDriver] = useState(false);

  // Register Driver wizard states
  const [registeringAsDriver, setRegisteringAsDriver] = useState(false);
  const [regPlateNumber, setRegPlateNumber] = useState("");
  const [regVehicleType, setRegVehicleType] = useState<VehicleType>("Motorcycle");
  const [regBasePrice, setRegBasePrice] = useState(10000);
  const [regWhatsapp, setRegWhatsapp] = useState("618");
  const [regCampus, setRegCampus] = useState("UNDIP");
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["Tembalang", "Banyumanik"]);

  const allAvailableSemarangRegions = [
    "Tembalang",
    "Banyumanik",
    "Pleburan",
    "Gunungpati",
    "Sekaran",
    "Ngaliyan",
    "Sampangan",
    "Kaligawe",
    "Kota Lama"
  ];

  // 1. Listen to available shuttles in real-time
  useEffect(() => {
    const shuttlesPath = "shuttles";
    const q = query(collection(db, shuttlesPath));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Shuttle[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Shuttle);
        });
        setShuttles(list);
        setLoadingShuttles(false);

        // Check if current user is registered as a driver
        const found = list.find((s) => s.id === user.uid);
        if (found) {
          setDriverShuttle(found);
        } else {
          setDriverShuttle(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, shuttlesPath);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  // 2. Listen to student's bookings in real-time
  useEffect(() => {
    const bookingsPath = "bookings";
    const q = query(
      collection(db, bookingsPath),
      where("studentUid", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Booking);
        });
        // Sort manually since compound query would require index config on Firebase
        list.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA; // newest first
        });
        setMyBookings(list);
        setLoadingBookings(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, bookingsPath);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  // 3. Listen to driver's assigned bookings in real-time
  useEffect(() => {
    if (!driverShuttle) return;

    const bookingsPath = "bookings";
    const q = query(
      collection(db, bookingsPath),
      where("shuttleId", "==", driverShuttle.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Booking);
        });
        list.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setDriverBookings(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, bookingsPath);
      }
    );

    return () => unsubscribe();
  }, [driverShuttle]);

  // 4. Listen to driver reviews in real-time
  useEffect(() => {
    if (!driverShuttle) return;

    const reviewsPath = "reviews";
    const q = query(
      collection(db, reviewsPath),
      where("shuttleId", "==", driverShuttle.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Review[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Review);
        });
        list.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setDriverReviews(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, reviewsPath);
      }
    );

    return () => unsubscribe();
  }, [driverShuttle]);

  // Handle Close Notifications
  const triggerCustomAlert = (msg: string) => {
    setModalAlertMessage(msg);
  };

  // Perform dynamic Proximity GPS mapping algorithm
  const handlePerformRadarSearch = (e: FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setMatchedDriver(null);
    setRadarError(null);
    setMatchScore(null);

    setTimeout(() => {
      // Proximity scoring system
      // 1. Filter shuttles status 'Available' & not user him/herself
      const candidates = shuttles.filter(
        (s) => s.status === "Available" && s.id !== user.uid
      );

      if (candidates.length === 0) {
        setRadarError("Mohon maaf, saat ini sedang tidak ada driver online yang bersiaga.");
        setIsScanning(false);
        return;
      }

      // 2. Score candidates based on:
      // - Overlapping coverage areas with selected pickup location (High weight)
      // - Rating (Medium weight)
      // - Primary school matches chosen target (Medium weight)
      const scored = candidates.map((shuttle) => {
        let score = 50; // default baseline

        // Matches region
        const worksInRegion = shuttle.coverageAreas.some(
          (area) => area.toLowerCase().includes(radarPickup.toLowerCase()) || 
                    radarPickup.toLowerCase().includes(area.toLowerCase())
        );
        if (worksInRegion) score += 30;

        // Matches target campus
        const matchesCampus = shuttle.targetCampuses.some(
          (c) => c.toLowerCase() === radarCampus.toLowerCase()
        );
        if (matchesCampus) score += 10;

        // Rating bias
        score += shuttle.rating * 2; // up to +10

        return { shuttle, score };
      });

      // Sort descending by calculated score
      scored.sort((a, b) => b.score - a.score);

      const bestCandidate = scored[0];
      setMatchedDriver(bestCandidate.shuttle);
      setMatchScore(Math.min(99, Math.round(bestCandidate.score)));
      setIsScanning(false);
    }, 450);
  };

  // Pre-fill student order booking from Radar match result
  const handleApplyMatchToBookingForm = (driver: Shuttle) => {
    setSelectedShuttle(driver);
    setPickup(`Area ${radarPickup}`);
    setDestination(`Gedung Rektorat / Dekanat ${radarCampus}`);
    setSelectedCampus(radarCampus);
    setBookingSuccess(null);
    setBookingError(null);
    
    // Smooth scrolling to the booking form panel
    const formElement = document.getElementById("order-panel");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 5. Handle booking submission (ordered by student)
  const handleCreateBooking = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedShuttle) return;
    if (!pickup.trim() || !destination.trim() || !phone.trim()) {
      setBookingError("Harap lengkapi semua isian wajib.");
      return;
    }

    setSubmittingBooking(true);
    setBookingError(null);
    setBookingSuccess(null);

    const bookingId = `book_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const finalPrice = selectedShuttle.basePrice + (selectedCampus !== selectedShuttle.targetCampuses[0] ? 3000 : 0);

    const payload: Booking = {
      id: bookingId,
      studentUid: user.uid,
      studentName: user.displayName || "Mahasiswa Semarang",
      studentEmail: user.email || "",
      studentPhone: phone,
      shuttleId: selectedShuttle.id,
      driverName: selectedShuttle.driverName,
      driverWhatsapp: selectedShuttle.whatsapp || "628",
      pickupLocation: pickup,
      destination: destination,
      campusName: selectedCampus,
      price: finalPrice,
      status: "pending",
      notes: notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const bookingsPath = `bookings/${bookingId}`;
    try {
      await setDoc(doc(db, "bookings", bookingId), payload);
      setBookingSuccess(`Sukses memesan Anjem dari ${selectedShuttle.driverName}! Driver akan menghubungi Anda segera.`);
      // Reset form options
      setSelectedShuttle(null);
    } catch (error) {
      setBookingError("Gagal memproses pemesanan. Database error.");
      handleFirestoreError(error, OperationType.CREATE, bookingsPath);
    } finally {
      setSubmittingBooking(false);
    }
  };

  // 6. Submit Driver profile creation
  const handleRegisterDriver = async (e: FormEvent) => {
    e.preventDefault();
    if (!regPlateNumber.trim() || !regWhatsapp.trim()) {
      triggerCustomAlert("Mohon isi plat nomor dan nomor WhatsApp Anda.");
      return;
    }
    if (selectedRegions.length === 0) {
      triggerCustomAlert("Silakan pilih minimal 1 Wilayah utama pelayanan Anda di Semarang.");
      return;
    }

    const shuttleId = user.uid;

    const payload: Shuttle = {
      id: shuttleId,
      driverName: user.displayName || "Driver Mahasiswa",
      driverPhoto: user.photoURL || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80",
      vehicleType: regVehicleType,
      plateNumber: regPlateNumber.toUpperCase(),
      whatsapp: regWhatsapp.startsWith("62") ? regWhatsapp : `62${regWhatsapp.replace(/^0+/, "")}`,
      coverageAreas: selectedRegions,
      targetCampuses: [regCampus],
      basePrice: regBasePrice,
      status: "Available",
      rating: 5.0,
      totalTrips: 0
    };

    const path = `shuttles/${shuttleId}`;
    try {
      await setDoc(doc(db, "shuttles", shuttleId), payload);
      setRegisteringAsDriver(false);
      setDriverMode(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleRegionCheckbox = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter((r) => r !== region));
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  };

  // 7. Student cancels booking
  const handleCancelBooking = async (booking: Booking) => {
    if (booking.status !== "pending") return;
    const path = `bookings/${booking.id}`;
    try {
      await updateDoc(doc(db, "bookings", booking.id), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // 8. Driver status update handler
  const handleSimulateStatus = async (bookingId: string, newStatus: "accepted" | "completed" | "cancelled") => {
    const path = `bookings/${bookingId}`;
    try {
      const match = myBookings.find(b => b.id === bookingId) || driverBookings.find(b => b.id === bookingId);
      if (!match) return;

      await updateDoc(doc(db, "bookings", bookingId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // Update driver online state on trip triggers
      const driverRef = doc(db, "shuttles", match.shuttleId);
      if (newStatus === "completed") {
        try {
          const currentTrips = driverShuttle ? driverShuttle.totalTrips + 1 : 1;
          await updateDoc(driverRef, {
            status: "Available",
            totalTrips: currentTrips
          });
        } catch (e) { }
      } else if (newStatus === "accepted") {
        try {
          await updateDoc(driverRef, {
            status: "Busy"
          });
        } catch (e) { }
      } else if (newStatus === "cancelled") {
        try {
          await updateDoc(driverRef, {
            status: "Available"
          });
        } catch (e) { }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // 9. Submit review feedback rating
  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewingBooking) return;

    setSubmittingReview(true);
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const payload: Review = {
      id: reviewId,
      bookingId: reviewingBooking.id,
      shuttleId: reviewingBooking.shuttleId,
      studentName: user.displayName || "Mahasiswa Semarang",
      rating: reviewRating,
      comment: reviewComment,
      createdAt: serverTimestamp(),
    };

    const reviewPath = `reviews/${reviewId}`;
    try {
      await setDoc(doc(db, "reviews", reviewId), payload);
      
      // Compute and update new driver total rating in shuttles
      const driverRef = doc(db, "shuttles", reviewingBooking.shuttleId);
      // Fetch currently matched driver records to compute moving average
      const driverTarget = shuttles.find(s => s.id === reviewingBooking.shuttleId);
      if (driverTarget) {
        const previousRating = driverTarget.rating || 5.0;
        const totalReviewsCount = driverReviews.length + 1;
        const nextRating = ((previousRating * (totalReviewsCount - 1)) + reviewRating) / totalReviewsCount;
        
        try {
          await updateDoc(driverRef, {
            rating: Math.round(nextRating * 10) / 10
          });
        } catch (xe) {}
      }

      setReviewingBooking(null);
      setReviewComment("");
      setReviewRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, reviewPath);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Delete driver registration
  const handleDeleteDriverAccount = async () => {
    if (!driverShuttle) return;
    const path = `shuttles/${driverShuttle.id}`;
    try {
      await deleteDoc(doc(db, "shuttles", driverShuttle.id));
      setDriverShuttle(null);
      setDriverMode(false);
      setConfirmDeleteDriver(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // Compute overall driver income
  const totalDriverEarnings = driverBookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + b.price, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="dashboard-container">
      
      {/* Dynamic Overlay Notification Modal Block */}
      {modalAlertMessage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">Pemberitahuan Sistem</h4>
            </div>
            <p className="text-xs text-slate-505 leading-relaxed mb-6">{modalAlertMessage}</p>
            <button 
              onClick={() => setModalAlertMessage(null)}
              className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider"
            >
              Baik, Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Delete Driver Account Modal */}
      {confirmDeleteDriver && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-slate-200">
            <div className="flex items-center space-x-3 text-red-650 justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-red-500 animate-bounce" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 text-center mb-2">Hapus Driver Registrasi?</h4>
            <p className="text-xs text-slate-500 text-center leading-relaxed mb-6">
              Apakah Anda benar-benar yakin ingin berhenti &amp; menghapus seluruh data driver Anda dari platform ANJEM SESHH?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setConfirmDeleteDriver(false)}
                className="py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs uppercase"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteDriverAccount}
                className="py-2.5 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header and Branding Navbar */}
      <header className="bg-white border-b border-slate-250/70 sticky top-0 z-40 w-full" id="dash-header">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between" id="dash-header-inner">
          <div className="flex items-center space-x-3" id="dash-logo">
            <div className="w-10 h-10 bg-indigo-650 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-md shadow-indigo-600/20">
              <Compass className="h-5.5 w-5.5" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">ANJEM<span className="text-indigo-650"> SESHH</span></span>
              <span className="block text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wide">Portal Real-Time Semarang</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 animate-fade-in" id="dash-user">
            {/* Real-time sync tracker */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 rounded-full border border-indigo-100/50">
              <div className="w-1.5 h-1.5 bg-indigo-605 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest leading-none">Database Terhubung</span>
            </div>

            {/* Simulated Desktop mode selection switcher */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-205">
              <button
                type="button"
                onClick={() => setDriverMode(false)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition duration-200 cursor-pointer ${
                  !driverMode ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sewa Anjem Mhs
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!driverShuttle) {
                    setRegisteringAsDriver(true);
                  } else {
                    setDriverMode(true);
                  }
                }}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition duration-200 cursor-pointer ${
                  driverMode ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Kemudi (Driver Station) {driverShuttle && "🟢"}
              </button>
            </div>

            {/* Profile widget */}
            <div className="flex items-center space-x-2.5 border-l border-slate-200 pl-4">
              <img 
                src={user.photoURL || "https://images.unsplash.com/photo-154405313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"} 
                alt="Profile" 
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full border border-slate-200 shadow-xs"
              />
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-extrabold text-slate-900 leading-none">{user.displayName || "Mahasiswa"}</span>
                <span className="block text-[9px] text-slate-400 font-mono mt-0.5">{user.email}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
              title="Keluar dari Akun"
              id="btn-logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Interactive Platform Mode Switcher */}
      <div className="sm:hidden px-4 pt-4 pb-1" id="dash-mobile-tabs">
        <div className="flex items-center justify-between bg-white p-1 border border-slate-200 rounded-xl shadow-xs">
          <button
            onClick={() => setDriverMode(false)}
            className={`flex-1 py-2 text-center text-xs font-extrabold uppercase tracking-wider rounded-lg transition ${
              !driverMode ? "bg-indigo-600 text-white" : "text-slate-500"
            }`}
          >
            Sewa Anjem
          </button>
          <button
            onClick={() => {
              if (!driverShuttle) {
                setRegisteringAsDriver(true);
              } else {
                setDriverMode(true);
              }
            }}
            className={`flex-1 py-2 text-center text-xs font-extrabold uppercase tracking-wider rounded-lg transition ${
              driverMode ? "bg-indigo-600 text-white" : "text-slate-600"
            }`}
          >
            Jadi Driver {driverShuttle && "🟢"}
          </button>
        </div>
      </div>

      {/* Main Core Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6" id="dash-main">
        
        {/* Dynamic Multi-Step Driver Registration Dialog */}
        {registeringAsDriver && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl max-w-lg w-full border border-slate-205 animate-slide-up space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-widest font-mono">Daftar Pengemudi Anjem</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Luar biasa! Masukkan detail akurat kendaraan Anda.</p>
                </div>
                <button onClick={() => setRegisteringAsDriver(false)} className="p-2 hover:bg-slate-100 rounded-xl transition cursor-pointer">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleRegisterDriver} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-1">Armada Transportasi</label>
                    <select
                      value={regVehicleType}
                      onChange={(e) => setRegVehicleType(e.target.value as VehicleType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
                    >
                      <option className="text-slate-900" value="Motorcycle">Motor pribadi</option>
                      <option className="text-slate-900" value="Car">Mobil pribadi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-1">Nomor Plat Mobil/Motor</label>
                    <input
                      type="text"
                      placeholder="Contoh: H 6245 AWG"
                      required
                      value={regPlateNumber}
                      onChange={(e) => setRegPlateNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-1">Tarif Dasar Jasa (Rp)</label>
                    <input
                      type="number"
                      min="4000"
                      step="1000"
                      value={regBasePrice}
                      onChange={(e) => setRegBasePrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-1">WhatsApp Aktif (Kode Negara)</label>
                    <input
                      type="text"
                      required
                      placeholder="628xxxxxxxx (Gunakan 62)"
                      value={regWhatsapp}
                      onChange={(e) => setRegWhatsapp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono focus:ring-1 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-1">Fakultas / Kampus Target Utama</label>
                  <select
                    value={regCampus}
                    onChange={(e) => setRegCampus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-900"
                  >
                    {SEMARANG_CAMPUSES.map(c => (
                      <option className="text-slate-900" key={c.id} value={c.name}>{c.name} - {c.fullName}</option>
                    ))}
                  </select>
                </div>

                {/* Region Checklist Picker */}
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-2">Cakupan Wilayah Operasional (Semarang)</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-150">
                    {allAvailableSemarangRegions.map((region) => {
                      const isChecked = selectedRegions.includes(region);
                      return (
                        <button
                          type="button"
                          key={region}
                          onClick={() => handleRegionCheckbox(region)}
                          className={`py-2 px-1 text-[10px] font-bold rounded-lg uppercase tracking-wider text-center border transition ${
                            isChecked 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {region}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition shadow-lg"
                  >
                    Selesaikan &amp; Aktifkan Driver Mode
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FEEDBACK REVIEW MODAL */}
        {reviewingBooking && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-slate-205 animate-scale-up space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest font-mono">Beri Ulasan Perjalanan</h3>
                <button onClick={() => setReviewingBooking(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="h-4.5 w-4.5 text-slate-400" />
                </button>
              </div>

              <div className="text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Sewa Jasa Driver</span>
                <p className="font-black text-sm text-indigo-700">{reviewingBooking.driverName}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{reviewingBooking.pickupLocation} &rarr; {reviewingBooking.destination}</p>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 text-center">Bintang Penilaian Anda</label>
                  <div className="flex items-center justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-yellow-400 hover:scale-110 transition cursor-pointer"
                      >
                        <Star className={`h-8 w-8 ${reviewRating >= star ? "fill-yellow-400" : "text-slate-350"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Tulis Catatan / Kesan</label>
                  <textarea
                    required
                    placeholder="Pelayanan ramah, tepat waktu, helmnya bersih!"
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition cursor-pointer"
                >
                  {submittingReview ? "Mengupload..." : "Kirim Ulasan Bintang"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 1: DRIVE STATION HUB */}
        {/* ------------------------------------------------------------------- */}
        {driverMode ? (
          <div className="space-y-6 animate-fade-in" id="driver-workspace">
            {/* Driver Professional Card Summary */}
            {driverShuttle ? (
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6 items-center" id="driver-profile-header">
                
                <div className="md:col-span-6 flex items-center space-x-4">
                  <img 
                    src={driverShuttle.driverPhoto} 
                    alt="Driver Photo" 
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full border-2 border-indigo-400 object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="font-extrabold text-lg text-white">{driverShuttle.driverName}</h2>
                      <span className="px-2.5 py-0.5 text-[8px] font-extrabold bg-indigo-650 text-white rounded-full uppercase tracking-wider font-mono">DRV_ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                      <span>{driverShuttle.plateNumber}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        {driverShuttle.vehicleType === "Motorcycle" ? <Bike className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
                        {driverShuttle.vehicleType === "Motorcycle" ? "Motor" : "Mobil"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 mt-2 text-xs text-indigo-350">
                      <MapPin className="h-4 w-4 text-indigo-400" />
                      <span>{driverShuttle.coverageAreas.join(", ")} &bull; {driverShuttle.targetCampuses.join(", ")}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-6 flex flex-wrap items-center justify-start md:justify-end gap-3" id="driver-shuttle-actions">
                  <div className="bg-slate-850 px-4 py-2 rounded-xl border border-white/5 text-center min-w-[90px]">
                    <span className="block text-[8px] text-slate-400 uppercase tracking-widest font-mono font-bold">Uang Masuk</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">Rp {totalDriverEarnings.toLocaleString("id")}</span>
                  </div>

                  <div className="bg-slate-850 px-4 py-2 rounded-xl border border-white/5 text-center min-w-[90px]">
                    <span className="block text-[8px] text-slate-400 uppercase tracking-widest font-mono font-bold">Total Trip</span>
                    <span className="text-sm font-black text-amber-400 font-mono">{driverShuttle.totalTrips}</span>
                  </div>

                  <div className="bg-slate-850 px-4 py-2 rounded-xl border border-white/5 text-center min-w-[90px]">
                    <span className="block text-[8px] text-slate-400 uppercase tracking-widest font-mono font-bold">Rating</span>
                    <span className="text-sm font-black text-teal-400 flex items-center justify-center font-mono">
                      {driverShuttle.rating.toFixed(1)} <Star className="h-3 w-3 fill-amber-400 text-amber-400 ml-1" />
                    </span>
                  </div>

                  {/* Active Offline / Online toggle */}
                  <button
                    onClick={async () => {
                      const nextStatus = driverShuttle.status === "Available" ? "Offline" : "Available";
                      const path = `shuttles/${driverShuttle.id}`;
                      try {
                        await updateDoc(doc(db, "shuttles", driverShuttle.id), {
                          status: nextStatus
                        });
                      } catch (e) {
                        handleFirestoreError(e, OperationType.UPDATE, path);
                      }
                    }}
                    className={`px-4 py-2.5 text-[10px] uppercase tracking-widest font-extrabold rounded-xl transition border cursor-pointer ${
                      driverShuttle.status === "Available" 
                      ? "bg-slate-850 border-emerald-500 text-emerald-400" 
                      : "bg-red-950/20 border-red-500 text-red-400 hover:bg-slate-850"
                    }`}
                  >
                    {driverShuttle.status === "Available" ? "🟢 MENERIMA REQ" : "🔴 ISTIRAHAT"}
                  </button>

                  <button
                    onClick={() => setConfirmDeleteDriver(true)}
                    className="px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-xl bg-red-950/20 text-red-400 hover:bg-red-800 hover:text-white border border-red-900/30 transition cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4" id="driver-inactive-state">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
                <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wider">Belum Teraktivasi Sebagai Driver</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Konfigurasikan tarif, plat motor/mobil pribadi, dan area pangkalan Semarang Anda untuk mulai menerima order sewa antar jemput langsung dari mahasiswa!
                </p>
                <button
                  onClick={() => setRegisteringAsDriver(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
                >
                  Buka Form Pendaftaran Driver
                </button>
              </div>
            )}

            {/* Simulated Live Orders & Customer Feedback Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="driver-simulation-sections">
              
              {/* Left Column (8 cols): Orders Log */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 space-y-5" id="assigned-order-box">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-indigo-650 animate-pulse" />
                    <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider font-mono">Daftar Reservasi Masuk</h3>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded-full font-mono font-bold">
                    {driverBookings.length} Total Orderan
                  </span>
                </div>

                {driverBookings.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 space-y-3">
                    <CheckCircle className="h-10 w-10 text-slate-200 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Belum ada mahasiswa memesan perjalanan Anda.</p>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                      Anda bisa membuka tab <strong>Sewa Anjem Mhs</strong> di atas, lalu memesan perjalanan simulasi yang menarget diri Anda sendiri untuk menguji sinkronisasi real-time instan!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1" id="driver-bookings-list">
                    {driverBookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition duration-300 space-y-4"
                      >
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
                          <div>
                            <span className="block text-xs font-black text-slate-900">{booking.studentName}</span>
                            <span className="block text-[9px] font-mono text-slate-400">Telp: {booking.studentPhone} &bull; {booking.studentEmail}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                            booking.status === "pending" ? "bg-amber-100 text-amber-800" :
                            booking.status === "accepted" ? "bg-indigo-100 text-indigo-800 animate-pulse" :
                            booking.status === "completed" ? "bg-green-100 text-green-800" :
                            "bg-slate-200 text-slate-700"
                          }`}>
                            {booking.status === "pending" ? "Menunggu" :
                             booking.status === "accepted" ? "Kurir Meluncur" :
                             booking.status === "completed" ? "Selesai" : "Dibatalkan"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-150/50">
                          <div>
                            <span className="block text-[8px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-0.5">Titik Jemput (Kos Mahasiswa)</span>
                            <span className="text-slate-800 font-extrabold flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-indigo-600" /> {booking.pickupLocation}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase font-bold text-slate-400 font-mono tracking-wider mb-0.5">Tujuan Fakultas ({booking.campusName})</span>
                            <span className="text-slate-800 font-extrabold flex items-center gap-1"><School className="h-3.5 w-3.5 text-indigo-605" /> {booking.destination}</span>
                          </div>
                        </div>

                        {booking.notes && (
                          <div className="text-[10px] text-slate-500 italic bg-white p-3 rounded-xl border border-slate-100">
                            Catatan Mahasiswa: {booking.notes}
                          </div>
                        )}

                        {/* Live GPS simulated track for Driver */}
                        {(booking.status === "accepted" || booking.status === "pending") && (
                          <div className="bg-white p-3 border border-slate-100 rounded-xl space-y-1">
                            <span className="block text-[8px] uppercase font-bold text-indigo-650 font-mono tracking-wider">NAVIGASI PERJALANAN MAHASISWA (SIMULASI GPS)</span>
                            <LiveGpsTracker booking={booking} />
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-150 pt-3">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-mono">Tarif Pembayaran</span>
                            <span className="text-sm font-black text-indigo-700 font-mono">Rp {booking.price.toLocaleString("id")}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {booking.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleSimulateStatus(booking.id, "accepted")}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer transition shadow-sm"
                                >
                                  Terima Order
                                </button>
                                <button
                                  onClick={() => handleSimulateStatus(booking.id, "cancelled")}
                                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition"
                                >
                                  Tolak
                                </button>
                              </>
                            )}

                            {booking.status === "accepted" && (
                              <button
                                onClick={() => handleSimulateStatus(booking.id, "completed")}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer transition shadow-md shadow-indigo-600/10"
                              >
                                Selesaikan Perjalanan
                              </button>
                            )}

                            {booking.status === "completed" && (
                              <span className="text-[10px] text-emerald-600 font-extrabold flex items-center bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                                <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Selesai Diantar
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column (4 cols): Reviews Breakdown logs */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Feedback Log Deck */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4" id="reviews-summary-deck">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <span className="font-extrabold text-xs text-slate-900 uppercase tracking-widest font-mono flex items-center gap-2">
                      <Star className="h-4.5 w-4.5 text-yellow-500 fill-yellow-500" /> Ulasan Bintang
                    </span>
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-100">
                      {driverReviews.length} Ulasan
                    </span>
                  </div>

                  {driverReviews.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                      <MessageSquare className="h-6 w-6 text-slate-200 mx-auto" />
                      <p className="text-[10px] font-medium text-slate-500 leading-relaxed">Belum ada ulasan yang ditinggalkan oleh mahasiswa untuk perjalanan Anda.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {driverReviews.map((review) => (
                        <div key={review.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5 text-xs">
                          <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                            <span className="font-bold text-slate-800">{review.studentName}</span>
                            <div className="flex items-center text-yellow-500">
                              {Array.from({ length: review.rating }).map((_, rIdx) => (
                                <Star key={rIdx} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-500 italic">"{review.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Simulated testing panel instruction */}
                <div className="bg-slate-900 text-slate-300 rounded-3xl p-6 border border-slate-800 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl"></div>
                  <h4 className="font-extrabold text-xs uppercase tracking-widest font-mono text-indigo-400 flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Uji Coba Vercel Ready
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Sistem pelayanan real-time ini dibuat agar langsung kompatibel dengan platform cloud Vercel. Database sinkronisasi sepenuhnya dilayani menggunakan Firestore.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------------- */
          /* VIEW 2: PORTAL MAHASISWA & RADAR PROXIMITY SEARCH */
          /* ------------------------------------------------------------------- */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in animate-duration-300" id="student-workspace">
            
            {/* COLUMN LEFT (8 cols): Radar Search Engine and Active Drivers */}
            <div className="lg:col-span-8 space-y-6" id="shuttle-showcase">
              
              {/* BRAND NEW: PROXIMITY GPS RADAR SEARCH ENGINE */}
              <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl" id="radar-search-engine">
                {/* Backdrop radial glow effect */}
                <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-650/20 rounded-full blur-3xl"></div>
                <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-fuchsia-600/15 rounded-full blur-3xl"></div>

                <div className="relative space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-450 uppercase tracking-widest font-mono text-indigo-400 flex items-center gap-1.5">
                      <Compass className="h-4 w-4 text-indigo-450 animate-spin" /> PROXIMITY RADAR MATCH
                    </span>
                    <h3 className="text-2xl font-extrabold tracking-tight mt-1">Cari &amp; Hubungkan Driver Terdekat</h3>
                    <p className="text-xs text-slate-300 mt-1">Gunakan pemindai radar pintar kami untuk merekomendasikan driver terbaik secara otomatis.</p>
                  </div>

                  <form onSubmit={handlePerformRadarSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div>
                      <label className="block text-[8px] uppercase tracking-widest font-extrabold text-slate-400 mb-1.5 font-mono">Posisi Penjemputan Anda</label>
                      <select 
                        value={radarPickup} 
                        onChange={(e) => setRadarPickup(e.target.value)}
                        className="w-full bg-slate-850 text-white border border-slate-700/80 rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                      >
                        {allAvailableSemarangRegions.map((region) => (
                          <option className="bg-slate-900" key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[8px] uppercase tracking-widest font-extrabold text-slate-400 mb-1.5 font-mono">Tujuan Kampus Utama</label>
                      <select 
                        value={radarCampus} 
                        onChange={(e) => setRadarCampus(e.target.value)}
                        className="w-full bg-slate-850 text-white border border-slate-700/80 rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
                      >
                        {SEMARANG_CAMPUSES.map((c) => (
                          <option className="bg-slate-900" key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isScanning}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest cursor-pointer transition flex items-center justify-center space-x-1.5"
                    >
                      <Zap className="h-4 w-4 text-indigo-200" />
                      <span>{isScanning ? "Memindai..." : "Pindai Area"}</span>
                    </button>
                  </form>

                  {/* SCANNING ACTIVE SCREEN RENDERS */}
                  {isScanning && (
                    <div className="py-8 text-center space-y-4 bg-black/25 rounded-2xl border border-white/5 animate-pulse">
                      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">Menjelajahi Jaringan Cloud Semarang...</p>
                    </div>
                  )}

                  {/* RADAR MATCH RESULT SUCCESS SCREEN */}
                  {matchedDriver && !isScanning && (
                    <div className="p-5 rounded-2xl bg-white text-slate-900 grid grid-cols-1 md:grid-cols-12 gap-4 items-center border border-indigo-200 animate-slide-up" id="radar-success-deck">
                      
                      <div className="md:col-span-8 space-y-3">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 text-[8px] bg-indigo-50 text-indigo-700 border border-indigo-150 font-bold uppercase rounded-full tracking-wider font-mono">Hasil Rekomendasi Terdekat</span>
                          <span className="font-mono text-[9px] font-extrabold text-emerald-600 uppercase">Match Score: {matchScore}%</span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <img src={matchedDriver.driverPhoto} alt={matchedDriver.driverName} className="w-11 h-11 rounded-full object-cover shadow border border-slate-100" />
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-950 leading-tight">{matchedDriver.driverName}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{matchedDriver.vehicleType === "Motorcycle" ? "Motor" : "Mobil"} &bull; {matchedDriver.plateNumber}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-[10px] text-slate-600">
                          <span>📍 Rute: <strong>{matchedDriver.coverageAreas.join(", ")}</strong></span>
                          <span>🏢 Sekolah: <strong>{matchedDriver.targetCampuses.join(", ")}</strong></span>
                        </div>
                      </div>

                      <div className="md:col-span-4 text-center md:text-right border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 space-y-2">
                        <div>
                          <span className="text-[8px] text-slate-400 block uppercase font-bold font-mono">Tarif Estimasi</span>
                          <span className="text-lg font-black text-indigo-600 font-mono">Rp {matchedDriver.basePrice.toLocaleString("id")}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyMatchToBookingForm(matchedDriver)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase rounded-lg transition tracking-wide cursor-pointer"
                        >
                          Gunakan Driver Ini
                        </button>
                      </div>
                    </div>
                  )}

                  {radarError && !isScanning && (
                    <div className="p-4 rounded-2xl bg-red-950/40 text-red-100 border border-red-900/30 text-center text-xs font-semibold animate-fade-in flex items-center justify-center space-x-2">
                      <AlertCircle className="h-4.5 w-4.5 text-red-400 flex-shrink-0" />
                      <span>{radarError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* standard manual explore drivers list */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-3">
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-sm uppercase tracking-wider">Eksplor Driver Aktif Manual</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Atau Anda dapat menyaring driver Semarang mandiri dari daftar offline/online di bawah.</p>
                  </div>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {shuttles.length} Driver Bersiaga
                  </span>
                </div>

                {loadingShuttles ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                    <p className="text-xs font-bold leading-normal">Mencari ketersediaan driver antar jemput...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shuttles.map((shuttle) => {
                      const isCurrentUserDriver = shuttle.id === user.uid;
                      return (
                        <div 
                          key={shuttle.id}
                          className={`bg-white rounded-2xl p-5 border shadow-xs transition duration-300 flex flex-col justify-between relative overflow-hidden ${
                            selectedShuttle?.id === shuttle.id 
                              ? "border-indigo-600 ring-4 ring-indigo-100/50" 
                              : "border-slate-200/80 hover:border-indigo-400 hover:shadow-md"
                          }`}
                        >
                          {shuttle.status === "Busy" && (
                            <div className="absolute top-0 right-0 py-1 px-3 bg-indigo-50 text-indigo-700 text-[8px] font-bold rounded-bl-xl border-l border-b border-indigo-100 uppercase tracking-widest font-mono animate-pulse">
                              SEDANG RUNNING
                            </div>
                          )}

                          <div>
                            <div className="flex items-center space-x-3 mb-4">
                              <img src={shuttle.driverPhoto} alt={shuttle.driverName} className="w-10 h-10 rounded-full border object-cover shadow-sm bg-slate-100" />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-extrabold text-sm text-slate-950 truncate leading-none">{shuttle.driverName}</h4>
                                  {isCurrentUserDriver && <span className="bg-indigo-50 border border-indigo-100 text-[8px] font-bold text-indigo-700 uppercase tracking-widest px-1 py-0.5 rounded">You</span>}
                                </div>
                                <span className="text-[9px] text-slate-450 mt-1 block uppercase font-mono">{shuttle.plateNumber}</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                              <p className="flex items-start gap-1.5"><MapPin className="h-4 w-4 text-indigo-600 flex-shrink-0" /> <span>Rute: <strong>{shuttle.coverageAreas.join(", ")}</strong></span></p>
                              <p className="flex items-start gap-1.5"><School className="h-4 w-4 text-indigo-605 flex-shrink-0" /> <span>Kampus: <strong>{shuttle.targetCampuses.join(", ")}</strong></span></p>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-3 mt-6 flex items-center justify-between">
                            <div>
                              <span className="text-[8px] uppercase tracking-widest font-bold text-slate-400 font-mono">Biaya Mulai</span>
                              <span className="text-base font-black text-indigo-650 font-mono">Rp {shuttle.basePrice.toLocaleString("id")}</span>
                            </div>

                            {shuttle.status === "Available" ? (
                              <div className="flex items-center space-x-1.5">
                                <a
                                  href={`https://wa.me/${
                                    shuttle.whatsapp.replace(/\D/g, "").startsWith("0") 
                                      ? "62" + shuttle.whatsapp.replace(/\D/g, "").slice(1) 
                                      : shuttle.whatsapp.replace(/\D/g, "") || "628"
                                  }?text=${encodeURIComponent(`Halo Kak ${shuttle.driverName}! Saya berminat memesan layanan ANJEM SESHH Anda di Semarang. Apakah sedang available untuk mengantar saya sekarang?`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold border border-emerald-200 text-[10px] uppercase transition flex items-center space-x-1"
                                >
                                  <span>Chat WA</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isCurrentUserDriver) {
                                      triggerCustomAlert("Anda tidak bisa memesan jasa anjem Anda pribadi. Silakan buat akun testing mahasiswa atau sewa driver lain.");
                                      return;
                                    }
                                    setSelectedShuttle(shuttle);
                                  }}
                                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition ${
                                    selectedShuttle?.id === shuttle.id 
                                      ? "bg-slate-900 text-white" 
                                      : "bg-indigo-50 border border-indigo-100 text-indigo-805 hover:bg-indigo-100"
                                  }`}
                                >
                                  {selectedShuttle?.id === shuttle.id ? "Terpilih" : "Booking"}
                                </button>
                              </div>
                            ) : (
                              <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[9px] font-bold font-mono rounded">SIBUK / OFFLINE</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RIWAYAT RIDE TRACKING MODULE */}
              <div className="bg-white rounded-3xl p-6 border border-slate-205 space-y-4" id="booking-tracker">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-indigo-650" />
                    <h3 className="font-extrabold text-slate-950 text-xs uppercase tracking-wider font-mono">Log Riwayat Perjalanan</h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
                    {myBookings.length} Log Total
                  </span>
                </div>

                {loadingBookings ? (
                  <div className="text-center py-6 text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-1" /> Memuat data...
                  </div>
                ) : myBookings.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 space-y-2">
                    <HelpCircle className="h-9 w-9 text-slate-200 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">Anda belum pernah membuat reservasi.</p>
                    <p className="text-[10px] text-slate-400">Silakan sewa salah satu driver Semarang di atas!</p>
                  </div>
                ) : (
                  <div className="space-y-4" id="bookings-history-list">
                    {myBookings.map((booking) => (
                      <div key={booking.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition duration-300 space-y-3">
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                          <div>
                            <span className="block text-xs font-black text-slate-900">Kos &rarr; {booking.driverName}</span>
                            <span className="text-[8px] font-mono block text-slate-400">Booking ID: {booking.id}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 text-[8px] font-bold rounded-lg uppercase tracking-wider ${
                            booking.status === "pending" ? "bg-amber-55 text-amber-800 border border-amber-200 bg-amber-50" :
                            booking.status === "accepted" ? "bg-indigo-50 text-indigo-800 border border-indigo-200 animate-pulse" :
                            booking.status === "completed" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                            "bg-slate-200 text-slate-600"
                          }`}>
                            {booking.status === "pending" ? "Diproses" :
                             booking.status === "accepted" ? "Kurir Berangkat" :
                             booking.status === "completed" ? "Udah Sampai" : "Batal"}
                          </span>
                        </div>

                        {booking.status !== "cancelled" && (
                          <div className="space-y-3 bg-white p-2.5 rounded-xl border border-slate-100">
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-full transition-all duration-500 bg-indigo-650 ${
                                booking.status === "pending" ? "w-1/3" :
                                booking.status === "accepted" ? "w-2/3" : "w-full"
                              }`}></div>
                            </div>
                            <div className="flex justify-between text-[8px] font-mono font-bold tracking-wider text-slate-450 uppercase px-0.5">
                              <span className={booking.status === 'pending' ? 'text-amber-600' : ''}>Pemesanan</span>
                              <span className={booking.status === 'accepted' ? 'text-indigo-600' : ''}>Di Jalan</span>
                              <span className={booking.status === 'completed' ? 'text-emerald-600' : ''}>Selesai</span>
                            </div>

                            {/* Live GPS simulated track */}
                            {(booking.status === "accepted" || booking.status === "pending") && (
                              <LiveGpsTracker booking={booking} />
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-100 text-slate-650">
                          <div>
                            <span className="text-[8px] uppercase font-mono font-bold text-slate-400 tracking-wider">Antar dari</span>
                            <span className="text-slate-805 font-bold block">{booking.pickupLocation}</span>
                          </div>
                          <div>
                            <span className="text-[8px] uppercase font-mono font-bold text-slate-400 tracking-wider">Ke Gedung ({booking.campusName})</span>
                            <span className="text-slate-805 font-bold block">{booking.destination}</span>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between">
                          <div>
                            <span className="text-[8px] text-slate-400 block font-mono">Biaya Perjalanan</span>
                            <span className="text-sm font-black text-slate-900 font-mono">Rp {booking.price.toLocaleString("id")}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {booking.status !== "cancelled" && (
                              <a
                                href={getWhatsAppUrl(
                                  booking.driverWhatsapp || "628",
                                  booking.driverName,
                                  booking.id,
                                  booking.price,
                                  booking.pickupLocation,
                                  booking.destination
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 bg-emerald-650 hover:bg-emerald-705 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition flex items-center space-x-1.5 shadow-sm"
                              >
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span>Hubungi WA</span>
                              </a>
                            )}

                            {booking.status === "pending" && (
                              <button
                                onClick={() => handleCancelBooking(booking)}
                                className="px-3 py-2 bg-white hover:bg-slate-100 text-red-500 font-bold border border-slate-205 rounded-lg text-[9px] uppercase transition"
                              >
                                Batal
                              </button>
                            )}

                            {booking.status === "completed" && (
                              <button
                                onClick={() => setReviewingBooking(booking)}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-lg text-[9px] uppercase transition flex items-center space-x-1 shadow-sm"
                              >
                                <Star className="h-3 w-3 fill-white text-white" />
                                <span>Ulas</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN RIGHT (4 cols): STICKY ORDER FORM */}
            <div className="lg:col-span-4" id="order-panel">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-6 sticky top-24" id="sticky-order-box">
                <div>
                  <h3 className="font-extrabold text-slate-950 text-xs uppercase tracking-widest font-mono text-slate-500">Form Pemesanan Jasa</h3>
                  <h4 className="text-lg font-black text-slate-905 mt-0.5">Konfirmasi Rute Anda</h4>
                </div>

                {bookingSuccess && (
                  <div className="p-3 bg-indigo-50 text-indigo-850 rounded-xl text-xs space-y-1 border border-indigo-100 font-semibold" id="success-alert">
                    <span className="font-bold block text-indigo-805">Pemesanan Sukses!</span>
                    <p>{bookingSuccess}</p>
                    <button 
                      onClick={() => setBookingSuccess(null)}
                      className="text-[9px] uppercase underline mt-1 text-indigo-600 cursor-pointer block"
                    >
                      Tutup
                    </button>
                  </div>
                )}

                {bookingError && (
                  <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs border border-red-100 font-medium" id="error-alert">
                    {bookingError}
                  </div>
                )}

                {selectedShuttle ? (
                  <form onSubmit={handleCreateBooking} className="space-y-4">
                    
                    {/* Compact matched driver preview banner */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img src={selectedShuttle.driverPhoto} alt={selectedShuttle.driverName} className="w-9 h-9 rounded-full object-cover" />
                        <div>
                          <p className="font-black text-xs text-slate-950">{selectedShuttle.driverName}</p>
                          <span className="text-[8px] text-indigo-700 font-bold uppercase font-mono">{selectedShuttle.plateNumber} &bull; {selectedShuttle.vehicleType === 'Motorcycle' ? 'Motor' : 'Mobil'}</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedShuttle(null)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-250 rounded-xl transition"
                      >
                        <X className="h-4.5 w-4.5 text-slate-500" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-1">WhatsApp Hubungi Driver</label>
                      <a 
                        href={`https://wa.me/${selectedShuttle.whatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-indigo-705 font-mono font-bold hover:bg-slate-100 transition"
                      >
                        <Phone className="h-4 w-4 text-emerald-500 fill-emerald-500 animate-pulse" />
                        <span>Chat WhatsApp: +{selectedShuttle.whatsapp}</span>
                      </a>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-1">Titik Jemput (Kos / Jargon Semarang) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Gang Sirojudin No 12, Tembalang"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none font-semibold text-slate-900 placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-1">Tujuan / Gedung Fakultas *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Gedung ICT / Widya Puraya"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white focus:outline-none font-semibold text-slate-900 placeholder:text-slate-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-1">Universitas *</label>
                        <select
                          value={selectedCampus}
                          onChange={(e) => setSelectedCampus(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-1 text-slate-900"
                        >
                          {SEMARANG_CAMPUSES.map((c) => (
                            <option key={c.id} value={c.name} className="text-slate-900">{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-1">Kontak Anda *</label>
                        <input
                          type="text"
                          required
                          placeholder="0813xxxxxxxx"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:ring-1 text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase tracking-widest font-extrabold text-slate-500 mb-1">Rincian Catatan (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Bawa helm ganda / jas hujan"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400"
                      />
                    </div>

                    {/* Fare Summary billing block */}
                    <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs font-semibold">
                      <div>
                        <span className="block text-[8px] tracking-wider uppercase font-mono text-slate-400">Total Tarif</span>
                        <span className="text-indigo-805 truncate line-clamp-1">Sewa {selectedShuttle.driverName}</span>
                      </div>
                      <span className="text-base font-black font-mono text-indigo-700">
                        Rp {(selectedShuttle.basePrice + (selectedCampus !== selectedShuttle.targetCampuses[0] ? 3000 : 0)).toLocaleString("id")}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingBooking}
                      className="w-full py-3.5 bg-slate-900 hover:bg-indigo-650 text-white font-extrabold rounded-xl text-xs uppercase tracking-widest transition duration-300 flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg"
                    >
                      <Send className="h-4 w-4 text-indigo-300" />
                      <span>{submittingBooking ? "Mengirim..." : "Kirim Reservasi"}</span>
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-20 text-slate-400 space-y-3 bg-slate-50 rounded-3xl border border-slate-200/80" id="blank-form-display">
                    <Bike className="h-10 w-10 text-slate-350 mx-auto animate-bounce" />
                    <p className="text-xs font-extrabold text-slate-900 uppercase tracking-widest font-mono">Form Sewa Terkunci</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed px-4">
                      Silakan gunakan <strong>Radar Proximity</strong> di atas untuk pencarian otomatis driver terdekat, atau klik <strong>Sewa Sekarang</strong> manual pada kartu driver pilihan Anda.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
