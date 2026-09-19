import React, { useState, useEffect, useRef } from 'react';
import api, { BACKEND_URL } from '../../utils/api';
import {
  Plus, FileText, Calendar, Clock, User, Save,
  ChevronRight, ChevronDown, Download, Printer,
  AlertCircle, CheckCircle, Info, Edit3, Trash2, X,
  Loader2, History, ClipboardList, Stethoscope, Activity, Sparkles, Image as ImageIcon, Paperclip
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../../store/useStore';

const DiagnosisSection = ({ patientId, patientName, initialHistory = [], onRecordAdded }) => {
  const { theme, user: doctor } = useStore();
  const [history, setHistory] = useState(initialHistory);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  // New Record State
  const [formData, setFormData] = useState({
    consultationDate: new Date().toISOString().slice(0, 16),
    diagnosis: '',
    chiefComplaint: '',
    symptoms: '',
    clinicalFindings: '',
    reportSummary: '',
    reportInterpretation: '',
    doctorsNotes: '',
    treatmentPlan: '',
    recommendedTests: '',
    followUpInstructions: '',
    nextReviewDate: '',
    medicationsText: ''
  });

  useEffect(() => {
    if (initialHistory && initialHistory.length > 0) {
      setHistory(initialHistory);
      setExpandedId(initialHistory[0]._id);
    } else if (patientId) {
      fetchHistory();
    }
  }, [initialHistory, patientId]);

  const fetchHistory = async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const res = await api.get(`/clinical-diagnosis/history/patient/${patientId}`);
      if (Array.isArray(res.data)) {
        setHistory(res.data);
        if (res.data.length > 0 && !expandedId) {
          setExpandedId(res.data[0]._id);
        }
      }
    } catch (err) {
      console.warn('[DIAGNOSIS_FETCH_WARN]:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.diagnosis) return toast.error("Primary diagnosis is mandatory");

    try {
      setSaving(true);

      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      data.append('patientId', patientId);
      data.append('patientName', patientName);

      selectedFiles.forEach(file => {
        data.append('attachments', file);
      });

      const res = await api.post('/clinical-diagnosis/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("Diagnosis node established");
      setShowAddForm(false);
      setSelectedFiles([]);

      // Update local state immediately
      if (res.data?.data) {
        setHistory(prev => [res.data.data, ...prev]);
        setExpandedId(res.data.data._id);
      } else {
        await fetchHistory();
      }

      // Trigger parent refresh
      if (onRecordAdded) onRecordAdded();

      // Reset form
      setFormData({
        consultationDate: new Date().toISOString().slice(0, 16),
        diagnosis: '',
        chiefComplaint: '',
        symptoms: '',
        clinicalFindings: '',
        reportSummary: '',
        reportInterpretation: '',
        doctorsNotes: '',
        treatmentPlan: '',
        recommendedTests: '',
        followUpInstructions: '',
        nextReviewDate: '',
        medicationsText: ''
      });
    } catch (err) {
      toast.error("Protocol failure: Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/clinical-diagnosis/${editingId}`, formData);
      toast.success("Identity node synchronized");
      setEditingId(null);
      if (onRecordAdded) onRecordAdded();
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (record) => {
    setEditingId(record._id);
    setFormData({
      consultationDate: new Date(record.consultationDate).toISOString().slice(0, 16),
      diagnosis: record.diagnosis,
      chiefComplaint: record.chiefComplaint,
      symptoms: record.symptoms,
      clinicalFindings: record.clinicalFindings,
      reportSummary: record.reportSummary,
      reportInterpretation: record.reportInterpretation,
      doctorsNotes: record.doctorsNotes,
      treatmentPlan: record.treatmentPlan,
      recommendedTests: record.recommendedTests,
      followUpInstructions: record.followUpInstructions,
      nextReviewDate: record.nextReviewDate ? new Date(record.nextReviewDate).toISOString().slice(0, 10) : '',
      medicationsText: record.medicationsText || ''
    });
    setShowAddForm(true);
  };

  const printRecord = (record) => {
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>Clinical Diagnosis Record - ${patientName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: 800; font-size: 14px; text-transform: uppercase; color: #2563eb; margin-bottom: 8px; border-left: 4px solid #2563eb; padding-left: 10px; }
            .data-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .field { margin-bottom: 15px; }
            .label { font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; }
            .value { font-size: 14px; font-weight: 600; }
            .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; pt: 20px; font-size: 10px; color: #94a3b8; text-align: center; }
            @media print { .no-print { display: none; } }
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
              <p style="margin:0; font-size: 12px; color: #64748b;">ID: ${record.doctorId}</p>
              <p style="margin:0; font-size: 12px; color: #64748b;">DATE: ${new Date(record.consultationDate).toLocaleString()}</p>
            </div>
          </div>

          <div class="data-grid">
            <div class="field"><div class="label">Patient Name</div><div class="value">${patientName}</div></div>
            <div class="field"><div class="label">Patient ID</div><div class="value">${patientId}</div></div>
          </div>

          <div class="section"><div class="section-title">Chief Complaint</div><p class="value">${record.chiefComplaint || 'N/A'}</p></div>
          <div class="section"><div class="section-title">Symptoms</div><p class="value">${record.symptoms || 'N/A'}</p></div>
          <div class="section"><div class="section-title">Clinical Findings</div><p class="value">${record.clinicalFindings || 'N/A'}</p></div>
          <div class="section"><div class="section-title">Primary Diagnosis</div><p class="value" style="font-size: 18px; color: #1e40af;">${record.diagnosis}</p></div>

          <div class="section"><div class="section-title">Report Summary</div><p class="value">${record.reportSummary || 'N/A'}</p></div>
          <div class="section"><div class="section-title">Report Interpretation</div><p class="value">${record.reportInterpretation || 'N/A'}</p></div>

          <div class="section"><div class="section-title">Treatment Plan</div><p class="value">${record.treatmentPlan || 'N/A'}</p></div>
          <div class="section"><div class="section-title">Medications Prescribed</div><p class="value">${record.medicationsText || 'N/A'}</p></div>
          <div class="section"><div class="section-title">Follow-up Instructions</div><p class="value">${record.followUpInstructions || 'N/A'}</p></div>

          <div style="margin-top: 40px; display: flex; justify-content: space-between;">
            <div>
              <p class="label">Next Review Date</p>
              <p class="value">${record.nextReviewDate ? new Date(record.nextReviewDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div style="text-align: right; border-top: 1px solid #333; width: 200px; padding-top: 10px;">
              <p class="label">Authorized Signature</p>
              <p class="value">Dr. ${record.doctorName}</p>
            </div>
          </div>

          <div class="footer">
            This is an electronically generated medical record authenticated by the MediConsult Neural Network.
          </div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 relative z-10">

      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
           <h3 className={`text-xl font-black uppercase tracking-tight flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              <ClipboardList className="text-blue-500" /> Diagnosis & Reports
           </h3>
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Chronological Clinical Intelligence Ledger</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingId(null);
            setSelectedFiles([]);
          }}
          className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl ${
            showAddForm
            ? 'bg-rose-500 text-white shadow-rose-500/20'
            : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-500'
          }`}
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />} {showAddForm ? 'Cancel Protocol' : 'Add New Record'}
        </button>
      </div>

      {/* NEW RECORD FORM */}
      {showAddForm && (
        <form onSubmit={editingId ? handleUpdate : handleSave} className={`p-8 sm:p-10 rounded-[48px] border backdrop-blur-3xl animate-in zoom-in-95 duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-100 shadow-2xl'}`}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Core Context */}
              <div className="space-y-6">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500"><Info size={20}/></div>
                    <h4 className="font-black text-xs uppercase tracking-widest text-blue-500">Visit Context</h4>
                 </div>

                 <div className="space-y-4">
                    <div className="text-left">
                       <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Consultation Timestamp</label>
                       <input
                         type="datetime-local"
                         className={`w-full p-4 rounded-2xl border outline-none font-bold text-xs mt-1 transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'}`}
                         value={formData.consultationDate}
                         onChange={e => setFormData({...formData, consultationDate: e.target.value})}
                       />
                    </div>
                    <div className="text-left">
                       <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Chief Complaint *</label>
                       <input
                         required
                         placeholder="e.g. Persistent chest pain, fatigue"
                         className={`w-full p-4 rounded-2xl border outline-none font-bold text-xs mt-1 transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'}`}
                         value={formData.chiefComplaint}
                         onChange={e => setFormData({...formData, chiefComplaint: e.target.value})}
                       />
                    </div>
                    <div className="text-left">
                       <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Symptoms Matrix</label>
                       <textarea
                         placeholder="Describe observed symptoms..."
                         className={`w-full p-4 rounded-2xl border outline-none font-bold text-xs mt-1 min-h-[100px] transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'}`}
                         value={formData.symptoms}
                         onChange={e => setFormData({...formData, symptoms: e.target.value})}
                       />
                    </div>
                 </div>
              </div>

              {/* Clinical Findings */}
              <div className="space-y-6">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500"><Stethoscope size={20}/></div>
                    <h4 className="font-black text-xs uppercase tracking-widest text-emerald-500">Clinical Nodes</h4>
                 </div>

                 <div className="space-y-4">
                    <div className="text-left">
                       <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Primary Diagnosis *</label>
                       <input
                         required
                         placeholder="Medical assessment and findings"
                         className={`w-full p-4 rounded-2xl border outline-none font-black text-sm mt-1 transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'}`}
                         value={formData.diagnosis}
                         onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                       />
                    </div>
                    <div className="text-left">
                       <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Clinical Findings</label>
                       <textarea
                         placeholder="Physical examination results, vitals observations..."
                         className={`w-full p-4 rounded-2xl border outline-none font-bold text-xs mt-1 min-h-[100px] transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'}`}
                         value={formData.clinicalFindings}
                         onChange={e => setFormData({...formData, clinicalFindings: e.target.value})}
                       />
                    </div>
                 </div>
              </div>

              {/* Report Summary */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                 <div className="text-left">
                    <div className="flex items-center gap-3 mb-4">
                       <Activity size={16} className="text-purple-500" />
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Lab/Imaging Objects Summary</label>
                    </div>
                    <textarea
                      placeholder="Explain laboratory reports, X-ray, CT, MRI, ECG in simple medical language..."
                      className={`w-full p-5 rounded-[32px] border outline-none font-bold text-xs transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 shadow-inner'}`}
                      value={formData.reportSummary}
                      onChange={e => setFormData({...formData, reportSummary: e.target.value})}
                    />
                 </div>
                 <div className="text-left">
                    <div className="flex items-center gap-3 mb-4">
                       <Sparkles size={16} className="text-amber-500" />
                       <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Clinical Significance & Interpretation</label>
                    </div>
                    <textarea
                      placeholder="Describe whether results are normal or abnormal and their significance..."
                      className={`w-full p-5 rounded-[32px] border outline-none font-bold text-xs transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 shadow-inner'}`}
                      value={formData.reportInterpretation}
                      onChange={e => setFormData({...formData, reportInterpretation: e.target.value})}
                    />
                 </div>
              </div>

              {/* Treatment Plan */}
              <div className="md:col-span-2 space-y-8 pt-6 border-t border-white/5">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="text-left">
                       <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Treatment Plan & Directives</label>
                       <textarea
                         placeholder="Detail the procedural or care path..."
                         className={`w-full p-5 rounded-[32px] border outline-none font-bold text-xs mt-2 transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'}`}
                         value={formData.treatmentPlan}
                         onChange={e => setFormData({...formData, treatmentPlan: e.target.value})}
                       />
                    </div>
                    <div className="text-left pt-6">
                        <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Medications Prescribed</label>
                        <textarea
                          placeholder="List medicines with dosage (e.g. Paracetamol 500mg 1-0-1)..."
                          className={`w-full p-5 rounded-[32px] border outline-none font-bold text-xs mt-2 transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'}`}
                          value={formData.medicationsText}
                          onChange={e => setFormData({...formData, medicationsText: e.target.value})}
                        />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                    <div className="text-left">
                       <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Follow-up Instructions</label>
                       <textarea
                         placeholder="Patient guidance and restrictions..."
                         className={`w-full p-5 rounded-[32px] border outline-none font-bold text-xs mt-2 transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'}`}
                         value={formData.followUpInstructions}
                         onChange={e => setFormData({...formData, followUpInstructions: e.target.value})}
                       />
                    </div>
                    {/* Attachment Node */}
                    <div className="text-left">
                       <label className="text-[9px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Digital Report Attachments (Max 5)</label>
                       <div
                         onClick={() => fileInputRef.current?.click()}
                         className={`mt-2 p-8 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${theme === 'dark' ? 'border-white/5 bg-white/5 hover:border-blue-500/40 hover:bg-blue-500/5' : 'border-slate-200 bg-slate-50 hover:border-blue-500/30 hover:bg-blue-50'}`}
                       >
                          <Paperclip size={24} className="text-blue-500" />
                          <p className="text-[10px] font-black text-zinc-500 uppercase">Attach Medical Scans or Reports</p>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            hidden
                            accept="image/*,.pdf"
                          />
                       </div>

                       {selectedFiles.length > 0 && (
                         <div className="mt-4 flex flex-wrap gap-2">
                            {selectedFiles.map((file, i) => (
                              <div key={i} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase flex items-center gap-2">
                                 {file.name} <X size={10} className="cursor-pointer" onClick={() => removeFile(i)} />
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                    <div className="text-left">
                       <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Recommended Tests</label>
                       <input
                         placeholder="Lab, Imaging, Vitals nodes..."
                         className={`w-full p-4 rounded-2xl border outline-none font-bold text-xs mt-1 transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'}`}
                         value={formData.recommendedTests}
                         onChange={e => setFormData({...formData, recommendedTests: e.target.value})}
                       />
                    </div>
                    <div className="text-left">
                       <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Next Review Target</label>
                       <input
                         type="date"
                         className={`w-full p-4 rounded-2xl border outline-none font-bold text-xs mt-1 transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'}`}
                         value={formData.nextReviewDate}
                         onChange={e => setFormData({...formData, nextReviewDate: e.target.value})}
                       />
                    </div>
                    <div className="flex items-end">
                       <button
                         type="submit"
                         disabled={saving}
                         className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 ${editingId ? 'bg-blue-600 shadow-blue-600/20' : 'bg-emerald-600 shadow-emerald-600/20'}`}
                       >
                         {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16} />}
                         {editingId ? 'Update Record Node' : 'Save Record Node'}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </form>
      )}

      {/* HISTORY LEDGER */}
      <div className="space-y-4">
         {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
               <Loader2 className="animate-spin text-blue-500" size={40} />
               <p className="text-[10px] font-black uppercase tracking-widest">Scanning clinical archives...</p>
            </div>
         ) : history.length === 0 ? (
            <div className={`p-20 text-center rounded-[48px] border-2 border-dashed ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
               <History size={48} className="mx-auto mb-4 text-zinc-500 opacity-20" />
               <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">No historical diagnosis nodes found</p>
            </div>
         ) : (
            history.map((record, index) => {
              const isLatest = index === 0;
              const isExpanded = expandedId === record._id;

              return (
                <div
                  key={record._id}
                  className={`border rounded-[40px] overflow-hidden transition-all duration-500 ${
                    isExpanded
                    ? (theme === 'dark' ? 'bg-[#0A0A0A] border-blue-500/30 ring-1 ring-blue-500/20 shadow-2xl' : 'bg-white border-blue-200 shadow-2xl')
                    : (theme === 'dark' ? 'bg-[#0A0A0A] border-white/5 hover:border-white/10' : 'bg-white border-slate-100 hover:shadow-md')
                  }`}
                >
                  {/* Record Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : record._id)}
                    className={`p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 cursor-pointer ${isExpanded ? (theme === 'dark' ? 'bg-blue-600/5' : 'bg-blue-50/50') : ''}`}
                  >
                    <div className="flex items-center gap-6 text-left">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${
                         isExpanded ? 'bg-blue-600 text-white border-blue-400/30' : (theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-500' : 'bg-slate-100 border-slate-200 text-slate-400')
                       }`}>
                          <ClipboardList size={28} />
                       </div>
                       <div>
                          <div className="flex items-center gap-3 mb-1">
                             <h4 className={`text-base font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{record.diagnosis}</h4>
                             {isLatest && <span className="px-2 py-0.5 bg-emerald-500 text-white text-[7px] font-black uppercase rounded-full">LATEST NODE</span>}
                          </div>
                          <div className="flex flex-wrap gap-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                             <span className="flex items-center gap-2"><Calendar size={12} className="text-blue-500"/> {new Date(record.consultationDate).toLocaleDateString()}</span>
                             <span className="flex items-center gap-2"><Clock size={12} className="text-purple-500"/> {new Date(record.consultationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             <span className="flex items-center gap-2"><User size={12} className="text-emerald-500"/> {record.doctorName} <span className="opacity-50">(ID: {record.doctorId})</span></span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                       {isLatest && (
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(record); }}
                            className={`flex-1 lg:flex-none p-3 rounded-xl transition-all border ${theme === 'dark' ? 'bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                            title="Edit Latest Record"
                          >
                             <Edit3 size={18} />
                          </button>
                       )}
                       <button
                         onClick={(e) => { e.stopPropagation(); printRecord(record); }}
                         className={`flex-1 lg:flex-none p-3 rounded-xl transition-all border ${theme === 'dark' ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white' : 'bg-slate-50 border-slate-100 hover:shadow-md hover:bg-white hover:text-blue-600'}`}
                         title="Print Record"
                       >
                          <Printer size={18} />
                       </button>
                       <div className={`p-3 rounded-xl transition-all ${isExpanded ? 'rotate-180 text-blue-500' : 'text-zinc-600'}`}>
                          <ChevronDown size={20} />
                       </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-8 sm:p-10 pt-0 animate-in fade-in slide-in-from-top-4 duration-500 text-left space-y-10">
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                          <div className="space-y-8">
                             <div className="space-y-4">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">Chief Complaint</p>
                                <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-700'}`}>{record.chiefComplaint || 'No records node established.'}</p>
                             </div>
                             <div className="space-y-4">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">Symptoms Ledger</p>
                                <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-600'}`}>{record.symptoms || '—'}</p>
                             </div>
                             <div className="space-y-4">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">Clinical Findings</p>
                                <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-600'}`}>{record.clinicalFindings || '—'}</p>
                             </div>
                          </div>

                          <div className="space-y-8 border-l border-white/5 pl-0 lg:pl-12">
                             <div className={`p-6 rounded-[32px] border ${theme === 'dark' ? 'bg-purple-500/5 border-purple-500/10' : 'bg-purple-50 border-purple-100'}`}>
                                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-2 mb-4">Report Objects Summary</p>
                                <p className={`text-xs font-bold leading-relaxed italic ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                                   "{record.reportSummary || 'Clinical report analysis node empty.'}"
                                </p>
                             </div>
                             <div className={`p-6 rounded-[32px] border ${theme === 'dark' ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-50 border-amber-100'}`}>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-4">Diagnostic Interpretation</p>
                                <p className={`text-xs font-bold leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-700'}`}>
                                   {record.reportInterpretation || '—'}
                                </p>
                             </div>

                             {/* ATTACHMENTS VIEW */}
                             {record.attachments?.length > 0 && (
                                <div className="space-y-4">
                                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Paperclip size={14}/> Attached Objects</p>
                                   <div className="flex flex-wrap gap-3">
                                      {record.attachments.map((file, idx) => (
                                         <a
                                           key={idx}
                                           href={`${BACKEND_URL}${file.url}`}
                                           target="_blank"
                                           rel="noreferrer"
                                           className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:shadow-md'}`}
                                         >
                                            {file.fileType.includes('image') ? <ImageIcon size={16} className="text-blue-500"/> : <FileText size={16} className="text-purple-500"/>}
                                            <p className="text-[10px] font-black uppercase text-zinc-400">{file.name}</p>
                                         </a>
                                      ))}
                                   </div>
                                </div>
                             )}
                          </div>

                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/5">
                          <div className="space-y-4">
                             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Treatment Path</p>
                             <p className={`text-sm font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{record.treatmentPlan || 'Routine Monitoring'}</p>
                          </div>
                          <div className="space-y-4">
                             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Medications Prescribed</p>
                             <p className={`text-sm font-bold ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-700'}`}>{record.medicationsText || 'Standard Care'}</p>
                          </div>
                       </div>

                       {record.nextReviewDate && (
                         <div className={`p-6 rounded-[32px] border flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center gap-4">
                               <Calendar size={18} className="text-blue-500" />
                               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Next Clinical Review Node:</span>
                               <span className="text-sm font-black text-blue-500 uppercase tracking-tighter">{new Date(record.nextReviewDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest px-3 py-1 bg-emerald-500/10 rounded-full">Protocol Ready</span>
                         </div>
                       )}

                       {record.editHistory?.length > 0 && (
                         <div className="pt-6 mt-6 border-t border-white/5">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-3 flex items-center gap-2"><History size={10} /> Clinical Audit Trail</p>
                            <div className="space-y-2">
                               {record.editHistory.map((edit, idx) => (
                                 <p key={idx} className="text-[8px] font-bold text-zinc-500 uppercase">
                                    Link updated by {edit.updatedBy} at {new Date(edit.updatedAt).toLocaleString()}
                                 </p>
                               ))}
                            </div>
                         </div>
                       )}
                    </div>
                  )}
                </div>
              );
            })
         )}
      </div>

    </div>
  );
};

export default DiagnosisSection;
