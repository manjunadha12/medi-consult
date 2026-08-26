import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import {
  Sun, Moon, Shield, Bell, Monitor, Lock, Trash2,
  LogOut, Lightbulb, ChevronRight, Database, Users, Info, CheckCircle,
  Settings, Download, RefreshCw, Smartphone as MobileIcon, Sparkles, Activity, Scale, ArrowUp
} from 'lucide-react';
import useStore from '../../store/useStore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const GeneralSettings = () => {
  const store = useStore();
  const user = store.user;
  const theme = store.theme;
  const setTheme = store.setTheme;
  const logout = store.logout;

  const navigate = useNavigate();

  const [uiDensity, setUiDensity] = useState('Comfortable');
  const [aiSettings, setAiSettings] = useState({
    smartPrediction: true,
    autoIndexing: true,
    proactiveAlerts: true,
    sensitivity: 75
  });
  const [dataSettings, setDataSettings] = useState({
    autoBackup: true,
    retention: '12 Months',
    format: 'PDF'
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    dataEncryption: true,
    sessionTimeout: '30 Minutes'
  });
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    weekly: true,
    quietStart: '10:00 PM',
    quietEnd: '07:00 AM'
  });

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.securitySettings) {
        setSecuritySettings(data.securitySettings);
      }
    } catch (err) {
      console.error("Failed to fetch user settings", err);
    }
  };

  const updateSecurity = async (newSettings) => {
    const original = { ...securitySettings };
    setSecuritySettings(newSettings);
    try {
      await api.put('/auth/security-settings', newSettings);
      toast.success("Security protocols updated");
    } catch (err) {
      setSecuritySettings(original);
      toast.error("Failed to update security settings");
    }
  };

  const handleLogout = () => {
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

  const Toggle = ({ active, onClick }) => (
    <div
      onClick={onClick}
      className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${active ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-slate-200 dark:bg-zinc-800'}`}
    >
       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${active ? 'right-1' : 'left-1'}`}></div>
    </div>
  );

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
                   onClick={handleLogout}
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
                          value={uiDensity}
                          onChange={(e) => setUiDensity(e.target.value)}
                          className={`w-full p-5 rounded-3xl border text-xs font-black uppercase tracking-widest outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`}
                        >
                          <option>Comfortable</option>
                          <option>Compact</option>
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

                <div className="lg:col-span-2">
                  <SectionCard title="AI Suggestions" subtitle="Optimize swarm feedback" icon={Lightbulb}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        {[
                          { l: 'Smart Vitals Prediction', d: 'Predict trends based on past logs', key: 'smartPrediction' },
                          { l: 'Automatic Report Indexing', d: 'Auto-categorize documents', key: 'autoIndexing' },
                          { l: 'Proactive Health Alerts', d: 'System-triggered checks', key: 'proactiveAlerts' },
                        ].map((item, i) => (
                          <div key={i} className={`p-5 rounded-[28px] border flex items-center justify-between group transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50'}`}>
                            <div className="text-left">
                              <p className={`text-[11px] font-black uppercase tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{item.l}</p>
                              <p className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-tighter">{item.d}</p>
                            </div>
                            <Toggle
                              active={aiSettings[item.key]}
                              onClick={() => setAiSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-6 pt-2 text-left">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Model Sensitivity</label>
                          <span className="text-[10px] font-black text-blue-600">{aiSettings.sensitivity}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={aiSettings.sensitivity}
                          onChange={(e) => setAiSettings(prev => ({ ...prev, sensitivity: e.target.value }))}
                          className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    </div>
                  </SectionCard>
                </div>

                <SectionCard title="Data & Reports" subtitle="Manage your medical archive" icon={Database}>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-600/5 border border-blue-100 dark:border-blue-600/20 rounded-[28px]">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Auto-Backup</span>
                      <Toggle
                        active={dataSettings.autoBackup}
                        onClick={() => setDataSettings(prev => ({ ...prev, autoBackup: !prev.autoBackup }))}
                      />
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Retention Period</p>
                          <select
                            value={dataSettings.retention}
                            onChange={(e) => setDataSettings(prev => ({ ...prev, retention: e.target.value }))}
                            className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-200 outline-none"
                          >
                            <option value="6 Months">6 Months</option>
                            <option value="12 Months">12 Months</option>
                            <option value="Forever">Forever</option>
                          </select>
                       </div>
                       <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Export Format</p>
                          <select
                            value={dataSettings.format}
                            onChange={(e) => setDataSettings(prev => ({ ...prev, format: e.target.value }))}
                            className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-200 outline-none uppercase tracking-widest"
                          >
                            <option value="PDF">PDF</option>
                            <option value="JSON">JSON</option>
                            <option value="CSV">CSV</option>
                          </select>
                       </div>
                    </div>
                    <button
                      onClick={() => toast.success(`Data export initiated in ${dataSettings.format} format`)}
                      className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 transition-all group"
                    >
                       <span className="text-[10px] font-black text-slate-500 uppercase group-hover:text-blue-500 transition-colors">Export All Data</span>
                       <Download size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </button>
                  </div>
                </SectionCard>

                <SectionCard title="Security & Privacy" subtitle="Data protection protocols" icon={Lock}>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-600/5 border border-emerald-100 dark:border-emerald-600/20 rounded-[28px]">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Two-Factor Auth</span>
                      <Toggle
                        active={securitySettings.twoFactorAuth}
                        onClick={() => updateSecurity({ ...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth })}
                      />
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Session Timeout</p>
                          <select
                            value={securitySettings.sessionTimeout}
                            onChange={(e) => updateSecurity({ ...securitySettings, sessionTimeout: e.target.value })}
                            className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-200 outline-none"
                          >
                            <option value="15 Minutes">15 Minutes</option>
                            <option value="30 Minutes">30 Minutes</option>
                            <option value="1 Hour">1 Hour</option>
                          </select>
                       </div>
                       <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Data Encryption</p>
                          <Toggle
                            active={securitySettings.dataEncryption}
                            onClick={() => updateSecurity({ ...securitySettings, dataEncryption: !securitySettings.dataEncryption })}
                          />
                       </div>
                    </div>
                    <button
                      onClick={() => toast.success("Node tokens refreshed")}
                      className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 transition-all group"
                    >
                       <span className="text-[10px] font-black text-slate-500 uppercase group-hover:text-emerald-600 transition-colors">Manage Access Tokens</span>
                       <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </button>
                  </div>
                </SectionCard>

                <SectionCard title="Notifications" subtitle="Alert management" icon={Bell}>
                   <div className="space-y-4">
                      {[
                        { l: 'Push Notifications', key: 'push' },
                        { l: 'Email Notifications', key: 'email' },
                        { l: 'Weekly Summary', key: 'weekly' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                           <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{item.l}</span>
                           <Toggle
                             active={notifications[item.key]}
                             onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                           />
                        </div>
                      ))}
                      <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                         <p className="text-[10px] font-black text-slate-400 uppercase text-left">Quiet Hours</p>
                         <div className="flex items-center justify-between gap-4">
                            <input
                              type="text"
                              value={notifications.quietStart}
                              onChange={(e) => setNotifications(prev => ({ ...prev, quietStart: e.target.value }))}
                              className="w-full p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl text-center text-xs font-black text-slate-700 dark:text-zinc-300 tracking-widest border border-transparent focus:border-blue-500/30 outline-none"
                            />
                            <div className="h-px w-8 bg-slate-200 dark:bg-zinc-800 shrink-0"></div>
                            <input
                              type="text"
                              value={notifications.quietEnd}
                              onChange={(e) => setNotifications(prev => ({ ...prev, quietEnd: e.target.value }))}
                              className="w-full p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl text-center text-xs font-black text-slate-700 dark:text-zinc-300 tracking-widest border border-transparent focus:border-blue-500/30 outline-none"
                            />
                         </div>
                      </div>
                   </div>
                </SectionCard>


                <SectionCard title="User Management" subtitle="Access node control" icon={Users}>
                   <div className="space-y-3">
                      {[
                        { label: 'Manage Users', path: '/admin/patients' },
                        { label: 'Roles & Permissions', path: '/admin/access' },
                        { label: 'Activity Monitoring', path: '/admin/audit-logs' }
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (user?.role === 'admin') {
                              navigate(item.path);
                            } else {
                              toast.error("Security Alert: Node Access Restricted to Admin Level");
                            }
                          }}
                          className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 transition-all group text-left"
                        >
                           <span className="text-[10px] font-black text-slate-500 uppercase group-hover:text-blue-500 transition-colors tracking-widest">{item.label}</span>
                           <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </button>
                      ))}
                   </div>
                </SectionCard>

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
