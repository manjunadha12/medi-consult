import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import api from '../../utils/api';
import {
  User as UserIcon, Stethoscope, Search, Save, History as HistoryIcon,
  ChevronRight, Edit3, X, Loader2, CheckCircle, Shield, Calendar, Mail, Phone, Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useStore from '../../store/useStore';

const ProfileGovernance = () => {
  const { theme } = useStore();
  const [activeTab, setActiveTab] = useState('doctor'); // 'doctor' or 'patient'
  const [list, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  const [formData, setFormData] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'doctor' ? '/admin/doctors' : '/admin/patients';
      const { data } = await api.get(endpoint);
      setLogs(data);
    } catch (err) {
      toast.error(`Failed to load ${activeTab} registry`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedUser(null);
    setEditMode(false);
    setHistory([]);
  }, [activeTab]);

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    setEditMode(false);
    fetchHistory(user.doctorId || user.patientId);

    // Initialize form data
    if (activeTab === 'doctor') {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        specialization: user.specialization,
        hospitalName: user.hospitalName,
        department: user.department,
        experience: user.experience,
        age: user.age,
        gender: user.gender
      });
    } else {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        bloodGroup: user.bloodGroup
      });
    }
  };

  const fetchHistory = async (id) => {
    setFetchingHistory(true);
    try {
      const { data } = await api.get(`/admin/audit-history/${id}`);
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const id = selectedUser.doctorId || selectedUser.patientId;
    const endpoint = activeTab === 'doctor' ? `/admin/doctor/${id}` : `/admin/patient/${id}`;

    try {
      await api.put(endpoint, formData);
      toast.success("Profile Node Parameters Updated");
      setEditMode(false);
      fetchData();
      fetchHistory(id);
    } catch (err) {
      toast.error("Registry Sync Failed");
    }
  };

  const filtered = list.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.doctorId?.toLowerCase().includes(search.toLowerCase()) ||
    u.patientId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'} pb-24`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-4 sm:p-6 lg:p-8 space-y-8 relative z-10 overflow-y-auto custom-scrollbar">

          <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="text-left">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Institutional Governance</p>
              <h1 className={`text-3xl font-black uppercase tracking-tight mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Profile Management</h1>
              <p className="text-zinc-500 font-medium mt-1 uppercase text-[10px] tracking-widest">Global registry modification & change forensics</p>
            </div>
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 shadow-2xl">
              <button
                onClick={() => setActiveTab('doctor')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'doctor' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Stethoscope size={14} /> Doctor Registry
              </button>
              <button
                onClick={() => setActiveTab('patient')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'patient' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <UserIcon size={14} /> Patient Registry
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-250px)]">

            {/* List Section */}
            <div className="xl:col-span-4 flex flex-col space-y-4 h-full">
              <div className={`p-4 rounded-3xl border flex items-center gap-3 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 focus-within:border-blue-500/30' : 'bg-white border-slate-100 shadow-sm focus-within:border-blue-500/30'}`}>
                <Search size={18} className="text-zinc-500" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}s...`}
                  className="bg-transparent border-none outline-none text-xs font-bold w-full uppercase tracking-widest"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className={`flex-1 overflow-y-auto custom-scrollbar rounded-[40px] border transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0B] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Syncing Registry...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20 text-center p-10">
                    <Search size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Node Mapping Found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {filtered.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleUserClick(user)}
                        className={`w-full p-6 flex items-center gap-4 text-left transition-all ${selectedUser?._id === user._id ? 'bg-blue-600/10 border-l-4 border-blue-600' : 'hover:bg-white/5'}`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${theme === 'dark' ? 'bg-zinc-950 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                          {activeTab === 'doctor' ? <Stethoscope className="text-blue-500" size={20} /> : <UserIcon className="text-emerald-500" size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-black uppercase truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{user.name}</p>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{user.doctorId || user.patientId}</p>
                        </div>
                        <ChevronRight size={16} className="text-zinc-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Details & History Section */}
            <div className="xl:col-span-8 h-full">
              {!selectedUser ? (
                <div className={`h-full rounded-[48px] border-2 border-dashed flex flex-col items-center justify-center gap-6 transition-all duration-500 ${theme === 'dark' ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
                   <Shield size={64} className="text-zinc-800" strokeWidth={1} />
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">Select Node to Manage</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">

                  {/* EDIT FORM */}
                  <div className={`p-8 rounded-[48px] border flex flex-col space-y-8 transition-all duration-500 relative overflow-hidden ${theme === 'dark' ? 'bg-[#0A0A0B] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-xl'}`}>
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                     <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black">
                              {selectedUser.name.charAt(0)}
                           </div>
                           <h3 className="text-sm font-black uppercase tracking-widest">Profile Parameters</h3>
                        </div>
                        <button
                          onClick={() => setEditMode(!editMode)}
                          className={`p-2 rounded-xl transition-all ${editMode ? 'bg-red-500/10 text-red-500' : 'bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white'}`}
                        >
                           {editMode ? <X size={18} /> : <Edit3 size={18} />}
                        </button>
                     </div>

                     <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                        <div className="grid grid-cols-1 gap-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Full Legal Name</label>
                              <input
                                disabled={!editMode}
                                className={`w-full p-4 border rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'} ${editMode ? 'focus:border-blue-500/50' : 'opacity-60 cursor-not-allowed'}`}
                                value={formData.name || ''}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Email Endpoint</label>
                                 <input
                                   disabled={!editMode}
                                   className={`w-full p-4 border rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'} ${editMode ? 'focus:border-blue-500/50' : 'opacity-60 cursor-not-allowed'}`}
                                   value={formData.email || ''}
                                   onChange={e => setFormData({...formData, email: e.target.value})}
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Mobile Node</label>
                                 <input
                                   disabled={!editMode}
                                   className={`w-full p-4 border rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'} ${editMode ? 'focus:border-blue-500/50' : 'opacity-60 cursor-not-allowed'}`}
                                   value={formData.phone || ''}
                                   onChange={e => setFormData({...formData, phone: e.target.value})}
                                 />
                              </div>
                           </div>

                           {activeTab === 'doctor' ? (
                             <>
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Clinical Specialization</label>
                                  <input
                                    disabled={!editMode}
                                    className={`w-full p-4 border rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'} ${editMode ? 'focus:border-blue-500/50' : 'opacity-60 cursor-not-allowed'}`}
                                    value={formData.specialization || ''}
                                    onChange={e => setFormData({...formData, specialization: e.target.value})}
                                  />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Hospital Base</label>
                                  <input
                                    disabled={!editMode}
                                    className={`w-full p-4 border rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'} ${editMode ? 'focus:border-blue-500/50' : 'opacity-60 cursor-not-allowed'}`}
                                    value={formData.hospitalName || ''}
                                    onChange={e => setFormData({...formData, hospitalName: e.target.value})}
                                  />
                               </div>
                             </>
                           ) : (
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Blood Group</label>
                                   <input
                                     disabled={!editMode}
                                     className={`w-full p-4 border rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'} ${editMode ? 'focus:border-blue-500/50' : 'opacity-60 cursor-not-allowed'}`}
                                     value={formData.bloodGroup || ''}
                                     onChange={e => setFormData({...formData, bloodGroup: e.target.value})}
                                   />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black text-zinc-500 uppercase ml-1">Node Age</label>
                                   <input
                                     disabled={!editMode}
                                     type="number"
                                     className={`w-full p-4 border rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'} ${editMode ? 'focus:border-blue-500/50' : 'opacity-60 cursor-not-allowed'}`}
                                     value={formData.age || ''}
                                     onChange={e => setFormData({...formData, age: e.target.value})}
                                   />
                                </div>
                             </div>
                           )}
                        </div>

                        {editMode && (
                          <button
                            type="submit"
                            className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                          >
                             <Save size={18} /> Commit Changes
                          </button>
                        )}
                     </form>
                  </div>

                  {/* HISTORY SECTION */}
                  <div className={`p-8 rounded-[48px] border flex flex-col space-y-8 transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0B] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-xl'}`}>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                              <HistoryIcon size={20} />
                           </div>
                           <h3 className="text-sm font-black uppercase tracking-widest">Change Forensics</h3>
                        </div>
                        <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black uppercase text-zinc-500 tracking-widest">Audit Vault</span>
                     </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {fetchingHistory ? (
                           <div className="flex flex-col items-center justify-center h-full opacity-20">
                              <Activity className="animate-pulse text-blue-500" size={32} />
                           </div>
                        ) : (
                           <div className="space-y-6">
                              <div className="p-6 bg-white/5 border border-white/5 rounded-[32px] space-y-4">
                                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Access Protocol</p>
                                 <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                                    <div className="text-left">
                                       <p className="text-xs font-black text-white uppercase">{selectedUser.isActive !== false ? 'Active node' : 'Node Blocked'}</p>
                                       <p className="text-[8px] font-bold text-zinc-500 uppercase mt-0.5">Toggle system access rights</p>
                                    </div>
                                    <button
                                      onClick={async () => {
                                         try {
                                            const endpoint = activeTab === 'doctor' ? `/admin/doctor/${selectedUser.doctorId || selectedUser.applicationNumber}/toggle-status` : `/admin/patient/${selectedUser.patientId}/toggle-status`;
                                            await api.post(endpoint);
                                            toast.success("Security rights updated");
                                            fetchData();
                                            fetchHistory(selectedUser.doctorId || selectedUser.patientId);
                                            // Update local selected user state
                                            setSelectedUser(prev => ({ ...prev, isActive: !prev.isActive }));
                                         } catch (err) {
                                            toast.error("Handshake failed");
                                         }
                                      }}
                                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${selectedUser.isActive !== false ? 'bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600 hover:text-white' : 'bg-emerald-600/10 text-emerald-500 border border-emerald-600/20 hover:bg-emerald-600 hover:text-white'}`}
                                    >
                                       {selectedUser.isActive !== false ? 'Block Node' : 'Unblock Node'}
                                    </button>
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Audit Trail</p>
                                 {history.length === 0 ? (
                                    <div className="py-10 text-center opacity-10 flex flex-col items-center gap-3">
                                       <Shield size={40} />
                                       <p className="text-[10px] font-black uppercase tracking-widest">No Modified Records</p>
                                    </div>
                                 ) : (
                                    history.map((log, i) => (
                                       <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-3xl space-y-3 transition-all hover:border-blue-500/20 group">
                                          <div className="flex justify-between items-start">
                                             <div className="flex items-center gap-2">
                                                <CheckCircle size={12} className="text-emerald-500" />
                                                <p className="text-[10px] font-black text-white uppercase">{log.status}</p>
                                             </div>
                                             <p className="text-[8px] font-black text-zinc-600 uppercase">{new Date(log.createdAt).toLocaleString()}</p>
                                          </div>
                                          <p className="text-[11px] font-bold text-zinc-300 leading-relaxed uppercase">{log.action}</p>
                                          <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                                             <p className="text-[8px] font-black text-zinc-500 uppercase">Operator: {log.userId}</p>
                                             <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Traceable Log</span>
                                          </div>
                                       </div>
                                    ))
                                 )}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                </div>
              )}
            </div>

          </div>

        </main>
      </div>
    </div>
  );
};

export default ProfileGovernance;
