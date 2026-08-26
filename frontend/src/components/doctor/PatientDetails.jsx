import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import api, { BACKEND_URL } from '../../utils/api';
import useStore from '../../store/useStore';
import {
  User as UserIcon, Calendar, Activity, FileText, Pill,
  ChevronLeft, ChevronRight, ArrowRight, Star, AlertTriangle,
  History as HistoryIcon, CreditCard, Brain, Download, ExternalLink, Loader2, CheckCircle,
  MessageSquare, UserPlus, TrendingUp, ClipboardList, Video
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { toast } from 'react-hot-toast';
import DiagnosisSection from './DiagnosisSection';

const PatientDetails = () => {
  const { patientId } = useParams();
  const store = useStore();
  const currentUser = store.user;
  const theme = store.theme;

  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    setLoading(true);
    try {
      const endpoint = currentUser?.role === 'admin' ? `/admin/patient/${patientId}` : `/doctor/patient/${patientId}`;
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error("[PATIENT_DETAILS_SYNC_ERROR]:", err);
      const msg = err.response?.data?.message || err.message;
      toast.error(`Archive Sync Failed: ${msg}`);
      // navigate(currentUser?.role === 'admin' ? '/admin/patients' : '/doctor/search');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className={`flex h-screen items-center justify-center neural-grid ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#F8FAFC]'}`}>
       <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

  if (!data) return null;

  const { user, profile, reports = [], prescriptions = [], consultations = [], diagnoses = [], healthLogs = [] } = data;

  const chartData = [...healthLogs].reverse().map(l => ({
    day: new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bp: l.bp_systolic,
    hr: l.heartbeat,
    o2: l.oxygen
  }));

  const tabs = [
    { id: 'summary', label: 'Neural Summary', icon: Brain },
    { id: 'diagnosis', label: 'Diagnosis Nodes', icon: ClipboardList },
    { id: 'history', label: 'Clinical Archive', icon: HistoryIcon },
    { id: 'calls', label: 'Video Logs', icon: Video },
    { id: 'reports', label: 'Lab Objects', icon: FileText },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  ];

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left neural-grid pb-24 ${
      theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'
    }`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-8 lg:p-10 overflow-y-auto custom-scrollbar relative z-10">

          <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center gap-3 px-5 py-2.5 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${
                theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-blue-400' : 'bg-white border-slate-200 text-slate-500 hover:text-blue-600'
              }`}
            >
              <ChevronLeft size={16} strokeWidth={3} /> {currentUser?.role === 'admin' ? 'Return to Directory' : 'Return to Queue'}
            </button>

            {currentUser?.role === 'doctor' && (
              <div className="flex gap-4">
                <button
                  onClick={() => navigate(`/doctor/referral?patientId=${patientId}`)}
                  className="bg-amber-500/10 text-amber-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-3 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                >
                  <UserPlus size={16} strokeWidth={3} /> Collaborative Review
                </button>
                <button
                  onClick={() => navigate(`/doctor/prescription?patientId=${patientId}`)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95 border border-blue-400/20"
                >
                  Synthesize Prescription
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            <div className="lg:col-span-4 space-y-8">
              <div className={`p-10 rounded-[48px] border backdrop-blur-3xl shadow-sm text-center relative overflow-hidden group noise-overlay transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0E12]/90 border-white/5 shadow-black/50' : 'bg-white border-slate-100'}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/15 transition-all"></div>

                <div className="relative z-10 text-center flex flex-col items-center">
                  <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center text-blue-400 mx-auto mb-6 shadow-inner border transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5' : 'bg-blue-50 border-blue-100'}`}>
                    <UserIcon size={40} />
                  </div>
                  <h2 className={`text-2xl font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{user.name}</h2>
                  <p className="text-blue-400 font-black text-xs tracking-[0.3em] mt-3">{user.patientId}</p>

                  <div className="flex justify-center gap-3 mt-8">
                    <div className={`px-5 py-2 rounded-2xl transition-all ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
                       <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Age Node</p>
                       <p className={`text-xs font-black ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-700'}`}>{profile?.age || 25} YEARS</p>
                    </div>
                    <div className={`px-5 py-2 rounded-2xl transition-all ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
                       <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Gender</p>
                       <p className={`text-xs font-black uppercase ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-700'}`}>{profile?.gender || 'MALE'}</p>
                    </div>
                  </div>

                  <div className={`mt-10 pt-8 border-t text-left space-y-6 w-full ${theme === 'dark' ? 'border-white/5' : 'border-slate-50'}`}>
                    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                       <div className="flex items-center gap-3">
                          <CreditCard size={16} className="text-zinc-500" />
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Blood Type</span>
                       </div>
                       <span className="text-xs font-black text-red-500 uppercase">{profile?.bloodGroup || 'O+'}</span>
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                       <div className="flex items-center gap-3">
                          <Activity size={16} className="text-zinc-500" />
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Archive Sync</span>
                       </div>
                       <span className="text-xs font-black text-emerald-500 uppercase">ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-[40px] shadow-2xl space-y-6 border transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                 <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 ml-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    <Activity size={16} className="text-blue-500" /> TELEMETRY
                 </h3>
                 <div className="grid grid-cols-2 gap-3">
                    <div className={`p-5 rounded-[24px] border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                       <p className="text-[8px] text-zinc-500 font-black uppercase mb-1">Recovery Score</p>
                       <p className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>85%</p>
                    </div>
                    <div className={`p-5 rounded-[24px] border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                       <p className="text-[8px] text-zinc-500 font-black uppercase mb-1">Pain Vector</p>
                       <p className="text-xl text-emerald-400 font-black">LOW</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-10">

              <div className={`p-2 rounded-[32px] border backdrop-blur-3xl flex gap-2 overflow-x-auto custom-scrollbar transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 min-w-[140px] ${
                      activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : theme === 'dark' ? 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon size={16} strokeWidth={2.5} /> {tab.label}
                  </button>
                ))}
              </div>

              <div className={`p-10 rounded-[56px] border backdrop-blur-3xl shadow-sm min-h-[540px] relative overflow-hidden text-left transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>

                {activeTab === 'summary' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 relative z-10">
                    <div className={`p-8 border rounded-[40px] flex items-start gap-6 transition-all ${theme === 'dark' ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50/50 border-blue-100'}`}>
                      <div className="w-16 h-16 bg-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-blue-500/20 shrink-0">
                        <Brain size={32} strokeWidth={2.5} />
                      </div>
                      <div className="text-left">
                        <h3 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Clinical Neural Synthesis</h3>
                        <p className={`text-sm font-medium italic leading-relaxed mt-3 ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>
                          "Archive synchronization complete for {user.patientId}. System identifies persistent fatigue patterns. Correlated with last ECG node - results optimal. Recommend thyroid cluster review if symptoms persist."
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className={`p-8 border rounded-[40px] transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                        <h4 className="font-black text-[10px] text-zinc-500 uppercase mb-6 tracking-widest flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /> Active Concerns</h4>
                        <ul className="space-y-4">
                          <li className={`flex items-center gap-3 text-xs font-black uppercase tracking-tight ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Systolic Variance: 128 (Sync required)
                          </li>
                          <li className={`flex items-center gap-3 text-xs font-black uppercase tracking-tight ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Glucose: 110 mg/dL (Baseline)
                          </li>
                        </ul>
                      </div>
                      <div className={`p-8 border rounded-[40px] transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                        <h4 className="font-black text-[10px] text-zinc-500 uppercase mb-6 tracking-widest flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Care Directives</h4>
                        <p className="text-[10px] font-bold text-zinc-400 leading-loose uppercase tracking-widest text-left">
                          1. Initialize thyroid screening.<br/>
                          2. Maintain current glucose loop.<br/>
                          3. Monitor heart rate during sleep cycle.
                        </p>
                      </div>
                    </div>

                    <div className={`p-8 border rounded-[40px] space-y-8 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                       <h4 className="font-black text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14} className="text-blue-500" /> Biometric Trend Analysis</h4>
                       <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={chartData}>
                                <defs>
                                   <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                                   </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1E293B' : '#CBD5E1'} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: '900', fill: '#475569'}} />
                                <YAxis hide />
                                <Tooltip contentStyle={{borderRadius: '16px', backgroundColor: theme === 'dark' ? '#0A0A0A' : '#fff', border: theme === 'dark' ? '1px solid #1E293B' : '1px solid #E2E8F0', fontSize: '10px'}} />
                                <Area type="monotone" dataKey="bp" name="Systolic BP" stroke="#2563EB" fillOpacity={1} fill="url(#colorBp)" strokeWidth={3} />
                                <Area type="monotone" dataKey="hr" name="Pulse" stroke="#F43F5E" fillOpacity={0} strokeWidth={3} />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'diagnosis' && (
                   <DiagnosisSection patientId={patientId} patientName={user.name} initialHistory={diagnoses} onRecordAdded={fetchPatient} />
                )}

                {activeTab === 'history' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 relative z-10">
                     {consultations?.length > 0 ? consultations.map((c, i) => (
                       <div key={i} className={`border rounded-[32px] p-8 space-y-4 group transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-blue-500/30' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'}`}>
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <div className={`w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]`}></div>
                                <h4 className={`text-sm font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{c.diagnosis || 'Clinical Review'}</h4>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${c.consultationType === 'Video' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`}>
                                   {c.consultationType || 'In-Person'}
                                </span>
                             </div>
                             <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{new Date(c.date).toLocaleDateString()}</span>
                          </div>
                          <p className={`text-xs font-medium leading-relaxed italic text-left ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>"{c.notes || 'Routine consultation finalized with standard markers.'}"</p>
                       </div>
                     )) : (
                       <div className="py-20 text-center space-y-4">
                          <HistoryIcon size={48} className="text-zinc-700 mx-auto opacity-20" />
                          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em]">Historical Archive Empty</p>
                       </div>
                     )}
                  </div>
                )}

                {activeTab === 'calls' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 relative z-10">
                     {consultations.filter(c => c.consultationType === 'Video').length > 0 ? consultations.filter(c => c.consultationType === 'Video').map((c, i) => (
                       <div key={i} className={`border rounded-[32px] p-8 flex items-center justify-between group transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-blue-500/30' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'}`}>
                          <div className="flex items-center gap-6 text-left">
                             <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-500 shrink-0">
                                <Video size={28} />
                             </div>
                             <div>
                                <h4 className={`text-base font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Video Session #{c.roomCode || 'N/A'}</h4>
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">
                                   Duration: {c.duration || '12'} mins • {new Date(c.date).toLocaleDateString()} AT {c.time || '10:00 AM'}
                                </p>
                             </div>
                          </div>
                          <button className={`p-4 rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-cyan-400' : 'bg-white border border-slate-200 text-slate-400 hover:text-cyan-600'}`}>
                             <ExternalLink size={20} />
                          </button>
                       </div>
                     )) : (
                       <div className="py-24 text-center opacity-30">
                          <Video size={64} className="mx-auto mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No Video Call Logs Recorded</p>
                       </div>
                     )}
                  </div>
                )}

                {activeTab === 'reports' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700 relative z-10">
                    {reports?.length > 0 ? reports.map((report, i) => (
                      <div key={i} className={`flex items-center justify-between p-6 border rounded-[32px] group transition-all shadow-sm ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-blue-500/30 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'}`}>
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/10 text-zinc-500 group-hover:text-blue-400' : 'bg-white border-slate-200 text-slate-300 group-hover:text-blue-500'}`}>
                            <FileText size={28} />
                          </div>
                          <div className="text-left">
                            <p className={`text-base font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{report.fileName}</p>
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">{report.category} • {new Date(report.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button className={`p-4 rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800' : 'bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}><Download size={20} /></button>
                          <a href={`${BACKEND_URL}${report.fileUrl}`} target="_blank" rel="noreferrer" className={`p-4 rounded-2xl transition-all shadow-sm flex items-center justify-center ${theme === 'dark' ? 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800' : 'bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}><ExternalLink size={20} /></a>
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center space-y-4">
                        <FileText size={48} className="text-zinc-700 mx-auto opacity-20" />
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em]">Lab Objects Empty</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'prescriptions' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 relative z-10 text-left">
                    {prescriptions?.length > 0 ? prescriptions.map((p, i) => (
                      <div key={i} className={`border rounded-[40px] overflow-hidden shadow-sm transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-blue-500/30' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg'}`}>
                        <div className={`p-6 border-b flex justify-between items-center px-8 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                          <p className="font-black text-[9px] text-blue-500 uppercase tracking-[0.2em]">Issued Node: {new Date(p.createdAt).toLocaleDateString()}</p>
                          <button className={`px-6 py-2 border text-[9px] font-black uppercase tracking-widest rounded-xl shadow-sm transition-all flex items-center gap-2 ${theme === 'dark' ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800' : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}>Access Archive <Download size={12} /></button>
                        </div>
                        <div className="p-8 px-10">
                          <h4 className={`text-sm font-black uppercase tracking-tight mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Diagnostic Synthesis: {p.diagnosis}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {p.medicines && p.medicines.map((m, j) => (
                              <div key={j} className={`flex items-center gap-4 p-5 rounded-[24px] border shadow-sm group transition-all ${theme === 'dark' ? 'bg-zinc-900/50 border-white/5 hover:border-blue-500/20' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-blue-200'}`}>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                   <Pill size={18} />
                                </div>
                                <div className="text-left">
                                   <p className={`text-xs font-black uppercase tracking-tight ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-700'}`}>{m.name}</p>
                                   <p className="text-[8px] font-bold text-zinc-500 uppercase mt-0.5">{m.dosage || '1 tab'} • {m.frequency || m.timing || '1-0-1'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center space-y-4">
                         <Pill size={48} className="text-zinc-700 mx-auto opacity-20" />
                         <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em]">Prescription Archive Empty</p>
                      </div>
                    )}
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

export default PatientDetails;
