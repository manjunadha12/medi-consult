import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Activity, Pill, MessageSquare, MessageCircle,
  FileText, Video, User as UserIcon, Calculator,
  Clock, Heart, Shield, Users, Stethoscope, Ticket, CreditCard, Layout, Clipboard,
  MoreHorizontal, X, Sparkles, Settings, Brain, FileUp, Monitor, History as HistoryIcon, Search as SearchIcon, ShieldCheck, ClipboardList, Zap, Lock
} from 'lucide-react';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const NeuralDock = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, theme } = useStore();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [latestAppt, setLatestAppt] = useState(null);

  useEffect(() => {
    if (user && (user.role === 'patient' || user.role === 'doctor')) {
      fetchLatestAppointment();
    }
  }, [user, location.pathname]);

  const fetchLatestAppointment = async () => {
    try {
      const endpoint = user.role === 'patient' ? '/appointments/patient-summary' : '/appointments/doctor-queue';
      const res = await api.get(endpoint);
      const appointments = user.role === 'patient' ? res.data.appointments : res.data;
      if (Array.isArray(appointments) && appointments.length > 0) {
        // Find first active/upcoming
        const active = appointments.find(a => ['Accepted', 'Live', 'Pending'].includes(a.status));
        setLatestAppt(active || appointments[0]);
      }
    } catch (err) {
      console.error("[DOCK_SYNC_FAIL]", err);
    }
  };

  const menuItems = {
    patient: [
      { label: 'Home', icon: Home, path: '/patient/dashboard', color: 'bg-blue-500' },
      { label: 'Appointment Node', icon: Ticket, path: '/patient/consultation-details', color: 'bg-emerald-600', isInfo: true },
      { label: 'AI Analysis', icon: Brain, path: '/patient/ai-analysis', color: 'bg-purple-600' },
      { label: 'Supplements', icon: Pill, path: '/patient/medicine-search', color: 'bg-emerald-500' },
      { label: 'AI Chat', icon: MessageSquare, path: '/patient/ai-chat', color: 'bg-indigo-600' },
      { label: 'Neural Messages', icon: MessageCircle, path: '/patient/chat', color: 'bg-blue-600' },
      { label: 'Specialist Search', icon: SearchIcon, path: '/patient/doctor-search', color: 'bg-teal-500' },
      { label: 'Reports', icon: FileText, path: '/patient/reports/upload', color: 'bg-blue-600' },
      { label: 'Consult', icon: Video, path: '/patient/video-consult', color: 'bg-cyan-500' },
      { label: 'Cost', icon: Calculator, path: '/patient/cost-estimator', color: 'bg-amber-500' },
      { label: 'Tracker', icon: Clock, path: '/patient/medicine', color: 'bg-rose-500' },
      { label: 'Vitals', icon: Activity, path: '/patient/health', color: 'bg-blue-400' },
      { label: 'Prescriptions', icon: Clipboard, path: '/patient/prescriptions', color: 'bg-indigo-500' },
      { label: 'Registry', icon: HistoryIcon, path: '/patient/history', color: 'bg-slate-600' },
    ],
    doctor: [
      { label: 'Dashboard', icon: Layout, path: '/doc-dashboard', color: 'bg-blue-500' },
      { label: 'Clinical Node', icon: Ticket, path: '/doctor/consultation-details', color: 'bg-emerald-600', isInfo: true },
      { label: 'Patient Queue', icon: Clock, path: '/doctor/queue', color: 'bg-amber-500' },
      { label: 'Video Consult', icon: Video, path: '/doctor/video-consult', color: 'bg-cyan-500' },
      { label: 'AI Swarm', icon: Brain, path: '/doctor/ai-report', color: 'bg-purple-600' },
      { label: 'AI Chat', icon: MessageSquare, path: '/doctor/ai-chat', color: 'bg-indigo-600' },
      { label: 'Neural Messages', icon: MessageCircle, path: '/doctor/chat', color: 'bg-blue-600' },
      { label: 'Rx Write', icon: FileUp, path: '/doctor/prescription', color: 'bg-indigo-600' },
      { label: 'History', icon: HistoryIcon, path: '/doctor/history', color: 'bg-slate-600' },
      { label: 'Rx List', icon: Clipboard, path: '/doctor/prescriptions', color: 'bg-blue-600' },
      { label: 'Referrals', icon: Users, path: '/doctor/referral', color: 'bg-rose-500' },
    ],
    admin: [
      { label: 'Dashboard', icon: Home, path: '/admin-dashboard', color: 'bg-blue-500' },
      { label: 'Specialist Approvals', icon: ShieldCheck, path: '/admin/approvals', color: 'bg-emerald-600' },
      { label: 'Doctor Security', icon: Stethoscope, path: '/admin/doctors', color: 'bg-teal-600' },
      { label: 'Patient Security', icon: Users, path: '/admin/patients', color: 'bg-indigo-600' },
      { label: 'OP Tokens', icon: Clock, path: '/admin/op-tokens', color: 'bg-amber-500' },
      { label: 'Departments', icon: Layout, path: '/admin/departments', color: 'bg-indigo-500' },
      { label: 'AI Monitor', icon: Monitor, path: '/admin/ai-monitoring', color: 'bg-purple-600' },
      { label: 'Billing', icon: CreditCard, path: '/admin/billing', color: 'bg-rose-500' },
      { label: 'Governance', icon: Shield, path: '/admin/profile-governance', color: 'bg-emerald-600' },
      { label: 'Audit Logs', icon: FileText, path: '/admin/audit-logs', color: 'bg-slate-600' },
    ]
  };

  const roleItems = (user && menuItems[user.role]) ? menuItems[user.role] : menuItems.patient;

  const getScale = (index) => {
    if (window.innerWidth < 640) return 1; // Disable magnification on mobile for better usability
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return 1.5;
    if (distance === 1) return 1.25;
    if (distance === 2) return 1.1;
    return 1;
  };

  const getMargin = (index) => {
    if (window.innerWidth < 640) return '2px';
    if (hoveredIndex === null) return '4px';
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return '12px';
    if (distance === 1) return '8px';
    return '4px';
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[2000] print:hidden w-fit max-w-[95%] sm:max-w-none">
      <div className={`flex items-end gap-1 px-3 sm:px-4 py-3 sm:py-4 backdrop-blur-3xl border rounded-[32px] sm:rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] scrollbar-hide ${
        theme === 'dark' ? 'bg-zinc-950/90 border-white/10' : 'bg-white/90 border-slate-200 shadow-slate-300/50'
      } ${hoveredIndex !== null ? 'overflow-visible' : 'overflow-x-auto'}`}>
        {roleItems.map((item, i) => {
          const isActive = location.pathname === item.path;
          const scale = getScale(i);
          const margin = getMargin(i);
          const baseWidth = window.innerWidth < 640 ? 38 : 44;
          const baseHeight = window.innerWidth < 640 ? 48 : 56;

          return (
            <div
              key={i}
              className="relative flex flex-col items-center shrink-0 transition-all duration-300 ease-out"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => navigate(item.path)}
              style={{
                width: `${baseWidth * scale}px`,
                marginLeft: margin,
                marginRight: margin,
                cursor: 'pointer'
              }}
            >
              {/* Tooltip or Info Overlay */}
              <AnimatePresence>
                {hoveredIndex === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                    exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
                    className={`absolute bottom-full left-1/2 mb-6 z-[2100] ${item.isInfo && latestAppt ? 'w-[400px]' : 'w-auto'}`}
                  >
                    {item.isInfo && latestAppt ? (
                      <div className={`p-8 rounded-[40px] border shadow-[0_32px_80px_rgba(0,0,0,0.7)] backdrop-blur-3xl text-left space-y-6 relative overflow-hidden ${theme === 'dark' ? 'bg-zinc-950 border-emerald-500/20' : 'bg-white border-emerald-100 shadow-emerald-100/50'}`}>
                         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                         <div className="flex justify-between items-start relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                               <Ticket size={28} />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                               <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${latestAppt.isMeetingReady ? 'bg-blue-600 text-white animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-white/5 text-zinc-500 border border-white/10'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${latestAppt.isMeetingReady ? 'bg-white' : 'bg-zinc-600'}`}></div>
                                  {latestAppt.isMeetingReady ? 'ARENA ACTIVE' : 'AWAITING NODE'}
                               </div>
                               <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Diagnostic Node: {latestAppt._id.slice(-8).toUpperCase()}</p>
                            </div>
                         </div>

                         <div className="space-y-1 relative z-10">
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em]">Authorized Session Operator</p>
                            <h4 className={`text-2xl font-black uppercase tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                               {user.role === 'patient' ? latestAppt.doctorName : latestAppt.patientName}
                            </h4>
                            <p className="text-blue-500 text-[11px] font-black uppercase tracking-[0.4em] pt-1">
                               {latestAppt.specialization || 'Clinical Synthesis Review'}
                            </p>
                         </div>

                         <div className="grid grid-cols-2 gap-4 pt-2 relative z-10">
                            <div className="p-4 bg-white/5 border border-white/5 rounded-3xl group hover:border-emerald-500/20 transition-all">
                               <p className="text-[7px] font-black text-zinc-500 uppercase mb-1.5 tracking-widest flex items-center gap-2">
                                  <Clock size={10} className="text-amber-500"/> Sync Time
                               </p>
                               <p className="text-base font-black text-white tracking-tight">{latestAppt.scheduledVideoTime || latestAppt.time}</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/5 rounded-3xl group hover:border-blue-500/20 transition-all">
                               <p className="text-[7px] font-black text-zinc-500 uppercase mb-1.5 tracking-widest flex items-center gap-2">
                                  <Shield size={10} className="text-blue-500"/> Node ID
                               </p>
                               <p className="text-base font-black text-white tracking-tight uppercase truncate">{latestAppt.meetingId || 'PENDING'}</p>
                            </div>
                         </div>

                         {latestAppt.meetingPassword && (
                           <div className="p-4 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between group hover:border-purple-500/20 transition-all relative z-10">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                                    <Lock size={14}/>
                                 </div>
                                 <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Access Passkey</span>
                              </div>
                              <span className="text-base font-black text-white tracking-[0.3em]">{latestAppt.meetingPassword}</span>
                           </div>
                         )}

                         <button
                            onClick={() => {
                               const path = user.role === 'patient' ? '/patient/video-consult' : '/doctor/video-consult';
                               navigate(`${path}?roomCode=${latestAppt._id}&appointmentId=${latestAppt._id}&peerName=${user.role === 'patient' ? latestAppt.doctorName : latestAppt.patientName}&peerId=${user.role === 'patient' ? latestAppt.doctorId : latestAppt.patientId}`);
                            }}
                            className={`w-full py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 ${latestAppt.isMeetingReady ? 'bg-blue-600 text-white shadow-blue-600/40 hover:bg-blue-500' : 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed grayscale'}`}
                         >
                            <Video size={18} /> Join Clinical Arena
                         </button>
                      </div>
                    ) : (
                      <div className={`px-3 py-1.5 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap pointer-events-none transition-all duration-300`}>
                        {item.label}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon Container */}
              <div
                className={`w-full rounded-[18px] sm:rounded-[24px] flex items-center justify-center transition-all duration-300 relative overflow-hidden border ${
                  isActive
                    ? 'border-blue-400 bg-blue-500/20 shadow-[0_0_25px_rgba(37,99,235,0.4)]'
                    : 'border-white/5 bg-white/5 hover:border-white/20'
                }`}
                style={{
                  height: `${baseHeight * scale}px`,
                }}
              >
                {/* Background Color Overlay */}
                <div className={`absolute inset-0 ${item.color} transition-opacity duration-300 ${isActive ? 'opacity-40' : 'opacity-10 group-hover:opacity-30'}`}></div>

                {/* Icon */}
                <item.icon
                  size={window.innerWidth < 640 ? 18 : 20}
                  className={`relative z-10 transition-all duration-300 ${isActive ? 'text-white' : 'text-zinc-400'}`}
                  style={{ transform: `scale(${scale * 0.9})` }}
                />

                {/* Active Indicator Dot */}
                {isActive && (
                  <div className="absolute bottom-1.5 sm:bottom-2 w-1 sm:h-1.5 h-1 sm:w-1.5 rounded-full bg-white shadow-[0_0_12px_#fff]"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NeuralDock;
