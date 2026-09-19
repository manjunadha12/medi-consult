import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import useStore from '../../store/useStore';
import api from '../../utils/api';
import {
  Building2, MapPin, Phone, Clock, ShieldCheck, Stethoscope,
  Calendar, Check, ChevronRight, ArrowLeft, Search, Filter,
  Upload, FileText, AlertCircle, Sparkles, Star, Award,
  CheckCircle, QrCode, Download, Printer, Loader2, X, Sun, Moon, Info,
  HeartPulse, Activity, Navigation
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const GoToHospital = () => {
  const { user, theme } = useStore();
  const navigate = useNavigate();

  // Wizard Step: 1 = Hospital Selection, 2 = Doctor Selection, 3 = Schedule & Clinical Form, 4 = Confirmation & Slip
  const [currentStep, setCurrentStep] = useState(1);

  // Search & Filter State
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  // Selection State
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Date Logic: Next Day Auto-Default
  const getNextDayDate = (daysAhead = 1) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const tomorrowStr = getNextDayDate(1);

  // Form State
  const [formData, setFormData] = useState({
    patientName: user?.name || '',
    patientId: user?.patientId || user?.userId || 'PAT1001',
    patientPhone: user?.phone || '+91 98765 43210',
    patientEmail: user?.email || '',
    appointmentDate: tomorrowStr,
    appointmentTime: '10:00 AM',
    appointmentType: 'General Consultation',
    reasonForVisit: '',
    symptoms: ''
  });

  const [uploadedReports, setUploadedReports] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  // Time Slots (30 min intervals)
  const morningSlots = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
    '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM'
  ];

  const afternoonSlots = [
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM', '07:00 PM'
  ];

  const appointmentTypes = [
    { type: 'General Consultation', desc: 'Routine checkup & preliminary clinical diagnosis' },
    { type: 'Specialist Consultation', desc: 'In-depth consultation with senior department consultant' },
    { type: 'Follow-up', desc: 'Review of previous hospital treatment or surgical recovery' },
    { type: 'Diagnostic Test', desc: 'Direct referral for lab, CT/MRI scan, or X-ray evaluation' },
    { type: 'Procedure / Treatment', desc: 'Daycare procedure, therapy, or scheduled intervention' },
    { type: 'Emergency Guidance', desc: 'Expedited hospital arrival for urgent medical symptoms' }
  ];

  useEffect(() => {
    fetchHospitals();
  }, [selectedCity, selectedDeptFilter, emergencyOnly]);

  const fetchHospitals = async () => {
    try {
      setLoadingHospitals(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCity !== 'All') params.city = selectedCity;
      if (selectedDeptFilter !== 'All') params.department = selectedDeptFilter;
      if (emergencyOnly) params.emergencyOnly = 'true';

      const res = await api.get('/offline-appointments/hospitals', { params });
      if (res.data?.success) {
        setHospitals(res.data.hospitals || []);
      }
    } catch (err) {
      console.error('[FETCH_HOSPITALS_ERR]', err);
      toast.error('Failed to load accredited hospital registry');
    } finally {
      setLoadingHospitals(false);
    }
  };

  const handleSelectHospital = async (hosp) => {
    setSelectedHospital(hosp);
    setSelectedDepartment(hosp.departments?.[0] || 'General Medicine');
    setCurrentStep(2);
    fetchDoctorsForHospital(hosp.hospitalId || hosp.hospitalName, hosp.departments?.[0]);
  };

  const fetchDoctorsForHospital = async (hospId, dept) => {
    try {
      setLoadingDoctors(true);
      const res = await api.get('/offline-appointments/doctors', {
        params: { hospitalId: hospId, department: dept }
      });
      if (res.data?.success) {
        setAvailableDoctors(res.data.doctors || []);
        if (res.data.doctors?.length > 0) {
          setSelectedDoctor(res.data.doctors[0]);
        }
      }
    } catch (err) {
      console.error('[FETCH_DOCS_ERR]', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleDepartmentChange = (dept) => {
    setSelectedDepartment(dept);
    fetchDoctorsForHospital(selectedHospital?.hospitalId || selectedHospital?.hospitalName, dept);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedReports(prev => [...prev, ...files]);
    toast.success(`${files.length} report node(s) staged`);
  };

  const removeFile = (index) => {
    setUploadedReports(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedHospital) return toast.error('Hospital selection required');
    if (!formData.reasonForVisit.trim()) return toast.error('Please specify the reason for your visit');

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('patientName', formData.patientName);
      data.append('patientPhone', formData.patientPhone);
      data.append('patientEmail', formData.patientEmail);
      data.append('hospitalId', selectedHospital.hospitalId);
      data.append('hospitalName', selectedHospital.hospitalName);
      data.append('hospitalAddress', selectedHospital.address + ', ' + selectedHospital.city);
      data.append('hospitalContact', selectedHospital.contactNumber);
      data.append('doctorId', selectedDoctor?.doctorId || 'DOC-DUTY');
      data.append('doctorName', selectedDoctor?.name || 'Chief Duty Consultant');
      data.append('department', selectedDepartment);
      data.append('specialization', selectedDoctor?.specialization || selectedDepartment);
      data.append('appointmentDate', formData.appointmentDate);
      data.append('appointmentTime', formData.appointmentTime);
      data.append('appointmentType', formData.appointmentType);
      data.append('reasonForVisit', formData.reasonForVisit);
      data.append('symptoms', formData.symptoms || formData.reasonForVisit);
      data.append('estimatedFee', selectedDoctor?.consultationFee || selectedHospital?.consultationFee || 500);

      uploadedReports.forEach(file => {
        data.append('medicalReports', file);
      });

      const res = await api.post('/offline-appointments/book', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setConfirmedAppointment(res.data.appointment);
        setCurrentStep(4);
        toast.success('Offline Hospital Appointment Confirmed!');
      }
    } catch (err) {
      console.error('[BOOKING_ERR]', err);
      toast.error(err.response?.data?.message || 'Failed to initialize offline appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const allCities = ['All', 'Chennai', 'Gurugram', 'Bengaluru', 'New Delhi', 'Hyderabad', 'Mumbai'];

  return (
    <div className={`flex min-h-screen transition-colors duration-500 text-left neural-grid pb-24 ${
      theme === 'dark' ? 'bg-[#050505] text-zinc-300' : 'bg-[#F8FAFC] text-slate-700'
    }`}>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Navbar />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-4 sm:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Stepper Navigation Header */}
            <header className="space-y-4 pb-6 border-b border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <button
                    onClick={() => {
                      if (currentStep > 1 && currentStep < 4) setCurrentStep(currentStep - 1);
                      else navigate('/patient/dashboard');
                    }}
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 mb-2 transition-colors"
                  >
                    <ArrowLeft size={14} /> {currentStep === 1 ? 'Back to Dashboard' : 'Previous Step'}
                  </button>
                  <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    🏥 Go to Hospital
                  </h1>
                  <p className="text-zinc-500 uppercase text-[10px] font-black tracking-widest mt-1">
                    Book In-Person Hospital Consultation, Diagnostics & Treatment
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/patient/offline-appointments')}
                    className="px-5 py-2.5 rounded-2xl bg-blue-600/10 hover:bg-blue-600 hover:text-white border border-blue-500/20 text-blue-400 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
                  >
                    <FileText size={14} /> My Offline Visits
                  </button>
                </div>
              </div>

              {/* Step Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { step: 1, label: '1. Select Hospital', icon: Building2 },
                  { step: 2, label: '2. Select Specialist', icon: Stethoscope },
                  { step: 3, label: '3. Schedule & Form', icon: Calendar },
                  { step: 4, label: '4. QR Check-In Slip', icon: QrCode }
                ].map((s) => {
                  const isActive = currentStep === s.step;
                  const isDone = currentStep > s.step;
                  return (
                    <div
                      key={s.step}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                        isActive
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20'
                          : isDone
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : (theme === 'dark' ? 'bg-white/5 border-white/5 text-zinc-500' : 'bg-slate-100 border-slate-200 text-slate-400')
                      }`}
                    >
                      <s.icon size={16} className={isActive ? 'text-white' : (isDone ? 'text-emerald-400' : 'opacity-60')} />
                      <span className="text-[10px] font-black uppercase tracking-wider truncate">{s.label}</span>
                      {isDone && <Check size={14} className="ml-auto text-emerald-400" />}
                    </div>
                  );
                })}
              </div>
            </header>

            {/* ================= STEP 1: SELECT HOSPITAL ================= */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Search & Filter Bar */}
                <div className={`p-6 rounded-[36px] border ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'} shadow-xl space-y-4`}>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Search hospital name, city, state, pin code, or specialty..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchHospitals()}
                        className={`w-full pl-11 pr-4 py-3.5 rounded-2xl text-xs font-bold outline-none border transition-all ${
                          theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    <button
                      onClick={fetchHospitals}
                      className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0"
                    >
                      Search Facilities
                    </button>
                  </div>

                  {/* Filter Chips */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mr-1">City:</span>
                      {allCities.map(city => (
                        <button
                          key={city}
                          onClick={() => setSelectedCity(city)}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                            selectedCity === city
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setEmergencyOnly(!emergencyOnly)}
                      className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border flex items-center gap-2 ${
                        emergencyOnly
                          ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                      }`}
                    >
                      <HeartPulse size={12} /> 24x7 Emergency Ready
                    </button>
                  </div>
                </div>

                {/* Hospital Cards Grid */}
                {loadingHospitals ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 size={40} className="animate-spin text-blue-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Scanning Hospital Registry...</p>
                  </div>
                ) : hospitals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {hospitals.map((hosp) => (
                      <div
                        key={hosp.hospitalId || hosp._id}
                        className={`rounded-[36px] border p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-blue-500/50 group ${
                          theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="space-y-4">
                          {/* Image & Header */}
                          <div className="relative h-44 rounded-2xl overflow-hidden mb-4 border border-white/5">
                            <img
                              src={hosp.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80'}
                              alt={hosp.hospitalName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            
                            {hosp.isEmergencyAvailable && (
                              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-rose-600 text-white text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                                <HeartPulse size={10} /> 24x7 Emergency Trauma
                              </div>
                            )}

                            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-amber-400 text-[9px] font-black flex items-center gap-1">
                              <Star size={12} fill="currentColor" /> {hosp.rating || 4.9}
                            </div>

                            <div className="absolute bottom-3 left-3 right-3">
                              <h3 className="text-lg font-black text-white uppercase tracking-tight truncate">
                                {hosp.hospitalName}
                              </h3>
                              <p className="text-[9px] font-bold text-zinc-300 flex items-center gap-1 mt-0.5">
                                <MapPin size={11} className="text-rose-400" /> {hosp.city}, {hosp.state} • {hosp.distanceKm || 3.2} km away
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                            {hosp.address}, {hosp.pincode}
                          </p>

                          {/* Departments Tags */}
                          <div className="space-y-1.5">
                            <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Active Specialty Wings:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {hosp.departments?.slice(0, 4).map((d, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[8px] font-bold uppercase tracking-tight">
                                  {d}
                                </span>
                              ))}
                              {hosp.departments?.length > 4 && (
                                <span className="px-2 py-1 rounded-lg bg-white/5 text-zinc-400 text-[8px] font-bold">
                                  +{hosp.departments.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Key Specs */}
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                            <div className="p-2.5 rounded-xl bg-white/5">
                              <p className="text-[7px] font-black uppercase text-zinc-500">OPD Timings</p>
                              <p className="text-[9px] font-bold text-zinc-300 mt-0.5 truncate">{hosp.timings || '08:00 AM - 08:00 PM'}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/5">
                              <p className="text-[7px] font-black uppercase text-zinc-500">Contact / Helpline</p>
                              <p className="text-[9px] font-bold text-emerald-400 mt-0.5">{hosp.contactNumber}</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-[8px] font-black uppercase text-zinc-500">OPD Consultation Fee</span>
                            <p className="text-base font-black text-white">₹{hosp.consultationFee || 500}</p>
                          </div>

                          <button
                            onClick={() => handleSelectHospital(hosp)}
                            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95"
                          >
                            <span>Select Hospital</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <Building2 size={48} className="mx-auto text-zinc-500 opacity-40" />
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400">No accredited hospitals match your search criteria</p>
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedCity('All'); setSelectedDeptFilter('All'); setEmergencyOnly(false); }}
                      className="px-6 py-2.5 rounded-xl bg-white/10 text-white text-[9px] font-black uppercase tracking-widest"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 2: SELECT DOCTOR & DEPARTMENT ================= */}
            {currentStep === 2 && selectedHospital && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Hospital Header Banner */}
                <div className={`p-6 rounded-[36px] border ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'} shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">Selected Facility</span>
                      <h2 className={`text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {selectedHospital.hospitalName}
                      </h2>
                      <p className="text-xs text-zinc-400">{selectedHospital.address}, {selectedHospital.city}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300"
                  >
                    Change Hospital
                  </button>
                </div>

                {/* Department Selector */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                    <Activity size={14} /> Select Clinical Department
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedHospital.departments?.map((dept) => (
                      <button
                        key={dept}
                        onClick={() => handleDepartmentChange(dept)}
                        className={`px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                          selectedDepartment === dept
                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Doctors List */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                    <Stethoscope size={14} /> Available Senior Consultants ({availableDoctors.length})
                  </h3>

                  {loadingDoctors ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                      <Loader2 size={36} className="animate-spin text-purple-500" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Checking Specialist Availability...</p>
                    </div>
                  ) : availableDoctors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {availableDoctors.map((doc) => {
                        const isSelected = selectedDoctor?.doctorId === doc.doctorId;
                        return (
                          <div
                            key={doc.doctorId || doc._id}
                            onClick={() => setSelectedDoctor(doc)}
                            className={`p-6 rounded-[32px] border transition-all cursor-pointer flex flex-col justify-between group ${
                              isSelected
                                ? 'bg-purple-600/15 border-purple-500/60 shadow-xl shadow-purple-600/10'
                                : (theme === 'dark' ? 'bg-[#0A0A0A] border-white/10 hover:border-purple-500/40' : 'bg-white border-slate-200 hover:border-purple-500/40')
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg border border-purple-400/30">
                                {doc.name?.charAt(0) || 'D'}
                              </div>

                              <div className="space-y-1 overflow-hidden">
                                <div className="flex items-center gap-2">
                                  <h4 className={`text-base font-black uppercase tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {doc.name}
                                  </h4>
                                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                                </div>
                                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                                  {doc.specialization}
                                </p>
                                <p className="text-[8px] font-bold text-zinc-400">
                                  {doc.experience || 15}+ Years Institutional Experience
                                </p>
                              </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                              <div>
                                <span className="text-[7px] font-black uppercase text-zinc-500">Consultation Fee</span>
                                <p className="text-sm font-black text-white">₹{doc.consultationFee || selectedHospital.consultationFee || 500}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-[8px] font-black flex items-center gap-1 border border-amber-500/20">
                                  <Star size={10} fill="currentColor" /> 4.9 ({doc.reviewsCount || 120})
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDoctor(doc);
                                    setCurrentStep(3);
                                  }}
                                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[9px] uppercase tracking-widest transition-all"
                                >
                                  Select Doctor
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/5 text-center space-y-2">
                      <p className="text-xs font-bold text-zinc-400 uppercase">No specific doctor assigned for this department. Duty senior consultant will be assigned.</p>
                      <button
                        onClick={() => {
                          setSelectedDoctor({
                            doctorId: 'DOC-DUTY-CONSULTANT',
                            name: `Duty Senior Consultant (${selectedDepartment})`,
                            specialization: selectedDepartment,
                            consultationFee: selectedHospital.consultationFee || 500
                          });
                          setCurrentStep(3);
                        }}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
                      >
                        Proceed with Department Consultant
                      </button>
                    </div>
                  )}
                </div>

                {selectedDoctor && (
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/30 transition-all flex items-center gap-3 active:scale-95"
                    >
                      <span>Proceed to Schedule & Form</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 3: SCHEDULE & CLINICAL FORM ================= */}
            {currentStep === 3 && selectedHospital && selectedDoctor && (
              <form onSubmit={handleConfirmBooking} className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Hospital & Doctor Summary */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className={`p-6 rounded-[36px] border shadow-2xl ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'} space-y-5`}>
                      <span className="text-[8px] font-black uppercase tracking-[0.25em] text-blue-400">Hospital Consultation Summary</span>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <p className="text-[7px] font-black text-zinc-500 uppercase">Hospital Node</p>
                        <h4 className="text-sm font-black text-white uppercase">{selectedHospital.hospitalName}</h4>
                        <p className="text-[9px] text-zinc-400">{selectedHospital.address}, {selectedHospital.city}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <p className="text-[7px] font-black text-zinc-500 uppercase">Assigned Specialist</p>
                        <h4 className="text-sm font-black text-white uppercase">{selectedDoctor.name}</h4>
                        <p className="text-[9px] text-purple-400 font-bold">{selectedDepartment}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                        <div>
                          <p className="text-[7px] font-black text-zinc-400 uppercase">Estimated Consultation Fee</p>
                          <p className="text-base font-black text-emerald-400">₹{selectedDoctor.consultationFee || selectedHospital.consultationFee || 500}</p>
                        </div>
                        <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[7px] font-black uppercase">Pay at Hospital</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[8px] text-zinc-400 space-y-1">
                        <p className="font-bold text-zinc-300 uppercase flex items-center gap-1.5"><Info size={12} className="text-blue-400" /> In-Person Visit Protocol</p>
                        <p>• Please report 15 minutes prior to your scheduled slot at OPD Reception.</p>
                        <p>• Present the digital QR Slip generated upon confirmation.</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Form Fields */}
                  <div className="lg:col-span-8 space-y-6">
                    <div className={`p-8 rounded-[40px] border shadow-2xl ${theme === 'dark' ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200'} space-y-6`}>
                      
                      {/* Patient Auto-Filled Information */}
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                          <UserIcon size={14} /> Patient Registration Node
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 ml-1">Patient Name</label>
                            <input
                              type="text"
                              required
                              value={formData.patientName}
                              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                              className={`w-full p-3.5 rounded-xl text-xs font-bold outline-none border transition-all ${
                                theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 ml-1">Patient ID / Node</label>
                            <input
                              type="text"
                              readOnly
                              value={formData.patientId}
                              className={`w-full p-3.5 rounded-xl text-xs font-mono font-bold outline-none border opacity-70 ${
                                theme === 'dark' ? 'bg-zinc-900 border-white/10 text-zinc-400' : 'bg-slate-100 border-slate-200'
                              }`}
                            />
                          </div>

                          <div>
                            <label className="text-[8px] font-black uppercase text-zinc-400 ml-1">Contact Phone</label>
                            <input
                              type="tel"
                              required
                              value={formData.patientPhone}
                              onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                              className={`w-full p-3.5 rounded-xl text-xs font-bold outline-none border transition-all ${
                                theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Appointment Type Selection */}
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                          <Activity size={14} /> Purpose / Appointment Type
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {appointmentTypes.map((item) => (
                            <div
                              key={item.type}
                              onClick={() => setFormData({ ...formData, appointmentType: item.type })}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                formData.appointmentType === item.type
                                  ? 'bg-emerald-600/15 border-emerald-500 text-white shadow-lg'
                                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-black uppercase tracking-tight">{item.type}</p>
                                {formData.appointmentType === item.type && <Check size={14} className="text-emerald-400" />}
                              </div>
                              <p className="text-[8px] font-bold text-zinc-500 mt-0.5">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Date Selection */}
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                            <Calendar size={14} /> Select Appointment Date
                          </h3>
                          <span className="text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                            Starting from Tomorrow
                          </span>
                        </div>
                        <input
                          type="date"
                          required
                          min={tomorrowStr}
                          value={formData.appointmentDate}
                          onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                          className={`w-full p-4 rounded-2xl font-black text-sm outline-none border transition-all ${
                            theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'
                          }`}
                        />
                      </div>

                      {/* Time Slots (30 Min Granularity) */}
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                            <Clock size={14} /> Preferred Hospital Time Window
                          </h3>
                          <span className="text-[9px] font-mono font-bold text-purple-400">{formData.appointmentTime}</span>
                        </div>

                        {/* Morning */}
                        <div className="space-y-1.5">
                          <p className="text-[8px] font-black uppercase text-amber-400 flex items-center gap-1.5"><Sun size={11} /> Morning Schedule (08:00 AM - 12:30 PM)</p>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {morningSlots.map(slot => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setFormData({ ...formData, appointmentTime: slot })}
                                className={`py-2.5 px-2 rounded-xl text-[9px] font-mono font-bold uppercase transition-all border ${
                                  formData.appointmentTime === slot
                                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg'
                                    : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Afternoon / Evening */}
                        <div className="space-y-1.5 pt-2">
                          <p className="text-[8px] font-black uppercase text-indigo-400 flex items-center gap-1.5"><Moon size={11} /> Afternoon & Evening Schedule (02:00 PM - 07:00 PM)</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {afternoonSlots.map(slot => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setFormData({ ...formData, appointmentTime: slot })}
                                className={`py-2.5 px-2 rounded-xl text-[9px] font-mono font-bold uppercase transition-all border ${
                                  formData.appointmentTime === slot
                                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg'
                                    : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Reason & Symptoms */}
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div>
                          <label className="text-[8px] font-black uppercase text-zinc-400 ml-1">Reason for Hospital Visit *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g., Severe chest discomfort, knee ligament injury, follow-up after blood test"
                            value={formData.reasonForVisit}
                            onChange={(e) => setFormData({ ...formData, reasonForVisit: e.target.value })}
                            className={`w-full p-4 rounded-xl text-xs font-bold outline-none border transition-all ${
                              theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-[8px] font-black uppercase text-zinc-400 ml-1">Symptoms / Clinical Observations (Optional)</label>
                          <textarea
                            rows={3}
                            placeholder="Describe any specific symptoms, fever duration, pain location, or prior medications..."
                            value={formData.symptoms}
                            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                            className={`w-full p-4 rounded-xl text-xs font-medium outline-none border transition-all ${
                              theme === 'dark' ? 'bg-zinc-900 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Reports Upload */}
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <label className="text-[8px] font-black uppercase text-zinc-400 ml-1">Previous Medical Reports (PDF / Image)</label>
                        <div
                          onClick={() => document.getElementById('offline-reports-input').click()}
                          className="p-6 border-2 border-dashed border-white/10 hover:border-blue-500/40 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-white/5"
                        >
                          <Upload size={20} className="text-zinc-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Click to upload lab reports, ECG, or X-Ray</span>
                          <span className="text-[7px] text-zinc-500">Supported formats: PDF, PNG, JPG (Max 5 files)</span>
                          <input
                            id="offline-reports-input"
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </div>

                        {uploadedReports.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {uploadedReports.map((file, i) => (
                              <div key={i} className="px-3 py-1.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[8px] font-bold flex items-center gap-2">
                                <FileText size={12} />
                                <span className="truncate max-w-[150px]">{file.name}</span>
                                <button type="button" onClick={() => removeFile(i)} className="text-rose-400 hover:text-white"><X size={12} /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Submit Actions */}
                      <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
                        >
                          Cancel / Back
                        </button>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 py-4.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                        >
                          {submitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                          <span>Confirm Offline Hospital Appointment</span>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* ================= STEP 4: CONFIRMATION & QR SLIP ================= */}
            {currentStep === 4 && confirmedAppointment && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300 max-w-3xl mx-auto">
                
                {/* Success Header */}
                <div className="p-8 rounded-[40px] bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                    <CheckCircle size={32} />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    Offline Appointment Confirmed
                  </h2>
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">
                    Present this QR Slip at Hospital Reception for Instant Check-In
                  </p>
                </div>

                {/* Printable Slip Card */}
                <div id="printable-appointment-slip" className={`p-8 sm:p-10 rounded-[44px] border shadow-2xl space-y-8 ${
                  theme === 'dark' ? 'bg-[#0A0A0A] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-500">Official Hospital Consultation Slip</span>
                      <h3 className="text-2xl font-black tracking-tight mt-1">{confirmedAppointment.hospitalName}</h3>
                      <p className="text-[9px] text-zinc-400">{confirmedAppointment.hospitalAddress}</p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[8px] font-black uppercase text-zinc-400">Offline Appointment ID</span>
                      <p className="text-xl font-mono font-black text-emerald-400 uppercase tracking-wider">{confirmedAppointment.appointmentId}</p>
                    </div>
                  </div>

                  {/* QR Code & Patient Data Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    {/* QR Node */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white rounded-3xl shadow-xl">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(confirmedAppointment.qrCodePayload || confirmedAppointment.appointmentId)}`}
                        alt="Appointment QR Code"
                        className="w-40 h-40"
                      />
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-800 mt-2">RECEPTION SCAN PASS</p>
                    </div>

                    {/* Patient & Booking Details */}
                    <div className="md:col-span-8 space-y-3.5 text-left">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 rounded-xl">
                          <p className="text-[7px] font-black uppercase text-zinc-500">Patient Name</p>
                          <p className="text-xs font-black uppercase truncate">{confirmedAppointment.patientName}</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl">
                          <p className="text-[7px] font-black uppercase text-zinc-500">Patient ID</p>
                          <p className="text-xs font-mono font-bold">{confirmedAppointment.patientId}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 rounded-xl">
                          <p className="text-[7px] font-black uppercase text-zinc-500">Doctor / Specialist</p>
                          <p className="text-xs font-black uppercase truncate">{confirmedAppointment.doctorName}</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl">
                          <p className="text-[7px] font-black uppercase text-zinc-500">Department</p>
                          <p className="text-xs font-black text-purple-400 uppercase truncate">{confirmedAppointment.department}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 rounded-xl">
                          <p className="text-[7px] font-black uppercase text-zinc-500">Appointment Date & Time</p>
                          <p className="text-xs font-black text-blue-400">
                            {new Date(confirmedAppointment.appointmentDate).toLocaleDateString()} at {confirmedAppointment.appointmentTime}
                          </p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl">
                          <p className="text-[7px] font-black uppercase text-zinc-500">Reporting Time</p>
                          <p className="text-xs font-black text-amber-400">15 Mins Prior ({confirmedAppointment.appointmentTime})</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 rounded-xl">
                          <p className="text-[7px] font-black uppercase text-zinc-500">Appointment Type</p>
                          <p className="text-[10px] font-bold uppercase">{confirmedAppointment.appointmentType}</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl">
                          <p className="text-[7px] font-black uppercase text-zinc-500">Estimated Fee</p>
                          <p className="text-xs font-black text-emerald-400">₹{confirmedAppointment.estimatedFee} (Pay at Counter)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-[8px] font-bold text-zinc-400 uppercase">
                      Helpline: {confirmedAppointment.hospitalContact || '+91 1800 200 4000'} • Carry valid ID proof
                    </p>

                    <div className="flex gap-3 w-full sm:w-auto">
                      <button
                        onClick={handlePrintSlip}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Printer size={14} /> Print / Download Slip
                      </button>

                      <button
                        onClick={() => navigate('/patient/offline-appointments')}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <FileText size={14} /> My Appointments
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default GoToHospital;
