import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../common/Navbar';
import {
  Pill, Plus, X, Save, FileText, User as UserIcon,
  Download, Send, Layout, ChevronDown, Search as SearchIcon, Loader2, CheckCircle, Sparkles,
  AlertTriangle, ShieldAlert, Heart, Clipboard, BookOpen, Trash2, Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import useStore from '../../store/useStore';

const DRUG_INTERACTIONS = [
  { drugA: "Ibuprofen", drugB: "Clopidogrel", severity: "High", message: "CRITICAL: Co-administration of Ibuprofen and Clopidogrel increases risk of gastrointestinal bleeding." },
  { drugA: "Aspirin", drugB: "Clopidogrel", severity: "Moderate", message: "WARNING: Dual antiplatelet activity may increase systemic bleeding risks." },
  { drugA: "Paracetamol", drugB: "Ibuprofen", severity: "Low", message: "NOTE: Avoid double dosing analgesics for prolonged periods to prevent liver and kidney stress." }
];

const WritePrescription = ({ patientId: propPatientId, onComplete, hideNavbar = false }) => {
  const { theme } = useStore();
  const [searchParams] = useSearchParams();
  const [patientId, setPatientId] = useState(propPatientId || searchParams.get('patientId') || '');
  const [patientName, setPatientName] = useState('');
  const [patientAllergies, setPatientAllergies] = useState([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingPatient, setFetchingPatient] = useState(false);

  // Prescription builder matrix
  const [medicines, setMedicines] = useState([
    {
      name: '',
      genericName: '',
      brandName: '',
      strength: '',
      dosageForm: 'Tablet',
      manufacturer: '',
      dosage: '1 tab',
      frequency: '1-0-1',
      foodInstruction: 'After Food',
      durationValue: 5,
      durationUnit: 'Days',
      morning: true,
      afternoon: false,
      night: true,
      specialInstructions: '',
      quantity: 10
    }
  ]);

  // Autocomplete suggestions state
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Safety checks alerts
  const [safetyAlerts, setSafetyAlerts] = useState([]);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // E-Prescription Letter Modal
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [issuedPrescription, setIssuedPrescription] = useState(null);

  // Load patient details on patientId change
  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
    } else {
      setPatientName('');
      setPatientAllergies([]);
    }
  }, [patientId]);

  // Load custom templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Run safety checks whenever medicines change
  useEffect(() => {
    runSafetyChecks();
  }, [medicines, patientAllergies]);

  const fetchPatientDetails = async () => {
    setFetchingPatient(true);
    try {
      const res = await api.get(`/doctor/patient/${patientId}`);
      setPatientName(res.data?.user?.name || 'Unknown Patient');
      
      // Clinical safety check: Load registered allergies or default
      setPatientAllergies(res.data?.profile?.allergies || res.data?.user?.allergies || []);
    } catch (err) {
      setPatientName('');
      setPatientAllergies([]);
    } finally {
      setFetchingPatient(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/doctor/prescription-templates');
      setTemplates(res.data);
    } catch (err) {
      console.error("Failed to load templates", err);
    }
  };

  // Run real-time Drug Safety Checks
  const runSafetyChecks = () => {
    const alerts = [];
    const genericCount = {};
    const nameCount = {};

    medicines.forEach((med, idx) => {
      if (!med.name) return;

      // 1. Duplicate Medication Detection
      const key = med.name.toLowerCase();
      nameCount[key] = (nameCount[key] || 0) + 1;
      if (nameCount[key] > 1) {
        alerts.push({
          type: "Duplicate",
          severity: "High",
          message: `DUPLICATE ALERT: '${med.name}' is added multiple times in the active builder.`
        });
      }

      if (med.genericName) {
        const genKey = med.genericName.toLowerCase();
        genericCount[genKey] = (genericCount[genKey] || 0) + 1;
        if (genericCount[genKey] > 1) {
          alerts.push({
            type: "Duplicate Ingredient",
            severity: "High",
            message: `DUPLICATE ACTIVE INGREDIENT: Multiple drugs prescribed containing '${med.genericName}'.`
          });
        }
      }

      // 2. Allergy Warnings
      patientAllergies.forEach(allergy => {
        const containsAllergy = 
          med.name.toLowerCase().includes(allergy.toLowerCase()) || 
          med.genericName?.toLowerCase().includes(allergy.toLowerCase()) ||
          med.brandName?.toLowerCase().includes(allergy.toLowerCase());
        
        if (containsAllergy) {
          alerts.push({
            type: "Allergy",
            severity: "Critical",
            message: `CONTRAINDICATION: Patient allergy to '${allergy}' matches prescribed drug '${med.name}' (${med.genericName}).`
          });
        }
      });

      // 3. High Dosage / Frequency Warnings
      if (med.morning && med.afternoon && med.night && med.frequency === '1-1-1' && med.quantity > 50) {
        alerts.push({
          type: "Dosage Limit",
          severity: "Moderate",
          message: `DOSAGE WARNING: High total quantity (${med.quantity}) prescribed for '${med.name}' with a thrice-daily schedule.`
        });
      }
    });

    // 4. Drug-Drug Interactions Checks
    for (let i = 0; i < medicines.length; i++) {
      for (let j = i + 1; j < medicines.length; j++) {
        const medA = medicines[i];
        const medB = medicines[j];
        if (!medA.name || !medB.name) continue;

        DRUG_INTERACTIONS.forEach(interaction => {
          const matchA = medA.name.toLowerCase().includes(interaction.drugA.toLowerCase()) || medA.genericName?.toLowerCase().includes(interaction.drugA.toLowerCase());
          const matchB = medB.name.toLowerCase().includes(interaction.drugB.toLowerCase()) || medB.genericName?.toLowerCase().includes(interaction.drugB.toLowerCase());
          const matchReverseA = medB.name.toLowerCase().includes(interaction.drugA.toLowerCase()) || medB.genericName?.toLowerCase().includes(interaction.drugA.toLowerCase());
          const matchReverseB = medA.name.toLowerCase().includes(interaction.drugB.toLowerCase()) || medA.genericName?.toLowerCase().includes(interaction.drugB.toLowerCase());

          if ((matchA && matchB) || (matchReverseA && matchReverseB)) {
            alerts.push({
              type: "Interaction",
              severity: interaction.severity,
              message: interaction.message
            });
          }
        });
      }
    }

    // Filter unique alerts
    const uniqueAlerts = Array.from(new Set(alerts.map(a => a.message))).map(msg => alerts.find(a => a.message === msg));
    setSafetyAlerts(uniqueAlerts);
  };

  // Autocomplete search handler
  const handleMedSearch = async (val, index) => {
    const updated = [...medicines];
    updated[index].name = val;
    setMedicines(updated);
    
    if (!val) {
      setSuggestions([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api.get(`/ai/medicine-suggestions?query=${val}`);
      setSuggestions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSuggestion = (sug, index) => {
    const updated = [...medicines];
    updated[index] = {
      ...updated[index],
      name: sug.name,
      brandName: sug.brandName || sug.name,
      genericName: sug.genericName || sug.name,
      strength: sug.strength || '',
      dosageForm: sug.dosageForm || 'Tablet',
      manufacturer: sug.manufacturer || '',
      commonUses: sug.commonUses || '',
      dosage: sug.strength && sug.dosageForm ? `1 ${sug.dosageForm.toLowerCase()}` : updated[index].dosage
    };
    setMedicines(updated);
    setActiveSearchIndex(null);
    setSuggestions([]);
  };

  const handleAddRow = () => {
    setMedicines([...medicines, {
      name: '',
      genericName: '',
      brandName: '',
      strength: '',
      dosageForm: 'Tablet',
      manufacturer: '',
      dosage: '1 tab',
      frequency: '1-0-1',
      foodInstruction: 'After Food',
      durationValue: 5,
      durationUnit: 'Days',
      morning: true,
      afternoon: false,
      night: true,
      specialInstructions: '',
      quantity: 10
    }]);
  };

  const handleRemoveRow = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedFieldChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    
    // Automatically recalculate morning/afternoon/night based on frequency changes
    if (field === 'frequency') {
      if (value === '1-0-1') {
        updated[index].morning = true;
        updated[index].afternoon = false;
        updated[index].night = true;
      } else if (value === '1-1-1') {
        updated[index].morning = true;
        updated[index].afternoon = true;
        updated[index].night = true;
      } else if (value === '1-0-0') {
        updated[index].morning = true;
        updated[index].afternoon = false;
        updated[index].night = false;
      } else if (value === '0-0-1') {
        updated[index].morning = false;
        updated[index].afternoon = false;
        updated[index].night = true;
      }
    }

    setMedicines(updated);
  };

  // Submit Prescription to Backend
  const handleSavePrescription = async (e) => {
    e.preventDefault();
    if (!patientId || !diagnosis) {
      toast.error("Please fill patient ID and diagnosis clinical context.");
      return;
    }

    // Critical block: reject if critical allergy alerts are ignored
    const hasCriticalAllergy = safetyAlerts.some(a => a.severity === 'Critical');
    if (hasCriticalAllergy) {
      toast.error("CRITICAL ALLERGY ALERT: Prescription cannot be dispatched while contraindicated allergen is active.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        patientId,
        diagnosis,
        medicines,
        advice,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        doctorRegNo: "REG89721",
        qrCodeData: `https://mediconsult.network/verify/rx-${Date.now()}`,
        signature: `mc-digisig-89721-doc-naresh`
      };

      const res = await api.post('/doctor/prescription', payload);
      setIssuedPrescription(res.data.prescription);
      toast.success("Digital Prescription dispatched. Tracker updated.");
      setShowLetterModal(true);
      
      // Clear forms
      setDiagnosis('');
      setAdvice('');
      setFollowUpDate('');
      setMedicines([{
        name: '',
        genericName: '',
        brandName: '',
        strength: '',
        dosageForm: 'Tablet',
        manufacturer: '',
        dosage: '1 tab',
        frequency: '1-0-1',
        foodInstruction: 'After Food',
        durationValue: 5,
        durationUnit: 'Days',
        morning: true,
        afternoon: false,
        night: true,
        specialInstructions: '',
        quantity: 10
      }]);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to dispatch digital prescription.");
    } finally {
      setLoading(false);
    }
  };

  // Templates CRUD logic
  const handleSaveAsTemplate = async (e) => {
    e.preventDefault();
    if (!templateName) return toast.error("Template name required.");

    try {
      const payload = {
        name: templateName,
        diagnosis,
        medicines
      };
      await api.post('/doctor/prescription-templates', payload);
      toast.success(`Template '${templateName}' saved successfully.`);
      setShowSaveTemplateModal(false);
      setTemplateName('');
      fetchTemplates();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save template.");
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  const applyTemplate = (t) => {
    setMedicines(t.medicines);
    if (t.diagnosis) setDiagnosis(t.diagnosis);
    toast.success(`Template '${t.name}' applied.`);
  };

  return (
    <div className={`flex ${hideNavbar ? 'h-full' : 'min-h-screen'} ${theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-800'} neural-grid ${hideNavbar ? 'pb-0' : 'pb-24'} text-left relative overflow-x-hidden`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!hideNavbar && <Navbar />}

        <main className={`flex-1 overflow-y-auto ${hideNavbar ? 'p-0' : 'p-4 md:p-8'} space-y-10 custom-scrollbar relative z-10 print:p-0 print:m-0 print:bg-white print:text-black`}>
          
          {/* Header Panel */}
          <header className={`mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 ${hideNavbar ? 'pb-4' : 'pb-8'} print:hidden`}>
            <div>
              <h1 className={`${hideNavbar ? 'text-xl' : 'text-3xl'} font-black text-white uppercase tracking-tight`}>Smart Rx Console</h1>
              <p className="text-blue-500 uppercase text-[10px] font-black tracking-widest mt-1">Pharmacology node synthesis & safety engine</p>
            </div>
            
            {/* Quick Templates bar */}
            <div className="flex flex-wrap items-center gap-3">
              {templates.slice(0, 3).map(t => (
                <button
                  key={t._id}
                  onClick={() => applyTemplate(t)}
                  className="px-4 py-2 bg-zinc-900 border border-white/5 hover:border-white/10 text-[9px] font-black uppercase text-blue-400 rounded-xl transition-all tracking-widest active:scale-95"
                >
                  {t.name}
                </button>
              ))}
              <button
                onClick={() => setShowSaveTemplateModal(true)}
                className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-[9px] font-black uppercase text-blue-400 rounded-xl transition-all tracking-widest flex items-center gap-1.5"
              >
                <Save size={12} /> Save Template
              </button>
              {hideNavbar && (
                 <button onClick={onComplete} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-all"><X size={20}/></button>
              )}
            </div>
          </header>

          {/* Electronic Prescription Print-Only Area (Hidden on screen) */}
          {issuedPrescription && (
            <div id="print-area" className="hidden print:block p-10 bg-white text-black font-sans min-h-screen text-left">
              <div className="border-b-4 border-blue-600 pb-6 mb-8 flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-extrabold uppercase tracking-tight text-blue-600">MediConsult Hospital</h1>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Department of Clinical Pharmacology</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold">Doctor Reg No: <span className="text-blue-600 font-extrabold">{issuedPrescription.doctorRegNo}</span></p>
                  <p>Date: {new Date(issuedPrescription.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <h3 className="font-extrabold uppercase text-blue-600 tracking-wider mb-2 border-b border-gray-200 pb-1">Referring Specialist</h3>
                  <p className="font-bold text-gray-800">{user?.name}</p>
                  <p className="text-gray-500">{profile?.specialization || 'Consultant'}</p>
                  <p className="text-gray-400 mt-2">{profile?.hospitalName || 'MediConsult Clinical Center'}</p>
                </div>
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <h3 className="font-extrabold uppercase text-blue-600 tracking-wider mb-2 border-b border-gray-200 pb-1">Patient Details</h3>
                  <p className="font-bold text-gray-800">{patientName || 'Patient Node'}</p>
                  <p className="text-gray-500">Patient ID: {issuedPrescription.patientId}</p>
                  <p className="text-gray-400 mt-2">Clinic Records Link</p>
                </div>
              </div>

              <div className="text-xs mb-8">
                <p className="font-extrabold text-zinc-800 uppercase text-[9px] tracking-wider mb-1">Diagnosis Matrix:</p>
                <p className="font-bold text-zinc-900 border-b border-zinc-100 pb-3">{issuedPrescription.diagnosis}</p>
              </div>

              <div className="mb-10 text-xs">
                <h3 className="font-extrabold uppercase text-blue-600 tracking-wider mb-4 border-b border-gray-200 pb-1">Prescribed Medications</h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2">Medication</th>
                      <th className="py-2">Dosage</th>
                      <th className="py-2">Frequency</th>
                      <th className="py-2">Timing</th>
                      <th className="py-2">Duration</th>
                      <th className="py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-bold text-gray-800">
                    {issuedPrescription.medicines.map((med, idx) => (
                      <tr key={idx}>
                        <td className="py-3">
                          <p className="font-extrabold text-blue-600 uppercase">{med.name}</p>
                          {med.genericName && <p className="text-[9px] text-gray-400 font-normal italic mt-0.5">({med.genericName})</p>}
                          {med.specialInstructions && <p className="text-[9px] text-red-500 font-bold mt-1">* {med.specialInstructions}</p>}
                        </td>
                        <td className="py-3">{med.dosage}</td>
                        <td className="py-3 uppercase">{med.frequency}</td>
                        <td className="py-3">{med.foodInstruction}</td>
                        <td className="py-3">{med.durationValue} {med.durationUnit}</td>
                        <td className="py-3 text-right">{med.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {issuedPrescription.advice && (
                <div className="text-xs text-gray-700 leading-relaxed mb-8 bg-gray-50 p-4 rounded-xl border border-gray-150">
                  <p className="font-extrabold text-gray-900 uppercase tracking-widest text-[8px] mb-1">Dietary/Clinical Advice:</p>
                  <p>{issuedPrescription.advice}</p>
                </div>
              )}

              <div className="flex justify-between items-end mt-16 text-xs border-t border-gray-100 pt-6">
                <div>
                  <p className="text-gray-400 uppercase text-[9px]">Electronic Auth Signature</p>
                  <p className="font-black text-gray-800 mt-2">{user?.name}</p>
                  <p className="text-gray-400">Authorized Specialist</p>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div>
                    <p className="text-gray-400 uppercase text-[9px] mb-1">Verify Node</p>
                    <div className="w-16 h-16 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-[7px] font-bold text-gray-400 uppercase tracking-widest">
                      QR CODE
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Matrix */}
          <form onSubmit={handleSavePrescription} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left print:hidden">
            
            {/* Left Column (Patient, Diagnosis & Safety Alerts) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Patient Profile section */}
              <div className="bg-zinc-950/80 p-6 md:p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-3xl"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
                    <UserIcon size={20} />
                  </div>
                  <h3 className="font-black text-white uppercase text-xs tracking-widest">Patient Node Link</h3>
                </div>

                <div className="space-y-6 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Patient Archive ID *</label>
                    <input
                      type="text"
                      placeholder="ENTER PATIENT ID (e.g. PAT1001)"
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-black text-sm text-blue-400 uppercase tracking-[0.2em] focus:border-blue-500/30 transition-all placeholder:text-zinc-650"
                      required
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value.toUpperCase())}
                    />
                    {fetchingPatient && <p className="text-[8px] uppercase tracking-widest text-zinc-500 mt-1">Connecting node...</p>}
                    {patientName && (
                      <p className="mt-2 text-[10px] font-black text-emerald-400 px-1 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle size={12}/> Authenticated: {patientName}
                      </p>
                    )}
                  </div>

                  {patientAllergies.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle size={12} /> Registered Allergies:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {patientAllergies.map((allergy, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/10">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Clinical Diagnosis Context *</label>
                    <textarea
                      placeholder="ENTER DIAGNOSIS..."
                      className="w-full p-5 bg-white/5 border border-white/10 rounded-[24px] outline-none font-bold text-xs min-h-[120px] text-zinc-200 focus:border-blue-500/30 transition-all shadow-inner placeholder:text-zinc-650"
                      required
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Safety Checks Panel */}
              <div className="bg-zinc-950/80 p-6 md:p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center border border-red-500/20">
                    <ShieldAlert size={20} />
                  </div>
                  <h3 className="font-black text-white uppercase text-xs tracking-widest">Safety Check Panel</h3>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {safetyAlerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-[10px] font-bold leading-relaxed space-y-1.5 ${
                        alert.severity === 'Critical' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                        alert.severity === 'High' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                        'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="uppercase text-[8px] font-black tracking-widest">{alert.type} Alert</span>
                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                          alert.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                          alert.severity === 'High' ? 'bg-amber-500/20 text-amber-500' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>{alert.severity}</span>
                      </div>
                      <p className="text-zinc-300">{alert.message}</p>
                    </div>
                  ))}
                  {safetyAlerts.length === 0 && (
                    <div className="text-center py-8 text-zinc-500 font-bold uppercase tracking-widest text-[9px] flex flex-col items-center gap-2">
                      <CheckCircle size={24} className="text-emerald-500/40" />
                      No clinical safety warnings active
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (Prescription builder matrix) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-zinc-950/80 p-6 md:p-8 rounded-[48px] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-30"></div>

                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                      <Pill className="text-blue-500" size={24} /> Medication Matrix
                    </h3>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Specify detailed dosages and reminder frequencies</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-[9px] font-black uppercase tracking-widest text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Plus size={14} /> Add Medicine
                  </button>
                </div>

                <div className="space-y-6 relative z-10 text-left">
                  {medicines.map((med, index) => (
                    <div key={index} className="bg-white/5 p-6 rounded-[32px] border border-white/5 relative group hover:border-blue-500/20 transition-all space-y-4">
                      {/* Close button for row */}
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(index)}
                          className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl border border-red-500/10 transition-all"
                        >
                          <X size={14} />
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Medicine Autocomplete input */}
                        <div className="relative">
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Medicine Node *</label>
                          <input
                            placeholder="SEARCH NAME (e.g. Paracetamol)"
                            className="w-full p-4 bg-[#050505] border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest text-white outline-none focus:border-blue-500/30 transition-all placeholder:text-zinc-650"
                            required
                            value={med.name}
                            onFocus={() => setActiveSearchIndex(index)}
                            onChange={(e) => handleMedSearch(e.target.value, index)}
                          />

                          {/* Autocomplete dropdown */}
                          {activeSearchIndex === index && suggestions.length > 0 && (
                            <div className="absolute z-[100] left-0 right-0 mt-2 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                              {suggestions.map((sug, i) => (
                                <div
                                  key={i}
                                  onClick={() => handleSelectSuggestion(sug, index)}
                                  className="p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 text-left"
                                >
                                  <div className="flex justify-between items-start">
                                    <p className="text-[10px] font-black text-white uppercase">{sug.brandName} <span className="text-zinc-500">({sug.genericName})</span></p>
                                    <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 text-[8px] font-black uppercase">{sug.dosageForm}</span>
                                  </div>
                                  <div className="flex justify-between items-center mt-2 text-[8px] font-bold text-zinc-500">
                                    <span>Uses: {sug.commonUses}</span>
                                    <span className="text-zinc-400 shrink-0">{sug.strength} • {sug.manufacturer}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Dosage */}
                        <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Dosage Volume *</label>
                          <input
                            placeholder="e.g. 1 tab, 5ml"
                            className="w-full p-4 bg-[#050505] border border-white/5 rounded-2xl text-xs font-black text-white outline-none placeholder:text-zinc-650"
                            required
                            value={med.dosage}
                            onChange={(e) => handleMedFieldChange(index, 'dosage', e.target.value)}
                          />
                        </div>

                        {/* Frequency Preset */}
                        <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Frequency Preset</label>
                          <select
                            value={med.frequency}
                            onChange={(e) => handleMedFieldChange(index, 'frequency', e.target.value)}
                            className="w-full p-4 bg-[#050505] border border-white/5 rounded-2xl text-xs font-black text-white outline-none cursor-pointer"
                          >
                            <option value="1-0-1" className="bg-zinc-950">1-0-1 (Morning & Night)</option>
                            <option value="1-1-1" className="bg-zinc-950">1-1-1 (Thrice Daily)</option>
                            <option value="1-0-0" className="bg-zinc-950">1-0-0 (Morning Only)</option>
                            <option value="0-0-1" className="bg-zinc-950">0-0-1 (Night Only)</option>
                            <option value="Custom" className="bg-zinc-950">Custom Schedule</option>
                          </select>
                        </div>
                      </div>

                      {/* Display autofilled pharmacology details */}
                      {med.genericName && (
                        <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl flex flex-wrap gap-4 text-[9px] font-bold text-zinc-500">
                          <p><span className="text-zinc-600 uppercase tracking-widest text-[8px] font-black">Generic:</span> {med.genericName}</p>
                          <p><span className="text-zinc-600 uppercase tracking-widest text-[8px] font-black">Strength:</span> {med.strength}</p>
                          <p><span className="text-zinc-600 uppercase tracking-widest text-[8px] font-black">Mfg:</span> {med.manufacturer}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Food Instruction */}
                        <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Food Instruction</label>
                          <div className="flex gap-2">
                            {['Before Food', 'After Food', 'With Food'].map(foodOpt => (
                              <button
                                key={foodOpt}
                                type="button"
                                onClick={() => handleMedFieldChange(index, 'foodInstruction', foodOpt)}
                                className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                                  med.foodInstruction === foodOpt
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    : 'bg-[#050505] border border-white/5 text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                {foodOpt.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Duration *</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="w-16 p-4 bg-[#050505] border border-white/5 rounded-2xl text-xs font-black text-center text-white outline-none"
                              required
                              min="1"
                              value={med.durationValue}
                              onChange={(e) => handleMedFieldChange(index, 'durationValue', e.target.value)}
                            />
                            <select
                              value={med.durationUnit}
                              onChange={(e) => handleMedFieldChange(index, 'durationUnit', e.target.value)}
                              className="flex-1 p-4 bg-[#050505] border border-white/5 rounded-2xl text-xs font-black text-white outline-none cursor-pointer"
                            >
                              <option value="Days" className="bg-zinc-950">Days</option>
                              <option value="Weeks" className="bg-zinc-950">Weeks</option>
                              <option value="Months" className="bg-zinc-950">Months</option>
                            </select>
                          </div>
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Total Quantity *</label>
                          <input
                            type="number"
                            className="w-full p-4 bg-[#050505] border border-white/5 rounded-2xl text-xs font-black text-white outline-none"
                            required
                            min="1"
                            value={med.quantity}
                            onChange={(e) => handleMedFieldChange(index, 'quantity', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Schedule details & Special instructions */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* Time Slots checkboxes */}
                        <div className="md:col-span-5 space-y-1">
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 block">Timetable Slots</label>
                          <div className="flex gap-2">
                            {[
                              { key: 'morning', label: 'Morning' },
                              { key: 'afternoon', label: 'Afternoon' },
                              { key: 'night', label: 'Night' }
                            ].map(slot => (
                              <button
                                key={slot.key}
                                type="button"
                                onClick={() => handleMedFieldChange(index, slot.key, !med[slot.key])}
                                className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                                  med[slot.key]
                                    ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400'
                                    : 'bg-[#050505] border border-white/5 text-zinc-500'
                                }`}
                              >
                                {slot.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Special Instructions */}
                        <div className="md:col-span-7">
                          <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Special Instructions</label>
                          <input
                            placeholder="e.g. Take with warm water, avoid dairy"
                            className="w-full p-3.5 bg-[#050505] border border-white/5 rounded-2xl text-xs font-bold text-zinc-300 outline-none placeholder:text-zinc-700"
                            value={med.specialInstructions}
                            onChange={(e) => handleMedFieldChange(index, 'specialInstructions', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional Clinical Advice */}
                <div className="mt-8 border-t border-white/5 pt-8 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Clinical Advice / Notes</label>
                      <textarea
                        rows="3"
                        placeholder="Dietary instructions, special care alerts..."
                        className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none font-bold text-xs text-zinc-300 focus:border-blue-500/30 transition-all resize-none placeholder:text-zinc-650"
                        value={advice}
                        onChange={(e) => setAdvice(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Follow-Up Date</label>
                      <input
                        type="date"
                        className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none font-bold text-xs text-zinc-300 focus:border-blue-500/30 transition-all cursor-pointer"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="mt-10 flex justify-end gap-4 border-t border-white/5 pt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setDiagnosis('');
                      setAdvice('');
                      setFollowUpDate('');
                      setMedicines([{
                        name: '',
                        genericName: '',
                        brandName: '',
                        strength: '',
                        dosageForm: 'Tablet',
                        manufacturer: '',
                        dosage: '1 tab',
                        frequency: '1-0-1',
                        foodInstruction: 'After Food',
                        durationValue: 5,
                        durationUnit: 'Days',
                        morning: true,
                        afternoon: false,
                        night: true,
                        specialInstructions: '',
                        quantity: 10
                      }]);
                    }}
                    className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all active:scale-95"
                  >
                    Clear Matrix
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-[9px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/25 rounded-2xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                    {loading ? 'Dispatched Node...' : 'Issue Digital Prescription'}
                  </button>
                </div>
              </div>
            </div>

          </form>
        </main>
      </div>

      {/* Save Template Dialog */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 animate-in fade-in duration-200 print:hidden">
          <div className="bg-zinc-950 border border-white/10 max-w-md w-full rounded-[40px] p-8 space-y-6 shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/15 rounded-full blur-3xl"></div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Save Rx Template</h3>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Configure preset prescription protocol nodes</p>
            </div>

            <form onSubmit={handleSaveAsTemplate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Template Protocol Name *</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Cough and Fever Protocol"
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/5 rounded-2xl outline-none font-bold text-xs text-white focus:border-blue-500/30 transition-all"
                  required
                />
              </div>

              <div className="flex gap-4 border-t border-white/5 pt-6 mt-4">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E-Prescription Letter Modal Preview (Screen Only) */}
      {showLetterModal && issuedPrescription && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 animate-in fade-in duration-200 print:hidden">
          <div className="bg-zinc-950 border border-white/10 max-w-4xl w-full rounded-[48px] p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden text-left flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Electronic Prescription Console</h3>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Digital Care Node authorization summary</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={triggerPrint}
                  className="px-4 py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 shadow-md shadow-blue-500/10 flex items-center gap-1.5 active:scale-95"
                >
                  <Printer size={12} /> Print / Download PDF
                </button>
                <button
                  onClick={() => setShowLetterModal(false)}
                  className="px-4 py-2 bg-white/5 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
                >
                  Close Console
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-zinc-900/50 rounded-3xl border border-white/5 space-y-8">
              {/* Paper letterhead */}
              <div className="bg-white text-zinc-800 p-8 rounded-2xl shadow-xl space-y-6 font-sans">
                <div className="border-b-2 border-zinc-200 pb-4 mb-6 flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-extrabold uppercase text-blue-600 tracking-tight">MediConsult Diagnostics</h4>
                    <p className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-widest mt-0.5">Clinical Authorization Link</p>
                  </div>
                  <div className="text-right text-[10px] text-zinc-500">
                    <p className="font-bold">Reg Number: <span className="text-zinc-800 font-extrabold">{issuedPrescription.doctorRegNo}</span></p>
                    <p>Date: {new Date(issuedPrescription.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px] border-b border-zinc-150 pb-4">
                  <div>
                    <p className="font-black text-zinc-400 uppercase text-[8px] tracking-widest">Consulting Specialist</p>
                    <p className="font-bold text-zinc-800 mt-1">{user?.name}</p>
                    <p className="text-zinc-500">{profile?.specialization || 'Chief Consultant'}</p>
                  </div>
                  <div>
                    <p className="font-black text-zinc-400 uppercase text-[8px] tracking-widest">Patient Identity</p>
                    <p className="font-bold text-zinc-800 mt-1">{patientName || 'Patient Node'}</p>
                    <p className="text-zinc-500">Patient ID: {issuedPrescription.patientId}</p>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-700">
                  <p className="font-bold text-zinc-400 uppercase text-[8px] tracking-wider mb-1">Diagnosis Context:</p>
                  <p className="font-extrabold text-zinc-800">{issuedPrescription.diagnosis}</p>
                </div>

                <div className="space-y-4">
                  <p className="font-bold text-zinc-400 uppercase text-[8px] tracking-wider border-b border-zinc-100 pb-1">Medication Schedule Matrix:</p>
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="border-b border-zinc-100 text-gray-400 font-bold uppercase text-[8px] tracking-wider">
                        <th className="py-2">Medication</th>
                        <th className="py-2">Dosage</th>
                        <th className="py-2">Frequency</th>
                        <th className="py-2">Timing</th>
                        <th className="py-2">Duration</th>
                        <th className="py-2 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-bold text-gray-800">
                      {issuedPrescription.medicines.map((med, idx) => (
                        <tr key={idx}>
                          <td className="py-3">
                            <p className="font-extrabold text-blue-600 uppercase">{med.name}</p>
                            {med.genericName && <p className="text-[8px] text-gray-400 font-normal italic mt-0.5">({med.genericName})</p>}
                            {med.specialInstructions && <p className="text-[8px] text-red-500 font-bold mt-1">* {med.specialInstructions}</p>}
                          </td>
                          <td className="py-3">{med.dosage}</td>
                          <td className="py-3 uppercase">{med.frequency}</td>
                          <td className="py-3">{med.foodInstruction}</td>
                          <td className="py-3">{med.durationValue} {med.durationUnit}</td>
                          <td className="py-3 text-right">{med.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {issuedPrescription.advice && (
                  <div className="text-[10px] text-zinc-600 bg-zinc-50 p-4 rounded-xl border border-zinc-150">
                    <p className="font-bold text-zinc-800 uppercase text-[8px] tracking-wider mb-1">Clinical Advice directives:</p>
                    <p>{issuedPrescription.advice}</p>
                  </div>
                )}

                <div className="border-t border-zinc-150 pt-4 flex justify-between items-center text-[9px] text-zinc-400">
                  <p>QR Code Data: {issuedPrescription.qrCodeData.slice(0, 40)}...</p>
                  <p>Digital Stamp: AUTHORIZED_BY_DR_NARESH_TREHAN</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WritePrescription;
