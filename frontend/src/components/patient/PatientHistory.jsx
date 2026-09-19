import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import api, { BACKEND_URL } from '../../utils/api';
import {
  History as HistoryIcon, Clock, CreditCard, Activity,
  Stethoscope, ChevronRight, Search, Filter,
  Download, FileText, Brain, Shield, Info, Loader2,
  Calendar, MapPin, CheckCircle, AlertCircle, TrendingUp, ChevronLeft, Folder, File, ClipboardList, Paperclip, Star, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../utils/mathUtils';

const PatientHistory = () => {
  const { theme, user } = useStore();
  const [activeFolder, setActiveFolder] = useState(null); // null means root view (4 folders)
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const [diagnosisData, setDiagnosisData] = useState([]);
  const [search, setSearch] = useState('');

  // Review System Nodes
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenReview = (appt) => {
    setSelectedAppointment(appt);
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewData.comment.trim()) return toast.error("Please enter a technical comment.");
    setSubmittingReview(true);
    try {
      await api.post('/patients/review', {
        doctorId: selectedAppointment.doctorId,
        appointmentId: selectedAppointment.appointmentId || selectedAppointment._id,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      toast.success("Review synchronized with medical registry.");
      setShowReviewModal(false);
      setReviewData({ rating: 5, comment: '' });
    } catch (err) {
      toast.error("Failed to propagate review node.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const patientKey = user?.patientId || user?._id || user?.userId;
      const [historyRes, diagnosisRes] = await Promise.all([
        api.get('/appointments/patient-summary'),
        api.get(`/clinical-diagnosis/history/patient/${patientKey}`)
      ]);
      setHistoryData(historyRes.data.appointments || []);
      setDiagnosisData(diagnosisRes.data || []);
    } catch (err) {
      console.error("[HISTORY_SYNC_ERROR]:", err);
      toast.error(`Clinical History Sync Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const printRecord = (record) => {
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>Clinical Diagnosis Record</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: 800; font-size: 14px; text-transform: uppercase; color: #2563eb; margin-bottom: 8px; border-left: 4px solid #2563eb; padding-left: 10px; }
            .label { font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; }
            .value { font-size: 14px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin:0; font-size: 24px;">MEDICONSULT ULTRA</h1>
              <p style="margin:5px 0; font-weight: 800;">CLINICAL DIAGNOSIS & REPORT SUMMARY</p>
            </div>
            <div style="text-align: right;">
              <p style="margin:0; font-weight: 900;">${record.doctorName}</p>
              <p style="margin:0; font-size: 12px;">ID: ${record.doctorId}</p>
              <p style="margin:0; font-size: 12px;">DATE: ${new Date(record.consultationDate).toLocaleString()}</p>
            </div>
          </div>
          <div class="section"><div class="section-title">Primary Diagnosis</div><p class="value" style="font-size: 18px; color: #1e40af;">${record.diagnosis}</p></div>
          <div class="section"><div class="section-title">Chief Complaint</div><p class="value">${record.chiefComplaint || 'N/A'}</p></div>
          <div class="section"><div class="section-title">Report Summary</div><p class="value">${record.reportSummary || 'N/A'}</p></div>
          <div class="section"><div class="section-title">Treatment Plan</div><p class="value">${record.treatmentPlan || 'N/A'}</p></div>
          <div class="section"><div class="section-title">Follow-up</div><p class="value">${record.followUpInstructions || 'N/A'}</p></div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const folders = [
    { id: 'diagnosis', label: 'Diagnosis Nodes', icon: ClipboardList, color: 'text-rose-500', bg: 'bg-rose-500/10', node: 'CLINICAL' },
    { id: 'op', label: 'OP History', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', node: 'OP' },
    { id: 'payment', label: 'Payment Logs', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10', node: 'PAYMENT' },
    { id: 'operations', label: 'Procedures', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10', node: 'OPERATIONS' }
  ];

  const filteredData = activeFolder === 'diagnosis'
    ? diagnosisData.filter(d =>
        d.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
        d.doctorName?.toLowerCase().includes(search.toLowerCase())
      )
    : historyData.filter(item => {
        const searchMatch = (item.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
                             item.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
                             item.appointmentId?.toLowerCase().includes(search.toLowerCase()));

        if (!activeFolder) return false;
        if (activeFolder === 'payment') return searchMatch && item.paymentStatus === 'Paid';
        if (activeFolder === 'operations') return searchMatch && (item.clinicalObservations || item.remarks);
        return searchMatch; // Default 'op' folder shows all
      });

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'}`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-4 sm:p-6 lg:p-10 pb-32 overflow-y-auto custom-scrollbar relative z-10">

          <header className="mb-8 lg:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="text-left">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setActiveFolder(null)}
                  className={`p-1.5 rounded-lg transition-all ${activeFolder ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : 'opacity-0 pointer-events-none'}`}
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">
                  {activeFolder ? `Archive / ${folders.find(f => f.id === activeFolder)?.label}` : 'Historical Archive'}
                </p>
              </div>
              <h1 className={`text-3xl lg:text-4xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {activeFolder ? folders.find(f => f.id === activeFolder)?.label : 'Clinical History'}
              </h1>
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-1">Authorized technical summary of clinical assessments</p>
            </div>

            {activeFolder && (
              <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 focus-within:border-blue-500/50' : 'bg-white border-slate-200 focus-within:border-blue-500/30 shadow-sm'}`}>
                <Search size={18} className="text-zinc-500" />
                <input
                  type="text"
                  placeholder="SEARCH ARCHIVE..."
                  className="bg-transparent border-none outline-none text-[10px] font-black w-full uppercase tracking-widest"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}
          </header>

          {loading ? (
             <div className="py-24 text-center">
               <Loader2 className="animate-spin mx-auto text-blue-500 mb-4" size={40} />
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Synchronizing Vault Records...</p>
             </div>
          ) : !activeFolder ? (
            /* ROOT FOLDER VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`group p-8 rounded-[48px] border transition-all duration-500 flex flex-col items-center text-center gap-6 relative overflow-hidden ${
                    theme === 'dark' ? 'bg-[#0A0A0B] border-white/5 hover:border-blue-500/30 hover:bg-white/5' : 'bg-white border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-200'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/10 transition-all"></div>

                  <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner ${
                    theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'
                  } ${folder.color}`}>
                    <Folder size={40} fill="currentColor" fillOpacity={0.1} />
                    <folder.icon size={24} className="absolute" strokeWidth={2.5} />
                  </div>

                  <div className="relative z-10 space-y-1">
                    <p className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{folder.label}</p>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest opacity-60">Registry Node: {folder.node}</p>
                  </div>

                  <div className={`mt-4 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                    theme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-500 group-hover:text-zinc-300' : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:text-blue-500'
                  }`}>
                    Open Directory
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* INSIDE FOLDER VIEW (FILES) */
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <button
                onClick={() => setActiveFolder(null)}
                className="flex items-center gap-2 text-[9px] font-black text-zinc-500 uppercase hover:text-blue-500 transition-colors mb-4"
              >
                <ChevronLeft size={12} /> Back to Vault
              </button>

              {filteredData.length > 0 ? filteredData.map((item, idx) => (
                <div
                  key={item._id}
                  className={`p-6 sm:p-8 rounded-[40px] border transition-all duration-500 group hover:scale-[1.01] ${
                    theme === 'dark' ? 'bg-zinc-900/50 border-white/5 hover:border-white/10' : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${theme === 'dark' ? 'bg-zinc-950 border-white/5 text-blue-500' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                          <File size={28} />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{item.consultationType} Node</p>
                          <h3 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>With {item.doctorName}</h3>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mt-0.5">{item.specialization} • ID: {item.appointmentId || item._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                        <div className="text-left">
                           <p className="text-[8px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1"><Calendar size={10}/> Sync Date</p>
                           <p className="text-xs font-black uppercase text-zinc-400">{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-left">
                           <p className="text-[8px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1"><MapPin size={10}/> Location</p>
                           <p className="text-xs font-black uppercase text-zinc-400 truncate">{item.hospitalName || 'Clinical Node'}</p>
                        </div>
                        <div className="text-left">
                           <p className="text-[8px] font-black text-slate-500 uppercase mb-1 flex items-center gap-1"><TrendingUp size={10}/> Token Value</p>
                           <p className={`text-xs font-black uppercase ${item.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-rose-500'}`}>₹{formatCurrency(item.fee || 450)} • {item.paymentStatus || 'PENDING'}</p>
                        </div>
                      </div>

                      {/* FOLDER SPECIFIC CONTENT - DEEP TRACE */}
                      <div className={`p-6 rounded-3xl space-y-6 ${theme === 'dark' ? 'bg-black/40 border border-white/5' : 'bg-slate-50/50 border border-slate-100 shadow-inner'}`}>

                          {/* 1. OP HISTORY NODE */}
                          {activeFolder === 'op' && (
                            <div className="space-y-4">
                               <div className="flex justify-between items-center">
                                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">Token Protocol</p>
                                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[9px] font-black border border-blue-500/20">#{item.tokenNumber || '---'}</span>
                               </div>
                               <div className="text-left">
                                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Reason for Visit</p>
                                  <p className={`text-xs font-bold ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-600'}`}>{item.problemDescription || "Routine Clinical Checkup"}</p>
                               </div>
                            </div>
                          )}

                          {/* 2. PAYMENT LOGS NODE */}
                          {activeFolder === 'payment' && (
                            <div className="space-y-4">
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="text-left">
                                     <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Transaction ID</p>
                                     <p className="text-[10px] font-black text-zinc-400 truncate">{item.razorpayPaymentId || 'INTERNAL-TXN-NODE'}</p>
                                  </div>
                                  <div className="text-left">
                                     <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Gateway</p>
                                     <p className="text-[10px] font-black text-zinc-400 uppercase">{item.paymentMethod || 'Razorpay'}</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                  <CheckCircle size={10} className="text-emerald-500" />
                                  <p className="text-[9px] font-black text-emerald-600 uppercase">Synchronized Financial Ledger</p>
                               </div>
                            </div>
                          )}

                          {/* 3. PROCEDURES NODE */}
                          {activeFolder === 'operations' && (
                            <div className="space-y-4">
                               <div className="text-left">
                                  <p className="text-[9px] font-black text-purple-500 uppercase mb-2 flex items-center gap-2 tracking-widest"><Activity size={12}/> Procedures & Actions Performed</p>
                                  <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-700'}`}>
                                     {item.clinicalObservations || item.remarks || "Standard clinical protocol followed. No invasive procedures logged."}
                                  </p>
                               </div>
                               {item.notes && (
                                 <div className="text-left pt-4 border-t border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Operator Notes</p>
                                    <p className="text-[10px] font-bold text-zinc-500 leading-relaxed italic">"{item.notes}"</p>
                                 </div>
                               )}
                            </div>
                          )}

                          {/* 4. DIAGNOSTICS NODE */}
                          {activeFolder === 'diagnostics' && (
                            <div className="space-y-4">
                               <div className="text-left">
                                  <p className="text-[9px] font-black text-rose-500 uppercase mb-2 flex items-center gap-2 tracking-widest"><Brain size={12}/> Neural Diagnosis</p>
                                  <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-white shadow-sm border border-slate-100'}`}>
                                     <p className={`text-sm font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                        {item.diagnosis || "Awaiting Specialist Synthesis"}
                                     </p>
                                  </div>
                               </div>
                               {item.symptoms && (
                                 <div className="text-left pt-2">
                                    <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Symptom Node Mapping</p>
                                    <div className="flex flex-wrap gap-1.5">
                                       {item.symptoms.split(',').map((s, i) => (
                                         <span key={i} className="px-2 py-0.5 bg-rose-500/5 border border-rose-500/10 rounded-md text-[8px] font-black uppercase text-rose-500/60">{s.trim()}</span>
                                       ))}
                                    </div>
                                 </div>
                               )}
                            </div>
                          )}

                          {/* 5. NEW DIAGNOSIS NODE (DETAILED) */}
                          {activeFolder === 'diagnosis' && (
                            <div className="space-y-6">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="text-left">
                                     <p className="text-[9px] font-black text-blue-500 uppercase mb-1">Chief Complaint</p>
                                     <p className="text-[11px] font-bold text-zinc-300">{item.chiefComplaint || 'N/A'}</p>
                                  </div>
                                  <div className="text-left">
                                     <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Primary Diagnosis</p>
                                     <p className="text-[11px] font-black text-white uppercase">{item.diagnosis}</p>
                                  </div>
                               </div>
                               <div className={`p-5 rounded-2xl ${theme === 'dark' ? 'bg-purple-500/5 border border-purple-500/10' : 'bg-purple-50 border border-purple-100'}`}>
                                  <p className="text-[9px] font-black text-purple-500 uppercase mb-2">Report Objects Summary</p>
                                  <p className="text-[10px] font-medium text-zinc-400 italic leading-relaxed">"{item.reportSummary || 'Standard clinical protocols applied.'}"</p>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                  <div className="text-left">
                                     <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Treatment path</p>
                                     <p className="text-[10px] font-bold text-zinc-400">{item.treatmentPlan || 'Routine Monitoring'}</p>
                                  </div>
                                  <div className="text-left">
                                     <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Medications</p>
                                     <p className="text-[10px] font-bold text-zinc-400">{item.medicationsText || 'Standard Care'}</p>
                                  </div>
                               </div>

                               {/* ATTACHMENTS FOR PATIENT */}
                               {item.attachments?.length > 0 && (
                                  <div className="pt-4 border-t border-white/5">
                                     <p className="text-[8px] font-black text-zinc-500 uppercase mb-2">Attached Objects</p>
                                     <div className="flex flex-wrap gap-2">
                                        {item.attachments.map((file, i) => (
                                           <a
                                             key={i}
                                             href={`${BACKEND_URL}${file.url}`}
                                             target="_blank"
                                             rel="noreferrer"
                                             className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black uppercase text-zinc-400 hover:text-white transition-all flex items-center gap-2"
                                           >
                                              <Paperclip size={10} /> {file.name}
                                           </a>
                                        ))}
                                     </div>
                                  </div>
                               )}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="lg:w-64 flex flex-col gap-3 justify-center">
                      <button
                        onClick={() => activeFolder === 'diagnosis' ? printRecord(item) : toast.error("Download pending synthesis")}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group"
                      >
                        {activeFolder === 'diagnosis' ? 'Print Record' : 'Download Records'} <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                      </button>
                      <button className={`w-full py-4 border rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                        theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}>
                        Full Report <ChevronRight size={14} />
                      </button>

                      {activeFolder === 'op' && item.status === 'Completed' && (
                        <button
                          onClick={() => handleOpenReview(item)}
                          className="w-full py-4 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          Write Review <Star size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-32 text-center opacity-30 flex flex-col items-center gap-4">
                  <FileText size={64} className="text-zinc-600" />
                  <p className="text-[12px] font-black uppercase tracking-[0.4em]">Directory Empty</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest">No clinical files found in this node.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* DOCTOR REVIEW MODAL NODE */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className={`w-full max-w-lg rounded-[48px] border shadow-2xl overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
              <div className={`p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                 <div className="text-left">
                    <h2 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Clinical Review</h2>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Feedback Synchronization Protocol</p>
                 </div>
                 <button onClick={() => setShowReviewModal(false)} className={`p-3 rounded-xl transition-all border ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white' : 'bg-white border-slate-100 text-slate-400'}`}><X size={20}/></button>
              </div>

              <div className="p-10 space-y-8 text-center">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rate the quality of clinical sync with {selectedAppointment?.doctorName}</p>
                    <div className="flex justify-center gap-3">
                       {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewData({ ...reviewData, rating: star })}
                            className={`p-2 transition-all transform active:scale-90 ${reviewData.rating >= star ? 'text-amber-500 scale-110' : 'text-zinc-700 opacity-30 hover:opacity-100'}`}
                          >
                             <Star size={32} fill={reviewData.rating >= star ? "currentColor" : "none"} strokeWidth={3} />
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Technical Feedback / Comments</label>
                    <textarea
                      className={`w-full p-6 rounded-[32px] border outline-none text-sm font-bold min-h-[140px] transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500/50' : 'bg-slate-50 border-slate-200'}`}
                      placeholder="Enter your assessment of the consultation quality..."
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    ></textarea>
                 </div>

                 <button
                   onClick={submitReview}
                   disabled={submittingReview}
                   className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                 >
                    {submittingReview ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
                    Establish Review Record
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PatientHistory;
