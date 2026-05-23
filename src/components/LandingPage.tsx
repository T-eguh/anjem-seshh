import { useState, FormEvent, useEffect } from "react";
import { motion } from "motion/react";
import { 
  MapPin, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Bike, 
  Car, 
  Star, 
  Users,
  Search,
  School,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle
} from "lucide-react";
import { SEMARANG_CAMPUSES } from "../data/mockData";
import { db } from "../lib/firebase";
import { collection, limit, onSnapshot, query } from "firebase/firestore";
import { Shuttle } from "../types";

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  // Tariff estimation state
  const [pickup, setPickup] = useState("Tembalang");
  const [destination, setDestination] = useState("UNDIP");
  const [vehicle, setVehicle] = useState<"Motorcycle" | "Car">("Motorcycle");
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [liveDrivers, setLiveDrivers] = useState<Shuttle[]>([]);

  const pickupAreas = [
    "Tembalang", 
    "Sekaran / Gunungpati", 
    "Pleburan", 
    "Kaligawe", 
    "Ngaliyan", 
    "Sampangan", 
    "Banyumanik", 
    "Kota Lama"
  ];
  const campusTargets = ["UNDIP", "UNNES", "UDINUS", "UNISSULA", "UNIMUS", "UNIKA", "UIN Walisongo"];

  // Fetch real-time driver overview for display on Landing Page
  useEffect(() => {
    const q = query(collection(db, "shuttles"), limit(4));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Shuttle[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Shuttle);
      });
      setLiveDrivers(list);
    }, (error) => {
      console.warn("Could not load preview list of drivers: ", error);
    });
    return () => unsubscribe();
  }, []);

  const handleEstimate = (e: FormEvent) => {
    e.preventDefault();
    setIsEstimating(true);
    setEstimatedPrice(null);

    setTimeout(() => {
      let base = vehicle === "Motorcycle" ? 8000 : 18000;
      
      // Semarang specific geography cost computation
      if (pickup === "Tembalang" && destination === "UNDIP") base += 2000;
      else if (pickup.includes("Sekaran") && destination === "UNNES") base += 1500;
      else if (pickup === "Pleburan" && destination === "UDINUS") base += 2000;
      else if ((pickup === "Tembalang" && destination === "UNNES") || (pickup.includes("Sekaran") && destination === "UNDIP")) {
        // High distance over Semarang steep terrain!
        base += 15000;
      } else {
        base += 9000;
      }

      setEstimatedPrice(base);
      setIsEstimating(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-hidden" id="landing-container">
      {/* Decorative premium background patterns for Anjem theme */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" id="mesh-grid"></div>
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-rose-200/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Premium Notification Toast Header */}
      <div className="relative z-10 bg-indigo-650 text-white text-center py-2.5 px-4 text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5" id="top-announcement">
        <Sparkles className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300 animate-pulse" />
        <span>Pemesanan Terintegrasi Real-Time Cloud Firestore &amp; Siap Live Untuk Mahasiswa</span>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200/65 px-4 py-4" id="landing-navbar">
        <div className="max-w-7xl mx-auto flex items-center justify-between" id="nav-inner">
          <div className="flex items-center space-x-3" id="nav-logo">
            <div className="w-10 h-10 bg-indigo-650 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-md shadow-indigo-600/30">
              <Bike className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">ANJEM<span className="text-indigo-650"> SESHH</span></span>
              <span className="block text-[9px] text-slate-400 font-mono tracking-wider uppercase font-bold">Portal Antar Jemput Mahasiswa Semarang</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8" id="nav-links">
            <a href="#features" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition">Fitur Unggul</a>
            <a href="#campuses" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition">Wilayah Kampus</a>
            <a href="#drivers-preview" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition">Driver Aktif</a>
            <a href="#calculator" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition">Tarif Transparan</a>
          </div>

          <div id="nav-cta">
            <button
              onClick={onLoginClick}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-550 text-slate-950 hover:from-amber-400 hover:to-orange-455 text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:shadow-[0_0_22px_rgba(241,92,12,0.7)] border border-white/50 hover:scale-[1.04] cursor-pointer flex items-center space-x-1.5"
              id="btn-nav-login"
            >
              <span>Daftar Jadi Driver</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center" id="hero-section">
        <div className="lg:col-span-7 space-y-8" id="hero-content">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold" id="badge-hero">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></div>
            <span className="uppercase tracking-widest text-[9px]">Layanan Khusus Semarang</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-tight" id="hero-title">
            Mobilitas Kampus <span className="text-indigo-650">Lebih Cepat</span>, Aman &amp; Hemat.
          </h1>
          
          <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-2xl" id="hero-desc">
            Hindari telat kelas pagi di Semarang! <strong>ANJEM SESHH</strong> menghubungkan langsung mahasiswa dengan driver terdekat secara real-time. Pesan instan, pantau status, dan langsung pergi ke fakultas impianmu tanpa ribet macet &amp; cari parkir.
          </p>

          {/* Key Trust Badges */}
          <div className="grid grid-cols-3 gap-6 max-w-xl bg-white/60 backdrop-blur-md p-4 border border-slate-205 rounded-2xl" id="hero-stats">
            <div>
              <span className="block text-2xl md:text-3xl font-black text-slate-900 font-mono">10k+</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mt-0.5">Trips Selesai</span>
            </div>
            <div>
              <span className="block text-2xl md:text-3xl font-black text-slate-900 font-mono">45+</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mt-0.5">Driver Aktif</span>
            </div>
            <div>
              <span className="block text-2xl md:text-3xl font-black text-indigo-600 flex items-center font-mono">4.9 <Star className="h-5 w-5 text-amber-500 ml-1.5 fill-amber-500" /></span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mt-0.5">Kepuasan Mhs</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4" id="hero-ctas">
            <button
              onClick={onLoginClick}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-650 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-widest transition duration-300 shadow-lg shadow-indigo-650/20 cursor-pointer text-center flex items-center justify-center space-x-2"
              id="cta-book"
            >
              <span>Mulai Cari Driver</span>
              <Zap className="h-4 w-4" />
            </button>
            <a
              href="#calculator"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-705 font-bold text-xs uppercase tracking-widest border border-slate-200 transition text-center cursor-pointer block shadow-sm"
              id="cta-estimate"
            >
              Cek Estimasi Tarif
            </a>
          </div>
        </div>

        {/* Hero Interactive UI Card with High Density look */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto relative z-10" id="hero-visual">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-6 shadow-2xl border border-teal-200/80 relative overflow-hidden bg-cover bg-center text-slate-900"
            style={{ 
              backgroundImage: "linear-gradient(to bottom, rgba(255, 248, 240, 0.25), rgba(255, 255, 255, 0.45)), url('https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?w=600&auto=format&fit=crop&q=100')" 
            }}
            id="interactive-concept-card"
          >
            {/* Visual Glass Header */}
            <div className="flex items-center justify-between mb-6 border-b border-white/50 pb-4 bg-white/70 backdrop-blur-sm p-3 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-xs font-mono shadow-md animate-bounce">
                  VESPA
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Layanan Premium</h4>
                  <p className="text-[10px] text-amber-600 font-bold font-mono">EDISI VESPA SEMARANG</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-emerald-500 text-white rounded-full flex items-center space-x-1 shadow-md">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest font-mono">ONLINE</span>
              </div>
            </div>

            {/* Quick Map Line with solid white high-contrast backing */}
            <div className="space-y-4 relative px-1 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-lg text-slate-800" id="vis-card-path">
              <div className="absolute left-[29px] top-[40px] bottom-[40px] w-0.5 border-l-2 border-dashed border-indigo-400"></div>

              <div className="flex items-start space-x-3 relative z-10" id="path-pickup">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-xs shadow-md">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[8px] text-amber-600 uppercase font-black tracking-wider font-mono">Penjemputan Anda</p>
                  <p className="text-xs font-black text-slate-900">Kost Tembalang Raya, Semarang</p>
                  <p className="text-[10px] text-slate-500">Area sekitar Kampus UNDIP</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 relative z-10" id="path-dropoff">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                  <School className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[8px] text-indigo-600 uppercase font-black tracking-wider font-mono">Tujuan Fakultas</p>
                  <p className="text-xs font-black text-slate-900">Dekanat Fakultas Kedokteran UNDIP</p>
                  <p className="text-[10px] text-slate-500">Gedung Utama, Tembalang</p>
                </div>
              </div>
            </div>

            {/* Simulated Live Match with bold contrasted theme */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-white flex justify-between items-center relative overflow-hidden shadow-xl" id="vis-card-meta">
              <div>
                <span className="text-[8px] text-yellow-405 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-yellow-300 animate-spin" /> Driver Vespa Rekomendasi
                </span>
                <p className="text-xs font-bold text-white mt-0.5">Aris Tembalang &bull; Vespa Sprint Kuning</p>
                <div className="flex items-center space-x-1.5 mt-1">
                  <Star className="h-3.5 w-3.5 text-yellow-405 fill-yellow-405" style={{ color: "#fbbf24", fill: "#fbbf24" }} />
                  <span className="text-[10px] font-bold text-slate-300">4.9 (184 trips)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block font-mono">Mulai Dari</span>
                <span className="text-sm font-black text-yellow-400 font-mono block">Rp 10.000</span>
              </div>
            </div>

            {/* Super Prominent Bright Glowing Register Now CTA Button */}
            <button 
              onClick={onLoginClick}
              className="mt-5 w-full py-4.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:scale-[1.03] text-slate-950 font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-2xl shadow-amber-500/35 border-2 border-white hover:border-yellow-250 animate-pulse"
            >
              <Zap className="h-4.5 w-4.5 text-white fill-white animate-bounce" />
              <span className="text-slate-950 font-black">DAFTAR DRIVER SEKARANG JUGA &rarr;</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* High-Fidelity Features Section */}
      <section className="bg-white py-20 px-4 border-y border-slate-200/80" id="features">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4" id="features-header">
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Kelebihan Utama ANJEM SESHH</h2>
            <p className="text-sm md:text-base text-slate-500">Dirancang khusus untuk menyesuaikan kebutuhan finansial dan waktu mahasiswa Semarang.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8" id="features-grid">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-indigo-300 hover:bg-white transition duration-300 shadow-sm" id="feat-1">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Keberangkatan Instant</h3>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">Pesan langsung saat di kos, driver siap siaga di area sekitar kampus untuk memangkas waktu nunggu Anda.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-indigo-300 hover:bg-white transition duration-300 shadow-sm" id="feat-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Aman &amp; Tepercaya</h3>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">Seluruh profil driver kami diverifikasi dengan kelengkapan SIM, STNK, dan identitas kampus Semarang.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-indigo-300 hover:bg-white transition duration-300 shadow-sm" id="feat-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Tarif Kantong Mahasiswa</h3>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">Tarif trasparan dari awal tanpa ada biaya siluman. Sangat pas dengan ketersediaan bulanan mahasiswa.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-indigo-300 hover:bg-white transition duration-300 shadow-sm" id="feat-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Teman Sekampus</h3>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">Driver mayoritas mahasiswa aktif di Semarang. Perbanyak obrolan seru dan link jejaring sosial.</p>
            </div>
          </div>
        </div>
      </section>

      {/* University Coverage Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto space-y-12" id="campuses">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">Dukungan Wilayah</span>
          <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Wilayah Jangkauan Semarang</h2>
          <p className="text-sm text-slate-500">Mencakupi seluruh fakultas dan asrama di kampus-kampus utama kota Semarang.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="campus-grid">
          {SEMARANG_CAMPUSES.map((campus) => (
            <div 
              key={campus.id} 
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition duration-300 flex flex-col justify-between"
              id={`campus-card-${campus.id}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
                    <School className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 uppercase">
                    {campus.availableDrivers} Driver
                  </span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900">{campus.name}</h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">{campus.fullName}</p>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 border-t border-slate-100 pt-4 mt-6">
                <MapPin className="h-4 w-4 text-slate-405 text-indigo-600" />
                <span>Sekitar {campus.mainArea}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Elegant Live Driver Preview Deck */}
      <section className="bg-slate-100/60 py-20 px-4 border-t border-slate-200" id="drivers-preview">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-widest font-mono rounded-full">LIVE PREVIEW</span>
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Daftar Driver yang Sedang Online</h2>
            <p className="text-sm text-slate-500">Berikut beberapa driver Semarang yang online di database real-time saat ini.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {liveDrivers.length > 0 ? (
              liveDrivers.map((driver) => (
                <div key={driver.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <img src={driver.driverPhoto} alt={driver.driverName} className="w-10 h-10 rounded-full border object-cover" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs leading-none">{driver.driverName}</h4>
                        <span className="text-[9px] text-slate-400 font-mono mt-1 block uppercase font-bold">{driver.plateNumber}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-500">
                      <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" /> <span className="line-clamp-1">{driver.coverageAreas.join(", ")}</span></p>
                      <p className="flex items-center gap-1.5"><School className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" /> <span className="line-clamp-1">{driver.targetCampuses.join(", ")}</span></p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] text-slate-400 block font-mono font-bold uppercase">Tarif Mulai</span>
                      <span className="text-sm font-black text-indigo-600 font-mono">Rp {driver.basePrice.toLocaleString("id")}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${driver.status === 'Available' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700'}`}>
                      {driver.status === "Available" ? "SIAP" : "SIBUK"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                Sedang memuat data driver real-time dari Firebase...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interactive Tariff Estimator Calculator */}
      <section className="bg-slate-900 text-white py-20 px-4" id="calculator">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6" id="calc-intro">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Simulasi Biaya Transparan</span>
            <h2 className="text-4xl font-extrabold tracking-tight">Kalkulator Estimasi Biaya Perjalanan</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Dapatkan kepastian tarif sewa sebelum memesan. Gunakan kalkulator interaktif kami untuk mengestimasi biaya pengantaran dari wilayah kos Anda ke lokasi dekanat kampus di Kota Semarang.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                <span>Perhitungan adil berdasarkan rute Semarang</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                <span>Pilihan armada roda dua (Sangat Gesit) atau roda empat</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7" id="calc-form-container">
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 text-slate-900">
              <form onSubmit={handleEstimate} className="space-y-5">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-300 mb-1.5 font-mono">Pilih Wilayah Penjemputan</label>
                  <select 
                    value={pickup} 
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full bg-slate-850 text-white border border-slate-755 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {pickupAreas.map((area) => (
                      <option className="bg-slate-950" key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-300 mb-1.5 font-mono">Universitas Tujuan</label>
                  <select 
                    value={destination} 
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-slate-850 text-white border border-slate-755 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {campusTargets.map((c) => (
                      <option className="bg-slate-950" key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-300 mb-2 font-mono">Pilih Jenis Armada</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setVehicle("Motorcycle")}
                      className={`py-3 rounded-xl border text-xs font-bold transition duration-200 uppercase tracking-widest flex items-center justify-center space-x-2 cursor-pointer ${
                        vehicle === "Motorcycle" 
                        ? "bg-indigo-650 border-indigo-500 text-white shadow-md shadow-indigo-650/10" 
                        : "bg-slate-850 border-slate-755 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <Bike className="h-4 w-4" />
                      <span>Armada Motor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicle("Car")}
                      className={`py-3 rounded-xl border text-xs font-bold transition duration-200 uppercase tracking-widest flex items-center justify-center space-x-2 cursor-pointer ${
                        vehicle === "Car" 
                        ? "bg-indigo-650 border-indigo-500 text-white shadow-md shadow-indigo-650/10" 
                        : "bg-slate-850 border-slate-755 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <Car className="h-4 w-4" />
                      <span>Armada Mobil</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isEstimating}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-550 disabled:bg-indigo-805 text-white rounded-xl font-bold text-xs uppercase tracking-widest cursor-pointer mt-4 transition duration-300"
                >
                  {isEstimating ? "Menghitung Estimasi Tarif..." : "Kalkulasikan Biaya"}
                </button>
              </form>

              {estimatedPrice !== null && (
                <div className="mt-6 p-5 rounded-2xl bg-slate-950 border border-slate-850 text-center animate-fade-in text-white">
                  <span className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-mono font-bold">Hasil Perhitungan Biaya</span>
                  <p className="text-3xl font-black text-indigo-400 font-mono">
                    Rp {estimatedPrice.toLocaleString("id-ID")}
                  </p>
                  <span className="block text-[9px] text-slate-500 mt-2">
                    *Harga pas standar kemahasiswaan. Negosiasi lanjutan bisa langsung dibicarakan dengan driver.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-4 border-t border-slate-900" id="landing-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8" id="footer-inner">
          <div className="text-center md:text-left space-y-2">
            <span className="font-extrabold text-white text-2xl tracking-tight">ANJEM<span className="text-indigo-400"> SESHH</span></span>
            <p className="text-xs text-slate-500">Solusi transportasi terintegrasi antar jemput real-time mahasiswa Semarang terpercaya.</p>
          </div>
          
          <div className="flex items-center space-x-6 text-xs" id="footer-links">
            <span className="text-[10px] text-slate-600 font-mono">Build Ready &bull; Auth Secure v2.6</span>
            <button onClick={onLoginClick} className="text-white font-bold hover:text-indigo-400 transition cursor-pointer uppercase tracking-widest text-[10px] underline">Daftar Jadi Driver</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-900 mt-10 pt-8 text-center text-xs text-slate-600">
          &copy; {new Date().getFullYear()} ANJEM SESHH. Sistem ini terintegrasi sepenuhnya dengan Firebase NoSQL Database.
        </div>
      </footer>
    </div>
  );
}
