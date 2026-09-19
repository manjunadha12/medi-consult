import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import api from '../../utils/api';
import {
  Clock, User as UserIcon, AlertCircle, CheckCircle,
  ExternalLink, Search as SearchIcon, Filter, History as HistoryIcon, Video, MessageCircle, Settings, Shield, X, Save, Edit3, Building, Building2, Stethoscope, Calendar, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PatientQueue = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('active'); // 'active' or 'history'
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'OFFLINE', 'ONLINE'
  const [searchQuery, setSearchQuery] = useState('');

  // Meeting Setup States
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [meetingForm, setMeetingForm] = useState({
    meetingId: '',
    meetingPassword: '',
    scheduledVideoTime: ''
  });
  const [savingMeeting, setSavingMeeting] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const [onlineRes, offlineRes] = await Promise.allSettled([
        api.get('/appointments/doctor-queue'),
        api.get('/offline-appointments/doctor-queue')
      ]);

      let onlineList = [];
      if (onlineRes.status === 'fulfilled') {
        onlineList = (onlineRes.value.data || []).map(item => ({
          ...item,
          consultationType: item.consultationType || (item.type === 'offline' ? 'OFFLINE' : 'VIDEO_CALL'),
          isOffline: item.type === 'offline' || item.consultationType === 'OFFLINE'
        }));
      }

      let offlineList = [];
      if (offlineRes.status === 'fulfilled' && offlineRes.value.data?.appointments) {
        offlineList = (offlineRes.value.data.appointments || []).map(item => ({
          ...item,
          _id: item.appointmentId || item._id,
          tokenNumber: item.tokenNumber,
          patientName: item.patientName,
          patientId: item.patientId,
          problemDescription: item.symptoms || item.department || 'Hospital OP Consultation',
          time: item.timeSlot || item.appointmentDate || 'Today',
          status: item.status || 'Booked',
          consultationType: 'OFFLINE',
          isOffline: true,
          hospitalName: item.hospitalName
        }));
      }

      setQueue([...onlineList, ...offlineList]);
    } catch (err) {
      console.error('[FETCH_QUEUE_ERR]', err);
      toast.error("Failed to load clinical queue");
    } finally {
      setLoading(false);
    }
  };

  const filteredQueue = queue.filter(p => {
    if (typeFilter === 'OFFLINE') return p.isOffline || p.consultationType === 'OFFLINE';
    if (typeFilter === 'ONLINE') return !p.isOffline && p.consultationType !== 'OFFLINE';
    return true;
  }).filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (p.patientName || '').toLowerCase().includes(q) ||
           (p.patientId || '').toLowerCase().includes(q) ||
           (p.tokenNumber || '').toString().includes(q);
  });

  const displayData = view === 'active'
    ? filteredQueue.filter(p => {
        const s = (p.status || '').toLowerCase();
        return s === 'live' || s === 'pending' || s === 'accepted' || s === 'booked' || s === 'checked in' || s === 'waiting' || s === 'consultation started';
      })
    : filteredQueue.filter(p => {
        const s = (p.status || '').toLowerCase();
        return s === 'completed' || s === 'cancelled' || s === 'rejected' || s === 'finished';
      });

  const handleAttend = (p) => {
    if (p.status === 'Pending') {
      return toast.error("Please accept the appointment node first");
    }
    toast.success(`Synchronizing node with ${p.patientName}`);
    navigate(`/doctor/video-consult?roomCode=${p._id}&appointmentId=${p._id}&patientId=${p.patientId}&patientName=${p.patientName}`);
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/appointments/accept/${id}`);
      toast.success("Consultation Link Authorized");
      fetchQueue();
    } catch (err) {
      toast.error("Authorization failed");
    }
  };

  const openMeetingSetup = (p) => {
    setSelectedAppt(p);
    setMeetingForm({
      meetingId: p.meetingId || `MC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      meetingPassword: p.meetingPassword || Math.random().toString(36).substring(2, 8).toUpperCase(),
      scheduledVideoTime: p.scheduledVideoTime || p.time
    });
    setShowMeetingModal(true);
  };

  const handleSaveMeeting = async (e) => {
    e.preventDefault();
    setSavingMeeting(true);
    try {
      await api.put(`/appointments/video-meeting/${selectedAppt._id}`, meetingForm);
      toast.success("Meeting Node Configured");
      setShowMeetingModal(false);
      fetchQueue();
    } catch (err) {
      toast.error("Failed to sync meeting node");
    } finally {
      setSavingMeeting(false);
    }
  };

  const handleToggleMeetingReady = async (id, currentReady) => {
    try {
      await api.put(`/appointments/toggle-meeting-ready/${id}`, { isMeetingReady: !currentReady });
      toast.success(!currentReady ? "Clinical Arena Ready" : "Clinical Arena Offline");
      fetchQueue();
    } catch (err) {
      toast.error("Handshake Failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-300 text-left neural-grid pb-24">
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        
        <main className="p-8 lg:p-10 overflow-y-auto custom-scrollbar relative z-10">
          <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tight">Clinical OP Queue</h1>
              <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mt-1">Live Diagnostic Loop Monitor • Offline & Online Integrated</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 gap-1.5 flex-wrap">
              <button
                onClick={() => { setView('active'); setTypeFilter('ALL'); }}
                className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === 'active' && typeFilter === 'ALL' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                All Active
              </button>
              <button
                onClick={() => { setView('active'); setTypeFilter('OFFLINE'); }}
                className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5 ${view === 'active' && typeFilter === 'OFFLINE' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Building size={12} /> Offline OP
              </button>
              <button
                onClick={() => { setView('active'); setTypeFilter('ONLINE'); }}
                className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5 ${view === 'active' && typeFilter === 'ONLINE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Video size={12} /> Online Video
              </button>
              <button
                onClick={() => setView('history')}
                className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === 'history' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Past Buffer
              </button>
            </div>
          </header>

          <div className="bg-zinc-950/80 rounded-[48px] border border-blue-500/20 shadow-2xl overflow-hidden noise-overlay">
            <div className="p-8 bg-white/5 border-b border-white/5 flex flex-col md:flex-row gap-6 items-center">
              <div className="relative flex-1 w-full">
                <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder="SEARCH PATIENT, TOKEN, OR NODE ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl outline-none text-xs font-black uppercase tracking-widest text-white focus:border-blue-500/30 transition-all shadow-inner placeholder:text-zinc-650"
                />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => navigate('/doctor/offline-queue')} className="px-5 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm">
                  <Building size={16} /> Open Hospital OP Desk
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] bg-white/5">
                  <tr>
                    <th className="px-10 py-6">Node Token</th>
                    <th className="px-10 py-6">Biological Profile</th>
                    <th className="px-10 py-6">Consultation Mode</th>
                    <th className="px-10 py-6">Diagnostic Case</th>
                    <th className="px-10 py-6">System Status</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayData.length > 0 ? displayData.map((p, i) => {
                    const isOffline = p.isOffline || p.consultationType === 'OFFLINE';
                    return (
                      <tr key={i} className={`hover:bg-white/5 transition-all ${p.isEmergency ? 'bg-red-500/5' : ''}`}>
                        <td className="px-10 py-8">
                          <div className={`w-16 h-16 rounded-[24px] flex flex-col items-center justify-center border-2 ${
                            p.isEmergency ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse' : (isOffline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400')
                          }`}>
                            <span className="text-[8px] font-black uppercase opacity-60">Token</span>
                            <span className="text-2xl font-black">#{p.tokenNumber}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400 font-black text-lg border border-white/10 shadow-inner">
                              {p.patientName?.charAt(0) || 'P'}
                            </div>
                            <div>
                              <p className="font-black text-white uppercase tracking-tight truncate max-w-[140px]">{p.patientName}</p>
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">{p.patientId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          {isOffline ? (
                            <span className="px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 inline-flex items-center gap-1.5">
                              <Building size={12} /> Offline Hospital OP
                            </span>
                          ) : (
                            <span className="px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-blue-500/10 text-blue-400 border-blue-500/20 inline-flex items-center gap-1.5">
                              <Video size={12} /> Online Video Call
                            </span>
                          )}
                        </td>
                        <td className="px-10 py-8">
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-tight truncate max-w-[180px]">{p.problemDescription}</p>
                          <p className="text-[9px] font-black text-zinc-550 uppercase mt-2 flex items-center gap-1.5"><Clock size={10}/> Entry: {p.time}</p>
                        </td>
                        <td className="px-10 py-8">
                          <span className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            <div className={`w-2 h-2 rounded-full ${p.status === 'Pending' || p.status === 'Booked' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-emerald-400'}`}></div>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex justify-end gap-3">
                            {isOffline ? (
                              <button
                                onClick={() => navigate('/doctor/offline-queue')}
                                className="px-6 py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all active:scale-95 border border-emerald-400/20 flex items-center gap-2"
                              >
                                <Building size={14} /> Hospital OP Desk
                              </button>
                            ) : p.status === 'Pending' ? (
                              <button
                                onClick={() => handleAccept(p._id)}
                                className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all active:scale-95 border border-emerald-400/20"
                              >
                                ACCEPT NODE
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => openMeetingSetup(p)}
                                  className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 border ${p.meetingId ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}
                                  title="Configure Video Node"
                                >
                                  <Settings size={20} />
                                </button>
                                <button
                                  onClick={() => navigate('/doctor/chat', { state: { startChat: true, targetUserId: p.patientId, appointmentId: p._id } })}
                                  className="p-4 bg-white/5 border border-white/10 text-emerald-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-md active:scale-90"
                                  title="Open neural link"
                                >
                                  <MessageCircle size={20} />
                                </button>
                                <button
                                  onClick={() => handleToggleMeetingReady(p._id, p.isMeetingReady)}
                                  className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${p.isMeetingReady ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white'}`}
                                >
                                  {p.isMeetingReady ? 'ARENA READY' : 'TAKE VIDEO'}
                                </button>
                                <button
                                  className={`px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95 border border-blue-400/20 ${!p.isMeetingReady && 'opacity-30 grayscale pointer-events-none'}`}
                                  onClick={() => handleAttend(p)}
                                  disabled={!p.isMeetingReady}
                                >
                                  JOIN
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="6" className="px-10 py-32 text-center">
                         <div className="flex flex-col items-center opacity-30">
                            <Clock size={64} className="mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Neural Queue Empty</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Meeting Setup Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="w-full max-w-lg rounded-[56px] bg-[#0A0A0A] border border-blue-500/20 shadow-2xl overflow-hidden transition-all duration-500">
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/5">
                 <div className="text-left">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Video Node Config</h2>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">Scheduled Specialized Handshake</p>
                 </div>
                 <button onClick={() => setShowMeetingModal(false)} className="p-4 rounded-[20px] transition-all border bg-zinc-900 border-white/5 text-zinc-500 hover:text-white"><X size={24} strokeWidth={3} /></button>
              </div>

              <form onSubmit={handleSaveMeeting} className="p-10 space-y-8 text-left">
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Meeting ID</label>
                       <div className="relative">
                          <Shield size={16} className="absolute left-5 top-5 text-blue-500" />
                          <input
                            className="w-full p-5 pl-14 rounded-3xl border bg-zinc-900 border-white/5 text-white outline-none font-black uppercase text-xs transition-all focus:border-blue-500/30"
                            placeholder="NODE ID"
                            value={meetingForm.meetingId}
                            onChange={(e) => setMeetingForm({...meetingForm, meetingId: e.target.value.toUpperCase()})}
                            required
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Passkey</label>
                       <div className="relative">
                          <Settings size={16} className="absolute left-5 top-5 text-purple-500" />
                          <input
                            className="w-full p-5 pl-14 rounded-3xl border bg-zinc-900 border-white/5 text-white outline-none font-black uppercase text-xs transition-all focus:border-purple-500/30"
                            placeholder="ENCRYPTION KEY"
                            value={meetingForm.meetingPassword}
                            onChange={(e) => setMeetingForm({...meetingForm, meetingPassword: e.target.value.toUpperCase()})}
                            required
                          />
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Scheduled Time Node</label>
                       <div className="relative">
                          <Clock size={16} className="absolute left-5 top-5 text-amber-500" />
                          <input
                            className="w-full p-5 pl-14 rounded-3xl border bg-zinc-900 border-white/5 text-white outline-none font-black uppercase text-xs transition-all focus:border-amber-500/30"
                            placeholder="HH:MM AM/PM"
                            value={meetingForm.scheduledVideoTime}
                            onChange={(e) => setMeetingForm({...meetingForm, scheduledVideoTime: e.target.value})}
                            required
                          />
                       </div>

                       {/* Quick Select Timing Chips */}
                       <div className="space-y-1.5 pt-1">
                          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Quick Select Timing:</p>
                          <div className="flex flex-wrap gap-2">
                             {[
                                'NOW (IMMEDIATE)',
                                '09:00 AM',
                                '10:30 AM',
                                '12:00 PM',
                                '02:30 PM',
                                '04:00 PM',
                                '06:00 PM',
                                '07:30 PM'
                             ].map((slot) => {
                                const isNow = slot === 'NOW (IMMEDIATE)';
                                const getTimeStr = () => {
                                   if (isNow) {
                                      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                                   }
                                   return slot;
                                };
                                const activeStr = getTimeStr();
                                const isSelected = meetingForm.scheduledVideoTime === activeStr || meetingForm.scheduledVideoTime === slot;
                                return (
                                   <button
                                     key={slot}
                                     type="button"
                                     onClick={() => setMeetingForm({ ...meetingForm, scheduledVideoTime: activeStr })}
                                     className={`px-3 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase transition-all border ${
                                       isSelected
                                         ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black'
                                         : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                                     }`}
                                   >
                                      {slot}
                                   </button>
                                );
                             })}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowMeetingModal(false)} className="flex-1 py-6 rounded-[32px] font-black uppercase text-[10px] tracking-[0.3em] transition-all border border-white/5 text-zinc-500 hover:bg-white/5">Abort</button>
                    <button
                      type="submit"
                      disabled={savingMeeting}
                      className="flex-[2] bg-blue-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                    >
                       {savingMeeting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} strokeWidth={3} />}
                       Synchronize Config
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default PatientQueue;
