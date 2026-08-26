import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import { Calendar, Search as SearchIcon, Filter, CheckCircle, XCircle, Clock, ChevronRight, CreditCard, ShieldCheck, AlertCircle, Image as ImageIcon, X, ExternalLink } from 'lucide-react';
import useStore from '../../store/useStore';
import { toast } from 'react-hot-toast';
import api, { BACKEND_URL } from '../../utils/api';

const ManageAppointments = () => {
  const { theme } = useStore();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProof, setSelectedProof] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/appointments/global-queue');
      setAppointments(data);
    } catch (err) {
      toast.error("Failed to sync appointment registry");
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (id) => {
    try {
      await api.put(`/appointments/payment-status/${id}`, { status: 'Paid' });
      toast.success("Payment Verified & Node Activated");
      fetchAppointments();
    } catch (err) {
      toast.error("Verification Handshake Failed");
    }
  };

  const filtered = appointments.filter(app =>
    app.patientName?.toLowerCase().includes(search.toLowerCase()) ||
    app.appointmentId?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'Pending').length,
    verifying: appointments.filter(a => a.paymentStatus === 'Verifying').length,
    completed: appointments.filter(a => a.status === 'Completed').length
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'}`}>
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar relative z-10">
          <header className="mb-8">
            <h1 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Hospital Appointments</h1>
            <p className="text-zinc-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Monitoring all active and past consultations</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Total Nodes', value: stats.total, color: 'bg-blue-600' },
              { label: 'Pending Docs', value: stats.pending, color: 'bg-amber-500' },
              { label: 'Payment Verif.', value: stats.verifying, color: 'bg-purple-600' },
              { label: 'Completed', value: stats.completed, color: 'bg-emerald-500' },
            ].map((stat, i) => (
              <div key={i} className={`p-6 rounded-[32px] border shadow-sm transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0E12]/90 border-white/5' : 'bg-white border-slate-100'}`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <div className="flex items-center justify-between">
                  <h2 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{stat.value}</h2>
                  <div className={`w-2.5 h-2.5 rounded-full ${stat.color}`}></div>
                </div>
              </div>
            ))}
          </div>

          <div className={`rounded-[40px] border shadow-sm overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0E12]/90 border-white/5' : 'bg-white border-slate-100'}`}>
            <div className={`p-6 border-b flex flex-col md:flex-row gap-4 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-100'}`}>
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  placeholder="Search patient name or OP ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-zinc-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-white/5 text-zinc-500' : 'bg-slate-50/30 text-gray-400'}`}>
                  <tr>
                    <th className="px-8 py-5">OP ID</th>
                    <th className="px-8 py-5">Patient / Doctor</th>
                    <th className="px-8 py-5">Payment Status</th>
                    <th className="px-8 py-5">Sync Status</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-sm font-bold ${theme === 'dark' ? 'divide-white/5 text-zinc-300' : 'divide-slate-50 text-slate-700'}`}>
                  {filtered.map((app) => (
                    <tr key={app._id} className={`transition-all ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}`}>
                      <td className="px-8 py-6 font-black text-blue-600">{app.appointmentId}</td>
                      <td className="px-8 py-6 text-left">
                        <p className={theme === 'dark' ? 'text-white' : 'text-slate-800'}>{app.patientName}</p>
                        <p className="text-[10px] text-zinc-500 uppercase">Specialist: {app.doctorName}</p>
                      </td>
                      <td className="px-8 py-6">
                         {app.paymentStatus === 'Verifying' ? (
                           <div className="space-y-3">
                             <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-2 text-purple-500 text-[10px] font-black uppercase">
                                 <CreditCard size={12}/> UTR: {app.transactionId}
                               </div>
                               {app.paymentScreenshot && (
                                 <button
                                   onClick={() => setSelectedProof(app)}
                                   className="flex items-center gap-2 text-blue-500 text-[9px] font-black uppercase hover:underline"
                                 >
                                   <ImageIcon size={12}/> View Proof Node
                                 </button>
                               )}
                             </div>
                             <button
                               onClick={() => verifyPayment(app._id)}
                               className="w-full px-4 py-2 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                             >
                               <ShieldCheck size={12}/> Verify Payment
                             </button>
                           </div>
                         ) : (
                           <div className="space-y-2">
                             <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 w-fit border ${
                               app.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                             }`}>
                               {app.paymentStatus === 'Paid' ? <ShieldCheck size={10} /> : <AlertCircle size={10} />}
                               {app.paymentStatus}
                             </span>
                             {app.paymentScreenshot && (
                               <button
                                 onClick={() => setSelectedProof(app)}
                                 className="flex items-center gap-2 text-zinc-500 text-[8px] font-black uppercase hover:text-blue-500 transition-colors"
                               >
                                 <ImageIcon size={10}/> View Receipt
                               </button>
                             )}
                           </div>
                         )}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 w-fit border ${
                          app.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          app.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => toast.success("Accessing clinical node parameters...")}
                          className="text-blue-500 font-black text-[10px] uppercase hover:underline flex items-center gap-1 ml-auto"
                        >View Node <ChevronRight size={12}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Proof Viewer Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className={`w-full max-w-3xl rounded-[40px] border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${theme === 'dark' ? 'bg-[#0A0A0B] border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                 <div className="text-left">
                    <h3 className={`text-lg font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Payment Proof Synchronization</h3>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">UTR: {selectedProof.transactionId}</p>
                 </div>
                 <button
                   onClick={() => setSelectedProof(null)}
                   className="p-3 hover:bg-white/5 rounded-2xl transition-all text-zinc-500 hover:text-white"
                 >
                    <X size={24} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-black/20 custom-scrollbar flex items-center justify-center">
                 <img
                   src={`${BACKEND_URL}/${selectedProof.paymentScreenshot.replace(/\\/g, '/')}`}
                   alt="Payment Screenshot Proof"
                   className="max-w-full rounded-2xl shadow-2xl border border-white/10"
                   onError={(e) => {
                     e.target.src = 'https://via.placeholder.com/800x600?text=Proof+Node+Unavailable';
                     toast.error("Failed to load clinical proof node");
                   }}
                 />
              </div>

              <div className="p-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
                 <div className="text-left">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Patient Identity</p>
                    <p className={`text-sm font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{selectedProof.patientName}</p>
                 </div>
                 <div className="flex gap-4 w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedProof(null)}
                      className="flex-1 sm:flex-none px-8 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all"
                    >
                       Dismiss
                    </button>
                    {selectedProof.paymentStatus === 'Verifying' && (
                      <button
                        onClick={() => {
                          verifyPayment(selectedProof._id);
                          setSelectedProof(null);
                        }}
                        className="flex-[2] sm:flex-none px-10 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-3"
                      >
                         <ShieldCheck size={18} /> Approve Payment
                      </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ManageAppointments;
