import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import api from '../../utils/api';
import { safeNum, formatCurrency } from '../../utils/mathUtils';
import {
  Users, Stethoscope, Ticket, Calendar, CheckCircle,
  AlertTriangle, FileText, Monitor, IndianRupee, Shield,
  TrendingUp, Activity, Video, ArrowRight, History as HistoryIcon, ShieldCheck as ShieldCheckIcon
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const store = useStore();
  const user = store.user;
  const theme = store.theme;
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [liveRooms, setLiveRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, roomsRes] = await Promise.all([
        api.get('/admin/dashboard-summary'),
        api.get('/appointments/doctor-queue')
      ]);
      setSummary(summaryRes.data);
      setLiveRooms(Array.isArray(roomsRes.data) ? roomsRes.data.filter(r => r.status === 'Live' || r.status === 'Pending') : []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const revenueData = [
    { name: '01 Oct', rev: 4000 },
    { name: '05 Oct', rev: 7000 },
    { name: '10 Oct', rev: 5500 },
    { name: '15 Oct', rev: 9000 },
    { name: '20 Oct', rev: 12500 },
    { name: '25 Oct', rev: 10000 },
  ];

  const deptData = summary?.deptLoad || [
    { name: 'Cardio', value: 400 },
    { name: 'Neuro', value: 300 },
    { name: 'Gemma', value: 200 },
    { name: 'ENT', value: 150 },
  ];

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'}`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-10 custom-scrollbar relative z-10 flex flex-col">
          <div className="max-w-[1600px] w-full mx-auto flex-1 space-y-6 sm:space-y-10">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6">
              <div className="text-left">
                <h1 className={`text-xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Hospital Command Center</h1>
                <p className="text-slate-500 font-bold uppercase text-[7px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] mt-1">Global management overview for {user?.hospitalName || 'Medi Consult'}</p>
              </div>
              <div className={`px-4 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-[28px] border shadow-sm flex items-center gap-2 sm:gap-4 transition-all duration-500 w-full md:w-auto ${theme === 'dark' ? 'bg-[#0A0A0F] border-white/5' : 'bg-white border-slate-100'}`}>
                 <div className="w-1.5 sm:w-2.5 h-1.5 sm:h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                 <div className="flex flex-col">
                    <span className="text-[7px] sm:text-[10px] font-black text-white uppercase tracking-[0.2em]">System Health: {summary?.systemHealth?.swarmStatus || 'SYNCING'}</span>
                    <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Latency: {summary?.systemHealth?.apiLatency || '...'} • Load: {summary?.systemHealth?.serverLoad || '...'}</span>
                 </div>
              </div>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
              {[
                { label: 'TOTAL PATIENTS', value: safeNum(summary?.totalPatients), icon: Users, color: 'blue' },
                { label: 'ACTIVE DOCTORS', value: safeNum(summary?.totalDoctors), icon: Stethoscope, color: 'emerald' },
                { label: 'PENDING VERIF.', value: safeNum(summary?.pendingVerification), icon: ShieldCheckIcon, color: 'amber' },
                { label: 'OP TOKENS', value: safeNum(summary?.todayTokens), icon: Ticket, color: 'amber' },
              ].map((item, i) => (
                <div key={i} className={`bg-[#0A0A0A] p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-white/5 flex flex-col justify-between min-h-[120px] sm:min-h-[160px] relative overflow-hidden group transition-all duration-500 hover:border-white/10`}>
                  {/* Top Row: Label and Icon */}
                  <div className="flex justify-between items-start relative z-10">
                     <p className="text-[6px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">{item.label}</p>
                     <div className="w-6 h-6 sm:w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                        <item.icon size={10} className="sm:w-3.5" />
                     </div>
                  </div>

                  {/* Bottom Row: Value */}
                  <div className="relative z-10 mt-auto">
                     <h3 className="text-xl sm:text-3xl font-black text-white tracking-tighter leading-none">{item.value}</h3>
                  </div>

                  {/* Corner Glow Effect */}
                  <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full transition-opacity group-hover:opacity-40 ${
                    item.color === 'blue' ? 'bg-blue-600' :
                    item.color === 'emerald' ? 'bg-emerald-600' :
                    item.color === 'amber' ? 'bg-amber-600' : 'bg-rose-600'
                  }`}></div>

                  {/* Bottom Border Glow */}
                  <div className={`absolute bottom-0 left-6 right-6 h-[2px] blur-md opacity-50 ${
                    item.color === 'blue' ? 'bg-blue-500' :
                    item.color === 'emerald' ? 'bg-emerald-500' :
                    item.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                  }`}></div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <div className={`lg:col-span-8 p-6 sm:p-10 rounded-[40px] sm:rounded-[56px] border border-blue-500/20 relative overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0E12]/90' : 'bg-white shadow-sm'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 gap-4">
                     <div className="text-left">
                        <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                           <Video size={20} className="sm:w-6 sm:h-6 text-blue-600" /> Active Video Nodes
                        </h2>
                        <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time consultation monitoring</p>
                     </div>
                     <div className="px-4 py-2 bg-red-500/10 text-red-500 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-red-500/20 w-fit">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div> {liveRooms.length} ACTIVE ROOMS
                     </div>
                  </div>

                  <div className="space-y-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                     {liveRooms.length > 0 ? liveRooms.map((room, i) => (
                        <div key={i} className={`p-4 sm:p-6 border rounded-[24px] sm:rounded-[32px] flex items-center justify-between group transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-blue-500/30' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-blue-200'}`}>
                           <div className="flex items-center gap-4 sm:gap-6 text-left">
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border font-black text-[10px] sm:text-xs transition-all shrink-0 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
                                 #{room.tokenNumber}
                              </div>
                              <div className="overflow-hidden">
                                 <p className={`text-xs sm:text-sm font-black uppercase tracking-tight truncate ${theme === 'dark' ? 'text-zinc-200' : 'text-gray-800'}`}>{room.doctorName || 'Dr. Arjun'} ↔ {room.patientName || 'PATIENT'}</p>
                                 <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">Room: {room.roomCode} • Mode: {room.consultationType}</p>
                              </div>
                           </div>
                           <button className={`p-3 sm:p-4 border rounded-xl sm:rounded-2xl transition-all active:scale-90 shadow-sm shrink-0 ${theme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-500 hover:text-blue-400' : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600'}`}>
                              <Monitor size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                           </button>
                        </div>
                     )) : (
                       <div className="py-16 sm:py-20 text-center space-y-4">
                          <Video size={40} className="sm:w-12 sm:h-12 text-slate-100 opacity-20 mx-auto" />
                          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">No active neural streams</p>
                       </div>
                     )}
                  </div>

                  {/* VIDEO HISTORY LOG */}
                  <div className="mt-12 pt-8 border-t border-white/5 text-left">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <HistoryIcon size={14} /> Global Session Archive
                     </h3>
                     <div className="space-y-3">
                        {[
                           { pat: 'Manjunadha', doc: 'Dr. Arjun', date: '2024-10-25', dur: '15m', type: 'Video' },
                           { pat: 'Sravani G', doc: 'Dr. Priya', date: '2024-10-25', dur: '10m', type: 'Video' },
                           { pat: 'Rajesh K', doc: 'Dr. Sneha', date: '2024-10-24', dur: '22m', type: 'In-person' },
                        ].map((log, i) => (
                           <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                              <div className="text-left">
                                 <p className="text-[10px] font-black text-white uppercase tracking-tight">{log.pat} ↔ {log.doc}</p>
                                 <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">{log.date} • {log.dur} Duration</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${log.type === 'Video' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`}>
                                 {log.type}
                              </span>
                           </div>
                        ))}
                     </div>
                  </div>
              </div>

              <div className={`lg:col-span-4 p-6 sm:p-10 rounded-[40px] sm:rounded-[56px] border border-blue-500/20 flex flex-col transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0E12]/90' : 'bg-white shadow-sm'}`}>
                  <h2 className={`text-lg sm:text-xl font-black uppercase tracking-tight mb-8 sm:mb-10 flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                     <Activity size={20} className="sm:w-6 sm:h-6 text-blue-600" /> Department Load
                  </h2>
                  <div className="flex-1 flex items-center justify-center relative min-h-[250px] sm:min-h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={deptData} innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value" stroke="none">
                            {deptData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                        <span className={`text-2xl sm:text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>84%</span>
                        <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
                     {deptData.map((d, i) => (
                        <div key={i} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-xl sm:rounded-2xl transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                           <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shadow-lg shrink-0" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                           <div className="text-left overflow-hidden">
                              <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">{d.name}</p>
                              <p className={`text-[10px] sm:text-xs font-black mt-0.5 sm:mt-1 ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>{d.value} Nodes</p>
                           </div>
                        </div>
                     ))}
                  </div>
              </div>
            </div>

            <div className={`p-6 sm:p-10 lg:p-12 rounded-[40px] sm:rounded-[56px] border border-blue-500/20 transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0E12]/90' : 'bg-white shadow-sm'}`}>
               <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 gap-6">
                  <div className="text-left">
                     <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Revenue Biometrics</h2>
                     <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Financial growth cycle monitoring</p>
                  </div>
                  <button
                    onClick={() => navigate('/admin/audit-logs')}
                    className={`flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all w-full sm:w-auto ${theme === 'dark' ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-black'}`}
                  >
                     Full Audit <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>
               </div>
               <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={revenueData}>
                       <defs>
                         <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                           <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1E293B' : '#F1F5F9'} />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, sm: 10, fontWeight: '900', fill: '#94A3B8'}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, sm: 10, fontWeight: '900', fill: '#94A3B8'}} />
                       <Tooltip contentStyle={{borderRadius: '16px', border: 'none', backgroundColor: theme === 'dark' ? '#0F172A' : '#fff', color: theme === 'dark' ? '#fff' : '#000', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px'}} />
                       <Area type="monotone" dataKey="rev" stroke="#2563EB" strokeWidth={4} sm:strokeWidth={6} fillOpacity={1} fill="url(#colorRev)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

          </div>

          <div className="mt-20 shrink-0">
             <Footer />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
