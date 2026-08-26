import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import api from '../../utils/api';
import {
  FileText, CreditCard, Download, ExternalLink, TrendingUp,
  AlertTriangle, IndianRupee, RefreshCw, CheckCircle, XCircle, Clock, Loader2, ShieldCheck
} from 'lucide-react';
import useStore from '../../store/useStore';
import { toast } from 'react-hot-toast';

const ReportsBills = () => {
  const { theme } = useStore();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/payments');
      setPayments(data);
    } catch (err) {
      toast.error("Failed to sync financial registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleOverride = async (appointmentId, status) => {
    if (!window.confirm(`Are you sure you want to manually mark this as ${status}? This action will be audited.`)) return;
    try {
      await api.put(`/admin/payment-override/${appointmentId}`, { status });
      toast.success(`Transaction synchronized to ${status}`);
      fetchPayments();
    } catch (err) {
      toast.error("Handshake failed");
    }
  };

  const filtered = payments.filter(p => {
    const matchesSearch = p.patientName?.toLowerCase().includes(search.toLowerCase()) ||
                         p.appointmentId?.toLowerCase().includes(search.toLowerCase()) ||
                         p.patientId?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.paymentStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = payments.filter(p => p.paymentStatus === 'Paid').reduce((acc, curr) => acc + (curr.fee || 0), 0);
  const pendingRevenue = payments.filter(p => p.paymentStatus === 'Pending' || p.paymentStatus === 'Verifying').reduce((acc, curr) => acc + (curr.fee || 0), 0);
  const failedRevenue = payments.filter(p => p.paymentStatus === 'Failed' || p.paymentStatus === 'Timeout').reduce((acc, curr) => acc + (curr.fee || 0), 0);

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'} pb-24`}>
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar relative z-10">

          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="text-left">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Institutional Finance</p>
              <h1 className={`text-3xl font-black uppercase tracking-tight mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Payment History</h1>
              <p className="text-zinc-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Transaction monitoring & manual reconciliation</p>
            </div>
            <button
              onClick={fetchPayments}
              className={`border px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500'}`}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Ledger
            </button>
          </header>


          <div className={`p-4 rounded-[32px] border backdrop-blur-3xl flex flex-col md:flex-row gap-4 transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0B] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="SEARCH TRANSACTION ID, PATIENT NAME OR ID..."
                className={`w-full pl-6 pr-6 py-4 border-none rounded-2xl outline-none font-black text-[10px] tracking-widest transition-all ${theme === 'dark' ? 'bg-white/5 text-white placeholder:text-zinc-700 focus:bg-white/10 shadow-inner' : 'bg-slate-50 text-slate-800 placeholder:text-slate-400 shadow-inner'}`}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                {['all', 'Paid', 'Pending', 'Failed', 'Timeout'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {status}
                  </button>
                ))}
            </div>
          </div>

          <div className={`rounded-[48px] border shadow-2xl overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0B] border-white/5' : 'bg-white border-slate-100'}`}>
            <div className={`p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/50 border-slate-100'}`}>
              <h3 className={`font-black text-sm uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Financial Registry Nodes</h3>
              <button className="text-blue-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 px-6 py-3 bg-blue-600/5 rounded-2xl hover:bg-blue-600/10 transition-all border border-blue-500/10">
                <Download size={14} /> Export Technical CSV
              </button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
                {loading ? (
                  <div className="p-32 flex flex-col items-center justify-center gap-6 opacity-30">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                    <p className="text-[12px] font-black uppercase tracking-[0.5em]">Synchronizing Registry...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-32 flex flex-col items-center justify-center gap-6 opacity-10">
                    <CreditCard size={64} />
                    <p className="text-[12px] font-black uppercase tracking-[0.5em]">No Transaction Mapping Found</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'bg-white/5 text-zinc-500' : 'bg-slate-50/50 text-gray-400'}`}>
                      <tr>
                        <th className="px-10 py-6">Identity Node</th>
                        <th className="px-10 py-6">Clinical Category</th>
                        <th className="px-10 py-6 text-center">Protocol Cost</th>
                        <th className="px-10 py-6 text-center">Sync Date</th>
                        <th className="px-10 py-6 text-center">Node Status</th>
                        <th className="px-10 py-6 text-right">Reconciliation</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-sm font-bold ${theme === 'dark' ? 'divide-white/5 text-zinc-300' : 'divide-slate-50 text-slate-700'}`}>
                      {filtered.map((item) => (
                        <tr key={item._id} className={`transition-all ${theme === 'dark' ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}>
                          <td className="px-10 py-8">
                             <div className="flex flex-col cursor-pointer group/node" onClick={() => navigate(`/admin/patient/${item.patientId}`)}>
                                <span className="font-black text-blue-500 text-xs tracking-widest uppercase">#{item.appointmentId}</span>
                                <span className={`mt-1 text-base font-black transition-colors group-hover/node:text-blue-500 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{item.patientName}</span>
                                <span className="text-[9px] text-zinc-600 uppercase font-black tracking-tighter mt-0.5">{item.patientId}</span>
                             </div>
                          </td>
                          <td className="px-10 py-8 text-left">
                            <div className="flex flex-col">
                               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Service</p>
                               <p className={theme === 'dark' ? 'text-zinc-200' : 'text-slate-700'}>{item.consultationType} Consultation</p>
                               <p className="text-[9px] text-blue-500 uppercase mt-1 font-black">{item.specialization}</p>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-center">
                             <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-950/40 rounded-xl border border-white/5 font-black text-base text-white">
                                <span className="text-zinc-600 text-xs">₹</span>{item.fee?.toLocaleString()}
                             </div>
                          </td>
                          <td className="px-10 py-8 text-center text-[10px] text-slate-500 uppercase font-black tracking-widest">
                             {new Date(item.date).toLocaleDateString()}
                             <p className="text-[8px] opacity-50 mt-1">{item.time}</p>
                          </td>
                          <td className="px-10 py-8 text-center">
                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 border ${
                              item.paymentStatus === 'Paid'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : item.paymentStatus === 'Failed'
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                : item.paymentStatus === 'Timeout'
                                ? 'bg-zinc-800 text-zinc-500 border-zinc-700'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                item.paymentStatus === 'Paid' ? 'bg-emerald-500' :
                                item.paymentStatus === 'Failed' ? 'bg-rose-500' :
                                item.paymentStatus === 'Timeout' ? 'bg-zinc-500' : 'bg-amber-500'
                              } animate-pulse`}></div>
                              {item.paymentStatus}
                            </span>
                          </td>
                          <td className="px-10 py-8 text-right">
                             <div className="flex justify-end gap-2">
                                {item.paymentStatus !== 'Paid' && (
                                   <button
                                     onClick={() => handleOverride(item._id, 'Paid')}
                                     className="p-3 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-900/10"
                                     title="MARK AS PAID (MANUAL SYNC)"
                                   >
                                      <ShieldCheck size={20} />
                                   </button>
                                )}
                                <button
                                  onClick={() => navigate(`/admin/patient/${item.patientId}`)}
                                  className={`p-3 rounded-2xl transition-all ${theme === 'dark' ? 'bg-white/5 text-zinc-500 hover:text-blue-400 border border-white/5' : 'bg-white border border-slate-100 text-slate-300 hover:text-blue-600 shadow-sm'}`}
                                >
                                   <ExternalLink size={20} />
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportsBills;
