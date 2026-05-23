import { useState, FormEvent } from "react";
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
  ChevronRight
} from "lucide-react";
import { SEMARANG_CAMPUSES, SemarangCampus } from "../data/mockData";

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  // Tariff estimation state
  const [pickup, setPickup] = useState("Tembalang");
  const [destination, setDestination] = useState("UNDIP");
  const [vehicle, setVehicle] = useState<"Motorcycle" | "Car">("Motorcycle");
  const [isEstimaging, setIsEstimating] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  const pickupAreas = ["Tembalang", "Sekaran / Gunungpati", "Pleburan", "Kaligawe", "Ngaliyan", "Sampangan", "Banyumanik", "Kota Lama"];
  const campusTargets = ["UNDIP", "UNNES", "UDINUS", "UNISSULA", "UNIMUS", "UNIKA", "UIN Walisongo"];

  const handleEstimate = (e: FormEvent) => {
    e.preventDefault();
    setIsEstimating(true);
    setEstimatedPrice(null);

    setTimeout(() => {
      // Elegant simple Semarang-themed price calculations
      let base = vehicle === "Motorcycle" ? 8000 : 18000;
      
      // Add distance cost factors based on typical Semarang topology
      if (pickup.includes("Tembalang") && destination === "UNDIP") base += 2000;
      else if (pickup.includes("Sekaran") && destination === "UNNES") base += 1000;
      else if (pickup.includes("Pleburan") && destination === "UDINUS") base += 3000;
      else {
        // Cross city Semarang (e.g. Tembalang to UNNES is hilly and far!)
        base += 12000;
      }

      setEstimatedPrice(base);
      setIsEstimating(false);
    }, 1500); // Realistic calculation duration
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans" id="landing-container">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-slate-200 px-4 py-3 mr-auto ml-auto max-w-7xl font-sans" id="landing-navbar">
        <div className="flex items-center justify-between mx-auto" id="nav-inner">
          <div className="flex items-center space-x-3" id="nav-logo">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-600/20">
              <Bike className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">ANJEM<span className="text-indigo-600">.SRG</span></span>
              <span className="block text-[9px] text-slate-500 font-mono tracking-wider uppercase">Sistem Antar Jemput Mahasiswa</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6" id="nav-links">
            <a href="#features" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition">Fitur Utama</a>
            <a href="#campuses" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition">Kampus Terdaftar</a>
            <a href="#calculator" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition">Estimasi Tarif</a>
            <a href="#testimonials" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition">Ulasan</a>
          </div>

          <div id="nav-cta">
            <button
              onClick={onLoginClick}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm shadow-indigo-600/20 cursor-pointer flex items-center space-x-1.5"
              id="btn-nav-login"
            >
              <span>Portal Masuk</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12" id="hero-section">
        <div className="flex-1 space-y-6" id="hero-content">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold" id="badge-hero">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
            <span className="uppercase tracking-wider text-[10px]">Layanan Mahasiswa Semarang</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight" id="hero-title">
            Solusi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">Antar Jemput</span> Mahasiswa Terpercaya & Real-Time.
          </h1>
          
          <p className="text-sm text-slate-500 leading-relaxed max-w-xl" id="hero-desc">
            Mobilitas kampus yang aman, hemat, dan praktis. Dirancang khusus untuk mahasiswa kota Semarang. Dapatkan antar-jemput langsung ke depan gerbang fakultasmu!
          </p>

          {/* Core Stats */}
          <div className="grid grid-cols-3 gap-4 border-y border-slate-200 py-4" id="hero-stats">
            <div>
              <span className="block text-2xl font-black text-slate-900">10k+</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total perjalanan</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-900">45+</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Driver aktif</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-900">4.9</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center">Rating mhs <Star className="h-3 w-3 text-amber-500 ml-1 fill-amber-500" /></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2" id="hero-ctas">
            <button
              onClick={onLoginClick}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition duration-200 shadow-md shadow-indigo-600/20 cursor-pointer text-center"
              id="cta-book"
            >
              Order Anjem Sekarang
            </button>
            <a
              href="#calculator"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider border border-slate-200 transition text-center cursor-pointer"
              id="cta-estimate"
            >
              Cek Estimasi Tarif
            </a>
          </div>
        </div>

        {/* Hero Interactive UI Card with High Density look */}
        <div className="flex-1 w-full max-w-md mx-auto" id="hero-visual">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 relative overflow-hidden"
            id="interactive-concept-card"
          >
            {/* Visual Header */}
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3" id="vis-card-header">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                  AM
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Anjem Semarang</h4>
                  <p className="text-[10px] text-slate-400">Tembalang Raya</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full border border-green-200">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">
                  SYSTEM ACTIVE
                </span>
              </div>
            </div>

            {/* Quick Map Line */}
            <div className="space-y-4 relative" id="vis-card-path">
              {/* Vertical line connector */}
              <div className="absolute left-[13px] top-[24px] bottom-[24px] w-0.5 border-l-2 border-dashed border-slate-200"></div>

              <div className="flex items-start space-x-3 relative z-10" id="path-pickup">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white ring-4 ring-indigo-50 text-xs font-black">
                  P
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">Titik Penjemputan</p>
                  <p className="text-xs font-bold text-slate-800">Kos Tembalang Barat, Semarang</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 relative z-10" id="path-dropoff">
                <div className="w-7 h-7 rounded-lg bg-indigo-900 flex items-center justify-center text-white ring-4 ring-slate-100 text-xs font-black">
                  D
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">Universitas Tujuan</p>
                  <p className="text-xs font-bold text-slate-800">Dekanat Fakultas Teknik UNDIP</p>
                </div>
              </div>
            </div>

            {/* Estimated time mockup */}
            <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center" id="vis-card-meta">
              <div className="flex items-center space-x-2">
                <Clock className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jadwal Keberangkatan</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Pagi ini 07:15 WIB
              </span>
            </div>

            <button 
              onClick={onLoginClick}
              className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Eksplor Driver Semarang</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-16 px-4 border-y border-slate-200" id="features">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2" id="features-header">
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Pelayanan Anjem Terbaik</h2>
            <p className="text-sm text-slate-500">Kemudahan transportasi roda dua dan empat dengan jaminan keamanan dan harga ramah kantong mahasiswa Semarang.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="features-grid">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-indigo-300 hover:bg-white transition duration-250" id="feat-1">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Real-Time Database</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">Setiap booking tercatat real-time. Status langsung sinkron begitu driver menerima orderan.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-indigo-300 hover:bg-white transition duration-250" id="feat-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">100% Khusus Universitas</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">Mencakup UNDIP, UNNES, UDINUS, UNISSULA dan lainnya. Driver hafal rute jalan pintas kampus.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-indigo-300 hover:bg-white transition duration-250" id="feat-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Biaya Paten Transparan</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">Estimasi harga adil sejak awal. Tanpa biaya tersembunyi, dapat dinegosiasikan langsung dengan driver.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 hover:border-indigo-300 hover:bg-white transition duration-250" id="feat-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Teman Sesama Mahasiswa</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">Sebagian besar driver kami juga merupakan mahasiswa Semarang, membuat obrolan di jalan terasa asik.</p>
            </div>
          </div>
        </div>
      </section>

      {/* University Coverage Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto space-y-10" id="campuses">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Wilayah Kampus Terlayani</h2>
          <p className="text-sm text-slate-500">Layanan kami menjangkau seluruh universitas besar di daerah Semarang dan sekitarnya.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="campus-grid">
          {SEMARANG_CAMPUSES.map((campus) => (
            <div 
              key={campus.id} 
              className="bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition"
              id={`campus-card-${campus.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                  <School className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase">
                  {campus.availableDrivers} Driver
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">{campus.name}</h3>
              <p className="text-[11px] text-slate-400 font-medium mb-1.5">{campus.fullName}</p>
              <div className="flex items-center space-x-1 text-[11px] text-slate-500 border-t border-slate-100 pt-2 mt-2">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span>Sekitar {campus.mainArea}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Tariff Estimator Calculator */}
      <section className="bg-slate-900 text-white py-16 px-4" id="calculator">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 space-y-4" id="calc-intro">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest font-mono">Cek Tarif Sewa</span>
            <h2 className="text-3xl font-extrabold tracking-tight">Kalkulator Estimasi Tarif</h2>
            <p className="text-[13px] text-slate-300 leading-relaxed">
              Bandingkan biaya anjem motor ataupun mobil dengan mudah. Masukkan perkiraan titik kumpul dan kampus tujuanmu di Semarang untuk memulai simulasi harga.
            </p>
            <div className="space-y-2 mt-4">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                <span>Sesuai standar kantong mahasiswa kos</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                <span>Meliputi rute tanjakan ekstrem (Sigar Bencah / UNNES)</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7" id="calc-form-container">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/15 text-slate-900">
              <form onSubmit={handleEstimate} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-300 mb-1">Pilih Daerah Penjemputan</label>
                  <select 
                    value={pickup} 
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {pickupAreas.map((area) => (
                      <option className="bg-slate-900" key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-300 mb-1">Universitas Tujuan</label>
                  <select 
                    value={destination} 
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {campusTargets.map((c) => (
                      <option className="bg-slate-900" key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-300 mb-2">Jenis Armada Kendaraan</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setVehicle("Motorcycle")}
                      className={`py-2 rounded-lg border text-xs font-bold transition duration-150 uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer ${
                        vehicle === "Motorcycle" 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                      }`}
                    >
                      <Bike className="h-3.5 w-3.5" />
                      <span>Motor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicle("Car")}
                      className={`py-2 rounded-lg border text-xs font-bold transition duration-150 uppercase tracking-wider flex items-center justify-center space-x-2 cursor-pointer ${
                        vehicle === "Car" 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-755"
                      }`}
                    >
                      <Car className="h-3.5 w-3.5" />
                      <span>Mobil</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isEstimaging}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg font-bold text-xs uppercase tracking-widest cursor-pointer mt-2 transition"
                >
                  {isEstimaging ? "Menghitung rute terbaik..." : "Hitung Estimasi Biaya"}
                </button>
              </form>

              {estimatedPrice !== null && (
                <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-center animate-fade-in text-white">
                  <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1 font-mono">Estimasi Tarif Perjalanan</span>
                  <p className="text-2xl font-black text-indigo-400 font-mono">
                    Rp {estimatedPrice.toLocaleString("id-ID")}
                  </p>
                  <span className="block text-[9px] text-slate-500 mt-1">
                    *Harga bervariasi bergantung kondisi cuaca dan ketersediaan driver.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16 px-4" id="testimonials">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Kesan Pengguna Semarang</h2>
            <p className="text-sm text-slate-500">Testimoni nyata dari mahasiswa pengguna setia jasa antar jemput kami sehari-hari.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="testimonial-grid">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between space-y-5" id="testi-1">
              <p className="text-slate-600 text-xs leading-relaxed italic">
                "Setiap ada kelas pagi jam 7 di UNDIP Tembalang, saya selalu pesan Anjem Semarang. Ga usah repot macet di tanjakan dan cari parkiran motor yang penuh."
              </p>
              <div className="flex items-center space-x-3">
                <div className="font-bold text-xs bg-indigo-100 text-indigo-800 w-8 h-8 rounded-full flex items-center justify-center">DF</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Dimas Febri</h4>
                  <p className="text-[10px] text-slate-400">Teknik Informatika - UNDIP</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between space-y-5" id="testi-2">
              <p className="text-slate-600 text-xs leading-relaxed italic">
                "Anjem dari kos Gunungpati ke kampus UNNES Sekaran cuman 9 ribu rupiah. Hemat banget dibanding naik angkot atau ojek biasa. Drivernya asyik diajak ngobrol."
              </p>
              <div className="flex items-center space-x-3">
                <div className="font-bold text-xs bg-indigo-100 text-indigo-800 w-8 h-8 rounded-full flex items-center justify-center">AR</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Anisa Rahma</h4>
                  <p className="text-[10px] text-slate-400">Fakultas Pendidikan - UNNES</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between space-y-5" id="testi-3">
              <p className="text-slate-600 text-xs leading-relaxed italic">
                "Fiturnya canggih, bisa liat history booking kita secara real-time. Kemarin coba pesan Anjem Mobil bareng 3 temen kelompok ke UDINUS jadi murah banget patungannya."
              </p>
              <div className="flex items-center space-x-3">
                <div className="font-bold text-xs bg-indigo-100 text-indigo-800 w-8 h-8 rounded-full flex items-center justify-center">HW</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Hendra Wijaya</h4>
                  <p className="text-[10px] text-slate-400">Fasilkom - UDINUS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 border-t border-slate-800" id="landing-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6" id="footer-inner">
          <div className="text-center md:text-left">
            <span className="font-extrabold text-white text-lg tracking-tight">ANJEM<span className="text-indigo-500">.SRG</span></span>
            <p className="text-xs mt-1 text-slate-500">Sistem Pelayanan Antar Jemput Khusus Mahasiswa Semarang Terintegrasi Real-Time.</p>
          </div>
          
          <div className="flex items-center space-x-6 text-xs" id="footer-links">
            <span className="text-[11px] text-slate-600 font-mono">Real-Time Cloud Synchronization v2.1</span>
            <button onClick={onLoginClick} className="text-white font-bold hover:text-indigo-400 transition cursor-pointer uppercase tracking-wider text-[10px] underline">Portal Masuk</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-8 pt-6 text-center text-xs text-slate-600">
          &copy; {new Date().getFullYear()} ANJEM.SRG. Powered by Google Firebase. Created exclusively for students of Semarang.
        </div>
      </footer>
    </div>
  );
}
