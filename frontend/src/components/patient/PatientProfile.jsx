import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import Navbar from '../common/Navbar';
import api, { BACKEND_URL } from '../../utils/api';
import { User, Mail, Phone as PhoneIcon, MapPin, Droplet, AlertCircle, Edit2, Save, X, Loader2, ShieldCheck as ShieldCheckIcon, Shield, Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PatientProfile = () => {
  const { user, setUser, theme } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    bloodGroup: '',
    address: '',
    profilePicture: '',
    allergies: [],
    medicalHistory: []
  });

  const fileInputRef = React.useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user?.userId || user.userId === 'undefined') {
      console.error("[PROFILE_SYNC_ERR] Invalid User ID Node:", user);
      toast.error("Identity node desynchronized. Please re-login.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get(`/patients/profile/${user.userId}`);
      setProfile({
        ...data,
        allergies: data.allergies || [],
        medicalHistory: data.medicalHistory || []
      });
    } catch (error) {
      console.error("[PROFILE_FETCH_ERR]", error.response?.status, error.response?.data || error.message);
      toast.error(`Failed to load profile: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/patients/profile/${user.userId}`, profile);
      toast.success("Profile updated!");
      setIsEditing(false);
      setUser({ ...user, name: profile.name, profilePicture: profile.profilePicture });
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      // Diagnostic Ping
      try {
        const pingRes = await api.get('/patients/node-ping');
        console.log("[AVATAR_PING] Node responds:", pingRes.data);
      } catch (pingErr) {
        console.warn("[AVATAR_PING] Node unreachable or 404:", pingErr.message);
      }

      const uploadURL = `/patients/upload-avatar`;
      console.log(`[AVATAR_HANDSHAKE] Initializing post to: ${api.defaults.baseURL}${uploadURL}`);

      const { data } = await api.post(uploadURL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile({ ...profile, profilePicture: data.url });
      // If not editing, auto-save the picture
      if (!isEditing) {
        await api.put(`/patients/profile/${user.userId}`, { ...profile, profilePicture: data.url });
        setUser({ ...user, profilePicture: data.url });
        toast.success("Identity visual synchronized");
      }
    } catch (err) {
      console.error("[AVATAR_UPLOAD_ERR]", err);
      const errorMsg = err.response?.data?.message || err.message || "Handshake failed during upload";
      const fullPath = `${api.defaults.baseURL}/patients/upload-avatar`;
      toast.error(`Upload Failed: ${errorMsg} (Node: ${fullPath})`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className={`flex h-screen items-center justify-center ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#F8FAFC]'}`}>
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-300' : 'bg-[#F8FAFC] text-slate-600'}`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-4 sm:p-6 lg:p-10 pb-32 overflow-y-auto custom-scrollbar">
          <header className="mb-8 sm:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-2 sm:px-4">
            <div className="text-left">
              <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Personal Profile</h1>
              <p className="text-zinc-500 uppercase text-[8px] sm:text-[10px] font-black tracking-widest mt-1">Archive Identity Management</p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-blue-500 transition-all active:scale-95"
              >
                <Edit2 size={16} /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsEditing(false)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${theme === 'dark' ? 'border-white/10 text-zinc-500 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="flex-1 sm:flex-none bg-blue-600 text-white px-8 py-3 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-blue-500 transition-all active:scale-95"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                  Save
                </button>
              </div>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
            <div className="lg:col-span-1 space-y-6 sm:space-y-8">
              <div className={`p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border shadow-xl text-center relative overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5 shadow-black/60' : 'bg-white border-slate-100'}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 group/avatar">
                  <div className={`w-full h-full rounded-[32px] sm:rounded-[40px] flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-2xl overflow-hidden border-2 border-white/5 ${!profile.profilePicture ? 'bg-blue-600' : ''}`}>
                    {profile.profilePicture ? (
                      <img src={`${BACKEND_URL}${profile.profilePicture}`} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      profile.name?.charAt(0)
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl hover:bg-blue-500 transition-all active:scale-90 border-4 border-[#0A0A0A]"
                  >
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleAvatarUpload}
                    accept="image/*"
                  />
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className={`text-lg sm:text-xl font-black text-center border-b outline-none w-full bg-transparent uppercase tracking-tight transition-colors ${theme === 'dark' ? 'border-blue-500 text-white' : 'border-blue-600 text-slate-800'}`}
                  />
                ) : (
                  <h2 className={`text-lg sm:text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{profile.name}</h2>
                )}
                <p className="text-blue-500 font-black text-[8px] sm:text-[10px] uppercase tracking-widest mt-2">{user?.userId}</p>
                <div className="flex justify-center gap-2 sm:gap-3 mt-6">
                   {isEditing ? (
                     <div className="flex gap-2">
                        <input
                          type="number"
                          value={profile.age}
                          onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                          className={`w-16 p-3 border rounded-xl text-[10px] font-black outline-none ${theme === 'dark' ? 'bg-zinc-900 border-white/10' : 'bg-slate-50'}`}
                          placeholder="Age"
                        />
                        <select
                          value={profile.gender}
                          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                          className={`p-3 border rounded-xl text-[10px] font-black outline-none ${theme === 'dark' ? 'bg-zinc-900 border-white/10' : 'bg-slate-50'}`}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                     </div>
                   ) : (
                    <>
                      <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-white/5 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>{profile.age} Years</span>
                      <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-white/5 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>{profile.gender}</span>
                    </>
                   )}
                </div>
              </div>

              <div className={`p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border shadow-xl transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5 shadow-black/60' : 'bg-white border-slate-100'}`}>
                <h3 className="font-black uppercase tracking-[0.2em] text-[8px] sm:text-[10px] mb-6 sm:mb-8 flex items-center gap-3 text-blue-500 leading-none"><PhoneIcon size={14} className="sm:w-4 sm:h-4" /> Contact Hub</h3>
                <div className="space-y-6 sm:space-y-8 text-left">
                  <div className="flex items-center gap-4 sm:gap-5 group">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shrink-0 ${theme === 'dark' ? 'bg-white/5 text-zinc-500 group-hover:text-blue-400' : 'bg-slate-50 text-slate-400 group-hover:text-blue-600'}`}>
                       <Mail size={16} className="sm:w-4.5 sm:h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Neural Mail</p>
                      <p className="text-[10px] sm:text-xs font-bold truncate">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-5 group">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shrink-0 ${theme === 'dark' ? 'bg-white/5 text-zinc-500 group-hover:text-blue-400' : 'bg-slate-50 text-slate-400 group-hover:text-blue-600'}`}>
                       <PhoneIcon size={16} className="sm:w-4.5 sm:h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Signal Line</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className={`w-full text-[10px] sm:text-xs font-bold border-b outline-none bg-transparent ${theme === 'dark' ? 'border-white/10 text-white' : 'border-slate-200'}`}
                        />
                      ) : (
                        <p className="text-[10px] sm:text-xs font-bold truncate">{profile.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-4 sm:gap-5 group text-left">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shrink-0 mt-1 ${theme === 'dark' ? 'bg-white/5 text-zinc-500 group-hover:text-blue-400' : 'bg-slate-50 text-slate-400 group-hover:text-blue-600'}`}>
                       <MapPin size={16} className="sm:w-4.5 sm:h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Geographic Node</p>
                      {isEditing ? (
                        <textarea
                          value={profile.address}
                          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                          className={`w-full text-[10px] sm:text-xs font-bold border rounded-xl p-3 outline-none bg-transparent ${theme === 'dark' ? 'border-white/10 text-white' : 'border-slate-200'}`}
                        />
                      ) : (
                        <p className="text-[10px] sm:text-xs font-bold leading-relaxed">{profile.address || 'Location pending synchronization...'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6 sm:space-y-10 text-left">
              <div className={`p-6 sm:p-10 rounded-[40px] sm:rounded-[56px] border shadow-xl transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0F] border-white/5 shadow-black/60' : 'bg-white border-slate-100'}`}>
                <h3 className="font-black uppercase tracking-[0.2em] text-[8px] sm:text-[10px] mb-8 sm:mb-10 flex items-center gap-3 text-red-500 leading-none"><Droplet size={18} className="sm:w-5 sm:h-5" /> Biometric Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                  <div className="text-left">
                    <p className="text-[8px] sm:text-[10px] font-black mb-4 text-slate-500 uppercase tracking-widest">Molecular Group</p>
                    {isEditing ? (
                      <select
                        value={profile.bloodGroup}
                        onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm outline-none border transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/10 text-red-500' : 'bg-red-50 text-red-600 border-red-100'}`}
                      >
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    ) : (
                      <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 text-red-500' : 'bg-red-50 text-red-600 border-red-100 shadow-inner'}`}>
                        {profile.bloodGroup || '?'}
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] sm:text-[10px] font-black mb-4 text-slate-500 uppercase tracking-widest">Immune Reactions</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.allergies.map((a, i) => (
                        <span key={i} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 transition-all ${theme === 'dark' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          <AlertCircle size={10} className="sm:w-3 sm:h-3" /> {a}
                          {isEditing && (
                            <button onClick={() => setProfile({ ...profile, allergies: profile.allergies.filter((_, idx) => idx !== i) })}>
                              <X size={10} strokeWidth={4} />
                            </button>
                          )}
                        </span>
                      ))}
                      {isEditing && (
                        <button
                          onClick={() => { const val = prompt("Enter allergy:"); if(val) setProfile({...profile, allergies: [...profile.allergies, val]}); }}
                          className={`px-3 py-1.5 sm:px-4 sm:py-2 border-2 border-dashed rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'border-white/10 text-zinc-600 hover:text-white' : 'border-slate-200 text-slate-400'}`}
                        >+ Sync</button>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2 text-left">
                    <p className="text-[8px] sm:text-[10px] font-black mb-4 text-slate-500 uppercase tracking-widest">Clinical History Timeline</p>
                    <div className="space-y-2 sm:space-y-3">
                      {profile.medicalHistory.map((h, i) => (
                        <div key={i} className={`p-4 sm:p-5 rounded-2xl sm:rounded-[24px] border flex items-center justify-between transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                          <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-blue-500 truncate mr-4">{h}</span>
                          {isEditing ? (
                            <button onClick={() => setProfile({ ...profile, medicalHistory: profile.medicalHistory.filter((_, idx) => idx !== i) })} className="text-red-500 shrink-0"><X size={14} strokeWidth={3} /></button>
                          ) : (
                            <Shield size={14} className="text-emerald-500 shrink-0" />
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <button
                          onClick={() => { const val = prompt("Enter condition:"); if(val) setProfile({...profile, medicalHistory: [...profile.medicalHistory, val]}); }}
                          className={`w-full p-4 border-2 border-dashed rounded-2xl sm:rounded-[24px] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all ${theme === 'dark' ? 'border-white/10 text-zinc-600 hover:text-white' : 'border-slate-200 text-slate-400'}`}
                        >+ Initialize Registry Segment</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] bg-blue-600 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all duration-1000"></div>
                 <h3 className="font-black uppercase tracking-[0.2em] text-[8px] sm:text-[10px] mb-3 sm:mb-4 relative z-10 opacity-70 leading-none">Emergency Link</h3>
                 <div className="relative z-10 text-left">
                    <p className="text-lg sm:text-xl font-black uppercase tracking-tight truncate">Satish Node (Brother)</p>
                    <p className="text-xs sm:text-sm font-black text-blue-100 mt-1">+91 9988776655</p>
                 </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientProfile;
