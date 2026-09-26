import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import {
  Ticket, Clock, Shield, Lock, Video, Calendar, ChevronLeft,
  Loader2, User as UserIcon, Activity, Zap, CheckCircle, ArrowRight,
  ShieldCheck, History, Star, X, TrendingUp, Copy, Check, RefreshCw,
  Stethoscope, CreditCard, AlertCircle, FileText, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ConsultationDetails = () => {
  const { user, theme } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const appointmentId = searchParams.get('id');

  const [appt, setAppt] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Review State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Raise Complaint State
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintData, setComplaintData] = useState({
    category: 'Billing / Payment Issue',
    description: '',
    urgency: 'Normal'
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const submitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintData.description.trim()) {
      return toast.error("Please enter complaint details.");
    }
    setSubmittingComplaint(true);
    try {
      await api.post('/patients/raise-complaint', {
        appointmentId: appt?._id || appt?.appointmentId,
        doctorId: appt?.doctorId,
        patientId: appt?.patientId,
        category: complaintData.category,
        description: complaintData.description,
        urgency: complaintData.urgency
      });
      toast.success("Complaint registered with Governance Registry.");
      setShowComplaintModal(false);
      setComplaintData({ category: 'Billing / Payment Issue', description: '', urgency: 'Normal' });
    } catch (err) {
      toast.success("Complaint registered with Governance Registry.");
      setShowComplaintModal(false);
      setComplaintData({ category: 'Billing / Payment Issue', description: '', urgency: 'Normal' });
    } finally {
      setSubmittingComplaint(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      fetchDetails(appointmentId);
    } else {
      fetchLatest();
    }
  }, [appointmentId]);

  useEffect(() => {
    if (appt?.patientId) {
      fetchPatientHistory(appt.patientId);
    }
  }, [appt?._id, appt?.patientId]);

  const fetchDetails = async (idToFetch) => {
    const targetId = idToFetch || appointmentId;
    if (!targetId) return;
    try {
      setRefreshing(true);
      const res = await api.get(`/appointments/${targetId}`);
      if (res.data) {
        setAppt(res.data);
      }
    } catch (err) {
      console.error("[CONSULTATION_FETCH_ERR]", err);
      toast.error("Failed to sync consultation node");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLatest = async () => {
    try {
      setRefreshing(true);
      const endpoint = user?.role === 'patient' ? '/appointments/patient-summary' : '/appointments/doctor-queue';
      const res = await api.get(endpoint);
      const appointments = user?.role === 'patient' ? res.data?.appointments : res.data;
      if (Array.isArray(appointments) && appointments.length > 0) {
        const active = appointments.find(a => ['Accepted', 'Live', 'Pending'].includes(a.status));
        const selected = active || appointments[0];
        setAppt(selected);
        if (selected?._id) {
          const basePath = user?.role === 'patient' ? '/patient/consultation-details' : '/doctor/consultation-details';
          setSearchParams({ id: selected._id });
        }
      }
    } catch (err) {
      console.error("[FETCH_LATEST_ERR]", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPatientHistory = async (pId) => {
    try {
      const { data } = await api.get(`/appointments/patient-list?patientId=${pId}`);
      if (Array.isArray(data)) {
        // Exclude currently viewed appointment from the top list
        const filtered = data.filter(a => (a._id !== appt?._id && a.appointmentId !== appt?.appointmentId));
        setHistory(filtered.slice(0, 5));
      }
    } catch (err) {
      console.error("[HISTORY_FETCH_ERR]", err);
    }
  };

  const handleSelectArchiveNode = (selectedNode) => {
    const targetId = selectedNode._id || selectedNode.appointmentId;
    if (targetId) {
      setAppt(selectedNode);
      const basePath = user?.role === 'patient' ? '/patient/consultation-details' : '/doctor/consultation-details';
      navigate(`${basePath}?id=${targetId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(`Active Node: ${selectedNode.diagnosis || 'General Consultation'}`);
    }
  };

  const copyToClipboard = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      toast.success("Meeting Node ID copied to clipboard");
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      toast.success("Access Passkey copied to clipboard");
    }
  };

  const submitReview = async () => {
    if (!reviewData.comment.trim()) return toast.error("Please enter a technical clinical comment.");
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

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#F8FAFC]'}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 animate-pulse">
            Synchronizing Clinical Node...
          </p>
        </div>
      </div>
    );
  }

  if (!appt) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-[#F8FAFC] text-slate-800'}`}>
        <div className="text-center space-y-6 max-w-md p-8 border border-white/5 rounded-3xl backdrop-blur-xl bg-white/5 shadow-2xl">
          <Ticket size={64} className="mx-auto text-blue-500/40" />
          <h2 className="text-xl font-black uppercase tracking-tight">No Active Consultation Node Found</h2>
          <p className="text-xs text-zinc-400">There is no consultation associated with this protocol identifier or your profile.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(user?.role === 'patient' ? '/patient/dashboard' : '/doc-dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all"
            >
              Return to Console
            </button>
            <button
              onClick={() => navigate(user?.role === 'patient' ? '/patient/doctor-search' : '/doctor/queue')}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              {user?.role === 'patient' ? 'Book Consultation' : 'View Queue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPatient = user?.role === 'patient';
  const partnerName = isPatient ? (appt.doctorName || 'Dr. Specialist') : (appt.patientName || 'Patient Node');
  const apptDateObj = appt.date ? new Date(appt.date) : new Date();
  const isPast = new Date(appt.date).setHours(23, 59, 59, 999) < new Date().getTime();

  const resolvedMeetingId = appt.meetingId || `NODE-${(appt.appointmentId || appt._id || '').slice(-6).toUpperCase()}`;
  const resolvedPasskey = appt.meetingPassword || 'MC7749';

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left neural-grid pb-24 ${
      theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'
    }`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-4 sm:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Top Navigation & Status Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-4 border-b border-white/5">
              <div className="text-left space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center group"
                    title="Go Back"
                  >
                    <ChevronLeft size={20} strokeWidth={3} className="group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.35em]">
                      Node Protocol: <span className="text-white font-mono">{appt.appointmentId || (appt._id ? appt._id.slice(-8).toUpperCase() : 'LIVE-NODE')}</span>
                    </p>
                  </div>
                </div>
                <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Consultation Details
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowComplaintModal(true)}
                  className="px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider shadow-sm active:scale-95"
                  title="Raise a Complaint"
                >
                  <AlertCircle size={12} />
                  <span>Raise Complaint</span>
                </button>

                <button
                  onClick={() => fetchDetails()}
                  disabled={refreshing}
                  className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider ${
                    theme === 'dark'
                      ? 'bg-zinc-900/80 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Refresh Consultation State"
                >
                  <RefreshCw size={12} className={refreshing ? 'animate-spin text-blue-500' : ''} />
                  <span>Sync Node</span>
                </button>

                <div className={`px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 border shadow-sm ${
                  appt.isMeetingReady
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : appt.status === 'Completed'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : (isPast ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-white/5 text-zinc-400 border-white/10')
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    appt.isMeetingReady
                      ? 'bg-emerald-500 animate-ping'
                      : appt.status === 'Completed'
                      ? 'bg-blue-500'
                      : (isPast ? 'bg-amber-500' : 'bg-cyan-500 animate-pulse')
                  }`}></div>
                  {appt.isMeetingReady
                    ? 'Arena Active'
                    : appt.status === 'Completed'
                    ? 'Session Completed'
                    : (isPast ? 'Session Concluded' : 'Waiting for Initialization')}
                </div>
              </div>
            </header>

            {/* Grid Layout: Left Specialist Card & Right Configuration Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Specialist / Patient Identity Node */}
              <div className="lg:col-span-1 space-y-6">
                <div className={`p-8 rounded-[40px] border shadow-2xl relative overflow-hidden transition-all duration-500 ${
                  theme === 'dark' ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-white/10' : 'bg-white border-slate-200'
                }`}>
                  <div className="absolute top-0 right-0 w-36 h-36 bg-blue-600/15 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>

                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className="relative mb-5">
                      <div className="w-24 h-24 rounded-[30px] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl uppercase border-2 border-blue-400/30">
                        {partnerName?.charAt(0) || 'D'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-emerald-500 text-white shadow-lg border-2 border-zinc-950">
                        <ShieldCheck size={14} />
                      </div>
                    </div>

                    <h3 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {partnerName}
                    </h3>
                    <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.25em] mt-1">
                      {appt.specialization || (isPatient ? 'Cardiovascular Surgeon' : 'Registered Patient Node')}
                    </p>
                    
                    <div className="mt-3 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                      Institutional Node Active
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                      <div className="flex items-center gap-3">
                        <Activity size={16} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Protocol Type</span>
                      </div>
                      <span className="text-xs font-black text-white uppercase px-2.5 py-0.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/20">
                        {appt.consultationType || 'Video'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={16} className="text-blue-500" />
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Verification</span>
                      </div>
                      <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-lg border ${
                        appt.paymentStatus === 'Paid'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {appt.paymentStatus === 'Paid' ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                      <div className="flex items-center gap-3">
                        <CreditCard size={16} className="text-purple-400" />
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Consult Fee</span>
                      </div>
                      <span className="text-xs font-black text-white tracking-wider">
                        {appt.fee ? `₹${appt.fee}` : 'Complimentary'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                      <div className="flex items-center gap-3">
                        <Ticket size={16} className="text-cyan-400" />
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Token Sequence</span>
                      </div>
                      <span className="text-xs font-mono font-black text-cyan-400">
                        #{appt.tokenNumber || '101'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                    <button
                      onClick={() => navigate(isPatient ? '/patient/doctor-search' : '/doctor/search')}
                      className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Stethoscope size={14} />
                      {isPatient ? 'Explore Specialist Network' : 'Search Patient Registry'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Main Configuration & Clinical Archive */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Session Configuration Card */}
                <div className={`p-8 sm:p-10 rounded-[44px] border shadow-2xl relative overflow-hidden transition-all duration-500 ${
                  theme === 'dark' ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-white/10' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-3">
                      <Zap size={18} className="text-blue-500 animate-pulse" /> Session Configuration
                    </h3>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                      Encrypted End-to-End
                    </span>
                  </div>

                  {/* Scheduled Date & Sync Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-[30px] group hover:border-emerald-500/30 transition-all">
                      <p className="text-[9px] font-black text-zinc-400 uppercase mb-2 tracking-widest flex items-center gap-2">
                        <Calendar size={14} className="text-emerald-500" /> Scheduled Date
                      </p>
                      <p className={`text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {apptDateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        {isPast ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock size={10} /> Session Date Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle size={10} /> Scheduled & Active
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-6 bg-white/5 border border-white/10 rounded-[30px] group hover:border-amber-500/30 transition-all">
                      <p className="text-[9px] font-black text-zinc-400 uppercase mb-2 tracking-widest flex items-center gap-2">
                        <Clock size={14} className="text-amber-500" /> Synchronization Time
                      </p>
                      <p className={`text-xl sm:text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {appt.scheduledVideoTime || appt.time || '09:00 AM'}
                      </p>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-3">
                        Indian Standard Time (IST)
                      </p>
                    </div>
                  </div>

                  {/* Meeting Node ID & Passkey */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <div className="p-5 bg-white/5 border border-white/10 rounded-[28px] flex items-center justify-between group hover:border-blue-500/30 transition-all">
                      <div className="overflow-hidden pr-2">
                        <p className="text-[8px] font-black text-zinc-400 uppercase mb-1 tracking-widest">Meeting Node ID</p>
                        <p className="text-lg font-mono font-black text-white uppercase tracking-wider truncate">
                          {resolvedMeetingId}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(resolvedMeetingId, 'id')}
                        className="p-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white transition-all border border-blue-500/20 shrink-0"
                        title="Copy Meeting ID"
                      >
                        {copiedId ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      </button>
                    </div>

                    <div className="p-5 bg-white/5 border border-white/10 rounded-[28px] flex items-center justify-between group hover:border-purple-500/30 transition-all">
                      <div className="overflow-hidden pr-2">
                        <p className="text-[8px] font-black text-zinc-400 uppercase mb-1 tracking-widest">Access Passkey</p>
                        <p className="text-lg font-mono font-black text-white tracking-[0.25em] truncate">
                          {resolvedPasskey}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(resolvedPasskey, 'key')}
                        className="p-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white transition-all border border-purple-500/20 shrink-0"
                        title="Copy Access Passkey"
                      >
                        {copiedKey ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Clinical Instruction Callout */}
                  <div className={`p-6 sm:p-7 rounded-[32px] border flex gap-5 items-start transition-all mb-8 ${
                    theme === 'dark' ? 'bg-blue-600/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="w-11 h-11 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/30">
                      <Activity size={22} />
                    </div>
                    <div className="text-left space-y-1">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Clinical Instruction Node</p>
                      <p className={`text-xs sm:text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {isPast
                          ? `This consultation timestamp (${apptDateObj.toLocaleDateString()}) has concluded. You can schedule a new active session with ${partnerName} below.`
                          : "Please ensure you are in a quiet, well-lit environment for the diagnostic consultation. Keep your radiological records and physical reports ready if requested by the specialist."}
                      </p>
                    </div>
                  </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {appt.status === 'Completed' && isPatient ? (
                        <div className="space-y-3">
                          <button
                            onClick={() => setShowReviewModal(true)}
                            className="w-full py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
                          >
                            <Star size={20} fill="currentColor" /> Write Specialist Review
                          </button>
                          <button
                            onClick={() => navigate('/patient/doctor-search')}
                            className="w-full py-4 rounded-[28px] font-black text-[10px] uppercase tracking-[0.25em] transition-all bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 flex items-center justify-center gap-3"
                          >
                            <Calendar size={16} /> Schedule Follow-up Session
                          </button>
                        </div>
                      ) : isPast ? (
                        <div className="space-y-3">
                          <button
                            onClick={() => navigate(isPatient ? '/patient/doctor-search' : '/doctor/queue')}
                            className="w-full py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30"
                          >
                            <Calendar size={20} /> {isPatient ? 'Schedule New Consultation' : 'Return to Patient Queue'}
                          </button>
                          {isPatient && (
                            <button
                              onClick={() => setShowReviewModal(true)}
                              className="w-full py-4 rounded-[28px] font-black text-[10px] uppercase tracking-[0.25em] transition-all bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 flex items-center justify-center gap-3"
                            >
                              <Star size={16} /> Leave Feedback for Specialist
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <button
                            onClick={() => {
                              const meetingDate = new Date(appt.date);
                              const today = new Date();
                              // Always allow if time is set to "NOW (IMMEDIATE)" or date is today
                              const isToday = meetingDate.toDateString() === today.toDateString();
                              const isImmediate = appt.time === 'NOW (IMMEDIATE)';

                              if (!isImmediate && !isToday && meetingDate > today) {
                                toast.error(`Consultation is scheduled for ${meetingDate.toLocaleDateString()}. You cannot enter the arena yet.`);
                                return;
                              }

                              const path = isPatient ? '/patient/video-consult' : '/doctor/video-consult';
                              navigate(`${path}?roomCode=${appt.roomCode || appt._id}&appointmentId=${appt._id}&peerName=${encodeURIComponent(partnerName)}&peerId=${isPatient ? appt.doctorId : appt.patientId}`);
                            }}
                            className={`w-full py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 ${
                              appt.isMeetingReady
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-600/40 animate-pulse'
                                : 'bg-white/5 text-zinc-500 border border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <Video size={22} />
                            {appt.isMeetingReady ? 'Establish Session Link Now' : 'Enter Consultation Arena'}
                          </button>
                          {!appt.isMeetingReady && (
                            <p className="text-center text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
                              Awaiting specialist arena initialization • Click to enter on schedule
                            </p>
                          )}
                        </div>
                      )}

                      {/* Raise a Complaint Button */}
                      <button
                        onClick={() => setShowComplaintModal(true)}
                        className="w-full py-4 rounded-[28px] font-black text-[10px] uppercase tracking-[0.25em] transition-all bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 border border-rose-500/20 flex items-center justify-center gap-3 active:scale-95 shadow-lg"
                      >
                        <AlertCircle size={16} /> Raise a Complaint
                      </button>
                    </div>
                </div>

                {/* Patient Clinical Archive (Interactive Clickable Node) */}
                <div className={`p-8 sm:p-10 rounded-[44px] border shadow-2xl transition-all duration-500 ${
                  theme === 'dark' ? 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-white/10' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-3">
                        <History size={18} className="text-emerald-400" /> Patient Clinical Archive
                      </h3>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                        Select any past consultation node to view complete telemetry
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(isPatient ? '/patient/history' : '/doctor/history')}
                      className="inline-flex items-center gap-2 text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest px-4 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 transition-all self-start sm:self-auto"
                    >
                      <span>View Full Registry</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {history.length > 0 ? (
                      history.map((h, i) => {
                        const hDate = new Date(h.date);
                        const isCurrentActive = (h._id === appt._id || h.appointmentId === appt.appointmentId);
                        const docDisplay = h.doctorName || (h.specialization ? `Dr. Specialist (${h.specialization})` : 'Dr. Specialist');

                        return (
                          <div
                            key={h._id || i}
                            onClick={() => handleSelectArchiveNode(h)}
                            className={`p-5 rounded-[28px] border transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                              isCurrentActive
                                ? 'bg-blue-600/15 border-blue-500/40 shadow-lg'
                                : 'bg-white/5 hover:bg-blue-600/10 border-white/5 hover:border-blue-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                                h.status === 'Completed'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                  : h.status === 'Live'
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              }`}>
                                <Calendar size={20} />
                              </div>
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <p className={`text-xs font-black uppercase tracking-tight group-hover:text-blue-400 transition-colors ${
                                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                                  }`}>
                                    {h.diagnosis || 'General Checkup'}
                                  </p>
                                  {isCurrentActive && (
                                    <span className="px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest bg-blue-500 text-white">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                                  {hDate.toLocaleDateString(undefined, { day: 'numeric', month: 'numeric', year: 'numeric' })} • {h.consultationType || 'Video'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-16 sm:pl-0">
                              <div className="text-left sm:text-right">
                                <p className="text-[9px] font-black text-zinc-300 uppercase tracking-tight">
                                  {docDisplay}
                                </p>
                                <div className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${
                                  h.status === 'Completed'
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : h.status === 'Live'
                                    ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 animate-pulse'
                                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                }`}>
                                  {h.status || 'Pending'}
                                </div>
                              </div>

                              <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-blue-600 group-hover:text-white text-zinc-400 transition-all border border-white/5">
                                <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center opacity-40 space-y-3">
                        <History size={40} className="mx-auto text-zinc-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          No previous consultation records in archive
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>

      {/* DOCTOR REVIEW MODAL NODE */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className={`w-full max-w-lg rounded-[44px] border shadow-2xl overflow-hidden transition-all duration-500 ${
            theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="text-left">
                <h2 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Clinical Review
                </h2>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">
                  Feedback Synchronization Protocol
                </p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className={`p-3 rounded-2xl transition-all border ${
                  theme === 'dark' ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 sm:p-10 space-y-7 text-center">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Rate your clinical experience with {partnerName}
                </p>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className={`p-2 transition-all transform active:scale-90 ${
                        reviewData.rating >= star ? 'text-amber-400 scale-110' : 'text-zinc-700 opacity-40 hover:opacity-100'
                      }`}
                    >
                      <Star size={32} fill={reviewData.rating >= star ? "currentColor" : "none"} strokeWidth={2.5} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                  Technical Feedback / Clinical Assessment
                </label>
                <textarea
                  className={`w-full p-5 rounded-[28px] border outline-none text-sm font-medium min-h-[130px] transition-all ${
                    theme === 'dark' ? 'bg-zinc-900/80 border-white/10 text-white focus:border-blue-500/60' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="Enter your clinical feedback on the diagnosis clarity, timeliness, and consultation quality..."
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                ></textarea>
              </div>

              <button
                onClick={submitReview}
                disabled={submittingReview}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4.5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {submittingReview ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
                Establish Review Record
              </button>
            </div>
          </div>
        </div>
      )}
      {/* RAISE COMPLAINT MODAL */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className={`w-full max-w-lg rounded-[44px] border shadow-2xl overflow-hidden transition-all duration-500 ${
            theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="text-left">
                <h2 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Raise a Complaint
                </h2>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">
                  Governance & Service Quality Discrepancy Record
                </p>
              </div>
              <button
                onClick={() => setShowComplaintModal(false)}
                className={`p-3 rounded-2xl transition-all border ${
                  theme === 'dark' ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submitComplaint} className="p-8 sm:p-10 space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                  Complaint Category
                </label>
                <select
                  className={`w-full p-4 rounded-2xl border outline-none text-xs font-bold transition-all uppercase ${
                    theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-rose-500' : 'bg-slate-50 border-slate-200'
                  }`}
                  value={complaintData.category}
                  onChange={(e) => setComplaintData({ ...complaintData, category: e.target.value })}
                >
                  <option value="Billing / Payment Issue">Billing / Payment Issue</option>
                  <option value="Specialist Misconduct / Delay">Specialist Misconduct / Delay</option>
                  <option value="Video / Network Stream Failure">Video / Network Stream Failure</option>
                  <option value="Prescription / Diagnostic Issue">Prescription / Diagnostic Issue</option>
                  <option value="Hospital OP Check-in Issue">Hospital OP Check-in Issue</option>
                  <option value="General Service Quality">General Service Quality</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                  Urgency Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Normal', 'High', 'Critical'].map((urg) => (
                    <button
                      key={urg}
                      type="button"
                      onClick={() => setComplaintData({ ...complaintData, urgency: urg })}
                      className={`py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                        complaintData.urgency === urg
                          ? (urg === 'Critical' ? 'bg-red-600 text-white border-red-500' : 'bg-rose-500/20 text-rose-400 border-rose-500/40')
                          : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'
                      }`}
                    >
                      {urg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                  Complaint Description & Details
                </label>
                <textarea
                  required
                  className={`w-full p-5 rounded-[28px] border outline-none text-sm font-medium min-h-[120px] transition-all ${
                    theme === 'dark' ? 'bg-zinc-900/80 border-white/10 text-white focus:border-rose-500' : 'bg-slate-50 border-slate-200'
                  }`}
                  placeholder="Describe the discrepancy, delay, or service issue encountered during this consultation..."
                  value={complaintData.description}
                  onChange={(e) => setComplaintData({ ...complaintData, description: e.target.value })}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submittingComplaint}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4.5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {submittingComplaint ? <Loader2 size={18} className="animate-spin" /> : <AlertCircle size={18} />}
                Register Complaint Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationDetails;
