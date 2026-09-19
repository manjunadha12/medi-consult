import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import {
  ArrowLeft, Brain, TrendingUp, TrendingDown, Minus,
  Zap, AlertCircle, CheckCircle, Shield, Activity,
  Heart, Wind, Droplets, Scale, Thermometer, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

const HealthAnalysisReport = () => {
  const { theme } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { report } = location.state || {};

  if (!report) {
    return (
      <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6">
          <AlertCircle size={60} className="text-rose-500 animate-pulse" />
          <h2 className="text-2xl font-black uppercase tracking-widest">No Analysis Data Found</h2>
          <button onClick={() => navigate('/patient/health')} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  const { overall, summary, vitals, changes, recommendations, period, patientId } = report;

  const getVitalIcon = (name) => {
    switch (name.toLowerCase()) {
      case 'blood pressure': return <Activity size={18} />;
      case 'oxygen': return <Wind size={18} />;
      case 'pulse': return <Heart size={18} />;
      case 'blood sugar': return <Droplets size={18} />;
      case 'weight': return <Scale size={18} />;
      case 'temperature': return <Thermometer size={18} />;
      default: return <Activity size={18} />;
    }
  };

  const getVitalAverage = (name) => {
    const keyMap = {
      'blood pressure': 'bloodPressure',
      'oxygen': 'oxygen',
      'pulse': 'pulse',
      'blood sugar': 'sugar',
      'weight': 'weight',
      'temperature': 'temperature'
    };
    const key = keyMap[name.toLowerCase()];
    const vital = vitals[key];
    if (!vital) return null;
    return vital.average;
  };

  const getVitalUnit = (name) => {
    const keyMap = {
      'blood pressure': 'bloodPressure',
      'oxygen': 'oxygen',
      'pulse': 'pulse',
      'blood sugar': 'sugar',
      'weight': 'weight',
      'temperature': 'temperature'
    };
    const key = keyMap[name.toLowerCase()];
    return vitals[key]?.unit || '';
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-300' : 'bg-[#F8FAFC] text-slate-600'} text-left`}>
      <Navbar />

      <main className="p-6 md:p-10 max-w-7xl mx-auto w-full pb-32">

        {/* Header Navigation */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-left space-y-2">
            <button onClick={() => navigate('/patient/health')} className="flex items-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </button>
            <h1 className={`text-4xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Neural Progress Report</h1>
            <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.3em]">Patient Node: {patientId} • Period: {period.type}</p>
          </div>

          <div className={`p-6 rounded-[32px] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} flex items-center gap-6 shadow-xl`}>
             <div className="text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Safety Rating</p>
                <p className={`text-4xl font-black tracking-tighter ${overall.healthScore > 80 ? 'text-emerald-500' : overall.healthScore > 50 ? 'text-amber-500' : 'text-rose-500'}`}>{overall.healthScore}/100</p>
             </div>
             <div className="h-12 w-px bg-white/10"></div>
             <div className="text-left">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Overall Status</p>
                <div className="flex items-center gap-2">
                   <span className="text-xl">{overall.icon}</span>
                   <p className="text-sm font-black text-white uppercase">{overall.status}</p>
                </div>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Trends Breakdown Column */}
          <div className="lg:col-span-1 space-y-8">

            {/* Increasing Node */}
            <div className={`p-8 rounded-[40px] border ${theme === 'dark' ? 'bg-rose-500/5 border-rose-500/10' : 'bg-rose-50 border-rose-100'} space-y-6`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-500">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest">Increasing Trends</h3>
              </div>
              <div className="space-y-3">
                {summary.increasing.length > 0 ? summary.increasing.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      {getVitalIcon(v)}
                      <span className="text-xs font-black text-white uppercase">{v}</span>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-slate-500 uppercase">Avg</p>
                       <p className="text-xs font-black text-rose-500">{getVitalAverage(v)} <span className="text-[8px] opacity-60">{getVitalUnit(v)}</span></p>
                    </div>
                  </div>
                )) : <p className="text-[10px] font-bold text-zinc-600 uppercase italic">No increasing trends detected</p>}
              </div>
            </div>

            {/* Decreasing Node */}
            <div className={`p-8 rounded-[40px] border ${theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'} space-y-6`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <TrendingDown size={20} />
                </div>
                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Decreasing Trends</h3>
              </div>
              <div className="space-y-3">
                {summary.decreasing.length > 0 ? summary.decreasing.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      {getVitalIcon(v)}
                      <span className="text-xs font-black text-white uppercase">{v}</span>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-slate-500 uppercase">Avg</p>
                       <p className="text-xs font-black text-emerald-500">{getVitalAverage(v)} <span className="text-[8px] opacity-60">{getVitalUnit(v)}</span></p>
                    </div>
                  </div>
                )) : <p className="text-[10px] font-bold text-zinc-600 uppercase italic">No decreasing trends detected</p>}
              </div>
            </div>

            {/* Stable Node */}
            <div className={`p-8 rounded-[40px] border ${theme === 'dark' ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50 border-blue-100'} space-y-6`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <Minus size={20} />
                </div>
                <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest">Stable Vitals</h3>
              </div>
              <div className="space-y-3">
                {summary.stable.length > 0 ? summary.stable.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      {getVitalIcon(v)}
                      <span className="text-xs font-black text-white uppercase">{v}</span>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-slate-500 uppercase">Avg</p>
                       <p className="text-xs font-black text-blue-500">{getVitalAverage(v)} <span className="text-[8px] opacity-60">{getVitalUnit(v)}</span></p>
                    </div>
                  </div>
                )) : <p className="text-[10px] font-bold text-zinc-600 uppercase italic">No stable trends detected</p>}
              </div>
            </div>

          </div>

          {/* Detailed Analysis Center Column */}
          <div className="lg:col-span-2 space-y-8 text-left">

            <div className={`p-10 rounded-[48px] border ${theme === 'dark' ? 'bg-[#0A0A0C] border-white/5' : 'bg-white border-slate-100'} shadow-2xl space-y-10`}>

              {/* Detailed Changes */}
              <div className="space-y-6 text-left">
                <h3 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-3">
                  <Brain size={18} /> Biometric Variance Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {changes.map((change, i) => (
                     <div key={i} className="p-6 rounded-[32px] bg-white/5 border border-white/5 space-y-2">
                        <div className="flex justify-between items-center mb-2">
                           <p className="text-[10px] font-black text-white uppercase tracking-tight">{change.vital}</p>
                           <span className={`text-sm font-black ${change.direction === 'increasing' ? 'text-rose-500' : change.direction === 'decreasing' ? 'text-emerald-500' : 'text-blue-500'}`}>
                              {change.icon} {change.direction}
                           </span>
                        </div>
                        <p className="text-xs font-bold text-zinc-400 leading-relaxed uppercase tracking-tight">{change.message}</p>
                     </div>
                   ))}
                </div>
              </div>

              {/* Pattern Associations */}
              {report.combinations && report.combinations.length > 0 && (
                <div className="space-y-6 pt-8 border-t border-white/5 text-left">
                   <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-3">
                     <Zap size={18} /> Combined Pattern Recognition
                   </h3>
                   <div className="space-y-4">
                      {report.combinations.map((comb, i) => (
                        <div key={i} className={`p-8 rounded-[40px] border ${comb.severity === 'critical' ? 'bg-rose-500/5 border-rose-500/10' : 'bg-blue-600/5 border-blue-600/10'}`}>
                           <div className="flex items-center gap-4 mb-4">
                              <Shield size={20} className={comb.severity === 'critical' ? 'text-rose-500' : 'text-blue-500'} />
                              <p className="text-base font-black text-white uppercase tracking-tighter">{comb.title}</p>
                           </div>
                           <p className="text-sm font-bold text-zinc-400 leading-relaxed uppercase tracking-tight mb-4">{comb.analysis}</p>
                           {comb.possibleAssociation && (
                             <div className="p-5 bg-black/40 rounded-3xl border border-white/5">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Clinical Correlation Node</p>
                                <p className="text-[11px] font-bold text-zinc-500 leading-relaxed italic uppercase">{comb.possibleAssociation}</p>
                             </div>
                           )}
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="space-y-6 pt-8 border-t border-white/5 text-left">
                 <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-3">
                   <CheckCircle size={18} /> Synchronized Protocols
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="p-6 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 space-y-2 group hover:bg-emerald-500/10 transition-all cursor-default">
                         <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{rec.vital}</p>
                         <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{rec.title}</p>
                         <p className="text-[10px] font-bold text-zinc-500 leading-relaxed uppercase tracking-tight">{rec.message}</p>
                      </div>
                    ))}
                 </div>
              </div>

            </div>
          </div>

        </div>

        {/* Global Footer Summary */}
        <div className="mt-12 p-10 rounded-[48px] bg-blue-600 text-white shadow-2xl shadow-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
           <div className="text-left space-y-2 relative z-10">
              <h4 className="text-2xl font-black uppercase tracking-tighter leading-none">Diagnostic Node Synchronized</h4>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-[0.2em] opacity-80">This local analysis is generated based on your biometric history for monitoring purposes.</p>
           </div>
           <button onClick={() => window.print()} className="px-10 py-5 bg-white text-blue-600 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-3 shrink-0">
              <Calendar size={18} /> Export Diagnostic Record
           </button>
        </div>

      </main>
    </div>
  );
};

export default HealthAnalysisReport;
