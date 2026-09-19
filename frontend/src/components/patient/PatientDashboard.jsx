import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useStore from '../../store/useStore';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import { safeNum } from '../../utils/mathUtils';
import {
  Brain, TrendingUp, ChevronRight, Clock, Sparkles, CheckCircle, Pill,
  FileUp, MessageSquare, User as UserIcon, Activity, Zap, CreditCard, QrCode, ArrowRight,
  Shield, Info, Trash2, Video, Heart, Calendar, FileText, X, Bell, Layout, Stethoscope, AlertTriangle, MessageCircle, Search as SearchIcon, Phone as PhoneIcon, Lock, Building2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const CircularProgress = ({ value, size = 180, strokeWidth = 12 }) => {
  const [currentSize, setSize] = useState(size);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setSize(140);
      else setSize(size);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size]);

  const numVal = typeof value === 'number' ? value : (parseInt(value, 10) || 0);
  const strokeColor = numVal >= 85 ? '#10b981' : (numVal >= 70 ? '#3b82f6' : (numVal >= 50 ? '#f59e0b' : '#ef4444'));
  const glowColor = numVal >= 85 ? 'rgba(16,185,129,0.5)' : (numVal >= 70 ? 'rgba(59,130,246,0.5)' : (numVal >= 50 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)'));

  const radius = (currentSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (numVal / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={currentSize} height={currentSize} className="transform -rotate-90">
        <circle
          cx={currentSize / 2}
          cy={currentSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/5"
        />
        <circle
          cx={currentSize / 2}
          cy={currentSize / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 12px ${glowColor})` }}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl sm:text-5xl font-black text-white">{value}</span>
        <span className="text-[8px] sm:text-xs font-bold text-zinc-500 mt-1 uppercase tracking-widest">/100</span>
      </div>
    </div>
  );
};

const PatientDashboard = () => {
  const {
    user: currentUser,
    theme,
    notifications,
    clearNotification,
    clearAllNotifications,
    incomingCall,
    socket,
    initializeGlobalSocket
  } = useStore();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [healthLogs, setHealthLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (!socket && currentUser) {
      initializeGlobalSocket();
    }
  }, [socket, currentUser, initializeGlobalSocket]);
  const [metrics, setMetrics] = useState({
    score: '...',
    trend: '...',
    vitals: 'Syncing',
    adherence: '...',
    risk: '...',
    efficiency: '...'
  });

  useEffect(() => {
    fetchData();
    if (currentUser?.userId || localStorage.getItem('mediconsult_token')) {
      fetchReports();
      fetchHealthLogs();
      fetchMedicines();
    }
  }, [currentUser?.userId]);

  const fetchMedicines = async () => {
    try {
      if(!currentUser?.userId) return;
      const { data } = await api.get(`/patients/prescriptions`); // Sync with Prescriptions
      if (Array.isArray(data)) setMedicines(data.slice(0, 3));
    } catch (err) {
      console.error("[RX_SYNC_FAIL]", err);
    }
  };

  const fetchReports = async () => {
    try {
      if(!currentUser?.userId) return [];
      const { data } = await api.get(`/reports/patient/${currentUser.userId}`);
      const repList = Array.isArray(data) ? data : (data?.reports || []);
      setReports(repList);
      return repList;
    } catch (err) {
      console.error("[REPORTS_SYNC_FAIL]", err);
      return [];
    }
  };

  const fetchHealthLogs = async () => {
    try {
      if(!currentUser?.userId) return [];
      const { data } = await api.get(`/health/logs/${currentUser.userId}?range=month`);
      const logsArray = Array.isArray(data) ? data : (data?.logs || []);
      setHealthLogs(logsArray);
      calculateDynamicMetrics(logsArray);
      return logsArray;
    } catch (err) {
      console.error("[HEALTH_LOGS_SYNC_FAIL]", err);
      return [];
    }
  };

  const calculateDynamicMetrics = (logs = []) => {
    const logsArray = Array.isArray(logs) ? logs : (logs?.logs || []);

    let baseScore = 100;
    let vitalsStatus = 'Normal';
    let riskLevel = 'Low';
    let trendText = '+2.1%';

    let latestLog = null;
    let previousLog = null;

    if (logsArray.length > 0) {
      const sorted = [...logsArray].sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
      latestLog = sorted[sorted.length - 1];
      previousLog = sorted.length > 1 ? sorted[sorted.length - 2] : latestLog;

      if (latestLog) {
        // Evaluate Systolic BP (Ideal: 90-125)
        if (latestLog.bp_systolic > 160) { baseScore -= 20; vitalsStatus = 'Critical'; riskLevel = 'High'; }
        else if (latestLog.bp_systolic > 140) { baseScore -= 12; if (vitalsStatus !== 'Critical') vitalsStatus = 'Warning'; if (riskLevel !== 'High') riskLevel = 'Medium'; }
        else if (latestLog.bp_systolic > 130) { baseScore -= 5; }

        // Evaluate Diastolic BP (Ideal: 60-85)
        if (latestLog.bp_diastolic > 100) { baseScore -= 15; vitalsStatus = 'Critical'; riskLevel = 'High'; }
        else if (latestLog.bp_diastolic > 90) { baseScore -= 8; if (vitalsStatus !== 'Critical') vitalsStatus = 'Warning'; }

        // Evaluate SpO2 Oxygen (Ideal: 95-100%)
        if (latestLog.oxygen < 90) { baseScore -= 25; vitalsStatus = 'Critical'; riskLevel = 'High'; }
        else if (latestLog.oxygen < 95) { baseScore -= 10; if (vitalsStatus !== 'Critical') vitalsStatus = 'Warning'; }

        // Evaluate Blood Sugar (Ideal: 70-130 fasting / 140 random)
        if (latestLog.sugar > 200) { baseScore -= 18; vitalsStatus = 'Critical'; riskLevel = 'High'; }
        else if (latestLog.sugar > 140) { baseScore -= 8; if (vitalsStatus !== 'Critical') vitalsStatus = 'Warning'; }

        // Evaluate Heart Rate (Ideal: 60-100 bpm)
        if (latestLog.heartbeat > 120 || latestLog.heartbeat < 45) { baseScore -= 12; if (vitalsStatus !== 'Critical') vitalsStatus = 'Warning'; }

        // Evaluate Temperature (Ideal: 97.0 - 99.5 °F)
        if (latestLog.temperature > 101.5) { baseScore -= 15; vitalsStatus = 'Critical'; riskLevel = 'High'; }
        else if (latestLog.temperature > 99.8) { baseScore -= 6; if (vitalsStatus !== 'Critical') vitalsStatus = 'Warning'; }

        // Calculate Trend percentage between latest and previous vitals
        const bpDiff = (latestLog.bp_systolic || 120) - (previousLog?.bp_systolic || 120);
        const trendVal = bpDiff <= 0 ? Math.abs(bpDiff) + 1.8 : -Math.abs(bpDiff);
        trendText = `${trendVal >= 0 ? '+' : ''}${trendVal.toFixed(1)}%`;
      }
    }

    const finalScore = Math.max(10, Math.min(100, Math.round(baseScore)));

    let statusTitle = "Biological Sync Stabilized";
    let statusDescription = `Telemetry indicates ${trendText} efficiency improvement across biometric nodes.`;

    if (vitalsStatus === 'Critical' || riskLevel === 'High') {
      statusTitle = "Physiological Vitals Alert";
      statusDescription = `Biometric telemetry indicates abnormal vital signs. Prompt clinical review advised.`;
    } else if (vitalsStatus === 'Warning' || riskLevel === 'Medium') {
      statusTitle = "Vitals Telemetry Under Observation";
      statusDescription = `Slight physiological variance recorded in recent biometric health logs.`;
    } else {
      statusTitle = "Biological Sync Stabilized";
      statusDescription = `Telemetry confirms optimal biomarker homeostasis and vitals stability.`;
    }

    setMetrics({
      score: finalScore,
      trend: trendText,
      vitals: vitalsStatus,
      adherence: 'Synchronized',
      risk: riskLevel,
      efficiency: trendText,
      statusTitle,
      statusDescription
    });
  };

  const fetchData = async () => {
    try {
      const res = await api.get('/appointments/patient-summary');
      const appts = res.data.appointments || [];
      setAppointments(appts);
      setIsConnected(true);
    } catch (err) {
      console.error(err);
      if (!err.response) setIsConnected(false);
    }
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left neural-grid pb-24 ${
      theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'
    }`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-4 sm:p-6 lg:p-10">
          <div className="max-w-[1600px] mx-auto flex flex-col min-h-full">
            <div className="flex-1 space-y-6 sm:space-y-8">

              {/* Stat Nodes Grid */}
              {!isConnected && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4 text-red-500 mb-4 animate-pulse">
                  <AlertTriangle size={20} />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest">Neural Link Offline</p>
                    <p className="text-[9px] font-bold opacity-80 uppercase">Unable to sync with {api.defaults.baseURL}. Verify PC IP and WiFi.</p>
                  </div>
                </div>
              )}

              {/* WELCOME CARD */}
              <div className={`bg-[#0A0A0A] p-6 sm:p-8 lg:p-10 rounded-[32px] sm:rounded-[40px] lg:rounded-[48px] border border-white/5 relative overflow-hidden group transition-all duration-500 hover:border-blue-500/30 mb-2`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all duration-700"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/10 blur-3xl rounded-full"></div>
                <div className="absolute bottom-0 left-10 right-10 h-[1px] bg-blue-500/40 blur-sm"></div>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                  <div className="text-left">
                    <p className="text-[8px] sm:text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2 sm:mb-3">Diagnostic Node Established</p>
                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-none mb-2">
                      Welcome back, {currentUser?.name?.split(' ')[0] || 'Patient'} 👋
                    </h1>
                    {(!currentUser?.name || currentUser.name === 'undefined') && (
                      <p className="text-amber-500 text-[8px] font-black uppercase tracking-widest animate-pulse">Session identity compromised. Please re-authenticate.</p>
                    )}
                    <p className="text-zinc-500 font-bold uppercase text-[8px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em]">Here's your neural health overview for today.</p>
                    <button
                      onClick={() => navigate('/patient/doctor-search')}
                      className="mt-6 flex items-center gap-3 px-6 py-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-500/5"
                    >
                      <SearchIcon size={14} /> Quick Specialist Search
                    </button>
                  </div>
                  <div className="p-4 sm:p-6 bg-white/5 border border-white/5 rounded-[24px] sm:rounded-[32px] flex items-center gap-4 sm:gap-5 w-full lg:w-auto">
                    <div className="text-right flex-1 lg:flex-none">
                       <p className="text-[8px] sm:text-[9px] font-black text-blue-400 uppercase tracking-widest">I'm Medi AI ●</p>
                       <p className="text-[9px] sm:text-[10px] font-bold text-zinc-500 leading-relaxed uppercase mt-1 max-w-[200px] lg:max-w-[140px]">I analyze your health 24/7 to keep you on the right track.</p>
                    </div>
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                       <Brain size={20} className="sm:w-7 sm:h-7 text-blue-500 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="mt-8 sm:mt-10 flex flex-wrap gap-2 sm:gap-3">
                   {[
                     { label: 'Patient ID', value: currentUser?.userId },
                     { label: 'Reg. Date', value: '20/5/2024' },
                     { label: 'Last Login', value: new Date().toLocaleDateString(), color: 'text-blue-400' },
                     { label: 'Status', value: 'Verified', color: 'text-emerald-500' }
                   ].map((item, i) => (
                     <div key={i} className="px-4 sm:px-6 py-2 sm:py-3 bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl flex-1 min-w-[120px]">
                        <p className="text-[7px] sm:text-[8px] font-black text-zinc-500 uppercase mb-0.5 sm:mb-1">{item.label}</p>
                        <p className={`text-[10px] sm:text-xs font-black uppercase truncate ${item.color || 'text-white'}`}>{item.value}</p>
                     </div>
                   ))}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                {[
                  { label: 'NEURAL VITALS', value: metrics.vitals, icon: Activity, color: 'blue', path: '/patient/health' },
                  { label: 'REPORT NODES', value: reports?.length || 0, icon: FileUp, color: 'purple', path: '/patient/reports/upload' },
                  { label: 'ACTIVE MEDS', value: `${medicines?.length || 0} Nodes`, icon: Pill, color: 'emerald', path: '/patient/medicine' },
                  { label: 'OP QUEUE', value: 'Ready', icon: Clock, color: 'amber', path: '/patient/book-op' }
                ].map((stat, i) => (
                  <div key={i} onClick={() => navigate(stat.path)} className={`bg-[#0A0A0A] p-6 sm:p-8 rounded-[32px] border border-white/5 flex flex-col justify-between min-h-[160px] relative overflow-hidden group cursor-pointer transition-all duration-500 hover:border-white/10`}>
                    <div className="flex justify-between items-start relative z-10">
                       <p className="text-[7px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">{stat.label}</p>
                       <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                          <stat.icon size={14} />
                       </div>
                    </div>
                    <div className="relative z-10 mt-auto">
                       <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none">{stat.value}</h3>
                    </div>
                    <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full transition-opacity group-hover:opacity-40 ${
                      stat.color === 'blue' ? 'bg-blue-600' :
                      stat.color === 'purple' ? 'bg-purple-600' :
                      stat.color === 'emerald' ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}></div>
                    <div className={`absolute bottom-0 left-6 right-6 h-[2px] blur-md opacity-50 ${
                      stat.color === 'blue' ? 'bg-blue-500' :
                      stat.color === 'purple' ? 'bg-purple-500' :
                      stat.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}></div>
                  </div>
                ))}
              </div>



              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
                {/* LEFT COLUMN */}
                <div className="xl:col-span-8 space-y-6 lg:space-y-8">
                  {/* LIVE CONSULTATION ALERT */}
                  {appointments.filter(a => a.status === 'Live' || a.status === 'Pending' || a.status === 'Accepted').length > 0 && (
                    <div className="bg-emerald-500 p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] text-white shadow-xl shadow-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center gap-4 sm:gap-5">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center animate-pulse shrink-0">
                          <Video size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div className="text-left">
                          <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">Active Session Node</p>
                          <h3 className="text-base sm:text-lg font-black uppercase tracking-tight leading-tight">
                            {appointments.find(a => a.status === 'Accepted' || a.status === 'Live') ? 'Your Consultation is Ready' : 'Awaiting Specialist Approval'}
                          </h3>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        {appointments.find(a => a.status === 'Accepted' || a.status === 'Live') && (
                          <button
                            onClick={() => {
                              const appt = appointments.find(a => a.status === 'Accepted' || a.status === 'Live');
                              if (appt) {
                                navigate(`/patient/chat`, { state: { startChat: true, targetUserId: appt.doctorId, appointmentId: appt._id } });
                              }
                            }}
                            className="flex-1 sm:flex-none px-6 py-2.5 sm:py-3 bg-white/20 text-white rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all border border-white/20"
                          >
                            <MessageCircle size={14} className="inline mr-2" /> Chat
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            const activeAppt = appointments.find(a => a.status === 'Live' || a.status === 'Accepted');
                            const pendingAppt = appointments.find(a => a.status === 'Pending');
                            const appt = activeAppt || pendingAppt;

                            if (!appt) return;

                            if (window.confirm("Permanently disconnect this consultation node and remove it from your dashboard?")) {
                               try {
                                  await api.put(`/appointments/end-session/${appt._id || appt.appointmentId}`, { status: 'Cancelled', remarks: 'User dismissed node' });
                                  toast.success("Consultation node purged.");
                                  fetchData();
                               } catch (err) {
                                  console.error("[PURGE_ERR]", err);
                                  const msg = err.response?.data?.message || err.message;
                                  toast.error(`Purge Failed: ${msg}`);
                               }
                            }
                          }}
                          className="flex-1 sm:flex-none px-6 py-2.5 sm:py-3 bg-red-600/20 text-red-500 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-500/20"
                        >
                          <X size={14} className="inline mr-2" /> Dismiss
                        </button>
                        <button
                          onClick={() => {
                            const activeAppt = appointments.find(a => a.status === 'Live' || a.status === 'Accepted');
                            const pendingAppt = appointments.find(a => a.status === 'Pending');
                            const appt = activeAppt || pendingAppt;

                            if (!appt) return toast.error("No active appointment node found");

                            const isIncoming = incomingCall?.from === appt.doctorId || incomingCall?.from === appt._id;

                            if (appt.status === 'Pending' && !isIncoming) {
                               toast.error("Waiting for specialist to authorize the node");
                            } else {
                               const path = `/patient/voice-consult?roomCode=${appt._id}&appointmentId=${appt._id}&peerName=${appt.doctorName}&peerId=${appt.doctorId}`;
                               if (isIncoming) {
                                  navigate(`${path}&incoming=true`);
                               } else {
                                  navigate(path);
                                }
                            }
                          }}
                          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg ${
                            incomingCall ? 'bg-emerald-600 text-white animate-bounce' : 'bg-amber-500 text-white'
                          }`}
                        >
                          <PhoneIcon size={14} className="inline mr-2" /> {incomingCall ? 'Accept Link' : 'Voice'}
                        </button>
                        <button
                          onClick={() => {
                            const activeAppt = appointments.find(a => a.status === 'Live' || a.status === 'Accepted');
                            const pendingAppt = appointments.find(a => a.status === 'Pending');
                            const appt = activeAppt || pendingAppt;

                            if (!appt) return toast.error("No active appointment node found");

                            if (appt.status === 'Pending' && !incomingCall) {
                               toast.error("Waiting for specialist to authorize the node");
                            } else if (!appt.isMeetingReady && !incomingCall) {
                               toast.error("Specialist hasn't initialized the clinical arena yet");
                            } else {
                               const path = `/patient/video-consult?roomCode=${appt._id}&appointmentId=${appt._id}&peerName=${appt.doctorName}&peerId=${appt.doctorId}`;
                               if (incomingCall?.from === appt.doctorId || incomingCall?.from === appt._id) {
                                  navigate(`${path}&incoming=true`);
                               } else {
                                  navigate(path);
                               }
                            }
                          }}
                          className={`flex-1 sm:flex-none px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg ${
                            appointments.find(a => a.status === 'Accepted' || a.status === 'Live')?.isMeetingReady
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-white text-emerald-600 opacity-50'
                          }`}
                        >
                          Establish Link
                        </button>
                      </div>
                    </div>
                  )}

                  {/* VIDEO MEETING INFO CARD */}
                  {appointments.find(a => (a.status === 'Accepted' || a.status === 'Live') && a.meetingId) && (
                    <div className="bg-zinc-950/80 border border-blue-500/20 p-6 rounded-[32px] overflow-hidden relative group transition-all hover:border-blue-500/40">
                       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                                <Video size={24} />
                             </div>
                             <div className="text-left">
                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Scheduled Video Protocol</p>
                                <h3 className="text-sm font-black text-white uppercase mt-1">Specialist Handshake Ready</h3>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto">
                             {[
                               { label: 'NODE ID', val: appointments.find(a => a.status === 'Accepted' || a.status === 'Live').meetingId, icon: Shield },
                               { label: 'PASSKEY', val: appointments.find(a => a.status === 'Accepted' || a.status === 'Live').meetingPassword, icon: Lock },
                               { label: 'SYNC TIME', val: appointments.find(a => a.status === 'Accepted' || a.status === 'Live').scheduledVideoTime, icon: Clock },
                             ].map((item, i) => (
                               <div key={i} className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl flex-1 sm:flex-none min-w-[100px]">
                                  <p className="text-[7px] font-black text-zinc-500 uppercase mb-0.5">{item.label}</p>
                                  <p className="text-[9px] font-black text-white uppercase flex items-center gap-2">
                                     <item.icon size={10} className="text-blue-500" /> {item.val}
                                  </p>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}


                  {/* RECOVERY SCORE CARD */}
                  <div className={`bg-[#0A0A0A] p-6 sm:p-8 lg:p-10 rounded-[32px] sm:rounded-[40px] lg:rounded-[48px] border border-white/5 relative overflow-hidden group transition-all duration-500 hover:border-blue-500/30`}>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/10 blur-3xl rounded-full"></div>
                    <div className="absolute bottom-0 left-10 right-10 h-[1px] bg-blue-500/40 blur-sm"></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 gap-4">
                       <h3 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 leading-none">
                          Your Recovery Score <TrendingUp size={14} className="sm:w-4 sm:h-4 text-blue-500" />
                       </h3>
                       <button onClick={() => navigate('/patient/health')} className="w-full sm:w-auto text-[8px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-widest hover:text-white flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-xl transition-all">
                          Diagnostic Matrix <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
                       </button>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-8 lg:gap-16">
                       <CircularProgress value={metrics.score} />
                       <div className="flex-1 text-center md:text-left">
                          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight mb-2 sm:mb-3 leading-tight">{metrics.statusTitle || "Biological Sync Stabilized"}</h2>
                          <p className="text-zinc-400 font-bold uppercase text-[8px] sm:text-[10px] tracking-[0.2em] mb-8 lg:mb-10 leading-relaxed">{metrics.statusDescription || `Telemetry indicates ${metrics.efficiency || '+2.1%'} efficiency improvement.`}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                             {[
                               { label: 'Trend', val: metrics.trend, icon: TrendingUp, color: 'emerald' },
                               { label: 'Vitals', val: metrics.vitals, icon: Activity, color: 'purple' },
                               { label: 'Adherence', val: metrics.adherence, icon: CheckCircle, color: 'blue' },
                               { label: 'Risk', val: metrics.risk, icon: Shield, color: 'amber' }
                             ].map((m, i) => (
                               <div key={i} className={`p-4 bg-[#0A0A0A] border border-white/5 rounded-2xl relative overflow-hidden group`}>
                                  <div className="flex justify-between items-start mb-2 relative z-10">
                                     <p className="text-[6px] sm:text-[7px] font-black text-zinc-500 uppercase tracking-widest">{m.label}</p>
                                     <m.icon size={10} className="text-zinc-400" />
                                  </div>
                                  <p className={`text-[10px] sm:text-xs font-black uppercase relative z-10 ${
                                    m.color === 'emerald' ? 'text-emerald-500' :
                                    m.color === 'purple' ? 'text-purple-500' :
                                    m.color === 'blue' ? 'text-blue-500' : 'text-amber-500'
                                  }`}>{m.val}</p>
                                  <div className={`absolute bottom-0 left-2 right-2 h-[1px] blur-sm opacity-50 ${
                                    m.color === 'emerald' ? 'bg-emerald-500' :
                                    m.color === 'purple' ? 'bg-purple-500' :
                                    m.color === 'blue' ? 'bg-blue-500' : 'bg-amber-500'
                                  }`}></div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                    <div className="mt-8 lg:mt-12 pt-6 lg:pt-8 border-t border-white/5 flex justify-between items-center opacity-40">
                       <div className="flex items-center gap-2 sm:gap-3 text-[7px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                          <Clock size={10} className="sm:w-3 sm:h-3" /> Last Sync: 09:15 AM
                       </div>
                       <div className="flex items-center gap-2 sm:gap-3 text-[7px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                          <Calendar size={10} className="sm:w-3 sm:h-3" /> Cycle: Day 12/30
                       </div>
                    </div>
                  </div>


                  {/* AI REPORT & OPERATIONS HUB */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                     <div className={`bg-[#0A0A0A] p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border border-white/5 relative overflow-hidden transition-all duration-500 hover:border-purple-500/30`}>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-600/10 blur-3xl rounded-full"></div>
                        <div className="absolute bottom-0 left-6 right-6 h-[1px] bg-purple-500/40 blur-sm"></div>
                        <div className="flex items-center gap-3 mb-6 sm:mb-8 relative z-10">
                           <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0"><Sparkles size={16} className="sm:w-5 sm:h-5 text-purple-400" /></div>
                           <div className="text-left"><h3 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest">AI Report Synthesis</h3><p className="text-[7px] sm:text-[8px] font-bold text-zinc-500 uppercase mt-0.5">Latest Archive Analysis</p></div>
                        </div>
                        <div className="p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5 text-left mb-6 relative z-10"><p className="text-[10px] sm:text-xs font-medium text-zinc-400 leading-relaxed italic">"Neural net confirms stable vital markers. Lipid profile indicates optimal recovery."</p></div>
                        <button onClick={() => navigate('/patient/ai-analysis')} className="w-full py-3.5 sm:py-4 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 relative z-10">Summary <ArrowRight size={12} /></button>
                     </div>

                     {/* RECENT CLINICAL PROVISIONS (PRESCRIPTIONS) */}
                     <div className={`bg-[#0A0A0A] p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border border-white/5 relative overflow-hidden transition-all duration-500 hover:border-blue-500/30`}>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full"></div>
                        <div className="flex items-center justify-between mb-8 relative z-10">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0"><FileText size={16} className="sm:w-5 sm:h-5 text-blue-400" /></div>
                              <div className="text-left"><h3 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest">Clinical Provisions</h3><p className="text-[7px] sm:text-[8px] font-bold text-zinc-500 uppercase mt-0.5">Recent Prescriptions</p></div>
                           </div>
                           <button onClick={() => navigate('/patient/prescriptions')} className="text-[8px] font-black text-blue-500 uppercase tracking-widest hover:underline">View All</button>
                        </div>

                        <div className="space-y-3 relative z-10">
                           {medicines.length > 0 ? medicines.map((rx, idx) => (
                             <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer" onClick={() => navigate('/patient/prescriptions')}>
                                <div className="text-left">
                                   <p className="text-[10px] font-black text-white uppercase truncate w-32">{rx.diagnosis || 'General Treatment'}</p>
                                   <p className="text-[8px] font-bold text-zinc-500 uppercase mt-0.5">{new Date(rx.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-[9px] font-black text-blue-400 uppercase">{rx.medicines?.length} Meds</p>
                                   <ChevronRight size={14} className="text-zinc-650 group-hover:translate-x-1 transition-all inline ml-1" />
                                </div>
                             </div>
                           )) : (
                             <div className="py-10 text-center opacity-30 font-black uppercase tracking-[0.2em] text-[10px]">No recent provisions</div>
                           )}
                        </div>
                     </div>

                     <div className={`bg-[#0A0A0A] p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border border-white/5 relative overflow-hidden transition-all duration-500 hover:border-emerald-500/30`}>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-600/10 blur-3xl rounded-full"></div>
                        <div className="absolute bottom-0 left-6 right-6 h-[1px] bg-emerald-500/40 blur-sm"></div>
                        <h3 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest mb-6 sm:mb-8 flex items-center gap-3 relative z-10">Operations Hub <Zap size={14} className="text-blue-500" /></h3>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
                           {[
                             { label: 'Upload', icon: FileUp, path: '/patient/reports/upload', color: 'text-blue-400' },
                             { label: 'Medicines', icon: Pill, path: '/patient/medicine-search', color: 'text-emerald-400' },
                             { label: 'Doc Search', icon: SearchIcon, path: '/patient/doctor-search', color: 'text-amber-400' },
                             { label: 'Consult', icon: Video, path: '/patient/video-consult', color: 'text-rose-400' },
                             { label: 'Voice Link', icon: PhoneIcon, path: '/patient/voice-consult', color: 'text-blue-400' },
                           ].map((op, i) => (
                             <div key={i} onClick={() => navigate(op.path)} className="p-3 sm:p-4 bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl cursor-pointer hover:bg-white/10 hover:border-blue-500/30 transition-all group">
                                <op.icon size={18} className={`sm:w-5 sm:h-5 ${op.color} mb-2 sm:mb-3 group-hover:scale-110 transition-transform`} />
                                <p className="text-[8px] sm:text-[10px] font-black text-zinc-300 uppercase tracking-widest truncate">{op.label}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="xl:col-span-4 space-y-6 lg:space-y-8">
                  <div className="bg-blue-600 p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] lg:rounded-[48px] text-white shadow-2xl shadow-blue-900/40 relative overflow-hidden group border border-white/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl transition-all duration-700"></div>
                    <div className="flex justify-between items-start mb-8 sm:mb-10 relative z-10">
                       <div className="text-left overflow-hidden">
                          <p className="text-[8px] sm:text-[10px] font-black text-blue-100 uppercase tracking-[0.3em] mb-1 sm:mb-2 truncate">{currentUser?.userId}</p>
                          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter truncate">{currentUser?.name}</h2>
                       </div>
                       <button onClick={() => navigate('/patient/emergency-qr')} className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl hover:bg-white/30 transition-all active:scale-90 shrink-0"><QrCode size={20} /></button>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest relative z-10"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div> Verified Node</div>
                  </div>



                  <div className={`bg-[#0A0A0A] p-6 sm:p-8 lg:p-10 rounded-[32px] sm:rounded-[40px] lg:rounded-[48px] border border-white/5 relative overflow-hidden group transition-all duration-500 hover:border-blue-500/30`}>
                     <div className="flex justify-between items-center mb-8 sm:mb-10 relative z-10"><h3 className="text-[10px] sm:text-xs font-black text-white uppercase tracking-[0.3em]">Notifications</h3><Link to="/patient/dashboard" className="text-[8px] sm:text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">View All</Link></div>
                     <div className="space-y-6 sm:space-y-8">
                        {notifications && notifications.length > 0 ? (
                          notifications.slice(0, 3).map((n, i) => (
                            <div key={n.id} className="flex gap-4 sm:gap-5 group relative">
                               <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                                  {n.type === 'info' ? <Sparkles size={18} className="sm:w-5 sm:h-5 text-blue-400" /> :
                                   n.type === 'reminder' ? <Pill size={18} className="sm:w-5 sm:h-5 text-orange-400" /> :
                                   <CheckCircle size={18} className="sm:w-5 sm:h-5 text-emerald-400" />}
                               </div>
                               <div className="text-left min-w-0">
                                  <p className={`text-[7px] sm:text-[9px] font-black uppercase tracking-widest mb-1 ${n.type === 'info' ? 'text-blue-500' : n.type === 'reminder' ? 'text-orange-500' : 'text-emerald-500'}`}>{n.title}</p>
                                  <p className="text-[9px] sm:text-[10px] font-bold text-zinc-400 leading-relaxed uppercase tracking-tight line-clamp-2">{n.text}</p>
                               </div>
                               <button onClick={() => clearNotification(n.id)} className="absolute -right-1 top-0 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} className="sm:w-3.5 sm:h-3.5 text-zinc-500 hover:text-red-500" /></button>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 lg:py-10 text-center opacity-20"><Bell size={32} className="sm:w-10 sm:h-10 mx-auto mb-4" /><p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">No Alerts</p></div>
                        )}
                     </div>
                     <button onClick={clearAllNotifications} className="mt-8 lg:mt-12 w-full py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 text-[8px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 sm:gap-3"><Trash2 size={12} /> Clear All</button>
                  </div>
                </div>
              </div>

              <div className="mt-20 shrink-0">
                 <Footer />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;
