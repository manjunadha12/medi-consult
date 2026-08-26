import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar';
import Navbar from '../common/Navbar';
import { Search as SearchIcon, User as UserIcon, FileText, Activity, Calendar, ExternalLink, Loader2, RefreshCw, CheckCircle, Smartphone, Info } from 'lucide-react';
import api, { BACKEND_URL } from '../../utils/api';
import { toast } from 'react-hot-toast';
import useStore from '../../store/useStore';

const SearchPatient = () => {
  const { theme } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/doctor/patient/${query}`);
      setPatient(data);
      toast.success("Records Synchronized");
    } catch (error) {
      setPatient(null);
      toast.error(error.response?.data?.message || "Patient not found in neural database");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-300' : 'bg-[#F8FAFC] text-slate-600'} text-left`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-8 lg:p-10 overflow-y-auto custom-scrollbar">
          <header className="mb-10">
            <h1 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Patient Search Archive</h1>
            <p className="text-slate-400 uppercase text-[10px] font-black tracking-widest mt-1">Medical Record Synchronization Node</p>
          </header>

          <div className={`p-8 rounded-[40px] border shadow-sm mb-10 transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-gray-100'}`}>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="ENTER PATIENT ID (e.g. PAT1001)"
                  className={`w-full pl-16 pr-6 py-5 rounded-3xl outline-none focus:ring-4 focus:ring-blue-500/10 font-black uppercase tracking-[0.2em] text-sm transition-all ${theme === 'dark' ? 'bg-zinc-900 border border-white/5 text-blue-400' : 'bg-gray-50 border border-gray-100 text-blue-600'}`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value.toUpperCase())}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-gray-900 text-white px-12 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black shadow-2xl transition-all active:scale-95 disabled:bg-gray-300"
              >
                {loading ? <Loader2 className="animate-spin" /> : "SEARCH ARCHIVE"}
              </button>
            </form>
          </div>

          {patient ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">

              {/* Left Bio Card */}
              <div className="lg:col-span-4 space-y-8">
                <div className={`p-10 rounded-[48px] border shadow-sm text-center relative overflow-hidden group transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-gray-100'}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-100 transition-all duration-700"></div>

                  <div className="relative z-10">
                    <div className={`w-28 h-28 rounded-[40px] flex items-center justify-center text-blue-600 text-4xl font-black mx-auto mb-6 shadow-inner border transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5' : 'bg-blue-50 border-blue-100'}`}>
                      {patient.user.name.charAt(0)}
                    </div>
                    <h2 className={`text-2xl font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{patient.user.name}</h2>
                    <p className="text-blue-500 font-black text-xs tracking-[0.3em] mt-3">{patient.user.patientId}</p>

                    <div className="flex justify-center gap-3 mt-8">
                      <div className={`px-5 py-2 rounded-2xl transition-all ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Age Node</p>
                         <p className={`text-xs font-black ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>{patient.profile?.age || 25} YEARS</p>
                      </div>
                      <div className={`px-5 py-2 rounded-2xl transition-all ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-gray-50 border border-gray-100'}`}>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Gender</p>
                         <p className={`text-xs font-black uppercase ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>{patient.user.gender || 'MALE'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/doctor/patient/${patient.user.patientId}`)}
                      className="w-full mt-10 bg-blue-600 text-white py-5 rounded-[32px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/30 hover:bg-blue-500 transition-all active:scale-95"
                    >
                      VIEW NEURAL PROFILE
                    </button>
                  </div>
                </div>

                <div className={`p-8 rounded-[40px] shadow-2xl space-y-6 border transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-slate-900 border-white/5'}`}>
                  <h3 className="font-black text-white text-[10px] uppercase tracking-[0.4em] flex items-center gap-3 ml-2">
                    <Activity size={16} className="text-blue-500" /> SYSTEM STATUS
                  </h3>
                  <div className="space-y-3">
                     {[
                       { label: 'Condition', val: 'STABLE NODE', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                       { label: 'Sync Status', val: 'SYNCHRONIZED', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                       { label: 'Alert Level', val: 'MINIMAL', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
                     ].map((item, i) => (
                       <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border border-white/5 ${item.bg}`}>
                          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{item.label}</span>
                          <span className={`text-[10px] font-black uppercase ${item.color}`}>{item.val}</span>
                       </div>
                     ))}
                  </div>
                </div>
              </div>

              {/* Right Reports Area */}
              <div className="lg:col-span-8 space-y-10">
                <div className={`p-10 rounded-[56px] border shadow-sm transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-10 px-2">
                    <h3 className={`font-black flex items-center gap-4 text-xl uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      <FileText className="w-8 h-8 text-blue-600" /> Archived Objects
                    </h3>
                    <div className="px-5 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl text-[10px] font-black tracking-widest uppercase">
                       {patient?.reports?.length || 0} SECURE FILES
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {patient?.reports?.length > 0 ? patient?.reports?.map((r, i) => (
                      <div key={i} className={`flex items-center justify-between p-6 rounded-[32px] border transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/5 group ${theme === 'dark' ? 'bg-zinc-900/50 border-white/5 hover:border-blue-500/30 hover:bg-zinc-900' : 'bg-gray-50 border-gray-100 hover:border-blue-300 hover:bg-white'}`}>
                        <div className="flex items-center gap-6">
                           <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border transition-all ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5 text-zinc-600 group-hover:text-blue-500' : 'bg-white border-gray-50 group-hover:border-blue-100 text-gray-300 group-hover:text-blue-600 shadow-inner'}`}>
                              <FileText size={32} />
                           </div>
                           <div className="text-left">
                              <p className={`text-base font-black uppercase tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-gray-700'}`}>{r.fileName}</p>
                              <div className="flex gap-4 mt-1.5">
                                 <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{r.category}</p>
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString()}</p>
                              </div>
                           </div>
                        </div>
                        <a
                          href={`${BACKEND_URL}${r.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-8 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/5 rounded-2xl text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-95"
                        >
                          ACCESS <ExternalLink size={14} strokeWidth={3} />
                        </a>
                      </div>
                    )) : (
                      <div className="py-20 text-center space-y-4">
                         <FileText size={48} className="text-gray-100 mx-auto" />
                         <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em]">Archive Link Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-40 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-1000">
               <div className="relative">
                  <div className={`w-32 h-32 rounded-[48px] shadow-2xl flex items-center justify-center border relative z-10 transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                     <SearchIcon size={48} className="text-slate-200" />
                  </div>
                  <div className="absolute -inset-10 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
               </div>
               <div>
                  <h4 className={`text-2xl font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-zinc-700' : 'text-gray-300'}`}>Neural Archive Offline</h4>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-4 max-w-[300px] leading-relaxed mx-auto">Initialize archive synchronization via valid Patient ID command.</p>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchPatient;
