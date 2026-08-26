import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import {
  Pill, Plus, X, CheckCircle, Circle, Trash2, Clock,
  AlertCircle, Loader2, Sparkles, Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import useStore from '../../store/useStore';
import { scheduleMedicineAlarm, requestNotificationPermission, cancelMedicineAlarm } from '../../utils/notifications';

const MedicineReminder = () => {
  const { user, theme } = useStore();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    time: '09:00',
    food: 'After Food',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    endDate: ''
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user?.userId) {
      fetchMedicines();
    }
  }, [user?.userId]);

  const fetchMedicines = async () => {
    try {
      const { data } = await api.get(`/medicines/${user.userId}`);
      setMedicines(data);
    } catch (error) {
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/medicines', { ...newMed, patientId: user.userId });
      setMedicines([...medicines, data]);
      setShowAddModal(false);

      // Schedule Alarm
      await requestNotificationPermission();
      await scheduleMedicineAlarm(data);

      toast.success("Medicine added & Alarm set!");

      setNewMed({
        name: '',
        dosage: '',
        time: '09:00',
        food: 'After Food',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        endDate: ''
      });
    } catch (error) {
      toast.error("Failed to add medicine");
    }
  };

  const toggleTaken = async (id, currentStatus) => {
    try {
      await api.put(`/medicines/toggle/${id}`, { date: today, status: !currentStatus });
      setMedicines(medicines.map(m =>
        m._id === id
        ? { ...m, takenLogs: [...(m.takenLogs || []).filter(l => l.date !== today), { date: today, status: !currentStatus }] }
        : m
      ));
      if (!currentStatus) toast.success("Marked as taken");
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const deleteMed = async (id, name) => {
    if (!window.confirm("Remove this reminder?")) return;
    try {
      await api.delete(`/medicines/${id}`);
      await cancelMedicineAlarm(name);
      setMedicines(medicines.filter(m => m._id !== id));
      toast.success("Reminder removed");
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const isTakenToday = (med) => {
    return med.takenLogs?.find(l => l.date === today)?.status || false;
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-300' : 'bg-[#F8FAFC] text-slate-600'} text-left`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-8 lg:p-10 pb-32 overflow-y-auto custom-scrollbar">
          <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="text-left">
              <h1 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Medication Schedule</h1>
              <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mt-1">Dose synchronization and adherence tracking</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-blue-500/20 flex items-center gap-3 hover:bg-blue-500 transition-all active:scale-95 border border-blue-400/20"
            >
              <Plus size={18} strokeWidth={3} /> Add Medication
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-4">
              {loading ? (
                <div className="py-20 flex flex-col items-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600/20 mb-4" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Synchronizing Schedule...</p>
                </div>
              ) : medicines.length > 0 ? (
                medicines.map((med) => (
                  <div key={med._id} className={`p-6 rounded-[32px] border transition-all duration-500 group ${
                    isTakenToday(med)
                    ? (theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20 shadow-none' : 'bg-green-50 border-green-100 shadow-none')
                    : (theme === 'dark' ? 'bg-[#0A0A0A] border-white/5 shadow-2xl shadow-black/40 hover:border-blue-500/30' : 'bg-white border-slate-100 shadow-sm hover:border-blue-200')
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                          isTakenToday(med)
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30'
                          : (theme === 'dark' ? 'bg-zinc-900 text-blue-500 border-white/5' : 'bg-blue-50 text-blue-600 border-blue-100 shadow-inner')
                        }`}>
                          <Pill size={24} />
                        </div>
                        <div className="text-left">
                          <h3 className={`font-black text-lg uppercase tracking-tight ${isTakenToday(med) ? 'text-emerald-500/50 line-through' : (theme === 'dark' ? 'text-slate-100' : 'text-slate-800')}`}>
                            {med.name}
                          </h3>
                          <div className="flex gap-4 text-[9px] font-black uppercase tracking-[0.2em] mt-2 flex-wrap">
                            <span className="flex items-center gap-1.5 text-slate-400"><Clock size={12} /> {med.time}</span>
                            <span className="text-slate-400">Node: {med.dosage}</span>
                            <span className="text-blue-500">{med.food}</span>
                            {med.endDate && (
                              <span className="text-rose-500 font-bold">Ends: {new Date(med.endDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => deleteMed(med._id, med.name)}
                          className={`p-3 rounded-xl transition-all ${theme === 'dark' ? 'bg-white/5 text-zinc-700 hover:text-red-500' : 'bg-slate-50 text-slate-300 hover:text-red-500'} opacity-0 group-hover:opacity-100`}
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => toggleTaken(med._id, isTakenToday(med))}
                          className={`transition-all active:scale-90 ${
                            isTakenToday(med) ? 'text-emerald-500' : 'text-slate-200 dark:text-zinc-800 hover:text-blue-500'
                          }`}
                        >
                          {isTakenToday(med) ? <CheckCircle size={48} /> : <Circle size={48} strokeWidth={2} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`py-32 text-center rounded-[56px] border-2 border-dashed transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-slate-50/50 border-slate-100'}`}>
                   <Pill size={64} className="text-zinc-800 mx-auto mb-6 opacity-20" />
                   <h3 className="text-lg font-black text-zinc-500 uppercase tracking-widest">No Medications Scheduled</h3>
                   <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-2">Add clinical medications to initialize alarms.</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className={`p-8 rounded-[40px] border transition-all duration-500 ${theme === 'dark' ? 'bg-amber-500/5 border-amber-500/10 text-amber-500' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                <div className="flex gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white border-amber-200'}`}>
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="font-black text-xs uppercase tracking-widest flex items-center">Neural Alert</h3>
                </div>
                <p className="text-xs font-bold leading-relaxed uppercase tracking-tight opacity-80 text-left">
                  Regularity is critical for recovery nodes. Ensure dose synchronization within 15 minutes of scheduled time.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-[#050505]/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className={`w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
            <div className={`p-10 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-50 bg-slate-50/50'}`}>
               <h2 className={`text-xl font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Initialize Dose</h2>
               <button onClick={() => setShowAddModal(false)} className={`p-3 rounded-2xl transition-all border ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                  <X size={20} strokeWidth={3} />
               </button>
            </div>
            <form onSubmit={handleAddMedicine} className="p-10 space-y-8 text-left">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Medication Identity</label>
                  <input required type="text" placeholder="NODE NAME (e.g. Paracetamol)" className={`w-full p-5 rounded-3xl font-black text-sm outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border border-white/5 text-white focus:border-blue-500/30' : 'bg-slate-50 border border-slate-100 text-slate-800 focus:border-blue-600/30 shadow-inner'}`}
                    value={newMed.name} onChange={(e) => setNewMed({...newMed, name: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dosage Node</label>
                    <input required type="text" placeholder="500mg" className={`w-full p-5 rounded-3xl font-black text-sm outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border border-white/5 text-white focus:border-blue-500/30' : 'bg-slate-50 border border-slate-100 text-slate-800 focus:border-blue-600/30 shadow-inner'}`}
                      value={newMed.dosage} onChange={(e) => setNewMed({...newMed, dosage: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Time Loop</label>
                    <input required type="time" className={`w-full p-5 rounded-3xl font-black text-sm outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border border-white/5 text-white focus:border-blue-500/30' : 'bg-slate-50 border border-slate-100 text-slate-800 focus:border-blue-600/30 shadow-inner'}`}
                      value={newMed.time} onChange={(e) => setNewMed({...newMed, time: e.target.value})} />
                  </div>
               </div>
               <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">End Diagnostic Cycle (Date)</label>
                  <input type="date" className={`w-full p-5 rounded-3xl font-black text-sm outline-none transition-all ${theme === 'dark' ? 'bg-zinc-900 border border-white/5 text-white focus:border-blue-500/30' : 'bg-slate-50 border border-slate-100 text-slate-800 focus:border-blue-600/30 shadow-inner'}`}
                    value={newMed.endDate} onChange={(e) => setNewMed({...newMed, endDate: e.target.value})} />
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Neural Preference</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Before Food', 'After Food', 'With Food'].map(opt => (
                      <button key={opt} type="button" onClick={() => setNewMed({...newMed, food: opt})}
                        className={`py-4 rounded-2xl text-[9px] font-black uppercase transition-all border ${
                          newMed.food === opt
                          ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20'
                          : (theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100')
                        }`}
                      >{opt}</button>
                    ))}
                  </div>
               </div>
               <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-blue-600/30 transition-all active:scale-95">
                  Set Synchronized Alarm
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineReminder;
