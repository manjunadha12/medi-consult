import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import NeuralDock from '../common/NeuralDock';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import {
  Search as SearchIcon, MapPin, Star, Clock, ChevronRight, Loader2, Award,
  ShieldCheck, MessageCircle, Video, Activity, Info, Building, X,
  Globe, GraduationCap, Users, CheckCircle, BadgeCheck, FileText,
  ThumbsUp, Filter, Calendar, ArrowLeft, MoreHorizontal, Check, User, Phone, MessageSquare, ExternalLink, ArrowRight, Stethoscope
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const DoctorSearch = () => {
  const { theme } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState(location.state?.query || '');
  const [doctors, setDoctors] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docDetails, setDocDetails] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('About');

  const fetchDoctors = async (searchQuery = '') => {
    setIsSearching(true);
    try {
      const { data } = await api.post('/ai/doctor-suggestion', { search: searchQuery });
      setDoctors(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDocClick = async (docId) => {
    setFetchingDetails(true);
    setSelectedDoc(docId);
    try {
      const { data } = await api.get(`/ai/doctor-profile/${docId}`);
      setDocDetails(data);
    } catch (err) {
      toast.error("Failed to fetch specialist details");
    } finally {
      setFetchingDetails(false);
    }
  };

  useEffect(() => {
    // Initial fetch empty or based on query
    if (query.trim().length >= 2) {
      fetchDoctors(query);
    } else {
      setDoctors([]);
    }
  }, [query]);

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-[#F8FAFC] text-slate-800'} font-sans text-left`}>
      <Navbar />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-4 left-4 z-[100] bg-red-600 text-white px-4 py-1 rounded-full text-[8px] font-black uppercase animate-pulse">
          ENGINE VERSION 4.0 - DISCOVERY MODE ONLY
        </div>

        {!selectedDoc ? (
          /* DOCTOR DISCOVERY PAGE - PURE DIRECTORY MODE */
          <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 pb-40">
            <div className="max-w-[1400px] mx-auto">
              <header className="mb-12">
                <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] mb-3">Neural Registry</p>
                <h1 className="text-5xl font-black uppercase tracking-tight mb-2">Specialist Discovery</h1>
                <p className="text-zinc-500 font-bold uppercase text-[11px] tracking-[0.2em]">Professional medical operator directory node • No Booking Direct</p>
              </header>

              {/* Discovery Search Bar */}
              <div className="mb-10 max-w-4xl mx-auto">
                <div className={`relative flex items-center p-1 rounded-[32px] border transition-all ${theme === 'dark' ? 'bg-[#0A0A0C] border-white/10 focus-within:border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.05)]' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <SearchIcon className="absolute left-8 text-blue-500" size={24} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search specialists (e.g. Dr. Naresh Trehan)"
                    className="w-full pl-20 pr-12 py-6 bg-transparent outline-none font-black text-xl tracking-widest uppercase placeholder:text-zinc-800"
                  />
                  {isSearching && <Loader2 className="absolute right-8 animate-spin text-blue-500" size={24} />}
                </div>
              </div>

              {/* Specialist Row List */}
              <div className="space-y-6">
                {doctors.length > 0 ? doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-6 sm:p-8 rounded-[40px] border border-white/5 bg-[#0A0A0C] transition-all duration-500 hover:bg-blue-600/5 hover:border-blue-500/40 flex flex-col lg:flex-row items-center gap-10 group relative shadow-2xl overflow-hidden`}
                  >
                    {/* Left: Photo */}
                    <div className="shrink-0">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[32px] overflow-hidden border-2 border-white/10 relative shadow-2xl group-hover:scale-105 transition-transform duration-500">
                         <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-5xl font-black">
                           {doc.name.charAt(0)}
                         </div>
                      </div>
                    </div>

                    {/* Middle: Professional Grid */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center h-full">
                      <div className="text-left space-y-2">
                        <div className="flex items-center gap-3">
                           <h3 className="text-2xl font-black uppercase tracking-tight text-white">{doc.name}</h3>
                           <BadgeCheck size={20} className="text-blue-500 shrink-0" />
                        </div>
                        <p className="text-blue-500 text-[11px] font-black uppercase tracking-[0.2em]">{doc.specialization}</p>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">MBBS, MS, MCh (CTVS) • {doc.exp}Y Experience</p>
                      </div>

                      <div className="text-left space-y-4 lg:border-l lg:border-white/5 lg:pl-8">
                         <div className="flex items-start gap-4">
                            <Building size={18} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-[12px] font-black uppercase tracking-widest text-zinc-300">{doc.hospital}</p>
                         </div>
                         <div className="flex items-center gap-4">
                            <MapPin size={18} className="text-rose-500 shrink-0" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{doc.city}</p>
                         </div>
                      </div>

                      <div className="text-left space-y-4 lg:border-l lg:border-white/5 lg:pl-8">
                         <div className="flex items-center gap-4 text-amber-500">
                            <Star size={20} fill="currentColor" />
                            <p className="text-xl font-black text-white">{doc.rating}</p>
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">({doc.treated || 4328} Reviews)</p>
                         </div>
                         <p className="text-[10px] font-bold text-zinc-400 uppercase">Languages: English, Hindi</p>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-wrap items-center justify-end w-full lg:w-auto gap-4">
                      <button
                        onClick={() => navigate('/patient/book-op', { state: { doctor: { name: doc.name, id: doc.id, hospitalName: doc.hospital, specialization: doc.specialization, city: doc.city }, bookingType: 'offline' } })}
                        className="px-8 py-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-[24px] font-black text-[12px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 whitespace-nowrap"
                      >
                        <Calendar size={18} /> Offline OP Booking
                      </button>
                      <button
                        onClick={() => handleDocClick(doc.id)}
                        className="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-[24px] font-black text-[12px] uppercase tracking-[0.2em] transition-all hover:bg-blue-600 hover:border-blue-500 flex items-center justify-center gap-3 group/btn shadow-xl active:scale-95 whitespace-nowrap"
                      >
                        View Full Profile <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                )) : query.length >= 2 ? (
                  <div className="py-24 text-center opacity-30 uppercase font-black tracking-widest">No Node Mapping Found</div>
                ) : (
                  <div className="py-32 text-center space-y-8">
                    <Stethoscope size={80} className="mx-auto text-zinc-800 opacity-20" />
                    <p className="text-[12px] font-black uppercase tracking-[0.5em] text-zinc-600">Enter Clinical Identity Key to Start Discovery</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        ) : (
          /* FULL PROFILE VIEW */
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505] animate-in slide-in-from-right duration-500">
            {fetchingDetails ? (
              <div className="h-full flex flex-col items-center justify-center p-20 gap-10">
                <Loader2 className="animate-spin text-blue-500" size={100} strokeWidth={1} />
                <p className="text-sm font-black uppercase tracking-[0.8em] text-zinc-500">SYNCING DATA...</p>
              </div>
            ) : docDetails ? (
              <div className="max-w-[1600px] mx-auto p-6 lg:p-16 pb-40">
                <button onClick={() => setSelectedDoc(null)} className="flex items-center gap-4 text-zinc-500 hover:text-white transition-all text-[12px] font-black uppercase tracking-[0.4em] mb-16 group">
                  <ArrowLeft size={20} /> Back to Registry
                </button>

                {/* Identity Header */}
                <div className="bg-[#0A0A0C] border border-white/5 rounded-[64px] p-10 lg:p-20 mb-20 relative overflow-hidden shadow-2xl">
                  <div className="flex flex-col xl:flex-row gap-20 items-start relative z-10">
                    <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-[80px] bg-blue-600 shrink-0 overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.4)]">
                      <div className="w-full h-full flex items-center justify-center text-white text-[100px] font-black">
                        {docDetails.user?.name.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1 text-left space-y-8">
                      <h2 className="text-6xl sm:text-8xl font-black text-white uppercase tracking-tighter leading-none">{docDetails.user?.name}</h2>
                      <p className="text-blue-500 text-2xl sm:text-3xl font-black uppercase tracking-[0.6em]">{docDetails.profile?.designation}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-white/5">
                        {[
                          { l: 'Experience', v: docDetails.profile?.experience + 'Y' },
                          { l: 'Operations', v: '1500+' },
                          { l: 'Treated', v: '25K+' },
                          { l: 'Rating', v: docDetails.profile?.rating }
                        ].map(s => (
                          <div key={s.l}><p className="text-[10px] font-black text-zinc-600 uppercase mb-1">{s.l}</p><p className="text-2xl font-black text-white uppercase">{s.v}</p></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* THE BOOKING BAR */}
                <div className="fixed bottom-0 left-0 right-0 z-[2200] p-10 bg-[#0A0A0C]/98 backdrop-blur-5xl border-t border-white/10 animate-in slide-in-from-bottom-full duration-700">
                  <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row items-center justify-between gap-16 px-10">
                    <div className="text-left space-y-4">
                       <h4 className="text-4xl font-black text-white uppercase tracking-tighter">Initialize Clinical Handshake?</h4>
                       <p className="text-zinc-500 text-sm font-bold uppercase tracking-[0.4em] opacity-60">Identity verified. Experience confirmed. Technical precision checked.</p>
                    </div>
                    <div className="flex items-center gap-16">
                       <div className="text-right hidden xl:block">
                          <p className="text-[12px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-2">Protocol Fee</p>
                          <p className="text-6xl font-black text-white tracking-tighter">₹{docDetails.profile?.consultationFee || 2500}</p>
                       </div>
                       <button onClick={() => navigate('/patient/book-op', { state: { doctor: { ...docDetails.profile, name: docDetails.user.name, id: selectedDoc } } })} className="px-24 py-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[40px] font-black text-base uppercase tracking-[0.6em] shadow-[0_0_80px_rgba(16,185,129,0.5)] transition-all flex items-center gap-8 active:scale-95 group">
                          <Calendar size={36} /> Book Appointment
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </main>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
};

export default DoctorSearch;
