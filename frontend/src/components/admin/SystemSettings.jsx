import React, { useState } from 'react';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import { Settings, Cpu, Shield, Key, Bell, Database, Save, Activity, Monitor } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../../store/useStore';

const SystemSettings = () => {
  const { theme, navigationType, setNavigationType } = useStore();

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'}`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-left">
              <h1 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>System Core Settings</h1>
              <p className="text-slate-500 font-medium mt-1">Control platform variables, ID prefixes, and Swarm AI parameters</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

               {/* ID Prefixes */}
               <div className={`p-8 rounded-[40px] border shadow-sm space-y-6 transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0E12]/90 border-white/5' : 'bg-white border-slate-100'}`}>
                  <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                     <Key size={20} className="text-blue-600" /> ID Prefixes
                  </h3>
                  <div className="space-y-4">
                     {[
                       { l: 'Patient ID', v: 'PAT' },
                       { l: 'Doctor ID', v: 'DOC' },
                       { l: 'Token Code', v: 'TOK' }
                     ].map((item, i) => (
                       <div key={i} className={`flex items-center justify-between p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                          <span className="text-[10px] font-black text-slate-400 uppercase">{item.l}</span>
                          <input type="text" defaultValue={item.v} className={`w-16 border rounded-lg p-1 text-center font-black text-blue-600 transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/10' : 'bg-white border-slate-200'}`} />
                       </div>
                     ))}
                  </div>
               </div>

               {/* AI Controls */}
               <div className={`p-8 rounded-[40px] border shadow-sm space-y-6 transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0E12]/90 border-white/5' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                       <Cpu size={20} className="text-purple-600" /> Swarm AI Features
                    </h3>
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                    >
                      Manage Keys
                    </a>
                  </div>
                  <div className="space-y-4">
                     {[
                       { label: 'Auto Report Analysis', status: true },
                       { label: 'AI Patient Summary', status: true },
                       { label: 'Prescription Verification', status: false },
                     ].map((f, i) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                           <span className="text-[10px] font-black text-slate-400 uppercase">{f.label}</span>
                           <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${f.status ? 'bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.4)]' : 'bg-slate-300 dark:bg-zinc-800'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${f.status ? 'right-1' : 'left-1'}`}></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Operational limits */}
               <div className={`p-8 rounded-[40px] border shadow-sm space-y-6 transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0E12]/90 border-white/5' : 'bg-white border-slate-100'}`}>
                  <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                     <Activity size={20} className="text-emerald-600" /> Operational Limits
                  </h3>
                  <div className="space-y-4">
                     <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Max OP Tokens Per Doctor</label>
                        <input type="number" defaultValue="50" className={`w-full p-3 border rounded-xl font-black text-sm outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                     </div>
                     <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Appt Slot Duration (Mins)</label>
                        <input type="number" defaultValue="15" className={`w-full p-3 border rounded-xl font-black text-sm outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                     </div>
                  </div>
               </div>

               {/* Maintenance */}
               <div className={`p-8 rounded-[40px] border space-y-6 transition-all duration-500 ${theme === 'dark' ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-100'}`}>
                  <h3 className="text-sm font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                     <Shield size={20} /> System Maintenance
                  </h3>
                  <p className={`text-xs font-bold ${theme === 'dark' ? 'text-red-400/80' : 'text-red-400'}`}>Restrict platform access for scheduled maintenance or upgrades.</p>
                  <button className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-red-500/20 uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95">Enable Maintenance Mode</button>
               </div>

               {/* App Interface Topology */}
               <div className={`p-8 rounded-[40px] border shadow-sm space-y-6 transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0E12]/90 border-white/5' : 'bg-white border-slate-100'}`}>
                  <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                     <Monitor size={20} className="text-cyan-500" /> Interface Topology
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                     {[
                       { id: 'dock', label: 'Neural Dock' },
                       { id: 'sidebar', label: 'Sidebar Node' }
                     ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                             setNavigationType(opt.id);
                             toast.success(`Global Topology: ${opt.label}`);
                          }}
                          className={`p-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                            navigationType === opt.id
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                              : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                           {opt.label}
                        </button>
                     ))}
                  </div>
               </div>

            </div>

            <div className="flex justify-end pt-10">
               <button onClick={() => toast.success("System configuration saved to node storage")} className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 flex items-center gap-3 hover:bg-blue-700 transition-all active:scale-95">
                  <Save size={18} /> Save Core Config
               </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SystemSettings;
