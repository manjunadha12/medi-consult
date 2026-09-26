import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import {
  Search as SearchIcon, User as UserIcon, Stethoscope, Mail, Lock, Building, Landmark,
  Award, ArrowRight, Sparkles, Loader2, ShieldCheck as ShieldCheckIcon, Shield, Activity,
  Globe, Headphones, UserPlus, Plus, Users, Brain, Heart, Dna, FileText, Upload, Trash2, MapPin, Star, Info, CheckCircle, AlertCircle, X, ChevronRight, ChevronLeft
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../utils/firebase';
import logoImg from '../../logo.png';
import useStore from '../../store/useStore';
import { useJsApiLoader } from '@react-google-maps/api';
import { smartInstitutionSearch } from '../../utils/institutionMaster';

const libraries = ['places'];

const SPECIALIZATIONS = [
  { name: "Acupuncture Specialist", sub: "Pain management, chronic pain, muscle disorders using acupuncture" },
  { name: "Addiction Medicine Specialist", sub: "Alcohol, drug addiction, substance abuse treatment" },
  { name: "Allergist", sub: "Allergies, asthma, immune disorders" },
  { name: "Andrologist", sub: "Male infertility, reproductive health, erectile dysfunction" },
  { name: "Anesthesiologist", sub: "Anesthesia during surgery, pain management" },
  { name: "Ayurveda Doctor", sub: "Ayurvedic medicine and holistic treatment" },
  { name: "Bariatric Surgeon", sub: "Weight-loss surgery for obesity" },
  { name: "Blood Banking & Transfusion Specialist", sub: "Blood transfusion services and blood disorders" },
  { name: "Breast Surgeon", sub: "Breast diseases, breast cancer surgery" },
  { name: "Burn Surgeon", sub: "Burn injuries and reconstructive surgery" },
  { name: "Cardiologist", sub: "Heart diseases, chest pain, blood pressure, heart failure" },
  { name: "Cardiothoracic Surgeon", sub: "Heart and chest surgery" },
  { name: "Cardiac Electrophysiologist", sub: "Heart rhythm disorders, pacemakers" },
  { name: "Clinical Biochemist", sub: "Laboratory diagnosis using body fluids" },
  { name: "Clinical Geneticist", sub: "Genetic disorders and inherited diseases" },
  { name: "Clinical Immunologist", sub: "Immune system disorders" },
  { name: "Clinical Microbiologist", sub: "Bacterial, viral, fungal infection diagnosis" },
  { name: "Clinical Pharmacologist", sub: "Safe medication use and drug therapy" },
  { name: "Clinical Psychologist", sub: "Counseling, behavioral therapy, mental health" },
  { name: "Colorectal Surgeon", sub: "Colon, rectum, hemorrhoids" },
  { name: "Community Medicine Specialist", sub: "Public health and preventive healthcare" },
  { name: "Cornea Specialist", sub: "Corneal diseases and transplantation" },
  { name: "Cosmetic Surgeon", sub: "Cosmetic and aesthetic surgery" },
  { name: "Critical Care Specialist", sub: "ICU, ventilator, life-support care" },
  { name: "Dental Surgeon", sub: "Tooth extraction and oral surgery" },
  { name: "Dentist", sub: "Teeth, gums, oral health" },
  { name: "Dermatologist", sub: "Skin, hair, nails, acne, eczema" },
  { name: "Dermatopathologist", sub: "Skin disease diagnosis through laboratory testing" },
  { name: "Diabetologist", sub: "Diabetes management" },
  { name: "Dietitian", sub: "Clinical nutrition and diet planning" },
  { name: "Emergency Medicine Specialist", sub: "Emergency and trauma care" },
  { name: "Endocrinologist", sub: "Hormones, thyroid, diabetes" },
  { name: "Endodontist", sub: "Root canal treatment" },
  { name: "ENT Specialist (Otolaryngologist)", sub: "Ear, nose, throat, sinus disorders" },
  { name: "Family Medicine Physician", sub: "Healthcare for all ages" },
  { name: "Fertility Specialist (IVF)", sub: "Infertility and IVF treatment" },
  { name: "Forensic Pathologist", sub: "Cause of death and legal investigations" },
  { name: "Forensic Pathologist", sub: "Cause of death and legal investigations" },
  { name: "Gastroenterologist", sub: "Stomach, intestine, liver, pancreas diseases" },
  { name: "General Physician", sub: "Fever, cold, infections, diabetes, blood pressure" },
  { name: "General Surgeon", ph: "Hernia, appendix, gallbladder, abdominal surgery" },
  { name: "Genetic Counselor", sub: "Advice for inherited diseases" },
  { name: "Geriatrician", sub: "Healthcare for elderly people" },
  { name: "Glaucoma Specialist", sub: "Glaucoma diagnosis and treatment" },
  { name: "Gynecologist", sub: "Women's reproductive health" },
  { name: "Hand Surgeon", sub: "Hand, wrist, finger surgery" },
  { name: "Head & Neck Surgeon", sub: "Tumors and disorders of head and neck" },
  { name: "Hematologist", sub: "Blood disorders, anemia, leukemia" },
  { name: "Hematologist-Oncologist", sub: "Blood cancers and blood disorders" },
  { name: "Hepatologist", sub: "Liver diseases, hepatitis, cirrhosis" },
  { name: "Homeopathy Doctor", sub: "Homeopathic treatment" },
  { name: "Hyperbaric Medicine Specialist", sub: "Hyperbaric oxygen therapy" },
  { name: "Immunologist", sub: "Immune system diseases" },
  { name: "Infectious Disease Specialist", sub: "Viral, bacterial, fungal infections" },
  { name: "Internal Medicine Specialist", sub: "Adult diseases and chronic illness" },
  { name: "Interventional Cardiologist", sub: "Angioplasty, heart catheterization" },
  { name: "Interventional Radiologist", sub: "Image-guided minimally invasive procedures" },
  { name: "Lifestyle Medicine Specialist", sub: "Lifestyle-based disease prevention" },
  { name: "Medical Geneticist", sub: "Genetic disorders" },
  { name: "Medical Oncologist", sub: "Cancer treatment using medicines" },
  { name: "Neonatologist", sub: "Newborn babies and NICU care" },
  { name: "Nephrologist", sub: "Kidney diseases, dialysis" },
  { name: "Neurologist", sub: "Brain, spinal cord, nerves, stroke, epilepsy" },
  { name: "Neurophysician", sub: "Nervous system disorders" },
  { name: "Neurosurgeon", sub: "Brain and spine surgery" },
  { name: "Nuclear Medicine Specialist", sub: "PET scans and radioactive imaging" },
  { name: "Nutritionist", sub: "Healthy eating and nutrition guidance" },
  { name: "Obstetrician", sub: "Pregnancy, childbirth, prenatal care" },
  { name: "Obstetrician & Gynecologist (OB-GYN)", sub: "Women's health and pregnancy" },
  { name: "Occupational Medicine Specialist", sub: "Workplace health and occupational diseases" },
  { name: "Occupational Therapist", sub: "Daily living rehabilitation" },
  { name: "Oncologist", sub: "Cancer diagnosis and treatment" },
  { name: "Ophthalmologist", sub: "Eye diseases and surgery" },
  { name: "Optometrist", sub: "Vision testing and eyeglasses" },
  { name: "Oral & Maxillofacial Surgeon", sub: "Jaw, face, wisdom tooth surgery" },
  { name: "Oral Medicine Specialist", sub: "Oral diseases" },
  { name: "Oral Pathologist", sub: "Diagnosis of oral diseases" },
  { name: "Orthodontist", sub: "Braces and teeth alignment" },
  { name: "Orthopedic Surgeon", sub: "Bones, joints, fractures, arthritis" },
  { name: "Pain Management Specialist", sub: "Chronic pain treatment" },
  { name: "Palliative Care Specialist", sub: "Comfort care for serious illness" },
  { name: "Pathologist", sub: "Laboratory diagnosis using tissue and blood" },
  { name: "Pediatric Cardiologist", sub: "Heart diseases in children" },
  { name: "Pediatric Dentist", sub: "Children's dental care" },
  { name: "Pediatric Dermatologist", sub: "Skin diseases in children" },
  { name: "Pediatric Endocrinologist", sub: "Hormonal disorders in children" },
  { name: "Pediatric Gastroenterologist", sub: "Digestive diseases in children" },
  { name: "Pediatric Hematologist", sub: "Blood disorders in children" },
  { name: "Pediatric Nephrologist", sub: "Kidney diseases in children" },
  { name: "Pediatric Neurologist", sub: "Brain and nerve disorders in children" },
  { name: "Pediatric Oncologist", sub: "Childhood cancers" },
  { name: "Pediatric Ophthalmologist", sub: "Eye diseases in children" },
  { name: "Pediatric Orthopedic Surgeon", sub: "Bone disorders in children" },
  { name: "Pediatric Pulmonologist", sub: "Lung diseases in children" },
  { name: "Pediatric Surgeon", sub: "Surgery for children" },
  { name: "Pediatric Urologist", sub: "Urinary disorders in children" },
  { name: "Pediatrician", sub: "Healthcare for infants, children, adolescents" },
  { name: "Periodontist", sub: "Gum diseases and dental implants" },
  { name: "Physiatrist", sub: "Physical rehabilitation medicine" },
  { name: "Physiotherapist", sub: "Physical therapy and rehabilitation" },
  { name: "Plastic Surgeon", sub: "Cosmetic and reconstructive surgery" },
  { name: "Podiatrist", sub: "Foot and ankle disorders" },
  { name: "Preventive Medicine Specialist", sub: "Disease prevention and health screening" },
  { name: "Proctologist", sub: "Rectum and anal disorders" },
  { name: "Prosthodontist", sub: "Artificial teeth, crowns, dentures" },
  { name: "Psychiatrist", sub: "Mental health disorders" },
  { name: "Psychologist", sub: "Counseling and mental wellness" },
  { name: "Pulmonologist", sub: "Lung diseases, asthma, COPD" },
  { name: "Radiation Oncologist", sub: "Cancer treatment using radiation" },
  { name: "Radiologist", sub: "X-ray, CT, MRI, ultrasound reporting" },
  { name: "Regenerative Medicine Specialist", sub: "Stem cell and tissue regeneration" },
  { name: "Reproductive Endocrinologist", sub: "Fertility hormones and reproductive disorders" },
  { name: "Retina Specialist", sub: "Retina diseases and surgery" },
  { name: "Rheumatologist", sub: "Arthritis and autoimmune diseases" },
  { name: "Sexologist", sub: "Sexual health and dysfunction" },
  { name: "Siddha Doctor", sub: "Siddha traditional medicine" },
  { name: "Sleep Medicine Specialist", sub: "Sleep apnea, insomnia" },
  { name: "Speech Therapist", sub: "Speech, language, swallowing disorders" },
  { name: "Spine Surgeon", sub: "Spine surgery and spinal disorders" },
  { name: "Sports Medicine Specialist", sub: "Sports injuries and athlete care" },
  { name: "Surgical Oncologist", sub: "Cancer surgery" },
  { name: "Telemedicine Specialist", sub: "Online medical consultation" },
  { name: "Thoracic Surgeon", sub: "Lung and chest surgery" },
  { name: "Transplant Surgeon", sub: "Organ transplantation" },
  { name: "Trauma Surgeon", sub: "Emergency injury surgery" },
  { name: "Travel Medicine Specialist", sub: "Vaccination and travel-related diseases" },
  { name: "Trichologist", sub: "Hair and scalp disorders" },
  { name: "Unani Doctor", sub: "Unani traditional medicine" },
  { name: "Urologist", sub: "Urinary tract, kidney stones, prostate, male reproductive system" },
  { name: "Vascular Surgeon", sub: "Blood vessel diseases and surgery" },
  { name: "Venereologist", sub: "Sexually transmitted infections (STIs)" },
  { name: "Women's Health Specialist", sub: "Women's preventive and reproductive healthcare" },
  { name: "Wound Care Specialist", sub: "Chronic wounds, diabetic foot ulcers" },
  { name: "Yoga Medicine Specialist", sub: "Therapeutic yoga and wellness" }
];

const MANDATORY_DOCS = [
  "Medical Registration Certificate",
  "Medical Council Registration Certificate",
  "Medical Degree Certificate",
  "Government ID",
  "Hospital Employee ID Card",
  "Appointment Letter",
  "Passport-size Photo"
];

const OPTIONAL_DOCS = [
  "Experience Certificate",
  "Specialization Certificate",
  "Additional Certifications"
];

const DoctorRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    email: '',
    password: '',
    confirmPassword: '',
    experience: '',
    medicalRegistrationNumber: ''
  });

  const [step, setStep] = useState(1);
  const [instQuery, setInstQuery] = useState('');
  const [instSuggestions, setInstSuggestions] = useState([]);
  const [showInstDropdown, setShowInstDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [hospitalDetails, setHospitalDetails] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationVerifying, setLocationVerifying] = useState(false);
  const instDropdownRef = useRef(null);

  const [specQuery, setSpecQuery] = useState('');
  const [specSuggestions, setSpecSuggestions] = useState([]);
  const [showSpecDropdown, setShowSpecDropdown] = useState(false);
  const [focusedSpecIndex, setFocusedSpecIndex] = useState(-1);
  const specDropdownRef = useRef(null);

  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(false);
  const { theme } = useStore();
  const navigate = useNavigate();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_API_KEY",
    libraries
  });

  const highlightMatch = (text, query) => {
    if (!text) return "";
    if (!query) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <span key={i} className="text-blue-600 font-black">{part}</span>
        : part
    );
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const verifyLocation = () => {
    setLocationVerifying(true);
    if (!navigator.geolocation) {
      toast.error("Geospatial Node not supported by browser");
      setCurrentLocation({ lat: 28.6139, lng: 77.2090 });
      setLocationVerifying(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setLocationVerifying(false);
        toast.success("Current Location Synchronized");
      },
      (error) => {
        console.warn("Location Warning (falling back to default clinical node):", error);
        setCurrentLocation({ lat: 28.6139, lng: 77.2090 });
        toast.success("Synchronized default clinical node");
        setLocationVerifying(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (instDropdownRef.current && !instDropdownRef.current.contains(e.target)) setShowInstDropdown(false);
      if (specDropdownRef.current && !specDropdownRef.current.contains(e.target)) setShowSpecDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!specQuery.trim()) { setSpecSuggestions([]); return; }
    const q = specQuery.toLowerCase();
    const filtered = SPECIALIZATIONS.filter(s => s.name.toLowerCase().includes(q) || (s.sub && s.sub.toLowerCase().includes(q))).slice(0, 10);
    setSpecSuggestions(filtered);
    setFocusedSpecIndex(-1);
  }, [specQuery]);

  useEffect(() => {
    if (instQuery.length < 2) { setInstSuggestions([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await api.post('/ai/search-hospital', { query: instQuery });
        const results = Array.isArray(data) ? data : [];

        // Map backend results to the suggestion format
        const mappedResults = results.map(inst => ({
          ...inst,
          score: inst.verificationStatus === 'Verified' ? 100 : 80,
          matchType: inst.verificationStatus === 'Verified' ? "Verified Node" : "AI Neural"
        }));

        setInstSuggestions(mappedResults);
      } catch (err) {
        console.error("Institutional Search Error", err);
        setInstSuggestions([]);
      } finally {
        setIsSearching(false);
        setFocusedIndex(-1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [instQuery]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInstSelect = (inst) => {
    setInstQuery(inst.name);
    setHospitalDetails({
      placeId: inst.id || inst.uuid || 'AI-NODE-' + Date.now(),
      name: inst.name,
      address: inst.address,
      rating: inst.googleRating || inst.rating || 4.5,
      website: inst.website,
      phone: inst.phone,
      lat: inst.latitude || inst.lat,
      lng: inst.longitude || inst.lng,
      city: inst.city,
      state: inst.state,
      country: inst.country,
      postalCode: inst.postalCode,
      district: inst.district,
      type: inst.type,
      university: inst.university,
      ownership: inst.ownership,
      nmcStatus: inst.nmcApproval || inst.nmcStatus,
      nabhStatus: inst.nabhStatus,
      naacGrade: inst.naacGrade,
      hospitalId: inst.hospitalId,
      collegeId: inst.collegeId,
      verificationStatus: inst.verificationStatus || 'Verified',
      logo: inst.logo
    });
    setShowInstDropdown(false);
    toast.success(`${inst.shortName || inst.name} node synchronized.`);
    verifyLocation();
  };

  const handleSpecSelect = (spec) => {
    setSpecQuery(spec.name);
    setFormData(prev => ({ ...prev, specialization: spec.name }));
    setShowSpecDropdown(false);
    toast.success(`${spec.name} expertise locked.`);
  };

  const handleSpecKeyDown = (e) => {
    if (!showSpecDropdown || specSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedSpecIndex(prev => (prev < specSuggestions.length - 1 ? prev + 1 : prev)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedSpecIndex(prev => (prev > 0 ? prev - 1 : prev)); }
    else if (e.key === 'Enter') { if (focusedSpecIndex >= 0) { e.preventDefault(); handleSpecSelect(specSuggestions[focusedSpecIndex]); } }
    else if (e.key === 'Escape') setShowSpecDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (!showInstDropdown || instSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(prev => (prev < instSuggestions.length - 1 ? prev + 1 : prev)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev)); }
    else if (e.key === 'Enter') { if (focusedIndex >= 0) { e.preventDefault(); handleInstSelect(instSuggestions[focusedIndex]); } }
    else if (e.key === 'Escape') setShowInstDropdown(false);
  };

  const distanceToHosp = (currentLocation && hospitalDetails) ? calculateDistance(currentLocation.lat, currentLocation.lng, hospitalDetails.lat, hospitalDetails.lng) : null;
  const isLocationMatched = distanceToHosp !== null && distanceToHosp <= 5;

  const handleFileChange = (docName, file) => {
    if (file && file.size > 10 * 1024 * 1024) return toast.error("File size exceeds 10MB node limit");
    setDocuments(prev => ({ ...prev, [docName]: file }));
  };

  const removeFile = (docName) => {
    const newDocs = { ...documents };
    delete newDocs[docName];
    setDocuments(newDocs);
  };

  const handleNextStep = () => {
    if (!formData.name || !formData.email || !formData.specialization || !formData.experience || !formData.medicalRegistrationNumber) return toast.error("Identity fields mandatory");
    if (!hospitalDetails) return toast.error("Hospital node mandatory");
    if (!isLocationMatched) return toast.error("Physical presence required (within 5km)");
    setStep(2);
    window.scrollTo(0,0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) return handleNextStep();

    if (formData.password !== formData.confirmPassword) return toast.error('Security keys mismatch');
    const missingDocs = MANDATORY_DOCS.filter(doc => !documents[doc]);
    if (missingDocs.length > 0) return toast.error(`Missing: ${missingDocs.join(', ')}`);

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      data.append('hospitalDetails', JSON.stringify(hospitalDetails));
      Object.keys(documents).forEach(docName => data.append('documents', documents[docName]));
      await api.post('/auth/register/doctor', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success("Provisioning transmitted.");
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black font-sans overflow-x-hidden relative text-left">
      <div className="absolute inset-0 z-0 overflow-hidden text-left">
          <img src="/login-bg.png" alt="Background" className="w-full h-full object-cover opacity-50 scale-105" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
             <div className="relative flex items-center justify-center">
                <div className="absolute w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[140px] animate-pulse"></div>
                <div className="absolute w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[100px]"></div>
             </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black md:bg-gradient-to-r md:from-black/60 md:to-transparent z-[15]"></div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row relative z-20 overflow-y-auto custom-scrollbar">
         <div className="hidden md:flex flex-[1.3] p-12 lg:p-20 flex flex-col h-full w-full text-left">
             <div className="flex items-center gap-3 mb-16">
               <img src="/logo.png" onError={(e) => { e.currentTarget.src = '/logo.jpeg'; }} alt="Logo" className="w-12 h-12 object-contain" />
               <div className="text-left"><h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">MEDI <span className="text-blue-500 font-black">CONSULT</span></h2><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Clinical Authentication Gateway</p></div>
             </div>
             <div className="max-w-lg space-y-10">
               <div className="space-y-6">
                 <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tighter uppercase">Join Our <span className="text-blue-500">Expert</span>,<br /> Network</h1>
                 <div className="w-24 h-1.5 bg-blue-600 rounded-[20px]"></div>
                 <p className="text-base font-bold text-zinc-400 max-w-sm leading-relaxed uppercase tracking-[0.15em]">Provision your clinical node and start delivering advanced healthcare.</p>
               </div>
             </div>
         </div>

         <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-14 relative z-30">
           <div className="max-w-[620px] w-full bg-white/5 backdrop-blur-2xl p-8 lg:p-12 rounded-[20px] shadow-2xl border border-white/10 flex flex-col items-center">
              <div className="mb-8 flex justify-center">
                 <img src="/logo.png" onError={(e) => { e.currentTarget.src = '/logo.jpeg'; }} alt="Medi Consult Logo" className="w-32 sm:w-36 h-auto object-contain" />
              </div>

              <div className="text-center mb-8">
                 <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase leading-none">{step === 1 ? 'Provision Node' : 'Clinical Archives'}</h2>
                 <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 mt-2 uppercase tracking-widest">{step === 1 ? 'Step 1: Professional Identity' : 'Step 2: Security & Credentials'}</p>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-8 text-left">
                 {step === 1 ? (
                   <>
                     <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-2 text-left"><UserIcon size={14}/> Professional Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                           <div className="space-y-1 text-left"><label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Full Name</label><div className="relative mt-1 text-left"><UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" /><input name="name" placeholder="Dr. John Smith" value={formData.name} onChange={handleChange} className="w-full pl-11 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 focus:bg-white/10 font-bold text-sm text-white placeholder:text-zinc-600" required /></div></div>
                           <div className="space-y-1 text-left"><label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email Address</label><div className="relative mt-1 text-left"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" /><input name="email" type="email" placeholder="official@node.com" value={formData.email} onChange={handleChange} className="w-full pl-11 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 focus:bg-white/10 font-bold text-sm text-white placeholder:text-zinc-600" required /></div></div>
                        </div>

                        <div className="space-y-1 relative text-left" ref={specDropdownRef}>
                           <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 text-left">Specialization</label>
                           <div className="relative mt-1 text-left"><Award className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" /><input value={specQuery} onFocus={() => setShowSpecDropdown(true)} onChange={(e) => { setSpecQuery(e.target.value); setShowSpecDropdown(true); setFormData(prev => ({ ...prev, specialization: e.target.value })); }} onKeyDown={handleSpecKeyDown} placeholder="Search Expertise..." className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 focus:bg-white/10 font-bold text-sm text-white placeholder:text-zinc-600" required /></div>
                           {showSpecDropdown && specSuggestions.length > 0 && (<div className="absolute z-[110] left-0 right-0 mt-2 bg-[#0A0A0C] border border-white/10 rounded-[20px] shadow-2xl max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">{specSuggestions.map((spec, i) => (<div key={i} onClick={() => handleSpecSelect(spec)} className={`p-4 cursor-pointer border-b border-white/5 last:border-0 transition-all flex flex-col text-left ${focusedSpecIndex === i ? 'bg-white/10' : 'hover:bg-white/5'}`}><p className="text-[10px] font-black text-white uppercase tracking-tight">{highlightMatch(spec.name, specQuery)}</p><p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1 line-clamp-1">{spec.sub}</p></div>))}</div>)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                           <div className="space-y-1 text-left"><label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Total Experience</label><div className="relative mt-1 text-left"><Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" /><input name="experience" type="number" placeholder="Years" value={formData.experience} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 focus:bg-white/10 font-bold text-sm text-white placeholder:text-zinc-600" required /></div></div>
                           <div className="space-y-1 text-left"><label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Medical Reg Num</label><div className="relative mt-1 text-left"><ShieldCheckIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" /><input name="medicalRegistrationNumber" placeholder="KMC-xxxxx" value={formData.medicalRegistrationNumber} onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 focus:bg-white/10 font-bold text-sm text-white placeholder:text-zinc-600" required /></div></div>
                        </div>
                     </div>

                     <div className="space-y-4 relative text-left" ref={instDropdownRef}>
                        <div className="flex items-center justify-between text-left"><h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-2 text-left"><Building size={14}/> Institutional Node</h3><div className="flex items-center gap-2 text-left"><div className={`w-2 h-2 rounded-full ${currentLocation ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div><span className={`text-[8px] font-black uppercase tracking-widest ${currentLocation ? 'text-emerald-500' : 'text-zinc-500'}`}>{currentLocation ? 'GPS Active' : 'GPS Offline'}</span></div></div>
                        {!currentLocation && (<button type="button" onClick={verifyLocation} disabled={locationVerifying} className="w-full p-4 bg-white/5 border border-dashed border-white/10 rounded-[20px] flex items-center justify-center gap-3 hover:bg-white/10 transition-all">{locationVerifying ? <Loader2 size={16} className="animate-spin text-blue-500" /> : <MapPin size={16} />}<span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Verify Physical Presence</span></button>)}
                        <div className="relative group text-left">
                           <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 block mb-2 text-left">Search Institution</label>
                           <div className="relative text-left"><SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" /><input value={instQuery} onFocus={() => { setShowInstDropdown(true); if (!currentLocation && !locationVerifying) verifyLocation(); }} onKeyDown={handleKeyDown} onChange={(e) => { setInstQuery(e.target.value); setShowInstDropdown(true); }} placeholder="E.g. Apollo, Narayana..." className="w-full pl-11 pr-12 py-4 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 focus:bg-white/10 font-black text-xs uppercase tracking-widest shadow-inner transition-all text-white" />{isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />}</div>
                        </div>
                        {showInstDropdown && (instSuggestions.length > 0 || instQuery.length >= 2) && !isSearching && (<div className="absolute z-[100] left-0 right-0 mt-2 bg-[#0A0A0C] border border-white/10 rounded-[20px] shadow-2xl max-h-[300px] overflow-y-auto custom-scrollbar">{instSuggestions.map((inst, i) => (<div key={i} onClick={() => handleInstSelect(inst)} className={`p-4 cursor-pointer border-b border-white/5 last:border-0 transition-all flex gap-4 text-left ${focusedIndex === i ? 'bg-white/10' : 'hover:bg-white/5'}`}><div className={`w-10 h-10 rounded-[20px] border flex items-center justify-center ${focusedIndex === i ? 'bg-blue-600 text-white' : 'bg-white/5 text-blue-500'}`}><Building size={18} /></div><div className="flex-1 overflow-hidden text-left"><h4 className="text-sm font-black text-white uppercase">{highlightMatch(inst.name, instQuery)}</h4><p className="text-[9px] font-black text-blue-400 uppercase">{inst.type}</p><p className="text-[8px] font-bold text-zinc-500 uppercase flex items-center gap-1"><MapPin size={8}/> {inst.city}</p></div></div>))}</div>)}
                        {hospitalDetails && (
                          <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-[20px] space-y-4 text-left relative overflow-hidden">
                             <div className="flex justify-between items-start relative z-10 text-left"><div><h4 className="text-xs font-black text-white uppercase">{hospitalDetails.name}</h4><p className="text-[8px] font-bold text-zinc-500 uppercase flex items-center gap-1 mt-1"><MapPin size={8}/> {hospitalDetails.address}</p></div><button type="button" onClick={() => {setHospitalDetails(null); setInstQuery('');}} className="p-1.5 bg-white/5 rounded-[20px] border border-white/10 text-zinc-400 hover:text-red-400"><X size={14}/></button></div>
                             <div className={`p-3 rounded-[20px] border flex items-center justify-between ${isLocationMatched ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}><div className="flex items-center gap-2 text-left"><div className={`w-6 h-6 rounded-[20px] flex items-center justify-center ${isLocationMatched ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}><MapPin size={12} /></div><div><p className="text-[7px] font-black text-zinc-400 uppercase">Geospatial Link</p><p className={`text-[9px] font-black uppercase ${isLocationMatched ? 'text-emerald-400' : 'text-rose-400'}`}>{currentLocation ? `Distance: ${distanceToHosp?.toFixed(2)} km` : 'Waiting for GPS...'}</p></div></div><button type="button" onClick={verifyLocation} className="text-[7px] font-black uppercase bg-white/5 px-2.5 py-1 rounded-[20px] border border-white/10 text-blue-400">Re-Sync</button></div>
                          </div>
                        )}
                     </div>

                     <button type="button" onClick={handleNextStep} className={`w-full py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 mt-4 ${isLocationMatched ? 'bg-blue-600 text-white shadow-blue-500/25 shadow-xl' : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/5'}`}>Initialize Phase 2 <ArrowRight size={18}/></button>
                   </>
                 ) : (
                   <>
                     <div className="space-y-4 text-left">
                        <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-2 text-left"><Lock size={14}/> Security Schema</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                           <div className="space-y-1 text-left"><label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 text-left">Encryption Key</label><div className="relative mt-1 text-left"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" /><input name="password" type="password" placeholder="••••••••" onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 font-bold text-sm text-white" required /></div></div>
                           <div className="space-y-1 text-left"><label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1 text-left">Confirm Key</label><div className="relative mt-1 text-left"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" /><input name="confirmPassword" type="password" placeholder="••••••••" onChange={handleChange} className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-[20px] outline-none focus:border-blue-500 font-bold text-sm text-white" required /></div></div>
                        </div>
                     </div>

                     <div className="space-y-6 text-left">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2 text-left"><h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] flex items-center gap-2 text-left"><FileText size={14}/> Verification Archives</h3><span className="text-[8px] font-black text-zinc-600 uppercase">Max 10MB per file</span></div>
                        <div className="space-y-6 text-left">
                           <div className="space-y-4 text-left">
                              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 text-left"><Shield size={10} className="text-blue-500"/> Mandatory Protocol</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                                 {MANDATORY_DOCS.map(doc => (
                                    <div key={doc} className="relative text-left">{documents[doc] ? (<div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[20px] animate-in fade-in zoom-in-95 text-left"><div className="flex items-center gap-3 overflow-hidden text-left"><FileText className="text-emerald-400 shrink-0" size={16} /><p className="text-[9px] font-black uppercase text-emerald-400 truncate">{doc}</p></div><button type="button" onClick={() => removeFile(doc)} className="p-2 hover:bg-emerald-500/20 rounded-[20px]"><Trash2 size={12} className="text-emerald-400"/></button></div>) : (<label className="flex items-center gap-3 p-4 bg-white/5 border-2 border-dashed border-white/10 rounded-[20px] cursor-pointer hover:border-blue-500/50 hover:bg-white/10 transition-all group text-left"><Upload size={16} className="text-zinc-600 group-hover:text-blue-500" /><span className="text-[9px] font-black uppercase text-zinc-500 group-hover:text-blue-400 truncate">{doc}</span><input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(doc, e.target.files[0])} /></label>)}</div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="flex gap-4 mt-10 text-left">
                        <button type="button" onClick={() => setStep(1)} className="px-6 py-4 border border-white/10 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2 text-white"><ChevronLeft size={18}/> Back</button>
                        <button type="submit" disabled={loading} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[20px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-3">{loading ? <Loader2 className="animate-spin" /> : <ShieldCheckIcon size={20}/>}{loading ? 'Transmitting...' : 'Initialize Provisioning'}</button>
                     </div>
                   </>
                 )}
              </form>

              <p className="mt-12 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Already have an active node? <Link to="/" className="text-blue-400 font-black hover:underline ml-1">Sign in terminal</Link></p>
           </div>
         </div>
      </div>

      <div className="bg-zinc-950/50 backdrop-blur-xl border-t border-white/5 py-8 px-6 lg:px-20 z-30 relative shrink-0 text-left">
         <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
            {[
               { icon: ShieldCheckIcon, label: '256-bit', sub: 'Data Encryption', color: 'text-blue-500', bg: 'bg-blue-500/10' },
               { icon: Users, label: '10K+', sub: 'Happy Users', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
               { icon: Globe, label: '500+', sub: 'Hospitals', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
               { icon: Headphones, label: '24/7', sub: 'Support', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
            ].map((s, i) => (
               <div key={i} className="flex items-center gap-4 text-left">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shrink-0 shadow-sm border border-white/5`}><s.icon size={20} /></div>
                  <div className="text-left"><p className="text-base font-black text-white leading-none">{s.label}</p><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">{s.sub}</p></div>
               </div>
            ))}
         </div>
      </div>

    </div>
  );
};

export default DoctorRegister;
