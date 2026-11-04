import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import {
  User as UserIcon, Mail, Phone as PhoneIcon, Calendar, ArrowRight, ShieldCheck as ShieldCheckIcon,
  CheckCircle2, RotateCcw, AlertTriangle, Sparkles, Shield, Activity,
  Globe, Headphones, UserPlus, Lock, Plus, Users, Home, Briefcase, Heart
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../utils/firebase';
import logoImg from '../../logo.png';
import useStore from '../../store/useStore';

const PatientRegister = () => {
  const [step, setStep] = useState(1); // 1: Info Form, 2: OTP Verify, 3: Success
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    age: '',
    gender: '',
    bloodGroup: '',
    address: '',
    guardianName: '',
    guardianPhone: '',
    profession: '',
    aadhaarNumber: '',
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
    const { name, value } = e.target;

    // Full Name & Guardian Name: only letters and spaces
    if (name === 'name' || name === 'guardianName') {
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: lettersOnly }));
      return;
    }

    // Profession / Occupation: letters, spaces, and hyphens only
    if (name === 'profession') {
      const lettersOnly = value.replace(/[^a-zA-Z\s\-]/g, '');
      setFormData(prev => ({ ...prev, [name]: lettersOnly }));
      return;
    }

    // Mobile Number: digits only, max 10
    if (name === 'phone') {
      let digits = value.replace(/\D/g, '');
      if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
      } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
      }
      setFormData(prev => ({ ...prev, phone: digits.slice(0, 10) }));
      return;
    }

    // Guardian Phone: digits only, max 10
    if (name === 'guardianPhone') {
      let digits = value.replace(/\D/g, '');
      if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2);
      } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
      }
      setFormData(prev => ({ ...prev, guardianPhone: digits.slice(0, 10) }));
      return;
    }

    // Aadhaar Card Number: digits only, max 12
    if (name === 'aadhaarNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 12);
      setFormData(prev => ({ ...prev, aadhaarNumber: digits }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDobChange = (e) => {
    const dobValue = e.target.value;
    let calculatedAge = '';
    if (dobValue) {
      const dobDate = new Date(dobValue);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dobDate > today) {
        toast.error('Date of Birth cannot be in the future');
        setFormData(prev => ({ ...prev, dob: '', age: '' }));
        return;
      }

      let ageYears = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        ageYears--;
      }
      if (ageYears >= 0) calculatedAge = ageYears.toString();
    }
    setFormData(prev => ({ ...prev, dob: dobValue, age: calculatedAge }));
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();

    // 1. Full Name: letters and spaces only, min 2 chars
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      return toast.error('Full Name is required');
    }
    if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      return toast.error('Full Name must contain letters and spaces only');
    }
    if (trimmedName.length < 2) {
      return toast.error('Full Name must be at least 2 characters');
    }

    // 2. Date of Birth & Age
    if (!formData.dob) {
      return toast.error('Date of Birth is required');
    }
    const dobDate = new Date(formData.dob);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dobDate > today) {
      return toast.error('Date of Birth cannot be in the future');
    }

    // 3. Gender & Blood Group
    if (!formData.gender) {
      return toast.error('Please select Gender');
    }
    if (!formData.bloodGroup) {
      return toast.error('Please select Blood Group');
    }

    // 4. Residential Address
    if (!formData.address.trim()) {
      return toast.error('Residential Address is required');
    }

    // 5. Guardian Name (optional)
    if (formData.guardianName.trim() && !/^[A-Za-z\s]+$/.test(formData.guardianName.trim())) {
      return toast.error('Guardian Name must contain letters and spaces only');
    }

    // 6. Guardian Phone (optional, but if provided must be 10 digits)
    if (formData.guardianPhone && formData.guardianPhone.length !== 10) {
      return toast.error('Guardian Phone number must be exactly 10 digits');
    }

    // 7. Aadhaar Number (if provided, must be exactly 12 digits)
    if (formData.aadhaarNumber && formData.aadhaarNumber.length !== 12) {
      return toast.error('Aadhaar Card Number must be exactly 12 digits');
    }

    // 8. Mobile Number (required, exactly 10 digits)
    const phoneClean = formData.phone.trim();
    if (!phoneClean) {
      return toast.error('Mobile Number is required');
    }
    if (!/^\d{10}$/.test(phoneClean)) {
      return toast.error('Mobile Number must be exactly 10 digits');
    }

    // 9. Email Address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      return toast.error('Please enter a valid email address');
    }

    // 10. Password
    if (!formData.password || formData.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/patient-otp', {
        ...formData,
        name: trimmedName,
        phone: phoneClean,
        email: formData.email.trim().toLowerCase(),
        aadhaarNumber: formData.aadhaarNumber.trim(),
        guardianPhone: formData.guardianPhone.trim(),
        guardianName: formData.guardianName.trim()
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
      const isNative = window.location.origin.startsWith('capacitor:') || (window.location.origin.includes('://localhost') && !window.location.port);
      if (isNative) {
        setLoading(false);
        toast("Google restricts sign-in inside mobile WebViews for security. Please sign in using your Email & Password below.", {
          icon: '🔒',
          duration: 7000
        });
        return;
      }

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
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        toast.error('Google Sign-In cancelled');
      } else {
        toast.error(error.response?.data?.message || error.message || 'Google Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#000] font-sans overflow-x-hidden relative text-left">
      <div className="absolute inset-0 z-0 overflow-hidden">
          <img src="/login-bg.png" alt="Hand Sync" className="w-full h-full object-cover opacity-50 scale-105" />
          <div className="absolute top-[40%] md:top-[50%] left-[50%] md:left-[55%] -translate-x-1/2 -translate-y-1/2 z-10">
             <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 bg-blue-500/40 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
                <Plus size={48} strokeWidth={4} className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
             </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black md:bg-gradient-to-r md:from-black/60 md:to-transparent z-[15]"></div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row relative z-20">
         <div className="hidden md:flex flex-[1.3] p-12 lg:p-20 flex flex-col h-full w-full text-left">
             <div className="flex items-center gap-3 mb-16">
               <img src="/logo.png" onError={(e) => { e.currentTarget.src = '/logo.jpeg'; }} alt="Logo" className="w-12 h-12 object-contain" />
               <div className="text-left">
                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">MEDI <span className="text-blue-500 font-black">CONSULT</span></h2>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Clinical Authentication Gateway</p>
               </div>
             </div>

             <div className="max-w-lg space-y-10">
               <div className="space-y-6">
                 <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tighter uppercase">Join the <span className="text-blue-500">Future</span>,<br /> of Care</h1>
                 <div className="w-24 h-1.5 bg-blue-600 rounded-[20px]"></div>
                 <p className="text-base font-bold text-zinc-400 max-w-sm leading-relaxed uppercase tracking-[0.15em]">Secure your identity and access intelligent medical synchronization.</p>
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

         <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-14 relative z-30">
            <div className="max-w-[560px] w-full bg-white/5 backdrop-blur-2xl p-8 lg:p-12 rounded-[20px] shadow-2xl border border-white/10 flex flex-col items-center">
              <div className="mb-6 flex justify-center">
                 <img src="/logo.png" onError={(e) => { e.currentTarget.src = '/logo.jpeg'; }} alt="Medi Consult Logo" className="w-28 sm:w-32 h-auto object-contain" />
              </div>

              <div className="text-center mb-6">
                 <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase leading-none">{step === 1 ? 'Patient Registration' : step === 2 ? 'OTP Verification' : 'Registration Success'}</h2>
                 <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 mt-2 uppercase tracking-widest">{step === 1 ? 'Phase 1: Patient Clinical Credentials' : step === 2 ? 'Phase 2: Security & OTP Verification' : 'Patient ID Assigned Successfully'}</p>
              </div>

              {step === 1 && (
                <div className="w-full">
                   <div className="w-full flex bg-white/5 border border-white/10 p-1.5 rounded-[20px] mb-6 gap-1">
                      <button className="flex-1 py-3 bg-blue-600 text-white shadow-lg shadow-blue-500/25 rounded-[20px] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all">Patient</button>
                      <button onClick={() => navigate('/register/doctor')} className="flex-1 py-3 text-zinc-400 hover:text-white rounded-[20px] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all">Operator</button>
                   </div>

                   <form onSubmit={handleRequestOtp} className="space-y-4 text-left">
                      <div className="relative group text-left">
                         <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                         <input
                            name="name"
                            type="text"
                            placeholder="Full Name (Letters only) *"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full pl-11 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-bold text-sm text-white placeholder:text-zinc-600"
                            required
                         />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-left">
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Date of Birth *</label>
                            <div className="relative group text-left">
                               <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                               <input
                                  name="dob"
                                  type="date"
                                  max={new Date().toISOString().split('T')[0]}
                                  value={formData.dob}
                                  onChange={handleDobChange}
                                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 text-white font-bold text-sm"
                                  required
                               />
                            </div>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Age (Auto)</label>
                            <div className="relative group text-left">
                               <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                               <input
                                  name="age"
                                  type="text"
                                  placeholder="Auto Age"
                                  value={formData.age ? `${formData.age} yrs` : ''}
                                  readOnly
                                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-[20px] outline-none text-blue-400 font-bold text-sm cursor-not-allowed select-none"
                                  required
                               />
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-left">
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Gender *</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-5 py-3.5 bg-zinc-900 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 font-bold text-sm text-zinc-300" required>
                               <option value="">Select Gender</option>
                               <option value="Male">Male</option>
                               <option value="Female">Female</option>
                               <option value="Other">Other</option>
                            </select>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Blood Group *</label>
                            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-5 py-3.5 bg-zinc-900 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 font-bold text-sm text-zinc-300" required>
                               <option value="">Select Blood Group</option>
                               <option value="O+">O+</option>
                               <option value="O-">O-</option>
                               <option value="A+">A+</option>
                               <option value="A-">A-</option>
                               <option value="B+">B+</option>
                               <option value="B-">B-</option>
                               <option value="AB+">AB+</option>
                               <option value="AB-">AB-</option>
                               <option value="Other">Other</option>
                            </select>
                         </div>
                      </div>

                      <div className="relative group text-left">
                         <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                         <input name="address" type="text" placeholder="Residential Address *" value={formData.address} onChange={handleChange} className="w-full pl-11 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 text-white font-bold text-sm placeholder:text-zinc-600" required />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-left">
                         <div className="relative group text-left">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                            <input
                               name="guardianName"
                               type="text"
                               placeholder="Guardian Name"
                               value={formData.guardianName}
                               onChange={handleChange}
                               className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 text-white font-bold text-sm placeholder:text-zinc-600"
                            />
                         </div>
                         <div className="relative group text-left">
                            <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                            <input
                               name="guardianPhone"
                               type="tel"
                               inputMode="numeric"
                               maxLength={10}
                               placeholder="Guardian Phone"
                               value={formData.guardianPhone}
                               onChange={handleChange}
                               className="w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 text-white font-bold text-sm placeholder:text-zinc-600 font-mono"
                            />
                            {formData.guardianPhone && (
                               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-zinc-500">
                                  {formData.guardianPhone.length}/10
                               </span>
                            )}
                         </div>
                      </div>

                      <div className="relative group text-left">
                         <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                         <input name="profession" type="text" placeholder="Profession / Occupation" value={formData.profession} onChange={handleChange} className="w-full pl-11 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 text-white font-bold text-sm placeholder:text-zinc-600" />
                      </div>

                      <div className="relative group text-left">
                         <ShieldCheckIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                         <input
                            name="aadhaarNumber"
                            type="tel"
                            inputMode="numeric"
                            maxLength={12}
                            placeholder="Aadhaar Card Number (12 Digits)"
                            value={formData.aadhaarNumber}
                            onChange={handleChange}
                            className="w-full pl-11 pr-16 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 text-white font-bold text-sm placeholder:text-zinc-600 font-mono tracking-wider"
                         />
                         {formData.aadhaarNumber && (
                            <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono font-black ${formData.aadhaarNumber.length === 12 ? 'text-emerald-400' : 'text-amber-400'}`}>
                               {formData.aadhaarNumber.length}/12
                            </span>
                         )}
                      </div>

                      <div className="relative group text-left">
                         <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                         <input
                            name="phone"
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="Mobile Number (10 Digits) *"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full pl-11 pr-16 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 text-white font-bold text-sm font-mono tracking-wider"
                            required
                         />
                         {formData.phone && (
                            <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono font-black ${formData.phone.length === 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                               {formData.phone.length}/10
                            </span>
                         )}
                      </div>

                      <div className="relative group text-left">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                         <input name="email" type="email" placeholder="Email Address *" value={formData.email} onChange={handleChange} className="w-full pl-11 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 text-white font-bold text-sm" required />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-left">
                         <div className="relative group text-left">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                            <input name="password" type="password" placeholder="Password *" value={formData.password} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 text-white font-bold text-sm" required />
                         </div>
                         <div className="relative group text-left">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                            <input name="confirmPassword" type="password" placeholder="Confirm *" value={formData.confirmPassword} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 text-white font-bold text-sm" required />
                         </div>
                      </div>

                      <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4 disabled:opacity-50">{loading ? 'Processing Node...' : <>Request Verification OTP <ArrowRight size={18} /></>}</button>

                      <div className="relative my-6 flex items-center justify-center"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div><span className="relative px-3 bg-black/40 text-[9px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">or continue with</span></div>

                      <button type="button" onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 py-3.5 border border-white/10 rounded-[20px] font-bold text-sm text-white hover:bg-white/5 transition-all active:scale-[0.98]"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" /> Continue with Google</button>
                   </form>
                </div>
              )}

              {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="w-full space-y-6 text-left">
                   <div className="space-y-4 text-left">
                      <div className="relative group text-left">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-blue-500" />
                         <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Email Verification Code"
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full pl-11 pr-6 py-4 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 focus:bg-white/10 text-center font-black tracking-[0.5em] text-sm text-white font-mono"
                            required
                         />
                      </div>
                   </div>
                   <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">Verify & Sync</button>
                   <button type="button" onClick={handleResendOtp} disabled={countdown > 0} className="w-full text-[9px] font-black uppercase text-blue-400 hover:underline">{countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}</button>
                </form>
              )}

              {step === 3 && (
                <div className="w-full text-center">
                   <div className="p-8 bg-blue-500/10 border border-blue-500/20 rounded-[20px] mb-8">
                      <p className="text-4xl font-black text-white tracking-wider">{patientId}</p>
                   </div>
                   <button onClick={() => navigate('/')} className="w-full py-4 bg-blue-600 text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">Login to Terminal <ArrowRight size={18} /></button>
                </div>
              )}

              <p className="mt-8 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Already have an account? <Link to="/" className="text-blue-400 font-black hover:underline ml-1">Sign in</Link></p>
           </div>
         </div>
      </div>

      <div className="bg-zinc-950/50 backdrop-blur-xl border-t border-white/5 py-8 px-6 lg:px-20 z-30 relative text-left">
         <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
            {[
               { icon: ShieldCheckIcon, label: '256-bit', sub: 'Data Encryption', color: 'text-blue-500', bg: 'bg-blue-500/10' },
               { icon: Users, label: '10K+', sub: 'Happy Users', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
               { icon: Globe, label: '500+', sub: 'Hospitals', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
               { icon: Headphones, label: '24/7', sub: 'Support', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
            ].map((s, i) => (
               <div key={i} className="flex items-center gap-4 text-left">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shrink-0 shadow-sm border border-white/5`}><s.icon size={20} /></div>
                  <div className="text-left"><p className="text-base font-black text-white leading-none">{s.label}</p><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">{s.sub}</p></div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default PatientRegister;
