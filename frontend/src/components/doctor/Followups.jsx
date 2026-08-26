import React from 'react';
import Navbar from '../common/Navbar';
import { Calendar, User, Phone as PhoneIcon, MessageSquare, Clock, ChevronRight, X } from 'lucide-react';
import useStore from '../../store/useStore';

const Followups = ({ patientId: propPatientId, onComplete, hideNavbar = false }) => {
  const { theme } = useStore();
  const followups = [
    { date: 'Oct 26, 2024', id: propPatientId || 'PAT1005', name: 'Ravi Teja', reason: 'Post-Surgery Check', status: 'Confirmed' },
    { date: 'Oct 26, 2024', id: 'PAT1006', name: 'Lakshmi Devi', reason: 'Diabetic Review', status: 'Pending' },
    { date: 'Oct 27, 2024', id: 'PAT1008', name: 'Anitha Reddy', reason: 'BP Monitoring', status: 'Confirmed' },
    { date: 'Oct 28, 2024', id: 'PAT1009', name: 'Suresh Kumar', reason: 'General Review', status: 'Pending' },
  ];

  return (
    <div className={`flex ${hideNavbar ? 'h-full' : 'min-h-screen'} transition-colors duration-500 text-left neural-grid ${hideNavbar ? 'pb-0' : 'pb-24'} ${
      theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'
    }`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!hideNavbar && <Navbar />}
        <main className={`${hideNavbar ? 'p-0' : 'p-8 lg:p-10'} overflow-y-auto custom-scrollbar relative z-10`}>
          <header className={`flex justify-between items-center ${hideNavbar ? 'mb-4' : 'mb-10'}`}>
            <div>
              <h1 className={`${hideNavbar ? 'text-xl' : 'text-3xl'} font-black text-white uppercase tracking-tight`}>Follow-up Patients</h1>
              <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mt-1">Upcoming Reviews and Recovery Checkups</p>
            </div>
            {hideNavbar && (
              <button onClick={onComplete} className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all"><X size={20}/></button>
            )}
          </header>

          <div className={`rounded-[48px] border shadow-2xl overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-950/80 border-white/5' : 'bg-white border-slate-100'}`}>
            <div className={`p-6 border-b font-black text-[10px] uppercase tracking-[0.2em] flex justify-between ${theme === 'dark' ? 'border-white/5 bg-white/5 text-zinc-500' : 'border-slate-50 bg-slate-50/50 text-slate-400'}`}>
              <span>Next 7 Days Schedule</span>
              <span>Total: {followups.length} Nodes</span>
            </div>
            <div className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-50'}`}>
              {followups.map((f, i) => (
                <div key={i} className={`p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${theme === 'dark' ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}>
                  <div className="flex items-center gap-8 text-left">
                    <div className={`w-20 h-20 rounded-[32px] flex flex-col items-center justify-center border shadow-inner transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5' : 'bg-blue-50 border-blue-100'}`}>
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">{f.date.split(',')[0].split(' ')[0]}</span>
                      <span className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{f.date.split(',')[0].split(' ')[1]}</span>
                    </div>
                    <div>
                      <h3 className={`font-black text-xl uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{f.name}</h3>
                      <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest mt-2">
                        <span className="text-blue-500">{f.id}</span>
                        <span className="text-zinc-500 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 opacity-50"></div>
                           {f.reason}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right hidden md:block">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Sync Status</p>
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        f.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {f.status}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button className={`p-4 rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-white/5 border border-white/5 text-zinc-400 hover:text-blue-400' : 'bg-slate-50 border border-slate-100 text-slate-400 hover:text-blue-600'}`}>
                        <PhoneIcon size={20} />
                      </button>
                      <button className={`p-4 rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-white/5 border border-white/5 text-zinc-400 hover:text-blue-400' : 'bg-slate-50 border border-slate-100 text-slate-400 hover:text-blue-600'}`}>
                        <MessageSquare size={20} />
                      </button>
                      <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center gap-2 active:scale-95">
                        Access Profile <ChevronRight size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Followups;
