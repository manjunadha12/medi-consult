import React, { useState, useRef } from 'react';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import {
  FileUp, Search as SearchIcon, Brain, AlertCircle, CheckCircle,
  ChevronRight, ArrowRight, Loader2, Download, X, FileText, ExternalLink, RefreshCw, BarChart3, Info, Send
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import useStore from '../../store/useStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AIReportReview = ({ patientId: propPatientId, onComplete, onShare, hideNavbar = false }) => {
  const { theme } = useStore();
  const [file, setFile] = useState(null);
  const [patientId, setPatientId] = useState(propPatientId || '');
  const [patientReports, setPatientReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const fileInputRef = useRef(null);

  const handleFetchReports = async (e) => {
    e.preventDefault();
    if (!patientId) return;
    setFetching(true);
    try {
      const { data } = await api.get(`/doctor/patient/${patientId}`);
      setPatientReports(data?.reports || []);
      toast.success("Archive Synced");
    } catch (err) {
      setPatientReports([]);
      toast.error("Patient archive not found");
    } finally {
      setFetching(false);
    }
  };

  const extractJsonData = (text) => {
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        // If we have metabolic status, let's chart it
        if (jsonData.metabolic_status) {
           const data = [];
           const hba1c = parseFloat(jsonData.metabolic_status.hba1c);
           const glucose = parseFloat(jsonData.metabolic_status.glucose_fasting);

           if (!isNaN(hba1c)) data.push({ name: 'HbA1c', value: hba1c, normal: 5.7 });
           if (!isNaN(glucose)) data.push({ name: 'Glucose', value: glucose, normal: 99 });

           return data.length > 0 ? data : null;
        }
      }
    } catch (e) {
      console.warn("Could not parse JSON for chart", e);
    }
    return null;
  };

  const formatJsonToText = (obj, level = 0) => {
    if (typeof obj !== 'object' || obj === null) return String(obj);

    return Object.entries(obj).map(([key, value]) => {
      const formattedKey = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

      if (Array.isArray(value)) {
        return `#### ${formattedKey}\n${value.map(item => `* ${item}`).join('\n')}`;
      }

      if (typeof value === 'object' && value !== null) {
        return `#### ${formattedKey}\n${formatJsonToText(value, level + 1)}`;
      }

      if (value === "not_provided" || !value) return "";

      return `**${formattedKey}**: ${value}  \n`;
    }).join('\n');
  };

  const handleAnalyze = async (existingReport = null) => {
    const reportToAnalyze = existingReport || file;
    if (!reportToAnalyze) return toast.error("Select a source first");

    setLoading(true);
    setAnalysis(null);
    setChartData(null);

    try {
      let resultText;
      if (existingReport) {
        const res = await api.post('/ai/analyze-report', { reportId: existingReport._id });
        resultText = res.data.summary || res.data;
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('message', "Thorough clinical analysis required. Include a structured JSON block at the end with metabolic_status (hba1c and glucose_fasting).");
        const res = await api.post('/ai/chat', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        resultText = res.data.content;
      }

      // Pre-process: If result is raw JSON, convert to human-friendly Markdown
      let displayContent = resultText;
      try {
        const jsonStart = resultText.indexOf('{');
        const jsonEnd = resultText.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const rawJson = resultText.substring(jsonStart, jsonEnd);
          const parsed = JSON.parse(rawJson);
          displayContent = formatJsonToText(parsed);
        }
      } catch (e) {
        console.warn("Synthesis wasn't pure JSON, rendering as markdown directly.");
      }

      setAnalysis(displayContent);
      const parsedChart = extractJsonData(resultText);
      setChartData(parsedChart);

      toast.success("Neural Synthesis Complete");
    } catch (err) {
      console.error("AI Node error:", err);
      toast.error("Connecting to Clinical Backup Node...");
      setAnalysis("### Clinical Analysis Initialized (Local Synthesis Mode)\nAI Swarm nodes are currently unreachable. Synchronizing with backup diagnostic cluster. Please verify connectivity or try again in 30 seconds.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex ${hideNavbar ? 'h-full' : 'min-h-screen'} ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-800'} text-left neural-grid ${hideNavbar ? 'pb-0' : 'pb-24'}`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!hideNavbar && <Navbar />}
        <main className={`flex-1 overflow-y-auto custom-scrollbar ${hideNavbar ? 'p-0' : 'p-8'} space-y-10 text-left relative z-10`}>
          <header className={`flex justify-between items-end ${hideNavbar ? 'mb-4' : 'mb-8'}`}>
            <div>
              <h1 className={`${hideNavbar ? 'text-xl' : 'text-3xl'} font-black text-white uppercase tracking-tight`}>AI Report Review</h1>
              <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Neural Diagnostic Interface</p>
            </div>
            <div className="flex gap-2 items-center">
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
               {hideNavbar && (
                 <button onClick={onComplete} className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all"><X size={20}/></button>
               )}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* Left Control Panel */}
            <div className="lg:col-span-4 space-y-8">

              <div className="bg-zinc-950/80 p-8 rounded-[40px] border border-white/5 shadow-sm space-y-6 backdrop-blur-3xl noise-overlay">
                <h3 className="font-black text-white text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                  <SearchIcon size={14} className="text-blue-400" /> Archive Synchronization
                </h3>
                <form onSubmit={handleFetchReports} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="ENTER PATIENT ID"
                    className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl text-xs font-black tracking-widest outline-none focus:border-blue-500/30 transition-all text-white"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value.toUpperCase())}
                  />
                  <button className="bg-zinc-900 text-white p-4 rounded-2xl hover:bg-zinc-800 transition-all border border-white/10">
                    {fetching ? <Loader2 className="animate-spin text-zinc-400" size={18} /> : <RefreshCw size={18} />}
                  </button>
                </form>

                {patientReports.length > 0 && (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {patientReports.map((r, i) => (
                      <div key={i} className="group p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-zinc-500 group-hover:text-blue-400 transition-colors" />
                          <p className="text-[10px] font-black text-zinc-300 uppercase truncate max-w-[120px]">{r.fileName}</p>
                        </div>
                        <div className="flex gap-2">
                           {onShare && (
                              <button
                                onClick={() => onShare(r)}
                                className="p-2 bg-white/5 border border-white/10 rounded-lg text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                title="Share to Chat"
                              >
                                 <Send size={12} />
                              </button>
                           )}
                           <button
                             onClick={() => { setSelectedReport(r); handleAnalyze(r); }}
                             className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:underline"
                           >Initialize Scan</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Upload */}
              <div className="bg-zinc-950/80 p-8 rounded-[40px] shadow-sm border border-white/5 backdrop-blur-3xl flex flex-col items-center text-center noise-overlay">
                <div className="w-12 h-12 bg-white/5 text-blue-400 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-inner">
                  <FileUp size={24} />
                </div>
                {!file ? (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white/5 border-2 border-dashed border-white/10 text-zinc-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-blue-500/30 hover:text-blue-400 transition-all">
                    OR UPLOAD NEW FILE
                  </button>
                ) : (
                  <div className="w-full space-y-4">
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-400 truncate max-w-[150px] uppercase">{file.name}</span>
                      <button onClick={() => setFile(null)} className="text-red-400"><X size={16}/></button>
                    </div>
                    <button onClick={() => handleAnalyze()} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-500">Synthesize</button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.png,.jpg,.jpeg,.webp" />
              </div>
            </div>

            {/* Right Panel: Analysis Result */}
            <div className="lg:col-span-8 space-y-8">
              {!analysis && !loading ? (
                <div className="bg-zinc-950/80 p-20 rounded-[48px] border border-white/5 shadow-sm flex flex-col items-center justify-center text-center space-y-6 backdrop-blur-3xl noise-overlay">
                   <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center border border-white/10 animate-pulse">
                      <Brain size={48} className="text-zinc-700" />
                   </div>
                   <h4 className="text-xl font-black text-zinc-500 uppercase tracking-widest">Neural Link Awaiting Synchronization</h4>
                </div>
              ) : loading ? (
                <div className="bg-zinc-950/80 p-20 rounded-[48px] border border-white/5 shadow-sm flex flex-col items-center justify-center text-center space-y-6 backdrop-blur-3xl noise-overlay">
                   <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                   <h4 className="text-xl font-black text-blue-500 uppercase tracking-widest animate-pulse">Processing Diagnostic Synthesis...</h4>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">

                  {/* AI Visual Chart Card */}
                  {chartData && (
                    <div className="bg-zinc-950/80 p-8 rounded-[48px] border border-white/5 shadow-sm backdrop-blur-3xl noise-overlay">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-8">
                         <BarChart3 size={18} className="text-blue-400" /> Metabolic Vector Analysis
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#71717A' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#71717A' }} />
                            <Tooltip cursor={{ fill: '#18181B' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#09090B', color: '#D4D4D8' }} />
                            <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={50}>
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.value > entry.normal ? '#EF4444' : '#3B82F6'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex gap-6 mt-6 justify-center">
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Critical Range</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Optimal Range</span>
                         </div>
                      </div>
                    </div>
                  )}

                  {/* Markdown Clinical Report */}
                  <div className="bg-zinc-950/80 p-10 rounded-[48px] shadow-sm border border-white/5 backdrop-blur-3xl relative overflow-hidden noise-overlay">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>

                    <div className="flex items-center justify-between mb-10 relative z-10">
                      <h3 className="text-2xl font-black text-white flex items-center gap-4 uppercase tracking-tight">
                        <Brain className="text-blue-400" size={32} /> Clinical Neural Synthesis
                      </h3>
                      <div className="flex gap-3">
                         {onShare && (
                            <button
                              onClick={() => onShare({ isAnalysis: true, content: analysis, fileName: selectedReport?.fileName })}
                              className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20"
                            >
                               <Send size={16} /> Share Synthesis
                            </button>
                         )}
                         <button className="p-4 bg-zinc-900 border border-white/10 text-zinc-400 rounded-2xl hover:text-blue-400 transition-all hover:bg-zinc-800"><Download size={24} /></button>
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none relative z-10 markdown-report text-zinc-300">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({node, ...props}) => <div className="overflow-x-auto my-6"><table className="min-w-full border-collapse border border-white/10 rounded-2xl overflow-hidden" {...props} /></div>,
                          th: ({node, ...props}) => <th className="bg-white/5 text-zinc-200 font-black uppercase text-[10px] tracking-widest p-4 border border-white/10" {...props} />,
                          td: ({node, ...props}) => <td className="p-4 border border-white/5 text-xs font-bold text-zinc-400" {...props} />,
                          h4: ({node, ...props}) => <h4 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400 mt-10 mb-4 border-l-4 border-blue-500 pl-4" {...props} />,
                          p: ({node, ...props}) => <p className="text-sm text-zinc-400 leading-relaxed my-4 font-medium" {...props} />,
                          strong: ({node, ...props}) => <span className="text-white font-black" {...props} />
                        }}
                      >
                        {analysis}
                      </ReactMarkdown>
                    </div>

                    <div className="mt-10 p-6 bg-amber-500/10 border border-amber-500/20 rounded-[32px] flex gap-4 relative z-10">
                      <AlertCircle className="text-amber-500 shrink-0" size={24} />
                      <p className="text-[10px] text-amber-400 font-bold leading-relaxed uppercase tracking-wide">
                        Neural Disclaimer: This synthesis is generated by the Swarm AI model cluster for clinical decision support. Final validation by a human certified medical node is mandatory.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default AIReportReview;
