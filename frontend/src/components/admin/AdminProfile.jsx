import React from 'react';
import useStore from '../../store/useStore';
import Navbar from '../common/Navbar';
import { User as UserIcon, Mail, Shield, ShieldCheck, Key, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const AdminProfile = () => {
  const { user, theme, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success("Admin Node Deactivated");
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'}`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-6 lg:p-12 overflow-y-auto custom-scrollbar relative z-10">
          <div className="max-w-4xl mx-auto space-y-10">
             <header className="text-left">
                <h1 className={`text-4xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Admin Identity</h1>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2">Central Management Node</p>
             </header>

             <div className={`p-10 rounded-[48px] border shadow-2xl transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0B] border-white/5' : 'bg-white border-slate-100'}`}>
                <div className="flex flex-col md:flex-row items-center gap-10">
                   <div className="w-32 h-32 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-blue-600/30">
                      {user?.name?.charAt(0)}
                   </div>
                   <div className="flex-1 text-center md:text-left space-y-4">
                      <div>
                         <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Administrative Name</p>
                         <h2 className="text-3xl font-black uppercase text-white">{user?.name}</h2>
                      </div>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4">
                         <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black uppercase">Root Access</span>
                         </div>
                         <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2">
                            <Key size={14} className="text-blue-500" />
                            <span className="text-[10px] font-black uppercase">{user?.userId}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2 text-left">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Mail size={12}/> Email Endpoint</p>
                      <p className="text-sm font-bold">{user?.email}</p>
                   </div>
                   <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2 text-left">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Shield size={12}/> Security Level</p>
                      <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Level 10 (Full Protocol)</p>
                   </div>
                </div>

                <div className="mt-12 pt-10 border-t border-white/5 flex flex-col sm:flex-row gap-4">
                   <button
                     onClick={() => navigate('/admin/system-settings')}
                     className="flex-1 py-5 bg-white/5 border border-white/5 hover:bg-blue-600/10 hover:border-blue-500/50 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                   >System Configuration</button>
                   <button
                     onClick={handleLogout}
                     className="flex-1 py-5 bg-red-600/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                   >Purge Auth Session</button>
                </div>
             </div>

             <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[32px] flex items-start gap-4">
                <Shield className="text-amber-500 shrink-0" size={20} />
                <div className="text-left">
                   <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Administrative Notice</p>
                   <p className="text-[11px] font-medium leading-relaxed opacity-60">You are accessing the core administrative node. All actions are logged in the institutional audit vault for compliance and security forensics.</p>
                </div>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminProfile;
