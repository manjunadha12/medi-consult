import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import {
  FileUp, FileText, X, CheckCircle, Loader2, BrainCircuit,
  Trash2, ExternalLink, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api, { BACKEND_URL } from '../../utils/api';
import useStore from '../../store/useStore';

const UploadReport = () => {
  const { user, theme } = useStore();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const fetchReports = async () => {
    if (!user?.userId) {
      setLoadingReports(false);
      return;
    }

    setLoadingReports(true);
    try {
      const { data } = await api.get(`/reports/patient/${user.userId}`);
      if (Array.isArray(data)) {
        setReports(data);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('[SYNC] Error fetching reports:', error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Archive sync failed. Is the backend running?");
      }
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (user?.userId) {
      fetchReports();
    }
  }, [user?.userId]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file");

    setUploading(true);
    const formData = new FormData();
    formData.append('report', file);
    formData.append('patientId', user?.userId);
    formData.append('category', 'General');

    try {
      await api.post('/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Report uploaded successfully!");
      setFile(null);
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload report");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this record from neural archive?")) return;

    try {
      await api.delete(`/reports/${id}`);
      toast.success("Record deleted");
      fetchReports();
    } catch (error) {
      toast.error("Failed to delete record");
    }
  };

  const handleAnalyzeRedirect = (reportId) => {
    navigate('/patient/ai-analysis', { state: { reportId } });
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-300' : 'bg-[#F8FAFC] text-slate-600'} text-left`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="p-8 lg:p-10 pb-32 overflow-y-auto custom-scrollbar">
          <header className="mb-10 text-left">
            <h1 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Medical Archive</h1>
            <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mt-1">Secure Health Record Synchronization</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <div className={`p-8 rounded-[40px] border-2 border-dashed flex flex-col items-center text-center transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100 shadow-xl'}`}>
                <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mb-6 border shadow-inner ${theme === 'dark' ? 'bg-blue-600/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                  <FileUp size={32} />
                </div>
                <h3 className={`text-xl font-black uppercase tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Synchronize Archive</h3>
                <p className="text-slate-500 text-xs mb-10 font-bold uppercase tracking-widest">PDF, JPG, PNG Node Upload</p>

                <input type="file" id="file-input" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />

                {file ? (
                  <div className={`w-full p-4 rounded-3xl flex items-center justify-between mb-6 border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-widest truncate">{file.name}</span>
                    </div>
                    <button onClick={() => setFile(null)} className="p-2 hover:bg-red-500/10 rounded-xl transition-all"><X className="w-4 h-4 text-red-500" /></button>
                  </div>
                ) : (
                  <label htmlFor="file-input" className="w-full py-5 border-2 border-blue-600/50 text-blue-600 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer hover:bg-blue-600 hover:text-white transition-all mb-6">
                    Initialize File Node
                  </label>
                )}

                <button onClick={handleUpload} disabled={!file || uploading} className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 disabled:opacity-30 transition-all flex items-center justify-center gap-3">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Synchronizing...</> : <><Sparkles size={16}/> Push to Neural Cloud</>}
                </button>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className={`rounded-[56px] border shadow-2xl overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                <div className={`p-8 border-b flex justify-between items-center ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-50 bg-slate-50/50'}`}>
                  <h3 className={`font-black uppercase tracking-[0.2em] text-xs ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Archive Timeline</h3>
                  <button onClick={fetchReports} className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 hover:text-blue-400 transition-all flex items-center gap-2">
                    <Loader2 className={`w-3.5 h-3.5 ${loadingReports ? 'animate-spin' : ''}`} /> Refresh Node
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {loadingReports ? (
                    <div className="py-20 text-center flex flex-col items-center">
                       <Loader2 className="w-10 h-10 animate-spin text-blue-600/20 mb-4" />
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scanning Archive Nodes...</p>
                    </div>
                  ) : reports?.length === 0 ? (
                    <div className="py-20 text-center">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">No neural records found in cluster.</p>
                    </div>
                  ) : (
                    reports.map((report) => (
                      <div key={report._id} className={`p-6 rounded-[32px] border flex items-center justify-between transition-all group ${theme === 'dark' ? 'bg-zinc-900/50 border-white/5 hover:border-blue-500/30' : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm'}`}>
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5 text-zinc-600 group-hover:text-blue-500' : 'bg-slate-50 border-slate-50 text-slate-400 group-hover:text-blue-600'}`}>
                            <FileText size={28} />
                          </div>
                          <div className="text-left min-w-0">
                            <p className={`text-sm font-black uppercase tracking-tight truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{report.fileName}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate">{new Date(report.createdAt).toLocaleDateString()} • {report.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleAnalyzeRedirect(report._id)} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95">Analyze</button>
                          <a href={`${BACKEND_URL}${report.fileUrl}`} target="_blank" rel="noopener noreferrer" className={`p-3 rounded-xl transition-all ${theme === 'dark' ? 'bg-white/5 text-zinc-500 hover:text-blue-400' : 'bg-slate-50 text-slate-400 hover:text-blue-600'}`}>
                            <ExternalLink size={18} />
                          </a>
                          <button onClick={() => handleDelete(report._id)} className={`p-3 rounded-xl transition-all ${theme === 'dark' ? 'bg-white/5 text-zinc-700 hover:text-red-500' : 'bg-slate-50 text-slate-300 hover:text-red-500'}`}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UploadReport;
