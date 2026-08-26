import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import api from '../../utils/api';
import {
  User as UserIcon, Mail, Phone as PhoneIcon, MapPin, Activity,
  Stethoscope, Shield, Edit2, Camera, Star, Save, X, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';

const DocProfile = () => {
  const navigate = useNavigate();
  const store = useStore();
  const { user, theme, setUser } = store;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    hospitalName: '',
    department: '',
    experience: '',
    consultationFee: '',
    phone: '',
    gender: 'Male',
    age: ''
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctor/profile');
      setProfile(res.data);
      setFormData({
        name: user?.name || '',
        specialization: res.data.specialization || '',
        hospitalName: res.data.hospitalName || '',
        department: res.data.department || '',
        experience: res.data.experience || '',
        consultationFee: res.data.consultationFee || '',
        phone: user?.phone || '',
        gender: res.data.gender || 'Male',
        age: res.data.age || ''
      });
    } catch (err) {
      toast.error("Failed to load profile node");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/doctor/profile', formData);
      toast.success("Profile Node Synchronized");

      // Update store user if name or phone changed
      if (formData.name !== user.name || formData.phone !== user.phone) {
        store.setUser({ ...user, name: formData.name, phone: formData.phone });
      }

      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      toast.error("Synchronization failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
       <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-xs">Syncing Neural Profile...</p>
       </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-300 text-left neural-grid pb-24">
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-4 sm:p-8 relative z-10 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8 text-left">

            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
              <div className="text-left">
                <h1 className={`text-3xl sm:text-4xl font-black text-white uppercase tracking-tight`}>My Clinical Profile</h1>
                <p className="text-zinc-500 font-medium mt-1">Manage your professional identity and hospital credentials</p>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/20 flex items-center gap-3 hover:bg-blue-500 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Edit2 size={16} strokeWidth={3} /> EDIT PROFILE
                </button>
              ) : (
                <div className="flex gap-3 w-full sm:w-auto">
                   <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 sm:flex-none px-8 py-4 bg-white/5 border border-white/10 text-zinc-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                   >
                     Cancel
                   </button>
                   <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 sm:flex-none px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                   >
                     {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} strokeWidth={3} />}
                     SAVE CHANGES
                   </button>
                </div>
              )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">

              {/* Sidebar Info */}
              <div className="lg:col-span-1 space-y-6">
                <div className={`p-8 rounded-[40px] border shadow-sm text-center relative overflow-hidden group transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                  <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-600 to-indigo-600 opacity-20"></div>
                  <div className="relative z-10">
                    <div className="w-32 h-32 bg-zinc-900 rounded-full mx-auto p-1.5 shadow-xl border border-white/10 mb-6">
                      <div className="w-full h-full bg-white/5 rounded-full flex items-center justify-center text-blue-400 relative group">
                        <UserIcon size={64} className="opacity-30" />
                        <button className="absolute inset-0 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all">
                           <Camera size={24} />
                        </button>
                      </div>
                    </div>
                    {isEditing ? (
                      <input
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2 text-center text-lg font-black text-white outline-none focus:border-blue-500/50 uppercase"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Clinical Name"
                      />
                    ) : (
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">{user?.name}</h2>
                    )}
                    <p className="text-blue-400 font-bold text-sm tracking-widest uppercase mt-1">{profile?.specialization || 'Consultant'}</p>
                    <div className="mt-6 flex justify-center gap-4">
                       <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl flex items-center gap-1.5 text-amber-400 font-black text-xs">
                          <Star size={14} className="fill-current" /> 4.7
                       </div>
                       <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-2xl flex items-center gap-1.5 text-blue-400 font-black text-xs">
                          <Shield size={14} /> VERIFIED
                       </div>
                    </div>
                  </div>
                </div>

                <div className={`p-8 rounded-[40px] border shadow-sm space-y-6 transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                   <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5 pb-4">Contact Gateway</h3>
                   <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-zinc-400 shrink-0"><Mail size={20} /></div>
                        <div className="text-left overflow-hidden">
                           <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Clinical Email</p>
                           <p className="text-sm font-bold text-zinc-200 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-zinc-400 shrink-0"><PhoneIcon size={20} /></div>
                        <div className="text-left overflow-hidden flex-1">
                           <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Emergency Line</p>
                           {isEditing ? (
                             <input
                               type="text"
                               className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-blue-400 outline-none focus:border-blue-500/50"
                               value={formData.phone}
                               onChange={(e) => setFormData({...formData, phone: e.target.value})}
                             />
                           ) : (
                             <p className="text-sm font-bold text-zinc-200">{user?.phone || 'Not Configured'}</p>
                           )}
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Main Credentials Area */}
              <div className="lg:col-span-2 space-y-8">
                <div className={`p-10 rounded-[48px] border shadow-sm transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                   <h3 className="text-lg font-black text-white mb-10 flex items-center gap-3">
                     <Stethoscope size={24} className="text-blue-400" /> Hospital Credentials
                   </h3>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                      <div className="text-left space-y-3">
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Specialization</label>
                        {isEditing ? (
                          <input
                            className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500/50"
                            value={formData.specialization}
                            onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                          />
                        ) : (
                          <p className="text-xl font-black text-zinc-100">{profile?.specialization || 'Not Set'}</p>
                        )}
                      </div>

                      <div className="text-left space-y-3">
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Medical Institution</label>
                        {isEditing ? (
                          <input
                            className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500/50"
                            value={formData.hospitalName}
                            onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                          />
                        ) : (
                          <p className="text-xl font-black text-zinc-100">{profile?.hospitalName || 'Not Set'}</p>
                        )}
                      </div>

                      <div className="text-left space-y-3">
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Department</label>
                        {isEditing ? (
                          <input
                            className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500/50"
                            value={formData.department}
                            onChange={(e) => setFormData({...formData, department: e.target.value})}
                          />
                        ) : (
                          <p className="text-xl font-black text-zinc-100">{profile?.department || 'Not Set'}</p>
                        )}
                      </div>

                      <div className="text-left space-y-3">
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Experience (Years)</label>
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500/50"
                            value={formData.experience}
                            onChange={(e) => setFormData({...formData, experience: e.target.value})}
                          />
                        ) : (
                          <p className="text-xl font-black text-zinc-100">{profile?.experience || '0'} Years</p>
                        )}
                      </div>

                      <div className="text-left space-y-3">
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">OP Consultation Fee</label>
                        {isEditing ? (
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">₹</span>
                             <input
                              type="number"
                              className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 pl-8 text-sm font-bold text-emerald-400 outline-none focus:border-blue-500/50"
                              value={formData.consultationFee}
                              onChange={(e) => setFormData({...formData, consultationFee: e.target.value})}
                             />
                          </div>
                        ) : (
                          <p className="text-2xl font-black text-emerald-500">₹{profile?.consultationFee || '0'}</p>
                        )}
                      </div>

                      <div className="text-left space-y-3">
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Bio Node (Age & Gender)</label>
                        {isEditing ? (
                          <div className="flex gap-4">
                             <input
                              type="number"
                              placeholder="Age"
                              className="w-24 bg-zinc-900 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500/50"
                              value={formData.age}
                              onChange={(e) => setFormData({...formData, age: e.target.value})}
                             />
                             <select
                               className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500/50"
                               value={formData.gender}
                               onChange={(e) => setFormData({...formData, gender: e.target.value})}
                             >
                               <option value="Male">Male</option>
                               <option value="Female">Female</option>
                               <option value="Other">Other</option>
                             </select>
                          </div>
                        ) : (
                          <p className="text-xl font-black text-zinc-100 uppercase">{profile?.age || '—'} YRS • {profile?.gender || '—'}</p>
                        )}
                      </div>
                   </div>
                </div>

                <div className={`p-10 rounded-[48px] border shadow-sm transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                   <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3">
                     <Activity size={24} className="text-blue-400" /> Professional Signature
                   </h3>
                   <div
                     onClick={() => toast.success("Signature capture node activated")}
                     className="w-full h-48 bg-white/5 border-2 border-dashed border-white/10 rounded-[32px] flex items-center justify-center group cursor-pointer hover:bg-white/10 transition-all"
                   >
                      <div className="text-center">
                        <Camera size={32} className="text-zinc-650 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Click to upload digital signature</p>
                      </div>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocProfile;
