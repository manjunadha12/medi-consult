import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import {
  QrCode, Search, CheckCircle, Clock, User, Building2,
  Stethoscope, AlertCircle, Loader2, ArrowRight, Activity,
  FileText, ShieldCheck, RefreshCw, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const HospitalCheckInDesk = () => {
  const { user, theme } = useStore();

  const [scanQuery, setScanQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [todayQueue, setTodayQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchTodayQueue();
  }, []);

  const fetchTodayQueue = async () => {
    try {
      setLoadingQueue(true);
      const res = await api.get('/offline-appointments/doctor-queue');
      if (res.data?.success) {
        setTodayQueue(res.data.appointments || []);
      }
    } catch (err) {
      console.error('[FETCH_QUEUE_ERR]', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleSearchCheckIn = async (e) => {
    e?.preventDefault();
    if (!scanQuery.trim()) return toast.error('Please scan a QR code or enter an Appointment / Patient ID');

    setSearching(true);
    try {
      const res = await api.post('/offline-appointments/scan-checkin', { query: scanQuery.trim() });
      if (res.data?.success) {
        setActiveAppointment(res.data.appointment);
        toast.success(`Patient record found: ${res.data.appointment.patientName}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'No appointment found matching this node identifier');
      setActiveAppointment(null);
    } finally {
      setSearching(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!activeAppointment) return;
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/offline-appointments/status/${activeAppointment.appointmentId}`, {
        status: newStatus
      });
      if (res.data?.success) {
        setActiveAppointment(res.data.appointment);
        toast.success(`Status updated to: ${newStatus}`);
        fetchTodayQueue();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

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
              <div className="space-y-1">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Hospital Reception Node
                </span>
                <h1 className={`text-3xl sm:text-4xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Patient QR Check-In Desk
                </h1>
                <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest">
                  Scan Digital Passes, Authenticate Patient ID & Manage OPD Consultation Flow
                </p>
              </div>

              <button
                onClick={fetchTodayQueue}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
              >
                <RefreshCw size={14} className={loadingQueue ? 'animate-spin' : ''} />
                <span>Sync Queue</span>
              </button>
            </header>

            {/* Scanner / ID Search Input Card */}
            <div className={`p-8 rounded-[40px] border shadow-2xl ${
              theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <form onSubmit={handleSearchCheckIn} className="space-y-4">
                <div className="flex items-center gap-3">
                  <QrCode size={20} className="text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-[0.25em] text-emerald-400">
                    Scan Reception Pass or Search Identifier
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Scan QR payload or enter OFF-2026-XXXXXX or Patient ID (e.g. PAT1001)..."
                      value={scanQuery}
                      onChange={(e) => setScanQuery(e.target.value)}
                      className={`w-full pl-11 pr-4 py-4 rounded-2xl font-mono text-sm font-bold outline-none border transition-all ${
                        theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={searching}
                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    <span>Lookup & Verify</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Active Appointment Inspection & Status Progression */}
            {activeAppointment && (
              <div className={`p-8 sm:p-10 rounded-[44px] border shadow-2xl animate-in zoom-in-95 duration-300 space-y-6 ${
                theme === 'dark' ? 'bg-[#0A0A0A] border-emerald-500/30' : 'bg-white border-emerald-500/30'
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-400">Verified Patient Check-In Node</span>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white mt-1">
                      {activeAppointment.patientName}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Patient ID: <span className="font-mono font-bold text-zinc-200">{activeAppointment.patientId}</span> • Phone: {activeAppointment.patientPhone}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[8px] font-black uppercase text-zinc-500">Appointment Token</span>
                    <p className="text-xl font-mono font-black text-emerald-400">{activeAppointment.appointmentId}</p>
                  </div>
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <p className="text-[8px] font-black uppercase text-zinc-500">Specialist Consultant</p>
                    <p className="text-sm font-black text-white uppercase">{activeAppointment.doctorName}</p>
                    <p className="text-[9px] text-purple-400 font-bold">{activeAppointment.department}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <p className="text-[8px] font-black uppercase text-zinc-500">Scheduled Time</p>
                    <p className="text-sm font-black text-blue-400">
                      {new Date(activeAppointment.appointmentDate).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] font-mono text-amber-400 font-bold">{activeAppointment.appointmentTime}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <p className="text-[8px] font-black uppercase text-zinc-500">Current Status</p>
                    <p className="text-sm font-black text-emerald-400 uppercase">{activeAppointment.status}</p>
                    <p className="text-[9px] text-zinc-400">Fee: ₹{activeAppointment.estimatedFee} (Counter)</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Reason for Visit</p>
                  <p className="text-xs text-zinc-300 font-medium">"{activeAppointment.reasonForVisit}"</p>
                </div>

                {/* Status Stepper Progression Actions */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Reception Action Workflow:</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => handleUpdateStatus('Checked In')}
                      disabled={updatingStatus || activeAppointment.status === 'Checked In'}
                      className={`p-4 rounded-2xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                        activeAppointment.status === 'Checked In'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg'
                          : 'bg-white/5 hover:bg-amber-600 hover:text-white border-white/10 text-zinc-300'
                      }`}
                    >
                      <CheckCircle size={14} /> Mark Checked-In
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('Waiting')}
                      disabled={updatingStatus || activeAppointment.status === 'Waiting'}
                      className={`p-4 rounded-2xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                        activeAppointment.status === 'Waiting'
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-lg'
                          : 'bg-white/5 hover:bg-purple-600 hover:text-white border-white/10 text-zinc-300'
                      }`}
                    >
                      <Clock size={14} /> Send to OPD Waiting
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('Consultation Started')}
                      disabled={updatingStatus || activeAppointment.status === 'Consultation Started'}
                      className={`p-4 rounded-2xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                        activeAppointment.status === 'Consultation Started'
                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-lg'
                          : 'bg-white/5 hover:bg-cyan-600 hover:text-white border-white/10 text-zinc-300'
                      }`}
                    >
                      <Activity size={14} /> Start Consultation
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('Completed')}
                      disabled={updatingStatus || activeAppointment.status === 'Completed'}
                      className={`p-4 rounded-2xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                        activeAppointment.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg'
                          : 'bg-white/5 hover:bg-emerald-600 hover:text-white border-white/10 text-zinc-300'
                      }`}
                    >
                      <ShieldCheck size={14} /> Complete Visit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Today's In-Person Queue Table */}
            <div className={`p-8 rounded-[40px] border shadow-2xl space-y-6 ${
              theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.25em] text-blue-400">
                    Today's Hospital OPD Queue ({todayQueue.length})
                  </h3>
                  <p className="text-[9px] text-zinc-500 uppercase">Live synchronization of arriving patients</p>
                </div>
              </div>

              {loadingQueue ? (
                <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="text-[10px] font-black uppercase">Loading OPD Queue...</span>
                </div>
              ) : todayQueue.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {todayQueue.map((item) => (
                    <div
                      key={item.appointmentId}
                      onClick={() => setActiveAppointment(item)}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 px-4 rounded-2xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center font-black text-xs font-mono">
                          {item.appointmentTime?.slice(0, 2)}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black uppercase text-white group-hover:text-blue-400 transition-colors">
                            {item.patientName}
                          </p>
                          <p className="text-[9px] text-zinc-400">
                            {item.appointmentId} • Dr. {item.doctorName} ({item.department})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                          item.status === 'Checked In'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : item.status === 'Waiting'
                            ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            : item.status === 'Completed'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        }`}>
                          {item.status}
                        </span>

                        <span className="text-[9px] font-mono text-zinc-400">{item.appointmentTime}</span>
                        <ChevronRight size={14} className="text-zinc-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500">
                  <p className="text-[10px] font-black uppercase tracking-widest">No patients currently queued for today</p>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default HospitalCheckInDesk;
