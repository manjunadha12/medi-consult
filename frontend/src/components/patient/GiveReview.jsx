import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import {
  Star, MessageSquare, User, Clock, ChevronRight,
  Search, Loader2, Sparkles, TrendingUp, X, CheckCircle, Shield, AlertTriangle, ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const GiveReview = () => {
  const { theme, user } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');

  // Review Form State
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchConsultedDoctors();
  }, []);

  const fetchConsultedDoctors = async () => {
    setLoading(true);
    try {
      // Fetching patient history to get doctors they've consulted with
      const { data } = await api.get('/appointments/patient-summary');
      const appointments = data.appointments || [];

      // Extract unique doctors
      const uniqueDocs = [];
      const docIds = new Set();

      appointments.forEach(appt => {
        if (!docIds.has(appt.doctorId) && appt.status === 'Completed') {
          docIds.add(appt.doctorId);
          uniqueDocs.push({
            id: appt.doctorId,
            name: appt.doctorName,
            specialization: appt.specialization,
            lastVisit: appt.date,
            appointmentId: appt._id
          });
        }
      });

      setDoctors(uniqueDocs);
    } catch (err) {
      console.error("[FETCH_DOCS_ERR]", err);
      toast.error("Failed to sync clinical history.");
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!reviewData.comment.trim()) return toast.error("Please enter a clinical feedback comment.");
    setSubmitting(true);
    try {
      await api.post('/patients/review', {
        doctorId: selectedDoc.id,
        appointmentId: selectedDoc.appointmentId,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      toast.success("Review synchronized with medical registry.");
      setSelectedDoc(null);
      setReviewData({ rating: 5, comment: '' });
    } catch (err) {
      toast.error("Failed to propagate review node.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left neural-grid pb-24 ${
      theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-600'
    }`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-4 sm:p-8 lg:p-12">
          <div className="max-w-5xl mx-auto space-y-10">

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="text-left">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2">Feedback Hub</p>
                <h1 className={`text-3xl lg:text-5xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Review Specialists</h1>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-1">Submit technical clinical feedback for your consultations</p>
              </div>

              <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 focus-within:border-blue-500/50' : 'bg-white border-slate-200 focus-within:border-blue-500/30 shadow-sm'}`}>
                <Search size={18} className="text-zinc-500" />
                <input
                  type="text"
                  placeholder="SEARCH SPECIALISTS..."
                  className="bg-transparent border-none outline-none text-[10px] font-black w-40 sm:w-60 uppercase tracking-widest"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </header>

            {loading ? (
              <div className="py-24 text-center">
                <Loader2 className="animate-spin mx-auto text-blue-500 mb-4" size={40} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Synchronizing Clinical Contacts...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {filteredDoctors.length > 0 ? filteredDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-6 sm:p-8 rounded-[40px] border transition-all duration-500 group cursor-pointer hover:scale-[1.02] relative overflow-hidden ${
                      theme === 'dark' ? 'bg-zinc-950 border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5' : 'bg-white border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-200'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/10 transition-all"></div>

                    <div className="flex items-center gap-6 relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-900/20 uppercase shrink-0">
                        {doc.name.charAt(0)}
                      </div>
                      <div className="text-left flex-1 overflow-hidden">
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">{doc.specialization}</p>
                        <h3 className={`text-xl font-black uppercase tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{doc.name}</h3>
                        <div className="flex items-center gap-3 mt-3">
                           <Clock size={12} className="text-zinc-600" />
                           <p className="text-[9px] font-bold text-zinc-500 uppercase">Last Sync: {new Date(doc.lastVisit).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-zinc-700 group-hover:text-blue-500 transition-all" />
                    </div>
                  </div>
                )) : (
                  <div className="md:col-span-2 py-20 text-center space-y-6 opacity-30">
                    <User size={64} className="mx-auto" />
                    <p className="font-black uppercase tracking-[0.4em] text-xs">No Recent Specialist Nodes Found</p>
                    <button onClick={() => navigate('/patient/doctor-search')} className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:underline">Explore Registry</button>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* REVIEW FORM OVERLAY */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className={`w-full max-w-lg rounded-[48px] border shadow-2xl overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
              <div className={`p-8 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                 <div className="text-left">
                    <h2 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Clinical Feedback</h2>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">Specialist: {selectedDoc.name}</p>
                 </div>
                 <button onClick={() => setSelectedDoc(null)} className={`p-3 rounded-xl transition-all border ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white' : 'bg-white border-slate-100 text-slate-400'}`}><X size={20}/></button>
              </div>

              <div className="p-10 space-y-8 text-center">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Rate the quality of clinical interaction</p>
                    <div className="flex justify-center gap-3">
                       {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewData({ ...reviewData, rating: star })}
                            className={`p-2 transition-all transform active:scale-90 ${reviewData.rating >= star ? 'text-amber-500 scale-110' : 'text-zinc-700 opacity-30 hover:opacity-100'}`}
                          >
                             <Star size={36} fill={reviewData.rating >= star ? "currentColor" : "none"} strokeWidth={3} />
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Technical Assessment / Observations</label>
                    <textarea
                      className={`w-full p-6 rounded-[32px] border outline-none text-sm font-bold min-h-[140px] transition-all ${theme === 'dark' ? 'bg-zinc-900 border-white/5 text-white focus:border-blue-500/50' : 'bg-slate-50 border-slate-200'}`}
                      placeholder="Enter your clinical feedback here..."
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    ></textarea>
                 </div>

                 <button
                   onClick={submitReview}
                   disabled={submitting}
                   className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                 >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
                    Sync Feedback Record
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GiveReview;
