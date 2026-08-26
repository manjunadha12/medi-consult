import React, { useState } from 'react';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import {
  Settings, Lock, Bell, Activity, Globe,
  Smartphone, Save, ShieldCheck as ShieldCheckIcon, HelpCircle,
  ToggleLeft, ToggleRight, Monitor, Moon, Sun, Eye, EyeOff, Key
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../../store/useStore';

const Toggle = ({ enabled, onToggle }) => (
  <button
    onClick={onToggle}
    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${enabled ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-white/10'}`}
  >
    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${enabled ? 'right-0.5' : 'left-0.5'}`} />
  </button>
);

const DocSettings = () => {
  const { navigationType, setNavigationType } = useStore();
  const [activeSec, setActiveSec] = useState('general');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [appointmentAlert, setAppointmentAlert] = useState(true);
  const [reportAlert, setReportAlert] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [compactView, setCompactView] = useState(false);

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'consultation', label: 'Duty Timing', icon: Activity },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-300 text-left neural-grid pb-24">
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-8 relative z-10 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <header>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Configuration Hub</p>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight mt-1">Clinical Settings</h1>
              <p className="text-zinc-500 font-medium mt-1">Configure your clinical workflow and security preferences</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

              {/* Section Nav */}
              <div className="lg:col-span-1 space-y-2">
                {sections.map((s) => {
                  const isActive = activeSec === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSec(s.id)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-white/5 border border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      <s.icon size={18} /> {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Content */}
              <div className="lg:col-span-3 space-y-6 text-left">

                {/* GENERAL */}
                {activeSec === 'general' && (
                  <div className="bg-zinc-950/80 border border-white/5 rounded-[40px] p-8 backdrop-blur-3xl noise-overlay space-y-8">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <Globe size={20} className="text-blue-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Platform Preferences</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Interface Language</label>
                          <select className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-zinc-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500 transition-all">
                            <option className="bg-zinc-900">English (US)</option>
                            <option className="bg-zinc-900">Hindi</option>
                            <option className="bg-zinc-900">Telugu</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Timezone</label>
                          <select className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-zinc-300 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500 transition-all">
                            <option className="bg-zinc-900">(GMT+05:30) India Standard Time</option>
                            <option className="bg-zinc-900">(GMT+00:00) UTC</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-6 space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Monitor size={20} className="text-blue-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Display</h3>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <div>
                          <p className="font-black text-white text-sm">Dark Mode</p>
                          <p className="text-xs text-zinc-500 mt-1">Use the neural dark visual system</p>
                        </div>
                        <Toggle enabled={darkMode} onToggle={() => setDarkMode(!darkMode)} />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <div>
                          <p className="font-black text-white text-sm">Compact View</p>
                          <p className="text-xs text-zinc-500 mt-1">Reduce spacing for more data density</p>
                        </div>
                        <Toggle enabled={compactView} onToggle={() => setCompactView(!compactView)} />
                      </div>
                      <div className="space-y-3 pt-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">Navigation Topology</p>
                        {[
                           { id: 'dock', label: 'Neural Dock' },
                           { id: 'sidebar', label: 'Clinical Sidebar' },
                        ].map((opt) => (
                           <button
                             key={opt.id}
                             onClick={() => {
                               setNavigationType(opt.id);
                               toast.success(`Navigation Node: ${opt.label}`);
                             }}
                             className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                               navigationType === opt.id
                                 ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                 : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                             }`}
                           >
                             <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                             <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                               navigationType === opt.id ? 'border-white bg-white/20' : 'border-zinc-700'
                             }`}>
                                {navigationType === opt.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                             </div>
                           </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest">
                        <ShieldCheckIcon size={16} /> All Data is Encrypted
                      </div>
                      <button
                        onClick={() => toast.success('Settings saved successfully')}
                        className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2 hover:bg-blue-500 hover:scale-[1.02] transition-all"
                      >
                        <Save size={16} /> Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* SECURITY */}
                {activeSec === 'security' && (
                  <div className="bg-zinc-950/80 border border-white/5 rounded-[40px] p-8 backdrop-blur-3xl noise-overlay space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Lock size={20} className="text-blue-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Access Security</h3>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl">
                      <div>
                        <p className="font-black text-white">Two-Factor Authentication</p>
                        <p className="text-xs text-zinc-500 mt-1">Add an extra layer of security to your clinical account</p>
                      </div>
                      <Toggle enabled={twoFactor} onToggle={() => setTwoFactor(!twoFactor)} />
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Change Password</p>
                      <div className="relative">
                        <input
                          type={showOldPw ? 'text' : 'password'}
                          placeholder="Current Password"
                          className="w-full pl-5 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500 font-semibold text-sm text-zinc-200 placeholder:text-zinc-600 transition-all"
                        />
                        <button className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-all" onClick={() => setShowOldPw(!showOldPw)}>
                          {showOldPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          placeholder="New Password"
                          className="w-full pl-5 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500 font-semibold text-sm text-zinc-200 placeholder:text-zinc-600 transition-all"
                        />
                        <button className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-all" onClick={() => setShowNewPw(!showNewPw)}>
                          {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <button
                        onClick={() => toast.success('Password updated successfully')}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
                      >
                        <Key size={16} /> Update Password
                      </button>
                    </div>
                  </div>
                )}

                {/* NOTIFICATIONS */}
                {activeSec === 'notifications' && (
                  <div className="bg-zinc-950/80 border border-white/5 rounded-[40px] p-8 backdrop-blur-3xl noise-overlay space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Bell size={20} className="text-blue-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Notification Hub</h3>
                    </div>
                    {[
                      { label: 'Email Notifications', desc: 'Receive clinical updates via email', state: emailNotif, toggle: () => setEmailNotif(!emailNotif) },
                      { label: 'SMS Notifications', desc: 'Receive urgent alerts via SMS', state: smsNotif, toggle: () => setSmsNotif(!smsNotif) },
                      { label: 'Push Notifications', desc: 'Receive real-time browser alerts', state: pushNotif, toggle: () => setPushNotif(!pushNotif) },
                      { label: 'Appointment Alerts', desc: 'Get notified on new patient appointments', state: appointmentAlert, toggle: () => setAppointmentAlert(!appointmentAlert) },
                      { label: 'Report Alerts', desc: 'Get notified when lab reports are ready', state: reportAlert, toggle: () => setReportAlert(!reportAlert) },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <div>
                          <p className="font-black text-white text-sm">{item.label}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                        </div>
                        <Toggle enabled={item.state} onToggle={item.toggle} />
                      </div>
                    ))}
                    <div className="pt-4 border-t border-white/5 flex justify-end">
                      <button
                        onClick={() => toast.success('Notification settings saved')}
                        className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2 hover:bg-blue-500 transition-all"
                      >
                        <Save size={16} /> Save
                      </button>
                    </div>
                  </div>
                )}

                {/* DUTY TIMING */}
                {activeSec === 'consultation' && (
                  <div className="bg-zinc-950/80 border border-white/5 rounded-[40px] p-8 backdrop-blur-3xl noise-overlay space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Activity size={20} className="text-blue-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Duty Timing</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                        <div key={day} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{day}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] text-zinc-500 uppercase font-bold">Start</label>
                              <input type="time" defaultValue="09:00" className="w-full mt-1 p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-200 text-sm outline-none focus:border-blue-500/50" />
                            </div>
                            <div>
                              <label className="text-[9px] text-zinc-500 uppercase font-bold">End</label>
                              <input type="time" defaultValue="17:00" className="w-full mt-1 p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-200 text-sm outline-none focus:border-blue-500/50" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-white/5 flex justify-end">
                      <button
                        onClick={() => toast.success('Duty schedule saved')}
                        className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2 hover:bg-blue-500 transition-all"
                      >
                        <Save size={16} /> Save Schedule
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocSettings;
