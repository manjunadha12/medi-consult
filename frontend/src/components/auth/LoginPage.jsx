import React, { useState, useEffect } from 'react';
import logoImg from '../../logo.png';
import { useNavigate, Link } from 'react-router-dom';
import api, { BACKEND_URL } from '../../utils/api';
import useStore from '../../store/useStore';
import { toast } from 'react-hot-toast';
import {
  Shield, Users, User as UserIcon, BarChart3, ArrowRight, Mail, Lock, Eye,
  EyeOff, UserPlus, Sparkles, ShieldCheck as ShieldCheckIcon, CheckCircle2, Heart, Activity,
  Globe, Headphones, Plus, ChevronRight, Stethoscope, Clipboard, Brain, Dna, Loader2
} from 'lucide-react';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '../../utils/firebase';
import axios from 'axios';

const getIsNative = () => {
  if (typeof window === 'undefined') return false;
  const { origin } = window.location;
  return origin.startsWith('capacitor:') || (origin.includes('://localhost') && !window.location.port);
};

const isNative = getIsNative();

const LoginPage = () => {
  const { setUser } = useStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('patient'); // 'patient' or 'staff'
  const [showPassword, setShowPassword] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectProcessing, setRedirectProcessing] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');

  // 1. Connection Heartbeat (Robust Check)
  useEffect(() => {
    const checkNode = async () => {
      try {
        console.log("[HEARTBEAT] Pinging backend node...");
        // Use the synchronized api instance for heartbeat
        const res = await api.get('/', { timeout: 8000 });

        // If we get here, the server at least responded
        console.log("[HEARTBEAT] Node reachable:", res.data);
        setBackendStatus('online');
      } catch (err) {
        console.warn("[HEARTBEAT_FAIL] Error details:", err.message);

        // If there is an err.response, the server is alive (it gave us a 404, 500, etc)
        // If there is NO response, the network request failed (connection refused/timed out)
        if (err.response) {
           console.log("[HEARTBEAT] Server responded with error, but it IS online.");
           setBackendStatus('online');
        } else {
           console.error("[HEARTBEAT] FATAL: Node unreachable. Check IP and Firewall.");
           setBackendStatus('offline');
        }
      }
    };
    checkNode();
    const interval = setInterval(checkNode, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. Initial Auth Sync (Check for existing sessions or redirect results)
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setLoading(true);
          const idToken = await result.user.getIdToken();
          const savedRole = localStorage.getItem('pending_google_role') || 'patient';
          await processGoogleLogin(idToken, savedRole);
        }
      } catch (err) {
        console.warn("[REDIRECT_RESULT_ERR]", err);
      }
    };
    handleRedirectResult();

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && redirectProcessing) {
        console.log('[AUTH] Active Session Detected. Synchronizing Identity...');
      }
    });

    const timer = setTimeout(() => setRedirectProcessing(false), 8000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const processGoogleLogin = async (idToken, intendedRole) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', {
        idToken,
        role: intendedRole
      });

      if (data.success) {
        localStorage.setItem('mediconsult_token', data.token);
        setUser({
          name: data.name || 'Authorized User',
          role: data.role || 'patient',
          userId: data.userId || 'ID-PENDING',
          _id: data._id
        });

        toast.success(`Access Granted: Welcome, ${data.name}`);
        localStorage.removeItem('pending_google_role');

        const target = data.role === 'doctor' ? '/doc-dashboard' : (data.role === 'admin' ? '/admin-dashboard' : '/patient/dashboard');
        navigate(target, { replace: true });
      }
    } catch (error) {
      console.error("Google Server Sync Error:", error);
      toast.error(error.response?.data?.message || "Backend synchronization failed.");
      setRedirectProcessing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password.trim()) return toast.error('Enter credentials');

    setLoading(true);
    try {
      console.log(`[LOGIN] Attempting ${activeTab} login for: ${loginId}`);
      const { data } = await api.post('/auth/login', {
        loginId,
        password,
        tab: activeTab // Send selected tab to backend for role verification
      });

      console.log("[LOGIN] Success Response Data:", data);

      if (data.success) {
        localStorage.setItem('mediconsult_token', data.token);
        const userData = {
          name: data.name,
          role: data.role,
          userId: data.userId,
          _id: data._id
        };
        console.log("[LOGIN] Setting User in Store:", userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData)); // Ensure immediate persistence
        toast.success(`Welcome back, ${data.name}`);
        const target = data.role === 'doctor' ? '/doc-dashboard' : (data.role === 'admin' ? '/admin-dashboard' : '/patient/dashboard');
        console.log(`[LOGIN] Navigating to: ${target}`);
        navigate(target, { replace: true });
      }
    } catch (error) {
      console.error("[LOGIN_NODE_ERR]", error.response?.status, error.response?.data);
      const msg = error.response?.data?.message || error.message || 'Access Denied: Identity/Key mismatch';
      toast.error(`FAIL: ${msg}`, { duration: 6000 });

      if (!error.response) {
        toast.error("NETWORK ERROR: Phone cannot reach computer. Check Firewall port 5001.", { duration: 8000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (backendStatus !== 'online') {
       return toast.error("Backend node offline. Synchronize link first.");
    }

    const isNative = window.location.origin.startsWith('capacitor:') || (window.location.origin.includes('://localhost') && !window.location.port);
    if (isNative) {
      setLoading(false);
      toast("Google restricts sign-in inside mobile WebViews for security. Please sign in using your Email & Password below.", {
        icon: '🔒',
        duration: 7000
      });
      return;
    }

    const role = activeTab === 'patient' ? 'patient' : 'doctor';
    setLoading(true);
    localStorage.setItem('pending_google_role', role);

    try {
      console.log("[AUTH] Initializing Google Sign-In Popup...");
      const result = await signInWithPopup(auth, googleProvider);

      if (result.user) {
        const idToken = await result.user.getIdToken();
        await processGoogleLogin(idToken, role);
      }
    } catch (error) {
      console.error("Google Auth Node Error:", error);

      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        toast.error("Google popup blocked or cancelled. Please use Email & Password.");
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Render Full Screen Loader while handling redirect
  if (redirectProcessing && !loading) {
    return (
      <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center space-y-6">
         <div className="relative">
            <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full animate-pulse"></div>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" strokeWidth={3} />
         </div>
         <p className="text-zinc-500 font-black uppercase tracking-[0.5em] text-[10px]">Verifying Neural Handshake...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black font-sans overflow-x-hidden relative text-left">

      {/* GLOBAL BACKGROUND NODE */}
      <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Your local background image */}
          <img
            src="/login-bg.png"
            alt="Hand Sync"
            className="w-full h-full object-cover opacity-50 scale-105"
          />

          {/* Dynamic Glow Overlay for that specific "Neural Handshake" vibe */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
             <div className="relative flex items-center justify-center">
                <div className="absolute w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[140px] animate-pulse"></div>
                <div className="absolute w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[100px]"></div>
             </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black md:bg-gradient-to-r md:from-black/60 md:to-transparent z-[15]"></div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row relative z-20 overflow-y-auto custom-scrollbar">
         {/* LEFT SECTION - Branding */}
         <div className="hidden md:flex flex-[1.3] p-12 lg:p-20 flex flex-col h-full w-full text-left">
             <div className="flex items-center gap-3 mb-16">
               <img src="/logo.png" onError={(e) => { e.currentTarget.src = '/logo.jpeg'; }} alt="Logo" className="w-12 h-12 object-contain" />
               <div className="text-left">
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">MEDI <span className="text-blue-500">CONSULT</span></h2>
                  <div className="flex items-center gap-2 mt-1">
                     <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${backendStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : (backendStatus === 'offline' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-amber-500')}`}></div>
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">
                        {backendStatus === 'online' ? 'Neural Link Active' : (backendStatus === 'offline' ? 'Neural Link Offline' : 'Syncing Node...')}
                     </p>
                  </div>
               </div>
             </div>

             <div className="max-w-lg space-y-10">
               <div className="space-y-6">
                 <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tighter uppercase">Connecting <span className="text-blue-500">Care</span>,<br /> Changing <span className="text-blue-500">Lives</span></h1>
                 <div className="w-16 h-1 bg-blue-600 rounded-[20px]"></div>
                 <p className="text-base font-medium text-zinc-400 max-w-sm leading-relaxed">Bridging the gap between patients and doctors with secure technology and better outcomes.</p>
               </div>
             </div>

             <div className="mt-auto">
               <div className="inline-flex items-center gap-4 p-5 px-6 bg-white/5 backdrop-blur-xl rounded-[20px] border border-white/10">
                  <div className="w-10 h-10 rounded-[20px] border-2 border-blue-500 flex items-center justify-center text-blue-500"><Shield size={18} /></div>
                  <div className="text-left">
                     <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest">HIPAA Compliant</p>
                     <p className="text-[10px] font-bold text-zinc-500 uppercase leading-none mt-1">Your privacy and security are our top priority.</p>
                  </div>
               </div>
             </div>
         </div>

         {/* RIGHT SECTION - Login Card */}
         <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 lg:p-14">
           <div className="max-w-[520px] w-full bg-white/5 backdrop-blur-2xl p-8 sm:p-10 lg:p-12 rounded-[20px] shadow-2xl border border-white/10 flex flex-col items-center relative">

              <div className="absolute top-6 right-6 md:hidden">
                 <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${backendStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : (backendStatus === 'offline' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-amber-500')}`}></div>
              </div>

              <div className="mb-8 flex justify-center">
                 <img src="/logo.png" onError={(e) => { e.currentTarget.src = '/logo.jpeg'; }} alt="Medi Consult Logo" className="w-32 sm:w-36 h-auto object-contain" />
              </div>

              <div className="text-center mb-8">
                 <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase leading-none">Welcome Back</h2>
                 <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 mt-2 sm:mt-3 uppercase tracking-widest">Clinical Synchronization Node</p>
              </div>

              <div className="w-full flex bg-white/5 border border-white/10 p-1.5 rounded-[20px] mb-8 sm:mb-9 gap-1">
                 <button onClick={() => setActiveTab('patient')} className={`flex-1 py-3 sm:py-3.5 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-[20px] transition-all ${activeTab === 'patient' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-zinc-500 hover:text-white'}`}>Patient</button>
                 <button onClick={() => setActiveTab('staff')} className={`flex-1 py-3 sm:py-3.5 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-[20px] transition-all ${activeTab === 'staff' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-zinc-500 hover:text-white'}`}>Operator</button>
              </div>

              <form onSubmit={handleLogin} className="w-full space-y-5 sm:space-y-6">
                 <div className="space-y-2 text-left">
                   <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Identity Code</label>
                   <div className="relative group">
                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                     <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder={activeTab === 'patient' ? "Email / Patient ID" : "DOC / ADM ID"} className="w-full pl-12 pr-6 py-3.5 sm:py-4 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-bold text-xs sm:text-sm text-white placeholder:text-zinc-600" required />
                   </div>
                 </div>

                 <div className="space-y-2 text-left">
                   <div className="flex justify-between items-center px-1">
                     <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Encryption Key</label>
                     <Link to="/forgot-password" title="Recover key" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-blue-400 hover:underline">Lost key?</Link>
                   </div>
                   <div className="relative group">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                     <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full pl-12 pr-12 py-3.5 sm:py-4 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-bold text-xs sm:text-sm text-white placeholder:text-zinc-600" required />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                   </div>
                 </div>

                 <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[20px] font-black text-xs sm:text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 mt-2">
                   {loading ? 'Processing Node...' : <>Sign In <ArrowRight size={18} /></>}
                 </button>

                 <div className="relative my-6 sm:my-8 flex items-center justify-center">
                   <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                   <span className="relative px-3 bg-black/40 text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">or continue with</span>
                 </div>

                 <button type="button" onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 py-3.5 sm:py-4 border border-white/10 rounded-[20px] font-bold text-xs sm:text-sm text-white hover:bg-white/5 transition-all active:scale-[0.98]">
                   <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" /> Continue with Google
                 </button>
              </form>

              <p className="mt-8 sm:mt-10 text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest">
                New to Medi Consult? <Link to="/register" className="text-blue-400 font-black hover:underline ml-1">Create Account</Link>
              </p>
           </div>
         </div>
      </div>

      {/* FOOTER STATS */}
      <div className="bg-zinc-950/50 backdrop-blur-xl border-t border-white/5 py-8 px-6 lg:px-20 z-30 relative">
         <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
               { icon: ShieldCheckIcon, label: '256-bit', sub: 'Data Encryption', color: 'text-blue-500', bg: 'bg-blue-500/10' },
               { icon: Users, label: '10K+', sub: 'Happy Users', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
               { icon: Globe, label: '500+', sub: 'Hospitals', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
               { icon: Headphones, label: '24/7', sub: 'Support', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
            ].map((s, i) => (
               <div key={i} className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-[20px] ${s.bg} flex items-center justify-center ${s.color} shrink-0 shadow-sm border border-white/5`}><s.icon size={20} /></div>
                  <div className="text-left"><p className="text-base font-black text-white leading-none">{s.label}</p><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">{s.sub}</p></div>
               </div>
            ))}
         </div>
      </div>

    </div>
  );
};

export default LoginPage;
