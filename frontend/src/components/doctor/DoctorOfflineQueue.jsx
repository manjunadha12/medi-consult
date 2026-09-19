import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import {
  Building2, Stethoscope, User, Calendar, Clock,
  CheckCircle, FileText, Plus, Trash2, Loader2, Search,
  Activity, ShieldCheck, X, Pill, AlertCircle, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DoctorOfflineQueue = () => {
  const { user, theme } = useStore();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Active consultation modal
  const [activeAppt, setActiveAppt] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', frequency: '1-0-1', duration: '5 Days', instructions: 'After Meals' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/offline-appointments/doctor-queue');
      if (res.data?.success) {
        setAppointments(res.data.appointments || []);
      }
    } catch (err) {
      console.error('[DOCTOR_QUEUE_ERR]', err);
    } finally {
      setLoading(false);
    }
  };

  const openConsultationModal = (appt) => {
    setActiveAppt(appt);
    setDiagnosis(appt.diagnosis || '');
    setClinicalNotes(appt.clinicalNotes || '');
    setAdvice(appt.prescription?.advice || '');
    setFollowUpDate(appt.prescription?.followUpDate || '');
    if (appt.prescription?.medicines?.length > 0) {
      setMedicines(appt.prescription.medicines);
    } else {
      setMedicines([{ name: '', dosage: '', frequency: '1-0-1', duration: '5 Days', instructions: 'After Meals' }]);
    }
  };

  const addMedicineRow = () => {
    setMedicines(prev => [...prev, { name: '', dosage: '', frequency: '1-0-1', duration: '5 Days', instructions: 'After Meals' }]);
  };

  const removeMedicineRow = (index) => {
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const handleMedChange = (index, field, val) => {
    setMedicines(prev => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const handleCompleteConsultation = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) return toast.error('Please enter clinical diagnosis');

    setSubmitting(true);
    try {
      const payload = {
        diagnosis,
        clinicalNotes,
        prescription: {
          medicines: medicines.filter(m => m.name.trim()),
          advice,
          followUpDate
        }
      };

      const res = await api.post(`/offline-appointments/complete/${activeAppt.appointmentId}`, payload);
      if (res.data?.success) {
        toast.success(`Consultation completed for ${activeAppt.patientName}`);
        setActiveAppt(null);
        fetchQueue();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = appointments.filter(a => {
    if (filterTab === 'Waiting' && !['Checked In', 'Waiting'].includes(a.status)) return false;
    if (filterTab === 'In-Progress' && a.status !== 'Consultation Started') return false;
    if (filterTab === 'Completed' && a.status !== 'Completed') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.appointmentId?.toLowerCase().includes(q) ||
        a.patientName?.toLowerCase().includes(q) ||
        a.patientId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left neural-grid pb-24 ${
      theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-700'
    }`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-4 sm:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/5">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-purple-400 flex items-center gap-1.5">
                  <Stethoscope size={14} /> Hospital OPD Clinical Queue
                </span>
                <h1 className={`text-3xl sm:text-4xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  In-Person Patient Consultations
                </h1>
                <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest">
                  Conduct Hospital OPD Consultations, Record Clinical Findings & Generate Digital Prescriptions
                </p>
              </div>

              <button
                onClick={fetchQueue}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh Queue</span>
              </button>
            </header>

            {/* Filter Tabs & Search */}
            <div className={`p-6 rounded-[36px] border ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'} shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4`}>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {['All', 'Waiting', 'In-Progress', 'Completed'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                      filterTab === tab
                        ? 'bg-purple-600 border-purple-400 text-white shadow-lg'
                        : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search Patient Name / ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold outline-none border transition-all ${
                    theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            {/* Queue List */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="animate-spin text-purple-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Loading Doctor Queue...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filtered.map(appt => (
                  <div
                    key={appt.appointmentId}
                    className={`p-6 rounded-[32px] border shadow-2xl transition-all space-y-4 ${
                      theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="font-mono text-[9px] font-black text-emerald-400">{appt.appointmentId}</span>
                        <h3 className="text-lg font-black uppercase text-white tracking-tight">{appt.patientName}</h3>
                        <p className="text-xs text-zinc-400 font-bold">ID: {appt.patientId} • Phone: {appt.patientPhone}</p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase border ${
                        appt.status === 'Waiting'
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                          : appt.status === 'Checked In'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : appt.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}>
                        {appt.status}
                      </span>
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl space-y-1 text-xs">
                      <p className="text-[8px] font-black uppercase text-zinc-500">Reason for Visit</p>
                      <p className="text-zinc-200 font-medium">"{appt.reasonForVisit}"</p>
                    </div>

                    {appt.medicalReports?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-blue-400" />
                        <span className="text-[9px] font-bold text-blue-400 uppercase">{appt.medicalReports.length} Attached Lab/X-Ray Report(s)</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                        <Clock size={12} /> {appt.appointmentTime}
                      </span>

                      <button
                        onClick={() => openConsultationModal(appt)}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[9px] uppercase tracking-widest transition-all shadow-lg"
                      >
                        {appt.status === 'Completed' ? 'View / Edit Prescription' : 'Conduct Consultation'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center space-y-3">
                <Stethoscope size={48} className="mx-auto text-zinc-500 opacity-40" />
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">No OPD consultations in this category</p>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Consultation Modal */}
      {activeAppt && (
        <div className="fixed inset-0 z-[3000] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className={`w-full max-w-3xl my-8 rounded-[44px] border shadow-2xl overflow-hidden ${
            theme === 'dark' ? 'bg-[#0A0A0A] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-purple-400">In-Person Clinical Consultation Console</span>
                <h3 className="text-xl font-black uppercase tracking-tight">{activeAppt.patientName}</h3>
                <p className="text-xs text-zinc-400">{activeAppt.appointmentId} • Reason: {activeAppt.reasonForVisit}</p>
              </div>
              <button
                onClick={() => setActiveAppt(null)}
                className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCompleteConsultation} className="p-8 space-y-6 text-left">
              
              {/* Diagnosis */}
              <div>
                <label className="text-[8px] font-black uppercase text-zinc-400 ml-1">Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Acute Bronchitis, Right Knee Medial Meniscus Strain, Hypertension Grade 1"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className={`w-full p-3.5 rounded-xl text-xs font-bold outline-none border transition-all ${
                    theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              {/* Examination Notes */}
              <div>
                <label className="text-[8px] font-black uppercase text-zinc-400 ml-1">Physical Examination & Clinical Notes</label>
                <textarea
                  rows={3}
                  placeholder="Record vitals observed, chest auscultation, tenderness, reflex response..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className={`w-full p-3.5 rounded-xl text-xs font-medium outline-none border transition-all ${
                    theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              {/* Prescription Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[8px] font-black uppercase text-emerald-400 ml-1 flex items-center gap-1.5">
                    <Pill size={12} /> Digital Prescription (Medicines & Dosage)
                  </label>
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="px-3 py-1 bg-emerald-600/20 text-emerald-400 rounded-lg text-[8px] font-black uppercase flex items-center gap-1"
                  >
                    <Plus size={10} /> Add Medication
                  </button>
                </div>

                <div className="space-y-2">
                  {medicines.map((med, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-white/5 rounded-xl border border-white/5 items-center">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          placeholder="Medicine Name (e.g. Augmentin 625)"
                          value={med.name}
                          onChange={(e) => handleMedChange(index, 'name', e.target.value)}
                          className="w-full p-2 rounded-lg bg-zinc-900 border border-white/10 text-xs font-bold text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Dosage (625mg)"
                          value={med.dosage}
                          onChange={(e) => handleMedChange(index, 'dosage', e.target.value)}
                          className="w-full p-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Freq (1-0-1)"
                          value={med.frequency}
                          onChange={(e) => handleMedChange(index, 'frequency', e.target.value)}
                          className="w-full p-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Duration (5 Days After Meals)"
                          value={med.duration}
                          onChange={(e) => handleMedChange(index, 'duration', e.target.value)}
                          className="w-full p-2 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white"
                        />
                      </div>
                      <div className="sm:col-span-1 text-center">
                        {medicines.length > 1 && (
                          <button type="button" onClick={() => removeMedicineRow(index)} className="text-rose-400 hover:text-white p-1">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice & Follow-up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black uppercase text-zinc-400 ml-1">General Medical Advice / Diet</label>
                  <input
                    type="text"
                    placeholder="e.g. Adequate hydration, warm saline gargle, rest"
                    value={advice}
                    onChange={(e) => setAdvice(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white font-medium"
                  />
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase text-zinc-400 ml-1">Follow-Up Date / Review</label>
                  <input
                    type="text"
                    placeholder="e.g. 7 Days or 18 September 2026"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white font-medium"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-white/10 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveAppt(null)}
                  className="px-6 py-3.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white text-[9px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  <span>Save Prescription & Complete Consultation</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorOfflineQueue;
