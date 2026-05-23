import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, signInWithGoogle, logoutUser } from "./lib/firebase";
import { bootstrapSeedDrivers } from "./data/mockData";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import { Bike, ArrowRight, Chrome, ShieldAlert, Sparkles, X, ChevronRight, UserCheck } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // 1. Observe real-time authentication changes with a safety fallback timeout
  useEffect(() => {
    let active = true;
    
    // Safety fallback: if Firebase authentication doesn't resolve within 1.5s, bypass the loading screen
    const fallbackTimer = setTimeout(() => {
      if (active) {
        console.warn("Firebase Auth took too long, fallback to landing page initiated.");
        setAuthLoading(false);
      }
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;
      clearTimeout(fallbackTimer);
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Run bootstrap seed drivers immediately if we have a live logged in user
        try {
          await bootstrapSeedDrivers();
        } catch (e) {
          console.error("Bootstrapping drivers failed during startup:", e);
        }
      }
    });

    return () => {
      active = false;
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  // 2. Handle login click with Google Auth
  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        setShowLoginModal(false);
      }
    } catch (err: any) {
      console.error(err);
      setLoginError(
        err?.message?.includes("popup_closed_by_user")
          ? "Login dibatalkan oleh pengguna."
          : "Gagal login via Google. Anda dapat menggunakan Jalur Akses Cepat di bawah jika di dalam iFrame."
      );
    }
  };

  // 3. Simulated Demo Login (Frictionless testing helper)
  const handleSimulatedLogin = async (role: "undip" | "unnes") => {
    setAuthLoading(true);
    
    // Create a mock user model mimicking User
    const mockUser: any = {
      uid: role === "undip" ? "mhs_undip_tembalang" : "mhs_unnes_sekaran",
      displayName: role === "undip" ? "Teguh Ardiansyah (UNDIP)" : "Faza Ramadhan (UNNES)",
      email: role === "undip" ? "teguh.mhs@undip.ac.id" : "faza.mhs@unnes.ac.id",
      photoURL: role === "undip" 
        ? "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    };

    // Commit seed drivers to Firestore
    try {
      await bootstrapSeedDrivers();
    } catch (e) {
      console.error("Error seeding drivers:", e);
    }

    setUser(mockUser);
    setAuthLoading(false);
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    setUser(null);
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <Bike className="h-10 w-10 text-indigo-500 animate-bounce mb-3" />
        <p className="text-sm font-bold tracking-wider font-mono uppercase">Menghubungkan ke Real-Time Database...</p>
        <p className="text-xs text-slate-500 mt-1">Sistem Pelayanan Anjem Semarang</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* View routing: Logged-in vs Non-logged-in */}
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LandingPage onLoginClick={() => setShowLoginModal(true)} />
      )}

      {/* Modern authenticating popup modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay background */}
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition" 
            onClick={() => setShowLoginModal(false)}
          ></div>

          <div className="relative bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-slate-200 animate-scale-up space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                  <Bike className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 leading-tight">Masuk Portal Anjem</h3>
                  <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Antar Jemput Semarang</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLoginModal(false)} 
                className="p-1 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs space-y-1 border border-red-100">
                <span className="font-bold block">Peringatan Akses</span>
                <p>{loginError}</p>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition shadow flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Chrome className="h-4 w-4 text-indigo-400" />
                <span>Masuk dengan Akun Google</span>
              </button>

              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="w-1/5 border-b border-slate-200"></span>
                <span>ATAU AKSES CEPAT (TESTING)</span>
                <span className="w-1/5 border-b border-slate-200"></span>
              </div>

              {/* Seamless simulation triggers for easy testing inside the sandbox */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 text-center">
                  *Gunakan opsi pengujian instan berikut jika pop-up Google terblokir oleh browser/iframe Anda.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSimulatedLogin("undip")}
                    className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-800 rounded-lg font-bold text-[10px] uppercase tracking-wider transition text-center cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Mhs UNDIP</span>
                  </button>
                  <button
                    onClick={() => handleSimulatedLogin("unnes")}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-lg font-bold text-[10px] uppercase tracking-wider transition text-center cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Mhs UNNES</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="text-[9px] leading-relaxed text-slate-400">
                Menggunakan basis data tersinkronisasi Firebase untuk keamanan dan keandalan data perjalanan Anda.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
