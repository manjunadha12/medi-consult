import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  Activity, Thermometer, Droplets, Heart, Plus, Brain,
  Loader2, Calendar, TrendingUp, X, Download, Shield,
  Zap, AlertCircle, Trash2, CheckCircle, Scale, Wind, FileText, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import useStore from '../../store/useStore';

const HealthProgress = () => {
  const { user, theme } = useStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('week');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAddLog, setShowAddLog] = useState(false);
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanSummary, setCleanSummary] = useState(null);

  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    bp_systolic: 120,
    bp_diastolic: 80,
    temperature: 98.6,
    heartbeat: 72,
    sugar: 100,
    oxygen: 98,
    weight: 70
  });

  useEffect(() => {
    if (user?.userId) {
      fetchLogs();
    }
  }, [range, user?.userId]);

  const fetchLogs = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/health/logs/${user.userId}?range=${range}`);
      const formatted = Array.isArray(data) ? data.map(l => ({
        ...l,
        day: new Date(l.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
      })) : [];
      setLogs(formatted);
    } catch (error) {
      toast.error("Failed to load health data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!user?.userId) return toast.error("Please login again");

    try {
      await api.post('/health/log', { ...newLog, patientId: user.userId });
      toast.success("Health data synchronized!");
      setShowAddLog(false);
      fetchLogs();
    } catch (error) {
      toast.error("Failed to save data");
    }
  };

  const runAiAnalysis = async () => {
    if (logs.length === 0) return toast.error("No data to analyze");
    setAnalyzing(true);
    try {
      const { data } = await api.post('/health/analyze', { logs });
      setAiResult(data);
      toast.success("AI Synthesis Complete");
    } catch (error) {
      toast.error("AI Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCleanData = async () => {
    setCleaning(true);
    try {
      const { data } = await api.post(`/health/clean/${user.userId}`);
      setCleanSummary(data.summary);
      toast.success("Data Optimized");
      fetchLogs();
    } catch (error) {
      toast.error("Cleanup failed");
    } finally {
      setCleaning(false);
    }
  };

  const handleClearAll = async () => {
    if (!user?.userId) return toast.error("User node not found");
    if (!window.confirm("CRITICAL ACTION: Purge all health records from node memory? This cannot be undone.")) return;
    setCleaning(true);
    try {
      await api.delete(`/health/all/${user.userId}`);
      toast.success("Node Memory Purged");
      setLogs([]);
      setAiResult(null);
    } catch (error) {
      toast.error("Purge failed");
    } finally {
      setCleaning(false);
      setShowCleanModal(false);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return toast.error("No data to export");

    const headers = ["Date", "Systolic BP", "Diastolic BP", "Oxygen %", "Heart Rate (BPM)", "Weight (kg)", "Sugar (mg/dL)", "BMI"];
    const rows = logs.map(l => [
      new Date(l.date).toLocaleDateString(),
      l.bp_systolic,
      l.bp_diastolic,
      l.oxygen,
      l.heartbeat,
      l.weight,
      l.sugar,
      calculateBMI(l.weight)
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + `Patient Name: ${user?.name}, Patient ID: ${user?.userId}\n`
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Health_History_${user?.userId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Downloaded");
  };

  const handleDownloadPDF = () => {
    toast.loading("Preparing Diagnostic Report...");
    setTimeout(() => {
        window.print();
        toast.dismiss();
    }, 1000);
  };

  const getAverage = (key) => {
    if (!logs || logs.length === 0) return 0;
    const sum = logs.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0);
    const avg = sum / logs.length;
    return isNaN(avg) ? 0 : Math.round(avg);
  };

  const calculateBMI = (weight) => {
      const heightInMeters = 1.75;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-300' : 'bg-[#F8FAFC] text-slate-600'} text-left print:bg-white print:text-black`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="print:hidden">
            <Navbar />
        </div>

        <main className="p-4 md:p-8 lg:p-10 overflow-y-auto custom-scrollbar pb-32">

          <div className="hidden print:block mb-10 border-b-4 border-blue-600 pb-6 text-left">
              <div className="flex justify-between items-start">
                  <div>
                      <h1 className="text-4xl font-black uppercase text-blue-600">Medi Consult</h1>
                      <p className="text-xs font-bold tracking-widest text-slate-500">NEURAL DIAGNOSTIC REPORT</p>
                  </div>
                  <div className="text-right">
                      <p className="text-sm font-black">Patient: {user?.name}</p>
                      <p className="text-xs text-slate-500">ID: {user?.userId}</p>
                      <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString()}</p>
                  </div>
              </div>
          </div>

          <header className="mb-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-30 print:hidden text-left">
            <div className="text-left">
              <h1 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Health Progress</h1>
              <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mt-1">Neural Monitoring Active</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className={`border p-1.5 rounded-2xl flex shadow-sm transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-200'}`}>
                <button onClick={() => setRange('week')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${range === 'week' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Week</button>
                <button onClick={() => setRange('month')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${range === 'month' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Month</button>
                <button onClick={() => setRange('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${range === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>All</button>
              </div>
              <button onClick={() => setShowCleanModal(true)} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${theme === 'dark' ? 'border-white/10 text-zinc-500 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <RefreshCw size={16} className="inline mr-2" /> Optimize
              </button>
              <button onClick={handleClearAll} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white`}>
                <Trash2 size={16} className="inline mr-2" /> Clear All
              </button>
              <button onClick={handleExportCSV} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${theme === 'dark' ? 'border-white/10 text-zinc-500 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <FileText size={16} className="inline mr-2" /> CSV
              </button>
              <button onClick={handleDownloadPDF} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-black transition-all">
                <Download size={16} /> PDF
              </button>
              <button onClick={() => setShowAddLog(true)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-500/20 flex items-center gap-3 hover:bg-blue-500 transition-all active:scale-95">
                <Plus size={18} strokeWidth={3} /> Vitals
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 print:grid-cols-4">
            {[
              { label: 'Avg BP', value: `${getAverage('bp_systolic')}/${getAverage('bp_diastolic')}`, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Avg Oxygen', value: `${getAverage('oxygen')}%`, icon: Wind, color: 'text-cyan-600', bg: 'bg-cyan-50' },
              { label: 'Avg Sugar', value: `${getAverage('sugar')} mg/dL`, icon: Droplets, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Avg Weight', value: `${getAverage('weight')} kg`, icon: Scale, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map((stat, i) => (
              <div key={i} className={`p-6 rounded-[32px] border shadow-sm transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'} print:shadow-none print:border-slate-200`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${theme === 'dark' ? 'bg-white/5' : stat.bg} ${stat.color} print:hidden`}>
                  <stat.icon size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">{stat.label}</p>
                <p className={`text-2xl font-black text-left ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 text-left">
            <div className="lg:col-span-8 space-y-8 text-left">
              <div className={`p-8 rounded-[48px] border shadow-sm transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'} print:shadow-none print:rounded-2xl`}>
                <h3 className={`text-xs font-black uppercase tracking-[0.2em] mb-10 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                   <TrendingUp className="text-blue-600" size={18} /> Vitals Trend
                </h3>
                <div className="h-80 print:h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={logs}>
                      <defs>
                        <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1E293B' : '#F1F5F9'} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: '#94A3B8'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: '#94A3B8'}} />
                      <Tooltip contentStyle={{borderRadius: '24px', backgroundColor: theme === 'dark' ? '#0F172A' : '#fff', border: 'none'}} />
                      <Area type="monotone" dataKey="bp_systolic" name="BP Systolic" stroke="#2563EB" fillOpacity={1} fill="url(#colorBp)" strokeWidth={5} />
                      <Area type="monotone" dataKey="heartbeat" name="Pulse" stroke="#F43F5E" fillOpacity={0} strokeWidth={5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`p-8 rounded-[48px] border shadow-sm ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'} print:block`}>
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-left">Detailed Vital History</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="border-b border-slate-100 dark:border-white/5">
                          <tr className="text-[10px] font-black uppercase text-slate-400">
                             <th className="pb-4">Date</th>
                             <th className="pb-4">BP</th>
                             <th className="pb-4">O2</th>
                             <th className="pb-4">Temp</th>
                             <th className="pb-4">Weight</th>
                             <th className="pb-4">BMI</th>
                             <th className="pb-4">Sugar</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                          {logs.length > 0 ? logs.map((l, i) => (
                             <tr key={i} className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                <td className="py-4">{new Date(l.date).toLocaleDateString()}</td>
                                <td className="py-4 text-blue-500">{l.bp_systolic}/{l.bp_diastolic}</td>
                                <td className="py-4">{l.oxygen}%</td>
                                <td className="py-4">{l.temperature}°F</td>
                                <td className="py-4">{l.weight} kg</td>
                                <td className="py-4">{calculateBMI(l.weight)}</td>
                                <td className="py-4 text-orange-500">{l.sugar}</td>
                             </tr>
                          )) : (
                            <tr>
                               <td colSpan="7" className="py-20 text-center text-zinc-500 italic font-black uppercase text-[10px] tracking-[0.4em]">No Health Logs Found</td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8 print:col-span-12 text-left">
              <div className={`p-8 rounded-[40px] shadow-2xl relative overflow-hidden group transition-all duration-500 ${theme === 'dark' ? 'bg-[#0F1115] border border-white/5' : 'bg-slate-900'} print:bg-white print:text-black print:shadow-none print:border-slate-200`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl print:hidden"></div>
                <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-2 ${theme === 'dark' || !aiResult ? 'text-blue-400' : 'text-blue-600'}`}>
                   <Brain size={16} /> AI Swarm Synthesis
                </h3>

                {aiResult ? (
                  <div className="space-y-8 animate-in fade-in duration-500 text-left">
                     <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-4 print:bg-slate-50">
                        <div className="flex justify-between items-center text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yesterday vs Today</p>
                            <span className="text-xl">{aiResult?.comparison?.statusIcon || '🟡'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-left">
                                <p className="text-[8px] font-black text-slate-500 uppercase">Heart Rate</p>
                                <p className="text-xs font-black">{aiResult?.comparison?.heartRate || 'Stable'}</p>
                            </div>
                            <div className="text-left">
                                <p className="text-[8px] font-black text-slate-500 uppercase">Blood Pressure</p>
                                <p className="text-xs font-black">{aiResult?.comparison?.bp || 'Stable'}</p>
                            </div>
                            <div className="text-left">
                                <p className="text-[8px] font-black text-slate-500 uppercase">Oxygen</p>
                                <p className="text-xs font-black">{aiResult?.comparison?.oxygen || 'Stable'}</p>
                            </div>
                            <div className="text-left">
                                <p className="text-[8px] font-black text-slate-500 uppercase">Weight</p>
                                <p className="text-xs font-black">{aiResult?.comparison?.weight || 'Stable'}</p>
                            </div>
                        </div>
                     </div>

                     <div className="space-y-4 text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weekly Trend Analysis</p>
                        <div className="space-y-2">
                           <div className="flex justify-between text-xs font-bold">
                               <span className="text-slate-500 uppercase">Weekly Score</span>
                               <span className="text-blue-500">{aiResult?.weeklyTrend?.healthScore || '--'}/100</span>
                           </div>
                           <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{width: `${aiResult?.weeklyTrend?.healthScore || 0}%`}}></div>
                           </div>
                           <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{aiResult?.weeklyTrend?.weeklyStatus || 'Active'}</p>
                        </div>
                     </div>

                     <div className="space-y-4 text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Recommendations</p>
                        <div className="space-y-3">
                           {(aiResult?.recommendations || ["Maintain hydration", "Continue walking", "Monitor vitals"]).map((rec, i) => (
                             <div key={i} className="flex gap-3 items-start text-left">
                                <Zap size={14} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-bold leading-relaxed">{rec}</p>
                             </div>
                           ))}
                        </div>
                     </div>

                     <button
                       onClick={() => setAiResult(null)}
                       className="w-full py-4 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all print:hidden"
                     >New Scan</button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className={`text-xs mb-10 leading-relaxed font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>
                      Initialize Swarm analysis on biometric trends.
                    </p>
                    <button
                      onClick={runAiAnalysis}
                      disabled={analyzing || logs.length === 0}
                      className={`w-full py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all disabled:opacity-30 active:scale-95 shadow-2xl ${theme === 'dark' ? 'bg-white text-slate-900 shadow-blue-500/10' : 'bg-white text-slate-900 shadow-blue-600/30'}`}
                    >
                      {analyzing ? <Loader2 className="animate-spin text-blue-600" size={16} /> : <Brain size={16} className="text-blue-600" />}
                      Start Swarm
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {showAddLog && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className={`w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
            <div className={`p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-50 bg-slate-50/50'}`}>
               <h2 className={`text-xl font-black text-slate-800 tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : ''}`}>Manual Synchronization</h2>
               <button onClick={() => setShowAddLog(false)} className={`p-3 rounded-2xl transition-all border ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-100'}`}>
                  <X size={20} strokeWidth={3} />
               </button>
            </div>
            <form onSubmit={handleAddLog} className="p-8 space-y-6">
               <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Archive Date</label>
                  <input required type="date" max={new Date().toISOString().split('T')[0]} className={`w-full p-4 border rounded-2xl font-black text-sm outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-600' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600'}`}
                    value={newLog.date} onChange={(e) => setNewLog({...newLog, date: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">BP Systolic</label>
                    <input required type="number" className={`w-full p-4 border rounded-2xl font-black text-sm outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-inner'}`}
                      value={newLog.bp_systolic} onChange={(e) => setNewLog({...newLog, bp_systolic: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">BP Diastolic</label>
                    <input required type="number" className={`w-full p-4 border rounded-2xl font-black text-sm outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-inner'}`}
                      value={newLog.bp_diastolic} onChange={(e) => setNewLog({...newLog, bp_diastolic: e.target.value})} />
                  </div>
               </div>
               <div className="grid grid-cols-3 gap-4 text-left">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">O2 Level</label>
                    <input required type="number" className={`w-full p-4 border rounded-2xl font-bold text-sm outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      value={newLog.oxygen} onChange={(e) => setNewLog({...newLog, oxygen: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pulse</label>
                    <input required type="number" className={`w-full p-4 border rounded-2xl font-bold text-sm outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      value={newLog.heartbeat} onChange={(e) => setNewLog({...newLog, heartbeat: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Weight kg</label>
                    <input required type="number" step="0.1" className={`w-full p-4 border rounded-2xl font-bold text-sm outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      value={newLog.weight} onChange={(e) => setNewLog({...newLog, weight: e.target.value})} />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temp °F</label>
                    <input required type="number" step="0.1" className={`w-full p-4 border rounded-2xl font-bold text-sm outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      value={newLog.temperature} onChange={(e) => setNewLog({...newLog, temperature: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sugar mg/dL</label>
                    <input type="number" className={`w-full p-4 border rounded-2xl font-bold text-sm outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      value={newLog.sugar} onChange={(e) => setNewLog({...newLog, sugar: e.target.value})} />
                  </div>
               </div>
               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                  Save Entry
               </button>
            </form>
          </div>
        </div>
      )}

      {showCleanModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className={`w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
            <div className="p-10 text-center space-y-8">
               <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[32px] flex items-center justify-center mx-auto border border-red-500/20">
                  <AlertCircle size={32} />
               </div>
               <div className="space-y-2">
                  <h2 className={`text-xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Optimize Archive?</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-tight leading-relaxed px-4">
                     Optimize health records while preserving medical history.
                  </p>
               </div>

               {cleanSummary ? (
                 <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl text-left space-y-3 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase">
                       <CheckCircle size={14} /> {cleanSummary.duplicatesRemoved} Duplicates Removed
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black text-blue-500 uppercase">
                       <CheckCircle size={14} /> {cleanSummary.formattingFixed} Values Adjusted
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 text-center">
                       <button onClick={() => {setShowCleanModal(false); setCleanSummary(null);}} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">Dismiss</button>
                    </div>
                 </div>
               ) : (
                 <div className="flex gap-4">
                    <button onClick={() => setShowCleanModal(false)} className="flex-1 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest border border-slate-200 text-slate-500">Abort</button>
                    <button onClick={handleCleanData} disabled={cleaning} className="flex-1 py-5 bg-red-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/30">
                       {cleaning ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Cleanup"}
                    </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          body { background: white !important; color: black !important; }
          .print-hidden, .print\\:hidden { display: none !important; }
          .print-only { display: block !important; }
          aside, nav, .xl\\:col-span-4, button, header { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #eee !important; padding: 10px !important; }
        }
      `}</style>
    </div>
  );
};

export default HealthProgress;
