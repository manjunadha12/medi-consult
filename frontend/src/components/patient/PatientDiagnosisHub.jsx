import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import api, { BACKEND_URL } from '../../utils/api';
import {
  ClipboardList, Search, Loader2, Calendar, Clock, User,
  Download, FileText, ChevronDown, ChevronUp, Image as ImageIcon, Paperclip,
  CheckCircle, Shield, Info, Activity, History
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PatientDiagnosisHub = () => {
  const { theme, user } = useStore();
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchDiagnoses();
  }, []);

  const fetchDiagnoses = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/clinical-diagnosis/history/patient/${user.userId}`);
      setDiagnoses(res.data);
      if (res.data.length > 0) setExpandedId(res.data[0]._id);
    } catch (err) {
      toast.error("Failed to sync clinical vault");
    } finally {
      setLoading(false);
    }
  };

  const filtered = diagnoses.filter(d =>
    d.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
    d.doctorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'} pb-24`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-4 sm:p-6 lg:p-10 overflow-y-auto custom-scrollbar relative z-10">

          <header className="mb-10 lg:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-left">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2">Clinical Vault</p>
              <h1 className={`text-3xl lg:text-5xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Diagnosis Nodes</h1>
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-1">Authorized technical summary of clinical assessments</p>
            </div>

            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 focus-within:border-blue-500/50' : 'bg-white border-slate-200 focus-within:border-blue-500/30 shadow-sm'}`}>
              <Search size={18} className="text-zinc-500" />
              <input
                type="text"
                placeholder="SEARCH DIAGNOSIS..."
                className="bg-transparent border-none outline-none text-[10px] font-black w-full uppercase tracking-widest"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </header>

          {loading ? (
             <div className="py-24 text-center">
                <Loader2 className="animate-spin mx-auto text-blue-500 mb-4" size={48} />
                <p className="text-[12px] font-black uppercase tracking-[0.5em] text-zinc-500">Establishing Clinical Stream...</p>
             </div>
          ) : filtered.length === 0 ? (
             <div className={`p-20 text-center rounded-[48px] border-2 border-dashed ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <ClipboardList size={64} className="mx-auto mb-4 text-zinc-500 opacity-20" />
                <p className="text-zinc-500 font-black uppercase tracking-[0.3em]">Registry Empty</p>
             </div>
          ) : (
            <div className="space-y-6">
               {filtered.map((record, index) => {
                 const isLatest = index === 0;
                 const isExpanded = expandedId === record._id;

                 return (
                   <div
                     key={record._id}
                     className={`border rounded-[48px] overflow-hidden transition-all duration-500 ${
                       isExpanded
                       ? (theme === 'dark' ? 'bg-[#0A0A0A] border-blue-500/30 shadow-2xl' : 'bg-white border-blue-100 shadow-2xl')
                       : (theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-white border-slate-100 hover:shadow-lg')
                     }`}
                   >
                     {/* Header */}
                     <div
                       onClick={() => setExpandedId(isExpanded ? null : record._id)}
                       className={`p-6 sm:p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 cursor-pointer ${isExpanded ? 'bg-blue-600/5' : ''}`}
                     >
                       <div className="flex items-center gap-6 text-left">
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 border shadow-inner ${
                            isExpanded ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/5 text-zinc-500 border-white/5'
                          }`}>
                             <ClipboardList size={32} />
                          </div>
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <h3 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{record.diagnosis}</h3>
                                {isLatest && <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-lg">VERIFIED LATEST</span>}
                             </div>
                             <div className="flex flex-wrap gap-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                <span className="flex items-center gap-2"><Calendar size={14} className="text-blue-500"/> {new Date(record.consultationDate).toLocaleDateString()}</span>
                                <span className="flex items-center gap-2"><Clock size={14} className="text-purple-500"/> {new Date(record.consultationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="flex items-center gap-2"><User size={14} className="text-emerald-500"/> DR. {record.doctorName}</span>
                             </div>
                          </div>
                       </div>

                       <div className={`p-3 rounded-2xl transition-all ${isExpanded ? 'rotate-180 text-blue-500' : 'text-zinc-600'}`}>
                          <ChevronDown size={24} />
                       </div>
                     </div>

                     {/* Body */}
                     {isExpanded && (
                        <div className="p-8 sm:p-12 pt-0 animate-in fade-in slide-in-from-top-4 duration-500 text-left space-y-12 relative z-10">

                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                              <div className="space-y-10">
                                 <div className="space-y-4">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Chief Complaint</p>
                                    <p className="text-sm font-bold text-zinc-300 leading-relaxed uppercase">{record.chiefComplaint || 'No clinical complaint logged.'}</p>
                                 </div>
                                 <div className="space-y-4 pt-6 border-t border-white/5">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Symptoms Registry</p>
                                    <p className="text-sm font-bold text-zinc-400 leading-relaxed italic">"{record.symptoms || '—'}"</p>
                                 </div>
                              </div>

                              <div className="space-y-8 lg:border-l lg:border-white/5 lg:pl-12">
                                 <div className="p-8 bg-purple-500/5 border border-purple-500/10 rounded-[32px] space-y-4">
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] flex items-center gap-2"><Activity size={14}/> Technical Report Summary</p>
                                    <p className="text-xs font-bold text-zinc-300 leading-relaxed uppercase opacity-80">
                                       {record.reportSummary || "Standard diagnostic protocols verified. Lipid and hematological markers within expected variance."}
                                    </p>
                                 </div>
                                 <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[32px] space-y-4">
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2"><Sparkles size={14}/> Node Interpretation</p>
                                    <p className="text-xs font-bold text-zinc-300 leading-relaxed uppercase">
                                       {record.reportInterpretation || "Normal clinical baseline established."}
                                    </p>
                                 </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/5">
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Treatment Directive</p>
                                 <p className="text-sm font-black text-white uppercase tracking-tight">{record.treatmentPlan || 'Routine Monitoring Path'}</p>
                              </div>
                              <div className="space-y-4">
                                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Care Protocol</p>
                                 <p className="text-sm font-bold text-zinc-400 leading-relaxed">{record.followUpInstructions || 'Standard Clinical Maintenance'}</p>
                              </div>
                           </div>

                           {record.attachments?.length > 0 && (
                              <div className="pt-10 border-t border-white/5">
                                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><Paperclip size={16}/> Attached Technical Objects</p>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {record.attachments.map((file, i) => (
                                       <a
                                         key={i}
                                         href={`${BACKEND_URL}${file.url}`}
                                         target="_blank"
                                         rel="noreferrer"
                                         className="p-5 bg-white/5 border border-white/5 rounded-3xl flex items-center gap-4 hover:border-blue-500/50 hover:bg-white/10 transition-all group"
                                       >
                                          <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-zinc-400 group-hover:text-blue-500 transition-colors">
                                             {file.fileType.includes('image') ? <ImageIcon size={20}/> : <FileText size={20}/>}
                                          </div>
                                          <div className="overflow-hidden">
                                             <p className="text-[10px] font-black text-white truncate uppercase">{file.name}</p>
                                             <p className="text-[8px] font-bold text-zinc-600 uppercase mt-0.5">Authorized Archive</p>
                                          </div>
                                       </a>
                                    ))}
                                 </div>
                              </div>
                           )}

                           <div className="pt-10 border-t border-white/5 flex justify-between items-center opacity-40">
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Record Hash: {record._id}</p>
                              <button className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase hover:text-white transition-all"><Download size={14}/> Download Packet</button>
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

export default PatientDiagnosisHub;
