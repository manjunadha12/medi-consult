import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import RadiographViewer from './RadiographViewer';
import {
  Search, AlertTriangle, CheckCircle, Info,
  FileText, ChevronRight, Loader2,
  Activity, Zap, Brain, Shield, User as UserIcon,
  Heart, TrendingUp, TrendingDown, Minus, Eye,
  Edit3, Printer, ArrowLeft, RefreshCw, Layers,
  Check, AlertCircle, Calendar, Sparkles, Stethoscope,
  ChevronDown, X, Trash2, BookOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AIAnalysis = () => {
  const store = useStore();
  const { user, theme, reportEngineMode, setReportEngineMode } = store;
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [result, setResult] = useState(null);
  const [fetchingReports, setFetchingReports] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceHighlight, setSourceHighlight] = useState(null);

  // Evidence modal state
  const [activeEvidence, setActiveEvidence] = useState(null);

  // Value verification modal state
  const [verifyingItem, setVerifyingItem] = useState(null);
  const [verifiedValue, setVerifiedValue] = useState('');
  const [savingVerification, setSavingVerification] = useState(false);

  useEffect(() => {
    if (user?.userId) fetchReports();
  }, [user?.userId]);

  const fetchReports = async () => {
    setFetchingReports(true);
    try {
      const { data } = await api.get(`/reports/patient/${user.userId}`);
      const list = Array.isArray(data) ? data : [];
      setReports(list);

      if (location.state?.reportId && list.length > 0) {
        const r = list.find(x => x._id === location.state.reportId);
        if (r) handleAnalyze(r);
      }
    } catch (error) {
      toast.error("Archive synchronization failed");
    } finally {
      setFetchingReports(false);
    }
  };

  const handleDeleteReport = async (reportId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Delete this report from your medical archive?")) return;

    try {
      await api.delete(`/reports/${reportId}`);
      toast.success("Report deleted from archive");
      if (selectedReport?._id === reportId) {
        setSelectedReport(null);
        setResult(null);
      }
      fetchReports();
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  const handleAnalyze = async (report, forcedEngineMode) => {
    const activeMode = forcedEngineMode || reportEngineMode || 'local';
    setSelectedReport(report);
    setLoading(true);
    setResult(null);

    try {
      if (activeMode === 'local') {
        const { data } = await api.post('/reports/process-local', { reportId: report._id });
        data._executedEngine = 'local';
        setResult(data);
        toast.success("⚡ Local Base Engine: Analysis complete");
      } else {
        const { data } = await api.post('/ai/analyze-report', { reportId: report._id });
        data._executedEngine = 'ai';
        setResult(data);
        toast.success("🤖 Neural AI Cloud Engine: Analysis complete");
      }
    } catch (error) {
      console.warn(`Engine ${activeMode} error, attempting fallback:`, error);
      try {
        const fallbackEndpoint = activeMode === 'local' ? '/ai/analyze-report' : '/reports/process-local';
        const { data } = await api.post(fallbackEndpoint, { reportId: report._id });
        data._executedEngine = activeMode === 'local' ? 'ai' : 'local';
        setResult(data);
        toast.success("Analysis completed via backup engine node");
      } catch (err) {
        console.error("Analysis failure:", err);
        const errMsg = err?.response?.data?.message || error?.response?.data?.message || "Error processing document with selected engine";
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit manual value verification
  const handleSaveVerification = async (e) => {
    e.preventDefault();
    if (!verifyingItem || !selectedReport) return;

    setSavingVerification(true);
    try {
      const currentOverrides = selectedReport.manualOverrides || [];
      const updatedOverrides = [
        ...currentOverrides.filter(o => o.testId !== verifyingItem.testId),
        {
          testId: verifyingItem.testId,
          code: verifyingItem.code,
          name: verifyingItem.testName || verifyingItem.test,
          value: parseFloat(verifiedValue),
          unit: verifyingItem.unit
        }
      ];

      const { data } = await api.post('/reports/verify-values', {
        reportId: selectedReport._id,
        overrides: updatedOverrides
      });

      setResult(data);
      setVerifyingItem(null);
      toast.success("Value verified & rules recalculated!");
    } catch (err) {
      toast.error("Failed to save verification");
    } finally {
      setSavingVerification(false);
    }
  };

  const getSeverityBadge = (status, severity) => {
    const s = (status || '').toUpperCase();
    if (s.includes('CRITICAL')) {
      return 'bg-red-500/15 text-red-500 border-red-500/30';
    }
    if (s.includes('HIGH') || s.includes('ABNORMAL') || s.includes('DISRUPTED') || s.includes('ALERT') || severity === 'abnormal' || severity === 'critical') {
      return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    }
    if (s.includes('LOW') || s.includes('BORDERLINE')) {
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  };

  const getStatusIcon = (status, severity) => {
    const s = (status || '').toUpperCase();
    if (s.includes('HIGH') || s.includes('CRITICAL') || s.includes('ABNORMAL') || s.includes('DISRUPTED') || s.includes('ALERT') || severity === 'abnormal' || severity === 'critical') return '🔴';
    if (s.includes('LOW') || s.includes('BORDERLINE')) return '🟠';
    return '🟢';
  };

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-slate-300' : 'bg-[#F8FAFC] text-slate-700'} text-left`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 pb-32">

          {/* PAGE HEADER */}
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className={`text-3xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Medical Report Scanner
                </h1>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  (store.reportEngineMode || 'local') === 'local'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                }`}>
                  {(store.reportEngineMode || 'local') === 'local' ? '⚡ Local Base Engine' : '🤖 Neural AI Cloud'}
                </span>
              </div>
              <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mt-1">
                {(store.reportEngineMode || 'local') === 'local'
                  ? 'Deterministic Medical Document Processing • 100% Private & Local Base'
                  : 'Cloud LLM Multi-Agent Swarm • Deep Narrative Reasoning & Context'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {result && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setResult(null)}
                    className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                      theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <ArrowLeft size={14} /> Switch
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
                  >
                    <Printer size={14} /> Print
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* REPORT SELECTOR VIEW */}
          {!result ? (
            <div className={`p-8 rounded-[48px] border shadow-2xl transition-all duration-500 ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity className="text-blue-500" size={18} /> Select Uploaded Document to Process
                </h2>
                <button
                  onClick={() => navigate('/patient/reports/upload')}
                  className="text-xs font-black text-blue-500 hover:underline uppercase tracking-wider flex items-center gap-1"
                >
                  + Upload New PDF/Image
                </button>
              </div>

              {fetchingReports ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Archive...</p>
                </div>
              ) : reports?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reports.map((r) => (
                    <div
                      key={r._id}
                      onClick={() => handleAnalyze(r)}
                      className={`p-6 rounded-[32px] border transition-all cursor-pointer group flex items-center justify-between ${
                        theme === 'dark'
                          ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-blue-500/30'
                          : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-lg hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-4 text-left min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                          <FileText size={22} />
                        </div>
                        <div className="truncate">
                          <p className={`text-sm font-black uppercase tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                            {r.fileName}
                          </p>
                          <p className="text-[10px] text-zinc-500 uppercase font-bold mt-1">
                            {new Date(r.createdAt).toLocaleDateString()} • {r.category || 'General'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:scale-105 transition-transform">
                          Analyze
                        </span>
                        <button
                          onClick={(e) => handleDeleteReport(r._id, e)}
                          title="Delete Report"
                          className={`p-2 rounded-xl transition-all ${
                            theme === 'dark'
                              ? 'bg-white/5 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10'
                              : 'bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <FileText className="mx-auto text-zinc-600" size={48} />
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500">No medical documents in archive</p>
                  <button
                    onClick={() => navigate('/patient/reports/upload')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest"
                  >
                    Upload First Document
                  </button>
                </div>
              )}
            </div>
          ) : (result.isNonMedicalImage || ((!result.structuredResults || result.structuredResults.length === 0) && (!result.diagnosticFindings || result.diagnosticFindings.length === 0) && (!result.documentBadges || result.documentBadges.length === 0))) ? (
            /* UNCLEAR IMAGE / NON-READABLE DOCUMENT NOTIFICATION CARD */
            <div className={`p-8 md:p-10 rounded-[48px] border shadow-2xl transition-all duration-500 text-center space-y-6 max-w-2xl mx-auto ${
              theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-100'
            }`}>
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/5">
                <AlertTriangle size={36} />
              </div>
              <div>
                <h3 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  {selectedReport?.fileName?.match(/\.(jpe?g|png|webp)$/i)
                    ? "Non-Medical Image / Unclear Scan Detected"
                    : "Non-Medical Document Detected"}
                </h3>
                <p className="text-xs font-bold text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                  The uploaded file (<span className="text-blue-400 font-mono font-bold">{selectedReport?.fileName}</span>) {selectedReport?.fileName?.match(/\.(jpe?g|png|webp)$/i)
                    ? "appears to be a photo or unreadable image rather than a medical document with clinical values."
                    : "is not a medical laboratory report, diagnostic scan, or prescription document."}
                </p>
              </div>

              {/* What the scanner can process */}
              <div className="p-6 rounded-3xl bg-white/5 border border-white/5 text-left text-xs space-y-3 text-zinc-300">
                <p className="font-black text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  📋 What Can The Scanner Process?
                </p>
                <ul className="space-y-2 text-zinc-400 font-medium text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                    <span><strong>Laboratory Tests:</strong> Blood & Urine panels (CBC, Lipid, LFT, KFT/RFT, Thyroid, Blood Sugar, Urinalysis).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                    <span><strong>Diagnostic Reports:</strong> ECG, 2D Echocardiograms, CT / MRI Brain & Spine, Ultrasound (USG), Tympanometry.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                    <span><strong>Direct Radiographs:</strong> X-Ray Films (Knee, Hand, Chest) for interactive computer vision fracture localization.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 shrink-0 mt-0.5">•</span>
                    <span><strong>Clinical Notes:</strong> Doctor Prescriptions (Rx), Hospital Discharge Summaries, Consultation Notes.</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <button
                  onClick={() => setResult(null)}
                  className="px-8 py-4 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10 transition-all"
                >
                  Choose Another File
                </button>
                <button
                  onClick={() => navigate('/patient/reports/upload')}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all hover:scale-105"
                >
                  Upload Clearer Image / PDF
                </button>
              </div>
            </div>
          ) : (
            /* STRUCTURED REPORT ANALYSIS VIEW */
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">

              {/* 1. EXECUTIVE REPORT BANNER */}
              <div className={`p-8 md:p-10 rounded-[48px] border shadow-2xl relative overflow-hidden transition-all duration-500 ${
                theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'
              }`}>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-8 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className={`text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        Medical Report Analysis
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        result._executedEngine === 'ai'
                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>
                        {result._executedEngine === 'ai' ? '🤖 Neural AI Cloud' : '⚡ Local Base Engine'}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                      File: {selectedReport?.fileName}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-left">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Patient</p>
                      <p className="text-xs font-black text-zinc-200 uppercase">{result.demographics?.patientName || result.name || 'Self'}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-left">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Age / Sex</p>
                      <p className="text-xs font-black text-zinc-200 uppercase">
                        {result.demographics?.age || result.age || 'N/A'} {result.demographics?.sex ? `• ${result.demographics.sex}` : ''}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 text-left">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Report Date</p>
                      <p className="text-xs font-black text-zinc-200 uppercase">
                        {result.demographics?.reportDate || result.reportDate || new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DETECTED DOCUMENTS CHECKLIST */}
                {result.documentBadges && result.documentBadges.length > 0 && (
                  <div className="pt-6">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <Layers size={14} className="text-blue-500" /> Detected Documents & Diagnostic Panels in Scanned File:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.documentBadges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm"
                        >
                          <span>{badge.icon || '✓'}</span> {badge.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 1.5 EXECUTIVE SUMMARY & NEURAL AI CLINICAL SYNTHESIS */}
              {result.summary && (
                <div className={`p-8 rounded-[40px] border shadow-xl text-left space-y-4 ${
                  result._executedEngine === 'ai'
                    ? 'bg-purple-950/15 border-purple-500/25 shadow-purple-500/5'
                    : 'bg-blue-950/15 border-blue-500/25 shadow-blue-500/5'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 ${
                      result._executedEngine === 'ai' ? 'text-purple-400' : 'text-blue-400'
                    }`}>
                      {result._executedEngine === 'ai' ? (
                        <>
                          <Sparkles size={16} /> Neural AI Clinical Synthesis (Google Gemini)
                        </>
                      ) : (
                        <>
                          <Zap size={16} /> Local Base Engine Clinical Summary
                        </>
                      )}
                    </h3>
                    {result.suggestedSpecialist && (
                      <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-zinc-300 uppercase tracking-wider">
                        Recommended: {result.suggestedSpecialist}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-zinc-200 leading-relaxed whitespace-pre-line">
                    {result.summary}
                  </p>

                  {/* AI Key Risks & Recommendations if available */}
                  {result.aiKeyRisks && result.aiKeyRisks.length > 0 && (
                    <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                          ⚠️ Key Clinical Risks
                        </span>
                        <ul className="space-y-1 text-xs text-zinc-300 font-medium">
                          {result.aiKeyRisks.map((risk, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-1.5">
                              <span className="text-rose-400 shrink-0">•</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {result.aiRecommendations && result.aiRecommendations.length > 0 && (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                            💡 Specialist Recommendations
                          </span>
                          <ul className="space-y-1 text-xs text-zinc-300 font-medium">
                            {result.aiRecommendations.map((rec, rcIdx) => (
                              <li key={rec} className="flex items-start gap-1.5">
                                <span className="text-emerald-400 shrink-0">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 1.7 AUTHORITATIVE MEDICAL TEXTBOOK REFERENCES */}
              {((result.textbookCitations || result.citations) && (result.textbookCitations || result.citations).length > 0) && (
                <div className={`p-8 rounded-[40px] border shadow-xl text-left space-y-6 ${
                  theme === 'dark' ? 'bg-[#0A0A0C] border-blue-500/20' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                          Authoritative Medical Textbook References
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                          Evidence grounded in 23 Institutional Medical Textbooks (backend/books)
                        </p>
                      </div>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle size={12} /> {(result.textbookCitations || result.citations).length} Book Citations
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(result.textbookCitations || result.citations).map((citation, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-3 hover:border-blue-500/30 transition-all text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight text-blue-400">
                              📖 {citation.bookTitle}
                            </p>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                              {citation.chapter || 'Clinical Knowledge Chapter'}
                            </p>
                          </div>
                          {citation.confidenceScore && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase shrink-0">
                              {citation.confidenceScore}% Match
                            </span>
                          )}
                        </div>

                        {citation.excerpt && (
                          <p className="text-[11px] font-medium text-zinc-300 italic border-l-2 border-blue-500/40 pl-3 py-0.5 leading-relaxed">
                            "{citation.excerpt}"
                          </p>
                        )}

                        {citation.clinicalGuidance && (
                          <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-2 text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                            <Sparkles size={14} className="text-blue-400 shrink-0 mt-0.5" />
                            <span>{citation.clinicalGuidance}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1.8 FEATURED INTERACTIVE RADIOGRAPH & IMAGE VISION VIEWER */}
              {(() => {
                const targetImageSrc = selectedReport?.fileUrl || result?.fileUrl;
                const isImageFile = Boolean(targetImageSrc) && !targetImageSrc.toLowerCase().endsWith('.pdf');

                if (isImageFile && targetImageSrc) {
                  const radDiag = result.diagnosticFindings?.find(d => d.type === 'radiograph_film') || {
                    type: 'radiograph_film',
                    procedure: result.documentBadges?.[0]?.name || "Diagnostic Radiograph / Medical Image",
                    fractureDetected: result.structuredResults?.some(r => r.resultStatus === 'ABNORMAL' || r.valueString?.toLowerCase().includes('displaced') || r.valueString?.toLowerCase().includes('fracture')) || result.diagnosticFindings?.some(d => d.fractureDetected === true),
                    fractureLocation: result.structuredResults?.find(r => r.testName?.toLowerCase().includes('location'))?.valueString || "Anatomical Region",
                    anatomicalRegion: "Diagnostic Medical Image"
                  };

                  return (
                    <div className="space-y-3 my-6">
                      <RadiographViewer
                        imageSrc={targetImageSrc}
                        fractureInfo={radDiag}
                        anatomicalRegion={radDiag.anatomicalRegion || "Diagnostic Image"}
                        engineMode={result?._executedEngine || store.reportEngineMode || 'local'}
                      />
                    </div>
                  );
                }
                return null;
              })()}

              {/* 2. CATEGORIZED ORGAN CARDS */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                    <Stethoscope size={16} className="text-blue-500" /> Organ Systems & Laboratory Findings
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-500">
                    Click "Source" on any test to inspect original printed line
                  </span>
                </div>

                {/* If categorizedResults array exists */}
                {result.categorizedResults && result.categorizedResults.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {result.categorizedResults.map((cat, cIdx) => (
                      <div
                        key={cIdx}
                        className={`p-8 rounded-[40px] border shadow-xl transition-all ${
                          theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{cat.icon || '🧪'}</span>
                            <div>
                              <h4 className={`text-base font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                                {cat.name}
                              </h4>
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                {cat.tests?.length || 0} Parameters • {cat.diagnostics?.length || 0} Procedures
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Quantitative & Qualitative Tests Table */}
                        {cat.tests && cat.tests.length > 0 && (
                          <div className="space-y-3 mb-6">
                            {cat.tests.map((test, tIdx) => (
                              <div
                                key={tIdx}
                                className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                                  test.severity === 'critical'
                                    ? 'bg-red-500/5 border-red-500/20'
                                    : test.severity === 'abnormal'
                                    ? 'bg-rose-500/5 border-rose-500/15'
                                    : theme === 'dark'
                                    ? 'bg-white/5 border-white/5'
                                    : 'bg-slate-50 border-slate-100'
                                }`}
                              >
                                {/* Row 1: Parameter Name + Status Badge */}
                                <div className="flex justify-between items-center gap-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-300' : 'text-slate-800'}`}>
                                      {test.testName}
                                    </p>
                                    {test.needsVerification && (
                                      <button
                                        onClick={() => {
                                          setVerifyingItem(test);
                                          setVerifiedValue(String(test.value));
                                        }}
                                        className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[8px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all"
                                        title="Review ambiguous digit"
                                      >
                                        ⚠️ Verify Value
                                      </button>
                                    )}
                                  </div>

                                  <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border shrink-0 ${getSeverityBadge(test.evaluatedStatus, test.severity)}`}>
                                    {getStatusIcon(test.evaluatedStatus, test.severity)} {test.evaluatedStatus}
                                  </span>
                                </div>

                                {/* Row 2: Extracted Value / Finding */}
                                <div className="text-left">
                                  <p className="text-sm font-black text-white leading-relaxed break-words">
                                    {test.valueString || test.value} {test.value !== null && test.unit && !test.valueString?.includes(test.unit) ? <span className="text-[10px] font-bold text-zinc-400">{test.unit}</span> : null}
                                  </p>
                                </div>

                                {/* Row 3: Reference & Source Evidence */}
                                <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-white/5 text-[10px] text-zinc-500 font-bold">
                                  <span>Report Ref: {test.referenceRange || 'Standard'}</span>
                                  {test.source && (
                                    <button
                                      onClick={() => setActiveEvidence(test)}
                                      className="text-blue-400 hover:text-blue-300 font-black uppercase tracking-wider flex items-center gap-1 transition-colors"
                                    >
                                      <Eye size={12} /> View Source (Pg {test.source.pageNumber})
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Narrative Diagnostic Findings (ECG, Echo, Imaging, CXR) */}
                        {cat.diagnostics && cat.diagnostics.length > 0 && (
                          <div className="space-y-3 pt-2">
                            {cat.diagnostics.map((diag, dIdx) => (
                              <div key={dIdx} className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-left space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                  <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                    {diag.icon || '🔬'} {diag.procedure}
                                  </span>
                                  {diag.lvef && (
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                                      diag.lvef < 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    }`}>
                                      LVEF: {diag.lvef}%
                                    </span>
                                  )}
                                </div>

                                {diag.oralHealthCondition && (
                                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Oral Health Condition</span>
                                    <p className="text-xs font-bold text-zinc-300">{diag.oralHealthCondition}</p>
                                  </div>
                                )}

                                {diag.toothAssessment && (
                                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Tooth & Gum Assessment</span>
                                    <p className="text-xs font-bold text-zinc-300">{diag.toothAssessment}</p>
                                  </div>
                                )}

                                {diag.workRecommended && (
                                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 space-y-1">
                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Treatment / Work Recommended</span>
                                    <p className="text-xs font-black text-white">{diag.workRecommended}</p>
                                  </div>
                                )}

                                {diag.hygieneAdvice && (
                                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-1">
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Hygiene Advice & Follow-Up</span>
                                    <p className="text-xs font-bold text-emerald-200">{diag.hygieneAdvice}</p>
                                  </div>
                                )}

                                {diag.medicalHistory && (
                                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Medical & Surgical History</span>
                                    <p className="text-xs font-bold text-zinc-300">{diag.medicalHistory}</p>
                                  </div>
                                )}

                                {diag.doctorObservations && (
                                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Physician Clinical Observations</span>
                                    <p className="text-xs font-bold text-zinc-300">{diag.doctorObservations}</p>
                                  </div>
                                )}

                                {diag.nextSteps && (
                                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-1">
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Prescriptions & Next Steps</span>
                                    <p className="text-xs font-black text-white">{diag.nextSteps}</p>
                                  </div>
                                )}

                                {/* Ultrasound (USG) Abdomen & Pelvis Card */}
                                {diag.type === 'usg_abdomen' && (
                                  <div className="space-y-3.5">
                                    <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 space-y-1">
                                      <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Imaging Modality</span>
                                      <p className="text-xs font-black text-white">{diag.modality}</p>
                                    </div>

                                    {diag.radiologicalFindings && (
                                      <div className="p-4 bg-black/50 rounded-2xl border border-white/10 space-y-2 text-left">
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                          🫁 Abdominal & Pelvic Organ Findings
                                        </span>
                                        <p className="text-xs font-bold text-zinc-200 leading-relaxed whitespace-pre-line">
                                          {diag.radiologicalFindings}
                                        </p>
                                      </div>
                                    )}

                                    {diag.impression && (
                                      <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/25 space-y-1.5 text-left">
                                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                                          📋 Radiological Impression
                                        </span>
                                        <p className="text-xs font-black text-rose-100 leading-relaxed whitespace-pre-line">
                                          {diag.impression}
                                        </p>
                                      </div>
                                    )}

                                    {diag.recommendation && (
                                      <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/25 space-y-1.5 text-left">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                          🩺 Clinical Correlation & Guidance
                                        </span>
                                        <p className="text-xs font-bold text-zinc-200 leading-relaxed">
                                          {diag.recommendation}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* ENT Tympanometry & Audiology Card */}
                                {diag.type === 'ent_tympanogram' && (
                                  <div className="space-y-3.5">
                                    <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 space-y-1">
                                      <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Audiology Protocol</span>
                                      <p className="text-xs font-black text-white">{diag.modality}</p>
                                    </div>

                                    {diag.resultsSummary && (
                                      <div className="p-4 bg-black/50 rounded-2xl border border-white/10 space-y-2 text-left">
                                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                                          👂 Tympanogram Curves & Acoustic Reflexes
                                        </span>
                                        <p className="text-xs font-bold text-zinc-200 leading-relaxed whitespace-pre-line">
                                          {diag.resultsSummary}
                                        </p>
                                      </div>
                                    )}

                                    {diag.impression && (
                                      <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/25 space-y-1.5 text-left">
                                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                                          📋 Middle Ear Function Impression
                                        </span>
                                        <p className="text-xs font-black text-rose-100 leading-relaxed whitespace-pre-line">
                                          {diag.impression}
                                        </p>
                                      </div>
                                    )}

                                    {diag.recommendation && (
                                      <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/25 space-y-1.5 text-left">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                          🩺 ENT Specialist Recommendation
                                        </span>
                                        <p className="text-xs font-bold text-zinc-200 leading-relaxed">
                                          {diag.recommendation}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* CT Brain / Neuroimaging Specialized Card */}
                                {diag.type === 'ct_brain' && (
                                  <div className="space-y-3.5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                      <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 space-y-1">
                                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Imaging Protocol</span>
                                        <p className="text-xs font-black text-white">{diag.modality}</p>
                                      </div>
                                      <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 space-y-1">
                                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Clinical Indication</span>
                                        <p className="text-xs font-bold text-zinc-300 line-clamp-2">{diag.clinicalIndication}</p>
                                      </div>
                                    </div>

                                    {diag.radiologicalFindings && (
                                      <div className="p-4 bg-black/50 rounded-2xl border border-white/10 space-y-2 text-left">
                                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                                          🔬 Radiological Findings
                                        </span>
                                        <p className="text-xs font-bold text-zinc-200 leading-relaxed whitespace-pre-line">
                                          {diag.radiologicalFindings}
                                        </p>
                                      </div>
                                    )}

                                    {diag.impression && (
                                      <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/25 space-y-1.5 text-left">
                                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                                          🧠 Radiological Impression
                                        </span>
                                        <p className="text-xs font-black text-rose-100 leading-relaxed whitespace-pre-line">
                                          {diag.impression}
                                        </p>
                                      </div>
                                    )}

                                    {diag.recommendation && (
                                      <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/25 space-y-1.5 text-left">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                          ⚠️ Specialist Recommendation & Next Steps
                                        </span>
                                        <p className="text-xs font-bold text-zinc-200 leading-relaxed">
                                          {diag.recommendation}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Direct Radiograph Film Scan (Images Only) */}
                                {diag.type === 'radiograph_film' && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-0.5">
                                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Imaging Modality</span>
                                        <p className="text-xs font-bold text-white">{diag.modality}</p>
                                      </div>
                                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-0.5">
                                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Anatomical Region</span>
                                        <p className="text-xs font-bold text-white">{diag.anatomicalRegion}</p>
                                      </div>
                                    </div>

                                    <div className="p-3.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 space-y-1">
                                      <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Radiological Impression</span>
                                      <p className="text-xs font-bold text-cyan-100 leading-relaxed">{diag.findingsSummary}</p>
                                    </div>

                                    {diag.recommendation && (
                                      <div className="p-3.5 bg-blue-500/10 rounded-xl border border-blue-500/20 space-y-1">
                                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Clinical Guidance & Correlation</span>
                                        <p className="text-xs font-bold text-zinc-300 leading-relaxed">{diag.recommendation}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {!diag.oralHealthCondition && !diag.toothAssessment && !diag.medicalHistory && !diag.doctorObservations && diag.type !== 'radiograph_film' && diag.type !== 'ct_brain' && (
                                  <p className="text-xs font-bold text-zinc-300 leading-relaxed">
                                    {diag.reportedInterpretation || diag.findingsText}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Fallback Flat List if categorizedResults not populated */
                  <div className={`p-8 rounded-[40px] border ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(result.abnormalValues || []).map((v, i) => (
                        <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                          <div className="text-left">
                            <p className="text-xs font-black uppercase text-white">{v.test || 'Lab Marker'}</p>
                            <p className="text-[9px] font-bold text-zinc-500">Ref: {v.referenceRange || 'Standard'}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getSeverityBadge(v.status, v.severity)}`}>
                            {v.result || v.value} ({v.status || 'Normal'})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. HEALTH TRENDS COMPARISON (Previous vs Current) */}
              {result.healthTrends && result.healthTrends.hasPreviousData && (
                <div className={`p-8 md:p-10 rounded-[48px] border shadow-2xl transition-all ${
                  theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-3">
                        <TrendingUp size={20} className="text-blue-500" /> Longitudinal Health Trend
                      </h3>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                        Comparing Current Extraction with Prior Archive from {new Date(result.healthTrends.priorReportDate).toLocaleDateString()}
                      </p>
                    </div>

                    {result.healthTrends.multiMarkerAlert && (
                      <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle size={16} /> Multi-Marker Elevation Detected
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {result.healthTrends.trends.map((trend, tIdx) => (
                      trend.status === 'UNAVAILABLE' ? (
                        <div
                          key={tIdx}
                          className="p-5 rounded-3xl border text-left bg-amber-500/5 border-amber-500/20 flex flex-col justify-between"
                        >
                          <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-tight truncate">{trend.testName}</p>
                            <div className="flex items-start gap-1.5 mt-2 text-amber-400 text-xs font-bold">
                              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                              <span className="text-[10px] leading-snug">{trend.reason || 'Trend unavailable — verification required.'}</span>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-bold text-zinc-500">
                            <span>Prior: {trend.previousValue}</span>
                            <span>Curr: {trend.currentValue} {trend.unit}</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={tIdx}
                          className={`p-5 rounded-3xl border text-left ${
                            trend.trajectory === 'worsening'
                              ? 'bg-rose-500/5 border-rose-500/20'
                              : trend.trajectory === 'improving'
                              ? 'bg-emerald-500/5 border-emerald-500/20'
                              : 'bg-white/5 border-white/5'
                          }`}
                        >
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-tight truncate">{trend.testName}</p>
                          <div className="flex items-baseline justify-between mt-2">
                            <span className="text-sm font-bold text-zinc-500">{trend.previousValue}</span>
                            <span className="text-xs text-zinc-500 font-black">→</span>
                            <span className={`text-base font-black ${
                              trend.trajectory === 'worsening' ? 'text-rose-500' : trend.trajectory === 'improving' ? 'text-emerald-500' : 'text-blue-400'
                            }`}>
                              {trend.currentValue} <span className="text-[9px] opacity-70">{trend.unit}</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[9px] font-black uppercase">
                            <span className={trend.direction === 'INCREASED' ? 'text-rose-400' : trend.direction === 'DECREASED' ? 'text-emerald-400' : 'text-blue-400'}>
                              {trend.icon} {trend.direction}
                            </span>
                            <span className="text-zinc-500">
                              {trend.pctChange > 0 ? `+${trend.pctChange}%` : `${trend.pctChange}%`}
                            </span>
                          </div>
                        </div>
                      )
                    ))}
                  </div>

                  {result.healthTrends.multiMarkerAlert && (
                    <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-left space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                        <AlertTriangle size={16} /> Pattern Alert
                      </div>
                      <p className="text-xs font-bold text-zinc-300 leading-relaxed">
                        {result.healthTrends.multiMarkerAlert.message}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 4. CROSS-ORGAN RELATIONSHIP PATTERNS */}
              {result.relationshipPatterns && result.relationshipPatterns.length > 0 && (
                <div className={`p-8 md:p-10 rounded-[48px] border shadow-2xl text-left space-y-6 ${
                  theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-3">
                        <Zap size={20} className="text-amber-500" /> Cross-Organ Related Findings
                      </h3>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                        Associative Multi-Marker Pattern Recognition Engine
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {result.relationshipPatterns.length} Patterns
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.relationshipPatterns.map((pat, pIdx) => (
                      <div
                        key={pIdx}
                        className={`p-6 rounded-3xl border space-y-4 ${
                          pat.severity === 'critical' || pat.severity === 'high'
                            ? 'bg-rose-500/5 border-rose-500/20'
                            : 'bg-blue-500/5 border-blue-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <span>{pat.icon}</span> {pat.title}
                          </span>
                          <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                            pat.severity === 'high' || pat.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {pat.severity}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {pat.involvedMarkers?.map((m, mIdx) => (
                            <span key={mIdx} className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-[9px] font-bold text-zinc-300">
                              {m}
                            </span>
                          ))}
                        </div>

                        <p className="text-xs font-bold text-zinc-300 leading-relaxed">
                          {pat.description}
                        </p>

                        <div className="p-3 bg-black/30 rounded-2xl border border-white/5 text-[10px] font-bold text-blue-400">
                          💡 Directive: {pat.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. CLINICAL NARRATIVE / PRESCRIPTIONS / CONSULT NOTES */}
              {result.clinicalNotes && (result.clinicalNotes.prescribedMedicines?.length > 0 || result.clinicalNotes.chiefComplaints || result.clinicalNotes.diagnosisMentioned) && (
                <div className={`p-8 md:p-10 rounded-[48px] border shadow-2xl text-left space-y-6 ${
                  theme === 'dark' ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-slate-100'
                }`}>
                  <h3 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-3">
                    <FileText size={20} className="text-blue-500" /> Clinical Notes & Prescriptions Extracted
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.clinicalNotes.diagnosisMentioned && (
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-2">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Diagnosis Mentioned</p>
                        <p className="text-sm font-black text-white">{result.clinicalNotes.diagnosisMentioned}</p>
                      </div>
                    )}

                    {result.clinicalNotes.chiefComplaints && (
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-2">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Chief Complaints</p>
                        <p className="text-sm font-bold text-zinc-300">{result.clinicalNotes.chiefComplaints}</p>
                      </div>
                    )}

                    {result.clinicalNotes.prescribedMedicines?.length > 0 && (
                      <div className="md:col-span-2 p-6 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Prescribed Medications Extracted</p>
                        <div className="flex flex-wrap gap-2">
                          {result.clinicalNotes.prescribedMedicines.map((med, mIdx) => (
                            <span key={mIdx} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-black">
                              💊 {med}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 6. IMPORTANT CLINICAL DISCLAIMER */}
              <div className="p-8 rounded-[40px] bg-amber-500/10 border border-amber-500/20 text-left flex flex-col md:flex-row items-start md:items-center gap-6">
                <AlertCircle size={36} className="text-amber-500 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-400">Important Medical Notice</h4>
                  <p className="text-xs font-bold text-zinc-300 leading-relaxed">
                    This is an automated analysis of the uploaded report and is not a medical diagnosis. Please discuss significant or worsening findings with a qualified healthcare professional.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* EVIDENCE AUDIT MODAL */}
          {activeEvidence && (
            <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-[#0e0e11] border border-white/10 p-8 rounded-[40px] max-w-xl w-full shadow-2xl text-left space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Eye size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white uppercase tracking-tight">{activeEvidence.testName}</h4>
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Traceability & Source Verification</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveEvidence(null)} className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-[9px] font-black text-zinc-500 uppercase">Document Location</span>
                    <p className="font-bold text-zinc-300">Page Number: {activeEvidence.source?.pageNumber || 1} • Line: {activeEvidence.source?.lineNumber || 'N/A'}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider">Original Extracted Line</span>
                    <p className="font-mono text-xs text-emerald-400 p-3 bg-black rounded-xl border border-white/5">
                      "{activeEvidence.source?.originalText}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[9px] font-black text-zinc-500 uppercase">Extracted Value</span>
                      <p className="font-black text-sm text-white">{activeEvidence.value} {activeEvidence.unit}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[9px] font-black text-zinc-500 uppercase">Extraction Confidence</span>
                      <p className="font-black text-sm text-emerald-400">{activeEvidence.confidence}% ({activeEvidence.confidenceLabel})</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveEvidence(null)}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          )}

          {/* VALUE VERIFICATION MODAL */}
          {verifyingItem && (
            <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-[#0e0e11] border border-white/10 p-8 rounded-[40px] max-w-lg w-full shadow-2xl text-left space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <div>
                    <h4 className="text-base font-black text-white uppercase tracking-tight">Verify Extracted Value</h4>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{verifyingItem.testName}</p>
                  </div>
                  <button onClick={() => setVerifyingItem(null)} className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveVerification} className="space-y-4">
                  {verifyingItem.plausibilityWarning && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold leading-relaxed">
                      ⚠️ {verifyingItem.plausibilityWarning}
                    </div>
                  )}

                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs text-zinc-400">
                    Original Line: <span className="font-mono text-zinc-200">"{verifyingItem.source?.originalText}"</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 mb-2 block">
                      Correct Numerical Value ({verifyingItem.unit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={verifiedValue}
                      onChange={(e) => setVerifiedValue(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-base font-black text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setVerifyingItem(null)}
                      className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-2xl text-xs font-black uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingVerification}
                      className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                      {savingVerification ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Save & Recalculate
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SPINNER OVERLAY */}
          {loading && (
            <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-xl flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Medical Engine Active</h4>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mt-1">Local Deterministic Processing...</p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default AIAnalysis;
