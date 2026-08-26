import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import {
  Search as SearchIcon, MapPin, Star, Clock, ChevronRight, Loader2,
  ShieldCheck, MessageCircle, Video, Activity, Info, Building,
  CheckCircle, BadgeCheck, Users, Phone as PhoneIcon, MessageSquare, ExternalLink,
  ArrowRight, Stethoscope, Sparkles, User, UserPlus
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DoctorNetwork = () => {
  const { theme, user } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchDoctors = async (searchQuery = '') => {
    setIsSearching(true);
    try {
      // Use existing suggestion endpoint
      const { data } = await api.post('/ai/doctor-suggestion', { search: searchQuery });
      // Filter out self
      setDoctors(data.filter(d => d.id !== user.doctorId));
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (query.trim().length >= 2) {
      fetchDoctors(query);
    } else {
      // Show some random doctors initially
      fetchDoctors('');
    }
  }, [query]);

  const handleStartChat = (doc) => {
    if (!doc.id) return toast.error("Doctor identity node missing");
    toast.success(`Initializing P2P Link with Dr. ${doc.name}`);
    navigate('/doctor/chat', {
      state: {
        startChat: true,
        targetUserId: doc.id,
        isPeerToPeer: true
      }
    });
  };

  const handleStartVideo = (doc) => {
    if (!doc.id) return toast.error("Doctor identity node missing");
    const ids = [user.doctorId, doc.id].sort();
    const roomCode = `P2P-${ids[0]}-${ids[1]}`;
    toast.success(`Establishing Neural Video Stream...`);
    navigate(`/doctor/video-consult?roomCode=${roomCode}&peerName=${doc.name}&peerId=${doc.id}&isP2P=true`);
  };

  const handleStartVoice = (doc) => {
    if (!doc.id) return toast.error("Doctor identity node missing");
    const ids = [user.doctorId, doc.id].sort();
    const roomCode = `P2P-${ids[0]}-${ids[1]}`;
    toast.success(`Establishing Neural Voice Link...`);
    navigate(`/doctor/voice-consult?roomCode=${roomCode}&peerName=${doc.name}&peerId=${doc.id}&isP2P=true`);
  };

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-[#F8FAFC] text-slate-800'} font-sans text-left`}>
      <Navbar />

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-10 pb-40">
        <div className="max-w-[1400px] mx-auto">
          <header className="mb-8">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Institutional Network</p>
            <h1 className="text-4xl font-black uppercase tracking-tight mb-1">Specialist Directory</h1>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Connect with peers for case consultation and knowledge synthesis</p>
          </header>

          {/* Search Bar */}
          <div className="mb-10 max-w-2xl">
            <div className={`relative flex items-center p-1 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-[#0A0A0C] border-white/10 focus-within:border-blue-500/50 shadow-lg' : 'bg-white border-slate-200 shadow-sm'}`}>
              <SearchIcon className="absolute left-6 text-blue-500" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, specialization or hospital..."
                className="w-full pl-14 pr-12 py-4 bg-transparent outline-none font-bold text-base tracking-widest uppercase placeholder:text-zinc-800"
              />
              {isSearching && <Loader2 className="absolute right-6 animate-spin text-blue-500" size={20} />}
            </div>
          </div>

          {/* Specialist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doctors.length > 0 ? doctors.map((doc) => (
              <div
                key={doc.id}
                className={`p-6 rounded-[32px] border border-white/5 bg-[#0A0A0C] transition-all duration-500 hover:bg-white/5 flex flex-col items-center gap-6 group relative shadow-2xl`}
              >
                <div className="w-full flex items-center gap-5">
                   <div className="w-20 h-20 rounded-[24px] bg-blue-600 flex items-center justify-center text-white text-3xl font-black uppercase shadow-lg shrink-0">
                      {doc.name.charAt(0)}
                   </div>
                   <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors truncate">{doc.name}</h3>
                        <BadgeCheck size={18} className="text-blue-500 shrink-0" />
                      </div>
                      <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">{doc.specialization}</p>
                      <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-1 truncate">{doc.hospital}</p>
                   </div>
                   <div className="shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${doc.available ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                         {doc.available ? 'ONLINE' : 'BUSY'}
                      </span>
                   </div>
                </div>

                <div className="w-full grid grid-cols-3 gap-3 border-t border-white/5 pt-6">
                   <button
                     onClick={() => handleStartChat(doc)}
                     className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 rounded-2xl hover:bg-blue-600 transition-all group/btn"
                   >
                      <MessageSquare size={18} className="text-zinc-400 group-hover/btn:text-white" />
                      <span className="text-[8px] font-black text-zinc-500 group-hover/btn:text-white uppercase tracking-widest">Message</span>
                   </button>
                   <button
                     onClick={() => handleStartVideo(doc)}
                     className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 rounded-2xl hover:bg-emerald-600 transition-all group/btn"
                   >
                      <Video size={18} className="text-zinc-400 group-hover/btn:text-white" />
                      <span className="text-[8px] font-black text-zinc-500 group-hover/btn:text-white uppercase tracking-widest">Video Call</span>
                   </button>
                   <button
                     onClick={() => handleStartVoice(doc)}
                     className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 rounded-2xl hover:bg-amber-600 transition-all group/btn"
                   >
                      <PhoneIcon size={18} className="text-zinc-400 group-hover/btn:text-white" />
                      <span className="text-[8px] font-black text-zinc-500 group-hover/btn:text-white uppercase tracking-widest">Voice Call</span>
                   </button>
                </div>
              </div>
            )) : query.length >= 2 ? (
              <div className="col-span-full py-20 text-center opacity-30 uppercase font-black tracking-widest text-sm">No Specialist Node Found</div>
            ) : (
               <div className="col-span-full py-20 text-center flex flex-col items-center gap-6 opacity-30">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Loading Registry...</p>
               </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
};

export default DoctorNetwork;
