import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  Activity, Thermometer, Droplets, Heart, Plus, Brain,
  Loader2, Calendar, TrendingUp, X, Download, Shield,
  Zap, AlertCircle, Trash2, CheckCircle, Scale, Wind, FileText, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import useStore from '../../store/useStore';

const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const HealthProgress = () => {
  const { user, theme } = useStore();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('week');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [showAddLog, setShowAddLog] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeRange, setPurgeRange] = useState('today');
  const [clearing, setClearing] = useState(false);

  const getInitialLogState = () => ({
    date: new Date().toISOString().split('T')[0],
    time: getCurrentTime(),
    sessionTag: 'Morning',
    bp_systolic: '',
    bp_diastolic: '',
    temperature: '',
    heartbeat: '',
    sugar: '',
    oxygen: '',
    weight: '',
    notes: ''
  });

  const [newLog, setNewLog] = useState(getInitialLogState());

  useEffect(() => {
    if (user?.userId) {
      fetchLogs();
    }
  }, [range, user?.userId]);

  const evaluateBaselineFromLogs = (logsList = []) => {
    if (!logsList || logsList.length === 0) return null;
    const latest = logsList[logsList.length - 1];
    if (!latest) return null;

    let baseScore = 100;
    let isNormal = true;
    let status = 'Biological Sync Stabilized';

    if (
      Number(latest.bp_systolic) > 140 ||
      Number(latest.bp_diastolic) > 90 ||
      (Number(latest.oxygen) > 0 && Number(latest.oxygen) < 90) ||
      Number(latest.sugar) > 180 ||
      Number(latest.temperature) > 100.5
    ) {
      isNormal = false;
      baseScore = 65;
      status = 'Physiological Vitals Alert';
    } else if (
      Number(latest.bp_systolic) > 125 ||
      Number(latest.bp_diastolic) > 85 ||
      (Number(latest.oxygen) > 0 && Number(latest.oxygen) < 95) ||
      Number(latest.sugar) > 140
    ) {
      isNormal = false;
      baseScore = 85;
      status = 'Vitals Telemetry Under Observation';
    }

    return {
      success: true,
      overall: {
        healthScore: baseScore,
        status,
        statusTitle: status,
        severity: isNormal ? 'normal' : (baseScore < 70 ? 'critical' : 'medium'),
        icon: isNormal ? '🟢' : (baseScore < 70 ? '🔴' : '🟡'),
        statusDescription: isNormal
          ? 'Telemetry confirms optimal biomarker homeostasis and vitals stability.'
          : (baseScore < 70
              ? 'Biometric telemetry indicates abnormal vital signs. Prompt clinical review advised.'
              : 'Slight physiological variance recorded in recent biometric health logs.')
      },
      period: {
        recordsAnalyzed: logsList.length
      }
    };
  };

  const fetchHealthAnalysis = async () => {
    if (!user?.userId) return;
    try {
      const { data } = await api.post('/health/analyze', {
        patientId: user.userId,
        range: range === 'all' ? 'month' : range
      });
      if (data && data.success) {
        setAiResult(data);
      }
    } catch (err) {
      console.warn('[HEALTH_ANALYSIS_AUTO_SYNC_WARN]', err?.message);
    }
  };

  const fetchLogs = async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/health/logs/${user.userId}?range=${range}`);
      const logsArray = data.logs || [];
      const formatted = Array.isArray(logsArray) ? logsArray.map(l => {
        const d = new Date(l.date);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        let timeStr = l.time;
        if (!timeStr || timeStr === '12' || timeStr.trim() === '') {
          const hours = d.getHours();
          const minutes = d.getMinutes();
          if (hours !== 0 || minutes !== 0) {
            timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
          } else if (l.sessionTag) {
            timeStr = `${l.sessionTag} Reading`;
          } else {
            timeStr = 'Recorded Entry';
          }
        }
        
        return {
          ...l,
          formattedDate: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          formattedTime: timeStr,
          day: `${dateStr} • ${timeStr}`
        };
      }) : [];
      setLogs(formatted);
      if (formatted.length > 0) {
        fetchHealthAnalysis();
      } else {
        setAiResult(null);
      }
    } catch (error) {
      toast.error("Failed to load health data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!user?.userId) return toast.error("Please login again");

    // Verify at least one vital metric was actually entered
    const hasMetric = [
      newLog.bp_systolic,
      newLog.bp_diastolic,
      newLog.temperature,
      newLog.heartbeat,
      newLog.sugar,
      newLog.oxygen,
      newLog.weight
    ].some(v => v !== '' && v !== null && v !== undefined);

    if (!hasMetric) {
      return toast.error("Please enter your reading for at least one metric");
    }

    if ((newLog.bp_systolic && !newLog.bp_diastolic) || (!newLog.bp_systolic && newLog.bp_diastolic)) {
      return toast.error("Please enter both Systolic and Diastolic BP");
    }

    try {
      await api.post('/health/logs', { ...newLog, patientId: user.userId });
      toast.success("Health data synchronized!");
      setShowAddLog(false);
      setNewLog(getInitialLogState());
      fetchLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save data");
    }
  };

  const runAiAnalysis = async () => {
    if (logs.length === 0) return toast.error("No data to analyze");
    setAnalyzing(true);
    try {
      const { data } = await api.post('/health/analyze', {
        patientId: user.userId,
        range: range === 'all' ? 'month' : range // Local engine optimized for week/month
      });

      // Navigate to detailed report page with the results
      toast.success("Health Synthesis Complete");
      navigate('/patient/health/report', { state: { report: data } });
    } catch (error) {
      toast.error("Health Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecutePurge = async () => {
    if (!user?.userId) return toast.error("User node not found");
    setClearing(true);
    try {
      const { data } = await api.delete(`/health/logs/${user.userId}?range=${purgeRange}`);
      toast.success(data?.message || "Records cleared successfully");
      setShowPurgeModal(false);
      fetchLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Purge failed");
    } finally {
      setClearing(false);
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return toast.error("No data to export");

    const headers = ["Date", "Time", "Systolic BP", "Diastolic BP", "Oxygen %", "Heart Rate (BPM)", "Weight (kg)", "Sugar (mg/dL)", "BMI", "Notes"];
    const rows = logs.map(l => {
      const d = new Date(l.date);
      return [
        d.toLocaleDateString(),
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        l.bp_systolic,
        l.bp_diastolic,
        l.oxygen,
        l.heartbeat,
        l.weight,
        l.sugar,
        calculateBMI(l.weight),
        l.notes || ""
      ];
    });

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
    const valid = logs.filter(l => l[key] !== null && l[key] !== undefined && l[key] !== '' && !isNaN(Number(l[key])));
    if (valid.length === 0) return 0;
    const sum = valid.reduce((acc, curr) => acc + Number(curr[key]), 0);
    const avg = sum / valid.length;
    return isNaN(avg) ? 0 : Math.round(avg);
  };

  const calculateBMI = (weight) => {
    if (!weight || isNaN(Number(weight))) return '—';
    const heightInMeters = 1.75;
    return (Number(weight) / (heightInMeters * heightInMeters)).toFixed(1);
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
              <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mt-1 flex flex-wrap items-center gap-2">
                <span>Neural Monitoring Active</span>
                <span className="text-zinc-400">•</span>
                <span className="text-blue-500 font-mono">
                  {range === 'week' ? 'This Week (Mon – Sun)' : range === 'month' ? 'This Month (Current Month)' : 'All Lifetime Telemetry'}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className={`border p-1.5 rounded-2xl flex shadow-sm transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-900 border-white/5' : 'bg-white border-slate-200'}`}>
                <button onClick={() => setRange('week')} title="Current Calendar Week (Mon - Sun)" className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${range === 'week' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>This Week</button>
                <button onClick={() => setRange('month')} title="Current Calendar Month" className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${range === 'month' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>This Month</button>
                <button onClick={() => setRange('all')} title="All Lifetime Telemetry Records" className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${range === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>All Records</button>
              </div>
              <button onClick={() => setShowPurgeModal(true)} className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white flex items-center gap-2`}>
                <Trash2 size={16} /> Clean Records
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
                             <th className="pb-4">Date & Time</th>
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
                                <td className="py-4">
                                   <div className="font-bold">{l.formattedDate || new Date(l.date).toLocaleDateString()}</div>
                                   <div className="text-[10px] text-blue-400 font-mono font-bold mt-0.5">{l.formattedTime || (l.time && l.time !== '12:00 am' ? l.time : new Date(l.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</div>
                                </td>
                                <td className="py-4 text-blue-500">{l.bp_systolic}/{l.bp_diastolic}</td>
                                <td className="py-4">{l.oxygen}%</td>
                                <td className="py-4">{l.temperature}°F</td>
                                <td className="py-4">{l.weight} kg</td>
                                <td className="py-4">{calculateBMI(l.weight)}</td>
                                <td className="py-4 text-orange-500">{l.sugar}</td>
                             </tr>
                          )) : (
                            <tr>
                               <td colSpan="7" className="py-16 text-center text-zinc-500 italic font-bold uppercase text-[10px] tracking-[0.2em]">
                                 {range === 'week' ? (
                                   <div className="space-y-2">
                                     <p className="text-slate-400 dark:text-zinc-400 font-black">No Health Logs Found For This Week</p>
                                     <p className="text-[9px] text-zinc-500">Earlier logs (like Nov 3) are in <button onClick={() => setRange('month')} className="text-blue-500 underline font-black">This Month</button> or <button onClick={() => setRange('all')} className="text-blue-500 underline font-black">All Records</button></p>
                                   </div>
                                 ) : range === 'month' ? (
                                   <div className="space-y-2">
                                     <p className="text-slate-400 dark:text-zinc-400 font-black">No Health Logs Found For This Month</p>
                                     <p className="text-[9px] text-zinc-500">Click '+ Vitals' to log new readings</p>
                                   </div>
                                 ) : (
                                   <div className="space-y-2">
                                     <p className="text-slate-400 dark:text-zinc-400 font-black">No Health Records In Archive</p>
                                     <p className="text-[9px] text-zinc-500">Click '+ Vitals' to log your first telemetry reading</p>
                                   </div>
                                 )}
                               </td>
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
                <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                   <Brain size={16} /> Neural Progress Report
                </h3>

                {(() => {
                  const currentDisplayResult = aiResult || evaluateBaselineFromLogs(logs);

                  if (currentDisplayResult) {
                    const isBiologicalSync = currentDisplayResult?.overall?.status === 'Biological Sync Stabilized' || currentDisplayResult?.overall?.statusTitle === 'Biological Sync Stabilized';
                    const score = currentDisplayResult?.overall?.healthScore !== undefined ? currentDisplayResult.overall.healthScore : 100;
                    const isGoodScore = score >= 80;

                    return (
                      <div className="space-y-8 animate-in fade-in duration-500 text-left pb-6">
                         <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 space-y-5 print:bg-slate-50">
                            <div className="flex justify-between items-center text-left">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Health Node</p>
                                <span className="text-xl">{currentDisplayResult?.overall?.icon || (isBiologicalSync ? '🟢' : '🟡')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-left space-y-1">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                                    <p className={`text-xs font-black uppercase flex items-center gap-2 ${
                                      isBiologicalSync ? 'text-emerald-400' : currentDisplayResult?.overall?.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                                    }`}>
                                      {isBiologicalSync && (
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 inline-block" />
                                      )}
                                      {currentDisplayResult?.overall?.status || 'Biological Sync Stabilized'}
                                    </p>
                                </div>
                                <div className="text-left space-y-1">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Records</p>
                                    <p className="text-xs font-black text-white">{currentDisplayResult?.period?.recordsAnalyzed || logs.length || '0'}</p>
                                </div>
                            </div>
                         </div>

                         <div className="space-y-4 text-left">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Health Score</p>
                            <div className="space-y-3">
                               <div className="flex justify-between text-xs font-bold">
                                   <span className="text-slate-500 uppercase tracking-widest">Safety Rating</span>
                                   <span className={`font-black ${isGoodScore ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{score}/100</span>
                               </div>
                               <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                                  <div
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                      isGoodScore
                                        ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                                        : score >= 50
                                          ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                                          : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                                  ></div>
                               </div>
                               <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                 isBiologicalSync ? 'text-emerald-400' : 'text-zinc-400'
                               }`}>
                                 {isBiologicalSync ? (
                                   <>
                                     <CheckCircle size={12} className="text-emerald-400" />
                                     Biological Sync Stabilized
                                   </>
                                 ) : (
                                   'Biometric Telemetry Monitored'
                                 )}
                               </p>
                               <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed pt-1">
                                 {currentDisplayResult?.overall?.statusDescription || 'Telemetry confirms optimal biomarker homeostasis and vitals stability.'}
                               </p>
                            </div>
                         </div>

                         {/* COMBINED PATTERN ANALYSIS */}
                         {currentDisplayResult?.combinations && currentDisplayResult.combinations.length > 0 && (
                           <div className="space-y-5 text-left border-t border-white/5 pt-8">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Combined Pattern Analysis</p>
                              <div className="space-y-4">
                                 {currentDisplayResult.combinations.map((comb, i) => (
                                   <div key={i} className={`p-5 rounded-[28px] border transition-all ${comb.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20' : comb.severity === 'high' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-blue-600/10 border-blue-500/20'}`}>
                                      <div className="flex items-center gap-3 mb-3">
                                         <Sparkles size={14} className={comb.severity === 'critical' ? 'text-rose-500' : 'text-blue-500'} />
                                         <p className="text-[10px] font-black uppercase text-white tracking-tight leading-tight">{comb.title}</p>
                                      </div>
                                      <p className="text-[10px] font-bold text-zinc-400 leading-relaxed uppercase tracking-tight">{comb.analysis}</p>
                                      {comb.possibleAssociation && (
                                        <div className="mt-3 p-3 bg-black/40 rounded-2xl border border-white/5">
                                           <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Correlation Node</p>
                                           <p className="text-[9px] font-bold text-zinc-500 leading-relaxed italic">{comb.possibleAssociation}</p>
                                        </div>
                                      )}
                                   </div>
                                 ))}
                              </div>
                           </div>
                         )}

                         {/* SYSTEM RECOMMENDATIONS */}
                         {currentDisplayResult?.recommendations && currentDisplayResult.recommendations.length > 0 && (
                           <div className="space-y-5 text-left border-t border-white/5 pt-8">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Node Recommendations</p>
                              <div className="space-y-4">
                                 {[...(currentDisplayResult?.recommendations || []), ...(currentDisplayResult?.combinations?.flatMap(c => c.precautions.map(p => ({ title: c.title, message: p, isCombination: true }))) || [])].slice(0, 6).map((rec, i) => (
                                   <div key={i} className="flex gap-4 items-start text-left p-4 bg-white/5 border border-white/5 rounded-[24px] hover:bg-white/10 transition-colors">
                                      <Zap size={14} className="text-blue-500 shrink-0 mt-0.5" />
                                      <div>
                                         <p className="text-[10px] font-black uppercase text-blue-500 mb-1 tracking-tight">{rec.title}</p>
                                         <p className="text-[10px] font-bold leading-relaxed text-zinc-400 tracking-tight">{rec.message}</p>
                                      </div>
                                   </div>
                                 ))}
                              </div>
                           </div>
                         )}

                         <div className="space-y-3 pt-2">
                           <button
                             onClick={() => navigate('/patient/health/report', { state: { report: currentDisplayResult } })}
                             className="w-full py-4 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                           >
                             View Full Diagnostic Breakdown <TrendingUp size={12} />
                           </button>
                           <button
                             onClick={runAiAnalysis}
                             disabled={analyzing}
                             className="w-full py-3.5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                           >
                             {analyzing ? <Loader2 size={13} className="animate-spin text-blue-400" /> : <Brain size={13} className="text-blue-400" />}
                             Run Deep Swarm Analysis
                           </button>
                         </div>
                      </div>
                    );
                  }

                  return (
                    <div className="text-center py-10">
                      <div className="w-20 h-20 bg-blue-600/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/10">
                         <Activity className="text-blue-600 animate-pulse" size={32} />
                      </div>
                      <p className={`text-xs mb-8 leading-relaxed font-bold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}`}>
                        No biometric vitals recorded yet. Log your readings to establish Biological Sync.
                      </p>
                      <button
                        onClick={() => setShowAddLog(true)}
                        className={`w-full py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${theme === 'dark' ? 'bg-white text-slate-900 shadow-blue-500/10' : 'bg-white text-slate-900 shadow-blue-600/30'}`}
                      >
                        <Plus size={16} strokeWidth={3} className="text-blue-600" /> Record Vitals
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </main>
      </div>

      {showAddLog && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className={`w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border my-auto ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className={`p-6 md:p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
               <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-500/20 shadow-inner">
                     <Activity size={22} />
                  </div>
                  <div className="text-left">
                     <h2 className={`text-lg font-black tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Record Biometric Vitals</h2>
                     <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Manual Telemetry Synchronization</p>
                  </div>
               </div>
               <button onClick={() => setShowAddLog(false)} className={`p-2.5 rounded-xl border transition-all ${theme === 'dark' ? 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                  <X size={18} />
               </button>
            </div>

            <form onSubmit={handleAddLog} className="p-6 md:p-8 space-y-6 text-left">
               {/* DATE, TIME & SESSION */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Archive Date</label>
                    <input
                      type="date"
                      required
                      max={new Date().toISOString().split('T')[0]}
                      value={newLog.date}
                      onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                      className={`w-full p-3.5 border rounded-2xl font-bold text-xs outline-none transition-all ${
                        theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Log Time</label>
                    <input
                      type="time"
                      value={newLog.time}
                      onChange={(e) => setNewLog({ ...newLog, time: e.target.value })}
                      className={`w-full p-3.5 border rounded-2xl font-bold text-xs outline-none transition-all ${
                        theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session</label>
                    <select
                      value={newLog.sessionTag}
                      onChange={(e) => setNewLog({ ...newLog, sessionTag: e.target.value })}
                      className={`w-full p-3.5 border rounded-2xl font-bold text-xs outline-none transition-all ${
                        theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                      }`}
                    >
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
               </div>

               {/* BLOOD PRESSURE */}
               <div className="p-4 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                        <Activity size={14} /> Blood Pressure (mmHg)
                     </span>
                     <span className="text-[9px] font-bold text-zinc-400">Target: 120/80</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Systolic</label>
                        <input
                          type="number"
                          placeholder="e.g. 120"
                          min="60"
                          max="260"
                          value={newLog.bp_systolic}
                          onChange={(e) => setNewLog({ ...newLog, bp_systolic: e.target.value })}
                          className={`w-full p-3.5 border rounded-2xl font-bold text-sm outline-none transition-all ${
                            theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'
                          }`}
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diastolic</label>
                        <input
                          type="number"
                          placeholder="e.g. 80"
                          min="40"
                          max="160"
                          value={newLog.bp_diastolic}
                          onChange={(e) => setNewLog({ ...newLog, bp_diastolic: e.target.value })}
                          className={`w-full p-3.5 border rounded-2xl font-bold text-sm outline-none transition-all ${
                            theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'
                          }`}
                        />
                     </div>
                  </div>
               </div>

               {/* OXYGEN, PULSE, TEMP */}
               <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Wind size={12} className="text-cyan-500" /> Oxygen %
                     </label>
                     <input
                       type="number"
                       placeholder="e.g. 98"
                       min="70"
                       max="100"
                       value={newLog.oxygen}
                       onChange={(e) => setNewLog({ ...newLog, oxygen: e.target.value })}
                       className={`w-full p-3.5 border rounded-2xl font-bold text-sm outline-none transition-all ${
                         theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                       }`}
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Heart size={12} className="text-rose-500" /> Pulse BPM
                     </label>
                     <input
                       type="number"
                       placeholder="e.g. 72"
                       min="40"
                       max="220"
                       value={newLog.heartbeat}
                       onChange={(e) => setNewLog({ ...newLog, heartbeat: e.target.value })}
                       className={`w-full p-3.5 border rounded-2xl font-bold text-sm outline-none transition-all ${
                         theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                       }`}
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Thermometer size={12} className="text-amber-500" /> Temp °F
                     </label>
                     <input
                       type="number"
                       step="0.1"
                       placeholder="e.g. 98.6"
                       min="90"
                       max="108"
                       value={newLog.temperature}
                       onChange={(e) => setNewLog({ ...newLog, temperature: e.target.value })}
                       className={`w-full p-3.5 border rounded-2xl font-bold text-sm outline-none transition-all ${
                         theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                       }`}
                     />
                  </div>
               </div>

               {/* WEIGHT & SUGAR */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                           <Scale size={12} className="text-emerald-500" /> Weight (kg)
                        </label>
                        {newLog.weight && (
                           <span className="text-[8px] font-bold text-emerald-500 font-mono">
                              BMI ~{calculateBMI(newLog.weight)}
                           </span>
                        )}
                     </div>
                     <input
                       type="number"
                       step="0.1"
                       placeholder="e.g. 80"
                       min="20"
                       max="300"
                       value={newLog.weight}
                       onChange={(e) => setNewLog({ ...newLog, weight: e.target.value })}
                       className={`w-full p-3.5 border rounded-2xl font-bold text-sm outline-none transition-all ${
                         theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                       }`}
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Droplets size={12} className="text-orange-500" /> Sugar (mg/dL)
                     </label>
                     <input
                       type="number"
                       placeholder="e.g. 100"
                       min="30"
                       max="600"
                       value={newLog.sugar}
                       onChange={(e) => setNewLog({ ...newLog, sugar: e.target.value })}
                       className={`w-full p-3.5 border rounded-2xl font-bold text-sm outline-none transition-all ${
                         theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                       }`}
                     />
                  </div>
               </div>

               {/* NOTES */}
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clinical / Patient Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Fasting reading, post morning walk"
                    value={newLog.notes}
                    onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                    className={`w-full p-3.5 border rounded-2xl font-bold text-xs outline-none transition-all ${
                      theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                    }`}
                  />
               </div>

               {/* ACTIONS */}
               <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLog(false)}
                    className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all ${
                      theme === 'dark' ? 'border-white/10 text-zinc-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Plus size={16} strokeWidth={3} /> Synchronize Vitals
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {showPurgeModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className={`w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
            <div className={`p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-50 bg-slate-50/50'}`}>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                     <Trash2 size={20} />
                  </div>
                  <div className="text-left">
                     <h2 className={`text-lg font-black tracking-tight uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Clean Records</h2>
                     <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select range to delete</p>
                  </div>
               </div>
               <button onClick={() => setShowPurgeModal(false)} className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'border-white/10 text-zinc-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                  <X size={18} />
               </button>
            </div>

            <div className="p-8 space-y-6 text-left">
               <div className="space-y-3">
                  {[
                     { id: 'today', title: 'This Day (Today)', desc: 'Delete vitals recorded today only', badge: 'Single Day' },
                     { id: 'week', title: 'Last Week', desc: 'Delete vitals recorded in the past 7 days', badge: 'Past 7 Days' },
                     { id: 'month', title: 'Last Month', desc: 'Delete vitals recorded in the past 30 days', badge: 'Past 30 Days' },
                     { id: 'all', title: 'All Records', desc: 'Permanently wipe all health records from history', badge: 'Permanent' }
                  ].map((opt) => (
                     <div
                        key={opt.id}
                        onClick={() => setPurgeRange(opt.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-left ${
                           purgeRange === opt.id
                              ? 'bg-red-500/10 border-red-500 text-white shadow-lg shadow-red-500/10'
                              : theme === 'dark'
                                 ? 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/20'
                                 : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                     >
                        <div className="space-y-1">
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase tracking-wider">{opt.title}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                 opt.id === 'all'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                 {opt.badge}
                              </span>
                           </div>
                           <p className="text-[10px] text-zinc-500 font-bold">{opt.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 ${
                           purgeRange === opt.id ? 'border-red-500 bg-red-500' : 'border-zinc-600'
                        }`}>
                           {purgeRange === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                     </div>
                  ))}
               </div>

               <div className="flex gap-3">
                  <button
                     type="button"
                     onClick={() => setShowPurgeModal(false)}
                     className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all ${
                        theme === 'dark' ? 'border-white/10 text-zinc-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                     }`}
                  >
                     Cancel
                  </button>
                  <button
                     type="button"
                     onClick={handleExecutePurge}
                     disabled={clearing}
                     className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     {clearing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                     {purgeRange === 'all' ? 'Purge All' : 'Delete Range'}
                  </button>
               </div>
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
