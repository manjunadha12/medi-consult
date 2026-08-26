import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import { Ticket, Search as SearchIcon, Filter, Clock, User, Stethoscope, AlertTriangle, CheckCircle, X, Loader2, Plus, ArrowRight, ChevronLeft } from 'lucide-react';
import useStore from '../../store/useStore';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const OPTokenManagement = () => {
  const { theme } = useStore();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    department: 'General Medicine',
    consultationType: 'In-person',
    isEmergency: false,
    problemDescription: ''
  });

  useEffect(() => {
    fetchTokens();
    fetchDoctors();
  }, []);

  const fetchTokens = async () => {
    try {
      const { data } = await api.get('/appointments/global-queue');
      setTokens(data);
    } catch (err) {
      console.error("[QUEUE_FETCH_ERROR]:", err);
      toast.error(`Failed to sync global queue: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data } = await api.get('/admin/doctors');
      setDoctors(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId) return toast.error("Missing mandatory fields");

    setGenerating(true);
    try {
      const { data } = await api.post('/appointments/generate-manual', formData);
      if (data.success) {
        toast.success(data.message);
        setShowModal(false);
        fetchTokens();
        setFormData({
          patientId: '',
          doctorId: '',
          department: 'General Medicine',
          consultationType: 'In-person',
          isEmergency: false,
          problemDescription: ''
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Token generation failure");
    } finally {
      setGenerating(false);
    }
  };

  const filteredTokens = tokens.filter(t =>
    t.patientName?.toLowerCase().includes(search.toLowerCase()) ||
    t.patientId?.toLowerCase().includes(search.toLowerCase()) ||
    t.tokenNumber?.toString().includes(search)
  );

  const stats = {
    active: tokens.length,
    waiting: tokens.filter(t => t.status === 'Pending').length,
    emergency: tokens.filter(t => t.isEmergency).length,
    completed: 0 // Fetch from history if needed
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'}`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar relative z-10">

          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div className="text-left px-2">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-1">Clinic Terminal</p>
              <h1 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>OP Token Management</h1>
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-1">Real-time monitoring of clinical through-put</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-10 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/20 flex items-center gap-3 hover:bg-blue-700 transition-all active:scale-95"
            >
               <Ticket size={20} /> GENERATE TOKEN
            </button>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {[
               { label: 'Active Tokens', val: stats.active, icon: Ticket, color: 'text-blue-500', bg: 'bg-blue-500/10' },
               { label: 'Waiting', val: stats.waiting, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
               { label: 'Emergency', val: stats.emergency, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
               { label: 'Sync Status', val: 'LIVE', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
             ].map((stat, i) => (
                <div key={i} className={`p-6 rounded-[32px] border transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0E12]/90 border-white/5 shadow-2xl shadow-black/50' : 'bg-white border-slate-100 shadow-sm'}`}>
                   <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 border border-white/5' : stat.bg} ${stat.color}`}>
                         <stat.icon size={28}/>
                      </div>
                      <div className="text-left">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                         <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{stat.val}</h3>
                      </div>
                   </div>
                </div>
             ))}
          </div>

          <div className={`rounded-[48px] border shadow-2xl overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0E12]/90 border-white/5' : 'bg-white border-slate-100'}`}>
             <div className={`p-8 border-b flex flex-col md:flex-row gap-6 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-100'}`}>
                <div className="relative flex-1">
                   <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                   <input
                     type="text"
                     placeholder="SEARCH BY TOKEN OR PATIENT IDENTITY..."
                     className={`w-full pl-14 pr-6 py-4 rounded-2xl border outline-none font-black text-[11px] uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:bg-white/5 focus:border-blue-500/30' : 'bg-white border-slate-200 text-slate-700'}`}
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                   />
                </div>
                <button className={`px-8 py-4 border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm'}`}>
                   <Filter size={16}/> Filter Registry
                </button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'bg-white/5 text-zinc-500' : 'bg-slate-50/30 text-gray-400'}`}>
                      <tr>
                         <th className="px-10 py-6">Token node</th>
                         <th className="px-10 py-6">Identity</th>
                         <th className="px-10 py-6">Specialist Node</th>
                         <th className="px-10 py-6">Urgency Index</th>
                         <th className="px-10 py-6">Protocol Status</th>
                         <th className="px-10 py-6 text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className={`divide-y text-sm font-bold ${theme === 'dark' ? 'divide-white/5 text-zinc-300' : 'divide-slate-50 text-gray-700'}`}>
                      {loading ? (
                         <tr><td colSpan="6" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={32}/></td></tr>
                      ) : filteredTokens.length === 0 ? (
                        <tr><td colSpan="6" className="py-20 text-center text-zinc-500 font-black uppercase tracking-[0.4em]">Registry Empty</td></tr>
                      ) : filteredTokens.map((t, i) => (
                         <tr key={i} className={`transition-all ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'} ${t.isEmergency && theme !== 'dark' ? 'bg-rose-50/30' : ''}`}>
                            <td className="px-10 py-8"><span className={`px-4 py-2 rounded-xl font-black text-sm border ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>#{t.tokenNumber}</span></td>
                            <td className="px-10 py-8">
                               <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 text-sm font-black border transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 shadow-xl shadow-black/50' : 'bg-blue-50 border-blue-100 shadow-inner'}`}>{t.patientName?.charAt(0)}</div>
                                  <div className="text-left"><p className={`text-sm font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.patientName}</p><p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t.patientId}</p></div>
                               </div>
                            </td>
                            <td className="px-10 py-8 text-left">
                               <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>{t.specialization}</p>
                               <p className="text-xs font-black uppercase text-blue-500 mt-1">DR. {t.doctorName}</p>
                            </td>
                            <td className="px-10 py-8">
                               <span className={`px-3 py-1.5 rounded-lg text-[9px] uppercase font-black tracking-widest border ${
                                  t.isEmergency ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse' :
                                  t.status === 'Live' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                  'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                               }`}>{t.isEmergency ? 'EMERGENCY' : t.status === 'Live' ? 'PRIORITY' : 'NORMAL'}</span>
                            </td>
                            <td className="px-10 py-8 text-left">
                               <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest">
                                  <div className={`w-2 h-2 rounded-full ${t.status === 'Pending' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'} animate-pulse`}></div>
                                  <span className={t.status === 'Pending' ? 'text-amber-500' : 'text-emerald-500'}>{t.status}</span>
                               </div>
                            </td>
                            <td className="px-10 py-8 text-right">
                               <button className="p-3 bg-white/5 border border-white/5 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"><X size={16}/></button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          <div className="mt-20 shrink-0">
             <Footer />
          </div>

          {/* Token Generation Modal */}
          <AnimatePresence>
            {showModal && (
              <div className="fixed inset-0 z-[2200] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                 <motion.div
                   initial={{ opacity: 0, scale: 0.9, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9, y: 20 }}
                   className={`w-full max-w-2xl rounded-[40px] sm:rounded-[56px] border shadow-2xl transition-all duration-500 flex flex-col max-h-[85vh] ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}
                 >
                    {/* Fixed Header */}
                    <div className={`p-8 sm:p-10 border-b flex items-center justify-between shrink-0 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-50'}`}>
                       <div className="text-left px-2">
                          <h2 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Generate OP Token</h2>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mt-2">Manual Registry Synchronization</p>
                       </div>
                       <button onClick={() => setShowModal(false)} className={`p-4 rounded-[20px] transition-all border ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 shadow-sm'}`}><X size={24} strokeWidth={3} /></button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
                      <form onSubmit={handleGenerate} className="p-8 sm:p-12 space-y-10 text-left">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Patient Identity (ID)</label>
                               <div className="relative group">
                                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                  <input
                                    required
                                    className={`w-full pl-14 pr-6 py-5 rounded-3xl border outline-none font-black uppercase text-xs transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500/50 focus:bg-white/5' : 'bg-slate-50 border-slate-100 shadow-inner'}`}
                                    placeholder="E.G. PAT1001"
                                    value={formData.patientId}
                                    onChange={e => setFormData({...formData, patientId: e.target.value})}
                                  />
                               </div>
                            </div>

                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Assigned Specialist</label>
                               <div className="relative group">
                                  <Stethoscope className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18}/>
                                  <select
                                    required
                                    className={`w-full pl-14 pr-6 py-5 rounded-3xl border outline-none font-black uppercase text-xs transition-all appearance-none ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500/50' : 'bg-slate-50 border-slate-100 shadow-inner'}`}
                                    value={formData.doctorId}
                                    onChange={e => {
                                       const doc = doctors.find(d => d.doctorId === e.target.value || d._id === e.target.value);
                                       setFormData({...formData, doctorId: e.target.value, department: doc?.specialization || 'General Medicine'});
                                    }}
                                  >
                                     <option value="">Select Doctor</option>
                                     {doctors.map(doc => (
                                        <option key={doc._id} value={doc.doctorId || doc._id}>DR. {doc.name} ({doc.specialization})</option>
                                     ))}
                                  </select>
                               </div>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Clinical Channel</label>
                               <div className="flex gap-4">
                                  {['In-person', 'Video'].map(type => (
                                     <button
                                       key={type}
                                       type="button"
                                       onClick={() => setFormData({...formData, consultationType: type})}
                                       className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.consultationType === type ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300'}`}
                                     >
                                        {type}
                                     </button>
                                  ))}
                               </div>
                            </div>

                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Urgency Node</label>
                               <button
                                 type="button"
                                 onClick={() => setFormData({...formData, isEmergency: !formData.isEmergency})}
                                 className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-3 ${formData.isEmergency ? 'bg-rose-600 border-rose-500 text-white shadow-xl shadow-rose-500/20' : 'bg-white/5 border-white/10 text-zinc-500'}`}
                               >
                                  <AlertTriangle size={14}/> {formData.isEmergency ? 'EMERGENCY PROTOCOL' : 'STANDARD PROTOCOL'}
                               </button>
                            </div>
                         </div>

                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Problem Description</label>
                            <textarea
                              className={`w-full p-6 rounded-[32px] border outline-none font-bold text-xs min-h-[100px] transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500/50' : 'bg-slate-50 border-slate-100 shadow-inner'}`}
                              placeholder="ENTER REASON FOR VISIT..."
                              value={formData.problemDescription}
                              onChange={e => setFormData({...formData, problemDescription: e.target.value})}
                            />
                         </div>

                         <button
                           type="submit"
                           disabled={generating}
                           className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30"
                         >
                            {generating ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20} strokeWidth={3}/>}
                            {generating ? 'SYNCHRONIZING...' : 'INITIALIZE TOKEN SEQUENCE'}
                         </button>
                      </form>
                    </div>
                 </motion.div>
              </div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
};

export default OPTokenManagement;
