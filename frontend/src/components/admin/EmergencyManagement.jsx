import React, { useState } from 'react';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import { AlertTriangle, Clock, User, Stethoscope, ShieldAlert, Send } from 'lucide-react';
import useStore from '../../store/useStore';

const EmergencyManagement = () => {
  const { theme } = useStore();
  const [emergencies] = useState([
    { tok: '105', name: 'Manjunadha', age: 25, prob: 'Chest Pain', severity: 'Critical', time: '10:30 AM', doc: 'Unassigned' },
    { tok: '108', name: 'Sravani G', age: 22, prob: 'Severe Injury', severity: 'High', time: '10:45 AM', doc: 'Dr. Priya' },
  ]);

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'}`}>
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar relative z-10">

          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="text-left">
              <h1 className="text-2xl font-black text-red-600 tracking-tight flex items-center gap-2">
                 <ShieldAlert size={28} /> Emergency Response Center
              </h1>
              <p className="text-slate-500 font-medium mt-1">Critical patient monitoring and immediate doctor assignment</p>
            </div>
            <div className="bg-red-500/10 text-red-600 px-6 py-2 rounded-xl font-black text-xs border border-red-500/20 animate-pulse">
               SYSTEM ALERT ACTIVE
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {emergencies.map((e, i) => (
                <div key={i} className={`p-8 rounded-[40px] border shadow-xl relative overflow-hidden group transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0505] border-red-500/20 shadow-red-900/10' : 'bg-white border-red-100'}`}>
                   <div className="absolute top-0 right-0 p-6">
                      <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                        e.severity === 'Critical' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                      }`}>{e.severity}</div>
                   </div>

                   <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 transition-all ${theme === 'dark' ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-600'}`}>
                      <AlertTriangle size={32} />
                   </div>

                   <h3 className={`text-xl font-black text-left ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{e.name} <span className="text-slate-500 ml-1 text-sm font-bold">{e.age}y</span></h3>
                   <p className="text-red-500 font-black text-xs uppercase tracking-widest mt-1 text-left">{e.prob}</p>

                   <div className="mt-8 space-y-4">
                      <div className="flex items-center gap-3 text-slate-400 font-bold text-xs">
                         <Clock size={16}/> Arrived at {e.time}
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 font-bold text-xs text-left">
                         <Stethoscope size={16}/> {e.doc === 'Unassigned' ? <span className="text-red-600 font-black">DOCTOR UNASSIGNED</span> : `Doctor: ${e.doc}`}
                      </div>
                   </div>

                   <div className={`mt-8 pt-8 border-t grid grid-cols-2 gap-4 ${theme === 'dark' ? 'border-white/5' : 'border-slate-50'}`}>
                      <button className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${theme === 'dark' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-900 text-white hover:bg-black'}`}>ASSIGN DOCTOR</button>
                      <button className="bg-red-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                         <Send size={14}/> NOTIFY ER
                      </button>
                   </div>
                </div>
             ))}
          </div>

        </main>
      </div>
    </div>
  );
};

export default EmergencyManagement;
