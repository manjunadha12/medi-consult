import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import api, { BACKEND_URL } from '../../utils/api';
import useStore from '../../store/useStore';
import {
  User as UserIcon, Calendar, Activity, FileText, Pill,
  ChevronLeft, ChevronRight, ArrowRight, Star, AlertTriangle, Building, MapPin, Globe,
  History as HistoryIcon, CreditCard, Brain, Download, ExternalLink, Loader2, CheckCircle,
  MessageSquare, UserPlus, TrendingUp, ShieldCheck as ShieldCheckIcon, Edit2, Save, X, Stethoscope, Phone as PhoneIcon, Mail, Award, Trash2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';

const DoctorDetails = () => {
  const { doctorId } = useParams();
  const { theme } = useStore();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Verification State
  const [verifying, setVerifying] = useState(false);
  const [verifMessage, setVerifMessage] = useState('');

  // Edit State
  const [editForm, setEditState] = useState({
    name: '',
    email: '',
    specialization: '',
    hospitalName: '',
    department: '',
    experience: '',
    age: '',
    gender: '',
    phone: ''
  });

  useEffect(() => {
    fetchDoctor();
    // Handle deep-link to specific tab (e.g. from Verification Node)
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'verification') {
      setActiveTab('verification');
    }
  }, [doctorId]);

  const fetchDoctor = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/doctor/${doctorId}`);
      if (res.data) {
        setData(res.data);
        setEditState({
          name: res.data.user?.name || '',
          email: res.data.user?.email || '',
          phone: res.data.user?.phone || '',
          specialization: res.data.profile?.specialization || '',
          hospitalName: res.data.profile?.hospitalName || '',
          department: res.data.profile?.department || '',
          experience: res.data.profile?.experience || '',
          age: res.data.profile?.age || '',
          gender: res.data.profile?.gender || 'Male'
        });
      }
    } catch (err) {
      toast.error("Doctor archive offline");
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'verification') {
        navigate('/admin/approvals');
      } else if (window.location.pathname.includes('/admin/doctor/')) {
        // Stay in the same section context if possible, or fallback
        navigate('/admin/doctors');
      } else {
        navigate('/admin-dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/doctor/${doctorId}`, editForm);
      toast.success("Doctor node synchronized");
      setIsEditing(false);
      fetchDoctor();
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    setVerifying(true);
    try {
      await api.post(`/admin/doctor/${doctorId}/verify`, {
        status,
        message: verifMessage || `Verification Update: Your account has been ${status}.`
      });
      toast.success(`Doctor status updated to ${status}`);
      setVerifMessage('');

      // If approved, the ID might have changed from applicationNumber to doctorId
      if (status === 'Approved' && doctorId.startsWith('APP')) {
         // We should probably redirect or refresh with the new ID
         const res = await api.get(`/admin/doctors`);
         const updatedDoc = res.data.find(d => d.applicationNumber === doctorId);
         if (updatedDoc && updatedDoc.doctorId) {
            navigate(`/admin/doctor/${updatedDoc.doctorId}`, { replace: true });
         } else {
            fetchDoctor();
         }
      } else {
         fetchDoctor();
      }
    } catch (err) {
      toast.error("Status update failed");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return (
    <div className={`flex h-screen items-center justify-center ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#F8FAFC]'}`}>
       <Loader2 className="animate-spin text-blue-500" size={48} />
    </div>
  );

  if (!data) return null;

  const { user, profile, prescriptions = [], appointments = [], opChart = [] } = data;
  const docs = profile.uploadedDocuments || [];

  const isVerificationContext = new URLSearchParams(window.location.search).get('tab') === 'verification';

  const tabs = isVerificationContext
    ? [{ id: 'verification', label: 'Verification Node', icon: ShieldCheckIcon }]
    : [
        { id: 'summary', label: 'Clinical Summary', icon: Brain },
        { id: 'queue', label: 'Recent OP Queue', icon: HistoryIcon },
        { id: 'prescriptions', label: 'Issued Archive', icon: Pill },
      ];

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left neural-grid pb-24 ${
      theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'
    }`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-8 lg:p-10 overflow-y-auto custom-scrollbar relative z-10">

          {/* Tactical Header */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center gap-3 px-5 py-2.5 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${
                theme === 'dark' ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-blue-400' : 'bg-white border-slate-200 text-slate-500 hover:text-blue-600'
              }`}
            >
              <ChevronLeft size={16} strokeWidth={3} /> Return to Directory
            </button>

            <div className="flex gap-4">
              <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase border flex items-center gap-2 ${
                profile.verificationStatus === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                profile.verificationStatus === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                 <Activity size={14} /> STATUS: {profile.verificationStatus || 'PENDING'}
              </span>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95"
                >
                  <Edit2 size={16} /> Edit Parameters
                </button>
              ) : (
                <div className="flex gap-2">
                   <button onClick={() => setIsEditing(false)} className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-all"><X size={16}/></button>
                   <button onClick={handleUpdate} disabled={saving} className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl flex items-center gap-2 active:scale-95">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                   </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* Profile Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <div className={`p-10 rounded-[48px] border backdrop-blur-3xl shadow-sm text-center relative overflow-hidden group noise-overlay transition-all duration-500 ${theme === 'dark' ? 'bg-[#0E0E12]/90 border-white/5 shadow-black/50' : 'bg-white border-slate-100'}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                <div className="relative z-10 text-center flex flex-col items-center">
                  <div className={`w-28 h-28 rounded-[40px] flex items-center justify-center text-blue-600 mx-auto mb-6 shadow-inner border transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5' : 'bg-blue-50 border-blue-100'}`}>
                    <Stethoscope size={48} />
                  </div>
                  <h2 className={`text-2xl font-black uppercase tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{user.name}</h2>
                  <p className="text-blue-500 font-black text-xs tracking-[0.3em] mt-3 uppercase">{user.doctorId || user.applicationNumber}</p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                     <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">{profile.specialization || 'General Surgeon'}</span>
                     <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">{profile.experience || '5'}Y EXP</span>
                  </div>

                  <div className={`mt-10 pt-8 border-t text-left space-y-6 w-full ${theme === 'dark' ? 'border-white/5' : 'border-slate-50'}`}>
                    <div className="flex items-center gap-5 group">
                       <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 text-zinc-500 group-hover:text-blue-400' : 'bg-slate-50 text-slate-400 group-hover:text-blue-600'}`}>
                          <Mail size={18} />
                       </div>
                       <div className="flex-1 overflow-hidden">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Neural Mail</p>
                          <p className="text-xs font-bold truncate">{user.email}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-5 group">
                       <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 text-zinc-500 group-hover:text-blue-400' : 'bg-slate-50 text-slate-400 group-hover:text-blue-600'}`}>
                          <PhoneIcon size={18} />
                       </div>
                       <div className="flex-1">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Primary Link</p>
                          <p className="text-xs font-bold">{user.phone || 'N/A'}</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hospital Credentials (Google Data) */}
              <div className={`p-8 rounded-[40px] shadow-2xl space-y-6 border transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                 <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 ml-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    <Building size={16} className="text-blue-500" /> INSTITUTION NODE
                 </h3>

                 <div className="space-y-6 text-left">
                    <div>
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Medical Institution</p>
                       <p className="text-sm font-black uppercase text-blue-500">{profile.hospitalName}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-1"><MapPin size={10}/> {profile.formattedAddress}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                          <p className="text-[7px] font-black text-slate-500 uppercase mb-1">Location Node</p>
                          <p className="text-[9px] font-black text-zinc-300">{profile.city || 'N/A'}</p>
                       </div>
                       <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                          <p className="text-[7px] font-black text-slate-500 uppercase mb-1">Google Rating</p>
                          <p className="text-[9px] font-black text-amber-500 flex items-center gap-1"><Star size={8} fill="currentColor"/> {profile.googleRating || '—'}</p>
                       </div>
                    </div>

                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-[9px] font-black uppercase text-blue-400 hover:bg-blue-600 hover:text-white transition-all">
                         <Globe size={12} /> Institutional Website
                      </a>
                    )}
                 </div>
              </div>
            </div>

            {/* Main Area */}
            <div className="lg:col-span-8 space-y-10">

              {/* Tabs */}
              <div className={`p-2 rounded-[32px] border backdrop-blur-3xl flex gap-2 overflow-x-auto custom-scrollbar transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 min-w-[160px] ${
                      activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : theme === 'dark' ? 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon size={16} strokeWidth={2.5} /> {tab.label}
                  </button>
                ))}
              </div>

              <div className={`p-10 rounded-[56px] border backdrop-blur-3xl shadow-sm min-h-[600px] relative overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>

                {activeTab === 'summary' && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <div className={`p-8 border rounded-[40px] transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                           <h4 className="font-black text-[10px] text-blue-500 uppercase mb-8 tracking-widest flex items-center gap-2"><Award size={14} /> Professional Parameters</h4>
                           <div className="space-y-5">
                              <div className="flex justify-between items-center">
                                 <span className="text-[9px] font-black text-slate-500 uppercase">Reg Number</span>
                                 <span className="text-xs font-black uppercase text-blue-500">{profile.medicalRegistrationNumber}</span>
                              </div>
                              {[
                                { l: 'Hospital', v: profile.hospitalName, key: 'hospitalName' },
                                { l: 'Department', v: profile.department, key: 'department' },
                                { l: 'Specialization', v: profile.specialization, key: 'specialization' },
                                { l: 'Gender', v: profile.gender, key: 'gender' },
                              ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center px-1">
                                   <span className="text-[9px] font-black text-slate-500 uppercase">{item.l}</span>
                                   {isEditing ? (
                                      <input
                                        value={editForm[item.key]}
                                        onChange={e => setEditState({...editForm, [item.key]: e.target.value})}
                                        className={`bg-transparent text-right border-b border-blue-500 text-xs font-black uppercase outline-none text-blue-400`}
                                      />
                                   ) : (
                                      <span className={`text-xs font-black uppercase ${theme === 'dark' ? 'text-zinc-200' : 'text-slate-800'}`}>{item.v || '—'}</span>
                                   )}
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className={`p-8 border rounded-[40px] transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                           <h4 className="font-black text-[10px] text-emerald-500 uppercase mb-8 tracking-widest flex items-center gap-2"><ShieldCheckIcon size={14} /> System Registry Status</h4>
                           <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                 <span className="text-[9px] font-black text-slate-500 uppercase">Verification</span>
                                 <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${profile.isVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                    {profile.verificationStatus || 'Pending Review'}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-[9px] font-black text-slate-500 uppercase">Account State</span>
                                 <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${user.isActive ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {user.isActive ? 'Active Node' : 'Inactive'}
                                 </span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* OP Graph */}
                     <div className={`p-8 border rounded-[40px] transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                        <h4 className="font-black text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-10">
                           <TrendingUp size={14} className="text-blue-500" /> Weekly Patient Throughput
                        </h4>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={opChart}>
                                 <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                                       <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1E293B' : '#CBD5E1'} />
                                 <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: '900', fill: '#475569'}} />
                                 <YAxis hide />
                                 <Tooltip contentStyle={{borderRadius: '16px', backgroundColor: theme === 'dark' ? '#0A0A0A' : '#fff', border: theme === 'dark' ? '1px solid #1E293B' : '1px solid #E2E8F0', fontSize: '10px'}} />
                                 <Area type="monotone" dataKey="count" name="Patients Treated" stroke="#2563EB" fillOpacity={1} fill="url(#colorCount)" strokeWidth={4} />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                  </div>
                )}

                {activeTab === 'verification' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 text-left">

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Admin Action Console */}
                        <div className={`p-8 border rounded-[40px] transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                           <h4 className="font-black text-[10px] text-blue-500 uppercase mb-8 tracking-widest flex items-center gap-2"><ShieldCheckIcon size={14} /> Verification Console</h4>

                           <div className="space-y-6">
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Directive Message</label>
                                 <textarea
                                    className={`w-full p-4 rounded-2xl border outline-none text-xs font-bold min-h-[100px] transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500/50' : 'bg-white border-slate-200'}`}
                                    placeholder="Enter reason for rejection or additional requirements..."
                                    value={verifMessage}
                                    onChange={(e) => setVerifMessage(e.target.value)}
                                 />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                 <button
                                    onClick={() => handleUpdateStatus('Approved')}
                                    disabled={verifying}
                                    className="py-3.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 active:scale-95"
                                 >
                                    <CheckCircle size={14}/> Approve Node
                                 </button>
                                 <button
                                    onClick={() => handleUpdateStatus('Rejected')}
                                    disabled={verifying}
                                    className="py-3.5 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 transition-all flex items-center justify-center gap-2 active:scale-95"
                                 >
                                    <X size={14}/> Reject Node
                                 </button>
                                 <button
                                    onClick={() => handleUpdateStatus('Documents Required')}
                                    disabled={verifying}
                                    className="col-span-2 py-3.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
                                 >
                                    <FileText size={14}/> Request Documents
                                 </button>
                              </div>
                           </div>
                        </div>

                        {/* Document Inventory */}
                        <div className={`p-8 border rounded-[40px] transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                           <h4 className="font-black text-[10px] text-purple-500 uppercase mb-8 tracking-widest flex items-center gap-2"><FileText size={14} /> Document Inventory</h4>

                           <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                              {docs.length > 0 ? docs.map((doc, idx) => (
                                 <div key={idx} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 hover:bg-zinc-800' : 'bg-white border-slate-100 hover:shadow-md'}`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                       <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                          <FileText size={18} />
                                       </div>
                                       <div className="text-left overflow-hidden">
                                          <p className="text-[10px] font-black text-white uppercase truncate">{doc.name}</p>
                                          <p className="text-[8px] font-bold text-slate-500 uppercase">{doc.fileType}</p>
                                       </div>
                                    </div>
                                    <div className="flex gap-2">
                                       <a
                                          href={`${BACKEND_URL}${doc.fileUrl}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-2.5 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                       >
                                          <ExternalLink size={14} />
                                       </a>
                                       <a
                                          href={`${BACKEND_URL}${doc.fileUrl}`}
                                          download
                                          className="p-2.5 bg-white/5 text-zinc-500 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                                       >
                                          <Download size={14} />
                                       </a>
                                    </div>
                                 </div>
                              )) : (
                                 <div className="py-12 text-center opacity-30">
                                    <AlertTriangle size={32} className="mx-auto mb-2" />
                                    <p className="text-[9px] font-black uppercase">No documents uploaded</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {activeTab === 'queue' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                     {appointments.length > 0 ? (
                        <div className="space-y-4">
                           {appointments.map((a, i) => (
                              <div key={i} className={`p-6 rounded-[32px] border transition-all group ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg'}`}>
                                 <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                    <div className="flex items-center gap-4 text-left">
                                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-400' : 'bg-white border-slate-100 text-slate-400'}`}>
                                          <UserIcon size={20} />
                                       </div>
                                       <div>
                                          <p className={`text-sm font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{a.patientName || 'PATIENT NODE'}</p>
                                          <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">{a.patientId}</p>
                                       </div>
                                    </div>
                                    <div className="text-left md:text-right">
                                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(a.date).toLocaleDateString()} AT {a.timeSlot || a.time}</p>
                                       <span className={`inline-block px-2 py-1 rounded-lg text-[9px] font-black uppercase mt-1 ${a.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>{a.status}</span>
                                    </div>
                                 </div>
                                 <div className="flex justify-end gap-3">
                                    <button
                                      onClick={() => navigate(`/admin/patient/${a.patientId}`)}
                                      className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${theme === 'dark' ? 'bg-white/5 text-blue-400 border border-white/5 hover:bg-blue-600 hover:text-white' : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white'}`}
                                    >
                                       Access Patient Registry <ChevronRight size={12} strokeWidth={3} />
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="py-24 text-center opacity-30">
                           <HistoryIcon size={64} className="mx-auto mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest">No Treated Patients Logged</p>
                        </div>
                     )}
                  </div>
                )}

                {activeTab === 'prescriptions' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 text-left">
                     {prescriptions.length > 0 ? prescriptions.map((p, i) => (
                        <div key={i} className={`border rounded-[40px] overflow-hidden shadow-sm transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-blue-500/30' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg'}`}>
                           <div className={`p-6 border-b flex justify-between items-center px-8 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                              <div className="text-left">
                                 <p className="font-black text-[9px] text-blue-500 uppercase tracking-[0.2em]">Issued: {new Date(p.createdAt).toLocaleDateString()}</p>
                                 <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">To: {p.patientId}</p>
                              </div>
                              <button className={`px-6 py-2 border text-[9px] font-black uppercase tracking-widest rounded-xl shadow-sm transition-all flex items-center gap-2 ${theme === 'dark' ? 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800' : 'bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}>View Full Rx <Download size={12} /></button>
                           </div>
                           <div className="p-8 px-10">
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest text-left">Diagnostic Node</p>
                              <h4 className={`text-sm font-black uppercase tracking-tight mb-6 text-left ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{p.diagnosis}</h4>
                           </div>
                        </div>
                     )) : (
                        <div className="py-24 text-center opacity-30">
                           <Pill size={64} className="mx-auto mb-4" />
                           <p className="text-[10px] font-black uppercase tracking-widest">No Prescriptions Issued</p>
                        </div>
                     )}
                  </div>
                )}

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorDetails;
