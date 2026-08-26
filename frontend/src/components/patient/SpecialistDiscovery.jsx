import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../common/Navbar';
import NeuralDock from '../common/NeuralDock';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import {
  Search as SearchIcon,
  MapPin,
  Star,
  Clock,
  ChevronRight,
  Loader2,
  Award,
  ShieldCheck,
  MessageCircle,
  Video,
  Activity,
  Info,
  Building,
  X,
  Globe,
  GraduationCap,
  Users,
  CheckCircle,
  BadgeCheck,
  FileText,
  ThumbsUp,
  Filter,
  Calendar,
  ArrowLeft,
  MoreHorizontal,
  Check,
  User,
  Phone,
  MessageSquare,
  ExternalLink,
  ArrowRight,
  Stethoscope,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SpecialistDiscovery = () => {
  const { theme } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docDetails, setDocDetails] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('About');

  // Review State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

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
      console.log(`[IDENTITY-SYNC] Initializing link for: ${docId}`);
      const { data } = await api.get(`/ai/doctor-profile/${docId}`);
      setDocDetails(data);
      setActiveTab('About');
    } catch (err) {
      console.error("Profile Fetch Error:", err);
      toast.error(err.response?.data?.message || "Failed to fetch specialist details");
    } finally {
      setFetchingDetails(false);
    }
  };

  useEffect(() => {
    if (query.trim().length >= 2) {
      fetchDoctors(query);
    } else {
      setDoctors([]);
    }
  }, [query]);

  const handleStartReviewerChat = (patientId) => {
    if (!patientId) return toast.error("Patient node identity missing");
    navigate('/patient/chat', { state: { startChat: true, targetUserId: patientId } });
  };

  const submitReview = async () => {
    if (!reviewData.comment.trim()) return toast.error("Please enter a technical comment.");
    setSubmittingReview(true);
    try {
      await api.post('/patients/review', {
        doctorId: selectedDoc,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      toast.success("Review synchronized with medical registry.");
      setShowReviewModal(false);
      setReviewData({ rating: 5, comment: '' });
      // Refresh details to show new review
      handleDocClick(selectedDoc);
    } catch (err) {
      toast.error("Failed to propagate review node.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderTabContent = () => {
    if (!docDetails || !docDetails.profile) return null;
    const { profile, reviews } = docDetails;

    switch (activeTab) {
      case 'About':
        return (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <h3 className="text-xl font-black text-white uppercase tracking-[0.5em]">About Specialist</h3>
            <p className="text-zinc-400 text-base leading-relaxed font-bold uppercase tracking-tight max-w-4xl border-l-4 border-blue-600 pl-8 py-2">
              {profile.professionalSummary || 'No professional summary provided.'}
            </p>
          </section>
        );
      case 'Experience':
        return (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 text-left">
            <h3 className="text-xl font-black text-white uppercase tracking-[0.5em]">Clinical History</h3>
            <div className="space-y-4">
              {profile.clinicalHistory && profile.clinicalHistory.length > 0 ? profile.clinicalHistory.map((exp, i) => (
                <div key={i} className="flex items-start gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0 shadow-[0_0_10px_#3b82f6]"></div>
                  <p className="text-zinc-300 font-bold uppercase text-xs tracking-wider">{exp}</p>
                </div>
              )) : <p className="text-zinc-500 uppercase text-xs font-black">No clinical history records found.</p>}
            </div>
          </section>
        );
      case 'Education':
        return (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 text-left">
            <h3 className="text-xl font-black text-white uppercase tracking-[0.5em]">Academic Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.qualifications && profile.qualifications.length > 0 ? profile.qualifications.map((qual, i) => (
                <div key={i} className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl">
                  <GraduationCap className="text-blue-500 shrink-0" size={24} />
                  <p className="text-zinc-300 font-bold uppercase text-xs tracking-wider">{qual}</p>
                </div>
              )) : <p className="text-zinc-500 uppercase text-xs font-black">No academic credentials found.</p>}
            </div>
          </section>
        );
      case 'Expertise':
        return (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 text-left">
            <h3 className="text-xl font-black text-white uppercase tracking-[0.5em]">Expertise Nodes</h3>
            <div className="flex flex-wrap gap-3">
              {profile.detailedExpertise && profile.detailedExpertise.length > 0 ? profile.detailedExpertise.map((exp, i) => (
                <span key={i} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-zinc-300 uppercase tracking-widest hover:border-blue-500/50 transition-all">
                  {exp}
                </span>
              )) : <p className="text-zinc-500 uppercase text-xs font-black">No technical expertise defined.</p>}
            </div>
          </section>
        );
      case 'Awards':
        return (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 text-left">
            <h3 className="text-xl font-black text-white uppercase tracking-[0.5em]">Professional Honors</h3>
            <div className="space-y-4">
              {profile.awards && profile.awards.length > 0 ? profile.awards.map((award, i) => (
                <div key={i} className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl">
                  <Award className="text-amber-500 shrink-0" size={24} />
                  <p className="text-zinc-300 font-bold uppercase text-xs tracking-wider">{award}</p>
                </div>
              )) : <p className="text-zinc-500 uppercase text-xs font-black">No awards or honors recorded.</p>}
            </div>
          </section>
        );
      case 'Reviews':
        return (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white uppercase tracking-[0.5em]">Clinical Feedbacks</h3>
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition-all"
              >
                 Add Feedback Node
              </button>
            </div>
            <div className="space-y-6">
              {reviews && reviews.length > 0 ? reviews.map((rev, i) => (
                <div
                  key={i}
                  onClick={() => handleStartReviewerChat(rev.patientId)}
                  className="p-6 bg-white/5 border border-white/5 rounded-[32px] space-y-4 cursor-pointer hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm uppercase shadow-lg shadow-blue-900/20">{rev.patientName?.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="text-xs font-black uppercase text-white">{rev.patientName}</p>
                           <MessageCircle size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110" />
                        </div>
                        <p className="text-[8px] font-bold text-zinc-600 uppercase mt-0.5 tracking-widest">{rev.reviewDate ? new Date(rev.reviewDate).toLocaleDateString() : '31/07/2026'} • Verified Node</p>
                      </div>
                    </div>
                    <div className="flex text-amber-500 gap-0.5 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                      {[...Array(5)].map((_, idx) => <Star key={idx} size={12} fill={idx < rev.rating ? "currentColor" : "none"} className={idx < rev.rating ? "" : "text-zinc-800"} />)}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-zinc-400 italic leading-relaxed">"{rev.reviewComment}"</p>
                  <div className="pt-2">
                     <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2">
                        Initialize Handshake with reviewer <ArrowRight size={12} />
                     </span>
                  </div>
                </div>
              )) : <p className="text-zinc-500 uppercase text-xs font-black">No reviews found in this node.</p>}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-[#F8FAFC] text-slate-800'} font-sans text-left`}>
      <Navbar />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!selectedDoc ? (
          /* DOCTOR DISCOVERY PAGE - PURE DIRECTORY MODE */
          <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-10 pb-40">
            <div className="max-w-[1400px] mx-auto">
              <header className="mb-8">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Neural Registry</p>
                <h1 className="text-4xl font-black uppercase tracking-tight mb-1">Specialist Search</h1>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Discover top specialists and explore their technical expertise</p>
              </header>

              {/* Discovery Search Bar */}
              <div className="mb-10 max-w-2xl">
                <div className={`relative flex items-center p-1 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-[#0A0A0C] border-white/10 focus-within:border-blue-500/50 shadow-lg' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <SearchIcon className="absolute left-6 text-blue-500" size={20} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="cardiologist bangalore"
                    className="w-full pl-14 pr-12 py-4 bg-transparent outline-none font-bold text-base tracking-widest uppercase placeholder:text-zinc-800"
                  />
                  {isSearching && <Loader2 className="absolute right-6 animate-spin text-blue-500" size={20} />}
                </div>
              </div>

              {/* Specialist Discovery Rows */}
              <div className="space-y-4">
                {doctors.length > 0 ? doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-6 rounded-[32px] border border-white/5 bg-[#0A0A0C] transition-all duration-500 hover:bg-blue-600/5 hover:border-blue-500/40 flex flex-col lg:flex-row items-center gap-8 group relative shadow-2xl`}
                  >
                    {/* Left: Photo Hub */}
                    <div className="shrink-0">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] overflow-hidden border border-white/10 relative shadow-xl group-hover:scale-105 transition-transform duration-500">
                         <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-4xl font-black uppercase">
                           {doc.name.charAt(0)}
                         </div>
                      </div>
                    </div>

                    {/* Middle: Professional Columns */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center h-full">

                      <div className="text-left space-y-1.5">
                        <div className="flex items-center gap-2 mb-1">
                           <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[7px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-1">
                              <CheckCircle size={8} /> Verified
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors leading-none">{doc.name}</h3>
                           <BadgeCheck size={18} className="text-blue-500 shrink-0" />
                        </div>
                        <p className="text-blue-500 text-[11px] font-black uppercase tracking-[0.2em]">{doc.specialization}</p>
                        <div className="space-y-0.5 opacity-60">
                           <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest">{Array.isArray(doc.qualifications) ? doc.qualifications.join(', ') : 'MBBS, MS, MCh'}</p>
                           <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">{doc.exp} Years Practice Tenure</p>
                        </div>
                      </div>

                      <div className="text-left space-y-3 lg:border-l lg:border-white/5 lg:pl-6">
                         <div className="flex items-start gap-3">
                            <Building size={16} className="text-blue-500 shrink-0 mt-0.5" />
                            <div>
                               <p className="text-[11px] font-black uppercase tracking-widest text-zinc-300 leading-tight">{doc.hospital}</p>
                               <p className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5">{doc.city || 'Bangalore'} Hub</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <Stethoscope size={16} className="text-blue-500 shrink-0" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cardiology Department</p>
                         </div>
                      </div>

                      <div className="text-left space-y-4 lg:border-l lg:border-white/5 lg:pl-6">
                         <div className="flex items-center gap-3">
                            <Star size={18} className="text-amber-500" fill="currentColor" />
                            <div>
                               <p className="text-lg font-black text-white leading-none">{doc.rating}</p>
                               <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">({doc.reviewCount || 0} Reviews)</p>
                            </div>
                         </div>
                         <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Languages: English, Hindi</p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center justify-end w-full lg:w-auto">
                      <button
                        onClick={() => handleDocClick(doc.id)}
                        className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-blue-600 hover:border-blue-500 flex items-center justify-center gap-3 group/btn shadow-xl active:scale-95 whitespace-nowrap"
                      >
                        View Full Profile <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )) : query.length >= 2 ? (
                  <div className="py-20 text-center opacity-30 uppercase font-black tracking-widest text-sm">No Node Mapping Found</div>
                ) : (
                  <div className="py-24 text-center space-y-6 animate-in fade-in zoom-in-95 duration-1000">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-blue-600/10 blur-[80px] animate-pulse rounded-full"></div>
                      <Stethoscope size={80} className="relative z-10 text-zinc-800 mx-auto" strokeWidth={1} />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[1em] text-zinc-600">Enter Identity Node to Start</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        ) : (
          /* SPECIALIST PROFILE PAGE - BALANCED CLINICAL VIEW */
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505] animate-in slide-in-from-right duration-500 pb-40">
             {fetchingDetails ? (
                <div className="h-full flex flex-col items-center justify-center p-20 gap-8">
                   <Loader2 className="animate-spin text-blue-500" size={60} strokeWidth={1.5} />
                   <p className="text-[12px] font-black uppercase tracking-[0.8em] text-zinc-500">Establishing Clinical Stream...</p>
                </div>
             ) : docDetails ? (
                <div className="max-w-[1400px] mx-auto p-6 lg:p-12">
                   <button onClick={() => setSelectedDoc(null)} className="flex items-center gap-3 text-zinc-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest mb-12 group">
                      <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Search
                   </button>

                   {/* Header Identity */}
                   <div className="bg-[#0A0A0C] border border-white/5 rounded-[48px] p-8 lg:p-12 mb-12 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] -mr-64 -mt-64"></div>
                      <div className="flex flex-col lg:flex-row gap-12 items-start relative z-10">
                        <div className="w-48 h-48 rounded-[36px] bg-blue-600 shrink-0 overflow-hidden shadow-2xl border-2 border-white/10 relative">
                           <div className="w-full h-full flex items-center justify-center text-white text-7xl font-black uppercase">{docDetails.user?.name.charAt(0)}</div>
                        </div>
                        <div className="flex-1 text-left space-y-6 py-2">
                           <div className="space-y-4">
                              <div className="flex flex-wrap items-center gap-4">
                                 <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none">{docDetails.user?.name}</h2>
                                 <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-[9px] font-black uppercase tracking-[0.2em]"><BadgeCheck size={14} /> Verified Doctor</div>
                              </div>
                              <p className="text-blue-500 text-lg font-black uppercase tracking-[0.4em]">{docDetails.profile?.designation}</p>
                              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest opacity-80">{Array.isArray(docDetails.profile?.qualifications) ? docDetails.profile.qualifications.join(', ') : 'MBBS, MS, MCh'} • {docDetails.profile?.experience} Years Practice</p>
                           </div>

                           <div className="flex flex-col sm:flex-row gap-8 border-t border-white/5 pt-8 mt-4">
                              <div className="flex items-center gap-3 text-zinc-300">
                                 <Building size={20} className="text-blue-500 shrink-0" />
                                 <p className="text-xs font-black uppercase tracking-widest">{docDetails.profile?.hospitalName || 'Medanta Hospital, Bangalore'}</p>
                              </div>
                              <div className="flex items-center gap-3 text-zinc-300">
                                 <MapPin size={20} className="text-blue-500 shrink-0" />
                                 <p className="text-xs font-black uppercase tracking-widest">{docDetails.profile?.city || 'Bangalore'} Hub</p>
                              </div>
                           </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-[40px] p-8 text-center min-w-[260px] backdrop-blur-xl">
                           <div className="flex items-center justify-center gap-4 text-amber-500 mb-4"><Star size={36} fill="currentColor" /><span className="text-6xl font-black text-white">{docDetails.profile?.rating || '4.5'}</span></div>
                           <p className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.5em] mb-2">Consensus</p>
                           <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-8">({docDetails.profile?.reviewCount || 0} REVIEWS)</p>
                           <div className="space-y-3">
                              {(docDetails.profile?.ratingDistribution || [88, 8, 2, 1, 1]).map((w, i) => (
                                 <div key={i} className="flex items-center gap-4 px-1">
                                    <span className="text-[10px] font-black text-zinc-600 w-6">{5-i}★</span>
                                    <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${w}%` }}></div></div>
                                    <span className="text-[9px] font-black text-zinc-600 min-w-[30px]">{w}%</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                      </div>
                   </div>

                   {/* Stats Dashboard */}
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
                      {[
                        { icon: Calendar, label: 'Tenure', val: (docDetails.profile?.experience || 5) + ' Years' },
                        { icon: Users, label: 'Treated', val: (docDetails.profile?.patientsTreatedCount || 0).toLocaleString() + '+' },
                        { icon: Activity, label: 'Operations', val: (docDetails.profile?.operationsCount || 0).toLocaleString() + '+' },
                        { icon: BadgeCheck, label: 'Success', val: docDetails.profile?.surgicalStats?.successRate || '98.1%' },
                        { icon: Clock, label: 'Latency', val: '< 10m' },
                        { icon: ThumbsUp, label: 'Repeat', val: (docDetails.profile?.recommendationPercentage || 85) + '%' }
                      ].map((stat, idx) => (
                        <div key={idx} className="p-5 bg-[#0A0A0C] border border-white/5 rounded-[32px] text-center space-y-2 group hover:border-blue-500/30 transition-all cursor-default">
                          <stat.icon size={20} className="mx-auto text-blue-500/50 group-hover:text-blue-500 transition-colors" />
                          <p className="text-[14px] font-black text-white leading-none">{stat.val}</p>
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">{stat.label}</p>
                        </div>
                      ))}
                   </div>

                   {/* Tabs & Content */}
                   <div className="border-b border-white/5 flex items-center gap-10 overflow-x-auto scrollbar-hide pb-0.5 sticky top-0 bg-[#050505] z-40 mb-12 pt-4">
                      {['About', 'Experience', 'Education', 'Expertise', 'Awards', 'Reviews'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => {
                            console.log(`[TAB-SYNC] Switching to: ${tab}`);
                            setActiveTab(tab);
                          }}
                          className={`pb-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative whitespace-nowrap hover:text-white px-2 ${activeTab === tab ? 'text-blue-500' : 'text-zinc-600'}`}
                        >
                           {tab}
                           {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full shadow-[0_0_20px_#3b82f6]"></div>}
                        </button>
                      ))}
                   </div>

                   <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
                      <div className="xl:col-span-8 space-y-16 text-left">
                         {renderTabContent()}
                      </div>

                      {/* Right Sidebar Widget */}
                      <div className="xl:col-span-4 space-y-10 text-left">
                         <div className="p-10 bg-white/5 border border-white/5 rounded-[48px] space-y-8 shadow-3xl">
                            <div className="space-y-6">
                               <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em]">Verification Protocol</p>
                               <div className="space-y-4">
                                  {['License Confirmed', 'Institutional Node Sync', 'Technical Precision Match'].map(v => (
                                     <div key={v} className="flex items-center gap-4">
                                        <Check size={18} className="text-emerald-500" strokeWidth={4} />
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">{v}</p>
                                     </div>
                                  ))}
                               </div>
                            </div>

                            <div className="pt-8 border-t border-white/5 space-y-6">
                               <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em]">Contact Protocol</p>
                               <div className="grid grid-cols-3 gap-3">
                                  {[
                                     { i: MapPin, l: 'In-Person' },
                                     { i: Video, l: 'Video' },
                                     { i: MessageSquare, l: 'Chat' }
                                  ].map(m => (
                                     <div key={m.l} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <m.i size={18} className="text-zinc-500" />
                                        <p className="text-[7px] font-black text-zinc-600 uppercase text-center leading-tight">{m.l}</p>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             ) : null}

             {/* BOOKING BAR */}
             {docDetails && (
                <div className="fixed bottom-0 left-0 right-0 z-[2200] p-8 lg:p-10 bg-[#0A0A0C]/98 backdrop-blur-3xl border-t border-white/10 animate-in slide-in-from-bottom-full duration-700">
                  <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 px-6">
                    <div className="text-left space-y-2 flex-1">
                       <h4 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-none">Initialize Handshake?</h4>
                       <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Provision clinical node sync with {docDetails.user?.name}.</p>
                    </div>
                    <div className="flex items-center gap-10">
                       <div className="text-right hidden xl:block">
                          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Protocol Fee</p>
                          <p className="text-4xl font-black text-white tracking-tighter">₹{docDetails.profile?.consultationFee || 2500}</p>
                       </div>
                       <button onClick={() => navigate('/patient/book-op', { state: { doctor: { ...docDetails.profile, name: docDetails.user.name, id: selectedDoc } } })} className="px-12 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center gap-4 group active:scale-95">
                          <Calendar size={24} /> Book Appointment
                       </button>
                    </div>
                  </div>
                </div>
             )}
          </main>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>

      {/* DOCTOR REVIEW MODAL NODE */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className={`w-full max-w-lg rounded-[48px] border shadow-2xl overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
              <div className={`p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                 <div className="text-left">
                    <h2 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Clinical Review</h2>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Feedback Synchronization Protocol</p>
                 </div>
                 <button onClick={() => setShowReviewModal(false)} className={`p-3 rounded-xl transition-all border ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white' : 'bg-white border-slate-100 text-slate-400'}`}><X size={20}/></button>
              </div>

              <div className="p-10 space-y-8 text-center">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rate the quality of clinical sync with {docDetails?.user?.name}</p>
                    <div className="flex justify-center gap-3">
                       {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewData({ ...reviewData, rating: star })}
                            className={`p-2 transition-all transform active:scale-90 ${reviewData.rating >= star ? 'text-amber-500 scale-110' : 'text-zinc-700 opacity-30 hover:opacity-100'}`}
                          >
                             <Star size={32} fill={reviewData.rating >= star ? "currentColor" : "none"} strokeWidth={3} />
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Technical Feedback / Comments</label>
                    <textarea
                      className={`w-full p-6 rounded-[32px] border outline-none text-sm font-bold min-h-[140px] transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500/50' : 'bg-slate-50 border-slate-200'}`}
                      placeholder="Enter your assessment of the consultation quality..."
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    ></textarea>
                 </div>

                 <button
                   onClick={submitReview}
                   disabled={submittingReview}
                   className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                 >
                    {submittingReview ? <Loader2 size={18} className="animate-spin" /> : <ThumbsUp size={18} />}
                    Establish Review Record
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SpecialistDiscovery;
