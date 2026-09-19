import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Brain, FileUp, Monitor, History as HistoryIcon, Search as SearchIcon, ShieldCheck,
  Home, Activity, Pill, MessageSquare, MessageCircle, FileText, Video, Calculator, Clock, Clipboard, Layout, Users, Stethoscope, CreditCard, Shield, UserPlus, Building
} from 'lucide-react';
import useStore from '../../store/useStore';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, theme, showSidebar, sidebarExpanded, setSidebarExpanded } = useStore();

  if (!showSidebar || !user) return null;

  const menuItems = {
    patient: [
      { label: 'Home', icon: Home, path: '/patient/dashboard', color: 'text-blue-500' },
      { label: 'AI Analysis', icon: Brain, path: '/patient/ai-analysis', color: 'text-purple-500' },
      { label: 'Consultation Details', icon: Stethoscope, path: '/patient/consultation-details', color: 'text-violet-500' },
      { label: 'Supplements', icon: Pill, path: '/patient/medicine-search', color: 'text-emerald-500' },
      { label: 'AI Chat', icon: MessageSquare, path: '/patient/ai-chat', color: 'text-indigo-500' },
      { label: 'Neural Messages', icon: MessageCircle, path: '/patient/chat', color: 'text-blue-400' },
      { label: 'Specialist Search', icon: SearchIcon, path: '/patient/doctor-search', color: 'text-teal-500' },
      { label: 'Reports', icon: FileText, path: '/patient/reports/upload', color: 'text-sky-500' },
      { label: 'Cost', icon: Calculator, path: '/patient/cost-estimator', color: 'text-amber-500' },
      { label: 'Tracker', icon: Clock, path: '/patient/medicine', color: 'text-orange-500' },
      { label: 'Vitals', icon: Activity, path: '/patient/health', color: 'text-red-500' },
      { label: 'Prescriptions', icon: Clipboard, path: '/patient/prescriptions', color: 'text-indigo-400' },
      { label: 'Registry', icon: HistoryIcon, path: '/patient/history', color: 'text-slate-500' },
    ],
    doctor: [
      { label: 'Dashboard', icon: Layout, path: '/doc-dashboard', color: 'text-blue-500' },
      { label: 'Patient Queue', icon: Clock, path: '/doctor/queue', color: 'text-orange-500' },
      { label: 'Offline OP Queue', icon: Building, path: '/doctor/offline-queue', color: 'text-emerald-400' },
      { label: 'Consultation Details', icon: Stethoscope, path: '/doctor/consultation-details', color: 'text-violet-500' },
      { label: 'AI Swarm', icon: Brain, path: '/doctor/ai-report', color: 'text-purple-500' },
      { label: 'AI Chat', icon: MessageSquare, path: '/doctor/ai-chat', color: 'text-indigo-500' },
      { label: 'Neural Messages', icon: MessageCircle, path: '/doctor/chat', color: 'text-blue-400' },
      { label: 'Rx Write', icon: FileUp, path: '/doctor/prescription', color: 'text-emerald-500' },
      { label: 'History', icon: HistoryIcon, path: '/doctor/history', color: 'text-slate-500' },
      { label: 'Rx List', icon: Clipboard, path: '/doctor/prescriptions', color: 'text-indigo-400' },
      { label: 'Referrals', icon: Users, path: '/doctor/referral', color: 'text-teal-500' },
      { label: 'Doctor Network', icon: UserPlus, path: '/doctor/network', color: 'text-sky-500' },
    ],
    admin: [
      { label: 'Dashboard', icon: Home, path: '/admin-dashboard', color: 'text-blue-500' },
      { label: 'Specialist Approvals', icon: ShieldCheck, path: '/admin/approvals', color: 'text-emerald-500' },
      { label: 'Doctor Security', icon: Stethoscope, path: '/admin/doctors', color: 'text-teal-500' },
      { label: 'Patient Security', icon: Users, path: '/admin/patients', color: 'text-indigo-500' },
      { label: 'OP Tokens', icon: Clock, path: '/admin/op-tokens', color: 'text-orange-500' },
      { label: 'Departments', icon: Layout, path: '/admin/departments', color: 'text-purple-500' },
      { label: 'AI Monitor', icon: Monitor, path: '/admin/ai-monitoring', color: 'text-sky-500' },
      { label: 'Billing', icon: CreditCard, path: '/admin/billing', color: 'text-rose-500' },
      { label: 'Governance', icon: Shield, path: '/admin/profile-governance', color: 'text-emerald-500' },
      { label: 'Audit Logs', icon: FileText, path: '/admin/audit-logs', color: 'text-slate-500' },
    ]
  };

  const roleItems = (user && menuItems[user.role]) ? menuItems[user.role] : menuItems.patient;

  return (
    <>
      {/* Global Seamless Backdrop - Continuous gradient blur with no sharp vertical line */}
      {sidebarExpanded && (
        <div
          onClick={() => setSidebarExpanded(false)}
          className="fixed inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/60 backdrop-blur-md z-[140] animate-in fade-in duration-300"
        ></div>
      )}

      <aside
        className={`fixed left-0 top-0 h-screen z-[150] transition-all duration-500 ease-in-out flex flex-col justify-center bg-transparent py-4 ${
          sidebarExpanded ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
        }`}
      >
        {/* Nav Items - Vertically Centered */}
        <nav className="px-3 my-auto space-y-1 custom-scrollbar flex flex-col justify-center">
          {roleItems.map((item, i) => {
            const isActive = location.pathname === item.path;
            const bgClass = item.color.replace('text-', 'bg-');
            return (
              <button
                key={i}
                onClick={() => {
                  navigate(item.path);
                  setSidebarExpanded(false);
                }}
                className={`relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? 'opacity-100'
                    : 'opacity-30 hover:opacity-100'
                }`}
              >
                {/* Radial glow background for active item */}
                {isActive && (
                  <div
                    className={`absolute inset-0 rounded-2xl opacity-40 blur-xl pointer-events-none transition-all duration-500 ${bgClass}`}
                  />
                )}

                {/* Left Side Active Indicator Dot */}
                <div className="w-2.5 flex justify-center shrink-0 relative z-10">
                  {isActive ? (
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${bgClass}`}
                      style={{ filter: 'drop-shadow(0 0 8px currentColor)', boxShadow: '0 0 10px currentColor' }}
                    />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 opacity-0 group-hover:opacity-60 transition-opacity" />
                  )}
                </div>

                {/* Icon */}
                <item.icon
                  size={18}
                  className={`shrink-0 transition-all duration-300 relative z-10 ${item.color} ${
                    isActive ? 'scale-110 drop-shadow-[0_0_12px_currentColor]' : 'group-hover:scale-110'
                  }`}
                />

                {/* Label */}
                <span className={`text-[11px] uppercase tracking-wider text-left truncate relative z-10 ${isActive ? 'text-white font-black drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' : 'text-zinc-400 group-hover:text-white font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
