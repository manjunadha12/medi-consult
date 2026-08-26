import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import api from '../../utils/api';
import { safeNum } from '../../utils/mathUtils';
import {
  Search as SearchIcon, Users, Calendar, Clock, Activity, AlertCircle,
  Video, FileText, CheckCircle, TrendingUp, Phone as PhoneIcon,
  Stethoscope, Mail, ChevronRight, User as UserIcon, MoreVertical, Brain, History as HistoryIcon, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const DocDashboard = () => {
  const { user } = useStore();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState(null);
  const [availability, setAvailability] = useState('Available');
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, profileRes, queueRes] = await Promise.all([
        api.get('/doctor/dashboard-summary').catch(() => ({ data: {} })),
        api.get('/doctor/profile').catch(() => ({ data: {} })),
        api.get('/appointments/doctor-queue').catch(() => ({ data: [] }))
      ]);
      setSummary(summaryRes.data);
      setProfile(profileRes.data);
      setAvailability(profileRes.data?.availabilityStatus || 'Available');
      setQueue(Array.isArray(queueRes.data) ? queueRes.data : []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = async (status) => {
    try {
      await api.post('/doctor/update-availability', { status });
      setAvailability(status);
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-300 text-left neural-grid pb-24">
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar relative z-10">
          <div className="max-w-[1600px] mx-auto flex flex-col min-h-full">
            <div className="flex-1 space-y-6 lg:space-y-10">

              {/* Welcome Panel */}
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                <div className="flex-1 bg-zinc-950/80 backdrop-blur-3xl p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-blue-500/20 flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative overflow-hidden group noise-overlay">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/15 transition-all"></div>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 border border-white/5 rounded-2xl sm:rounded-[32px] flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                    <Stethoscope size={40} className="sm:w-12 sm:h-12" />
                  </div>
                  <div className="flex-1 overflow-hidden relative z-10 text-center md:text-left">
                    <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight truncate">Welcome, {user?.name || 'Doctor'}</h1>
                    {(!user?.name || user.name === 'undefined') && (
                       <p className="text-amber-500 text-[8px] font-black uppercase tracking-widest animate-pulse">Neural Identity Unverified. Please Re-login.</p>
                    )}
                    <p className="text-zinc-500 font-bold uppercase text-[8px] sm:text-[10px] tracking-widest mt-1 truncate">{profile?.specialization || 'Consultant'} • {profile?.hospitalName || 'Medi Consult Hospital'}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 sm:gap-6 mt-4 sm:mt-6">
                      <span className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase text-zinc-400 tracking-widest"><Mail size={12} className="text-blue-400" /> {user?.email}</span>
                      <span className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase text-zinc-400 tracking-widest"><Activity size={12} className="text-blue-400" /> {profile?.department || 'OPD'}</span>
                      <button onClick={() => navigate('/doctor/network')} className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 tracking-widest transition-colors"><Users size={12}/> Network Node</button>
                    </div>
                  </div>
                  <div className="text-center md:text-right space-y-2 sm:space-y-3 shrink-0 relative z-10 w-full md:w-auto">
                    <p className="text-[8px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Status Node</p>
                    <select
                      value={availability}
                      onChange={(e) => handleAvailabilityChange(e.target.value)}
                      className={`w-full md:w-auto px-4 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest outline-none border transition-all cursor-pointer shadow-sm ${
                        availability === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        availability === 'Busy' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-zinc-900 text-zinc-400 border-white/5'
                      }`}
                    >
                      <option value="Available" className="bg-zinc-950 text-zinc-300">Available</option>
                      <option value="Busy" className="bg-zinc-950 text-zinc-300">Busy</option>
                      <option value="On Break" className="bg-zinc-950 text-zinc-300">On Break</option>
                      <option value="Offline" className="bg-zinc-950 text-zinc-300">Offline</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                {[
                  { label: 'TOTAL OP TODAY', value: safeNum(summary?.totalOpToday), icon: Users, color: 'blue' },
                  { label: 'PATIENTS WAITING', value: safeNum(summary?.patientsWaiting), icon: Clock, color: 'amber' },
                  { label: 'COMPLETED TODAY', value: safeNum(summary?.completedToday), icon: CheckCircle, color: 'emerald' },
                  { label: 'EMERGENCY CASES', value: safeNum(summary?.emergencyCases), icon: AlertCircle, color: 'red' },
                ].map((item, i) => (
                  <div key={i} className={`bg-[#0A0A0A] p-6 sm:p-8 rounded-[32px] border border-white/5 flex flex-col justify-between min-h-[160px] relative overflow-hidden group transition-all duration-500 hover:border-white/10`}>
                    <div className="flex justify-between items-start relative z-10">
                       <p className="text-[7px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">{item.label}</p>
                       <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                          <item.icon size={14} />
                       </div>
                    </div>
                    <div className="relative z-10 mt-auto">
                       <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-none">{item.value}</h3>
                    </div>
                    <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full transition-opacity group-hover:opacity-40 ${
                      item.color === 'blue' ? 'bg-blue-600' :
                      item.color === 'amber' ? 'bg-amber-600' :
                      item.color === 'emerald' ? 'bg-emerald-600' : 'bg-red-600'
                    }`}></div>
                    <div className={`absolute bottom-0 left-6 right-6 h-[2px] blur-md opacity-50 ${
                      item.color === 'blue' ? 'bg-blue-500' :
                      item.color === 'amber' ? 'bg-amber-500' :
                      item.color === 'emerald' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                ))}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="lg:col-span-2 bg-zinc-950/80 rounded-[32px] sm:rounded-[48px] shadow-sm border border-blue-500/20 overflow-hidden noise-overlay flex flex-col">
                  <div className="p-6 sm:p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5">
                    <div className="text-left">
                       <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Active Consultation Queue</h2>
                       <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Real-time Patient Sync</p>
                    </div>
                    <button
                      onClick={() => navigate('/doctor/queue')}
                      className="text-blue-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:underline"
                    >View All Archive</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-white/5 text-zinc-500 uppercase text-[8px] sm:text-[9px] font-black tracking-[0.2em]">
                        <tr>
                          <th className="px-6 sm:px-8 py-4 sm:py-5">Token</th>
                          <th className="px-6 sm:px-8 py-4 sm:py-5">Patient Node</th>
                          <th className="px-6 sm:px-8 py-4 sm:py-5">Symptom Synthesis</th>
                          <th className="px-6 sm:px-8 py-4 sm:py-5">Status</th>
                          <th className="px-6 sm:px-8 py-4 sm:py-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {queue.length > 0 ? queue.map((p, i) => (
                          <tr key={i} className={`hover:bg-white/5 transition-all ${p.isEmergency ? 'bg-red-500/5' : ''}`}>
                            <td className="px-6 sm:px-8 py-6 sm:py-8">
                               <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-base sm:text-lg border-2 ${p.isEmergency ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                  #{p.tokenNumber}
                               </div>
                            </td>
                            <td className="px-6 sm:px-8 py-6 sm:py-8">
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 rounded-lg sm:rounded-xl flex items-center justify-center text-zinc-400 font-black text-[10px] border border-white/10 shadow-inner shrink-0">
                                  {p.patientName?.charAt(0) || 'P'}
                                </div>
                                <div className="overflow-hidden text-left">
                                  <p className="font-black text-xs sm:text-sm text-white uppercase tracking-tight truncate">{p.patientName}</p>
                                  <p className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest">{p.patientId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 sm:px-8 py-6 sm:py-8 text-left">
                               <p className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-tight truncate max-w-[120px] sm:max-w-[150px]">{p.problemDescription}</p>
                               <p className="text-[8px] sm:text-[9px] font-black text-zinc-500 uppercase mt-2 flex items-center gap-1.5"><Clock size={10}/> Sync: {p.time}</p>
                            </td>
                            <td className="px-6 sm:px-8 py-6 sm:py-8">
                              <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border ${
                                p.status === 'Live' ? 'bg-red-600 text-white border-red-500 animate-pulse' :
                                p.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-6 sm:px-8 py-6 sm:py-8 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                   onClick={() => navigate(`/doctor/voice-consult?roomCode=${p._id}&appointmentId=${p._id}&peerId=${p.patientId}&peerName=${p.patientName}`)}
                                   className="bg-blue-600/10 border border-blue-500/20 text-blue-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-lg"
                                   title="Voice Link"
                                >
                                  <PhoneIcon size={12} strokeWidth={3} className="sm:w-3.5 sm:h-3.5" />
                                </button>

                                {p.isMeetingReady ? (
                                  <button
                                     onClick={() => navigate(`/doctor/video-consult?roomCode=${p._id}&appointmentId=${p._id}&peerId=${p.patientId}&peerName=${p.patientName}`)}
                                     className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center gap-2 active:scale-95"
                                  >
                                    <Video size={12} strokeWidth={3} className="sm:w-3.5 sm:h-3.5" /> JOIN
                                  </button>
                                ) : (
                                  <button
                                     onClick={() => navigate('/doctor/queue')}
                                     className="bg-white/5 border border-white/10 text-zinc-500 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center gap-2"
                                  >
                                    <Settings size={12} /> SETUP
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="px-6 sm:px-8 py-16 sm:py-20 text-center text-zinc-500 italic font-black uppercase text-[10px] tracking-[0.4em]">Neural Queue Empty</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6 lg:gap-8 flex flex-col">
                  <div className="bg-zinc-950/80 p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] shadow-sm border border-blue-500/20 noise-overlay">
                    <h2 className="text-[11px] sm:text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                       <Activity size={16} className="sm:w-[18px] sm:h-[18px] text-blue-400" /> Diagnostics Flow
                    </h2>
                    <div className="h-40 sm:h-48 flex items-center justify-center bg-white/5 rounded-2xl sm:rounded-[32px] border-2 border-dashed border-white/10">
                       <div className="text-center p-4">
                          <TrendingUp size={28} className="sm:w-8 sm:h-8 text-zinc-700 mx-auto mb-3" />
                          <p className="text-[8px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">Neural Analytics<br/>Real-time active</p>
                       </div>
                    </div>
                  </div>

                  <div className="bg-zinc-950/80 p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-2xl text-zinc-300 relative overflow-hidden group border border-purple-500/30 noise-overlay flex-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-600/20 transition-all duration-700"></div>
                    <div className="flex items-center gap-3 mb-6 relative z-10 text-left">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                        <Brain size={20} className="sm:w-6 sm:h-6 text-blue-400" />
                      </div>
                      <div className="overflow-hidden">
                         <h2 className="text-[11px] sm:text-sm font-black uppercase tracking-widest text-white truncate">Ask Medi AI</h2>
                         <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.3em] mt-0.5 truncate">Clinical Swarm Active</p>
                      </div>
                    </div>
                    <p className="text-[10px] sm:text-xs text-zinc-400 mb-8 leading-relaxed italic font-medium relative z-10 text-left">
                      "PAT1001 exhibits biomarkers consistent with systemic fatigue. Review iron levels."
                    </p>
                    <div className="relative z-10">
                      <input
                        type="text"
                        placeholder="ENTER QUERY..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && navigate('/doctor/chat', { state: { initialMsg: input } })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs outline-none placeholder:text-zinc-750 font-black tracking-widest focus:border-blue-500/50 transition-all text-zinc-250 shadow-inner"
                      />
                      <button
                        onClick={() => navigate('/doctor/chat', { state: { initialMsg: input } })}
                        className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 p-1.5 sm:p-2 bg-blue-600 text-white rounded-lg sm:rounded-xl shadow-lg hover:bg-blue-500 active:scale-90 transition-all"
                      >
                        <SearchIcon size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={3} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-zinc-950/80 p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] shadow-sm border border-emerald-500/20 noise-overlay">
                    <div className="flex items-center justify-between mb-6">
                       <h2 className="text-[11px] sm:text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                          <HistoryIcon size={16} className="sm:w-[18px] sm:h-[18px] text-blue-400" /> Recent History
                       </h2>
                       <button onClick={() => navigate('/doctor/history')} className="text-blue-400 text-[8px] font-black uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                       {queue.filter(p => p.status === 'Completed').slice(0, 3).map((item, i) => (
                          <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                             <div className="text-left overflow-hidden">
                                <p className="text-[10px] font-black text-white truncate uppercase">{item.patientName}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase">{item.diagnosis || 'General Checkup'}</p>
                             </div>
                             <ChevronRight size={14} className="text-zinc-600" />
                          </div>
                       ))}
                       {queue.filter(p => p.status === 'Completed').length === 0 && (
                          <p className="text-[9px] font-black text-zinc-650 uppercase italic text-center py-4">No recent history nodes</p>
                       )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-20 shrink-0">
                 <Footer />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocDashboard;
