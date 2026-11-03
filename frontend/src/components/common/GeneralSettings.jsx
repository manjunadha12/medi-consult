import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import {
  Sun, Moon, Shield, Bell, Monitor, Lock, Trash2,
  LogOut, Lightbulb, ChevronRight, Database, Users, Info, CheckCircle,
  Settings, Download, RefreshCw, Smartphone as MobileIcon, Sparkles, Activity, Scale, ArrowUp, Cpu, Zap, Brain
} from 'lucide-react';
import useStore from '../../store/useStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import DeviceSessionsManager from './DeviceSessionsManager';

const GeneralSettings = () => {
  const store = useStore();
  const user = store.user;
  const theme = store.theme;
  const setTheme = store.setTheme;
  const logout = store.logout;

  const navigate = useNavigate();

  const logoutAndRedirect = () => {
    logout();
    navigate('/');
    toast.success("Node Deactivated: Securely Logged Out");
  };

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    toast.success(`System theme synchronized: ${newTheme.toUpperCase()} MODE`);
  };

  const handleUpdateCheck = () => {
    toast.loading("Scanning for system updates...");
    setTimeout(() => {
      toast.dismiss();
      toast.success("System is up to date: v2.4.1");
    }, 2000);
  };

  const SectionCard = ({ title, subtitle, icon: Icon, children }) => (
    <div className={`p-8 rounded-[40px] border shadow-sm flex flex-col space-y-8 h-full transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5 shadow-black/50' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
           <Icon size={24} />
        </div>
        <div className="text-left">
           <h3 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{subtitle}</p>
        </div>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#F8FAFC]'}`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12">
           <div className="max-w-[1600px] mx-auto space-y-12">

              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div className="text-left space-y-2">
                    <h1 className={`text-4xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>System Settings</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">Configure your node parameters</p>
                 </div>
                 <button
                   onClick={logoutAndRedirect}
                   className="flex items-center gap-4 px-10 py-5 bg-[#DC2626] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-95 group"
                 >
                    <LogOut size={18} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                    Deactivate Session
                 </button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-1">
                  <SectionCard title="Neural Interface" subtitle="Customize diagnostic environment" icon={Monitor}>
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => toggleTheme('light')} className={`p-8 rounded-[32px] border-2 transition-all flex flex-col items-center gap-4 ${theme === 'light' ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-white/5 text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}>
                           <Sun size={24} />
                           <span className="text-[10px] font-black uppercase tracking-widest">White Node</span>
                        </button>
                        <button onClick={() => toggleTheme('dark')} className={`p-8 rounded-[32px] border-2 transition-all flex flex-col items-center gap-4 ${theme === 'dark' ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-white/5 text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}>
                           <Moon size={24} />
                           <span className="text-[10px] font-black uppercase tracking-widest">Dark Node</span>
                        </button>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1 text-left">UI Density</label>
                        <select
                          value={store.uiDensity || 'Comfortable'}
                          onChange={(e) => {
                            store.setUiDensity(e.target.value);
                            toast.success(`UI Density set to ${e.target.value}`);
                          }}
                          className={`w-full p-5 rounded-3xl border text-xs font-black uppercase tracking-widest outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`}
                        >
                          <option value="Comfortable">Comfortable</option>
                          <option value="Compact">Compact</option>
                        </select>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                <div className="lg:col-span-1">
                  <SectionCard title="Interface Hub" subtitle="Toggle system visibility" icon={MobileIcon}>
                    <div className="space-y-3">
                       {[
                         { id: 'dock', label: 'Neural Dock', desc: 'Floating bottom action dock' },
                         { id: 'sidebar', label: 'Clinical Sidebar', desc: 'Modern side navigation node' }
                       ].map((opt) => (
                         <button
                           key={opt.id}
                           onClick={() => {
                             store.setNavigationType(opt.id);
                             toast.success(`Interface Node: ${opt.label}`);
                           }}
                           className={`w-full p-4 rounded-[24px] border text-left transition-all ${
                             store.navigationType === opt.id
                               ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                               : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10'
                           }`}
                         >
                           <div className="flex justify-between items-center">
                             <div>
                               <p className="text-[11px] font-black uppercase tracking-tight">{opt.label}</p>
                               <p className={`text-[9px] font-bold mt-0.5 uppercase tracking-tighter ${store.navigationType === opt.id ? 'text-blue-100' : 'text-slate-500'}`}>{opt.desc}</p>
                             </div>
                             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                               store.navigationType === opt.id ? 'border-white bg-white/20' : 'border-slate-200 dark:border-zinc-700'
                             }`}>
                                {store.navigationType === opt.id && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm"></div>}
                             </div>
                           </div>
                         </button>
                       ))}
                    </div>
                  </SectionCard>
                </div>

                <div className="lg:col-span-1">
                  <SectionCard title="About System" subtitle="System information" icon={Info}>
                     <div className="space-y-5 text-left">
                        {[
                          { l: 'System Version', v: 'v2.4.1 (Build 2024.05.18)' },
                          { l: 'Last Updated', v: 'May 18, 2024 10:30 AM' },
                          { l: 'License Status', v: 'Premium Plan • Active', c: 'text-emerald-500' }
                        ].map((item, i) => (
                          <div key={i} className="px-2">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.l}</p>
                             <p className={`text-xs font-black tracking-tight mt-1 ${item.c || 'text-slate-700 dark:text-slate-200'}`}>{item.v}</p>
                          </div>
                        ))}
                        <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                          <button
                            onClick={handleUpdateCheck}
                            className="w-full flex items-center justify-center gap-3 p-5 bg-slate-50 dark:bg-white/5 rounded-[24px] border border-slate-100 dark:border-white/5 text-[10px] font-black text-slate-500 uppercase hover:bg-blue-50 dark:hover:bg-blue-600/10 hover:text-blue-600 transition-all"
                          >
                             <RefreshCw size={14} /> Check for Updates
                          </button>
                        </div>
                     </div>
                  </SectionCard>
                </div>

              </div>

              {/* Logged-In Devices / Active Device Sessions */}
              <DeviceSessionsManager isDarkMode={theme === 'dark'} />

              <footer className="pt-12 flex justify-center opacity-30">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">© 2024 Medi Consult. All rights reserved.</p>
              </footer>

           </div>
        </main>
      </div>
    </div>
  );
};

export default GeneralSettings;
