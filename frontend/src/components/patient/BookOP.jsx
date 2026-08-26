import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import { Calendar, Clock, CreditCard, ChevronRight, User as UserIcon, MapPin, Loader2, Sparkles, ShieldCheck as ShieldCheckIcon, Ticket, Camera, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BookOP = () => {
  const { user, theme } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(location.state?.doctor || null);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  const [appointment, setAppointment] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSlot: '09:00 AM',
    paymentMethod: 'UPI'
  });

  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
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
    if (!appointment.transactionId) return toast.error("Please enter the UPI Transaction ID");
    if (!screenshot) return toast.error("Please upload the payment confirmation screenshot");

    setLoading(true);
    try {
      const consultationFee = selectedDoctor.fee || selectedDoctor.consultationFee || 500;

      const formData = new FormData();
      formData.append('doctorId', selectedDoctor.id || selectedDoctor.doctorId);
      formData.append('date', appointment.date);
      formData.append('time', appointment.timeSlot);
      formData.append('department', selectedDoctor.specialization);
      formData.append('fee', consultationFee);
      formData.append('paymentMethod', 'UPI');
      formData.append('transactionId', appointment.transactionId);
      formData.append('problemDescription', "Routine Clinical Consultation");

      if (screenshot) {
        formData.append('paymentScreenshot', screenshot);
      }

      const { data } = await api.post('/appointments/book', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        toast.success("Booking Initiated. Clinical Slot awaiting verification.");
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
        <div className="text-center space-y-6">
           <UserIcon size={64} className="mx-auto opacity-20" />
           <p className="font-black uppercase tracking-widest text-xs">No Specialist Node Selected</p>
           <button onClick={() => navigate('/patient/find-doctor')} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Back to Registry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-300' : 'bg-[#F8FAFC] text-slate-600'} text-left`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-8 lg:p-10 pb-32 overflow-y-auto custom-scrollbar">
          <header className="mb-10 text-left">
            <h1 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Slot Synchronization</h1>
            <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mt-1">Reserve Neural Time Window</p>
          </header>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* SPECIALIST NODE */}
            <div className="lg:col-span-4 space-y-8">
               <div className={`p-8 rounded-[48px] border shadow-2xl relative overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                  <div className="flex flex-col items-center text-center mb-8 relative z-10">
                    <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-6">
                      {selectedDoctor.name.charAt(0)}
                    </div>
                    <h3 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{selectedDoctor.name}</h3>
                    <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">{selectedDoctor.specialization}</p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-white/5">
                     <div className="flex items-center gap-4 text-left">
                        <MapPin size={16} className="text-rose-500 shrink-0" />
                        <p className="text-[10px] font-bold uppercase tracking-tight text-slate-500">{selectedDoctor.hospital}, {selectedDoctor.city}</p>
                     </div>
                     <div className="flex items-center gap-4 text-left">
                        <CreditCard size={16} className="text-blue-500 shrink-0" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Node Fee: <span className={theme === 'dark' ? 'text-white' : 'text-slate-800'}>₹{selectedDoctor.fee || selectedDoctor.consultationFee || 500}</span></p>
                     </div>
                  </div>
               </div>

               <div className={`p-8 rounded-[40px] border flex gap-5 text-left transition-all ${theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'}`}>
                  <ShieldCheckIcon className="text-emerald-500 shrink-0" size={24} />
                  <p className="text-[10px] font-bold text-emerald-600 leading-relaxed uppercase tracking-wide">
                     Your clinical connection is end-to-end encrypted using RSA-4096 protocols.
                  </p>
               </div>
            </div>

            {/* BOOKING FORM */}
            <div className="lg:col-span-8">
              <form onSubmit={handleBooking} className={`p-10 rounded-[56px] border shadow-2xl transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                 <div className="space-y-10">

                    {/* Date Sync */}
                    <div className="space-y-6 text-left">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-3">
                          <Calendar size={16} /> Select Date Node
                       </h3>
                       <input
                         type="date"
                         required
                         min={new Date().toISOString().split('T')[0]}
                         className={`w-full p-6 rounded-3xl font-black text-sm outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border border-slate-100 text-slate-800 shadow-inner'}`}
                         value={appointment.date}
                         onChange={(e) => setAppointment({...appointment, date: e.target.value})}
                       />
                    </div>

                    {/* Time Loop */}
                    <div className="space-y-6 text-left">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 flex items-center gap-3">
                          <Clock size={16} /> Temporal Window
                       </h3>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setAppointment({...appointment, timeSlot: slot})}
                              className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all border ${
                                appointment.timeSlot === slot
                                ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20'
                                : (theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100')
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* Payment Hub */}
                    <div className="space-y-6 text-left">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 flex items-center gap-3">
                          <CreditCard size={16} /> Liability Settlement
                       </h3>
                       <div className="flex flex-wrap gap-4">
                          <button
                            type="button"
                            className="flex-1 min-w-[120px] py-4 rounded-2xl text-[10px] font-black uppercase transition-all border bg-emerald-600 border-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                          >
                            UPI / QR Code
                          </button>
                       </div>
                    </div>

                    {/* MANUAL UPI NODE */}
                    <div className="p-8 rounded-[32px] bg-zinc-900/50 border border-white/5 space-y-8 animate-in zoom-in-95 duration-500">
                         <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="p-4 bg-white rounded-3xl shrink-0 shadow-2xl shadow-blue-500/10">
                               {/* Institutional QR Node (Placeholder - replace with actual clinic QR) */}
                               <img
                                 src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=6301820400@ibl%26pn=CHANDRA%20KALAVATHI%20DERANGULA%26am=${selectedDoctor.fee || selectedDoctor.consultationFee || 500}%26cu=INR`}
                                 alt="Institutional QR"
                                 className="w-40 h-40"
                               />
                            </div>
                            <div className="text-left space-y-4">
                               <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Manual Node Synchronization</p>
                               <h4 className="text-xl font-black text-white uppercase tracking-tight">Institutional UPI Node</h4>
                               <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                  <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">VPA Address</p>
                                  <p className="text-xs font-black text-zinc-200">6301820400@ibl</p>
                                  <p className="text-[8px] font-black text-zinc-500 uppercase mt-2 mb-1">Payee Name</p>
                                  <p className="text-[10px] font-black text-zinc-400">CHANDRA KALAVATHI DERANGULA</p>
                               </div>
                               <p className="text-[9px] font-bold text-zinc-500 uppercase leading-relaxed">
                                  1. Scan QR with GPay / PhonePe / Paytm<br/>
                                  2. Complete payment of ₹{selectedDoctor.fee || 500}<br/>
                                  3. Enter the 12-digit UTR / Transaction ID below
                               </p>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-2">Transaction ID (UTR)</label>
                            <input
                               type="text"
                               required
                               placeholder="e.g. 423589012345"
                               className="w-full p-5 bg-zinc-900 border border-white/10 rounded-2xl font-black text-sm text-white outline-none focus:border-blue-500 transition-all placeholder:text-zinc-700"
                               value={appointment.transactionId || ''}
                               onChange={(e) => setAppointment({...appointment, transactionId: e.target.value})}
                            />
                         </div>

                         {/* Screenshot Upload Node */}
                         <div className="space-y-4">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-2">Payment Confirmation Screenshot</label>

                            {!screenshotPreview ? (
                               <div
                                 onClick={() => document.getElementById('payment-ss').click()}
                                 className="w-full py-10 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/5 hover:border-blue-500/30 transition-all group"
                               >
                                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                                     <Camera size={24} />
                                  </div>
                                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300">Upload Transaction Screenshot</p>
                                  <input
                                    id="payment-ss"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleScreenshotChange}
                                  />
                               </div>
                            ) : (
                               <div className="relative group overflow-hidden rounded-3xl border border-white/10 aspect-video bg-black/40">
                                  <img src={screenshotPreview} alt="Payment SS" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button
                                       type="button"
                                       onClick={removeScreenshot}
                                       className="p-4 bg-red-600/20 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-90 shadow-xl"
                                     >
                                        <X size={24} strokeWidth={3} />
                                     </button>
                                  </div>
                                  <div className="absolute top-4 left-4 px-3 py-1 bg-emerald-500 rounded-full text-[8px] font-black uppercase text-white shadow-lg">NODE CAPTURED</div>
                               </div>
                            )}
                         </div>
                      </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-blue-600/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30 mt-8"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Ticket size={20} />}
                      Initialize Payment & Booking
                    </button>
                 </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BookOP;
