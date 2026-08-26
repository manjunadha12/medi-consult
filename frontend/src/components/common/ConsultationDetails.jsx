import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import {
  Ticket, Clock, Shield, Lock, Video, Calendar, ChevronLeft,
  Loader2, User as UserIcon, Activity, Zap, CheckCircle, ArrowRight, ShieldCheck, History, Star, X, TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ConsultationDetails = () => {
  const { user, theme } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('id');

  const [appt, setAppt] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      fetchDetails();
    } else {
      fetchLatest();
    }
  }, [appointmentId]);

  useEffect(() => {
    if (appt?.patientId) {
      fetchPatientHistory(appt.patientId);
    }
  }, [appt]);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/appointments/${appointmentId}`);
      setAppt(res.data);
    } catch (err) {
      toast.error("Failed to sync consultation node");
    } finally {
      setLoading(false);
    }
  };

  const fetchLatest = async () => {
    try {
      const endpoint = user.role === 'patient' ? '/appointments/patient-summary' : '/appointments/doctor-queue';
      const res = await api.get(endpoint);
      const appointments = user.role === 'patient' ? res.data.appointments : res.data;
      if (Array.isArray(appointments) && appointments.length > 0) {
        const active = appointments.find(a => ['Accepted', 'Live', 'Pending'].includes(a.status));
        setAppt(active || appointments[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientHistory = async (pId) => {
    try {
      const { data } = await api.get(`/appointments/patient-list?patientId=${pId}`);
      // Filter out the current one and take latest 3
      const filtered = data.filter(a => a._id !== (appt?._id || appointmentId)).slice(0, 3);
      setHistory(filtered);
    } catch (err) {
      console.error("[HISTORY_FETCH_ERR]", err);
    }
  };

  const submitReview = async () => {
    if (!reviewData.comment.trim()) return toast.error("Please enter a technical comment.");
    setSubmittingReview(true);
    try {
      await api.post('/patients/review', {
        doctorId: appt.doctorId,
        appointmentId: appt.appointmentId || appt._id,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      toast.success("Review synchronized with medical registry.");
      setShowReviewModal(false);
      setReviewData({ rating: 5, comment: '' });
    } catch (err) {
      toast.error("Failed to propagate review node.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className={`flex h-screen items-center justify-center ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#F8FAFC]'}`}>
       <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

  if (!appt) return (
    <div className={`flex h-screen items-center justify-center ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-[#F8FAFC] text-slate-800'}`}>
       <div className="text-center space-y-6">
          <Ticket size={64} className="mx-auto opacity-20" />
          <p className="font-black uppercase tracking-widest text-xs">No Active Consultation Node Found</p>
          <button onClick={() => navigate(-1)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Return to Console</button>
       </div>
    </div>
  );

  const isPatient = user.role === 'patient';
  const partnerName = isPatient ? appt.doctorName : appt.patientName;

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left neural-grid pb-24 ${
      theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'
    }`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-4 sm:p-8 lg:p-12">
          <div className="max-w-5xl mx-auto space-y-10">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="text-left">
                <div className="flex items-center gap-3 mb-2">
                   <button onClick={() => navigate(-1)} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                      <ChevronLeft size={20} strokeWidth={3} />
                   </button>
                   <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Node Protocol: {appt.appointmentId || appt._id.slice(-8).toUpperCase()}</p>
                </div>
                <h1 className={`text-3xl lg:text-5xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Consultation Details</h1>
              </div>

              <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border ${appt.isMeetingReady ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-zinc-500 border-white/10'}`}>
                 <div className={`w-2 h-2 rounded-full ${appt.isMeetingReady ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                 {appt.isMeetingReady ? 'Arena Active' : 'Waiting for Initialization'}
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Left Profile Node */}
               <div className="lg:col-span-1 space-y-8">
                  <div className={`p-10 rounded-[48px] border shadow-2xl relative overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-950 border-white/5' : 'bg-white border-slate-100'}`}>
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                     <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-24 h-24 rounded-[32px] bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-6 uppercase">
                           {partnerName?.charAt(0)}
                        </div>
                        <h3 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{partnerName}</h3>
                        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">{appt.specialization || 'Clinical Specialist'}</p>
                     </div>

                     <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                           <div className="flex items-center gap-3">
                              <Activity size={16} className="text-emerald-500" />
                              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Protocol Type</span>
                           </div>
                           <span className="text-xs font-black text-white uppercase">{appt.consultationType}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                           <div className="flex items-center gap-3">
                              <ShieldCheck size={16} className="text-blue-500" />
                              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Verification</span>
                           </div>
                           <span className="text-xs font-black text-emerald-500 uppercase">{appt.paymentStatus === 'Paid' ? 'VERIFIED' : 'PENDING'}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Main Content Area */}
               <div className="lg:col-span-2 space-y-8">
                  <div className={`p-10 rounded-[56px] border shadow-2xl relative overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-950 border-white/5' : 'bg-white border-slate-100'}`}>
                     <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-8 flex items-center gap-3">
                        <Zap size={18} /> Session Configuration
                     </h3>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <div className="p-6 bg-white/5 border border-white/5 rounded-[32px] group hover:border-emerald-500/20 transition-all">
                           <p className="text-[8px] font-black text-zinc-500 uppercase mb-2 tracking-widest flex items-center gap-2">
                              <Calendar size={12} className="text-emerald-500"/> Scheduled Date
                           </p>
                           <p className="text-2xl font-black text-white tracking-tighter">{new Date(appt.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className="p-6 bg-white/5 border border-white/5 rounded-[32px] group hover:border-amber-500/20 transition-all">
                           <p className="text-[8px] font-black text-zinc-500 uppercase mb-2 tracking-widest flex items-center gap-2">
                              <Clock size={12} className="text-amber-500"/> Synchronization Time
                           </p>
                           <p className="text-2xl font-black text-white tracking-tighter">{appt.scheduledVideoTime || appt.time}</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="p-6 bg-white/5 border border-white/5 rounded-[32px] flex items-center justify-between group hover:border-blue-500/20 transition-all">
                              <div>
                                 <p className="text-[8px] font-black text-zinc-500 uppercase mb-1 tracking-widest">Meeting Node ID</p>
                                 <p className="text-xl font-black text-white uppercase tracking-wider">{appt.meetingId || 'GENERATING...'}</p>
                              </div>
                              <Shield size={24} className="text-blue-500 opacity-20 group-hover:opacity-100 transition-all" />
                           </div>
                           <div className="p-6 bg-white/5 border border-white/5 rounded-[32px] flex items-center justify-between group hover:border-purple-500/20 transition-all">
                              <div>
                                 <p className="text-[8px] font-black text-zinc-500 uppercase mb-1 tracking-widest">Access Passkey</p>
                                 <p className="text-xl font-black text-white tracking-[0.4em]">{appt.meetingPassword || '****'}</p>
                              </div>
                              <Lock size={24} className="text-purple-500 opacity-20 group-hover:opacity-100 transition-all" />
                           </div>
                        </div>

                        <div className={`p-8 rounded-[40px] border flex gap-6 items-start transition-all ${theme === 'dark' ? 'bg-blue-600/5 border-blue-600/10' : 'bg-blue-50 border-blue-100'}`}>
                           <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 shrink-0">
                              <Activity size={24} />
                           </div>
                           <div className="text-left">
                              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Clinical Instruction Node</p>
                              <p className="text-sm font-medium text-zinc-400 italic">
                                 "Please ensure you are in a quiet, well-lit environment for the diagnostic synthesis. Have your physical reports node ready if requested."
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="mt-12">
                        {appt.status === 'Completed' && isPatient ? (
                           <button
                             onClick={() => setShowReviewModal(true)}
                             className="w-full py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] transition-all shadow-2xl flex items-center justify-center gap-5 active:scale-95 bg-emerald-600 text-white shadow-emerald-600/40 hover:bg-emerald-700"
                           >
                              <Star size={24} fill="currentColor" /> Write Specialist Review
                           </button>
                        ) : (
                           <>
                             <button
                                onClick={() => {
                                   const path = isPatient ? '/patient/video-consult' : '/doctor/video-consult';
                                   navigate(`${path}?roomCode=${appt._id}&appointmentId=${appt._id}&peerName=${partnerName}&peerId=${isPatient ? appt.doctorId : appt.patientId}`);
                                }}
                                className={`w-full py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] transition-all shadow-2xl flex items-center justify-center gap-5 active:scale-95 ${appt.isMeetingReady ? 'bg-blue-600 text-white shadow-blue-600/40 hover:bg-blue-700' : 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed grayscale'}`}
                             >
                                <Video size={24} />
                                {appt.isMeetingReady ? 'Establish Session Link Now' : 'Awaiting Specialist Arena Activation'}
                             </button>
                             {!appt.isMeetingReady && (
                                <p className="text-center text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-4 animate-pulse">
                                   Neural handshake will be authorized once the specialist initiates the node.
                                </p>
                             )}
                           </>
                        )}
                     </div>
                  </div>

                  {/* Clinical History Section */}
                  <div className={`p-10 rounded-[56px] border shadow-2xl transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-950 border-white/5' : 'bg-white border-slate-100'}`}>
                     <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500 flex items-center gap-3">
                           <History size={18} /> Patient Clinical Archive
                        </h3>
                        <button onClick={() => navigate(isPatient ? '/patient/history' : '/doctor/history')} className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline">View Full Registry</button>
                     </div>

                     <div className="space-y-4">
                        {history.length > 0 ? history.map((h, i) => (
                           <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-[32px] flex items-center justify-between group hover:bg-white/10 transition-all cursor-default">
                              <div className="flex items-center gap-5">
                                 <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400">
                                    <Calendar size={18} />
                                 </div>
                                 <div className="text-left">
                                    <p className="text-[10px] font-black text-white uppercase">{h.diagnosis || 'General Checkup'}</p>
                                    <p className="text-[8px] font-bold text-zinc-500 uppercase mt-0.5">{new Date(h.date).toLocaleDateString()} • {h.consultationType}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="text-right hidden sm:block">
                                    <p className="text-[8px] font-black text-zinc-400 uppercase">{h.doctorName || h.patientName}</p>
                                    <div className={`mt-1 px-2 py-0.5 rounded text-[7px] font-black uppercase ${h.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                       {h.status}
                                    </div>
                                 </div>
                                 {h.status === 'Completed' && isPatient && (
                                    <button
                                      onClick={() => {
                                        setAppt(h);
                                        setShowReviewModal(true);
                                      }}
                                      className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all shadow-lg"
                                    >
                                       <Star size={16} fill="currentColor" />
                                    </button>
                                 )}
                              </div>
                           </div>
                        )) : (
                           <div className="py-10 text-center opacity-30">
                              <History size={40} className="mx-auto mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-widest">No previous consultation nodes found</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            <Footer />
          </div>
        </main>
      </div>

      {/* DOCTOR REVIEW MODAL NODE */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className={`w-full max-w-lg rounded-[48px] border shadow-2xl overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
              <div className={`p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                 <div className="text-left">
                    <h2 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Clinical Review</h2>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Feedback Synchronization Protocol</p>
                 </div>
                 <button onClick={() => setShowReviewModal(false)} className={`p-3 rounded-xl transition-all border ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white' : 'bg-white border-slate-100 text-slate-400'}`}><X size={20}/></button>
              </div>

              <div className="p-10 space-y-8 text-center">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rate the quality of clinical sync with {appt?.doctorName}</p>
                    <div className="flex justify-center gap-3">
                       {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewData({ ...reviewData, rating: star })}
                            className={`p-2 transition-all transform active:scale-90 ${reviewData.rating >= star ? 'text-amber-500 scale-110' : 'text-zinc-700 opacity-30 hover:opacity-100'}`}
                          >
                             <Star size={32} fill={reviewData.rating >= star ? "currentColor" : "none"} strokeWidth={3} />
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Technical Feedback / Comments</label>
                    <textarea
                      className={`w-full p-6 rounded-[32px] border outline-none text-sm font-bold min-h-[140px] transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500/50' : 'bg-slate-50 border-slate-200'}`}
                      placeholder="Enter your assessment of the consultation quality..."
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    ></textarea>
                 </div>

                 <button
                   onClick={submitReview}
                   disabled={submittingReview}
                   className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                 >
                    {submittingReview ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
                    Establish Review Record
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationDetails;
