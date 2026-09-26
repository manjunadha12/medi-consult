import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import {
  Calendar, Clock, CreditCard, ChevronRight, User as UserIcon,
  MapPin, Loader2, Sparkles, ShieldCheck as ShieldCheckIcon,
  Ticket, Camera, Image as ImageIcon, X, Check, ArrowLeft, Sun, Moon, Info,
  Building, Video, CheckCircle, Stethoscope
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BookOP = () => {
  const { user, theme } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(location.state?.doctor || null);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  // Default to Next Day (Tomorrow)
  const getNextDayDate = (daysAhead = 1) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const tomorrowStr = getNextDayDate(1);

  const [appointment, setAppointment] = useState({
    consultationType: location.state?.bookingType === 'offline' ? 'OFFLINE' : (location.state?.bookingType === 'online' ? 'VIDEO_CALL' : 'OFFLINE'),
    date: tomorrowStr,
    timeSlot: '09:00 AM',
    paymentMethod: 'UPI',
    transactionId: ''
  });

  // Next 5 days for quick selection chips
  const quickDates = [1, 2, 3, 4, 5].map(offset => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = offset === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short' });
    const formatted = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    return { dateStr, dayLabel, formatted };
  });

  const morningSlots = [
    '08:00 AM', '08:30 AM',
    '09:00 AM', '09:30 AM',
    '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM'
  ];

  const afternoonSlots = [
    '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM'
  ];

  const eveningSlots = [
    '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM',
    '07:00 PM', '07:30 PM',
    '08:00 PM', '08:30 PM'
  ];

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return toast.error("Specialist node required");
    if (!appointment.date) return toast.error("Please select an appointment date");
    if (!appointment.timeSlot) return toast.error("Please choose a time slot");
    if (!appointment.transactionId) return toast.error("Please enter the UPI Transaction ID (UTR)");
    if (!screenshot) return toast.error("Please upload the payment confirmation screenshot");

    setLoading(true);
    try {
      const consultationFee = selectedDoctor.fee || selectedDoctor.consultationFee || 500;

      const formData = new FormData();
      formData.append('doctorId', selectedDoctor.id || selectedDoctor.doctorId);
      formData.append('date', appointment.date);
      formData.append('time', appointment.timeSlot);
      formData.append('department', selectedDoctor.specialization || selectedDoctor.department || 'General Medicine');
      formData.append('fee', consultationFee);
      formData.append('paymentMethod', 'UPI');
      formData.append('transactionId', appointment.transactionId);
      formData.append('consultationType', appointment.consultationType);
      formData.append('type', appointment.consultationType === 'OFFLINE' ? 'offline' : 'online');
      formData.append('problemDescription', `Clinical Consultation (${appointment.consultationType === 'OFFLINE' ? 'Offline Hospital Visit' : 'Online Video Call'})`);

      if (screenshot) {
        formData.append('paymentScreenshot', screenshot);
      }

      const { data } = await api.post('/appointments/book', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        const modeLabel = appointment.consultationType === 'OFFLINE' ? 'Offline Hospital Visit' : 'Online Video Call';
        toast.success(`Booking Initiated (${modeLabel}) for ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot}`);
        navigate('/patient/dashboard');
      }
    } catch (error) {
      console.error(`[BOOKING_ERROR]`, error);
      const msg = error.response?.data?.message || error.message || "Node synchronization failed";
      toast.error(`Sync Failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDoctor) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-[#F8FAFC] text-slate-800'}`}>
        <div className="text-center space-y-6 max-w-md p-8 border border-white/5 rounded-3xl backdrop-blur-xl bg-white/5 shadow-2xl">
          <UserIcon size={64} className="mx-auto opacity-20 text-blue-500" />
          <h2 className="text-xl font-black uppercase tracking-tight">No Specialist Node Selected</h2>
          <p className="text-xs text-zinc-400">Please select a specialist from our registry to reserve your consultation window.</p>
          <button
            onClick={() => navigate('/patient/doctor-search')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all"
          >
            Back to Specialist Discovery
          </button>
        </div>
      </div>
    );
  }

  const selectedDateObj = new Date(appointment.date + 'T00:00:00');
  const formattedSelectedDate = selectedDateObj.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-300' : 'bg-[#F8FAFC] text-slate-600'} text-left`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-4 sm:p-8 lg:p-12 pb-32 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
              <div className="text-left space-y-1">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 mb-2 transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Doctor Directory
                </button>
                <h1 className={`text-3xl sm:text-4xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Slot Synchronization
                </h1>
                <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest">
                  Reserve Next Available Neural Time Window
                </p>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} /> Next-Day Advance Booking Active
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Specialist Card */}
              <div className="lg:col-span-4 space-y-6">
                <div className={`p-8 rounded-[40px] border shadow-2xl relative overflow-hidden transition-all duration-500 ${
                  theme === 'dark' ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-white/10' : 'bg-white border-slate-200'
                }`}>
                  <div className="absolute top-0 right-0 w-36 h-36 bg-blue-600/15 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>

                  <div className="flex flex-col items-center text-center mb-8 relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[30px] flex items-center justify-center text-white text-3xl font-black shadow-2xl mb-5 border-2 border-blue-400/30">
                      {selectedDoctor.name?.charAt(0) || 'D'}
                    </div>
                    <h3 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {selectedDoctor.name}
                    </h3>
                    <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.25em] mt-1">
                      {selectedDoctor.specialization || selectedDoctor.department || 'Clinical Specialist'}
                    </p>
                  </div>

                  <div className="space-y-3.5 pt-6 border-t border-white/10">
                    <div className="flex items-center gap-3 text-left p-3.5 bg-white/5 rounded-2xl border border-white/5">
                      <MapPin size={16} className="text-rose-400 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Facility & Node</p>
                        <p className="text-xs font-bold uppercase tracking-tight text-zinc-200 truncate">
                          {selectedDoctor.hospital || selectedDoctor.hospitalName || 'Central Medical Hub'}, {selectedDoctor.city || 'Specialist Arena'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <CreditCard size={16} className="text-emerald-400 shrink-0" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Consultation Fee</span>
                      </div>
                      <span className="text-sm font-black text-emerald-400 tracking-wider">
                        ₹{selectedDoctor.fee || selectedDoctor.consultationFee || 500}
                      </span>
                    </div>

                    {/* Selected Slot Summary Badge */}
                    <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Ticket size={12} /> Target Reservation
                        </p>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          appointment.consultationType === 'OFFLINE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {appointment.consultationType === 'OFFLINE' ? 'Offline Visit' : 'Video Call'}
                        </span>
                      </div>
                      <p className="text-xs font-black text-white">
                        {formattedSelectedDate}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-cyan-400">
                        Slot: {appointment.timeSlot}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-[32px] border flex gap-4 text-left transition-all ${
                  theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <ShieldCheckIcon className="text-emerald-400 shrink-0" size={22} />
                  <p className="text-[9px] font-bold text-emerald-500 leading-relaxed uppercase tracking-wider">
                    Institutional slot reservation secured with end-to-end cryptographic verification.
                  </p>
                </div>
              </div>

              {/* Right Column: Booking Form */}
              <div className="lg:col-span-8">
                <form onSubmit={handleBooking} className={`p-8 sm:p-10 rounded-[44px] border shadow-2xl transition-all duration-500 ${
                  theme === 'dark' ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-white/10' : 'bg-white border-slate-200'
                }`}>
                  <div className="space-y-8">

                    {/* Consultation Mode Selector (Offline Hospital Visit vs Online Video Call) */}
                    <div className="space-y-4 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-3">
                          <Stethoscope size={18} className="text-blue-500" /> Select Consultation Mode
                        </h3>
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                          Selected: {appointment.consultationType === 'OFFLINE' ? 'Offline Hospital OP' : 'Online Video Call'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Mode 1: Offline In-Person Visit */}
                        <button
                          type="button"
                          onClick={() => setAppointment({ ...appointment, consultationType: 'OFFLINE' })}
                          className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden flex items-start gap-4 ${
                            appointment.consultationType === 'OFFLINE'
                              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10 scale-[1.02]'
                              : (theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')
                          }`}
                        >
                          <div className={`p-3.5 rounded-2xl shrink-0 ${appointment.consultationType === 'OFFLINE' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/10 text-zinc-400'}`}>
                            <Building size={22} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black uppercase tracking-tight text-white">Offline OP Visit</span>
                              {appointment.consultationType === 'OFFLINE' && <CheckCircle size={16} className="text-emerald-400" />}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">In-person hospital OP check-in at facility counter.</p>
                            <span className="inline-block text-[8px] font-black uppercase tracking-widest text-emerald-400 mt-2 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                              Physical Token Issued
                            </span>
                          </div>
                        </button>

                        {/* Mode 2: Online Video Call */}
                        <button
                          type="button"
                          onClick={() => setAppointment({ ...appointment, consultationType: 'VIDEO_CALL' })}
                          className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden flex items-start gap-4 ${
                            appointment.consultationType === 'VIDEO_CALL'
                              ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10 scale-[1.02]'
                              : (theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')
                          }`}
                        >
                          <div className={`p-3.5 rounded-2xl shrink-0 ${appointment.consultationType === 'VIDEO_CALL' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/10 text-zinc-400'}`}>
                            <Video size={22} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black uppercase tracking-tight text-white">Online Video Call</span>
                              {appointment.consultationType === 'VIDEO_CALL' && <CheckCircle size={16} className="text-blue-400" />}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1">Remote face-to-face video consultation in neural room.</p>
                            <span className="inline-block text-[8px] font-black uppercase tracking-widest text-blue-400 mt-2 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                              Virtual Room Link
                            </span>
                          </div>
                        </button>
                      </div>

                      {/* Dynamic Mode Instructions Card */}
                      {appointment.consultationType === 'OFFLINE' ? (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-400">
                          <MapPin size={20} className="shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Offline Hospital OP Protocol:</p>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-300">
                              Report to <span className="text-white font-black">{selectedDoctor.hospital || selectedDoctor.hospitalName || 'Central Hospital'}</span> OP Desk 15 minutes prior to your time slot. Physical token will be verified at check-in counter.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3 text-blue-400">
                          <Video size={20} className="shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Online Video Call Protocol:</p>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-300">
                              Join the virtual room on your dashboard 5 minutes before your scheduled slot. Ensure camera and microphone permissions are enabled.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Date Selector Section */}
                    <div className="space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-3">
                          <Calendar size={18} className="text-blue-500" /> Select Date Node
                        </h3>
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                          Selected: {formattedSelectedDate}
                        </span>
                      </div>

                      {/* Quick Date Selection Chips (Starting from Tomorrow) */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {quickDates.map((q) => {
                          const isSelected = appointment.date === q.dateStr;
                          return (
                            <button
                              key={q.dateStr}
                              type="button"
                              onClick={() => setAppointment({ ...appointment, date: q.dateStr })}
                              className={`p-3.5 rounded-2xl text-center transition-all border flex flex-col items-center justify-center gap-0.5 ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                                  : (theme === 'dark'
                                    ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')
                              }`}
                            >
                              <span className="text-[8px] font-black uppercase tracking-widest opacity-80">{q.dayLabel}</span>
                              <span className="text-xs font-black uppercase tracking-tight">{q.formatted}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Date Input (Starting from Tomorrow) */}
                      <div className="relative">
                        <input
                          type="date"
                          required
                          min={tomorrowStr}
                          className={`w-full p-4 sm:p-5 rounded-2xl font-black text-sm outline-none transition-all ${
                            theme === 'dark'
                              ? 'bg-zinc-900 border border-white/10 text-white focus:border-blue-500'
                              : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-blue-500'
                          }`}
                          value={appointment.date}
                          onChange={(e) => setAppointment({ ...appointment, date: e.target.value })}
                        />
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5 ml-2">
                          * Minimum booking date starts from tomorrow ({new Date(tomorrowStr).toLocaleDateString()})
                        </p>
                      </div>
                    </div>

                    {/* Temporal Window (Time Slots) */}
                    <div className="space-y-4 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-purple-400 flex items-center gap-3">
                          <Clock size={18} className="text-purple-400" /> Temporal Window
                        </h3>
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                          Active: {appointment.timeSlot}
                        </span>
                      </div>

                      {/* Morning Slots (08:00 AM - 12:30 PM) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                            <Sun size={12} className="text-amber-400" /> Morning Schedule (08:00 AM - 12:30 PM)
                          </p>
                          <span className="text-[8px] font-mono text-zinc-500">30 Min Intervals</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {morningSlots.map((slot) => {
                            const isSelected = appointment.timeSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setAppointment({ ...appointment, timeSlot: slot })}
                                className={`py-3 px-2 rounded-2xl text-[10px] font-mono font-bold uppercase transition-all border flex items-center justify-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30 scale-[1.02]'
                                    : (theme === 'dark'
                                      ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')
                                }`}
                              >
                                {isSelected && <Check size={11} strokeWidth={3} className="text-white shrink-0" />}
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Afternoon Slots (01:00 PM - 04:30 PM) */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                            <Sun size={12} className="text-sky-400" /> Afternoon Schedule (01:00 PM - 04:30 PM)
                          </p>
                          <span className="text-[8px] font-mono text-zinc-500">30 Min Intervals</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {afternoonSlots.map((slot) => {
                            const isSelected = appointment.timeSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setAppointment({ ...appointment, timeSlot: slot })}
                                className={`py-3 px-2 rounded-2xl text-[10px] font-mono font-bold uppercase transition-all border flex items-center justify-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30 scale-[1.02]'
                                    : (theme === 'dark'
                                      ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')
                                }`}
                              >
                                {isSelected && <Check size={11} strokeWidth={3} className="text-white shrink-0" />}
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Evening Slots (05:00 PM - 08:30 PM) */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <Moon size={12} className="text-indigo-400" /> Evening Schedule (05:00 PM - 08:30 PM)
                          </p>
                          <span className="text-[8px] font-mono text-zinc-500">30 Min Intervals</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {eveningSlots.map((slot) => {
                            const isSelected = appointment.timeSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setAppointment({ ...appointment, timeSlot: slot })}
                                className={`py-3 px-2 rounded-2xl text-[10px] font-mono font-bold uppercase transition-all border flex items-center justify-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30 scale-[1.02]'
                                    : (theme === 'dark'
                                      ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')
                                }`}
                              >
                                {isSelected && <Check size={11} strokeWidth={3} className="text-white shrink-0" />}
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Liability Settlement / UPI QR Section */}
                    <div className="space-y-4 text-left pt-2">
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-3">
                        <CreditCard size={18} className="text-emerald-400" /> Liability Settlement
                      </h3>

                      <div className="p-6 sm:p-8 rounded-[32px] bg-zinc-900/60 border border-white/10 space-y-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          <div className="p-3 bg-white rounded-2xl shrink-0 shadow-2xl">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=6301820400@ibl%26pn=CHANDRA%20KALAVATHI%20DERANGULA%26am=${selectedDoctor.fee || selectedDoctor.consultationFee || 500}%26cu=INR`}
                              alt="Institutional QR"
                              className="w-36 h-36"
                            />
                          </div>
                          <div className="text-left space-y-2.5">
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Manual Node Synchronization</p>
                            <h4 className="text-lg font-black text-white uppercase tracking-tight">Institutional UPI Node</h4>
                            <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                              <p className="text-[8px] font-black text-zinc-400 uppercase">VPA: <span className="text-white font-mono text-xs">6301820400@ibl</span></p>
                              <p className="text-[8px] font-black text-zinc-400 uppercase">Payee: <span className="text-zinc-200">CHANDRA KALAVATHI DERANGULA</span></p>
                            </div>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase leading-relaxed">
                              1. Scan QR with GPay / PhonePe / Paytm & pay ₹{selectedDoctor.fee || selectedDoctor.consultationFee || 500}<br />
                              2. Enter 12-digit UTR below & upload proof
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-zinc-300 uppercase tracking-widest ml-1">
                            Transaction ID (UTR Number)
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 423589012345"
                            className="w-full p-4 bg-zinc-900 border border-white/10 rounded-2xl font-black text-sm text-white outline-none focus:border-blue-500 transition-all placeholder:text-zinc-600 font-mono"
                            value={appointment.transactionId || ''}
                            onChange={(e) => setAppointment({ ...appointment, transactionId: e.target.value })}
                          />
                        </div>

                        {/* Screenshot Upload Node */}
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-zinc-300 uppercase tracking-widest ml-1">
                            Payment Confirmation Screenshot
                          </label>

                          {!screenshotPreview ? (
                            <div
                              onClick={() => document.getElementById('payment-ss').click()}
                              className="w-full py-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 hover:border-blue-500/40 transition-all group"
                            >
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-blue-400 group-hover:scale-110 transition-all">
                                <Camera size={20} />
                              </div>
                              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-zinc-200">
                                Click to upload transaction receipt
                              </p>
                              <input
                                id="payment-ss"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onClick={(e) => e.stopPropagation()}
                                onChange={handleScreenshotChange}
                              />
                            </div>
                          ) : (
                            <div className="relative group overflow-hidden rounded-2xl border border-white/10 aspect-video bg-black/40 max-h-48">
                              <img src={screenshotPreview} alt="Payment SS" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={removeScreenshot}
                                  className="p-3 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-90 shadow-xl"
                                >
                                  <X size={20} strokeWidth={3} />
                                </button>
                              </div>
                              <div className="absolute top-3 left-3 px-2.5 py-0.5 bg-emerald-500 rounded-full text-[7px] font-black uppercase text-white shadow-lg">
                                RECEIPT ATTACHED
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-xs shadow-2xl shadow-blue-600/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-40"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Ticket size={18} />}
                      Confirm Reservation ({appointment.consultationType === 'OFFLINE' ? 'Offline Hospital Visit' : 'Video Call'}) for {formattedSelectedDate} ({appointment.timeSlot})
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BookOP;
