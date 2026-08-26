import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import api, { BACKEND_URL } from '../../utils/api';
import {
  ClipboardList, Search, Loader2, Calendar, Clock, User,
  ArrowRight, Filter, ChevronRight, Stethoscope, Activity,
  AlertCircle, CheckCircle, Info, History, MapPin, Paperclip, Image as ImageIcon, FileText, Check, Users,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DoctorDiagnosisHub = () => {
  const { theme, user: doctor } = useStore();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchGlobalHistory();
  }, []);

  const fetchGlobalHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/clinical-diagnosis/history/doctor/${doctor.doctorId || doctor._id}`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync global clinical ledger");
    } finally {
      setLoading(false);
    }
  };

  const filtered = history.filter(d =>
    d.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
    d.patientName.toLowerCase().includes(search.toLowerCase()) ||
    d.patientId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'} pb-24`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-4 sm:p-6 lg:p-10 overflow-y-auto custom-scrollbar relative z-10">

          <header className="mb-10 lg:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-left flex-1">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2">Clinical Intelligence</p>
              <h1 className={`text-3xl lg:text-5xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Diagnosis Registry</h1>
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-1">Unified ledger of clinical assessments across all patient nodes</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
               <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all flex-1 md:flex-none ${theme === 'dark' ? 'bg-[#0A0A0C] border-white/5 focus-within:border-blue-500/50 shadow-2xl' : 'bg-white border-slate-200 focus-within:border-blue-500/30'}`}>
                 <Search size={18} className="text-zinc-500" />
                 <input
                   type="text"
                   placeholder="SEARCH BY PATIENT OR DIAGNOSIS..."
                   className="bg-transparent border-none outline-none text-[10px] font-black w-full uppercase tracking-widest min-w-[250px]"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
               </div>
               <button
                 onClick={() => navigate('/doctor/queue')}
                 className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-95 border border-blue-400/20"
               >
                 <Users size={16} /> Clinical OP Queue
               </button>
            </div>
          </header>

          {loading ? (
             <div className="py-24 text-center">
                <Loader2 className="animate-spin mx-auto text-blue-500 mb-4" size={48} />
                <p className="text-[12px] font-black uppercase tracking-[0.5em] text-zinc-500">Scanning Diagnosis Nodes...</p>
             </div>
          ) : filtered.length === 0 ? (
             <div className={`p-20 text-center rounded-[48px] border-2 border-dashed ${theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                <ClipboardList size={64} className="mx-auto mb-4 text-zinc-500 opacity-20" />
                <p className="text-zinc-500 font-black uppercase tracking-[0.3em]">No clinical entries found in active registry</p>
                <button onClick={() => navigate('/doctor/queue')} className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Process New Patient</button>
             </div>
          ) : (
            <div className="space-y-6">
               {filtered.map((record) => {
                 const isExpanded = expandedId === record._id;
                 return (
                   <div
                     key={record._id}
                     className={`border rounded-[48px] overflow-hidden transition-all duration-500 ${
                       isExpanded
                       ? (theme === 'dark' ? 'bg-[#0A0A0B] border-blue-500/30 shadow-2xl' : 'bg-white border-blue-100 shadow-2xl')
                       : (theme === 'dark' ? 'bg-[#0A0A0B] border-white/5 hover:border-white/10' : 'bg-white border-slate-100 hover:shadow-lg')
                     }`}
                   >
                     {/* Header */}
                     <div
                       onClick={() => setExpandedId(isExpanded ? null : record._id)}
                       className={`p-6 sm:p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 cursor-pointer ${isExpanded ? (theme === 'dark' ? 'bg-blue-600/5' : 'bg-blue-50/50') : ''}`}
                     >
                        <div className="flex items-center gap-6 text-left">
                           <div className="shrink-0 relative">
                              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black uppercase shadow-lg">
                                 {record.patientName?.charAt(0)}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0A0A0B] flex items-center justify-center">
                                 <Check size={10} className="text-white" strokeWidth={4} />
                              </div>
                           </div>
                           <div>
                              <div className="flex items-center gap-3 mb-1">
                                 <h3 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{record.patientName}</h3>
                                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{record.patientId}</p>
                              </div>
                              <div className="flex flex-wrap gap-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                 <span className="flex items-center gap-2"><Calendar size={14} className="text-blue-500"/> {new Date(record.consultationDate).toLocaleDateString()}</span>
                                 <span className="flex items-center gap-2"><Clock size={14} className="text-purple-500"/> {new Date(record.consultationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                 <span className="flex items-center gap-2 text-zinc-300"><ClipboardList size={14} className="text-emerald-500"/> {record.diagnosis}</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-4 w-full lg:w-auto">
                           <button
                             onClick={(e) => { e.stopPropagation(); navigate(`/doctor/patient/${record.patientId}`); }}
                             className="flex-1 lg:flex-none px-6 py-3 bg-white/5 border border-white/10 text-zinc-400 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 group/btn"
                           >
                              Profile <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                           </button>
                           <div className={`p-2 transition-all ${isExpanded ? 'rotate-180 text-blue-500' : 'text-zinc-600'}`}>
                              <ChevronDown size={20} />
                           </div>
                        </div>
                     </div>

                     {/* Body */}
                     {isExpanded && (
                        <div className="p-8 sm:p-12 pt-0 animate-in fade-in slide-in-from-top-4 duration-500 text-left space-y-10">
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                              <div className="space-y-6">
                                 <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2">Technical Findings</p>
                                    <p className="text-sm font-bold text-zinc-300 leading-relaxed uppercase">{record.clinicalFindings || 'Standard baseline markers recorded.'}</p>
                                 </div>
                                 <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                                    <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-2">Directives Given</p>
                                    <p className="text-sm font-bold text-zinc-300 leading-relaxed uppercase">{record.treatmentPlan || 'Routine clinical monitoring node.'}</p>
                                 </div>
                              </div>

                              <div className="space-y-6">
                                 <div className={`p-6 rounded-[32px] border ${theme === 'dark' ? 'bg-purple-500/5 border-purple-500/10' : 'bg-purple-50 border border-purple-100'}`}>
                                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-[0.3em] mb-3">Report Interpretation</p>
                                    <p className="text-xs font-medium text-zinc-400 italic">"{record.reportInterpretation || 'Analysis node synchronized with standard clinical parameters.'}"</p>
                                 </div>

                                 {record.attachments?.length > 0 && (
                                    <div className="space-y-4">
                                       <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2"><Paperclip size={14}/> Technical Objects</p>
                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          {record.attachments.map((file, i) => (
                                             <a
                                               key={i}
                                               href={`${BACKEND_URL}${file.url}`}
                                               target="_blank"
                                               rel="noreferrer"
                                               className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3 hover:border-blue-500/50 hover:bg-white/10 transition-all group"
                                             >
                                                {file.fileType.includes('image') ? <ImageIcon size={16} className="text-blue-500"/> : <FileText size={16} className="text-purple-500"/>}
                                                <p className="text-[9px] font-black text-zinc-400 truncate uppercase">{file.name}</p>
                                             </a>
                                          ))}
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     )}
                   </div>
                 );
               })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorDiagnosisHub;
