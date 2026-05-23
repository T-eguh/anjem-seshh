import { useState, useEffect, FormEvent } from "react";
import { User, signOut } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  getDocs,
  orderBy, 
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
  UserCheck
} from "lucide-react";
import { db, auth, OperationType, handleFirestoreError } from "../lib/firebase";
import { Shuttle, Booking, Review, VehicleType } from "../types";
import { SEMARANG_CAMPUSES } from "../data/mockData";

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

  // Driver simulation state
  const [driverMode, setDriverMode] = useState(false);
  const [driverShuttle, setDriverShuttle] = useState<Shuttle | null>(null);
  const [driverBookings, setDriverBookings] = useState<Booking[]>([]);

  // Register Driver Form states
  const [registeringAsDriver, setRegisteringAsDriver] = useState(false);
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("Motorcycle");
  const [basePrice, setBasePrice] = useState(10000);
  const [coverageInput, setCoverageInput] = useState("Tembalang, Banyumanik, Pleburan");
  const [whatsappInput, setWhatsappInput] = useState("628");

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

  // 3. Listen to driver's assigned bookings in real-time if driverMode is true
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

  // 4. Handle booking submission (ordered by student)
  const handleCreateBooking = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedShuttle) return;
    if (!pickup.trim() || !destination.trim() || !phone.trim()) {
      setBookingError("Harap isi seluruh kolom wajib.");
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
      setBookingSuccess(`Sukses memesan Anjem dari ${selectedShuttle.driverName}!`);
      // Reset state
      setSelectedShuttle(null);
      setPickup("");
      setDestination("");
      setNotes("");
    } catch (error) {
      setBookingError("Gagal memproses pesanan. Silakan coba lagi.");
      handleFirestoreError(error, OperationType.CREATE, bookingsPath);
    } finally {
      setSubmittingBooking(false);
    }
  };

  // 5. Submit Driver profile creation
  const handleRegisterDriver = async (e: FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim() || !whatsappInput.trim()) {
      alert("Harap isi plat nomor dan nomor WhatsApp.");
      return;
    }

    const areas = coverageInput.split(",").map(a => a.trim()).filter(Boolean);
    const shuttleId = user.uid;

    const payload: Shuttle = {
      id: shuttleId,
      driverName: user.displayName || "Driver Mahasiswa",
      driverPhoto: user.photoURL || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
      vehicleType,
      plateNumber: plateNumber.toUpperCase(),
      whatsapp: whatsappInput.startsWith("62") ? whatsappInput : `62${whatsappInput.replace(/^0+/, "")}`,
      coverageAreas: areas,
      targetCampuses: [selectedCampus],
      basePrice,
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

  // 6. Student cancels booking
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

  // 7. Simulating driver status update (for real-time demo)
  const handleSimulateStatus = async (bookingId: string, newStatus: "accepted" | "completed" | "cancelled") => {
    const path = `bookings/${bookingId}`;
    try {
      const match = myBookings.find(b => b.id === bookingId) || driverBookings.find(b => b.id === bookingId);
      if (!match) return;

      await updateDoc(doc(db, "bookings", bookingId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // If completing, let's increment driver total trips and update status
      if (newStatus === "completed") {
        const driverRef = doc(db, "shuttles", match.shuttleId);
        try {
          await updateDoc(driverRef, {
            status: "Available"
          });
        } catch (e) {
          // It's okay if seed drivers don't allow update because of ID difference, we gracefully skip
        }
      } else if (newStatus === "accepted") {
        const driverRef = doc(db, "shuttles", match.shuttleId);
        try {
          await updateDoc(driverRef, {
            status: "Busy"
          });
        } catch (e) { }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // 8. Submit feedback review
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
      
      // Update booking status locally or mark as fully archived so review modal closes
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
    if (confirm("Apakah Anda yakin ingin berhenti menjadi driver Anjem Semarang?")) {
      const path = `shuttles/${driverShuttle.id}`;
      try {
        await deleteDoc(doc(db, "shuttles", driverShuttle.id));
        setDriverShuttle(null);
        setDriverMode(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900" id="dashboard-container">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 mr-auto ml-auto w-full max-w-7xl" id="dash-header">
        <div className="flex items-center justify-between mx-auto" id="dash-header-inner">
          <div className="flex items-center space-x-3" id="dash-logo">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-600/20">
              A
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">ANJEM<span className="text-indigo-600">.SRG</span></span>
              <span className="block text-[9px] text-slate-400 font-mono uppercase tracking-wider">Sistem Pelayanan</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 animate-fade-in" id="dash-user">
            {/* Real-time simulation status pulse */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">SYSTEM ACTIVE</span>
            </div>

            {/* Real-time simulation status toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setDriverMode(false)}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                  !driverMode ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sewa Anjem
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
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                  driverMode ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Jadi Driver {driverShuttle && "🟢"}
              </button>
            </div>

            <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
              <img 
                src={user.photoURL || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"} 
                alt="Profile" 
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-slate-200"
              />
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-black text-slate-900">{user.displayName || "Mahasiswa"}</span>
                <span className="block text-[9px] text-slate-400 font-mono">{user.email}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Keluar"
              id="btn-logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6" id="dash-main">
        {/* Mobile View Toggle */}
        <div className="flex sm:hidden items-center justify-between mb-4 bg-white p-1 border border-slate-200 rounded-xl" id="dash-mobile-tabs">
          <button
            onClick={() => setDriverMode(false)}
            className={`flex-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg transition ${
              !driverMode ? "bg-indigo-600 text-white" : "text-slate-600"
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
            className={`flex-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg transition ${
              driverMode ? "bg-indigo-600 text-white" : "text-slate-600"
            }`}
          >
            Jadi Driver {driverShuttle && "🟢"}
          </button>
        </div>

        {/* High Density Premium Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Tercatat di Sistem</p>
            <h3 className="text-xl font-black mt-1 text-slate-900">
              {driverMode ? driverBookings.length : myBookings.length} Perjalanan
            </h3>
            <p className="text-[10px] text-indigo-600 font-semibold mt-1">✓ Update Real-time</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Armada Terpasang</p>
            <h3 className="text-xl font-black mt-1 text-indigo-600">{shuttles.length} Driver</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Siap mengangkut mahasiswa</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Estimasi Tempuh</p>
            <h3 className="text-xl font-black mt-1 text-slate-900">3 - 10 Menit</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Respon instan tercepat</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Domain Jaringan</p>
            <h3 className="text-xl font-black mt-1 text-teal-600">Semarang</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Cloud Sync Firebase Active</p>
          </div>
        </div>

        {/* DRIVER REGISTRATION DIALOG */}
        {registeringAsDriver && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-200 animate-slide-up">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-base text-slate-950 uppercase tracking-wider">Form Pendaftaran Driver</h3>
                <button onClick={() => setRegisteringAsDriver(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed mb-4">
                Sistem Terpadu Antar Jemput Semarang terintegrasi dengan Google Firestore. Konfigurasikan detail kendaraan Anda agar dapat disewa mahasiswa Semarang secara dinamis!
              </p>

              <form onSubmit={handleRegisterDriver} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-700 mb-1">Status Nama Driver</label>
                  <input
                    type="text"
                    disabled
                    value={user.displayName || "Driver"}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-700 mb-1">Tipe Armada</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                    >
                      <option value="Motorcycle">Motor</option>
                      <option value="Car">Mobil</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-700 mb-1">Plat Nomor Kendaraan</label>
                    <input
                      type="text"
                      placeholder="H 1234 AWG"
                      required
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-700 mb-1">Tarif Dasar Kampus (Rp)</label>
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-700 mb-1">Cakupan Wilayah Semarang (Koma-pisahkan)</label>
                  <input
                    type="text"
                    placeholder="Tembalang, Banyumanik, Pleburan"
                    value={coverageInput}
                    onChange={(e) => setCoverageInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-700 mb-1">Nomor WhatsApp Aktif</label>
                  <input
                    type="text"
                    required
                    placeholder="628123456789"
                    value={whatsappInput}
                    onChange={(e) => setWhatsappInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-700 mb-1">Target Kampus Utama</label>
                  <select
                    value={selectedCampus}
                    onChange={(e) => setSelectedCampus(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    {SEMARANG_CAMPUSES.map(c => (
                      <option key={c.id} value={c.name}>{c.name} - {c.fullName}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer"
                >
                  Daftar Sekarang & Masuk Driver Station
                </button>
              </form>
            </div>
          </div>
        )}

        {/* FEEDBACK REVIEW DIALOG */}
        {reviewingBooking && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-up">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-slate-950 uppercase tracking-wider">Ulasan Perjalanan</h3>
                <button onClick={() => setReviewingBooking(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="mb-4 text-center">
                <span className="block text-[10px] text-slate-400 font-bold uppercase font-mono mb-0.5">Sewa Driver Anjem</span>
                <p className="font-extrabold text-sm text-indigo-700">{reviewingBooking.driverName}</p>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 text-center">Beri Penilaian Bintang</label>
                  <div className="flex items-center justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 text-yellow-400 hover:scale-110 transition cursor-pointer"
                      >
                        <Star className={`h-7 w-7 ${reviewRating >= star ? "fill-yellow-400" : "text-slate-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1">Catatan Kesan Mahasiswa</label>
                  <textarea
                    required
                    placeholder="Tulis ulasan singkat..."
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer"
                >
                  {submittingReview ? "Mengirim ulasan..." : "Kirim Ulasan & Selesaikan"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 1: PORTAL DRIVER & SIMULATION CONTROL */}
        {driverMode ? (
          <div className="space-y-6" id="driver-workspace">
            {/* Driver Profile Summary */}
            {driverShuttle ? (
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6" id="driver-summary">
                <div className="flex items-center space-x-4">
                  <img 
                    src={driverShuttle.driverPhoto} 
                    alt="Driver Photo" 
                    className="w-14 h-14 rounded-full border-2 border-indigo-500 object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="font-extrabold text-lg text-white">{driverShuttle.driverName}</h2>
                      <span className="px-2.5 py-0.5 text-[9px] font-bold bg-indigo-600 text-white rounded-full uppercase tracking-wider">Driver Aktif</span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{driverShuttle.plateNumber} &bull; {driverShuttle.vehicleType === "Motorcycle" ? "Motor" : "Mobil"}</p>
                    <div className="flex items-center space-x-2 mt-1.5 text-xs text-slate-350">
                      <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{driverShuttle.coverageAreas.join(", ")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-slate-850 pt-4 md:border-none md:pt-0" id="driver-shuttle-actions">
                  <div className="bg-slate-800 px-4 py-2 rounded-lg border border-white/5 text-center min-w-[80px]">
                    <span className="block text-[8px] text-slate-400 uppercase tracking-wider font-mono font-bold">Total Trip</span>
                    <span className="text-sm font-black text-amber-400">{driverShuttle.totalTrips}</span>
                  </div>

                  <div className="bg-slate-800 px-4 py-2 rounded-lg border border-white/5 text-center min-w-[80px]">
                    <span className="block text-[8px] text-slate-400 uppercase tracking-wider font-mono font-bold">Rating</span>
                    <span className="text-sm font-black text-teal-400 flex items-center justify-center">
                      {driverShuttle.rating.toFixed(1)} <Star className="h-3 w-3 fill-amber-400 text-amber-400 ml-0.5" />
                    </span>
                  </div>

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
                    className={`px-3.5 py-2 text-[10px] uppercase tracking-wider font-extrabold rounded-lg transition border cursor-pointer ${
                      driverShuttle.status === "Available" 
                      ? "bg-slate-850 border-indigo-500 text-indigo-400" 
                      : "bg-red-950/20 border-red-500 text-red-400"
                    }`}
                  >
                    Status: {driverShuttle.status === "Available" ? "ON (Menerima)" : "OFF (Istirahat)"}
                  </button>

                  <button
                    onClick={handleDeleteDriverAccount}
                    className="px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold rounded-lg bg-red-950/20 text-red-400 hover:bg-red-900 hover:text-white border border-red-900/30 transition cursor-pointer"
                  >
                    Hapus Akun
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4" id="driver-inactive-state">
                <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                <h3 className="font-extrabold text-base text-slate-950">Anda Belum Terdaftar Sebagai Driver</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Daftarkan kendaraan pribadi Anda sekarang di portal untuk dapat melayani pesanan dari mahasiswa kampus Semarang.
                </p>
                <button
                  onClick={() => setRegisteringAsDriver(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
                >
                  Daftar Sebagai Driver
                </button>
              </div>
            )}

            {/* Simulated Driver Booking Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="driver-simulation-sections">
              {/* Box 1: Student Orders assigned to Me */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4" id="assigned-order-box">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Antre Pesanan Masuk</h3>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded-full font-mono font-bold">
                    {driverBookings.length} Total
                  </span>
                </div>

                {driverBookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <CheckCircle className="h-7 w-7 text-slate-200 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">Belum ada pesanan masuk.</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Gunakan portal sebelah kiri untuk memesan perjalanan simulasi ke driver ini lalu lihat pemutakhiran real-time di sini!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1" id="driver-bookings-list">
                    {driverBookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-300 transition space-y-3"
                      >
                        <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                          <div>
                            <span className="block text-xs font-bold text-slate-900">{booking.studentName}</span>
                            <span className="block text-[8px] font-mono text-slate-400">UID: {booking.studentUid.substr(0, 8)}...</span>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                            booking.status === "pending" ? "bg-amber-100 text-amber-800" :
                            booking.status === "accepted" ? "bg-indigo-100 text-indigo-800 animate-pulse" :
                            booking.status === "completed" ? "bg-teal-100 text-teal-800" :
                            "bg-slate-200 text-slate-700"
                          }`}>
                            {booking.status === "pending" ? "Pending" :
                             booking.status === "accepted" ? "Jalan" :
                             booking.status === "completed" ? "Selesai" : "Batal"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                          <div>
                            <span className="block text-[8px] uppercase font-bold text-slate-400 font-mono">Penjemputan</span>
                            <span className="text-slate-800 font-medium line-clamp-1">{booking.pickupLocation}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase font-bold text-slate-400 font-mono">Tujuan</span>
                            <span className="text-slate-800 font-medium line-clamp-1">{booking.destination} ({booking.campusName})</span>
                          </div>
                        </div>

                        {booking.notes && (
                          <p className="text-[10px] text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                            Catatan: {booking.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                          <span className="text-xs font-bold text-slate-700">Biaya: <span className="text-indigo-600 font-mono font-bold">Rp {booking.price.toLocaleString("id")}</span></span>
                          <div className="flex items-center space-x-2">
                            {booking.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleSimulateStatus(booking.id, "accepted")}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                                >
                                  Terima
                                </button>
                                <button
                                  onClick={() => handleSimulateStatus(booking.id, "cancelled")}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-700 rounded text-[10px] font-bold uppercase cursor-pointer"
                                >
                                  Tolak
                                </button>
                              </>
                            )}

                            {booking.status === "accepted" && (
                              <button
                                onClick={() => handleSimulateStatus(booking.id, "completed")}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold uppercase cursor-pointer"
                              >
                                Selesaikan Trip
                              </button>
                            )}

                            {booking.status === "completed" && (
                              <span className="text-[9px] text-teal-600 font-bold flex items-center bg-teal-50 px-2 py-0.5 rounded">
                                <CheckCircle className="h-3 w-3 mr-1" /> Trip Selesai
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Box 2: Simulator Information Station */}
              <div className="bg-indigo-950 text-white rounded-2xl p-6 space-y-4 relative overflow-hidden" id="simulation-info-station">
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-700/15 rounded-full blur-3xl"></div>
                <h3 className="font-extrabold text-sm tracking-tight flex items-center uppercase font-mono text-indigo-300">
                  <UserCheck className="h-4 w-4 text-indigo-400 mr-2" /> Stasiun Simulasi Pengujian
                </h3>

                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <p>
                    Anda saat ini sedang berada dalam <strong>Mode Simulasi Driver</strong>. UI ini dirancang khusus untuk mendemonstrasikan kapabilitas integrasi real-time Google Firebase.
                  </p>
                  <div className="p-3 bg-black/20 border border-white/5 space-y-2 rounded-xl">
                    <span className="block font-bold text-white text-[10px] uppercase font-mono tracking-wider">Langkah Pengujian Mandiri:</span>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                      <li>Buka tab <strong>Portal Mahasiswa</strong> di pojok kanan atas.</li>
                      <li>Pilih salah satu driver aktif (termasuk profile Anda jika sudah online).</li>
                      <li>Kirimkan order baru mengisi formulir booking.</li>
                      <li>Kembali ke tab <strong>Portal Driver</strong> ini & status pesanan Anda akan terapdate di sini secara instan tanpa reload halaman!</li>
                      <li>Terima pesanan tersebut dan selesaikan, lalu tinjau kembali pemutakhiran visualnya di dasbor mahasiswa Anda.</li>
                    </ol>
                  </div>
                </div>

                <div className="pt-4 border-t border-indigo-900 flex justify-between items-center">
                  <span className="text-[10px] text-indigo-400 font-mono font-medium">Status Node: REAL_TIME_SYNC_ONLINE</span>
                  <button 
                    onClick={() => {
                      setDriverMode(false);
                    }}
                    className="px-3 py-1 bg-white text-indigo-950 rounded text-[10px] font-bold uppercase hover:bg-slate-100 transition cursor-pointer"
                  >
                    Kembali Ke Sewa
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: PORTAL MAHASISWA (ORDER & HISTORIC TRACKING) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="student-workspace">
            {/* COLUMN LEFT: AVAILABLE DRIVERS (8 cols in LG) */}
            <div className="lg:col-span-8 space-y-6" id="shuttle-showcase">
              {/* Search & Statistics Filter Widget */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="search-bar">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Eksplor Driver Semarang Terdekat</h3>
                  <p className="text-xs text-slate-400 mt-1">Pilih armada yang menjangkau kos-kosan dan universitas Anda di Semarang.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500 font-mono">Status Pool:</span>
                  <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 font-mono">
                    {shuttles.length} Driver Aktif
                  </span>
                </div>
              </div>

              {/* GRID OF DRIVERS */}
              {loadingShuttles ? (
                <div className="text-center py-12 text-slate-400">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-500" />
                  <p className="text-xs font-bold">Mencari ketersediaan Anjem di Semarang...</p>
                </div>
              ) : shuttles.length === 0 ? (
                <div className="bg-white rounded-xl p-8 border border-slate-200 text-center">
                  <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tidak ada armada terdaftar.</p>
                  <p className="text-xs text-slate-400 mt-1">Daftarkan akun sebagai driver di pojok kanan atas untuk mensimulasikan orderan!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="drivers-listing">
                  {shuttles.map((shuttle) => {
                    const isCurrentUserDriver = shuttle.id === user.uid;
                    return (
                      <div 
                        key={shuttle.id}
                        className={`bg-white rounded-xl p-5 border shadow-2xs transition duration-300 flex flex-col justify-between relative overflow-hidden ${
                          selectedShuttle?.id === shuttle.id 
                            ? "border-indigo-600 ring-2 ring-indigo-600/10" 
                            : "border-slate-200 hover:border-indigo-300"
                        }`}
                        id={`driver-card-${shuttle.id}`}
                      >
                        {/* Selected overlay border accent */}
                        {shuttle.status === "Busy" && (
                          <div className="absolute top-0 right-0 py-1 px-3 bg-red-50 text-red-700 text-[9px] font-bold rounded-bl-xl border-l border-b border-red-100 uppercase tracking-widest font-mono">
                            Sedang Melaju
                          </div>
                        )}

                        <div>
                          {/* Photo and Driver Name Header */}
                          <div className="flex items-center space-x-3 mb-4">
                            <img 
                              src={shuttle.driverPhoto} 
                              alt={shuttle.driverName} 
                              className="w-11 h-11 rounded-full border border-slate-100 object-cover"
                            />
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <h4 className="font-extrabold text-slate-955 text-sm leading-tight">{shuttle.driverName}</h4>
                                {isCurrentUserDriver && (
                                  <span className="text-[8px] bg-indigo-50 text-indigo-700 font-bold px-1.5 rounded-full uppercase tracking-wider font-mono">Anda</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1 mt-0.5">
                                {shuttle.vehicleType === "Motorcycle" ? (
                                  <Bike className="h-3 w-3 text-slate-400" />
                                ) : (
                                  <Car className="h-3 w-3 text-slate-400" />
                                )}
                                <span className="text-[9px] text-slate-400 font-mono italic uppercase">{shuttle.plateNumber}</span>
                              </div>
                            </div>
                          </div>

                          {/* Detail Information Row */}
                          <div className="space-y-2 text-xs text-slate-600 mb-6">
                            <div className="flex items-start space-x-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2"><strong>Rute Keberangkatan:</strong> {shuttle.coverageAreas.join(", ")}</span>
                            </div>

                            <div className="flex items-start space-x-1">
                              <School className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2"><strong>Kampus Tujuan:</strong> {shuttle.targetCampuses.join(", ")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom action pricing block */}
                        <div className="border-t border-slate-100 pt-3 mt-auto flex items-center justify-between" id="shuttle-card-footer">
                          <div>
                            <span className="block text-[8px] uppercase font-bold text-slate-400 font-mono">Tarif Mulai</span>
                            <span className="text-base font-black text-indigo-600 font-mono">Rp {shuttle.basePrice.toLocaleString("id")}</span>
                          </div>

                          {shuttle.status === "Available" ? (
                            <button
                              onClick={() => {
                                if (isCurrentUserDriver) {
                                  alert("Anda tidak bisa memesan jasa anjem Anda sendiri. Silakan beralih ke Portal Driver atau buat akun pengujian terpisah jika diperlukan.");
                                  return;
                                }
                                setSelectedShuttle(shuttle);
                                setPickup("");
                                setDestination("");
                              }}
                              className={`px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition ${
                                selectedShuttle?.id === shuttle.id 
                                  ? "bg-slate-900 text-white" 
                                  : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-150"
                              }`}
                            >
                              {selectedShuttle?.id === shuttle.id ? "Terpilih" : "Sewa Anjem"}
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-150 text-slate-500 font-bold text-[8px] uppercase tracking-wider font-mono rounded">
                              Sibuk / Offline
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* BOOKING TRACKER STATION */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 space-y-4" id="booking-tracker">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Riwayat Perjalanan Anda</h3>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-750 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {myBookings.length} Total
                  </span>
                </div>

                {loadingBookings ? (
                  <div className="text-center py-6 text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mr-2 text-indigo-505" /> Meninjau berkas booking...
                  </div>
                ) : myBookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <HelpCircle className="h-7 w-7 text-slate-200 mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">Anda belum pernah melakukan pemesanan.</p>
                    <p className="text-[10px] text-slate-400">Silakan klik tombol "Sewa Anjem" di atas untuk membuat order baru!</p>
                  </div>
                ) : (
                  <div className="space-y-4" id="bookings-history-list">
                    {myBookings.map((booking) => (
                      <div 
                        key={booking.id} 
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-xs transition duration-200 space-y-3"
                      >
                        <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100">
                          <div>
                            <span className="block text-xs font-bold text-slate-900">{booking.driverName}</span>
                            <span className="block text-[8px] text-slate-400 font-mono">ID Booking: {booking.id}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                              booking.status === "pending" ? "bg-amber-50 text-amber-800 border border-amber-200" :
                              booking.status === "accepted" ? "bg-indigo-50 text-indigo-800 border border-indigo-200 animate-pulse" :
                              booking.status === "completed" ? "bg-teal-50 text-teal-850 border border-teal-200" :
                              "bg-slate-200 text-slate-700"
                            }`}>
                              {booking.status === "pending" ? "Menunggu" :
                               booking.status === "accepted" ? "Menjemput" :
                               booking.status === "completed" ? "Selesai" : "Batal"}
                            </span>
                          </div>
                        </div>

                        {/* Interactive simulation visual progress bar */}
                        {booking.status !== "cancelled" && (
                          <div className="space-y-1">
                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  booking.status === "pending" ? "w-1/3 bg-amber-500" :
                                  booking.status === "accepted" ? "w-2/3 bg-indigo-600" :
                                  "w-full bg-teal-500"
                                }`}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[8px] font-bold tracking-wider text-slate-400 uppercase font-mono px-0.5">
                              <span className={booking.status === "pending" ? "text-amber-600" : ""}>Booked</span>
                              <span className={booking.status === "accepted" ? "text-indigo-600" : ""}>Jalan</span>
                              <span className={booking.status === "completed" ? "text-teal-600" : ""}>Selesai</span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                          <div>
                            <span className="text-slate-400 text-[10px] block font-mono font-bold uppercase">Jalur Jemput</span>
                            <span className="font-semibold text-slate-800">{booking.pickupLocation}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block font-mono font-bold uppercase">Tujuan ({booking.campusName})</span>
                            <span className="font-semibold text-slate-800">{booking.destination}</span>
                          </div>
                        </div>

                        {/* Booking Meta Action Area */}
                        <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono uppercase">Harga Final</span>
                            <span className="text-sm font-black text-slate-900 font-mono">Rp {booking.price.toLocaleString("id")}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {booking.status === "pending" && (
                              <button
                                onClick={() => handleCancelBooking(booking)}
                                className="px-3 py-1 bg-white hover:bg-slate-100 text-red-500 font-bold border border-slate-200 rounded-lg text-[10px] uppercase cursor-pointer transition"
                              >
                                Batalkan Order
                              </button>
                            )}

                            {booking.status === "completed" && (
                              <button
                                onClick={() => setReviewingBooking(booking)}
                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] uppercase cursor-pointer flex items-center space-x-1 shadow-sm transition"
                              >
                                <Star className="h-3 w-3 fill-white text-white" />
                                <span>Beri Ulasan</span>
                              </button>
                            )}

                            {/* Simulation station inline helper to let student test their own order */}
                            {booking.status === "pending" && (
                              <div className="bg-amber-50 text-amber-900 px-3 py-1 text-[9px] font-medium leading-tight rounded border border-amber-100 max-w-xs text-center">
                                *Gunakan beralih ke <strong>Portal Driver</strong> di atas untuk simulasi real-time update.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN RIGHT: ORDER PANEL (4 cols in LG) */}
            <div className="lg:col-span-4" id="order-panel">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-6 sticky top-20" id="sticky-order-box">
                <div>
                  <h3 className="font-extrabold text-slate-950 text-sm uppercase tracking-wider">Form Sewa Anjem</h3>
                  <p className="text-xs text-slate-400 mt-1">Pesan langsung sewa driver Semarang tepercaya di bawah.</p>
                </div>

                {bookingSuccess && (
                  <div className="p-3 bg-indigo-50 text-indigo-800 rounded-lg text-xs space-y-1 border border-indigo-100 animate-fade-in font-medium" id="success-alert">
                    <span className="font-bold block">Pemesanan Terkirim!</span>
                    <p>{bookingSuccess}</p>
                  </div>
                )}

                {bookingError && (
                  <div className="p-3 bg-red-50 text-red-800 rounded-lg text-xs font-medium border border-red-100" id="error-alert">
                    {bookingError}
                  </div>
                )}

                {selectedShuttle ? (
                  <form onSubmit={handleCreateBooking} className="space-y-4">
                    {/* Tiny Driver badge inside form */}
                    <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={selectedShuttle.driverPhoto} 
                          alt={selectedShuttle.driverName} 
                          className="w-8 h-8 rounded-full border border-slate-150"
                        />
                        <div>
                          <span className="block font-bold text-xs text-slate-900">{selectedShuttle.driverName}</span>
                          <span className="block text-[8px] text-indigo-700 uppercase font-bold font-mono">{selectedShuttle.vehicleType === "Motorcycle" ? "Motor" : "Mobil"} &bull; {selectedShuttle.plateNumber}</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedShuttle(null)}
                        className="p-1 hover:bg-indigo-100 text-indigo-800 rounded-lg cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1">Hubungi Chat WhatsApp</label>
                      <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <Phone className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                        <span className="text-xs font-mono font-semibold text-slate-700">+{selectedShuttle.whatsapp}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1">Titik Jemput (Alamat/Kos) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Gang Gayamsari V, Tembalang (Kos Elok)"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1">Gedung / Fakultas Tujuan *</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Dekanat Ilmu Sosial FISIP"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1">Universitas *</label>
                        <select
                          value={selectedCampus}
                          onChange={(e) => setSelectedCampus(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                        >
                          {SEMARANG_CAMPUSES.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1">No. Telp Aktif *</label>
                        <input
                          type="text"
                          required
                          placeholder="081xxxxx"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-700 tracking-wider mb-1">Catatan Tambahan (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Bawa helm ganda / jas hujan"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    </div>

                    {/* Cost Computation */}
                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center text-xs">
                      <div>
                        <span className="block text-[8px] text-slate-400 font-bold uppercase font-mono">Estimasi Biaya</span>
                        <span className="text-slate-800 font-bold text-[11px] leading-tight line-clamp-1">{selectedShuttle.driverName}</span>
                      </div>
                      <span className="text-sm font-black text-indigo-700 font-mono">
                        Rp {(selectedShuttle.basePrice + (selectedCampus !== selectedShuttle.targetCampuses[0] ? 3000 : 0)).toLocaleString("id")}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingBooking}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs uppercase tracking-widest transition cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <Send className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{submittingBooking ? "Proses..." : "Kirim Order"}</span>
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-16 text-slate-400 space-y-3" id="blank-form-display">
                    <Bike className="h-9 w-9 text-slate-200 mx-auto animate-pulse" />
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Form Terkunci</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Silakan pilih salah satu armada yang tersedia di daftar sebelah kiri terlebih dahulu untuk memulai pengisian.
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
