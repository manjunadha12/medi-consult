import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import {
  Building2, Calendar, Clock, MapPin, QrCode, FileText,
  Printer, X, ChevronRight, Phone, Navigation, AlertCircle,
  CheckCircle, Loader2, Search, Filter, Stethoscope, ArrowLeft,
  PlusCircle, Download, ShieldCheck, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const OfflineAppointmentsHub = () => {
  const { user, theme } = useStore();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Upcoming', 'Today', 'Completed', 'Cancelled'
  const [searchQuery, setSearchQuery] = useState('');

  // Selected for QR / Details Modal
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/offline-appointments/patient-appointments');
      if (res.data?.success) {
        setAppointments(res.data.appointments || []);
      }
    } catch (err) {
      console.error('[FETCH_OFFLINE_APPTS_ERR]', err);
      toast.error('Failed to load offline appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you wish to cancel this hospital appointment?')) return;
    try {
      setCancellingId(appointmentId);
      const res = await api.post(`/offline-appointments/cancel/${appointmentId}`, {
        reason: 'Cancelled by patient via portal'
      });
      if (res.data?.success) {
        toast.success('Hospital appointment cancelled');
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancellingId(null);
    }
  };

  const openQRModal = (appt) => {
    setSelectedAppointment(appt);
    setShowQRModal(true);
  };

  const openDirections = (hospName, city) => {
    const query = encodeURIComponent(`${hospName}, ${city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handlePrintSlip = () => {
    window.print();
  };

  // Filter Logic
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter(a => {
    const aDateStr = new Date(a.appointmentDate).toISOString().split('T')[0];
    const isToday = aDateStr === todayStr;
    const isPast = new Date(a.appointmentDate).setHours(23, 59, 59, 999) < new Date().getTime();

    if (activeTab === 'Upcoming') {
      if (a.status === 'Cancelled' || a.status === 'Completed' || (isPast && !isToday)) return false;
    } else if (activeTab === 'Today') {
      if (!isToday) return false;
    } else if (activeTab === 'Completed') {
      if (a.status !== 'Completed') return false;
    } else if (activeTab === 'Cancelled') {
      if (a.status !== 'Cancelled') return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.appointmentId?.toLowerCase().includes(q) ||
        a.doctorName?.toLowerCase().includes(q) ||
        a.hospitalName?.toLowerCase().includes(q) ||
        a.department?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Booked':
        return <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">Confirmed / Booked</span>;
      case 'Checked In':
        return <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">Checked In at Reception</span>;
      case 'Waiting':
        return <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">In OPD Waiting Area</span>;
      case 'Consultation Started':
        return <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 animate-pulse">In Doctor Consultation</span>;
      case 'Completed':
        return <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Consultation Completed</span>;
      case 'Cancelled':
        return <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">Cancelled</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-white/10 text-zinc-400">{status}</span>;
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
              <div className="text-left space-y-1">
                <button
                  onClick={() => navigate('/patient/dashboard')}
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 mb-2 transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Dashboard
                </button>
                <h1 className={`text-3xl sm:text-4xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Offline Hospital Appointments
                </h1>
                <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest">
                  Track Physical Hospital Visits, Digital QR Check-In & Consultation Records
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchAppointments}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all"
                  title="Refresh Appointments"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>

                <button
                  onClick={() => navigate('/patient/go-to-hospital')}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2 active:scale-95"
                >
                  <PlusCircle size={16} /> Book In-Person Visit
                </button>
              </div>
            </header>

            {/* Filter Tabs & Search Bar */}
            <div className={`p-6 rounded-[36px] border ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'} shadow-xl space-y-4`}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  {['All', 'Upcoming', 'Today', 'Completed', 'Cancelled'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                        activeTab === tab
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by ID, Doctor, Hospital..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold outline-none border transition-all ${
                      theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Appointments List */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 size={40} className="animate-spin text-blue-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Retrieving Hospital Registry...</p>
              </div>
            ) : filteredAppointments.length > 0 ? (
              <div className="space-y-4">
                {filteredAppointments.map((appt) => {
                  const apptDate = new Date(appt.appointmentDate);
                  const isCancelled = appt.status === 'Cancelled';
                  const isCompleted = appt.status === 'Completed';

                  return (
                    <div
                      key={appt.appointmentId || appt._id}
                      className={`p-6 sm:p-8 rounded-[36px] border shadow-2xl transition-all relative overflow-hidden group ${
                        theme === 'dark' ? 'bg-[#0A0A0A] border-white/10 hover:border-blue-500/40' : 'bg-white border-slate-200 hover:border-blue-500/40'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        
                        {/* Left Details */}
                        <div className="space-y-3 flex-1 text-left">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-xs font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              {appt.appointmentId}
                            </span>
                            {getStatusBadge(appt.status)}
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">
                              {appt.appointmentType}
                            </span>
                          </div>

                          <div>
                            <h3 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {appt.doctorName}
                            </h3>
                            <p className="text-xs font-black text-purple-400 uppercase tracking-wide mt-0.5">
                              {appt.department} • {appt.specialization}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-zinc-400 pt-1">
                            <span className="flex items-center gap-1.5 text-zinc-300">
                              <Building2 size={14} className="text-blue-400" /> {appt.hospitalName}
                            </span>
                            <span className="flex items-center gap-1.5 text-blue-400">
                              <Calendar size={14} /> {apptDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5 text-amber-400 font-mono">
                              <Clock size={14} /> {appt.appointmentTime}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-400 italic">
                            Reason: "{appt.reasonForVisit}"
                          </p>
                        </div>

                        {/* Right Actions */}
                        <div className="flex flex-wrap lg:flex-col items-stretch gap-2 w-full lg:w-auto shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/5">
                          
                          <button
                            onClick={() => openQRModal(appt)}
                            className="flex-1 lg:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                          >
                            <QrCode size={14} /> View QR Check-In Pass
                          </button>

                          <div className="flex gap-2">
                            <button
                              onClick={() => openDirections(appt.hospitalName, appt.hospitalAddress)}
                              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-black text-[8px] uppercase tracking-wider border border-white/10 transition-all flex items-center justify-center gap-1.5"
                              title="Get Google Maps Directions"
                            >
                              <Navigation size={12} className="text-emerald-400" /> Directions
                            </button>

                            {appt.hospitalContact && (
                              <a
                                href={`tel:${appt.hospitalContact}`}
                                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-black text-[8px] uppercase tracking-wider border border-white/10 transition-all flex items-center justify-center gap-1.5"
                              >
                                <Phone size={12} className="text-blue-400" /> Contact
                              </a>
                            )}
                          </div>

                          {!isCancelled && !isCompleted && (
                            <button
                              onClick={() => handleCancel(appt.appointmentId)}
                              disabled={cancellingId === appt.appointmentId}
                              className="w-full px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white font-black text-[8px] uppercase tracking-wider border border-rose-500/20 transition-all"
                            >
                              {cancellingId === appt.appointmentId ? 'Cancelling...' : 'Cancel Appointment'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center space-y-4">
                <Building2 size={48} className="mx-auto text-zinc-500 opacity-40" />
                <h3 className="text-lg font-black uppercase tracking-tight text-zinc-300">No Offline Appointments Found</h3>
                <p className="text-xs text-zinc-500">You don't have any appointments matching this category.</p>
                <button
                  onClick={() => navigate('/patient/go-to-hospital')}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest shadow-xl"
                >
                  Book New Hospital Appointment
                </button>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* QR Code & Slip Modal */}
      {showQRModal && selectedAppointment && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className={`w-full max-w-xl rounded-[44px] border shadow-2xl overflow-hidden ${
            theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Hospital Reception QR Pass</h3>
                <p className="text-[9px] font-mono font-bold text-emerald-400">{selectedAppointment.appointmentId}</p>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-6 text-center">
              {/* QR Image */}
              <div className="p-4 bg-white rounded-3xl w-56 h-56 mx-auto flex flex-col items-center justify-center shadow-2xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedAppointment.qrCodePayload || selectedAppointment.appointmentId)}`}
                  alt="QR Pass"
                  className="w-48 h-48"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black uppercase text-white">{selectedAppointment.hospitalName}</h4>
                <p className="text-xs text-purple-400 font-bold uppercase">{selectedAppointment.doctorName} ({selectedAppointment.department})</p>
                <p className="text-xs text-blue-400 font-mono font-bold mt-1">
                  {new Date(selectedAppointment.appointmentDate).toLocaleDateString()} at {selectedAppointment.appointmentTime}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left text-[9px] space-y-1 text-zinc-400">
                <p className="font-black uppercase text-zinc-300">Reporting Instructions:</p>
                <p>• Show this QR Code at the hospital reception/OPD counter for instant biometric check-in.</p>
                <p>• Estimated Consultation Fee: <span className="font-bold text-emerald-400">₹{selectedAppointment.estimatedFee}</span> (Pay at Counter)</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handlePrintSlip}
                  className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl"
                >
                  <Printer size={14} /> Print Pass
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-[9px] uppercase tracking-widest"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineAppointmentsHub;
