import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Settings, Brain, FileUp, Monitor, History as HistoryIcon, Search as SearchIcon, ShieldCheck, LogOut, ChevronRight, Menu, X,
  Home, Activity, Pill, MessageSquare, MessageCircle, FileText, Video, Calculator, Clock, Clipboard, Layout, Users, Stethoscope, CreditCard, Shield, UserPlus
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
      {/* Global Backdrop - Auto-hides sidebar when expanded */}
      {sidebarExpanded && (
        <div
          onClick={() => setSidebarExpanded(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[140] animate-in fade-in duration-300"
        ></div>
      )}

      <aside
        className={`fixed left-0 top-0 h-screen z-[150] border-r transition-all duration-500 ease-in-out flex flex-col overflow-y-auto overflow-x-hidden ${
        sidebarExpanded ? 'w-64 translate-x-0 shadow-[20px_0_60px_rgba(0,0,0,0.5)]' : 'w-64 -translate-x-full'
      } ${
        theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-200'
      }`}>

        {/* Toggle Node */}
        <div className="p-4 sm:p-6 flex items-center justify-between gap-3 shrink-0 border-b border-white/5 min-h-[80px]">
           <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                 <Menu size={22} className="text-white" />
              </div>
              <h2 className={`text-sm font-black uppercase tracking-tighter whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                 Medi <span className="text-blue-500">Consult</span>
              </h2>
           </div>
           <button
             onClick={() => setSidebarExpanded(false)}
             className={`p-2 rounded-lg hover:bg-white/5 transition-all ${theme === 'dark' ? 'text-zinc-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
           >
             <X size={20} />
           </button>
        </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 mt-6 space-y-2 custom-scrollbar flex flex-col">
        {roleItems.map((item, i) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={i}
              onClick={() => {
                navigate(item.path);
                setSidebarExpanded(false); // Auto-hide after selection
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : `hover:bg-white/5 ${theme === 'dark' ? 'text-zinc-500 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`
              }`}
            >
              <item.icon
                size={20}
                strokeWidth={isActive ? 3 : 2}
                className={`${isActive ? 'animate-pulse text-white' : `${item.color} group-hover:scale-110`} transition-all duration-300`}
              />

              <span className="text-[11px] font-black uppercase tracking-widest text-left">
                {item.label}
              </span>

              {isActive && <ChevronRight size={14} className="ml-auto" />}
            </button>
          );
        })}
      </nav>

    </aside>
    </>
  );
};

export default Sidebar;
