import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import api from '../../utils/api';
import {
  Search as SearchIcon, Filter, Plus, MoreVertical,
  Stethoscope, CheckCircle, Shield,
  Trash2, ToggleLeft, ToggleRight, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../../store/useStore';

const ManageDoctors = () => {
  const store = useStore();
  const theme = store.theme;
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specFilter, setSpecFilter] = useState('all');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/doctors');
      setDoctors(res.data);
    } catch (err) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleVerify = async (id) => {
    try {
      await api.post(`/admin/doctor/${id}/verify`);
      toast.success('Doctor verified successfully');
      fetchDoctors();
    } catch (err) {
      toast.error('Verification failed');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.post(`/admin/doctor/${id}/toggle-status`);
      toast.success(res.data.message);
      fetchDoctors();
    } catch (err) {
      toast.error('Status update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to remove doctor ${id}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/doctor/${id}`);
      toast.success('Doctor removed successfully');
      fetchDoctors();
    } catch (err) {
      toast.error('Failed to remove doctor');
    }
  };

  const specializations = [...new Set(doctors.map(d => d.specialization).filter(Boolean))];

  const filtered = doctors.filter(d => {
    // Registry only shows verified/approved doctors
    const isVerified = d.isVerified || d.verificationStatus === 'Approved';
    if (!isVerified) return false;

    const matchSearch = d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.doctorId?.toLowerCase().includes(search.toLowerCase());
    const matchSpec = specFilter === 'all' || d.specialization === specFilter;
    return matchSearch && matchSpec;
  });

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'} pb-24`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 relative z-10 overflow-y-auto custom-scrollbar">

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="text-left">
              <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Security Registry</p>
              <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Doctor Security</h1>
              <p className="text-zinc-500 font-medium mt-1 text-[10px] sm:text-sm text-left">Manage specialist access rights and system status</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
              <button
                onClick={fetchDoctors}
                className={`flex-1 md:flex-none border px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <RefreshCw size={14} className="sm:w-4 sm:h-4" /> Refresh Registry
              </button>
            </div>
          </header>

          <div className={`border rounded-2xl sm:rounded-3xl p-4 sm:p-5 backdrop-blur-3xl noise-overlay flex flex-col md:flex-row gap-4 transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-950/80 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder="Search by name or Doctor ID..."
                className={`w-full pl-12 pr-4 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl outline-none font-bold text-xs sm:text-sm transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500/30'}`}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Active Node', value: doctors.filter(d => d.isActive !== false).length, color: 'text-emerald-400' },
              { label: 'Blocked Node', value: doctors.filter(d => d.isActive === false).length, color: 'text-red-400' },
              { label: 'Verified', value: doctors.filter(d => d.isVerified).length, color: 'text-blue-400' },
              { label: 'Pending', value: doctors.filter(d => !d.isVerified).length, color: 'text-amber-400' },
            ].map(stat => (
              <div key={stat.label} className={`border rounded-2xl sm:rounded-3xl p-4 sm:p-5 backdrop-blur-3xl noise-overlay transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-950/80 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <p className="text-[7px] sm:text-[9px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-widest text-left">{stat.label}</p>
                <p className={`text-xl sm:text-2xl lg:text-3xl font-black mt-1 sm:mt-2 text-left ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className={`border rounded-[32px] sm:rounded-[40px] overflow-hidden backdrop-blur-3xl noise-overlay transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-950/80 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            {loading ? (
              <div className="flex items-center justify-center p-16 sm:p-20">
                <Loader2 className="animate-spin text-blue-500 sm:w-10 sm:h-10" size={32} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center p-16 sm:p-20 text-zinc-600">
                <Stethoscope size={40} className="sm:w-12 sm:h-12 mx-auto mb-4 opacity-20" />
                <p className="font-black text-[10px] sm:text-sm uppercase tracking-widest">No doctors found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                    <tr>
                      <th className="px-6 sm:px-8 py-4 sm:py-5 text-[8px] sm:text-[9px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Doctor Profile</th>
                      <th className="px-6 sm:px-8 py-4 sm:py-5 text-[8px] sm:text-[9px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Expertise</th>
                      <th className="px-6 sm:px-8 py-4 sm:py-5 text-[8px] sm:text-[9px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Verification</th>
                      <th className="px-6 sm:px-8 py-4 sm:py-5 text-[8px] sm:text-[9px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Access Protocol</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-bold text-sm ${theme === 'dark' ? 'divide-white/5 text-zinc-300' : 'divide-slate-50 text-slate-600'}`}>
                    {filtered.map((doc, i) => (
                      <tr key={i} className={`transition-all ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                        <td className="px-8 py-5 text-left">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 border rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                              <Stethoscope size={22} />
                            </div>
                            <div className="text-left cursor-pointer group/name" onClick={() => navigate(`/admin/doctor/${doc._id}`)}>
                              <p className={`font-black group-hover/name:text-blue-500 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{doc.name}</p>
                              <p className="text-[10px] font-black text-blue-400 uppercase">{doc.doctorId || doc.applicationNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-left">
                          <p className={theme === 'dark' ? 'text-zinc-200' : 'text-slate-700'}>{doc.specialization || '—'}</p>
                          <p className="text-[10px] font-black text-zinc-500 uppercase">{doc.department || '—'}</p>
                        </td>
                        <td className="px-8 py-5 text-left">
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 w-fit ${
                            doc.verificationStatus === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {doc.verificationStatus === 'Approved' ? <CheckCircle size={10} /> : <Shield size={10} />}
                            {doc.verificationStatus || 'Pending'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-3 items-center">
                            <div className="text-right">
                               <p className={`text-[10px] font-black uppercase ${doc.isActive !== false ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {doc.isActive !== false ? 'Node Active' : 'Node Blocked'}
                               </p>
                            </div>
                            <button
                              onClick={() => handleToggleStatus(doc._id)}
                              className={`p-3 rounded-2xl transition-all border ${
                                doc.isActive !== false
                                  ? 'bg-red-600/10 text-red-500 border-red-600/20 hover:bg-red-600 hover:text-white'
                                  : 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                              }`}
                              title={doc.isActive !== false ? 'BLOCK DOCTOR' : 'UNBLOCK DOCTOR'}
                            >
                              {doc.isActive !== false ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            </button>
                            <button
                              onClick={() => handleDelete(doc._id)}
                              className={`p-3 border rounded-2xl transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-red-400' : 'bg-white border-slate-200 text-slate-300 hover:text-red-500'}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};

export default ManageDoctors;
