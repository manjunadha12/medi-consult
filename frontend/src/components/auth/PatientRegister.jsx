import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import {
  User as UserIcon, Mail, Phone as PhoneIcon, Calendar, ArrowRight, ShieldCheck as ShieldCheckIcon,
  CheckCircle2, RotateCcw, AlertTriangle, Sparkles, Shield, Activity,
  Globe, Headphones, UserPlus, Lock, Plus, Users
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../utils/firebase';
import logoImg from '../../logo.png';
import useStore from '../../store/useStore';

const PatientRegister = () => {
  const [step, setStep] = useState(1); // 1: Info Form, 2: OTP Verify, 3: Success
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [emailOtp, setEmailOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setUser } = useStore();
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/patient-otp', {
        ...formData
      });

      toast.success(data.message);
      setStep(2);
      setCountdown(30);
    } catch (error) {
      if (!error.response) {
        toast.error('Network Error: Cannot connect to Backend. Check IP/WiFi.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to initialize registration');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!emailOtp.trim()) {
      return toast.error('Please enter the verification code');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/verify-patient', {
        email: formData.email,
        emailOtp: emailOtp
      });
      toast.success(data.message);
      setPatientId(data.patientId);
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/resend-otp', {
        email: formData.email
      });
      toast.success(data.message);
      setCountdown(30);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Resend failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const { data } = await api.post('/auth/google', {
        idToken,
        role: 'patient'
      });

      localStorage.setItem('mediconsult_token', data.token);

      setUser({
        name: data.name,
        role: data.role,
        userId: data.userId,
        _id: data._id
      });

      toast.success(`Access Granted: Welcome back, ${data.name}`);
      navigate(data.redirectTo);
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Google Sign-In cancelled');
      } else {
        toast.error(error.response?.data?.message || 'Google Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#000] font-sans overflow-hidden relative">
      {/* 1. Outer Container */}

      {/* GLOBAL BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1576091160550-2173db999c1d?q=80&w=2000&auto=format&fit=crop" alt="Hand Sync" className="w-full h-full object-cover opacity-60 mix-blend-screen scale-105" />
          <div className="absolute top-[40%] md:top-[50%] left-[50%] md:left-[55%] -translate-x-1/2 -translate-y-1/2 z-10">
             <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 bg-blue-500/40 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
                <Plus size={48} strokeWidth={4} className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
             </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black md:bg-gradient-to-r md:from-black/60 md:to-transparent"></div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row relative z-20">
         {/* 2. Main Wrapper */}

         {/* LEFT SECTION */}
         <div className="hidden md:flex flex-[1.3] p-12 lg:p-20 flex flex-col h-full w-full text-left">
             <div className="flex items-center gap-3 mb-16">
               <div className="w-12 h-12 bg-blue-600/30 border border-blue-500/50 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"><ShieldCheckIcon size={24} /></div>
               <div className="text-left">
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">MEDI <span className="text-blue-500 font-black">CONSULT</span></h2>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Clinical Authentication Gateway</p>
               </div>
             </div>

             <div className="max-w-lg space-y-10">
               <div className="space-y-6">
                 <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tighter uppercase">Join the <span className="text-blue-500">Future</span>,<br /> of Care</h1>
                 <div className="w-24 h-1.5 bg-blue-600 rounded-full"></div>
                 <p className="text-base font-bold text-zinc-400 max-w-sm leading-relaxed uppercase tracking-[0.15em]">Secure your identity and access intelligent medical synchronization.</p>
               </div>
             </div>

             <div className="mt-auto">
               <div className="inline-flex items-center gap-4 p-5 px-6 bg-white/5 backdrop-blur-xl rounded-[28px] border border-white/10">
                  <div className="w-10 h-10 rounded-full border-2 border-blue-500 flex items-center justify-center text-blue-500"><Shield size={18} /></div>
                  <div className="text-left">
                     <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest">HIPAA Compliant</p>
                     <p className="text-[10px] font-bold text-zinc-500 uppercase leading-none mt-1">Your privacy and security are our top priority.</p>
                  </div>
               </div>
             </div>
         </div>

         {/* RIGHT SECTION */}
         <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-30">
            {/* 3. Right Section Wrapper */}
            <div className="max-w-[420px] w-full bg-white p-8 lg:p-12 rounded-[24px] shadow-2xl flex flex-col items-center">
              {/* 4. Registration Card */}

              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 border border-blue-100 shadow-inner">
                 {step === 1 ? <UserPlus size={28} strokeWidth={4} /> : step === 2 ? <ShieldCheckIcon size={28} /> : <CheckCircle2 size={28} />}
              </div>

              <div className="text-center mb-8">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{step === 1 ? 'Create Account' : step === 2 ? 'OTP Verify' : 'Success'}</h2>
                 <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest">{step === 1 ? 'Join Medi Consult for smarter healthcare' : step === 2 ? 'Identity Authentication Required' : 'Patient ID Assigned'}</p>
              </div>

              {step === 1 && (
                <div className="w-full">
                   <div className="w-full flex bg-slate-50 border border-slate-100 p-1 rounded-xl mb-8">
                      <button className="flex-1 py-3 bg-blue-600 text-white shadow-xl shadow-blue-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Patient</button>
                      <button onClick={() => navigate('/register/doctor')} className="flex-1 py-3 text-slate-400 hover:text-slate-600 text-[9px] font-black uppercase tracking-widest transition-all">Operator</button>
                   </div>

                   <form onSubmit={handleRequestOtp} className="space-y-4">
                      <div className="relative group">
                         <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                         <input name="name" type="text" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full pl-11 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm text-slate-800 placeholder:text-slate-300" required />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                            <input name="age" type="number" placeholder="Age" value={formData.age} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 font-bold text-sm" required />
                         </div>
                         <select name="gender" value={formData.gender} onChange={handleChange} className="px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 font-bold text-sm text-slate-600" required>
                            <option value="">Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                         </select>
                      </div>

                      <div className="relative group">
                         <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                         <input name="phone" type="tel" placeholder="Mobile Number" value={formData.phone} onChange={handleChange} className="w-full pl-11 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 font-bold text-sm" required />
                      </div>

                      <div className="relative group">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                         <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full pl-11 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 font-bold text-sm" required />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                            <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 font-bold text-sm" required />
                         </div>
                         <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                            <input name="confirmPassword" type="password" placeholder="Confirm" value={formData.confirmPassword} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 font-bold text-sm" required />
                         </div>
                      </div>

                      <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-2 disabled:opacity-50">{loading ? 'Processing Node...' : <>Sign Up <ArrowRight size={18} /></>}</button>

                      <div className="relative my-6 flex items-center justify-center"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div><span className="relative px-3 bg-white text-[9px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">or continue with</span></div>

                      <button type="button" onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 hover:bg-slate-50 transition-all active:scale-[0.98]"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" /> Continue with Google</button>
                   </form>
                </div>
              )}

              {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="w-full space-y-6">
                   <div className="space-y-4">
                      <div className="relative group">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-blue-500" />
                         <input type="text" maxLength={6} placeholder="Email Verification Code" value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} className="w-full pl-11 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-center font-black tracking-[0.5em] text-sm" required />
                      </div>
                   </div>
                   <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Verify & Sync</button>
                   <button type="button" onClick={handleResendOtp} disabled={countdown > 0} className="w-full text-[9px] font-black uppercase text-blue-600 hover:underline">{countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}</button>
                </form>
              )}

              {step === 3 && (
                <div className="w-full text-center">
                   <div className="p-8 bg-blue-50 border border-blue-100 rounded-2xl mb-8">
                      <p className="text-4xl font-black text-slate-900 tracking-wider">{patientId}</p>
                   </div>
                   <button onClick={() => navigate('/')} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">Login to Terminal <ArrowRight size={18} /></button>
                </div>
              )}

              <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Already have an account? <Link to="/" className="text-blue-600 font-black hover:underline ml-1">Sign in</Link></p>
           </div>
           {/* Close 4. Registration Card */}
         </div>
         {/* Close 3. Right Section Wrapper */}
      </div>
      {/* Close 2. Main Wrapper */}

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
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shrink-0 shadow-sm border border-white/5`}><s.icon size={20} /></div>
                  <div className="text-left"><p className="text-base font-black text-white leading-none">{s.label}</p><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">{s.sub}</p></div>
               </div>
            ))}
         </div>
      </div>

    </div>
    /* Close 1. Outer Container */
  );
};

export default PatientRegister;
