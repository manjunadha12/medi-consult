import React, { useState, useEffect } from 'react';
import { X, Send, Users, Search as SearchIcon, Loader2, CheckCircle, Activity, Clock, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import useStore from '../../store/useStore';

const ReferCase = ({ referredDoctor, onComplete, onShare }) => {
  const { theme } = useStore();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPatients, setFetchingPatients] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    patientId: '',
    referralReason: '',
    diagnosis: '',
    priority: 'Normal',
    notes: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/referrals/patients');
      setPatients(res.data);
    } catch (err) {
      toast.error("Failed to fetch patient registry");
    } finally {
      setFetchingPatients(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.patientId || !form.referralReason) {
      return toast.error("Patient and Reason are required telemetry fields");
    }

    setLoading(true);
    try {
      const payload = {
        patientId: form.patientId,
        referredDoctorId: referredDoctor.doctorId || referredDoctor.humanId,
        referralReason: form.referralReason,
        diagnosis: form.diagnosis,
        priority: form.priority,
        notes: form.notes
      };

      const res = await api.post('/referrals', payload);

      // Notify the chat
      if (onShare) {
        onShare({
          isAnalysis: true,
          content: `📋 REFERRAL DISPATCHED:\n\n**Patient**: ${res.data.patientName} (${res.data.patientId})\n**Priority**: ${res.data.priority}\n**Diagnosis**: ${res.data.diagnosis || 'N/A'}\n**Reason**: ${res.data.referralReason}\n\n*Reference ID: ${res.data.referralId}*`
        });
      }

      toast.success("Referral link established");
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Referral dispatch failed. Ensure specialist is in registry.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-white text-slate-700'}`}>
      <header className={`p-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
        <div>
          <h2 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Refer Case</h2>
          <p className="text-emerald-500 uppercase text-[8px] font-black tracking-widest mt-1">Specialist Handover Protocol</p>
        </div>
        <button onClick={onComplete} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
        {/* Recipient Doc Info */}
        <div className={`p-6 rounded-[32px] flex items-center gap-4 ${theme === 'dark' ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-500 ${theme === 'dark' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white shadow-sm'}`}>
            <Users size={24} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Recipient Specialist</p>
            <h3 className={`text-sm font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{referredDoctor.name}</h3>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">ID: {referredDoctor.doctorId || referredDoctor.humanId}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {/* Patient Selection */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Select Patient *</label>
            <div className="relative">
              <SearchIcon size={14} className="absolute left-4 top-4 text-zinc-600" />
              <input
                type="text"
                placeholder="SEARCH REGISTRY..."
                className={`w-full pl-10 pr-4 py-3.5 rounded-2xl outline-none font-bold text-xs transition-all placeholder:opacity-50 ${theme === 'dark' ? 'bg-white/5 border border-white/10 text-white focus:border-emerald-500/30' : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-emerald-500/30'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar mt-3`}>
              {fetchingPatients ? (
                <div className="col-span-full py-10 flex flex-col items-center gap-2 opacity-50">
                  <Loader2 className="animate-spin" size={20} />
                  <p className="text-[8px] font-black uppercase">Syncing Nodes...</p>
                </div>
              ) : filteredPatients.length > 0 ? filteredPatients.map(p => (
                <button
                  key={p.patientId}
                  type="button"
                  onClick={() => setForm({ ...form, patientId: p.patientId })}
                  className={`p-4 rounded-2xl border transition-all flex items-center gap-3 ${
                    form.patientId === p.patientId
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10'
                      : (theme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200')
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${form.patientId === p.patientId ? 'bg-emerald-500/20' : (theme === 'dark' ? 'bg-white/5' : 'bg-slate-50')}`}>
                    {p.name?.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className={`text-[10px] font-black uppercase ${form.patientId === p.patientId ? 'text-emerald-400' : (theme === 'dark' ? 'text-zinc-200' : 'text-slate-700')}`}>{p.name}</p>
                    <p className="text-[8px] opacity-60 uppercase font-bold">{p.patientId}</p>
                  </div>
                </button>
              )) : (
                <div className="col-span-full py-10 text-center opacity-30">
                  <p className="text-[8px] font-black uppercase">No matching nodes</p>
                </div>
              )}
            </div>
          </div>

          {/* Diagnosis & Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Clinical Diagnosis</label>
              <input
                type="text"
                placeholder="e.g. Acute neural anomaly"
                className={`w-full p-4 rounded-2xl outline-none font-bold text-xs transition-all ${theme === 'dark' ? 'bg-white/5 border border-white/10 text-white focus:border-emerald-500/30' : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-emerald-500/30'}`}
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Priority Level *</label>
              <div className="flex gap-2">
                {['Normal', 'Urgent', 'Emergency'].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setForm({ ...form, priority: lvl })}
                    className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                      form.priority === lvl
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5'
                        : (theme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-500' : 'bg-slate-50 border-slate-100 text-slate-400')
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Reason for Referral *</label>
            <textarea
              rows="3"
              placeholder="Detail the clinical handover requirements..."
              className={`w-full p-5 rounded-[24px] outline-none font-bold text-xs transition-all resize-none ${theme === 'dark' ? 'bg-white/5 border border-white/10 text-white focus:border-emerald-500/30' : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-emerald-500/30'}`}
              value={form.referralReason}
              onChange={(e) => setForm({ ...form, referralReason: e.target.value })}
              required
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Private Clinical Notes</label>
            <textarea
              rows="3"
              placeholder="Internal specialist-to-specialist notes..."
              className={`w-full p-5 rounded-[24px] outline-none font-bold text-xs transition-all resize-none ${theme === 'dark' ? 'bg-white/5 border border-white/10 text-white focus:border-emerald-500/30' : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-emerald-500/30'}`}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            ></textarea>
          </div>
        </form>
      </div>

      <footer className={`p-8 border-t flex justify-end gap-4 ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
        <button
          onClick={onComplete}
          className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-emerald-500/20 rounded-2xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
          {loading ? 'Dispatching...' : 'Establish Link'}
        </button>
      </footer>
    </div>
  );
};

export default ReferCase;
