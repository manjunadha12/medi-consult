import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import {
  Mail, Phone, Lock, Key, ArrowRight, ShieldCheck as ShieldCheckIcon, CheckCircle2, RotateCcw,
  Sparkles, Shield, User as UserIcon, Activity, Globe, Headphones, Plus,
  ChevronRight, Brain, Heart, Dna, Stethoscope, Users
} from 'lucide-react';
import logoImg from '../../logo.png';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Request form, 2: Reset Form
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [sendChannel, setSendChannel] = useState('both'); // 'both', 'email', 'phone'
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      return toast.error('Please enter your Email or Phone Number');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/request-otp', { 
        identifier,
        sendChannel
      });
      toast.success(data.message);
      setStep(2);
      setCountdown(30);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request reset OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return toast.error('Please enter the verification code');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/reset', {
        identifier,
        otp,
        newPassword
      });
      toast.success(data.message);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/resend-otp', { 
        identifier,
        sendChannel
      });
      toast.success(data.message);
      setCountdown(30);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Resend failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#000] font-sans overflow-hidden relative">

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
                 <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tighter uppercase">Security <span className="text-blue-500">Override</span>,<br /> Portal</h1>
                 <div className="w-16 h-1 bg-blue-600 rounded-full"></div>
                 <p className="text-base font-medium text-zinc-400 max-w-sm leading-relaxed uppercase tracking-[0.15em]">Secure credential override for your clinical synchronization node.</p>
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
            <div className="max-w-[420px] w-full bg-white p-8 lg:p-12 rounded-[24px] shadow-2xl flex flex-col items-center">
               <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-8 border border-blue-100 shadow-inner"><Key size={28} strokeWidth={4} /></div>
               <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Password Reset</h2>
                  <p className="text-[9px] font-black text-slate-400 mt-3 uppercase tracking-widest">Quantum-safe Password Reset Node</p>
               </div>

               {step === 1 && (
                 <form onSubmit={handleRequestOtp} className="w-full space-y-6">
                    <div className="space-y-1.5 text-left"><label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Registered Identity</label><div className="relative group"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-blue-600 transition-colors" /><input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Email, Mobile or ID" className="w-full pl-11 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-sm text-slate-800 placeholder:text-slate-300" required /></div></div>
                    <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Send OTP via:</label><div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl"><button type="button" onClick={() => setSendChannel('both')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${sendChannel === 'both' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Both</button><button type="button" onClick={() => setSendChannel('email')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${sendChannel === 'email' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Email</button><button type="button" onClick={() => setSendChannel('phone')} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${sendChannel === 'phone' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Mobile</button></div></div>
                    <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50">{loading ? 'Processing...' : <>Send Reset OTP <ArrowRight size={18} /></>}</button>
                 </form>
               )}

               {step === 2 && (
                 <form onSubmit={handleVerifyAndReset} className="w-full space-y-6">
                    <div className="space-y-1.5 text-left"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Verification Code</label><div className="relative group"><Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-blue-500" /><input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit Code" className="w-full pl-11 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-center font-black tracking-[0.4em] text-sm" required /></div></div>
                    <div className="space-y-4"><div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-blue-500" /><input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-11 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white font-bold text-sm" required /></div><div className="relative group"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-blue-500" /><input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-11 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white font-bold text-sm" required /></div></div>
                    <button type="button" onClick={handleResendOtp} disabled={countdown > 0} className="text-[9px] font-black uppercase text-blue-600 hover:underline">{countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}</button>
                    <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50">{loading ? 'Applying...' : <>Save New Password <ShieldCheckIcon size={18} /></>}</button>
                 </form>
               )}

               <p className="mt-10 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Back to <Link to="/" className="text-blue-600 font-black hover:underline ml-1">Login Terminal</Link></p>
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
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shrink-0 shadow-sm border border-white/5`}><s.icon size={20} /></div>
                  <div className="text-left"><p className="text-base font-black text-white leading-none">{s.label}</p><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">{s.sub}</p></div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
