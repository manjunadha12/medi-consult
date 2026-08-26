import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import api from '../../utils/api';
import {
  Search as SearchIcon, Filter, Plus, User as UserIcon, FileText,
  Activity, Download, Trash2, ToggleLeft,
  ToggleRight, Loader2, RefreshCw, Heart, Phone, Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../../store/useStore';

const ManagePatients = () => {
  const store = useStore();
  const theme = store.theme;

  const location = useLocation();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }
  }, [location.search]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/patients');
      setPatients(res.data);
    } catch (err) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.post(`/admin/patient/${id}/toggle-status`);
      toast.success(res.data.message);
      fetchPatients();
    } catch (err) {
      toast.error('Status update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to remove patient ${id}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/patient/${id}`);
      toast.success('Patient removed successfully');
      fetchPatients();
    } catch (err) {
      toast.error('Failed to remove patient');
    }
  };

  const handleExport = () => {
    const headers = ['Patient ID', 'Name', 'Email', 'Phone', 'Gender', 'Age', 'Status'];
    const rows = patients.map(p => [
      p.patientId, p.name, p.email, p.phone,
      p.gender || '—', p.age || '—',
      p.isActive !== false ? 'Active' : 'Inactive'
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patients_export.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Patient list exported');
  };

  const filtered = patients.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.patientId?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.email?.toLowerCase().includes(search.toLowerCase());
    const matchGender = genderFilter === 'all' || p.gender?.toLowerCase() === genderFilter;
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && p.isActive !== false) ||
      (statusFilter === 'inactive' && p.isActive === false);
    return matchSearch && matchGender && matchStatus;
  });

  const getRiskColor = (p) => {
    if (!p.age) return 'bg-zinc-800 text-zinc-500 border-zinc-700';
    if (p.age > 60) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (p.age > 45) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  };

  const getRiskLabel = (p) => {
    if (!p.age) return 'Unknown';
    if (p.age > 60) return 'High Risk';
    if (p.age > 45) return 'Moderate';
    return 'Normal';
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'} pb-24`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 relative z-10 overflow-y-auto custom-scrollbar">

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
            <div>
              <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Security Registry</p>
              <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Patient Security</h1>
              <p className="text-zinc-500 font-medium mt-1 text-[10px] sm:text-sm">Manage institutional records and patient access status</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
              <button
                onClick={fetchPatients}
                className={`flex-1 md:flex-none border px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <RefreshCw size={14} className="sm:w-4 sm:h-4" /> Refresh Registry
              </button>
            </div>
          </header>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Active Node', value: patients.filter(p => p.isActive !== false).length, color: 'text-emerald-400' },
              { label: 'Blocked Node', value: patients.filter(p => p.isActive === false).length, color: 'text-red-400' },
              { label: 'Total Files', value: patients.length, color: 'text-blue-400' },
              { label: 'High Risk', value: patients.filter(p => p.age > 60).length, color: 'text-amber-400' },
            ].map(stat => (
              <div key={stat.label} className={`border rounded-2xl sm:rounded-3xl p-4 sm:p-5 backdrop-blur-3xl noise-overlay transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-950/80 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <p className="text-[7px] sm:text-[9px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-widest text-left">{stat.label}</p>
                <p className={`text-xl sm:text-2xl lg:text-3xl font-black mt-1 sm:mt-2 text-left ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className={`border rounded-2xl sm:rounded-3xl p-4 sm:p-5 backdrop-blur-3xl noise-overlay flex flex-col md:flex-row gap-4 transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-950/80 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                placeholder="Search by name, ID, phone or email..."
                className={`w-full pl-12 pr-4 py-3 sm:py-3.5 border rounded-xl sm:rounded-2xl outline-none font-bold text-xs sm:text-sm transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500/30'}`}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={`border rounded-[32px] sm:rounded-[40px] overflow-hidden backdrop-blur-3xl noise-overlay transition-all duration-500 ${theme === 'dark' ? 'bg-zinc-950/80 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
            {loading ? (
              <div className="flex items-center justify-center p-16 sm:p-20">
                <Loader2 className="animate-spin text-blue-500 sm:w-10 sm:h-10" size={32} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center p-16 sm:p-20 text-zinc-600">
                <UserIcon size={40} className="sm:w-12 sm:h-12 mx-auto mb-4 opacity-20" />
                <p className="font-black text-[10px] sm:text-sm uppercase tracking-widest">No patients found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead className={`border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                    <tr>
                      <th className="px-6 sm:px-8 py-4 sm:py-5 text-[8px] sm:text-[9px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Patient File</th>
                      <th className="px-6 sm:px-8 py-4 sm:py-5 text-[8px] sm:text-[9px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Demographics</th>
                      <th className="px-6 sm:px-8 py-4 sm:py-5 text-[8px] sm:text-[9px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Contact Details</th>
                      <th className="px-6 sm:px-8 py-4 sm:py-5 text-[8px] sm:text-[9px] lg:text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Access Protocol</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-bold text-sm ${theme === 'dark' ? 'divide-white/5 text-zinc-300' : 'divide-slate-50 text-slate-600'}`}>
                    {filtered.map((p, i) => (
                      <tr key={i} className={`transition-all ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 sm:px-8 py-4 sm:py-5">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 border rounded-full flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                              <UserIcon size={18} className="sm:w-5.5 sm:h-5.5" />
                            </div>
                            <div className="text-left cursor-pointer group/name overflow-hidden" onClick={() => navigate(`/admin/patient/${p._id}`)}>
                              <p className={`font-black group-hover/name:text-blue-500 transition-colors truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{p.name}</p>
                              <p className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase">{p.patientId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 sm:px-8 py-4 sm:py-5 text-left">
                          <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-700'}`}>{p.age ? `${p.age} Years` : '—'}</p>
                          <p className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase">{p.gender || '—'}</p>
                        </td>
                        <td className="px-6 sm:px-8 py-4 sm:py-5 text-left">
                          <div className="space-y-1">
                            {p.phone && <p className="text-[10px] font-black uppercase text-zinc-500">{p.phone}</p>}
                            {p.email && <p className="text-[9px] font-bold text-blue-500 truncate max-w-[150px]">{p.email}</p>}
                          </div>
                        </td>
                        <td className="px-6 sm:px-8 py-4 sm:py-5 text-right">
                          <div className="flex justify-end gap-3 items-center">
                            <div className="text-right">
                               <p className={`text-[10px] font-black uppercase ${p.isActive !== false ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {p.isActive !== false ? 'Node Active' : 'Node Blocked'}
                               </p>
                            </div>
                            <button
                              onClick={() => handleToggleStatus(p.patientId)}
                              className={`p-3 rounded-2xl transition-all border ${
                                p.isActive !== false
                                  ? 'bg-red-600/10 text-red-500 border-red-600/20 hover:bg-red-600 hover:text-white'
                                  : 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                              }`}
                            >
                              {p.isActive !== false ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            </button>
                            <button
                              onClick={() => handleDelete(p.patientId)}
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

          {filtered.length > 0 && (
            <p className="text-center text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-widest">
              Showing {filtered.length} of {patients.length} patients
            </p>
          )}

        </main>
      </div>
    </div>
  );
};

export default ManagePatients;
