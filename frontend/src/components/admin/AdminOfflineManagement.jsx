import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import {
  Building2, Calendar, Clock, CheckCircle, AlertCircle,
  TrendingUp, Users, Stethoscope, Search, Filter,
  ShieldCheck, Loader2, Download, RefreshCw, XCircle, HeartPulse
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminOfflineManagement = () => {
  const { user, theme } = useStore();

  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    confirmed: 0,
    checkedIn: 0,
    completed: 0,
    cancelled: 0
  });

  const [appointments, setAppointments] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'hospitals'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, hospRes] = await Promise.all([
        api.get('/offline-appointments/admin-stats'),
        api.get('/offline-appointments/hospitals')
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.stats || {});
        setAppointments(statsRes.data.appointments || []);
      }
      if (hospRes.data?.success) {
        setHospitals(hospRes.data.hospitals || []);
      }
    } catch (err) {
      console.error('[ADMIN_OFFLINE_ERR]', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.appointmentId?.toLowerCase().includes(q) ||
        a.patientName?.toLowerCase().includes(q) ||
        a.doctorName?.toLowerCase().includes(q) ||
        a.hospitalName?.toLowerCase().includes(q)
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
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Institutional Governance Node
                </span>
                <h1 className={`text-3xl sm:text-4xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Offline Hospital Management
                </h1>
                <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest">
                  Accredited Hospital Network Governance, OPD Slot Telemetry & Booking Audit
                </p>
              </div>

              <button
                onClick={fetchAdminData}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Sync Node</span>
              </button>
            </header>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                { label: 'TOTAL BOOKINGS', value: stats.totalBookings, color: 'blue', icon: Building2 },
                { label: "TODAY'S OPD", value: stats.todayBookings, color: 'purple', icon: Calendar },
                { label: 'CONFIRMED', value: stats.confirmed, color: 'cyan', icon: Clock },
                { label: 'CHECKED IN', value: stats.checkedIn, color: 'amber', icon: Users },
                { label: 'COMPLETED', value: stats.completed, color: 'emerald', icon: CheckCircle },
                { label: 'CANCELLED', value: stats.cancelled, color: 'rose', icon: XCircle }
              ].map((s, i) => (
                <div key={i} className={`p-5 rounded-[28px] border ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'} shadow-xl relative overflow-hidden`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500">{s.label}</span>
                    <s.icon size={14} className="text-zinc-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white">{s.value || 0}</h3>
                </div>
              ))}
            </div>

            {/* Tab Selection */}
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${
                  activeTab === 'bookings'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                Offline Bookings Registry
              </button>
              <button
                onClick={() => setActiveTab('hospitals')}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${
                  activeTab === 'hospitals'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                Accredited Hospitals ({hospitals.length})
              </button>
            </div>

            {/* TAB 1: BOOKINGS REGISTRY */}
            {activeTab === 'bookings' && (
              <div className={`p-8 rounded-[40px] border shadow-2xl space-y-6 ${
                theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Booked', 'Checked In', 'Waiting', 'Completed', 'Cancelled'].map(st => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                          statusFilter === st
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search ID, Patient, Doctor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold outline-none border bg-zinc-900 border-white/10 text-white"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <span className="text-[10px] font-black uppercase">Loading Bookings...</span>
                  </div>
                ) : filteredAppointments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                          <th className="pb-3">Token ID</th>
                          <th className="pb-3">Patient</th>
                          <th className="pb-3">Hospital</th>
                          <th className="pb-3">Specialist</th>
                          <th className="pb-3">Schedule</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredAppointments.map(appt => (
                          <tr key={appt.appointmentId} className="hover:bg-white/5 transition-colors">
                            <td className="py-3.5 font-mono font-bold text-emerald-400">{appt.appointmentId}</td>
                            <td className="py-3.5 font-bold text-white">{appt.patientName}</td>
                            <td className="py-3.5 text-zinc-300">{appt.hospitalName}</td>
                            <td className="py-3.5 text-purple-400 font-bold">{appt.doctorName}</td>
                            <td className="py-3.5 font-mono text-zinc-400 text-[10px]">
                              {new Date(appt.appointmentDate).toLocaleDateString()} {appt.appointmentTime}
                            </td>
                            <td className="py-3.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase border ${
                                appt.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                                appt.status === 'Checked In' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                appt.status === 'Cancelled' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                                'bg-blue-500/15 text-blue-400 border-blue-500/30'
                              }`}>
                                {appt.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-zinc-500">
                    <p className="text-[10px] font-black uppercase tracking-widest">No offline appointments matching filters</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HOSPITALS REGISTRY */}
            {activeTab === 'hospitals' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hospitals.map(hosp => (
                  <div key={hosp.hospitalId} className="p-6 rounded-[36px] bg-[#0A0A0A] border border-white/10 shadow-2xl space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="font-mono text-[8px] font-black text-blue-400">{hosp.hospitalId}</span>
                        <h3 className="text-lg font-black uppercase text-white tracking-tight">{hosp.hospitalName}</h3>
                        <p className="text-xs text-zinc-400">{hosp.city}, {hosp.state}</p>
                      </div>

                      {hosp.isEmergencyAvailable && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-600/20 text-rose-400 text-[7px] font-black uppercase border border-rose-500/30 flex items-center gap-1">
                          <HeartPulse size={10} /> 24x7 Emergency
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-zinc-500">Departments ({hosp.departments?.length || 0}):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {hosp.departments?.map((d, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 text-[8px] font-bold">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[7px] font-black uppercase text-zinc-500">Consultation Fee</span>
                        <p className="font-black text-emerald-400">₹{hosp.consultationFee || 500}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[7px] font-black uppercase text-zinc-500">Helpline</span>
                        <p className="font-bold text-zinc-300">{hosp.contactNumber}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminOfflineManagement;
