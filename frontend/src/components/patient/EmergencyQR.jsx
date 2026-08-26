import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import useStore from '../../store/useStore';
import Navbar from '../common/Navbar';
import { Shield, MapPin, User as UserIcon, Activity, Droplet, Download, Share2, Info } from 'lucide-react';

const EmergencyQR = () => {
  const { user, theme } = useStore();
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    // Unique secure link for emergency responders
    const emergencyLink = `${window.location.origin}/emergency-access/${user?.userId}`;
    setQrValue(emergencyLink);
  }, [user]);

  const stats = [
    { label: 'Blood Group', val: 'O+', icon: Droplet, color: 'text-red-500' },
    { label: 'Allergies', val: 'Penicillin', icon: Shield, color: 'text-amber-500' },
    { label: 'Guardian', val: 'Satish', icon: UserIcon, color: 'text-blue-500' }
  ];

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-300' : 'bg-[#F8FAFC] text-slate-600'} text-left`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-8 lg:p-10 pb-32 overflow-y-auto custom-scrollbar">
          <header className="mb-10 text-left">
            <h1 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Emergency Node</h1>
            <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mt-1">Instant Clinical Data Propagation</p>
          </header>

          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* QR NODE */}
            <div className={`p-10 rounded-[56px] border shadow-2xl text-center relative overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5 shadow-black/80' : 'bg-white border-slate-100'}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

              <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-10">Neural QR Signature</p>

              <div className="bg-white p-8 rounded-[48px] inline-block shadow-2xl border-4 border-slate-50 mb-10">
                <QRCodeSVG value={qrValue} size={220} level="H" includeMargin={false} />
              </div>

              <div className="space-y-4">
                 <button className="w-full py-5 bg-red-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-red-500/40 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                    <Download size={18} /> Download Emergency ID
                 </button>
                 <button className={`w-full py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] transition-all border flex items-center justify-center gap-3 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    <Share2 size={18} /> Broadcast to Guardian
                 </button>
              </div>
            </div>

            {/* INFO PANEL */}
            <div className="space-y-8">
              <div className={`p-8 rounded-[48px] border shadow-xl transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                <h3 className="font-black uppercase tracking-[0.2em] text-[10px] mb-8 text-blue-500 flex items-center gap-2"><Info size={16} /> Broadcast Data Summary</h3>
                <div className="space-y-6">
                   {stats.map((s, i) => (
                     <div key={i} className={`p-5 rounded-3xl border flex items-center gap-5 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-50 shadow-inner'}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm ${s.color}`}>
                           <s.icon size={20} />
                        </div>
                        <div className="text-left">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{s.label}</p>
                           <p className={`text-sm font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{s.val}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[40px] flex gap-5 text-left">
                 <Activity className="text-amber-500 shrink-0 mt-1" size={24} />
                 <p className="text-[10px] font-bold text-amber-600 leading-relaxed uppercase tracking-wide">
                    Responders scanning this code will gain 15-minute restricted access to your critical clinical history and emergency contact nodes.
                 </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmergencyQR;
