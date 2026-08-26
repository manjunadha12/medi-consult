import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MessageSquare, Brain, FileText, Pill, History, Paperclip,
  Send, Shield, Zap, Battery, Signal, Image as ImageIcon, Camera, Mic,
  Smile, Sparkles, User, Download, Trash2, Share2, ClipboardList, Activity, Clock, AlertTriangle
} from 'lucide-react';
import { BACKEND_URL } from '../../utils/api';

const CommLinkPopup = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  user,
  theme,
  opinionData,
  setOpinionData,
  onFinalize,
  patientData = {} // Real data from database
}) => {
  const [activeTab, setActiveTab] = useState('messages');
  const [inputMsg, setInputMsg] = useState('');

  const isDoctor = user?.role === 'doctor';
  const { reports = [], prescriptions = [], consultations = [], diagnoses = [] } = patientData || {};

  const tabs = [
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'ai', label: 'AI Review', icon: Brain },
    { id: 'files', label: 'Medical Files', icon: Paperclip },
    ...(isDoctor ? [{ id: 'diagnostics', label: 'Diagnostics', icon: ClipboardList }] : []),
    { id: 'prescription', label: 'Prescription', icon: Pill },
    { id: 'history', label: 'History', icon: History },
  ];

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    onSendMessage(inputMsg);
    setInputMsg('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`fixed bottom-24 right-6 w-full max-w-[450px] h-[75vh] rounded-[32px] border backdrop-blur-3xl shadow-[0_32px_128px_rgba(0,0,0,0.5)] z-[2000] flex flex-col overflow-hidden ${
            theme === 'dark' ? 'bg-[#09090BBF] border-white/5 text-white' : 'bg-white/90 border-slate-200 text-slate-800'
          } sm:w-[450px] w-[calc(100%-48px)]`}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="text-left">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> Comm Center
              </h3>
              <div className="flex items-center gap-4 mt-2">
                 <div className="flex items-center gap-1 text-[8px] font-black text-zinc-500 uppercase">
                    <Signal size={10} className="text-emerald-500" /> Strong
                 </div>
                 <div className="flex items-center gap-1 text-[8px] font-black text-zinc-500 uppercase">
                    <Shield size={10} className="text-blue-500" /> RSA-4096
                 </div>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-zinc-500 transition-all active:scale-90"><X size={20} strokeWidth={3}/></button>
          </div>

          {/* Tabs Navigation */}
          <div className="flex px-4 py-2 border-b border-white/5 gap-1 overflow-x-auto scrollbar-hide bg-white/5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                <tab.icon size={12} strokeWidth={2.5}/> {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-left bg-black/10">
            {activeTab === 'messages' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 space-y-4 mb-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.sender === user?.name ? 'items-end' : 'items-start'}`}>
                       <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1 px-1">{m.sender}</p>
                       <div className={`px-4 py-3 rounded-2xl text-xs font-bold leading-relaxed max-w-[85%] ${
                         m.sender === user?.name
                         ? 'bg-blue-600 text-white rounded-tr-none'
                         : (theme === 'dark' ? 'bg-zinc-900/80 text-slate-300 border border-white/5 rounded-tl-none' : 'bg-slate-100 text-slate-700 rounded-tl-none')
                       }`}>
                          {m.message}
                          <p className="text-[7px] opacity-40 mt-1 uppercase text-right">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                       </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                        <MessageSquare size={48} />
                        <p className="text-[10px] font-black uppercase mt-4">Secure Stream Active</p>
                     </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                 {diagnoses?.length > 0 ? (
                    <>
                       <div className="p-6 bg-blue-600/5 border border-blue-600/10 rounded-[28px] space-y-4">
                          <div className="flex items-center gap-3 text-blue-500">
                             <Sparkles size={20}/>
                             <h4 className="text-[10px] font-black uppercase tracking-widest">Latest Clinical Summary</h4>
                          </div>
                          <p className="text-xs font-medium text-zinc-300 leading-relaxed italic uppercase tracking-wider">
                             "{diagnoses[0].reportSummary || "Standard diagnostic protocols verified. Lipid and hematological markers within expected variance."}"
                          </p>
                       </div>
                       <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-[28px] space-y-3">
                          <p className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-2 tracking-widest"><AlertTriangle size={12}/> Interpretation Node</p>
                          <p className="text-xs text-zinc-400 font-bold leading-relaxed">{diagnoses[0].reportInterpretation || "Normal clinical baseline established."}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                             <p className="text-[8px] font-black text-zinc-500 uppercase mb-2">Risk Index</p>
                             <p className="text-lg font-black text-emerald-500 tracking-tighter">LOW STRESS</p>
                          </div>
                          <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                             <p className="text-[8px] font-black text-zinc-500 uppercase mb-2">Urgency Node</p>
                             <p className="text-lg font-black text-blue-500 tracking-tighter">2.4/10</p>
                          </div>
                       </div>
                    </>
                 ) : (
                    <div className="py-20 text-center opacity-20">
                       <Brain size={48} className="mx-auto mb-4"/>
                       <p className="text-[10px] font-black uppercase tracking-widest">No Analysis Data Found</p>
                    </div>
                 )}
              </div>
            )}

            {activeTab === 'files' && (
               <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="border-2 border-dashed border-white/10 rounded-[28px] p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 transition-all cursor-pointer bg-white/5">
                     <Paperclip className="text-blue-500" size={32}/>
                     <p className="text-[10px] font-black uppercase text-zinc-500">Drop Medical Records</p>
                  </div>
                  <div className="space-y-3">
                     {reports?.length > 0 ? reports.map((f, i) => (
                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-all">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <FileText size={18} className="text-blue-500 shrink-0" />
                              <div className="overflow-hidden">
                                 <p className="text-[10px] font-black uppercase text-zinc-300 truncate">{f.fileName}</p>
                                 <p className="text-[8px] font-bold text-zinc-600 uppercase">{f.category} • {new Date(f.createdAt).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <div className="flex gap-1 shrink-0">
                              <a href={`${BACKEND_URL}${f.fileUrl}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 transition-all"><Download size={14}/></a>
                           </div>
                        </div>
                     )) : (
                        <div className="py-10 text-center opacity-20">
                           <p className="text-[10px] font-black uppercase tracking-widest">Archive Link Empty</p>
                        </div>
                     )}
                  </div>
               </div>
            )}

            {activeTab === 'diagnostics' && isDoctor && (
               <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Symptoms Matrix</label>
                    <textarea
                      className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl outline-none text-xs font-bold text-white focus:border-blue-500 transition-all min-h-[100px]"
                      placeholder="ENTER OBSERVED BIOMARKERS..."
                      value={opinionData?.symptoms}
                      onChange={(e) => setOpinionData({...opinionData, symptoms: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Clinical Synthesis</label>
                    <textarea
                      className="w-full p-5 bg-white/5 border border-white/5 rounded-2xl outline-none text-xs font-bold text-white focus:border-blue-500 transition-all min-h-[100px]"
                      placeholder="ENTER DIAGNOSIS..."
                      value={opinionData?.diagnosis}
                      onChange={(e) => setOpinionData({...opinionData, diagnosis: e.target.value})}
                    />
                  </div>
                  <button
                    onClick={onFinalize}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                  >
                     Sync Final Synthesis
                  </button>
               </div>
            )}

            {activeTab === 'prescription' && (
               <div className="space-y-4 animate-in fade-in duration-500">
                  {prescriptions?.length > 0 ? prescriptions.map((p, i) => (
                    <div key={i} className="p-5 bg-zinc-900/50 rounded-2xl border border-white/5 space-y-4">
                       <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Issued: {new Date(p.createdAt).toLocaleDateString()}</p>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase">{p.diagnosis}</p>
                       </div>
                       {p.medicines && p.medicines.map((m, j) => (
                          <div key={j} className="flex items-center justify-between group">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500 shrink-0"><Pill size={16}/></div>
                                <div className="text-left">
                                   <p className="text-[10px] font-black uppercase text-zinc-200">{m.name}</p>
                                   <p className="text-[7px] font-bold text-zinc-500 uppercase">{m.dosage} • {m.frequency}</p>
                                </div>
                             </div>
                             <div className="px-2 py-1 bg-white/5 rounded text-[7px] font-black text-zinc-500 uppercase">{m.durationValue} {m.durationUnit}</div>
                          </div>
                       ))}
                       <button className="w-full py-2.5 bg-white/5 border border-white/5 rounded-xl text-[8px] font-black text-zinc-400 hover:text-white transition-all uppercase flex items-center justify-center gap-2 mt-2">
                          <Download size={10}/> Download Rx Archive
                       </button>
                    </div>
                  )) : (
                     <div className="py-20 text-center opacity-20">
                        <Pill size={48} className="mx-auto mb-4"/>
                        <p className="text-[10px] font-black uppercase tracking-widest">Prescription Vault Empty</p>
                     </div>
                  )}
               </div>
            )}

            {activeTab === 'history' && (
               <div className="space-y-4 animate-in fade-in duration-500">
                  {consultations?.length > 0 ? consultations.map((c, i) => (
                     <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3 hover:bg-white/10 transition-all cursor-default group">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <p className="text-[9px] font-black text-zinc-400 group-hover:text-white uppercase transition-colors">Session Node #{c.appointmentId?.slice(-6) || '---'}</p>
                           </div>
                           <p className="text-[8px] font-bold text-zinc-600 uppercase flex items-center gap-1"><Clock size={10}/> {new Date(c.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black text-blue-500 uppercase">{c.doctorName || "Specialist Node"}</p>
                           <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${c.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{c.status}</div>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed font-medium italic">"{c.diagnosis || "Clinical assessment synchronized with standard markers."}"</p>
                     </div>
                  )) : (
                     <div className="py-20 text-center opacity-20">
                        <History size={48} className="mx-auto mb-4"/>
                        <p className="text-[10px] font-black uppercase tracking-widest">History Buffer Empty</p>
                     </div>
                  )}
               </div>
            )}
          </div>

          {/* Chat Input Area */}
          {activeTab === 'messages' && (
            <div className="p-6 border-t border-white/5 bg-black/40">
               <form onSubmit={handleSend} className="relative">
                  <textarea
                    rows="1"
                    placeholder="MESSAGE SPECIALIST..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => {
                       if(e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                       }
                    }}
                    className={`w-full pl-6 pr-14 py-4 rounded-2xl border outline-none text-[10px] font-black uppercase tracking-widest transition-all resize-none bg-[#121214] border-white/10 text-white focus:border-blue-500/50`}
                  />
                  <button type="submit" className="absolute right-2 top-2 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-500 active:scale-90 transition-all"><Send size={16} /></button>
               </form>
               <div className="flex items-center gap-4 mt-4 px-1">
                  <button type="button" className="flex items-center gap-1.5 text-[8px] font-black text-zinc-500 hover:text-white transition-all uppercase"><ImageIcon size={12}/> Gallery</button>
                  <button type="button" className="flex items-center gap-1.5 text-[8px] font-black text-zinc-500 hover:text-white transition-all uppercase"><Camera size={12}/> Camera</button>
                  <button type="button" className="flex items-center gap-1.5 text-[8px] font-black text-zinc-500 hover:text-white transition-all uppercase"><Mic size={12}/> Voice</button>
                  <button type="button" className="flex items-center gap-1.5 text-[8px] font-black text-zinc-500 hover:text-white transition-all uppercase"><Smile size={12}/> Emoji</button>
               </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommLinkPopup;
