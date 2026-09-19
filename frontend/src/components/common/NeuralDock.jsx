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
      { label: 'Rx Writer', icon: FileUp, path: '/doctor/prescription', color: 'bg-emerald-500' },
      { label: 'History', icon: HistoryIcon, path: '/doctor/history', color: 'bg-slate-600' },
      { label: 'Rx List', icon: Clipboard, path: '/doctor/prescriptions', color: 'bg-indigo-500' },
      { label: 'Referrals', icon: Users, path: '/doctor/referral', color: 'bg-teal-500' },
      { label: 'Doctor Network', icon: Users, path: '/doctor/network', color: 'bg-sky-500' },
    ],
    admin: [
      { label: 'Dashboard', icon: Layout, path: '/admin-dashboard', color: 'bg-blue-500' },
      { label: 'Approvals', icon: ShieldCheck, path: '/admin/approvals', color: 'bg-emerald-600' },
      { label: 'Doctor Security', icon: Stethoscope, path: '/admin/doctors', color: 'bg-teal-600' },
      { label: 'Patient Security', icon: Users, path: '/admin/patients', color: 'bg-indigo-600' },
      { label: 'OP Tokens', icon: Clock, path: '/admin/op-tokens', color: 'bg-amber-600' },
      { label: 'Departments', icon: Layout, path: '/admin/departments', color: 'bg-purple-600' },
      { label: 'AI Monitoring', icon: Monitor, path: '/admin/ai-monitoring', color: 'bg-sky-600' },
      { label: 'Billing', icon: CreditCard, path: '/admin/billing', color: 'bg-rose-600' },
      { label: 'Governance', icon: Shield, path: '/admin/profile-governance', color: 'bg-emerald-500' },
      { label: 'Audit Logs', icon: FileText, path: '/admin/audit-logs', color: 'bg-slate-600' },
    ]
  };

  const currentRoleItems = (user && menuItems[user.role]) ? menuItems[user.role] : menuItems.patient;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-[95vw]">
      <motion.nav
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-zinc-950/80 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
            : 'bg-white/80 border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)]'
        }`}
      >
        {currentRoleItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <div key={index} className="relative flex flex-col items-center">
              <motion.button
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
                onClick={() => navigate(item.path)}
                whileHover={{ scale: 1.15, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className={`relative p-2 sm:p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? `${item.color} text-white shadow-lg shadow-blue-500/30 ring-2 ring-white/20`
                    : theme === 'dark'
                    ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />

                {/* Info badge pulse for active nodes */}
                {item.isInfo && latestAppt && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </motion.button>

              {/* Tooltip Label */}
              <AnimatePresence>
                {hoveredIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: -45, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute pointer-events-none px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap border shadow-xl z-50 ${
                      theme === 'dark'
                        ? 'bg-zinc-900 text-white border-white/10'
                        : 'bg-white text-slate-800 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.nav>
    </div>
  );
};

export default NeuralDock;
